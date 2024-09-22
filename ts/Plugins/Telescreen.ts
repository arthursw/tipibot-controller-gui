import $ = require("jquery");
import { Settings, paper } from "../Settings"
import { GUI, Controller } from "../GUI"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"
import { Communication } from "../Communication/CommunicationStatic"
import { Renderer } from "../Renderer"
import { PenState } from "../Pen";

class Move {
	
	telescreen: Telescreen
	timeoutID: NodeJS.Timeout = null

	
	constructor(telescreen: Telescreen) {
		this.telescreen = telescreen
	}

	// moveTipibot(moveType: string) {
	// 	this.timeoutID = null
	// 	if(moveType == 'linear') {
	// 		Tipibot.tipibot.moveLinear(this.telescreen.position)
	// 	} else if(moveType == 'direct') {
	// 		Tipibot.tipibot.moveDirect(this.telescreen.position)
	// 	}
	// }

	// moveTipibotDeferred(moveType: string) {
	// 	this.clearTimeout()
	// 	this.timeoutID = setTimeout(()=> this.moveTipibot(moveType), 0)
	// }

	// clearTimeout() {
	// 	if(this.timeoutID != null) {
	// 		clearTimeout(this.timeoutID)
	// 		this.timeoutID = null
	// 	}
	// }

	button1cw(): void {}
	button1ccw(): void {}
	button2cw(): void {}
	button2ccw(): void {}
	update(): void {}
}

class OrthographicMove extends Move {
	
	button1cw() {
		this.telescreen.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.telescreen.speed, 0)))
	}

	button1ccw() {
		this.telescreen.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(-this.telescreen.speed, 0)))
	}

	button2cw() {
		this.telescreen.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.telescreen.speed)))
	}

	button2ccw() {
		this.telescreen.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, -this.telescreen.speed)))
	}
}

class PolarMove extends Move {
	
	button1cw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.x += this.telescreen.speed
		this.telescreen.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}

	button1ccw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.x -= this.telescreen.speed
		this.telescreen.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}

	button2cw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.y += this.telescreen.speed
		this.telescreen.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}

	button2ccw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.y -= this.telescreen.speed
		this.telescreen.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}
}

class DirectionMove extends Move {

	acceleration = 0.3
	speed = 0
	direction = new paper.Point(1, 0)

	button1cw() {
		this.direction.angle += 360/30
	}

	button1ccw() {
		this.direction.angle -= 360/30
	}

	button2cw() {
		// this.telescreen.moveLinear(Tipibot.tipibot.getPosition().add(this.direction.multiply(this.telescreen.speed)))
		this.speed = Math.min(5, this.speed + this.acceleration)
	}

	button2ccw() {
		// this.telescreen.moveLinear(Tipibot.tipibot.getPosition().subtract(this.direction.multiply(this.telescreen.speed)))
		this.speed = Math.max(0, this.speed - this.acceleration)
	}

	update(): void {
		if(this.speed > 0 && Communication.interpreter.commandQueue.length < 2) {
			this.telescreen.moveLinear(Tipibot.tipibot.getPosition().add(this.direction.multiply(this.speed)))
		}
	}
}

export class Telescreen {
	
	serialCommunicationSpeed = 115200
	nStepsPerTurn = 1200
	serialInput: string = ''
	port: string = null
	openingPort: string = null
	lastUpdateTime = 0
	goHomeDelay:number = 60
	awakePrinterFrequency:number = 10 * 60

	speed: number = 0.1
	angle: number = 0
	position: paper.Point = null
	previousDelta: paper.Point = null
	margin = 0						// The margin inside the draw area where the pen can't go

	threshold1: number = 150
	threshold2: number = 400
	gamepadMode: number = 1
	
	refreshRate = 20
	
	moves: Map<string, Move>
	
	move: Move = null
	maxDistance = 5 			// Ignore moves farther than maxDistance to tipibot position (> 0), or move exactly where the optical encoders are (0)
	nCommandsMax = 0 			// Ignore moves when n commands in queue is greate than nCommandsMax (> -1), or do not ignore any command
	modeController: Controller
	portController: any
	choosingPort = false 		// User is choosing a port with the portController: do not update the portController or it will unselect it
	mustRefreshPortList = false
	
	lastMessages:any[] = []
	axes:number[] = []
	buttons:boolean[] = []
	
	lastCommandSent:number = null
	
	midi: MIDIAccess = null
	lastMidiMessages: any[] = []
	
	// Draw Telescreen:
	renderer: Renderer
	toggleFullTelescreenButton: Controller
	fullTelescreen = false
	canvasJ: any
	divJ: any
	project: paper.Project
	
	drawing: paper.Group = null
	drawingMaxPoints: number = 5000 // When the drawing has more than drawingMaxPoints points, the first points are removed
	group: paper.Group = null
	directionPath: paper.Path = null
	modeText: paper.PointText = null

	printDrawingOnly = true // Only print the drawing, not the entire drawing area (true), or the entire drawing area (false)

	constructor() {
		this.moves = new Map<string, Move>()
		this.moves.set('Orthographic', new OrthographicMove(this))
		this.moves.set('Polar', new PolarMove(this))
		this.moves.set('Direction', new DirectionMove(this))

		// document.addEventListener('Disconnect', ()=> this.disconnect(), false)
		// document.addEventListener('Connect', (event: CustomEvent)=> this.connect(event.detail), false)
		// document.addEventListener('MessageReceived', (event: CustomEvent)=> this.messageReceived(event.detail), false)

		document.addEventListener('ServerMessage', (event: CustomEvent)=> this.messageReceived(event.detail), false)
		let currentMode = 'Orthographic'
		this.move = this.moves.get(currentMode)
		
		let directionLength = Math.min(Tipibot.tipibot.drawArea.bounds.width, Tipibot.tipibot.drawArea.bounds.height)
		this.group = new paper.Group()
		let arrowSize = new paper.Size(directionLength/8, directionLength)
		let arrowHead = new paper.Path.RegularPolygon(Tipibot.tipibot.drawArea.bounds.center.add(new paper.Point(0, -directionLength/2)), 3, directionLength/4)
		this.directionPath = new paper.CompoundPath({children: [
			new paper.Path.Rectangle(Tipibot.tipibot.drawArea.bounds.center.subtract(arrowSize.divide(2)), arrowSize),
			arrowHead
		], fillColor: 'black'})
		this.directionPath.rotation = 90
		let directionBackground = paper.Path.Rectangle(Tipibot.tipibot.tipibotArea.bounds)
		directionBackground.fillColor = 'white'
		this.group.addChild(directionBackground)
		this.group.addChild(this.directionPath)
		
		this.modeText = new paper.PointText({
			point: Tipibot.tipibot.drawArea.bounds.bottomCenter.add(new paper.Point(0, 25)),
			content: 'Mode: ' + currentMode,
			fillColor: 'black',
			fontFamily: 'Courier New',
			fontWeight: 'bold',
			justification: 'center',
			fontSize: 25
		})
		this.group.addChild(this.modeText)
		this.group.visible = false

		this.drawing = new paper.Group()
		this.drawing.strokeWidth = 5
		this.drawing.strokeColor = new paper.Color('black')
		this.drawing.strokeCap = 'round'
		this.drawing.strokeJoin = 'round'
		setInterval(()=> this.move.update(), 50)
		
		document.body.addEventListener('keydown', (event)=> this.onKeyDown(event))
		requestAnimationFrame(()=>this.updateMoves())
		
		this.checkGoHomeAndDisableMotors()
	}
	
	checkGoHomeAndDisableMotors() {
        var now = new Date();
        if (now.getHours() == 21 && now.getMinutes() == 0) {
            this.goHomeAndDisableMotors()
        }
        setTimeout(()=>this.checkGoHomeAndDisableMotors(), 50000);
    }

	awakePrinter() {
		Communication.communication.send('awake-printer', {})
	}

	getItem(key:string) {
		return localStorage.getItem('Telescreen:' + key)
	}

	setItem(key:string, value:string) {
		return localStorage.setItem('Telescreen:' + key, value)
	}

	isButtonInverted(id:number) {
		return this.getItem('invertButton'+id) === 'true'
	}

	createGUI(gui: GUI) {
		let telescreenGUI = gui.addFolder('Telescreen')

		this.portController = telescreenGUI.add( {'Connection': 'Disconnected'}, 'Connection' )
		
		
		telescreenGUI.addButton('Disconnect', ()=> this.disconnectSerialPort() )
		
		telescreenGUI.addButton('Listen Gamepad', ()=> this.updateGamepads())
		telescreenGUI.addButton('Listen Midi', ()=> this.initializeMidi() )

		telescreenGUI.addSlider('Speed', 0.1, 0.01, 10, 0.01).onChange((value)=> this.speed = value)
		telescreenGUI.addSlider('Margin', 1, -500, 500, 1).onChange((value)=> this.margin = value)
		telescreenGUI.addSlider('Go Home Delay', this.goHomeDelay, -1, 3600, 1).onChange((value)=> this.goHomeDelay = value)
		
		telescreenGUI.addSlider('Max distance', this.maxDistance, 0, 10, 0.01).onChange((value)=> this.maxDistance = value)
		telescreenGUI.addSlider('N commands max', this.nCommandsMax, -1, 100, 1).onChange((value)=> this.nCommandsMax = value)
		telescreenGUI.addSlider('Path width', this.drawing.strokeWidth, 0, 50, 0.01).onChange((value)=> this.drawing.strokeWidth = value)
		telescreenGUI.addSlider('Drawing max points', this.drawingMaxPoints, 0, 50000, 10).onChange((value)=> this.drawingMaxPoints = value)
		telescreenGUI.addSlider('Awake printer freq (sec)', this.awakePrinterFrequency, 0, 3600, 10).onChange((value)=> this.awakePrinterFrequency = value)

		telescreenGUI.addSlider('Threshold 1', 1, 1, 1000, 1).onChange((value)=> this.threshold1 = value)
		telescreenGUI.addSlider('Threshold 2', 1, 1, 1000, 1).onChange((value)=> this.threshold2 = value)
		
		telescreenGUI.add( {'Print drawing only': this.printDrawingOnly }, 'Print drawing only' )

		telescreenGUI.add( {'Invert button 1': this.isButtonInverted(1) }, 'Invert button 1' ).onFinishChange(()=> this.setItem('invertButton1', String(!this.isButtonInverted(1)) ))
		telescreenGUI.add( {'Invert button 2': this.isButtonInverted(2) }, 'Invert button 2' ).onFinishChange(()=> this.setItem('invertButton2', String(!this.isButtonInverted(2)) ))

		this.modeController = telescreenGUI.add({ 'Mode': 'Orthographic' }, 'Mode', <any>['Orthographic', 'Polar', 'Direction']).onFinishChange((value: string)=> this.modeChanged(value))
		
		telescreenGUI.add( {'Show direction': this.group.visible }, 'Show direction' ).onFinishChange((value)=>this.group.visible = value )

		this.toggleFullTelescreenButton = telescreenGUI.addButton('Start', (value)=> this.toggleFullTelescreen())
		
		telescreenGUI.addButton('Start awake printer', ()=> setInterval(()=>this.awakePrinter(), this.awakePrinterFrequency * 1000) )
		telescreenGUI.addButton('Print drawing', ()=> this.print() )
		// telescreenGUI.open()
		
	}

	initializeMidi() {
		// let permissionName: any = { name: "midi", sysex: true }
		// navigator.permissions.query(permissionName).then((result) => {
		// 	if (result.state === "granted") {
		// 	  // Access granted.
		// 	} else if (result.state === "prompt") {
		// 	  // Using API will prompt for permission
		// 	}
		// 	// Permission was denied by user prompt or permission policy
		//   });

		  navigator.requestMIDIAccess().then((m)=>this.onMIDISuccess(m), (r)=>this.onMIDIFailure(r));
	}

	onMIDISuccess(midiAccess:any) {
		console.log("MIDI ready!");
		this.midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
		
		midiAccess.inputs.forEach((entry:MIDIInput) => {
		  entry.onmidimessage = (event)=> this.onMIDIMessage(event);
		})
	}

	onMIDIMessage(event:MIDIMessageEvent) {
		// let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
		// for (const character of event.data) {
		//   str += ' ,' + character;//	`0x${character.toString(16)} `;
		// }
		// console.log(str);
		let d = event.data
		let rotaryEncoder = d[0] == 176
		let pad = d[0] == 153 // this means pad was just pressed, then d[0] == 169 during push, and d[0] == 137 on release
		let buttonId = rotaryEncoder && d[1] == 112 || pad && d[1] == 37 ? 1 : rotaryEncoder && d[1] == 114 || pad && d[1] == 36 ? 2 : -1
		let action = pad ? 'x' : rotaryEncoder && d[2] > 64 ? '+' : rotaryEncoder && d[2] < 64 ? '-' : ''
		let realSpeed = Settings.tipibot.maxSpeed
		let realDelta = this.speed
		if(rotaryEncoder && buttonId != -1 && action != '') {
			Settings.tipibot.maxSpeed += Math.abs(d[2]-64) * 1000
			this.speed *= Math.abs(d[2]-64)

			if(this.isButtonInverted(buttonId)) {
				action = action == '-' ? '+' : '-'
			}
		}

		if(buttonId == 1) {
			if(action == '-') {
				this.move.button1cw()
			} else if(action == '+') {
				this.move.button1ccw()
			} else if(action == 'x') {
				Tipibot.tipibot.togglePenState()
			}
		} else if(buttonId == 2) {
			if(action == '-') {
				this.move.button2cw()
			} else if(action == '+') {
				this.move.button2ccw()
			} else if(action == 'x') {
				this.cycleMode()
			}
		}
		Settings.tipibot.maxSpeed = realSpeed
		this.speed = realDelta

		// this.lastMidiMessages.unshift({buttonId: buttonId, action: action, time: event.timeStamp})
		// if(this.lastMidiMessages.length>4){
		// 	this.lastMidiMessages.pop()
		// }
	}
	
	onMIDIFailure(msg:string) {
		console.error(`Failed to get MIDI access - ${msg}`);
	}

	initializePortController(options: string[]) {
		if(this.choosingPort) {
			// if options and this.portController options are different: schedule a refresh
			let optionsDiffer = options.length != this.portController.domElement.childNodes[0].options.length
			for(let option of this.portController.domElement.childNodes[0].options) {
				if(optionsDiffer || options.indexOf(option.value) < 0) {
					optionsDiffer = true
					break
				}
			}
			if(optionsDiffer) {
				this.mustRefreshPortList = true
			}
		}

		this.portController = this.portController.options(options)
		
		$(this.portController.domElement.parentElement.parentElement).mousedown( (event)=> {
			this.choosingPort = true
		})

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	serialConnectionPortChanged(portName: string) {
		this.choosingPort = false
		if(portName == 'Disconnected' && this.port != null) {
			this.disconnectSerialPort()
		} else if(portName != 'Disconnected') {
			this.openingPort = portName
			console.log('open: ' + portName + ', at: ' + this.serialCommunicationSpeed)
			Communication.communication.send('open', { name: portName, baudRate: this.serialCommunicationSpeed }, portName)
		}
		if(this.mustRefreshPortList) {
			Communication.communication.send('list')
			this.mustRefreshPortList = false
		}
	}
	setPortName(port:string) {
		this.portController.object[this.portController.property] = port
		this.portController.updateDisplay()
	}

	disconnectSerialPort() {
		Communication.communication.send('close', null, this.port)
		this.port = null
		this.portController.setValue('Disconnected')
	}

	changeMode(mode: string) {
		// for(let m of this.moves) {
		// 	m[1].clearTimeout()
		// }
		this.modeText.content = 'Mode: ' + mode
		this.move = this.moves.get(mode)
	}

	modeChanged(mode: string) {
		this.changeMode(mode)
	}

	setMode(mode: string) {
		this.changeMode(mode)
		this.modeController.setValue(<any>mode)
		this.modeController.updateDisplay()
	}

	cycleMode() {
		let movesList = []
		let i = 0
		let currentMoveIndex = 0
		for(let m of this.moves) {
			if(m[1] == this.move) {
				currentMoveIndex = i
			}
			movesList.push(m[0])
			i++
		}
		let newMove = movesList[ currentMoveIndex+1 < movesList.length ? currentMoveIndex + 1 : 0]
		this.setMode(newMove)
	}

	// connect(port: string) {
	// 	// for(let serialPort of communication.serialPorts) {
	// 	// 	if(serialPort != port) {
	// 	// 		communication.socket.emit('command', 'open ' + serialPort + ' ' + SERIAL_COMMUNICATION_SPEED)
	// 	// 	}
	// 	// }
	// }

	// disconnect() {
	// 	// for(let serialPort of communication.serialPorts) {
	// 	// 	if(serialPort != Communication.interpreter.serialPort) {
	// 	// 		communication.socket.emit('command', 'close ' + serialPort)
	// 	// 	}
	// 	// }
	// }

	messageReceived(messageObject: {type: string, data:any, port: string}) {

		let type = messageObject.type
		let data = messageObject.data
		let port = messageObject.port

		if(type == 'opened') {
			if(port == this.openingPort) {
				this.port = port
				this.openingPort = null
			}
		} else if(type == 'already-opened') {
			if(port == this.openingPort) {
				this.port = port
				this.openingPort = null
			}
		} else if(type == 'closed') {
			this.port = null
		} else if(type == 'list') {
			let options = ['Disconnected']
			for(let port of data) {
				options.push(port.path)
			}
			this.initializePortController(options)
		} else if(type == 'connected') {

		} else if(type == 'not-connected') {
			
		} else if(type == 'connected-to-simulator') {

		} else if(type == 'data') {
			if(port == this.port) {
				this.processRawMessage(data)
			}
		} else if(type == 'sent') {
			if(port == this.port) {
			}
		}
	}

	getClampedPositionInDrawArea(target: paper.Point) {
		target.x = paper.Numerical.clamp(target.x, Tipibot.tipibot.drawArea.bounds.left + this.margin, Tipibot.tipibot.drawArea.bounds.right - this.margin)
		target.y = paper.Numerical.clamp(target.y, Tipibot.tipibot.drawArea.bounds.top + this.margin, Tipibot.tipibot.drawArea.bounds.bottom - this.margin)
		return target
	}

	drawingLength() {
		let length = 0
		for(let path of this.drawing.children) {
			length += (<paper.Path>path).segments.length
		}
		return length
	}

	moveLinear(point: paper.Point) {
		point = this.getClampedPositionInDrawArea(point)
		console.log(Tipibot.tipibot.pen.state)
		if(Tipibot.tipibot.pen.state == PenState.Changing) {
			return
		}
		if(this.nCommandsMax >= 0 && Communication.interpreter.commandQueue.length > this.nCommandsMax) {
			return
		}
		if(this.maxDistance > 0) {
			let delta = point.subtract(Tipibot.tipibot.getPosition())
			if(delta.length > this.maxDistance) {
				delta.length = this.maxDistance
				point = Tipibot.tipibot.getPosition().add(delta)
			}
		}
		Tipibot.tipibot.moveLinear(point, 0, Settings.tipibot.maxSpeed, null, false)
		
		if(Tipibot.tipibot.pen.state == PenState.Down) {
			if(this.drawing.lastChild == null) {
				let path = new paper.Path()
				path.style = this.drawing.style
				this.drawing.addChild(path)
			}
			(<paper.Path>this.drawing.lastChild).add(point)
			while(this.drawingMaxPoints > 0 && this.drawingLength() > this.drawingMaxPoints) {
				(<paper.Path>this.drawing.firstChild).removeSegment(0);
				if((<paper.Path>this.drawing.firstChild).segments.length == 0) {
					this.drawing.firstChild.remove()
				}
			}
		}
		if(this.goHomeDelay > 0) {
			Tipibot.tipibot.planActions(()=>this.goHomeAndDisableMotors(), this.goHomeDelay * 1000)
		}
	}

	goHomeAndDisableMotors() {
		Tipibot.tipibot.goHome()
		Tipibot.tipibot.disableMotors(true)
	}

	processRawMessage(data: string) {

		this.serialInput += data
		
		let messages = this.serialInput.split('\n')
		this.serialInput = this.serialInput.endsWith('\n') ? '' : messages[messages.length-1]

		// process all messages except the last one (it is either empty if the serial input ends with '\n', or it is not a finished message)
		for(let i=0 ; i<messages.length-1 ; i++) {
			this.processMessage(messages[i])
		}
	}

	processMessage(message: string) {
		// let now = Date.now()
		console.log(message)//, now-this.lastUpdateTime)
		let parts = message.split(':')
		let name = parts[0]
		let value = parts[1]
		if(name == null || value == null) {
			return
		}
		if(name.startsWith('Button5') && parseInt(value)>0) {
			if(Tipibot.tipibot.pen.state == PenState.Up) {
				let path = new paper.Path()
				path.style = this.drawing.style
				path.add(Tipibot.tipibot.getPosition())
				this.drawing.addChild(path)
			}
			return Tipibot.tipibot.togglePenState(false)
		}
		if(name.startsWith('Button4') && parseInt(value)>0) {
			return this.setMode('Orthographic')
		}
		if(name.startsWith('Button3') && parseInt(value)>0) {
			return this.setMode('Polar')
		}
		if(name.startsWith('Button2') && parseInt(value)>0) {
			return this.setMode('Direction')
		}
		if(name.startsWith('Button1') && parseInt(value)>0) {
			return this.print()
		}
		if(!name.startsWith('Encoders')) {
			return
		}
		let values = value.trim().split(',')
		if(values.length<2){
			return
		}
		let newPosition = new paper.Point(parseFloat(values[0]), parseFloat(values[1]))
		if(this.position == null) {
			this.position = newPosition
		}
		let delta = newPosition.subtract(this.position).multiply(360 / this.nStepsPerTurn)
		if(this.previousDelta == null) {
			this.previousDelta = delta
		}
		if(Math.abs(this.previousDelta.x) > 0 && Math.sign(delta.x) != Math.sign(this.previousDelta.x)) {
			delta.x = 0
		}
		if(Math.abs(this.previousDelta.y) > 0 && Math.sign(delta.y) != Math.sign(this.previousDelta.y)) {
			delta.y = 0
		}
		this.previousDelta = delta
		delta = delta.multiply(this.isButtonInverted(1) ? 1 : -1, this.isButtonInverted(2) ? 1 : -1)
		if(this.modeController.getValue() == 'Orthographic') {
			this.moveLinear(Tipibot.tipibot.getPosition().add(delta.multiply(this.speed)))
		} else if(this.modeController.getValue() == 'Polar') {
			let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition()).add(delta.multiply(this.speed))
			this.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
		} else if(this.modeController.getValue() == 'Direction') {
			let displacement = new paper.Point(delta.y * this.speed, 0)
			this.angle += delta.x
			displacement.angle = this.angle
			this.directionPath.rotate(delta.x)
			this.moveLinear(Tipibot.tipibot.getPosition().add(displacement.multiply(delta.y > 0 ? -1 : 1)))
		}
		this.position = newPosition
	}

	processMessageKY40(message: string) {
		let now = Date.now()
		// console.log(message, now-this.lastUpdateTime)
		let buttonId = parseInt(message[0])
		let action = message[1]
		let realSpeed = this.speed
		if(action!='x') {
			// Debounce: if last messages were all in one direction and last update time was almost now: this message should be in the same direction
			for(let lm of this.lastMessages) {
				if(lm.buttonId == buttonId) {
					if(now-lm.time < this.threshold1) {
						this.speed *= 3
					} else if(now-lm.time < this.threshold2) {
						this.speed *= 2
					}
				}
				if(lm.buttonId == buttonId && now - lm.time < 100) {
					action = lm.action
					break
				}
			}
			if(this.isButtonInverted(buttonId)) {
				action = action == '-' ? '+' : '-'
			}
		}
		console.log(buttonId, action)

		this.lastUpdateTime = now
		if(buttonId == 1) {
			if(action == '-') {
				this.move.button1cw()
			} else if(action == '+') {
				this.move.button1ccw()
			} else if(action == 'x') {
				Tipibot.tipibot.togglePenState()
			}
		} else if(buttonId == 2) {
			if(action == '-') {
				this.move.button2cw()
			} else if(action == '+') {
				this.move.button2ccw()
			} else if(action == 'x') {
				this.cycleMode()
			}
		}
		this.speed = realSpeed
		this.lastMessages.unshift({buttonId: buttonId, action: message[1], time: now})
		if(this.lastMessages.length>4){
			this.lastMessages.pop()
		}
	}


    equals(a:number, b:number, tolerance=0.01) {
        return Math.abs(b-a) < tolerance
    }

	updateMoves() {
		let now = Date.now()
		if (this.lastCommandSent == null) {
			this.lastCommandSent = now
		}
		
		let amount = 1
		let delta = new paper.Point()
		if ( now - this.lastCommandSent > 10) {
			for(let code of Tipibot.tipibot.pressedKeys) {
				switch (code) {
					case 'ArrowLeft': 			// left arrow
						// this.moveDirect(this.getPosition().add(new paper.Point(-amount, 0)))
						// this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(-amount, 0)))
						delta.x -= amount
						break;
					case 'ArrowUp': 			// up arrow
						// this.moveDirect(this.getPosition().add(new paper.Point(0, -amount)))
						// this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, -amount)))
						delta.y -= amount
						break;
					case 'ArrowRight': 			// right arrow
						// this.moveDirect(this.getPosition().add(new paper.Point(amount, 0)))
						// this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(amount, 0)))
						delta.x += amount
						break;
					case 'ArrowDown': 			// down arrow
						// this.moveDirect(this.getPosition().add(new paper.Point(0, amount)))
						// this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, amount)))
						delta.y += amount
						break;
				}
			}
			if(!delta.isZero()) {
				this.moveLinear(Tipibot.tipibot.getPosition().add(delta))
				this.lastCommandSent = now
			}
		}
		requestAnimationFrame(()=>this.updateMoves())
	}

    updateGamepads() {
        const gamepads = navigator.getGamepads()
        if (!gamepads || gamepads.length == 0) {
            // requestAnimationFrame(()=>this.update())
            setTimeout(()=>this.updateGamepads(), 0)
            return
        }
		if(Communication.interpreter.commandQueue.length > 0) {
			setTimeout(()=>this.updateGamepads(), 0)
			return
		}
        let activated = false

        const gp = gamepads[0]
        if(gp == null) {
            setTimeout(()=>this.updateGamepads(), 0)
            return
        }
        // console.log('gamepad', gp)
		
		let realSpeed = this.speed

        // Arrows
        if(this.equals(gp.axes[0], 0.714)) { // Left
			activated = true
			this.move.button1ccw()
        }
        if(this.equals(gp.axes[0], -0.428)) { // Right
            activated = true
			this.move.button1cw()
        }
        if(this.equals(gp.axes[0], -1)) { // Up
			activated = true
			this.move.button2ccw()
        }
        if(this.equals(gp.axes[0], 0.142)) { // Down
			activated = true
			this.move.button2cw()
        }

        // Move Z
        if(gp.buttons[5].pressed && !gp.buttons[7].pressed) {
			this.speed *= 2
			activated = true
        } else if(!gp.buttons[5].pressed && gp.buttons[7].pressed) {
			this.speed *= 3
            activated = true
        } else if(gp.buttons[5].pressed && gp.buttons[7].pressed) {
			this.speed *= 4
            activated = true
        }
		let epsilon = 0.05
		if(this.gamepadMode == 1) {
			if(Math.abs(gp.axes[1]) > epsilon || Math.abs(gp.axes[2]) > epsilon) { // Up & down
				activated = true
				this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], this.speed * gp.axes[2])))
			}
		} else if (this.gamepadMode == 2) {
			// Left Joystick: Menu selection and actions
			// if(gp.axes[1] < -epsilon) { // Left
			// 	activated = true
			// 	this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], 0)))
			// }
			// if(gp.axes[1] > epsilon) { // Right
			// 	activated = true
			// 	this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], 0)))
			// }
	
			// if(gp.axes[2] < -epsilon) { // Up
			// 	activated = true
			// 	this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.speed * gp.axes[2])))
			// }
			// if(gp.axes[2] > epsilon) { // Down (z axis is inverted)
			// 	activated = true
			// 	this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.speed * gp.axes[2])))
			// }
			// Left Joystick: Menu selection and actions
			if(Math.abs(gp.axes[1]) > epsilon) { // Left & Right
				activated = true
				this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], 0)))
			}
	
			if(Math.abs(gp.axes[2]) > epsilon) { // Up & down
				activated = true
				this.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.speed * gp.axes[2])))
			}
		}

		// if(Math.abs(gp.axes[1]) > epsilon || Math.abs(gp.axes[2]) > epsilon) {
		// 	this.speed *= Math.max( Math.abs(gp.axes[1]) , Math.abs(gp.axes[2]) )
		// }
        
		// if pressed and was not pressed before
        if(gp.buttons[0].pressed && !this.buttons[0]) {
            activated = true
			Tipibot.tipibot.togglePenState()
        }
        if(gp.buttons[1].pressed && !this.buttons[1]) {
            activated = true
			this.gamepadMode++
			if(this.gamepadMode > 2) {
				this.gamepadMode = 1
			}
        }
        
        if(gp.buttons[4].pressed) {
        }
        if(gp.buttons[6].pressed) {
        }

        if(gp.buttons[9].pressed) { // start
            activated = true
        }

        if(gp.buttons[8].pressed) { // select
			// this.cycleMode()
            activated = true
        }

        // Right Joystick
        if(this.equals(gp.axes[3], -1)) { // Left
			activated = true
        }
        if(this.equals(gp.axes[3], 1)) { // Right
            activated = true
        }

		this.speed = realSpeed
		for(let i=0 ; i<gp.axes.length ; i++) {
			if(this.axes.length == gp.axes.length && this.axes[i] != gp.axes[i]) {
				console.log(i, gp.axes[i])
			}
		}
		this.axes = gp.axes.slice()
		this.buttons = []
        for(let i=0 ; i<gp.buttons.length ; i++) {
            let button = gp.buttons[i]
			this.buttons.push(button.pressed)
            if(button.pressed) {
                console.log(i, button)
            }
        }
        // requestAnimationFrame(()=>this.update())
        setTimeout(()=>this.updateGamepads(), activated ? this.refreshRate : 0)
    }

	print() {
		if(this.drawing.children.length == 0) {
			return
		}
		Tipibot.tipibot.goHome(null, this.goHomeDelay * 1000)
		let mainProject = paper.project
		
		let drawingBounds = this.printDrawingOnly ? this.drawing.strokeBounds.expand(10) : Tipibot.tipibot.drawArea.bounds
		let canvas = document.createElement('canvas')
		let size = Math.max(drawingBounds.width, drawingBounds.height)
		// canvas.width = drawingBounds.width
		// canvas.height = drawingBounds.height
		canvas.width = size
		canvas.height = size

		let project = new paper.Project(canvas)
		
		project.view.center = drawingBounds.center
		// let frame = new paper.Path.Rectangle(drawingBounds)
		let frame = new paper.Path.Rectangle(drawingBounds.center.subtract(new paper.Size(size/2, size/2)), new paper.Size(size, size))
		// frame.strokeWidth = 3
		// frame.strokeColor = new paper.Color('black')
		frame.fillColor = new paper.Color('white')
		frame.position = drawingBounds.center
		
		project.activeLayer.addChild(this.drawing)
		project.view.draw()
		project.view.update()
		// let canvasTemp = document.createElement('canvas')
		// canvasTemp.width = drawingBounds.width
		// canvasTemp.height = drawingBounds.height
		// let contextTemp = canvasTemp.getContext('2d')
		// contextTemp.putImageData(project.view.context.getImageData(drawingBounds.x, drawingBounds.y, drawingBounds.width, drawingBounds.height), 0, 0)

		let url = canvas.toDataURL("image/png")

		// let svg = project.exportSVG({asString:true, bounds: Tipibot.tipibot.drawArea.bounds})

		// let blob = new Blob([svg], {type: "image/svg"})
		// let url  = URL.createObjectURL(blob)
		
		// let rectangle = new paper.Path.Rectangle(Tipibot.tipibot.drawArea)
		// rectangle.strokeWidth = 1
		// rectangle.strokeColor = 'black'

		// let link = document.createElement("a");
		// document.body.appendChild(link);
		// // link.download = 'drawing.svg';
		// link.download = 'drawing.png';
		// link.href = url;
		// link.click();
		// document.body.removeChild(link);

		this.drawing.removeChildren()
		mainProject.activate()
		mainProject.activeLayer.addChild(this.drawing)

		// Communication.communication.send('write-file', svg)
		Communication.communication.send('print-file', {content: url.split(',')[1]})
	}


	setRenderer(renderer: Renderer) {
		this.renderer = renderer
	}

	// windowResize(event: Event = null){

	// 	if(this.canvasJ == null) {
	// 		return
	// 	}

	// 	let width = window.innerWidth
	// 	let height = window.innerHeight
	// 	this.canvasJ.width(width)
	// 	this.canvasJ.height(height)
	// 	// paper.project.view.viewSize = new paper.Size(width, height)
	// 	// this.renderer.centerOnTipibot(this.drawArea.bounds, true, this.canvasJ.get(0))
	// 	// this.project.view.center = this.drawArea.bounds.center
	// }

	startFullTelescreen() {
		$('body').removeClass('advancedLayout')
		$('#gui').hide()
		$('body').addClass('noGui')
		window.dispatchEvent(new Event('resize'));
	}

	stopFullTelescreen() {
		$('body').removeClass('noGui')
		$('body').addClass('advancedLayout')
		$('#gui').show()
		window.dispatchEvent(new Event('resize'));
	}

	toggleFullTelescreen() {

		this.fullTelescreen = !this.fullTelescreen
		this.toggleFullTelescreenButton.setName(this.fullTelescreen ? 'Stop' : 'Start')
		

		if(this.fullTelescreen) {
			this.startFullTelescreen()
		} else {
			this.stopFullTelescreen()
		}

		paper.project.view.center = Tipibot.tipibot.drawArea.position
		let viewRatio = paper.project.view.bounds.width / paper.project.view.bounds.height
		let drawAreaRatio = Tipibot.tipibot.drawArea.bounds.width / Tipibot.tipibot.drawArea.bounds.height

		if (viewRatio > drawAreaRatio) {
			paper.project.view.scale(paper.project.view.bounds.height / (Tipibot.tipibot.drawArea.bounds.height * 1.15) )
		} else {
			paper.project.view.scale(paper.project.view.bounds.width / (Tipibot.tipibot.drawArea.bounds.width * 1.15) )
		}
	}

	onKeyDown(event: KeyboardEvent) {
		if(!this.fullTelescreen) {
			return
		}
		switch (event.code) {
			case 'Escape':
				this.toggleFullTelescreen()
				break;
			default:
				break;
		}
	}
}