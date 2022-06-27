import $ = require("jquery");
import { Renderer } from "../Renderer"
import { Settings, paper } from "../Settings"
import { settingsManager } from "../SettingsManager"
import { GUI, Controller } from "../GUI"
import { Communication } from "../Communication/CommunicationStatic"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"
import { Command } from "../Communication/Interpreter"

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
	undoRedoButtons = false
	mustClearCommandQueueOnMouseUp = false

	axes: paper.Group

	drawing: paper.Group
	currentDrawing: paper.Group

	currentLine: paper.Path

	drawArea: paper.Path
	canvasJ: any
	divJ: any
	footerJ: any
	undoButtonJ: any
	redoButtonJ: any
	project: paper.Project

	constructor() {


		document.body.addEventListener('mousedown', (event)=> this.onMouseDown(event))
		document.body.addEventListener('mousemove', (event)=> this.onMouseMove(event))
		document.body.addEventListener('mouseup', (event)=> this.onMouseUp(event))
		document.body.addEventListener('mouseleave', (event)=> this.onMouseLeave(event))
		document.body.addEventListener('keydown', (event)=> this.onKeyDown(event))
		document.body.addEventListener('keyup', (event)=> this.onKeyUp(event))
		window.addEventListener( 'resize', (event)=> this.windowResize(event))
		document.addEventListener('QueueCommand', (event: CustomEvent)=> this.queueCommand(event.detail), false)
		document.addEventListener('SendCommand', (event: CustomEvent)=> this.sendCommand(event.detail), false)
		document.addEventListener('CommandExecuted', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
		document.addEventListener('ClearQueue', (event: CustomEvent)=> this.clearQueue(), false)

		this.mode = '4 Symmetries'
		this.nRepetitions = 1
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
		liveDrawingGui.add(this, 'undoRedoButtons').name('Display buttons')

		liveDrawingGui.add({ 'Mode': this.mode }, 'Mode', <any>['None', '2 Symmetries', '4 Symmetries', 'N. Repetitions']).onFinishChange((value: string)=> this.renderAxes(value))
		liveDrawingGui.addSlider('N. Repetitions', 1, 1, 10, 1).onChange((value)=> {
			this.nRepetitions =  value
			this.renderAxes(this.mode)
		})
		liveDrawingGui.addButton('Clear drawing', (value)=> this.clearDrawing())
		liveDrawingGui.addButton('Undo', (value)=> this.undo())
		liveDrawingGui.addButton('Redo', (value)=> this.redo())
		liveDrawingGui.addButton('Export SVG', (value)=> this.exportSVG())
	}

	clearDrawing() {
		this.drawing.removeChildren()
	}

	exportSVG() {
        let svg: any = this.project.exportSVG( { asString: true })

        // create an svg image, create a link to download the image, and click it
        let blob = new Blob([svg], {type: 'image/svg+xml'})
        let url = URL.createObjectURL(blob)
        let link = document.createElement("a")
        document.body.appendChild(link)
        link.download = 'result.svg'
        link.href = url
        link.click()
        document.body.removeChild(link)
	}

	renderAxes(mode: string) {
		this.mode = mode
		this.axes.removeChildren()
		let bounds = Tipibot.tipibot.drawArea.bounds
		if(mode == 'None') {

		} else if(mode == '2 Symmetries' || mode == '4 Symmetries') {
			let v = new paper.Path()
			v.strokeColor = new paper.Color('black')
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
				v.strokeColor = new paper.Color('black')
				v.strokeWidth = 1
				v.dashArray = [5, 5]
				let center = bounds.center
				v.add(center)
				v.add(bounds.bottomCenter.rotate(i * 360 / this.nRepetitions, center))
				this.axes.addChild(v)
			}
		}
	}
	
	windowResize(event: Event = null){

		if(this.canvasJ == null) {
			return
		}

		let width = window.innerWidth
		let height = window.innerHeight
		this.canvasJ.width(width)
		this.canvasJ.height(height)
		paper.project.view.viewSize = new paper.Size(width, height)
		this.renderer.centerOnTipibot(this.drawArea.bounds, true, this.canvasJ.get(0))
		this.project.view.center = this.drawArea.bounds.center
	}

	startLiveDrawing() {
		// settingsManager.settingsFolder.getController('disableMouseInteractions').setValue(true)
		settingsManager.settingsFolder.getController('disableCommandList').setValue(true)

		if(this.canvasJ == null) {
			this.divJ = $('<div>')

			this.canvasJ = $('<canvas>')
			let zIndex = 1000000
			this.canvasJ.css({position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 'z-index': zIndex++, width: window.innerWidth, height: window.innerHeight, background: 'white'})
			this.divJ.append(this.canvasJ)

			this.footerJ = $('<div>').css({position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', 'flex-direction': 'row', 'justify-content': 'center', 'z-index': zIndex++})

			let buttonCss = {
				width: '200px',
				height: '40px',
				'margin-bottom': '20px',
				'user-select': 'none'
			}
			this.undoButtonJ = $('<button>').html('&#8592;').css(buttonCss).click(()=> this.left())
			this.redoButtonJ = $('<button>').html('&#8594;').css(buttonCss).click(()=> this.right())

			this.footerJ.append(this.undoButtonJ)
			this.footerJ.append(this.redoButtonJ)
			this.divJ.append(this.footerJ)

			$('body').append(this.divJ)
			this.project = new paper.Project(this.canvasJ.get(0))
			this.project.activate()

			this.axes = new paper.Group()
			this.drawing = new paper.Group()
			this.currentDrawing = new paper.Group()

			this.drawArea = new paper.Path.Rectangle(Tipibot.tipibot.drawArea.bounds)
			this.drawArea.strokeColor = new paper.Color('black')
			this.drawArea.strokeWidth = 1

			if(!this.undoRedoButtons) {
				this.undoButtonJ.hide()
				this.redoButtonJ.hide()
			}

			this.windowResize()
			
		} else {
			this.divJ.show()
			this.project.activate()
			
			if(this.undoRedoButtons) {
				this.undoButtonJ.show()
				this.redoButtonJ.show()
			} else {
				this.undoButtonJ.hide()
				this.redoButtonJ.hide()
			}
		}

		this.renderAxes(this.mode)

		Tipibot.tipibot.ignoreKeyEvents = true
		this.renderer.ignoreWindowResize = true
	}

	stopLiveDrawing() {
		this.divJ.hide()
		paper.projects[0].activate()
		this.axes.removeChildren()

		Tipibot.tipibot.ignoreKeyEvents = false
		this.renderer.ignoreWindowResize = false
		this.renderer.windowResize()
	}

	toggleLiveDrawing() {

		this.liveDrawing = !this.liveDrawing
		this.toggleLiveDrawingButton.setName(this.liveDrawing ? 'Stop' : 'Start')
		
		if(this.liveDrawing) {
			this.startLiveDrawing()
		} else {
			this.stopLiveDrawing()
		}

	}

	createNewCommandQueue() {
		let commandQueue = {commands: new Array(), paths: new Array()}
		this.commandQueues.push(commandQueue)
		return commandQueue
	}
	
	eventWasOnGUI(event: MouseEvent) {
		return $.contains(document.getElementById('gui'), <any>event.target) || $.contains(document.getElementById('info'), <any>event.target) || $.contains(this.footerJ.get(0), <any>event.target)
	}

	onMouseDown(event: MouseEvent) {
		if(!this.liveDrawing || this.eventWasOnGUI(event)) {
			return
		}
		let point = this.renderer.getWorldPosition(event)
		if(!Tipibot.tipibot.drawArea.bounds.contains(point)) {
			return
		}

		this.mouseDown = true

		let commandQueue = this.undoRedo ? this.createNewCommandQueue() : null

		this.currentLine = new paper.Path()
		this.currentLine.strokeWidth = Settings.tipibot.penWidth
		this.currentLine.strokeColor = new paper.Color('green')
		this.currentLine.add(point)

		if(this.undoRedo) {

			this.undoneCommandQueues = []
			
			Tipibot.tipibot.moveDirect(point)

			Tipibot.tipibot.penDown()

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
			if(!Tipibot.tipibot.drawArea.bounds.contains(point) || (this.undoRedo && point.getDistance(this.currentLine.lastSegment.point) < 15)) {
				return
			}
			
			if(this.undoRedo) {
				Tipibot.tipibot.moveLinear(point)
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
		lines.strokeColor = new paper.Color('black')
	}
	
	penUp(lines: paper.Path) {
		Tipibot.tipibot.penUp(undefined, undefined, undefined, ()=> this.pathDrawn(lines))
	}

	drawLines(lines: paper.Path) {

		Tipibot.tipibot.penUp()
		Tipibot.tipibot.moveDirect(lines.firstSegment.point)
		Tipibot.tipibot.penDown()
		for(let segment of lines.segments) {
			Tipibot.tipibot.moveLinear(segment.point)
		}
		this.penUp(lines)
	}

	onMouseUp(event: MouseEvent) {
		if(!this.liveDrawing || this.eventWasOnGUI(event)) {
			return
		}

		let point = this.renderer.getWorldPosition(event)
		if(!Tipibot.tipibot.drawArea.bounds.contains(point)) {
			return
		}
		
		if(this.undoRedo) {
			Tipibot.tipibot.moveLinear(point)
		}

		this.currentLine.add(point)

		this.mouseDown = false

		if(this.undoRedo) {
			this.penUp(this.currentLine)
		} else {
			this.currentLine.simplify()
			this.currentLine.flatten(4.25)
			// this.currentLine.selected = true
		}

		let commandQueue = this.commandQueues[this.commandQueues.length-1]

		if(this.mode == 'None') {

		} else if(this.mode == '2 Symmetries' || this.mode == '4 Symmetries') {
			// let definition = new (<any>paper).SymbolDefinition(this.currentLine)

			// let instance = definition.place()
			let instance = <paper.Path>this.currentLine.clone()
			instance.pivot = Tipibot.tipibot.drawArea.bounds.center
			instance.scaling.y = -1
			this.addLines(instance, commandQueue)

			instance = <paper.Path>this.currentLine.clone() // definition.place()
			instance.pivot = Tipibot.tipibot.drawArea.bounds.center
			instance.scaling.x = -1
			this.addLines(instance, commandQueue)

			instance = <paper.Path>this.currentLine.clone() // definition.place()
			instance.pivot = Tipibot.tipibot.drawArea.bounds.center
			instance.scaling.x = -1
			instance.scaling.y = -1
			this.addLines(instance, commandQueue)

			if(this.mode == '4 Symmetries') {

				let instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = Tipibot.tipibot.drawArea.bounds.center
				instance.rotate(90)
				this.addLines(instance, commandQueue)

				instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = Tipibot.tipibot.drawArea.bounds.center
				instance.rotate(90)
				instance.scaling.x = -1
				this.addLines(instance, commandQueue)

				instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = Tipibot.tipibot.drawArea.bounds.center
				instance.rotate(90)
				instance.scaling.y = -1
				this.addLines(instance, commandQueue)

				instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = Tipibot.tipibot.drawArea.bounds.center
				instance.rotate(90)
				instance.scaling.x = -1
				instance.scaling.y = -1
				this.addLines(instance, commandQueue)
			}
		} else if(this.mode == 'N. Repetitions') {
			//let definition = new (<any>paper).SymbolDefinition(this.currentLine)

			for(let i=1 ; i<this.nRepetitions ; i++) {
				let instance = <paper.Path>this.currentLine.clone() // definition.place()
				instance.pivot = Tipibot.tipibot.drawArea.bounds.center
				instance.rotate(i * 360 / this.nRepetitions)
				this.addLines(instance, commandQueue)
			}
		}

		if(this.mustClearCommandQueueOnMouseUp && this.commandQueues.length == 1) {
			this.mustClearCommandQueueOnMouseUp = false
			for(let path of this.commandQueues[0].paths) {
				path.strokeColor = new paper.Color('blue')
			}
			this.commandQueues = []
			this.createNewCommandQueue()
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
				this.left()
				break;
			case 39: 			// right arrow
				this.right()
				break;
			case 27: 			// Escape
				this.toggleLiveDrawing()
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
				Communication.interpreter.removeCommand(command.id)
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
				Communication.interpreter.queue(command.data, command.message, command.callback)
			}
			for(let path of commandQueue.paths) {
				this.drawing.addChild(path)
				this.commandQueues[this.commandQueues.length-1].paths.push(path)
			}
		}
	}

	left() {
		if(this.undoRedo) {
			this.undo()
		} else {
			this.currentDrawing.removeChildren()
		}
	}

	right() {
		if(this.undoRedo) {
			this.redo()
		} else {
			for(let child of this.currentDrawing.children.slice()) {
				child.strokeColor = new paper.Color('black')
				this.drawing.addChild(child)
				this.drawLines(<paper.Path>child)
			}
			this.currentDrawing.removeChildren()
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
					console.log('SEND')
					let index = this.commandQueues.findIndex((cq)=> cq == commandQueue)
					if(index >= 0 && !(this.mouseDown && this.commandQueues.length == 1)) {
						this.commandQueues.splice(index, 1)
					} else if(index >= 0 && this.mouseDown && this.commandQueues.length == 1) {
						this.mustClearCommandQueueOnMouseUp = true
					}
					if(this.commandQueues.length <= 0) {
						this.createNewCommandQueue()
					}

					for(let path of commandQueue.paths) {
						path.strokeColor = new paper.Color('blue')
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