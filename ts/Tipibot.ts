import { Communication, communication } from "./Communication/Communication"
import { Settings, settingsManager } from "./Settings"
import { Rectangle, Circle, Target} from "./Shapes"
import { Renderer } from "./RendererInterface"
import { InteractiveItem } from "./InteractiveItem"
import { Pen } from "./Pen"
import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"
import { PlotInterface } from "./PlotInterface"

export class Tipibot implements TipibotInterface {

	gui:GUI = null
	renderer: Renderer = null

	isPenUp: boolean

	tipibotArea: Rectangle
	drawArea: Rectangle
	moveToButtons: InteractiveItem[]
	motorLeft: Circle
	motorRight: Circle
	home: Target
	pen: Pen

	penStateButton: Controller = null
	settingPosition: boolean = false

	initialPosition: paper.Point = null

	constructor() {
		this.isPenUp = true
		this.moveToButtons = []
	}

	mmPerSteps() {
		return Settings.tipibot.mmPerRev / Settings.tipibot.stepsPerRev;
	}

	stepsPerMm() {
		return Settings.tipibot.stepsPerRev / Settings.tipibot.mmPerRev;
	}

	mmToSteps(point: paper.Point): paper.Point {
		return point.multiply(this.stepsPerMm())
	}

	cartesianToLengths(point: paper.Point): paper.Point {
		let lx2 = Settings.tipibot.width - point.x
		return new paper.Point(Math.sqrt(point.x * point.x + point.y * point.y), Math.sqrt(lx2 * lx2 + point.y * point.y))
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
		let motorsOffButton = gui.addButton('Motors off', ()=> this.motorsOff())

		gui.add({'Pause': false}, 'Pause').onChange((value) => communication.interpreter.setPause(value))
		gui.addButton('Stop & Clear queue', () => communication.interpreter.stopAndClearQueue() )
	}

	setPositionSliders(point: paper.Point) {
		settingsManager.tipibotPositionFolder.getController('x').setValue(point.x, false)
		settingsManager.tipibotPositionFolder.getController('y').setValue(point.y, false)
		this.gui.getController('moveX').setValue(point.x, false)
		this.gui.getController('moveY').setValue(point.y, false)
	}

	toggleSetPosition(setPosition: boolean = !this.settingPosition, cancel=true) {
		if(!setPosition) {
			settingsManager.tipibotPositionFolder.getController('Set position').setName('Set position')
			if(cancel) {
				this.setPositionSliders(this.initialPosition)
			}
		} else {
			settingsManager.tipibotPositionFolder.getController('Set position').setName('Cancel')
			this.initialPosition = this.getPosition()
		}
		this.settingPosition = setPosition
	}
	
	togglePenState() {
		let callback = ()=> console.log('pen state changed')
		if(this.isPenUp) {
			this.penDown(Settings.servo.position.down, Settings.servo.delay.down.before, Settings.servo.delay.down.after, callback)
		} else {
			this.penUp(Settings.servo.position.up, Settings.servo.delay.up.before, Settings.servo.delay.up.after, callback)
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
		let moveToButtonClicked = (event: MouseEvent, moveToButton: InteractiveItem)=> {
			this.moveDirect(moveToButton.shape.getBounds().getCenter())
		}
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.topLeft().subtract(moveButtonSize), drawAreaBounds.topLeft().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.topRight().subtract(moveButtonSize), drawAreaBounds.topRight().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.bottomLeft().subtract(moveButtonSize), drawAreaBounds.bottomLeft().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.bottomRight().subtract(moveButtonSize), drawAreaBounds.bottomRight().add(moveButtonSize))), false, moveToButtonClicked))
		this.moveToButtons.push(new InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(homePoint.subtract(moveButtonSize), homePoint.add(moveButtonSize))), false, moveToButtonClicked))
		settingsManager.setTipibot(this)
		this.createGUI(gui)
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

	speedChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendSpeed()
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
		if(Math.abs(x - p.x) > 0.01) {
			this.setPosition(new paper.Point(x, p.y), sendChange)
		}
	}

	setY(y: number, sendChange=true) {
		let p = this.getPosition()
		if(Math.abs(y - p.y) > 0.01) {
			this.setPosition(new paper.Point(p.x, y), sendChange)
		}
	}

    setPosition(point: paper.Point, sendChange=true) {
		this.pen.setPosition(point, false, false)
		if(sendChange) {
			communication.interpreter.sendSetPosition(point)
		}
    }

	moveDirect(point: paper.Point, callback: () => any = null, movePen=true) {
		communication.interpreter.sendMoveDirect(point, callback)
		if(movePen) {
			this.pen.setPosition(point, true, false)
		}
	}

	moveLinear(point: paper.Point, callback: () => any = null, movePen=true) {
		communication.interpreter.sendMoveLinear(point, callback)
		if(movePen) {
			this.pen.setPosition(point, true, false)
		}
	}

	setSpeed(speed: number) {
		communication.interpreter.sendSpeed(speed)
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

	stepMultiplierChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendStepMultiplier(Settings.tipibot.stepMultiplier)
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
		}
	}

	tipibotSpecs() {
		communication.interpreter.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, Settings.tipibot.mmPerRev, Settings.tipibot.stepMultiplier)
	}

	pause(delay: number) {
		communication.interpreter.sendPause(delay)
	}

	motorOff() {
		communication.interpreter.sendMotorOff()
	}

	penUp(servoUpValue: number = Settings.servo.position.up, servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null, force=false) {
		if(!this.isPenUp || force) {
			communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback)
			this.penStateButton.setName('Pen down')
			this.isPenUp = true
		}
	}

	penDown(servoDownValue: number = Settings.servo.position.down, servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null, force=false) {
		if(this.isPenUp || force) {
			communication.interpreter.sendPenDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback)
			this.penStateButton.setName('Pen up')
			this.isPenUp = false
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
		this.penUp(Settings.servo.position.up, Settings.servo.delay.up.before, Settings.servo.delay.up.after, null, true)
		// this.penUp(null, null, null, true)
		// The pen will make me (tipibot) move :-)
		this.pen.setPosition(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY), true, true, callback)
	}

	motorsOff() {
		communication.interpreter.sendMotorOff()
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