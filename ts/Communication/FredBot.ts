import { Communication } from "./Interpreter"
import { PenPlotter } from "./PenPlotter"

export class FredBot extends PenPlotter {

	continueMessage = 'ok'
	initializationMessage = 'Initialize'
	
	constructor(communication: Communication) {
		super(communication)
		this.serialCommunicationSpeed = 250000
	}

	serialPortConnectionOpened() {

	}

	convertServoValue(servoValue: number) {
		return 0.2 + 2 * servoValue / 180
	}

	sendPenState(servoValue: number, delayBefore: number = 0, delayAfter: number = 0, callback: ()=> void = null) {
		servoValue = this.convertServoValue(servoValue)
		let message = 'Move servo: ' + servoValue
		if(delayBefore > 0) {
			this.sendPause(delayBefore)
		}
		this.queue('G1 Z' + servoValue + '\n', message)
		if(delayAfter > 0) {
			this.sendPause(delayAfter, callback)
		}
	}
}
