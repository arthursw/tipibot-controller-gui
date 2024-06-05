import { paper } from "../Settings"
import { GUI, Controller } from "../GUI"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"
import { Communication } from "../Communication/CommunicationStatic"

class Move {
	
	telescreen: Telescreen
	timeoutID: NodeJS.Timeout = null
	
	constructor(telescreen: Telescreen) {
		this.telescreen = telescreen
	}

	moveTipibot(moveType: string) {
		this.timeoutID = null
		if(moveType == 'linear') {
			Tipibot.tipibot.moveLinear(this.telescreen.position)
		} else if(moveType == 'direct') {
			Tipibot.tipibot.moveDirect(this.telescreen.position)
		}
	}

	moveTipibotDeferred(moveType: string) {
		this.clearTimeout()
		this.timeoutID = setTimeout(()=> this.moveTipibot(moveType), 500)
	}

	clearTimeout() {
		if(this.timeoutID != null) {
			clearTimeout(this.timeoutID)
			this.timeoutID = null
		}
	}

	positiveLeft(): void {}
	negativeLeft(): void {}
	positiveRight(): void {}
	negativeRight(): void {}
}

class OrthographicMove extends Move {
	
	positiveLeft() {
		this.telescreen.position.x += this.telescreen.speed
		this.moveTipibotDeferred('linear')
	}

	negativeLeft() {
		this.telescreen.position.x -= this.telescreen.speed
		this.moveTipibotDeferred('linear')
	}

	positiveRight() {
		this.telescreen.position.y += this.telescreen.speed
		this.moveTipibotDeferred('linear')
	}

	negativeRight() {
		this.telescreen.position.y -= this.telescreen.speed
		this.moveTipibotDeferred('linear')
	}
}

class PolarMove extends Move {
	
	positiveLeft() {
		let lengths = Tipibot.tipibot.cartesianToLengths(this.telescreen.position)
		lengths.x += this.telescreen.speed
		this.telescreen.position = Tipibot.tipibot.lengthsToCartesian(lengths)
		this.moveTipibotDeferred('direct')
	}

	negativeLeft() {
		let lengths = Tipibot.tipibot.cartesianToLengths(this.telescreen.position)
		lengths.x -= this.telescreen.speed
		this.telescreen.position = Tipibot.tipibot.lengthsToCartesian(lengths)
		this.moveTipibotDeferred('direct')
	}

	positiveRight() {
		let lengths = Tipibot.tipibot.cartesianToLengths(this.telescreen.position)
		lengths.y += this.telescreen.speed
		this.telescreen.position = Tipibot.tipibot.lengthsToCartesian(lengths)
		this.moveTipibotDeferred('direct')
	}

	negativeRight() {
		let lengths = Tipibot.tipibot.cartesianToLengths(this.telescreen.position)
		lengths.y -= this.telescreen.speed
		this.telescreen.position = Tipibot.tipibot.lengthsToCartesian(lengths)
		this.moveTipibotDeferred('direct')
	}
}

class DirectionMove extends Move {

	direction = new paper.Point(1, 0)

	positiveLeft() {
		this.direction.angle += 360/30
	}

	negativeLeft() {
		this.direction.angle -= 360/30
	}

	positiveRight() {
		this.telescreen.position = this.telescreen.position.add(this.direction.multiply(this.telescreen.speed))
		this.moveTipibotDeferred('linear')
	}

	negativeRight() {
		this.telescreen.position = this.telescreen.position.subtract(this.direction.multiply(this.telescreen.speed))
		this.moveTipibotDeferred('linear')
	}
}

export class Telescreen {
	
	serialCommunicationSpeed = 9600
	port: string = null

	speed: number = 1
	position: paper.Point
	moves: Map<string, Move>

	move: Move = null
	modeController: Controller
	portController: any

	constructor() {
		this.moves = new Map<string, Move>()
		this.moves.set('Orthographic', new OrthographicMove(this))
		this.moves.set('Polar', new PolarMove(this))
		this.moves.set('Direction', new DirectionMove(this))

		// document.addEventListener('Disconnect', ()=> this.disconnect(), false)
		// document.addEventListener('Connect', (event: CustomEvent)=> this.connect(event.detail), false)
		// document.addEventListener('MessageReceived', (event: CustomEvent)=> this.messageReceived(event.detail), false)

		document.addEventListener('ServerMessage', (event: CustomEvent)=> this.messageReceived(event.detail), false)

		this.move = this.moves.get('Orthographic')
		this.position = Tipibot.tipibot.getPosition()
	}

	createGUI(gui: GUI) {
		let telescreenGUI = gui.addFolder('Telescreen')

		this.portController = gui.add( {'Connection': 'Disconnected'}, 'Connection' )
		gui.addButton('Disconnect', ()=> this.disconnectSerialPort() )

		telescreenGUI.addSlider('Speed', 1, 1, 100, 1).onChange((value)=> this.speed = value)
		this.modeController = telescreenGUI.add({ 'Mode': 'Orthographic' }, 'Mode', <any>['Orthographic', 'Polar', 'Direction']).onFinishChange((value: string)=> this.modeChanged(value))
		// telescreenGUI.open()
	}

	initializePortController(options: string[]) {

		this.portController = this.portController.options(options)
		
		// $(this.portController.domElement.parentElement.parentElement).mousedown( (event)=> {})

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	serialConnectionPortChanged(portName: string) {
		if(portName == 'Disconnected' && this.port != null) {
			this.disconnectSerialPort()
		} else if(portName != 'Disconnected') {
			this.port = portName
			console.log('open: ' + portName + ', at: ' + this.serialCommunicationSpeed)
			Communication.communication.send('open', { name: portName, baudRate: this.serialCommunicationSpeed }, portName)
		}
	}
	setPortName(port:string) {
		this.portController.object[this.portController.property] = port
		this.portController.updateDisplay()
	}

	disconnectSerialPort() {
		Communication.communication.send('close', null, this.port)
		this.portController.setValue('Disconnected')
		this.port = null
	}

	changeMode(mode: string) {
		for(let m of this.moves) {
			m[1].clearTimeout()
		}
		this.move = this.moves.get(mode)
	}

	modeChanged(mode: string) {
		this.changeMode(mode)
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
		let newMove = movesList[ i+1 < movesList.length ? i+1 : 0]
		this.changeMode(newMove)
		this.modeController.setValue(<any>newMove)
		this.modeController.updateDisplay()
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
			this.port = port
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
				this.processMessage(data)
			}
		} else if(type == 'sent') {
			if(port == this.port) {
			}
		}
	}

	processMessage(message: string) {

		let position = Tipibot.tipibot.getPosition()
		if(message.indexOf('left') == 0) {
			if(message.indexOf('+') > 0) {
				this.move.positiveLeft()
			} else if(message.indexOf('-') > 0) {
				this.move.negativeLeft()
			} else if(message.indexOf('OFF') > 0) {
				Tipibot.tipibot.togglePenState()
			}
		} else if(message.indexOf('right') == 0) {
			if(message.indexOf('+') > 0) {
				this.move.positiveRight()
			} else if(message.indexOf('-') > 0) {
				this.move.negativeRight()
			} else if(message.indexOf('OFF') > 0) {
				this.cycleMode()
			}
		}
	}
}