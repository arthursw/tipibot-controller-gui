import { Communication } from "./Communication/CommunicationStatic"
import { isServer, Settings, SettingsManager, settingsManager, paper } from "./Settings"
import { Pen, MoveType, PenState } from "./Pen"
import { TipibotInterface } from "./TipibotInterface"
import { calibration } from "./Calibration"

export class TipibotStatic implements TipibotInterface {

	tipibotArea: paper.Path
	drawArea: paper.Path
	moveToButtons: paper.Path[]
	motorLeft: paper.Path
	motorRight: paper.Path
	home: paper.Group
	pen: Pen

	settingPosition: boolean = false

	initialPosition: paper.Point = null
	initializedCommunication = false

	lastSentPosition: paper.Point				// The last command created, used in plotPath() to know if we must penUp and moveDirect for the next path

	motorsEnabled = true

	ignoreKeyEvents = false

	constructor() {
		this.moveToButtons = []
		this.lastSentPosition = new paper.Point(0, 0)
	}

	toggleSetPosition(setPosition?: boolean, cancel=true): void {
	}

	cartesianToLengths(point: paper.Point): paper.Point {
		let lx2 = Settings.tipibot.width - point.x
		let lengths = new paper.Point(Math.sqrt(point.x * point.x + point.y * point.y), Math.sqrt(lx2 * lx2 + point.y * point.y))
		return lengths
	}

	lengthsToCartesian(lengths: paper.Point): paper.Point {
		let r1 = lengths.x
		let r2 = lengths.y
		let w = Settings.tipibot.width
		let x = ( r1 * r1 - r2 * r2 + w * w ) / (2 * w)
		let y = Math.sqrt( r1 * r1 - x * x )
		return new paper.Point(x, y)
	}

	computeTipibotArea(): paper.Rectangle {
		return new paper.Rectangle(0, 0, Settings.tipibot.width, Settings.tipibot.height)
	}
	
	computeDrawArea(): paper.Rectangle {
		return new paper.Rectangle(Settings.tipibot.width / 2 - Settings.drawArea.width / 2, Settings.drawArea.y, Settings.drawArea.width, Settings.drawArea.height)
	}

	initialize() {
		this.tipibotArea = new paper.Path.Rectangle(this.computeTipibotArea())
		this.drawArea = new paper.Path.Rectangle(this.computeDrawArea())
		this.motorLeft = new paper.Path.Circle(new paper.Point(0, 0), 50)
		this.motorRight = new paper.Path.Circle(new paper.Point(Settings.tipibot.width, 0), 50)
		this.pen = new Pen(Settings.tipibot.homeX, Settings.tipibot.homeY, Settings.tipibot.penOffset, Settings.tipibot.width)

		this.pen.group.bringToFront()

		settingsManager.setTipibot(this)
	}

	updateTipibotArea() {
		this.tipibotArea.remove()
		this.tipibotArea = new paper.Path.Rectangle(this.computeTipibotArea())
	}

	updateDrawArea() {
		this.drawArea.remove()
		this.drawArea = new paper.Path.Rectangle(this.computeDrawArea())
	}

	sizeChanged(sendChange: boolean) {
		this.motorRight.position.x = Settings.tipibot.width
		this.updateTipibotArea()
		this.updateDrawArea()
		this.pen.tipibotWidthChanged()
		if(sendChange) {
			Communication.interpreter.sendSize()
		}
	}

	drawAreaChanged(sendChange: boolean) {
		this.updateDrawArea()
	}

	drawSpeedChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendDrawSpeed()
		}
	}

	maxSpeedChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendMaxSpeed()
		}
	}

	accelerationChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendAcceleration()
		}
	}

	getPosition() {
		return this.pen.getPosition()
	}

	getHome() {
		return new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY-Settings.tipibot.penOffset)
	}
	
	getGondolaPosition() {
		let position = this.getPosition()
		position.y -= Settings.tipibot.penOffset
		return position
	}

	getLengths() {
		return this.cartesianToLengths(this.getPosition())
	}

	setX(x: number, sendChange=true) {
		let p = this.getPosition()
		this.setPosition(new paper.Point(x, p.y), sendChange)
	}

	setY(y: number, sendChange=true) {
		let p = this.getPosition()
		this.setPosition(new paper.Point(p.x, y), sendChange)
	}

	checkInitialized() {
		if(Settings.forceInitialization && !this.initializedCommunication) {
			Communication.interpreter.initialize()
		}
	}

	sendGondolaPosition() {
		Communication.interpreter.sendSetPosition(this.getGondolaPosition())
	}

	sendChangePen(penName: string, penIndex: number) {
		Communication.interpreter.sendChangePen(penName, penIndex)
	}

	setPosition(point: paper.Point, sendChange=true, updateSliders=false) {
		this.pen.setPosition(point, updateSliders, false)
		if(sendChange) {
			this.lastSentPosition = point
			this.checkInitialized()
			this.sendGondolaPosition()
		}
	}

	sendInvertXY() {
		Communication.interpreter.sendInvertXY()
		this.sendGondolaPosition()
	}

	sendProgressiveMicrosteps() {
		Communication.interpreter.sendProgressiveMicrosteps()
	}

	move(moveType: MoveType, point: paper.Point, minSpeed: number=0, maxSpeed: number=Settings.tipibot.maxSpeed, callback: () => any = null, movePen=true) {
		this.checkInitialized()

		let moveCallback = movePen ? callback : ()=> {
			this.pen.setPosition(point, true, false)
			if(callback != null) {
				callback()
			}
		}

		this.lastSentPosition = point
		
		if(!this.motorsEnabled) {
			this.enableMotors(true)
		}

		let target = new paper.Point(point.x, point.y - Settings.tipibot.penOffset)
		if(moveType == MoveType.Direct && !Settings.forceLinearMoves) {
			if(calibration.applyTransform) {
				target = calibration.transform(target)
			}
			Communication.interpreter.sendMoveDirect(target, moveCallback)
		} else {
			if(calibration.applyTransform) {
				target = calibration.transform(target)
			}
			Communication.interpreter.sendMoveLinear(target, minSpeed, maxSpeed, moveCallback)
		}

		if(movePen) {
			this.pen.setPosition(point, true, false)
		}
	}

	moveDirect(point: paper.Point, callback: () => any = null, movePen=true) {
		this.move(MoveType.Direct, point, 0, Settings.tipibot.maxSpeed, callback, movePen)
	}

	moveLinear(point: paper.Point, minSpeed: number=0, maxSpeed: number=Settings.tipibot.maxSpeed, callback: () => any = null, movePen=true) {
		this.move(MoveType.Linear, point, minSpeed, maxSpeed, callback, movePen)
	}

	setSpeed(speed: number) {
		Communication.interpreter.sendMaxSpeed(speed)
	}
	
	stepsPerRevChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendStepsPerRev(Settings.tipibot.stepsPerRev)
		}
	}
	
	mmPerRevChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendMmPerRev(Settings.tipibot.mmPerRev)
		}
	}

	microstepResolutionChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendStepMultiplier(Settings.tipibot.microstepResolution)
		}
	}

	feedbackChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendFeedback(Settings.feedback.enable, Settings.feedback.rate)
		}
	}

	penWidthChanged(sendChange: boolean) {
		if(sendChange) {
			Communication.interpreter.sendPenWidth(Settings.tipibot.penWidth)
		}
	}

	servoChanged(sendChange: boolean, penState: string, specs: boolean) {
		if(sendChange) {
			if(specs) {
				Communication.interpreter.sendPenLiftRange()
				Communication.interpreter.sendPenDelays()
				Communication.interpreter.sendServoSpeed()
			}
			if(penState != null) {
				if(penState == 'up') {
					Communication.interpreter.sendPenUp()
				} else if(penState == 'down') {
					Communication.interpreter.sendPenDown()
				} else if(penState == 'close') {
					Communication.interpreter.sendPenClose()
				} else if(penState == 'drop') {
					Communication.interpreter.sendPenDrop()
				}
			}
		}
	}

	sendSpecs() {
		Communication.interpreter.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, Settings.tipibot.mmPerRev, Settings.tipibot.microstepResolution)
	}

	pause(delay: number) {
		Communication.interpreter.sendPause(delay)
	}

	disableMotors(send: boolean) {
		if(send) {
			Communication.interpreter.sendMotorOff()
		}
		this.motorsEnabled = false
	}

	enableMotors(send: boolean) {
		if(send) {
			Communication.interpreter.sendMotorOn()
		}
		this.motorsEnabled = true
	}

	toggleMotors() {
		if(this.motorsEnabled) {
			this.disableMotors(true)
		} else {
			this.enableMotors(true)
		}
	}

	executeOnceFinished(callback: ()=> void) {
		Communication.interpreter.executeOnceFinished(callback)
	}

	servoPlus() {
		
	}

	servoMinus() {
		
	}

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null, force=false) {
		let liftPen = this.pen.state != PenState.Up || force
		if(liftPen) {
			this.pen.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback)
		}
		return liftPen
	}

	penDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null, force=false) {
		let lowerPen = this.pen.state == PenState.Up || force
		if(lowerPen) {
			this.pen.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback)
		}
		return lowerPen
	}

	setHome(setPosition=true, updateSliders=true) {
		let homePosition = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.home.position = homePosition
		if(setPosition) {
			this.setPosition(homePosition, true, updateSliders)
		}
		Communication.interpreter.sendSetHome(this.getGondolaPosition())
	}

	goHome(callback: ()=> any = null) {
		let homePoint = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		// let goHomeCallback = ()=> {
		// 	this.pen.setPosition(homePoint, true, false)
		// 	callback()
		// }
		this.penUp(SettingsManager.servoUpAngle(), Settings.servo.delay.up.before, Settings.servo.delay.up.after, null, true)
		// this.penUp(null, null, null, true)
		// The pen will make me (tipibot) move :-)
		// this.pen.setPosition(homePoint, true, true, MoveType.Direct, goHomeCallback)
		this.moveDirect(homePoint, callback, false)
	}

	windowResize() {
		this.motorRight.position.x = Settings.tipibot.width
		this.updateTipibotArea()
		this.updateDrawArea()
	}
}

export let tipibot: TipibotStatic = isServer ? new TipibotStatic() : null