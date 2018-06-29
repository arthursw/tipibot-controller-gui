import { Settings, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"

export class PenPlotter extends Interpreter {

    sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
    	super.sendSetPosition(point)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = this.tipibot.mmToSteps(lengths)
    	console.log('set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G92 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n')
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		super.sendMoveDirect(point, callback)
    	let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = this.tipibot.mmToSteps(lengths)
    	console.log('move direct: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G0 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', callback)
	}

	sendMoveDirectMaxSpeed(point: paper.Point, callback: () => any = null) {
		super.sendMoveDirectMaxSpeed(point, callback)
    	let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = this.tipibot.mmToSteps(lengths)
    	console.log('move direct max speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G2 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', callback)
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		super.sendMoveLinear(point, callback)
		let lengths = this.tipibot.cartesianToLengths(point)
		let lengthsSteps = this.tipibot.mmToSteps(lengths)
    	console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', callback)
	}

	sendSpeed(speed: number=Settings.tipibot.speed) {
		let stepsPerMm = this.tipibot.stepsPerMm()
		let stepsPerSeconds = speed * stepsPerMm
		console.log('set speed: ' + stepsPerSeconds)
		this.queue('G0 F' + stepsPerSeconds + '\n')
	}

	sendAcceleration(acceleration: number=Settings.tipibot.acceleration) {
		let stepsPerMm = this.tipibot.stepsPerMm()
		let stepsPerSeconds2 = acceleration * stepsPerMm
		console.log('set acceleration: ' + stepsPerSeconds2)
		this.queue('G0 S' + stepsPerSeconds2 + '\n')
	}

	sendSpeedAndAcceleration(speed: number=Settings.tipibot.speed, acceleration: number=Settings.tipibot.acceleration) {
		let stepsPerMm = this.tipibot.stepsPerMm()
		let stepsPerSeconds = speed * stepsPerMm
		let stepsPerSeconds2 = acceleration * stepsPerMm
		this.queue('G0 F' + stepsPerSeconds + ' S' + stepsPerSeconds2 + '\n')
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

	sendPenState(servoValue: number, servoTempo: number = 0, callback: ()=> void = null) {
		this.queue('G4 P' + servoTempo + '\n')
		this.queue('M340 P3 S' + servoValue + '\n')
		this.queue('G4 P' + servoTempo + '\n', callback)
	}

	sendPenUp(servoUpValue: number = Settings.servo.position.up, servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		this.sendPenState(servoUpValue, servoUpTempoBefore, callback)
	}

	sendPenDown(servoDownValue: number = Settings.servo.position.down, servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		this.sendPenState(servoDownValue, servoDownTempoBefore, callback)
	}

	sendStop() {
		this.queue('M0\n')
	}
}
