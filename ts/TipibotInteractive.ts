import $ = require("jquery");
import { Communication } from "./Communication/CommunicationStatic"
import { Settings, paper, servoDownAngle, servoUpAngle } from "./Settings"
import { settingsManager } from "./SettingsManager"
import { Pen, PenState } from "./Pen"
import { GUI, Controller } from "./GUI"
import { MoveType } from "./TipibotInterface"
import { Tipibot } from "./TipibotStatic"

export class TipibotInteractive extends Tipibot {

	gui: GUI
	penStateButton: Controller = null
	motorsEnableButton: Controller = null

	static tipibot: TipibotInteractive

	constructor() {
		super()
		document.addEventListener('ZoomChanged', (event: CustomEvent)=> this.onZoomChanged(), false)
		Tipibot.tipibot = this
		TipibotInteractive.tipibot = this
	}

	setPositionSliders(point: paper.Point) {
		settingsManager.tipibotPositionFolder.getController('x').setValue(point.x, false)
		settingsManager.tipibotPositionFolder.getController('y').setValue(point.y, false)
		this.gui.getController('moveX').setValue(point.x, false)
		this.gui.getController('moveY').setValue(point.y, false)
	}

	toggleSetPosition(setPosition: boolean = !this.settingPosition, cancel=true) {
		super.toggleSetPosition(setPosition, cancel)
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
		if(this.pen.state == PenState.Up) {
			this.penDown(servoDownAngle(), Settings.servo.delay.down.before, Settings.servo.delay.down.after, callback, true)
		} else {
			this.penUp(servoUpAngle(), Settings.servo.delay.up.before, Settings.servo.delay.up.after, callback, true)
		}
	}

	createTarget(x: number, y: number, radius: number) {
		let group = new paper.Group()

		let position = new paper.Point(x, y)
		let circle = new paper.Path.Circle(position, radius)
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
		let rectangle = new paper.Path.Rectangle(position.subtract(size), position.add(size))
		rectangle.fillColor = new paper.Color('rgba(0, 0, 0, 0.05)')
		rectangle.onMouseUp = (event: MouseEvent)=> this.moveToButtonClicked(event, rectangle.position)
		return rectangle
	}

	initialize() {
		super.initialize()
		settingsManager.setTipibot(this)
		
		this.home = this.createTarget(Settings.tipibot.homeX, Settings.tipibot.homeY, Pen.HOME_RADIUS)
		
		let homePoint = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)

		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.topLeft))
		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.topRight))
		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.bottomLeft))
		this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.bottomRight))
		this.moveToButtons.push(this.createMoveToButton(homePoint))
		
		this.pen.group.bringToFront()
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
		let scaling = new paper.Point(1 / paper.project.view.zoom, 1 / paper.project.view.zoom)
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

	sizeChanged(sendChange: boolean) {
		super.sizeChanged(sendChange)
		this.updateMoveToButtons()
	}

	drawAreaChanged(sendChange: boolean) {
		super.drawAreaChanged(sendChange)
		this.updateMoveToButtons()
	}
	
	disableMotors(send: boolean) {
		super.disableMotors(send)
		this.motorsEnableButton.setName('Enable motors')
	}

	enableMotors(send: boolean) {
		super.enableMotors(send)
		this.motorsEnableButton.setName('Disable motors')
	}

	penUp(servoUpValue: number = servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null, force=false) {
		let liftPen = super.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback, force)
		if(liftPen) {
			this.penStateButton.setName('Pen down')
		}
		return liftPen
	}

	penDown(servoDownValue: number = servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null, force=false) {
		let lowerPen = super.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback, force)
		if(lowerPen) {
			this.penStateButton.setName('Pen up')
		}
		return lowerPen
	}

	keyDown(event:KeyboardEvent) {
		if(this.ignoreKeyEvents) {
			return
		}
		let code = event.key
		if($.contains($('#gui').get(0), document.activeElement) && code.indexOf('Arrow') == 0) {
			console.log('Focus on the draw area to move the bot with arrows')
			return
		}
		let amount = event.shiftKey ? 25 : event.ctrlKey ? 5 : event.altKey ? 1 : 0.25
		switch (code) {
			case 'ArrowLeft': 			// left arrow
				this.moveDirect(this.getPosition().add(new paper.Point(-amount, 0)))
				break;
			case 'ArrowUp': 			// up arrow
				this.moveDirect(this.getPosition().add(new paper.Point(0, -amount)))
				break;
			case 'ArrowRight': 			// right arrow
				this.moveDirect(this.getPosition().add(new paper.Point(amount, 0)))
				break;
			case 'ArrowDown': 			// down arrow
				this.moveDirect(this.getPosition().add(new paper.Point(0, amount)))
				break;
			case 'p':
			case 'Add':
			case 'NumpadAdd': 			// +			
				if(!this.motorsEnabled) {
					this.enableMotors(true)
				}
				Communication.interpreter.sendMoveStation(1, 200*32/6, 0.0001)
				break;
			case 'm':
			case 'Subtract':
			case 'NumpadSub':
			case 'NumpadSubtract':
				if(!this.motorsEnabled) {
					this.enableMotors(true)
				}
				Communication.interpreter.sendMoveStation(0, 200*32/6, 0.0001)
				break;
			case 'Enter': 			// Enter key
				this.togglePenState()
			default:
				break;
		}
	}

	keyUp(event:KeyboardEvent) {
	}
}
let tipibot = new TipibotInteractive()