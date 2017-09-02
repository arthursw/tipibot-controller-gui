import { Settings } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"

const MAX_INPUT_BUFFER_LENGTH = 500

declare type Command = {
	data: string
	callback: ()=> any
}

export class Interpreter {
	
	serialPort: string
	socket: any
	commandQueue: Array<Command>
	tipibot: TipibotInterface
	pause: boolean
	serialInput: string
	readonly continueMessage = 'READY'

	constructor() {
		this.commandQueue = []
		this.pause = false
		this.serialInput = ''
	}

	setSerialPort(serialPort: string) {
		this.serialPort = serialPort;
	}

	setSocket(socket: any) {
		this.socket = socket;
	}

	setTipibot(tipibot: TipibotInterface) {
		this.tipibot = tipibot;
	}

	connectionOpened(description: string) {

	}

	send(data: string) {
		if(this.pause) {
			return
		}
		console.log('Serial input: ', data)
		this.socket.emit('command', 'send ' + this.serialPort + ' ' + data)
	}

	messageReceived(message: string) {
		this.serialInput += message
		
		let messages = this.serialInput.split('\n')
		
		// process all messages except the last one (it is either empty if the serial input ends with '\n', or it is not a finished message)
		for(let i=0 ; i<messages.length-1 ; i++) {
			this.processMessage(messages[i])
		}

		// Clear any old message
		if(this.serialInput.endsWith('\n')) {
			this.serialInput = ''
		} else {
			this.serialInput = messages[messages.length-1]
		}
	}

	processMessage(message: string) {
		console.log(message)
		if(message.indexOf(this.continueMessage) == 0) {
			if(this.commandQueue.length > 0) {
				let command = this.commandQueue.shift()
				if(command.callback != null) {
					command.callback()
				}
				if(this.commandQueue.length > 0) {
					this.send(this.commandQueue[0].data)
				}
			}
		}
	}

	setPause(pause: boolean) {
		this.pause = pause;
		if(!this.pause && this.commandQueue.length > 0) {
			this.send(this.commandQueue[0].data)
		}
	}

	queue(data: string, callback: () => any = null) {
		if(this.socket == null) {
			return
		}

		this.commandQueue.push({ data: data, callback: callback })

		if(this.commandQueue.length == 1) {
			this.send(data)
		}
	}

	clearQueue() {
		this.commandQueue = []
	}

    sendSetPosition(point: paper.Point) {
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
	}

	sendSpeed(speed: number=Settings.tipibot.speed, acceleration: number=Settings.tipibot.acceleration) {
	}

	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
	}

	sendStepsPerRev(stepsPerRev: number=Settings.tipibot.stepsPerRev) {
	}

	sendMmPerRev(mmPerRev: number=Settings.tipibot.mmPerRev) {
	}

	sendStepMultiplier(stepMultiplier: number=Settings.tipibot.stepMultiplier) {
	}

	sendPenWidth(penWidth: number=Settings.tipibot.penWidth) {
	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, stepMultiplier: number=Settings.tipibot.stepMultiplier) {
	}

	sendPause(delay: number) {
	}

	sendMotorOff() {
	}

	sendPenState(servoValue: number, servoTempo: number = 0) {
	}

	sendPenUp(servoUpValue: number = Settings.servo.position.up, servoUpTempo: number = Settings.servo.delay.up) {
	}

	sendPenDown(servoDownValue: number = Settings.servo.position.down, servoDownTempo: number = Settings.servo.delay.down) {
	}

	sendStop() {
	}

	sendPenLiftRange(servoDownValue: number=Settings.servo.position.down, servoUpValue: number=Settings.servo.position.up) {
	}

	sendPenDelays(servoDownDelay: number=Settings.servo.delay.down, servoUpDelay: number=Settings.servo.delay.up) {
	}
}