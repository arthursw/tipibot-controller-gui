import { Communication, communication } from "./Communication/Communication"
import { Settings, SettingsManager, settingsManager } from "./Settings"
import { Rectangle, Circle, Target} from "./Shapes"
import { Renderer } from "./RendererInterface"
import { InteractiveItem } from "./InteractiveItem"
import { Pen, MoveType } from "./Pen"
import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"
import { PlotInterface } from "./PlotInterface"

export class Tipibot implements TipibotInterface {

	gui:GUI = null
	renderer: Renderer = null

	tipibotArea: Rectangle
	drawArea: Rectangle
	moveToButtons: InteractiveItem[]
	motorLeft: Circle
	motorRight: Circle
	home: Target
	pen: Pen

	penStateButton: Controller = null
	motorsEnableButton: Controller = null
	settingPosition: boolean = false

	initialPosition: paper.Point = null
	initializedCommunication = false

	motorsEnabled = true

	constructor() {
		this.moveToButtons = []
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
	
	createGUI(gui: GUI) {
		this.gui = gui
		let position = { moveX: Settings.tipibot.homeX, moveY: Settings.tipibot.homeY }
		gui.add(position, 'moveX', 0, Settings.tipibot.width).name('Move X').onFinishChange((value)=> this.setX(value))
		gui.add(position, 'moveY', 0, Settings.tipibot.height).name('Move Y').onFinishChange((value)=> this.setY(value))

		let goHomeButton = gui.addButton('Go home', ()=> this.goHome(()=> console.log('I am home :-)')))

		this.penStateButton = gui.addButton('Pen down', () => this.togglePenState() )
		this.motorsEnableButton = gui.addButton('Disable motors', ()=> this.toggleMotors())

		gui.add({'Pause': false}, 'Pause').onChange((value) => communication.interpreter.setPause(value))
		gui.addButton('Stop & Clear queue', () => communication.interpreter.stopAndClearQueue() )
		
		// DEBUG
		gui.addButton('Send specs', ()=> communication.interpreter.initialize(false))
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
		if(this.pen.isPenUp) {
			this.penDown(SettingsManager.servoDownAngle(), Settings.servo.delay.down.before, Settings.servo.delay.down.after, callback)
		} else {
			this.penUp(SettingsManager.servoUpAngle(), Settings.servo.delay.up.before, Settings.servo.delay.up.after, callback)
		}
	}

	computeTipibotArea(): paper.Rectangle {
		return new paper.Rectangle(0, 0, Settings.tipibot.width, Settings.tipibot.height)
	}
	
	computeDrawArea(): paper.Rectangle {
		return new paper.Rectangle(Settings.tipibot.width / 2 - Settings.drawArea.width / 2, Settings.drawArea.y, Settings.drawArea.width, Settings.drawArea.height)
	}

	initialize(renderer: Renderer, gui: GUI) {
		this.renderer = renderer
		this.tipibotArea = renderer.createRectangle(this.computeTipibotArea())
		this.drawArea = renderer.createRectangle(this.computeDrawArea())
		this.motorLeft = renderer.createCircle(0, 0, 50, 24)
		this.motorRight = renderer.createCircle(Settings.tipibot.width, 0, 50, 24)
		this.pen = renderer.createPen(Settings.tipibot.homeX, Settings.tipibot.homeY, Settings.tipibot.width)
		this.home = renderer.createTarget(Settings.tipibot.homeX, Settings.tipibot.homeY, Pen.HOME_RADIUS)
		let moveButtonSize = 25
		let drawAreaBounds = this.drawArea.getBounds()
		let homePoint = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
 		let moveToButtonClicked = this.moveToButtonClicked.bind(this)
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.topLeft().subtract(moveButtonSize), drawAreaBounds.topLeft().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.topRight().subtract(moveButtonSize), drawAreaBounds.topRight().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.bottomLeft().subtract(moveButtonSize), drawAreaBounds.bottomLeft().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.bottomRight().subtract(moveButtonSize), drawAreaBounds.bottomRight().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(homePoint.subtract(moveButtonSize), homePoint.add(moveButtonSize))), false, moveToButtonClicked))
		settingsManager.setTipibot(this)
		this.createGUI(gui)
	}

	moveToButtonClicked(event: MouseEvent, moveToButton: InteractiveItem) {
		let moveType = Pen.moveTypeFromMouseEvent(event)
		let point = moveToButton.shape.getBounds().getCenter()
		if(moveType == MoveType.Direct) {
			this.moveDirect(point)
		} else if(moveType == MoveType.DirectFullSpeed) {
			this.moveDirectFullSpeed(point)
		} else {
			this.moveLinear(point)
		}
	}

	updateMoveToButtons() {
		let homePoint = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		let drawAreaBounds = this.drawArea.getBounds()
		this.moveToButtons[0].setPosition(drawAreaBounds.topLeft())
		this.moveToButtons[1].setPosition(drawAreaBounds.topRight())
		this.moveToButtons[2].setPosition(drawAreaBounds.bottomLeft())
		this.moveToButtons[3].setPosition(drawAreaBounds.bottomRight())
		this.moveToButtons[4].setPosition(homePoint)
	}

	sizeChanged(sendChange: boolean) {
		this.motorRight.update(Settings.tipibot.width, 0, 50)
		this.tipibotArea.updateRectangle(this.computeTipibotArea())
		this.drawArea.updateRectangle(this.computeDrawArea())
		this.pen.tipibotWidthChanged()
		if(sendChange) {
			communication.interpreter.sendSize()
		}
		this.renderer.centerOnTipibot(this.tipibotArea.getBounds(), true)
		this.updateMoveToButtons()
	}

	drawAreaChanged(sendChange: boolean) {
		this.drawArea.updateRectangle(this.computeDrawArea())
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
		if(!this.initializedCommunication) {
			communication.interpreter.initialize()
		}
	}

	setPosition(point: paper.Point, sendChange=true) {
		this.pen.setPosition(point, false, false)
		if(sendChange) {
			this.checkInitialized()
			communication.interpreter.sendSetPosition(point)
		}
	}

	setPositionToHome(sendChange=true) {
		let point = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.setPosition(point)
	}

	sendInvertXY() {
		communication.interpreter.sendInvertXY()
		communication.interpreter.sendSetPosition(this.getPosition())
	}

	sendProgressiveMicrosteps() {
		communication.interpreter.sendProgressiveMicrosteps()
	}

	move(moveType: MoveType, point: paper.Point, callback: () => any = null, movePen=true) {
		this.checkInitialized()

		if(moveType == MoveType.Direct) {
			communication.interpreter.sendMoveDirect(point, callback)
		} else if(moveType == MoveType.DirectFullSpeed) {
			communication.interpreter.sendMoveDirectFullSpeed(point, callback)
		} else if(moveType == MoveType.Linear) {
			communication.interpreter.sendMoveLinear(point, callback)
		} else if(moveType == MoveType.LinearFullSpeed) {
			communication.interpreter.sendMoveLinearFullSpeed(point, callback)
		}

		this.enableMotors(false)
		if(movePen) {
			this.pen.setPosition(point, true, false)
		}
	}

	moveDirect(point: paper.Point, callback: () => any = null, movePen=true) {
		this.move(MoveType.Direct, point, callback, movePen)
	}

	moveDirectFullSpeed(point: paper.Point, callback: () => any = null, movePen=true) {
		this.move(MoveType.DirectFullSpeed, point, callback, movePen)
	}

	moveLinear(point: paper.Point, callback: () => any = null, movePen=true) {
		this.move(MoveType.Linear, point, callback, movePen)
	}

	moveLinearFullSpeed(point: paper.Point, callback: () => any = null, movePen=true) {
		this.move(MoveType.LinearFullSpeed, point, callback, movePen)
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

	penWidthChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendPenWidth(Settings.tipibot.penWidth)
		}
		PlotInterface.currentPlot.updateShape()
	}

	servoChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendPenLiftRange()
			communication.interpreter.sendPenDelays()
			communication.interpreter.sendServoSpeed()
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

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null, force=false) {
		if(!this.pen.isPenUp || force) {
			this.pen.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback)
			this.penStateButton.setName('Pen down')
		}
	}

	penDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null, force=false) {
		if(this.pen.isPenUp || force) {
			this.pen.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback)
			this.penStateButton.setName('Pen up')
		}
	}

	setHome(setPosition=true) {
		let homePosition = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.home.setPosition(homePosition)
		if(setPosition) {
			this.setPosition(homePosition)
		}
		this.updateMoveToButtons()
	}

	goHome(callback: ()=> any = null) {
		this.penUp(SettingsManager.servoUpAngle(), Settings.servo.delay.up.before, Settings.servo.delay.up.after, null, true)
		// this.penUp(null, null, null, true)
		// The pen will make me (tipibot) move :-)
		this.pen.setPosition(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY), true, true, MoveType.Direct, callback)
	}

	keyDown(event:KeyboardEvent) {
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

	windowResize() {
		this.motorRight.update(Settings.tipibot.width, 0, 50)
		this.tipibotArea.updateRectangle(this.computeTipibotArea())
		this.drawArea.updateRectangle(this.computeDrawArea())
	}
}

export let tipibot: Tipibot = new Tipibot()