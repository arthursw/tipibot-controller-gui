import { Renderer } from "../Renderer"
import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { SVGPlot } from "../Plot"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { tipibot } from "../Tipibot"
import { Interpreter, Command } from "../Communication/Interpreter"

export class LiveDrawing {
	
	toggleLiveDrawingButton: Controller
	liveDrawing: boolean = false
	mouseDown: boolean = false
	renderer: Renderer

	commandQueues: Array<{commands: Array<Command>, paths: Array<paper.Path>}>
	undoneCommandQueues: Array<{commands: Array<Command>, paths: Array<paper.Path>}>

	mode: string
	nRepetitions: number
	undoRedo = true

	axes: paper.Group

	drawing: paper.Group
	currentDrawing: paper.Group

	currentLine: paper.Path
	undoButton: paper.Path
	redoButton: paper.Path

	constructor() {


		document.body.addEventListener('mousedown', (event)=> this.onMouseDown(event))
		document.body.addEventListener('mousemove', (event)=> this.onMouseMove(event))
		document.body.addEventListener('mouseup', (event)=> this.onMouseUp(event))
		document.body.addEventListener('mouseleave', (event)=> this.onMouseLeave(event))
		document.body.addEventListener('keydown', (event)=> this.onKeyDown(event))
		document.body.addEventListener('keyup', (event)=> this.onKeyUp(event))
		document.addEventListener('QueueCommand', (event: CustomEvent)=> this.queueCommand(event.detail), false)
		document.addEventListener('SendCommand', (event: CustomEvent)=> this.sendCommand(event.detail), false)
		document.addEventListener('CommandExecuted', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
		document.addEventListener('ClearQueue', (event: CustomEvent)=> this.clearQueue(), false)

		// this.undoButton = new paper.Path.Rectangle(tipibot.drawArea.bounds.left, tipibot.drawArea.bounds.bottom, Settings.drawArea.width / 2, 30)

		this.mode = '4 Symmetries'
		this.nRepetitions = 1
		this.axes = new paper.Group()
		this.drawing = new paper.Group()
		this.currentDrawing = new paper.Group()
		this.commandQueues = []
		this.undoneCommandQueues = []

	}

	setRenderer(renderer: Renderer) {
		this.renderer = renderer
	}

	createGUI(gui: GUI) {
		let liveDrawingGui = gui.addFolder('Live drawing')
		this.toggleLiveDrawingButton = liveDrawingGui.addButton('Start', (value)=> this.toggleLiveDrawing())
		
		liveDrawingGui.add(this, 'undoRedo').name('Undo / Redo')

		liveDrawingGui.add({ 'Mode': this.mode }, 'Mode', <any>['None', '2 Symmetries', '4 Symmetries', 'N. Repetitions']).onFinishChange((value: string)=> this.renderAxes(value))
		liveDrawingGui.addSlider('N. Repetitions', 1, 1, 10, 1).onChange((value)=> {
			this.nRepetitions =  value
			this.renderAxes(this.mode)
		})
		liveDrawingGui.addButton('Clear drawing', (value)=> this.clearDrawing())
		liveDrawingGui.addButton('Undo', (value)=> this.undo())
		liveDrawingGui.addButton('Redo', (value)=> this.redo())
	}

	clearDrawing() {
		this.drawing.removeChildren()
	}

	renderAxes(mode: string) {
		this.mode = mode
		this.axes.removeChildren()
		let bounds = tipibot.drawArea.bounds
		if(mode == 'None') {

		} else if(mode == '2 Symmetries' || mode == '4 Symmetries') {
			let v = new paper.Path()
			v.strokeColor = 'black'
			v.strokeWidth = 1
			v.dashArray = [5, 5]
			v.add(bounds.topCenter)
			v.add(bounds.bottomCenter)
			this.axes.addChild(v)
			let h = <paper.Path> v.clone()
			h.firstSegment.point = bounds.leftCenter
			h.lastSegment.point = bounds.rightCenter
			// h.rotate(90)
			this.axes.addChild(h)
			if(mode == '4 Symmetries') {
				let d1 = <paper.Path> v.clone()
				d1.firstSegment.point.x -= bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2
				d1.lastSegment.point.x += bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2
				this.axes.addChild(d1)
				let d2 = <paper.Path> v.clone()
				d2.firstSegment.point.x += bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2
				d2.lastSegment.point.x -= bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2
				this.axes.addChild(d2)
			}
		} else if(mode == 'N. Repetitions') {
			for(let i=0 ; i<this.nRepetitions ; i++) {
				let v = new paper.Path()
				v.strokeColor = 'black'
				v.strokeWidth = 1
				v.dashArray = [5, 5]
				let center = bounds.center
				v.add(center)
				v.add(bounds.bottomCenter.rotate(i * 360 / this.nRepetitions, center))
				this.axes.addChild(v)
			}
		}
	}

	toggleLiveDrawing() {

		this.liveDrawing = !this.liveDrawing
		
		if(this.liveDrawing) {
			settingsManager.settingsFolder.getController('disableMouseInteractions').setValue(true)
			settingsManager.settingsFolder.getController('disableCommandList').setValue(true)
		}

		this.toggleLiveDrawingButton.setName(this.liveDrawing ? 'Stop' : 'Start')
		this.renderAxes(this.mode)
	}

	createNewCommandQueue() {
		let commandQueue = {commands: new Array(), paths: new Array()}
		this.commandQueues.push(commandQueue)
		return commandQueue
	}
	
	eventWasOnGUI(event: MouseEvent) {
		return $.contains(document.getElementById('gui'), <any>event.target) || $.contains(document.getElementById('info'), <any>event.target)
	}

	onMouseDown(event: MouseEvent) {
		if(!this.liveDrawing || this.eventWasOnGUI(event)) {
			return
		}
		let point = this.renderer.getWorldPosition(event)
		if(!tipibot.drawArea.bounds.contains(point)) {
			return
		}

		this.mouseDown = true

		this.currentLine = new paper.Path()
		this.currentLine.strokeWidth = Settings.tipibot.penWidth
		this.currentLine.strokeColor = 'green'
		this.currentLine.add(point)

		if(this.undoRedo) {

			let commandQueue = this.createNewCommandQueue()
			this.undoneCommandQueues = []
			
			tipibot.moveDirect(point)

			tipibot.penDown()

			this.drawing.addChild(this.currentLine)

			commandQueue.paths.push(this.currentLine)
		} else {
			this.currentDrawing.addChild(this.currentLine)
		}
	}

	onMouseMove(event: MouseEvent) {
		if(!this.liveDrawing || this.eventWasOnGUI(event)) {
			return
		}
		if(this.mouseDown) {
			let point = this.renderer.getWorldPosition(event)
			if(!tipibot.drawArea.bounds.contains(point)) {
				return
			}
			
			if(this.undoRedo) {
				tipibot.moveLinear(point)
			}

			this.currentLine.add(point)
		}
	}

	addLines(lines: paper.Path, commandQueue: {paths: Array<paper.Path>, commands: Array<Command>}) {
		if(this.undoRedo) {
			this.drawing.addChild(lines)
			this.drawLines(lines)
			commandQueue.paths.push(lines)
		} else {
			this.currentDrawing.addChild(lines)
		}
	}

	pathDrawn(lines: paper.Path) {
		lines.strokeColor = 'black'
	}
	
	penUp(lines: paper.Path) {
		tipibot.penUp(undefined, undefined, undefined, ()=> this.pathDrawn(lines))
	}

	drawLines(lines: paper.Path) {

		tipibot.penUp()
		tipibot.moveDirect(lines.firstSegment.point)
		tipibot.penDown()
		for(let segment of lines.segments) {
			tipibot.moveLinear(segment.point)
		}
		this.penUp(lines)
	}

	onMouseUp(event: MouseEvent) {
		if(!this.liveDrawing || this.eventWasOnGUI(event)) {
			return
		}

		this.mouseDown = false

		if(this.undoRedo) {
			this.penUp(this.currentLine)
		}

		let commandQueue = this.commandQueues[this.commandQueues.length-1]

		if(this.mode == 'None') {

		} else if(this.mode == '2 Symmetries' || this.mode == '4 Symmetries') {
			// let definition = new (<any>paper).SymbolDefinition(this.currentLine)

			// let instance = definition.place()
			let instance = <paper.Path>this.currentLine.clone()
			instance.pivot = tipibot.drawArea.bounds.center
			instance.scaling.y = -1
			this.addLines(instance, commandQueue)

			instance = <paper.Path>this.currentLine.clone() // definition.place()
			instance.pivot = tipibot.drawArea.bounds.center
			instance.scaling.x = -1
			this.addLines(instance, commandQueue)

			instance = <paper.Path>this.currentLine.clone() // definition.place()
			instance.pivot = tipibot.drawArea.bounds.center
			instance.scaling.x = -1
			instance.scaling.y = -1
			this.addLines(instance, commandQueue)

			if(this.mode == '4 Symmetries') {

				let instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = tipibot.drawArea.bounds.center
				instance.rotate(90)
				this.addLines(instance, commandQueue)

				instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = tipibot.drawArea.bounds.center
				instance.rotate(90)
				instance.scaling.x = -1
				this.addLines(instance, commandQueue)

				instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = tipibot.drawArea.bounds.center
				instance.rotate(90)
				instance.scaling.y = -1
				this.addLines(instance, commandQueue)

				instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = tipibot.drawArea.bounds.center
				instance.rotate(90)
				instance.scaling.x = -1
				instance.scaling.y = -1
				this.addLines(instance, commandQueue)
			}
		} else if(this.mode == 'N. Repetitions') {
			//let definition = new (<any>paper).SymbolDefinition(this.currentLine)

			for(let i=1 ; i<this.nRepetitions ; i++) {
				let instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = tipibot.drawArea.bounds.center
				instance.rotate(i * 360 / this.nRepetitions)
				this.addLines(instance, commandQueue)
			}
		}
	}

	onMouseLeave(event: MouseEvent) {
		if(!this.liveDrawing) {
			return
		}
	}

	onKeyDown(event: KeyboardEvent) {
		if(!this.liveDrawing) {
			return
		}
		switch (event.keyCode) {
			case 37: 			// left arrow
				if(this.undoRedo) {
					this.undo()
				} else {
					this.currentDrawing.removeChildren()
				}
				break;
			case 39: 			// right arrow
				if(this.undoRedo) {
					this.redo()
				} else {
					for(let child of this.currentDrawing.children.slice()) {
						child.strokeColor = 'black'
						this.drawing.addChild(child)
						this.drawLines(<paper.Path>child)
					}
					this.currentDrawing.removeChildren()
				}
				break;
			
			default:
				break;
		}
	}

	onKeyUp(event: KeyboardEvent) {
		if(!this.liveDrawing) {
			return
		}
	}

	undo() {
		if(!this.liveDrawing) {
			return
		}
		let commandQueue = this.commandQueues.pop()
		
		if(commandQueue != null) {
			this.undoneCommandQueues.push(commandQueue)

			for(let command of commandQueue.commands) {
				communication.interpreter.removeCommand(command.id)
				document.dispatchEvent(new CustomEvent('CancelCommand', { detail: command }))
			}
			for(let path of commandQueue.paths) {
				path.remove()
			}
		}
	}

	redo() {
		if(!this.liveDrawing) {
			return
		}

		let commandQueue = this.undoneCommandQueues.pop()
		
		if(commandQueue != null) {
			this.createNewCommandQueue()
			
			for(let command of commandQueue.commands) {
				communication.interpreter.queue(command.data, command.message, command.callback)
			}
			for(let path of commandQueue.paths) {
				this.drawing.addChild(path)
				this.commandQueues[this.commandQueues.length-1].paths.push(path)
			}
		}
	}


	removeCommand(commandQueue: Array<Command>, commandID: number) {
		let index = commandQueue.findIndex((command)=> command.id == commandID)
		if(index >= 0) {
			commandQueue.splice(index, 1)
		}
	}

	removeCommandFromQueues(commandID: number) {
		for(let commandQueue of this.commandQueues) {
			for(let command of commandQueue.commands) {
				if(command.id == commandID) {
					this.removeCommand(commandQueue.commands, commandID)
				}
			}
		}
	}

	queueCommand(command: Command) {
		if(!this.liveDrawing || !this.undoRedo) {
			return
		}
		this.commandQueues[this.commandQueues.length-1].commands.push(command)
	}

	sendCommand(command: Command) {
		if(!this.liveDrawing || !this.undoRedo) {
			return
		}

		for(let commandQueue of this.commandQueues) {
			for(let c of commandQueue.commands) {
				if(command == c) {

					let index = this.commandQueues.findIndex((cq)=> cq == commandQueue)
					if(index >= 0) {
						this.commandQueues.splice(index, 1)
					}
					if(this.commandQueues.length <= 0) {
						this.createNewCommandQueue()
					}

					for(let path of commandQueue.paths) {
						path.strokeColor = 'blue'
					}

					return
				}
			}
		}
	}

	commandExecuted(command: Command) {
		if(!this.liveDrawing || !this.undoRedo) {
			return
		}
		this.removeCommandFromQueues(command.id)
	}


	clearQueue() {
		if(!this.liveDrawing) {
			return
		}
		this.commandQueues = []
		this.undoneCommandQueues = []
	}
}