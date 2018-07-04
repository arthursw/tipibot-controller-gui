import { Settings, SettingsManager, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"

export class PenPlotter extends Interpreter {

	sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
		super.sendSetPosition(point)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		console.log('set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G92 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n')
	}

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		super.sendMoveDirect(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		console.log('move direct: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G0 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', callback)
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		super.sendMoveLinear(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = SettingsManager.mmToSteps(lengths)
		console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', callback)
	}

	sendMaxSpeed(speed: number=Settings.tipibot.maxSpeed) {
		console.log('set speed: ' + speed)
		this.queue('G0 F' + speed.toFixed(2) + '\n')
	}

	sendAcceleration(acceleration: number=Settings.tipibot.acceleration) {
		console.log('set acceleration: ' + acceleration)
		this.queue('G0 S' + acceleration.toFixed(2) + '\n')
	}

	sendMaxSpeedAndAcceleration(speed: number=Settings.tipibot.maxSpeed, acceleration: number=Settings.tipibot.acceleration) {
		console.log('set speed: ' + speed)
		console.log('set acceleration: ' + acceleration)
		this.queue('G0 F' + speed.toFixed(2) + ' S' + acceleration.toFixed(2) + '\n')
	}

	sendInvertXY(invertX: boolean=Settings.tipibot.invertX, invertY: boolean=Settings.tipibot.invertY) {
		console.log('invertX: ' + invertX + ', invertY: ' + invertY)
		this.queue('M12 X' + (invertX ? -1 : 1) + ' Y' + (invertY ? -1 : 1) + '\n')
	}

	sendProgressiveMicrosteps(progressiveMicrosteps: boolean = Settings.tipibot.progressiveMicrosteps) {
		console.log('progressiveMicrosteps: ' + progressiveMicrosteps)
		this.queue('M13 F' + (progressiveMicrosteps ? -1 : 1) + '\n')
	}
	
	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
		// todo: test
		this.queue('M4 X' + tipibotWidth.toFixed(2) + '\n')
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
		console.log('Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + (stepsPerRev*microstepResolution) + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep)
		this.queue('M4 X' + tipibotWidth + ' S' + (stepsPerRev*microstepResolution) + ' P' + mmPerRev + '\n')
	}

	sendPause(delay: number) {
		this.queue('G4 P' + delay + '\n')
	}

	sendMotorOff() {
		this.queue('M84\n')
	}

	convertServoValue(servoValue: number) {
		// pen plotter needs servo value in microseconds
		// see https://www.arduino.cc/en/Reference/ServoWriteMicroseconds
		return 700 + 1600 * servoValue / 180
	}

	sendPenState(servoValue: number, delayBefore: number = 0, delayAfter: number = 0, callback: ()=> void = null) {
		servoValue = this.convertServoValue(servoValue)
		this.queue('G4 P' + delayBefore + '\n')
		this.queue('M340 P3 S' + servoValue + '\n')
		this.queue('G4 P' + delayAfter + '\n', callback)
	}

	sendPenUp(servoUpValue: number = SettingsManager.servoUpAngle(), delayBefore: number = Settings.servo.delay.up.before, delayAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		this.sendPenState(servoUpValue, delayBefore, delayAfter, callback)
	}

	sendPenDown(servoDownValue: number = SettingsManager.servoDownAngle(), delayBefore: number = Settings.servo.delay.down.before, delayAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		this.sendPenState(servoDownValue, delayBefore, delayAfter, callback)
	}

	sendStop() {
		this.queue('M0\n')
	}
}
