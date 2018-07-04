import { Settings, SettingsManager, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"

export class PenPlotter extends Interpreter {

	sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
		super.sendSetPosition(point)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		// console.log('set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		let message = 'Set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		this.queue('G92 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message)
	}

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		super.sendMoveDirect(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		let message = 'Move direct: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		// console.log('move direct: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G0 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback)
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		super.sendMoveLinear(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		let message = 'Move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		// console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback)
	}

	sendMaxSpeed(speed: number=Settings.tipibot.maxSpeed) {
		// console.log('set speed: ' + speed)
		let message = 'Set max speed: ' + speed
		this.queue('G0 F' + speed.toFixed(2) + '\n', message)
	}

	sendAcceleration(acceleration: number=Settings.tipibot.acceleration) {
		console.log('set acceleration: ' + acceleration)
		let message = 'Set acceleration: ' + acceleration
		this.queue('G0 S' + acceleration.toFixed(2) + '\n', message)
	}

	sendMaxSpeedAndAcceleration(speed: number=Settings.tipibot.maxSpeed, acceleration: number=Settings.tipibot.acceleration) {
		console.log('set speed: ' + speed)
		console.log('set acceleration: ' + acceleration)
		let message = 'Set speed: ' + acceleration + ', set acceleration: ' + acceleration
		this.queue('G0 F' + speed.toFixed(2) + ' S' + acceleration.toFixed(2) + '\n', message)
	}

	sendInvertXY(invertMotorLeft: boolean=Settings.tipibot.invertMotorLeft, invertMotorRight: boolean=Settings.tipibot.invertMotorRight) {
		// console.log('invertMotorLeft: ' + invertMotorLeft + ', invertMotorRight: ' + invertMotorRight)
		let message = 'Invert motors: left: ' + invertMotorLeft + ', right: ' + invertMotorRight
		this.queue('M12 X' + (invertMotorLeft ? -1 : 1) + ' Y' + (invertMotorRight ? -1 : 1) + '\n', message)
	}

	sendProgressiveMicrosteps(progressiveMicrosteps: boolean = Settings.tipibot.progressiveMicrosteps) {
		// console.log('progressiveMicrosteps: ' + progressiveMicrosteps)
		let message = 'Set progressiveMicrosteps: ' + progressiveMicrosteps
		this.queue('M13 F' + (progressiveMicrosteps ? -1 : 1) + '\n', message)
	}
	
	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
		// todo: test
		let message = 'Send size: ' + tipibotWidth.toFixed(2)
		this.queue('M4 X' + tipibotWidth.toFixed(2) + '\n', message)
	}
	
	sendStepsPerRev(stepsPerRev: number=Settings.tipibot.stepsPerRev) {
		this.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, stepsPerRev, Settings.tipibot.mmPerRev, Settings.tipibot.microstepResolution)
	}

	sendMmPerRev(mmPerRev: number=Settings.tipibot.mmPerRev) {
		this.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, mmPerRev, Settings.tipibot.microstepResolution)
	}

	sendStepMultiplier(microstepResolution: number=Settings.tipibot.microstepResolution) {
		this.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, Settings.tipibot.mmPerRev, microstepResolution)
	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, microstepResolution: number=Settings.tipibot.microstepResolution) {
		let stepsPerRevolution = stepsPerRev*microstepResolution
		let millimetersPerStep = mmPerRev / stepsPerRevolution;
		let message = 'Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + (stepsPerRev*microstepResolution) + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep
		console.log(message)
		this.queue('M4 X' + tipibotWidth + ' S' + (stepsPerRev*microstepResolution) + ' P' + mmPerRev + '\n', message)
	}

	sendPause(delay: number, callback: ()=> void = null) {
		// Todo: floor delay
		let message = 'Wait: ' + delay
		this.queue('G4 P' + delay + '\n', message, callback)
	}

	sendMotorOff() {
		let message = 'Disable motors'
		this.queue('M84\n', message)
	}

	convertServoValue(servoValue: number) {
		// pen plotter needs servo value in microseconds
		// see https://www.arduino.cc/en/Reference/ServoWriteMicroseconds
		return 700 + 1600 * servoValue / 180
	}

	sendPenState(servoValue: number, delayBefore: number = 0, delayAfter: number = 0, callback: ()=> void = null) {
		servoValue = this.convertServoValue(servoValue)
		let message = 'Move servo: ' + servoValue
		this.sendPause(delayBefore)
		this.queue('M340 P3 S' + servoValue + '\n', message)
		this.sendPause(delayAfter, callback)
		// this.queue('G4 P' + delayAfter + '\n', callback)
	}

	sendPenUp(servoUpValue: number = SettingsManager.servoUpAngle(), delayBefore: number = Settings.servo.delay.up.before, delayAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		this.sendPenState(servoUpValue, delayBefore, delayAfter, callback)
	}

	sendPenDown(servoDownValue: number = SettingsManager.servoDownAngle(), delayBefore: number = Settings.servo.delay.down.before, delayAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		this.sendPenState(servoDownValue, delayBefore, delayAfter, callback)
	}

	sendStop() {
		let message = 'Stop'
		this.queue('M0\n', message)
	}
}
