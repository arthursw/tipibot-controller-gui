import { Communication, communication } from "./Communication"
import { Settings, settingsManager } from "./Settings"
import { Rectangle, Circle} from "./Shapes"
import { Renderer } from "./Renderers"
import { Pen } from "./Pen"

export class Tipibot {

	isPenUp: boolean

	area: Rectangle
	paper: Rectangle
	motorLeft: Circle
	motorRight: Circle
	pen: Pen

	constructor() {
		this.isPenUp = true
	}
	
	createGUI(gui: any) {
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
			settingsManager.penUp()
			this.isPenUp = true
		}
	}

	penDown(servoDownValue: number = Settings.servo.position.down, servoDownTempo: number = Settings.servo.delay.down) {
		if(this.isPenUp) {
			communication.sendPenUp(servoDownValue, servoDownTempo)
			settingsManager.penDown()
			this.isPenUp = false
		}
	}

	goHome() {
		this.penUp()
		this.moveDirect(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY))
	}
}

export let tipibot: Tipibot = new Tipibot()