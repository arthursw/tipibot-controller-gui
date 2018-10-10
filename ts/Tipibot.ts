import { Communication, communication } from "./Communication/Communication"
import { Settings, SettingsManager, settingsManager } from "./Settings"
import { Pen, MoveType } from "./Pen"
import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"

export class Tipibot implements TipibotInterface {

	tipibotArea: paper.Path
	drawArea: paper.Path
	moveToButtons: paper.Path[]
	motorLeft: paper.Path
	motorRight: paper.Path
	home: paper.Group
	pen: Pen

	gui: GUI
	penStateButton: Controller = null
	motorsEnableButton: Controller = null
	settingPosition: boolean = false

	initialPosition: paper.Point = null
	initializedCommunication = false

	lastSentPosition: paper.Point				// The last command created, used in plotPath() to know if we must penUp and moveDirect for the next path

	motorsEnabled = true

	ignoreKeyEvents = false

	constructor() {
		this.moveToButtons = []
		document.addEventListener('ZoomChanged', (event: CustomEvent)=> this.onZoomChanged(), false)
		this.lastSentPosition = new paper.Point(0, 0)
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

	setPositionSliders(point: paper.Point) {
		settingsManager.tipibotPositionFolder.getController('x').setValue(point.x, false)
		settingsManager.tipibotPositionFolder.getController('y').setValue(point.y, false)
		this.gui.getController('moveX').setValue(point.x, false)
		this.gui.getController('moveY').setValue(point.y, false)
	}

	toggleSetPosition(setPosition: boolean = !this.settingPosition, cancel=true) {
		if(!setPosition) {
			settingsManager.tipibotPositionFolder.getController('Set position with mouse').setName('Set position with mouse')
			if(cancel) {
				this.setPositionSliders(this.initialPosition)
			}
		} else {
			settingsManager.tipibotPositionFolder.getController('Set position with mouse').setName('Cancel')
			this.initialPosition = this.getPosition()
		}
		this.settingPosition = setPosition
	}
	
	togglePenState() {
		let callback = ()=> console.log('pen state changed')
		if(this.pen.isUp) {
			this.penDown(SettingsManager.servoDownAngle(), Settings.servo.delay.down.before, Settings.servo.delay.down.after, callback, true)
		} else {
			this.penUp(SettingsManager.servoUpAngle(), Settings.servo.delay.up.before, Settings.servo.delay.up.after, callback, true)
		}
	}

	computeTipibotArea(): paper.Rectangle {
		return new paper.Rectangle(0, 0, Settings.tipibot.width, Settings.tipibot.height)
	}
	
	computeDrawArea(): paper.Rectangle {
		return new paper.Rectangle(Settings.tipibot.width / 2 - Settings.drawArea.width / 2, Settings.drawArea.y, Settings.drawArea.width, Settings.drawArea.height)
	}

	createTarget(x: number, y: number, radius: number) {
		let group = new paper.Group()

		let position = new paper.Point(x, y)
		let circle = paper.Path.Circle(position, radius)
		circle.strokeWidth = 1 
		group.addChild(circle)

		let hLine = new paper.Path()
		hLine.add(new paper.Point(position.x - radius, position.y))
		hLine.add(new paper.Point(position.x + radius, position.y))
		group.addChild(hLine)

		let vLine = new paper.Path()
		vLine.add(new paper.Point(position.x, position.y - radius))
		vLine.add(new paper.Point(position.x, position.y + radius))
		group.addChild(vLine)

		return group
	}

	createMoveToButton(position: paper.Point): paper.Path {
		let size = 6
		let rectangle = paper.Path.Rectangle(position.subtract(size), position.add(size))
		rectangle.fillColor = 'rgba(0, 0, 0, 0.05)'
		rectangle.onMouseUp = (event)=> this.moveToButtonClicked(event, rectangle.position)
		return rectangle
	}


	initialize() {
		this.tipibotArea = paper.Path.Rectangle(this.computeTipibotArea())
		this.drawArea = paper.Path.Rectangle(this.computeDrawArea())
		this.motorLeft = paper.Path.Circle(new paper.Point(0, 0), 50)
		this.motorRight = paper.Path.Circle(new paper.Point(Settings.tipibot.width, 0), 50)
		this.pen = new Pen(Settings.tipibot.homeX, Settings.tipibot.homeY, Settings.tipibot.penOffset, Settings.tipibot.width)

		this.home = this.createTarget(Settings.tipibot.homeX, Settings.tipibot.homeY, Pen.HOME_RADIUS)
		
		let homePoint = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
 		let moveToButtonClicked = this.moveToButtonClicked.bind(this)

		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.topLeft))
		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.topRight))
		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.bottomLeft))
		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.bottomRight))
		this.moveToButtons.push(this.createMoveToButton(homePoint))
		
		this.pen.group.bringToFront()

		settingsManager.setTipibot(this)
	}

	moveToButtonClicked(event: MouseEvent, point: paper.Point) {
		let moveType = Pen.moveTypeFromMouseEvent(event)
		if(moveType == MoveType.Direct) {
			this.moveDirect(point)
		} else {
			this.moveLinear(point)
		}
	}

	onZoomChanged() {
		let scaling = new paper.Point(1 / paper.view.zoom, 1 / paper.view.zoom)
		for(let moveToButtons of this.moveToButtons) {
			moveToButtons.applyMatrix = false
			moveToButtons.scaling = scaling
		}
		this.pen.circle.applyMatrix = false
		this.pen.circle.scaling = scaling
		this.home.applyMatrix = false
		this.home.scaling = scaling
	}

	updateMoveToButtons() {
		let homePoint = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.moveToButtons[0].position = this.drawArea.bounds.topLeft
		this.moveToButtons[1].position = this.drawArea.bounds.topRight
		this.moveToButtons[2].position = this.drawArea.bounds.bottomLeft
		this.moveToButtons[3].position = this.drawArea.bounds.bottomRight
		this.moveToButtons[4].position = homePoint
	}

	updateTipibotArea() {
		this.tipibotArea.remove()
		this.tipibotArea = paper.Path.Rectangle(this.computeTipibotArea())
	}

	updateDrawArea() {
		this.drawArea.remove()
		this.drawArea = paper.Path.Rectangle(this.computeDrawArea())
	}

	sizeChanged(sendChange: boolean) {
		this.motorRight.position.x = Settings.tipibot.width
		this.updateTipibotArea()
		this.updateDrawArea()
		this.pen.tipibotWidthChanged()
		if(sendChange) {
			communication.interpreter.sendSize()
		}
		this.updateMoveToButtons()
	}

	drawAreaChanged(sendChange: boolean) {
		this.updateDrawArea()
		this.updateMoveToButtons()
	}

	maxSpeedChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendMaxSpeed()
		}
	}

	accelerationChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendAcceleration()
		}
	}

	getPosition() {
		return this.pen.getPosition()
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
			communication.interpreter.initialize()
		}
	}

	sendGondolaPosition() {
		communication.interpreter.sendSetPosition(this.getGondolaPosition())
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
		communication.interpreter.sendInvertXY()
		this.sendGondolaPosition()
	}

	sendProgressiveMicrosteps() {
		communication.interpreter.sendProgressiveMicrosteps()
	}

	move(moveType: MoveType, point: paper.Point, minSpeed: number=0, callback: () => any = null, movePen=true) {
		this.checkInitialized()

		let moveCallback = movePen ? callback : ()=> {
			this.pen.setPosition(point, true, false)
			if(callback != null) {
				callback()
			}
		}

		this.lastSentPosition = point

		let target = new paper.Point(point.x, point.y - Settings.tipibot.penOffset)
		if(moveType == MoveType.Direct && !Settings.forceLinearMoves) {
			communication.interpreter.sendMoveDirect(target, moveCallback)
		} else {
			communication.interpreter.sendMoveLinear(target, minSpeed, moveCallback)
		}

		this.enableMotors(false)
		if(movePen) {
			this.pen.setPosition(point, true, false)
		}
	}

	moveDirect(point: paper.Point, callback: () => any = null, movePen=true) {
		this.move(MoveType.Direct, point, 0, callback, movePen)
	}

	moveLinear(point: paper.Point, minSpeed: number=0, callback: () => any = null, movePen=true) {
		this.move(MoveType.Linear, point, minSpeed, callback, movePen)
	}

	setSpeed(speed: number) {
		communication.interpreter.sendMaxSpeed(speed)
	}
	
	stepsPerRevChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendStepsPerRev(Settings.tipibot.stepsPerRev)
		}
	}
	
	mmPerRevChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendMmPerRev(Settings.tipibot.mmPerRev)
		}
	}

	microstepResolutionChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendStepMultiplier(Settings.tipibot.microstepResolution)
		}
	}

	feedbackChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendFeedback(Settings.feedback.enable, Settings.feedback.rate)
		}
	}

	penWidthChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendPenWidth(Settings.tipibot.penWidth)
		}
	}

	servoChanged(sendChange: boolean, up: boolean, specs: boolean) {
		if(sendChange) {
			if(specs) {
				communication.interpreter.sendPenLiftRange()
				communication.interpreter.sendPenDelays()
				communication.interpreter.sendServoSpeed()
			}
			if(up != null) {
				if(up) {
					communication.interpreter.sendPenUp()
				} else {
					communication.interpreter.sendPenDown()
				}
			}
		}
	}

	sendSpecs() {
		communication.interpreter.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, Settings.tipibot.mmPerRev, Settings.tipibot.microstepResolution)
	}

	pause(delay: number) {
		communication.interpreter.sendPause(delay)
	}

	disableMotors(send: boolean) {
		if(send) {
			communication.interpreter.sendMotorOff()
		}
		this.motorsEnableButton.setName('Enable motors')
		this.motorsEnabled = false
	}

	enableMotors(send: boolean) {
		if(send) {
			communication.interpreter.sendMotorOn()
		}
		this.motorsEnableButton.setName('Disable motors')
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
		communication.interpreter.executeOnceFinished(callback)
	}

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null, force=false) {
		if(!this.pen.isUp || force) {
			this.pen.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback)
			this.penStateButton.setName('Pen down')
		}
	}

	penDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null, force=false) {
		if(this.pen.isUp || force) {
			this.pen.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback)
			this.penStateButton.setName('Pen up')
		}
	}

	setHome(setPosition=true, updateSliders=true) {
		let homePosition = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.home.position = homePosition
		if(setPosition) {
			this.setPosition(homePosition, updateSliders)
		}
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

	keyDown(event:KeyboardEvent) {
		if(this.ignoreKeyEvents) {
			return
		}
		let amount = event.shiftKey ? 25 : event.ctrlKey ? 10 : event.altKey ? 5 : 1
		switch (event.keyCode) {
			case 37: 			// left arrow
				this.moveDirect(this.getPosition().add(new paper.Point(-amount, 0)))
				break;
			case 38: 			// up arrow
				this.moveDirect(this.getPosition().add(new paper.Point(0, -amount)))
				break;
			case 39: 			// right arrow
				this.moveDirect(this.getPosition().add(new paper.Point(amount, 0)))
				break;
			case 40: 			// down arrow
				this.moveDirect(this.getPosition().add(new paper.Point(0, amount)))
				break;
			
			default:
				break;
		}
	}

	keyUp(event:KeyboardEvent) {
	}

	windowResize() {
		this.motorRight.position.x = Settings.tipibot.width
		this.updateTipibotArea()
		this.updateDrawArea()
	}
}

export let tipibot: Tipibot = new Tipibot()