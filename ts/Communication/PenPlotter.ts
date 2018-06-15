import { Settings, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"

export class PenPlotter extends Interpreter {

	connectionOpened(description: string) {
		this.sendPenWidth(Settings.tipibot.penWidth)
		this.sendSpecs()
		this.sendSpeed()
		this.sendSetPosition()

		// this.startKeepingTipibotAwake()
	}
	
    sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
		this.queue('G92 X' + point.x + ' Y' + point.y + '\n')
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		this.queue('G0 X' + point.x + ' Y' + point.y + '\n', callback)
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		this.queue('G1 X' + point.x + ' Y' + point.y + '\n', callback)
	}

	sendSpeed(speed: number=Settings.tipibot.speed, acceleration: number=Settings.tipibot.acceleration) {
		this.queue('G0 F' + speed + '\n')
	}
	
	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
		// todo: test
		this.queue('M4 X' + tipibotWidth + '\n')
	}
	
	sendStepsPerRev(stepsPerRev: number=Settings.tipibot.stepsPerRev) {
	}

	sendMmPerRev(mmPerRev: number=Settings.tipibot.mmPerRev) {
	}

	sendStepMultiplier(stepMultiplier: number=Settings.tipibot.stepMultiplier) {
	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, stepMultiplier: number=Settings.tipibot.stepMultiplier) {
		this.queue('M4 X' + tipibotWidth + ' S' + (stepsPerRev*stepMultiplier) + ' P' + mmPerRev + '\n')
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
