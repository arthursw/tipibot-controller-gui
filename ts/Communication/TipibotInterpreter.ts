import { Settings, SettingsManager, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"
import { PenPlotter } from "./PenPlotter"

export class TipibotInterpreter extends PenPlotter {

	readonly initializationMessage = 'Initialize'

	serialPortConnectionOpened() {

	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, microstepResolution: number=Settings.tipibot.microstepResolution) {
		let stepsPerRevolution = stepsPerRev*microstepResolution
		let millimetersPerStep = mmPerRev / stepsPerRevolution;
		// console.log('Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + stepsPerRev + ', microstepResolution: ' + microstepResolution + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep)
		let message = 'Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + stepsPerRev + ', microstepResolution: ' + microstepResolution + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep
		this.queue('M4 X' + tipibotWidth + ' S' + stepsPerRev + ' F' + microstepResolution + ' P' + mmPerRev + '\n', message)
	}

	sendServoSpeed(servoSpeed: number=Settings.servo.speed) {
		let message = 'Set servo speed: ' + servoSpeed
		this.queue('M14 F' + servoSpeed + '\n', message)
	}
	
	sendFeedback(enable = Settings.feedback.enable, rate = Settings.feedback.rate) {
		if(!enable) {
			rate = 0
		}
		let message = 'Set feedback: ' + enable + ', rate: ' + rate.toFixed(2)
		this.queue('M15 F' + rate.toFixed(2) + '\n', message)
	}

	convertServoValue(servoValue: number) {
		return servoValue
	}

	sendMotorOn() {
		let message = 'Enable motors'
		this.queue('M85\n', message)
	}

	processMessage(message: string) {
		super.processMessage(message)
		if(message.indexOf(this.initializationMessage) == 0) {
			this.initialize()
		}
	}
}
