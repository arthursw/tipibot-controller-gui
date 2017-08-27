import { Settings } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"

declare type Command = {
	data: string
	callback: ()=> any
}

export class CommunicationInterface {
	
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
		if(this.serialInput.indexOf(this.continueMessage) == 0) {
			this.serialInput = ''
			if(this.commandQueue.length > 0) {
				let command = this.commandQueue.shift()
				if(command.callback != null) {
					command.callback()
				}
				this.send(this.commandQueue[0].data)
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

	sendTipibotSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
	}

	sendTipibotSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, stepMultiplier: number=Settings.tipibot.stepMultiplier) {
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
}