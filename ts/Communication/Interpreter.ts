import { Settings, paper, servoUpAngle, servoDownAngle, document, createEvent } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"

const MAX_INPUT_BUFFER_LENGTH = 500

export enum SpecialCommandTypes {
	Idle,
    ChangePen
}

export declare type Command = {
	data: string
	message: string
	time?: number
	callback?: ()=> any
	id?: number
	special?: SpecialCommandTypes
}

export const SERIAL_COMMUNICATION_SPEED = 57600 // 57600 // 115200 // 250000
export declare type Communication = { send: (type: string, data?: any)=> void }

export class Interpreter {
	
	serialPort: string
	communication: Communication
	commandID = 0
	commandQueue: Array<Command>
	tipibot: TipibotInterface
	pause: boolean
	tempoNextCommand: boolean
	serialInput: string
	continueMessage = 'READY'
	serialCommunicationSpeed = SERIAL_COMMUNICATION_SPEED
	name = 'interpreter'
	justQueueCommands = false
	lastCommandSendTime: number = null
	logNextMessage = true

	constructor(communication: Communication) {
		this.commandQueue = []
		this.pause = false
		this.serialInput = ''
		this.tempoNextCommand = false
		this.communication = communication
	}

	setSerialPort(serialPort: string) {
		this.serialPort = serialPort;
	}

	setTipibot(tipibot: TipibotInterface) {
		this.tipibot = tipibot;
	}

	serialPortConnectionOpened() {
		// this.initialize()
	}

	initialize(initializeAtHome=true) {
		this.sendPenWidth(Settings.tipibot.penWidth)
		this.sendSpecs()
		this.sendInvertXY()
		// Initialize at home position by default; it is always possible to set position afterward
		// This is to ensure the tipibot is correctly automatically initialized even when the user moves it without initializing it before 
		this.sendSetPosition(initializeAtHome ? new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY - Settings.tipibot.penOffset) : this.tipibot.getGondolaPosition())
		this.sendMaxSpeedAndAcceleration()
		this.sendServoSpeed()
		this.sendFeedback()
		this.tipibot.initializedCommunication = true
	}

	getGCode(): string {
		let gCode = ""
		for(let command of this.commandQueue) {
			gCode += command.data
		}
		return gCode
	}

	send(command: Command) {
		if(this.pause) {
			return
		}
		document.dispatchEvent(createEvent('SendCommand', { detail: command }))
		if(command.special == SpecialCommandTypes.ChangePen) {
			this.pause = true
			console.log('send: ' + command.message + ' - ' + command.data)
			console.info(command.message + ' and then resume (uncheck pause)')
			return
		}
		console.log('send: ' + command.message + ' - ' + command.data)
		this.lastCommandSendTime = null
		this.logNextMessage = true
		this.communication.send('data', command.data)
	}

	isolateContinueMessage() {
		let continueIndex = this.serialInput.indexOf(this.continueMessage)

		if(continueIndex > 0) {
			var re = new RegExp(this.continueMessage, 'g')
			this.serialInput = this.serialInput.replace(re, "\n" + this.continueMessage)
		}
	}

	messageSent(messageObject: {data: any, time: number}) {
		this.lastCommandSendTime = messageObject.time
	}

	messageReceived(messageObject: {data: any, time: number}) {
		let data = messageObject.data
		let time = messageObject.time
		if(messageObject == null || data == null) {
			return
		}

		this.serialInput += data
		this.isolateContinueMessage()
		
		let messages = this.serialInput.split('\n')
		this.serialInput = this.serialInput.endsWith('\n') ? '' : messages[messages.length-1]

		// process all messages except the last one (it is either empty if the serial input ends with '\n', or it is not a finished message)
		for(let i=0 ; i<messages.length-1 ; i++) {
			this.processMessage(messages[i], messageObject.time)
		}
	}

	processMessage(message: string, time: number) {
		if(message=='') {
			return
		}

		document.dispatchEvent(createEvent('MessageReceived', { detail: message }))
		
		let isContinueMessage = message.indexOf(this.continueMessage) == 0
		
		if(!isContinueMessage || this.logNextMessage) {
			console.log(message)
			this.logNextMessage = false
		}

		if(isContinueMessage && this.lastCommandSendTime != null && time > this.lastCommandSendTime) {
			if(this.commandQueue.length > 0) {
				let command = this.commandQueue.shift()
				if(command.callback != null) {
					command.callback()
				}
				document.dispatchEvent(createEvent('CommandExecuted', { detail: command }))
				this.startQueue()
			}
		}
	}

	setPause(pause: boolean) {
		this.pause = pause
		if(!this.pause) {
			this.startQueue()
		}
	}

	queue(data: string, message: string, callback: () => any = null, specialCommand: SpecialCommandTypes = null) {
		let command = { id: this.commandID++, data: data, callback: callback, message: message, special: specialCommand }
		if(this.justQueueCommands) {
			this.commandQueue.push(command)
			return
		}
		document.dispatchEvent(createEvent('QueueCommand', { detail: command }))

		this.commandQueue.push(command)

		if(this.commandQueue.length == 1) {
			this.send(command)
		}
	}

	startQueue() {
		if(this.commandQueue.length > 0) {
			this.send(this.commandQueue[0])
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
		document.dispatchEvent(createEvent('ClearQueue', { detail: null }))
	}

	executeOnceFinished(callback: ()=> void) {
		if(this.commandQueue.length == 0) {
			callback()
		}
		let lastCommand = this.commandQueue[this.commandQueue.length - 1]
		let currentCallback = lastCommand.callback
		lastCommand.callback = ()=> {
			currentCallback()
			callback()
		}
	}

    sendSetHome(point: paper.Point=this.tipibot.getPosition()) {
	}

    sendAutoHome(callback: () => any = null) {
	}
	
    sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
	}

	sendMoveLinear(point: paper.Point, minSpeed: number=0, maxSpeed: number=Settings.tipibot.maxSpeed, callback: () => any = null) {
	}

	sendMoveStation(direction: number=0, nSteps: number=0, nDelays: number=0, callback: () => any = null) {
	}

	sendDrawSpeed(speed: number=Settings.tipibot.drawSpeed, acceleration: number=Settings.tipibot.acceleration) {
	}

	sendMaxSpeed(speed: number=Settings.tipibot.maxSpeed, acceleration: number=Settings.tipibot.acceleration) {
	}
	
	sendAcceleration(acceleration: number=Settings.tipibot.acceleration) {
	}

	sendMaxSpeedAndAcceleration(speed: number=Settings.tipibot.maxSpeed, acceleration: number=Settings.tipibot.acceleration) {
	}

	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
	}

	sendStepsPerRev(stepsPerRev: number=Settings.tipibot.stepsPerRev) {
	}

	sendMmPerRev(mmPerRev: number=Settings.tipibot.mmPerRev) {
	}

	sendStepMultiplier(microstepResolution: number=Settings.tipibot.microstepResolution) {
	}

	sendPenWidth(penWidth: number=Settings.tipibot.penWidth) {
	}

	sendChangePen(penName: string, penIndex: number) {
		this.queue('Change pen ' + penIndex + '\n', 'Change pen to ' + penName + ', index ' + penIndex, null, SpecialCommandTypes.ChangePen)
	}

	sendServoSpeed(servoSpeed: number=Settings.servo.speed) {
	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, microstepResolution: number=Settings.tipibot.microstepResolution) {
	}

	sendInvertXY(invertMotorLeft: boolean=Settings.tipibot.invertMotorLeft, invertMotorRight: boolean=Settings.tipibot.invertMotorRight) {
	}

	sendProgressiveMicrosteps(progressiveMicrosteps: boolean = Settings.tipibot.progressiveMicrosteps) {
	}

	sendPause(delay: number) {
	}

	sendMotorOff() {
	}

	sendMotorOn() {
	}

	sendMoveExtruder(position: number, callback:()=> any= null) {
	}

	sendPenState(servoValue: number, servoTempo: number = 0) {
	}
	
	sendMovePen(amount: number, callback: ()=> void = null) {
		
	}

	sendPenUp(servoUpValue: number = servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
	}

	sendPenDown(servoDownValue: number = servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
	}

	sendPenClose(servoCloseValue: number = Settings.servo.position.close, callback: ()=> void = null) {
	}

	sendPenDrop(servoDropValue: number = Settings.servo.position.drop, callback: ()=> void = null) {
	}

	sendStop(force = true) {
	}

	sendPenLiftRange(servoDownValue: number=servoDownAngle(), servoUpValue: number=servoUpAngle()) {
	}

	sendPenDelays(servoDownDelay: number=Settings.servo.delay.down.before, servoUpDelay: number=Settings.servo.delay.up.before) {
	}

	sendFeedback(enable = Settings.feedback.enable, rate = Settings.feedback.rate) {

	}
}