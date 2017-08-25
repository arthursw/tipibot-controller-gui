import { Communication, communication } from "./Communication"
import { Settings, settingsManager } from "./Settings"
import { Rectangle, Circle} from "./Shapes"
import { Renderer } from "./Renderers"
import { Pen } from "./Pen"
import { GUI, Controller } from "./GUI"

export class Tipibot {

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
	
	createGUI(gui: GUI) {
		let goHomeButton = gui.addButton('goHome', ()=> this.goHome())

		let position = this.getPosition()
		this.xSlider = gui.addSlider('x', position.x, 0, Settings.tipibot.width).onChange((value: number)=>{this.setX(value)})
		this.ySlider = gui.addSlider('y', position.y, 0, Settings.tipibot.height).onChange((value: number)=>{this.setY(value)})

		this.setPositionButton = gui.addButton('setPosition', () => this.toggleSetPosition() )
		this.penStateButton = gui.addButton('penDown', () => this.changePenState() )
		let motorsOffButton = gui.addButton('motorsOff', ()=> this.motorsOff())
	}

	setPositionSliders(point: paper.Point) {
		this.xSlider.setValueNoCallback(point.x)
		this.ySlider.setValueNoCallback(point.y)
	}

	toggleSetPosition(setPosition: boolean = !this.settingPosition) {
		if(!setPosition) {
			this.setPositionButton.setName('setPosition')
		} else {
			this.setPositionButton.setName('cancel')
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
		return new paper.Rectangle(Settings.tipibot.width / 2 - Settings.drawArea.width / 2 + Settings.drawArea.x, Settings.drawArea.y, Settings.drawArea.width, Settings.drawArea.height)
	}

	initialize(renderer: Renderer) {
		this.area = renderer.createRectangle(this.tipibotRectangle())
		this.paper = renderer.createRectangle(this.paperRectangle())
		this.motorLeft = renderer.createCircle(0, 0, 50, 24)
		this.motorRight = renderer.createCircle(Settings.tipibot.width, 0, 50, 24)
		this.pen = renderer.createPen(Settings.tipibot.homeX, Settings.tipibot.homeY, Settings.tipibot.width, communication)
		settingsManager.addTipibotToGUI(this)
	}

	settingsChanged() {
		this.xSlider.max(Settings.tipibot.width)
		this.ySlider.max(Settings.tipibot.height)

		this.xSlider.setValue(Settings.tipibot.homeX)
		this.ySlider.setValue(Settings.tipibot.homeY)

		this.area.updateRectangle(this.tipibotRectangle())
		this.paper.updateRectangle(this.paperRectangle())
		this.motorRight.update(Settings.tipibot.width, 0, 50)
		this.pen.settingsChanged()
	}

	getPosition() {
		return this.pen.getPosition()
	}

	setX(x: number) {
		let p = this.getPosition()
		this.setPosition(new paper.Point(x, p.y))
	}

	setY(y: number) {
		let p = this.getPosition()
		this.setPosition(new paper.Point(p.x, y))
	}

    setPosition(point: paper.Point) {
    	this.pen.setPosition(point)
    	communication.sendSetPosition(point)
    }

	moveDirect(point: paper.Point, callback: () => any = null) {
		communication.sendMoveDirect(point, callback)
	}

	moveLinear(point: paper.Point, callback: () => any = null) {
		communication.sendMoveLinear(point, callback)
	}

	setSpeed(speed: number) {
		communication.sendSpeed(speed)
	}

	tipibotSpecs(tipibotWidth: number, stepsPerRev: number, mmPerRev: number) {
		communication.sendTipibotSpecs(tipibotWidth, stepsPerRev, mmPerRev)
	}

	pause(delay: number) {
		communication.sendPause(delay)
	}

	motorOff() {
		communication.sendMotorOff()
	}

	penUp(servoUpValue: number = Settings.servo.position.up, servoUpTempo: number = Settings.servo.delay.up) {
		if(!this.isPenUp) {
			communication.sendPenUp(servoUpValue, servoUpTempo)
			this.penStateButton.setName('penDown')
			this.isPenUp = true
		}
	}

	penDown(servoDownValue: number = Settings.servo.position.down, servoDownTempo: number = Settings.servo.delay.down) {
		if(this.isPenUp) {
			communication.sendPenUp(servoDownValue, servoDownTempo)
			this.penStateButton.setName('penUp')
			this.isPenUp = false
		}
	}

	goHome() {
		this.penUp()
		this.moveDirect(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY))
	}

	motorsOff() {
		communication.sendMotorOff()
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
}

export let tipibot: Tipibot = new Tipibot()