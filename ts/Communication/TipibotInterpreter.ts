import { Settings, SettingsManager, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"
import { PenPlotter } from "./PenPlotter"

export class TipibotInterpreter extends PenPlotter {

	readonly continueMessage = 'READY'
	readonly initializationMessage = 'Initialize'

	connectionOpened() {

	}

	sendMoveDirectFullSpeed(point: paper.Point, callback: () => any = null) {
		super.sendMoveDirectFullSpeed(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		// console.log('move direct max speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		let message = 'Move direct full speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		this.queue('G2 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback)
	}

	sendMoveLinearFullSpeed(point: paper.Point, callback: () => any = null) {
		super.sendMoveLinearFullSpeed(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		// console.log('move linear full speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		let message = 'Move linear full speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		this.queue('G3 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback)
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
