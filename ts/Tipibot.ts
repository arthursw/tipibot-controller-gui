import { Communication, communication } from "./Communication/Communication"
import { Settings, settingsManager } from "./Settings"
import { Rectangle, Circle} from "./Shapes"
import { Renderer } from "./Renderers"
import { Pen } from "./Pen"
import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"

export class Tipibot implements TipibotInterface {

	isPenUp: boolean

	area: Rectangle
	paper: Rectangle
	motorLeft: Circle
	motorRight: Circle
	pen: Pen

	xSlider: Controller = null
	ySlider: Controller = null
	setPositionButton: Controller = null
	penStateButton: Controller = null
	settingPosition: boolean = false

	constructor() {
		this.isPenUp = true
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
		let x = ( r2 * r2 + w * w - r1 * r1 ) / (2 * w)
		let y = Math.sqrt( r1 * r1 - x * x )
		return new paper.Point(x, y)
	}
	
	createGUI(gui: GUI) {
		let setHomeButton = gui.addButton('Set home', ()=> this.setHome())
		let goHomeButton = gui.addButton('Go home', ()=> this.goHome())

		let position = this.getPosition().clone()
		this.xSlider = gui.add(position, 'x', 0, Settings.tipibot.width).name('X').onChange((value: number)=>{this.setX(value)})
		this.ySlider = gui.add(position, 'y', 0, Settings.tipibot.height).name('Y').onChange((value: number)=>{this.setY(value)})

		this.setPositionButton = gui.addButton('Set position', () => this.toggleSetPosition() )
		this.penStateButton = gui.addButton('Pen down', () => this.changePenState() )
		let motorsOffButton = gui.addButton('Motors off', ()=> this.motorsOff())
	}

	setPositionSliders(point: paper.Point) {
		this.xSlider.setValueNoCallback(point.x)
		this.ySlider.setValueNoCallback(point.y)
	}

	toggleSetPosition(setPosition: boolean = !this.settingPosition) {
		if(!setPosition) {
			this.setPositionButton.setName('Set position')
		} else {
			this.setPositionButton.setName('Cancel')
		}
		this.settingPosition = setPosition
	}
	
	changePenState() {
		if(this.isPenUp) {
			this.penDown()
		} else {
			this.penUp()
		}
	}

	tipibotRectangle() {
		return new paper.Rectangle(0, 0, Settings.tipibot.width, Settings.tipibot.height)
	}
	
	paperRectangle() {
		return new paper.Rectangle(Settings.tipibot.width / 2 - Settings.drawArea.width / 2, Settings.drawArea.y, Settings.drawArea.width, Settings.drawArea.height)
	}

	initialize(renderer: Renderer) {
		this.area = renderer.createRectangle(this.tipibotRectangle())
		this.paper = renderer.createRectangle(this.paperRectangle())
		this.motorLeft = renderer.createCircle(0, 0, 50, 24)
		this.motorRight = renderer.createCircle(Settings.tipibot.width, 0, 50, 24)
		this.pen = renderer.createPen(Settings.tipibot.homeX, Settings.tipibot.homeY, Settings.tipibot.width)
		settingsManager.addTipibotToGUI(this)
	}
	
	settingChanged(parentName: string, name: string, value: any) {

	}

	settingsChanged() {
		this.xSlider.max(Settings.tipibot.width)
		this.ySlider.max(Settings.tipibot.height)

		this.xSlider.setValue(Settings.tipibot.homeX)
		this.ySlider.setValue(Settings.tipibot.homeY)

		this.area.updateRectangle(this.tipibotRectangle())
		this.paper.updateRectangle(this.paperRectangle())
		this.motorRight.update(Settings.tipibot.width, 0, 50)
		this.pen.tipibotWidthChanged()
	}

	sizeChanged(sendChange: boolean) {
		this.motorRight.update(Settings.tipibot.width, 0, 50)
		this.area.updateRectangle(this.tipibotRectangle())
		this.paper.updateRectangle(this.paperRectangle())
		if(sendChange) {
			communication.interpreter.sendSize()
		}
	}

	drawAreaChanged(sendChange: boolean) {
		this.paper.updateRectangle(this.paperRectangle())
	}

	speedChanged(sendChange: boolean) {
		if(sendChange) {
			communication.interpreter.sendSpeed()
		}
	}

	getPosition() {
		return this.pen.getPosition()
	}

	setX(x: number, sendChange=true) {
		let p = this.getPosition()
		this.setPosition(new paper.Point(x, p.y), sendChange)
	}

	setY(y: number, sendChange=true) {
		let p = this.getPosition()
		this.setPosition(new paper.Point(p.x, y), sendChange)
	}

    setPosition(point: paper.Point, sendChange=true) {
    	this.pen.setPosition(point, false, false)
    	if(sendChange) {
    		communication.interpreter.sendSetPosition(point)
    	}
    }

	moveDirect(point: paper.Point, callback: () => any = null) {
		communication.interpreter.sendMoveDirect(point, callback)
	}

	moveLinear(point: paper.Point, callback: () => any = null) {
		communication.interpreter.sendMoveLinear(point, callback)
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

	penUp(servoUpValue: number = Settings.servo.position.up, servoUpTempo: number = Settings.servo.delay.up) {
		if(!this.isPenUp) {
			communication.interpreter.sendPenUp(servoUpValue, servoUpTempo)
			this.penStateButton.setName('Pen down')
			this.isPenUp = true
		}
	}

	penDown(servoDownValue: number = Settings.servo.position.down, servoDownTempo: number = Settings.servo.delay.down) {
		if(this.isPenUp) {
			communication.interpreter.sendPenDown(servoDownValue, servoDownTempo)
			this.penStateButton.setName('Pen up')
			this.isPenUp = false
		}
	}

	setHome() {
		this.setPosition(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY))
	}

	goHome() {
		this.penUp()
		// The pen will make me (tipibot) move :-)
		this.pen.setPosition(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY), true, true)
	}

	motorsOff() {
		communication.interpreter.sendMotorOff()
	}

	keyDown(event:KeyboardEvent) {

		switch (event.keyCode) {
			case 37: 			// left arrow
				this.moveDirect(this.getPosition().add(new paper.Point(-1, 0)))
				break;
			case 38: 			// up arrow
				this.moveDirect(this.getPosition().add(new paper.Point(0, -1)))
				break;
			case 39: 			// right arrow
				this.moveDirect(this.getPosition().add(new paper.Point(1, 0)))
				break;
			case 40: 			// down arrow
				this.moveDirect(this.getPosition().add(new paper.Point(0, 1)))
				break;
			
			default:
				break;
		}
	}

	windowResize() {
		this.motorRight.update(Settings.tipibot.width, 0, 50)
		this.area.updateRectangle(this.tipibotRectangle())
		this.paper.updateRectangle(this.paperRectangle())
	}
}

export let tipibot: Tipibot = new Tipibot()