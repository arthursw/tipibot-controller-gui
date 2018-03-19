import { Settings } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"

const MAX_INPUT_BUFFER_LENGTH = 500

export declare type Command = {
	data: string
	callback: ()=> any
	id: number
}

export class Interpreter {
	
	serialPort: string
	socket: any
	commandID = 0
	commandQueue: Array<Command>
	tipibot: TipibotInterface
	pause: boolean
	tempoNextCommand: boolean
	serialInput: string
	readonly continueMessage = 'READY'

	constructor() {
		this.commandQueue = []
		this.pause = false
		this.serialInput = ''
		this.tempoNextCommand = false
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

	send(command: Command) {
		if(this.pause) {
			return
		}
		document.dispatchEvent(new CustomEvent('SendCommand', { detail: command }))
		this.socket.emit('command', 'send ' + this.serialPort + ' ' + command.data)
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
		// if(message.indexOf('++')==0) {
		// 	console.log(message)
		// }
		
		document.dispatchEvent(new CustomEvent('MessageReceived', { detail: message }))

		if(message.indexOf(this.continueMessage) == 0) {
			if(this.commandQueue.length > 0) {
				let command = this.commandQueue.shift()
				if(command.callback != null) {
					command.callback()
				}
				document.dispatchEvent(new CustomEvent('CommandExecuted', { detail: command }))
				if(this.commandQueue.length > 0) {
					this.send(this.commandQueue[0])
				} else {
					this.queueEmpty()
				}
			}
		}
	}

	queueEmpty() {

	}

	setPause(pause: boolean) {
		this.pause = pause;
		if(!this.pause && this.commandQueue.length > 0) {
			this.send(this.commandQueue[0])
		}
	}

	queue(data: string, callback: () => any = null) {
		if(this.socket == null) {
			return
		}

		let command = { id: this.commandID++, data: data, callback: callback }
		document.dispatchEvent(new CustomEvent('QueueCommand', { detail: command }))

		this.commandQueue.push(command)

		if(this.commandQueue.length == 1) {
			this.send(command)
		}
	}

	removeCommand(commandID: number) {
		let index = this.commandQueue.findIndex((command)=> command.id == commandID)
		if(index >= 0) {
			this.commandQueue.splice(index, 1)
		}
	}

	clearQueue() {
		this.commandQueue = []
		document.dispatchEvent(new CustomEvent('ClearQueue', { detail: null }))
	}

	stopAndClearQueue() {
		this.clearQueue()
		this.sendStop()
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

	sendPenUp(servoUpValue: number = Settings.servo.position.up, servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
	}

	sendPenDown(servoDownValue: number = Settings.servo.position.down, servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
	}

	sendStop() {
	}

	sendPenLiftRange(servoDownValue: number=Settings.servo.position.down, servoUpValue: number=Settings.servo.position.up) {
	}

	sendPenDelays(servoDownDelay: number=Settings.servo.delay.down.before, servoUpDelay: number=Settings.servo.delay.up.before) {
	}
}