import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { SVGPlot } from "../Plot"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { tipibot } from "../Tipibot"

interface Move {
	positiveLeft(speed: number): void
	negativeLeft(speed: number): void
	positiveRight(speed: number): void
	negativeRight(speed: number): void
}

class OrthographicMove implements Move {

	positiveLeft(speed: number) {
		let position = tipibot.getPosition()
		position.x += speed
		tipibot.moveLinear(position)
	}

	negativeLeft(speed: number) {
		let position = tipibot.getPosition()
		position.x -= speed
		tipibot.moveLinear(position)
	}

	positiveRight(speed: number) {
		let position = tipibot.getPosition()
		position.y += speed
		tipibot.moveLinear(position)
	}

	negativeRight(speed: number) {
		let position = tipibot.getPosition()
		position.y -= speed
		tipibot.moveLinear(position)
	}
}

class PolarMove implements Move {

	positiveLeft(speed: number) {
		let lengths = tipibot.getLengths()
		lengths.x += speed
		let position = tipibot.lengthsToCartesian(lengths)
		tipibot.moveDirect(position)
	}

	negativeLeft(speed: number) {
		let lengths = tipibot.getLengths()
		lengths.x -= speed
		let position = tipibot.lengthsToCartesian(lengths)
		tipibot.moveDirect(position)
	}

	positiveRight(speed: number) {
		let lengths = tipibot.getLengths()
		lengths.y += speed
		let position = tipibot.lengthsToCartesian(lengths)
		tipibot.moveDirect(position)
	}

	negativeRight(speed: number) {
		let lengths = tipibot.getLengths()
		lengths.y -= speed
		let position = tipibot.lengthsToCartesian(lengths)
		tipibot.moveDirect(position)
	}
}

class DirectionMove implements Move {

	direction = new paper.Point(1, 0)

	positiveLeft(speed: number) {
		this.direction.angle += 360/30
	}

	negativeLeft(speed: number) {
		this.direction.angle -= 360/30
	}

	positiveRight(speed: number) {
		let position = tipibot.getPosition()
		tipibot.moveLinear(position.add(this.direction.multiply(speed)))
	}

	negativeRight(speed: number) {
		let position = tipibot.getPosition()
		tipibot.moveLinear(position.add(this.direction.multiply(-speed)))
	}
}

export class Telescreen {
	
	speed: number = 1
	moves = { 
		Orthographic: new OrthographicMove(),
		Polar: new PolarMove(),
		Direction: new DirectionMove()
	}

	move: Move = null
	modeController: Controller

	constructor() {
		document.addEventListener('Disconnect', ()=> this.disconnect(), false)
		document.addEventListener('Connect', (event: CustomEvent)=> this.connect(event.detail), false)
		document.addEventListener('MessageReceived', (event: CustomEvent)=> this.messageReceived(event.detail), false)
		this.move = this.moves.Orthographic
	}

	createGUI(gui: GUI) {
		let telescreenGUI = gui.addFolder('Telescreen')
		telescreenGUI.addSlider('Speed', 1, 1, 100, 1).onChange((value)=> this.speed = value)
		this.modeController = telescreenGUI.add({ 'Mode': 'Orthographic' }, 'Mode', <any>['Orthographic', 'Polar', 'Direction']).onFinishChange((value: string)=> this.modeChanged(value))
		telescreenGUI.open()
	}

	modeChanged(mode: string) {
		this.move = (<any>this.moves)[mode]
	}

	cycleMode() {
		let moveNames = []
		for(let moveName in this.moves) {
			moveNames.push(moveName)
		}
		let i=0
		for(let moveName in this.moves) {
			if(this.move == (<any>this.moves)[moveName]) {
				let newMoveName = moveNames[ i + 1 < moveNames.length ? i + 1 : 0 ]
				this.move = (<any>this.moves)[newMoveName]
				this.modeController.setValue(<any>newMoveName)
				this.modeController.updateDisplay()
				break
			}
			i++
		}
	}

	connect(port: string) {
		for(let serialPort of communication.serialPorts) {
			if(serialPort != port) {
				communication.socket.emit('command', 'open ' + serialPort + ' ' + SERIAL_COMMUNICATION_SPEED)
			}
		}
	}

	disconnect() {
		for(let serialPort of communication.serialPorts) {
			if(serialPort != communication.interpreter.serialPort) {
				communication.socket.emit('command', 'close ' + serialPort)
			}
		}
	}

	messageReceived(message: string) {
		let position = tipibot.getPosition()
		if(message.indexOf('left') == 0) {
			if(message.indexOf('+') > 0) {
				this.move.positiveLeft(this.speed)
			} else if(message.indexOf('-') > 0) {
				this.move.negativeLeft(this.speed)
			} else if(message.indexOf('OFF') > 0) {
				tipibot.togglePenState()
			}
		} else if(message.indexOf('right') == 0) {
			if(message.indexOf('+') > 0) {
				this.move.positiveRight(this.speed)
			} else if(message.indexOf('-') > 0) {
				this.move.negativeRight(this.speed)
			} else if(message.indexOf('OFF') > 0) {
				this.cycleMode()
			}
		}
	}
}