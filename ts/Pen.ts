import { Communication, communication } from "./Communication/Communication"
import { Settings, SettingsManager, settingsManager } from "./Settings"
import { tipibot } from "./Tipibot"

export enum MoveType {
    Direct,
    Linear,
}

export class Pen {
	public static HOME_RADIUS = 6
	public static RADIUS = 6
	public static UP_COLOR = 'rgba(0, 20, 210, 0.25)'
	public static DOWN_COLOR = 'rgba(0, 20, 210, 0.8)'

	isUp: boolean 						// TODO: this variable is used to store the gui state, not the actual robot state
	dragging: boolean

	group: paper.Group
	circle: paper.Path
	offsetLine: paper.Path
	lines: paper.Path

	previousPosition: paper.Point

	static moveTypeFromMouseEvent(event: MouseEvent) {
		return 	event.altKey ? MoveType.Linear : MoveType.Direct
	}

	constructor(x: number, y:number, offset: number, tipibotWidth: number) {
		this.isUp = true
		this.dragging = false
		this.initialize(x, y, offset, tipibotWidth)
	}

	initialize(x: number, y:number, offset: number, tipibotWidth: number) {
		this.group = new paper.Group()

		let penPosition = new paper.Point(x, y)
		let gondolaPosition = new paper.Point(x, y - offset)

		this.circle = paper.Path.Circle(penPosition, Pen.RADIUS)
		this.circle.fillColor = Pen.UP_COLOR
		this.group.addChild(this.circle)

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(gondolaPosition)
		this.lines.add(new paper.Point(tipibotWidth, 0))
		this.group.addChild(this.lines)

		this.offsetLine = new paper.Path()
		this.offsetLine.add(gondolaPosition)
		this.offsetLine.add(penPosition)
		this.group.addChild(this.offsetLine)

		this.previousPosition = new paper.Point(0, 0)

		this.group.onMouseDrag = (event:MouseEvent) => this.onMouseDrag(event)
		this.group.onMouseUp = (event:MouseEvent) => this.onMouseUp(event)
	}

	onMouseDrag(event:any) {
		this.setPosition(this.circle.position.add(event.delta), true, false)
		this.dragging = true
	}

	onMouseUp(event: MouseEvent) {
		if(this.dragging) {
			this.setPosition(this.getPosition(), true, true, Pen.moveTypeFromMouseEvent(event))
		}
		this.dragging = false
	}

	getPosition(): paper.Point {
		return this.circle.position.clone()
	}

	setPosition(point: paper.Point, updateSliders: boolean=true, move: boolean=true, moveType: MoveType=MoveType.Direct, callback: ()=> any = null) {
		if(point == null || Number.isNaN(point.x) || Number.isNaN(point.y)) {
			return
		}
		if(updateSliders) {
			tipibot.setPositionSliders(point)
		}
		if(move) {
			if(moveType == MoveType.Direct) {
				tipibot.moveDirect(point, callback)
			} else {
				tipibot.moveLinear(point, 0, Settings.tipibot.maxSpeed, callback)
			}
		}
		let center = new paper.Point(point.x, point.y - Settings.tipibot.penOffset)
		this.circle.position = point
		this.lines.segments[1].point = center
		this.offsetLine.segments[0].point = center
		this.offsetLine.segments[1].point = point
	}

	tipibotWidthChanged() {
		this.lines.segments[2].point.x = Settings.tipibot.width
	}

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		let penUpCallback = ()=> {
			this.isUp = true
			if(callback != null) {
				callback()
			}
		}
		communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, penUpCallback)
		this.circle.fillColor = Pen.UP_COLOR
		this.isUp = true
	}
	
	penDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		let penDownCallback = ()=> {
			this.isUp = false
			if(callback != null) {
				callback()
			}
		}
		communication.interpreter.sendPenDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, penDownCallback)
		this.circle.fillColor = Pen.DOWN_COLOR
		this.isUp = false
	}
}