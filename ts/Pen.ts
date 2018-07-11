import { Communication, communication } from "./Communication/Communication"
import { Settings, SettingsManager, settingsManager } from "./Settings"
import { tipibot } from "./Tipibot"

export enum MoveType {
    Direct,
    Linear,
}

export class Pen {
	public static HOME_RADIUS = 10
	public static RADIUS = 20
	public static UP_COLOR = 'rgba(0, 20, 210, 0.25)'
	public static DOWN_COLOR = 'rgba(0, 20, 210, 0.75)'

	isPenUp: boolean 						// TODO: this variable is both used to tell feedback and to store gui controller state: this must be improved!
	dragging: boolean

	group: paper.Group
	circle: paper.Path
	lines: paper.Path

	previousPosition: paper.Point

	static moveTypeFromMouseEvent(event: MouseEvent) {
		return 	Settings.forceLinearMoves || event.altKey ? MoveType.Linear : MoveType.Direct
	}

	constructor(x: number, y:number, tipibotWidth: number) {
		this.isPenUp = true
		this.dragging = false
		this.initialize(x, y, tipibotWidth)
	}

	initialize(x: number, y:number, tipibotWidth: number) {
		this.group = new paper.Group()

		this.circle = paper.Path.Circle(new paper.Point(x, y), Pen.RADIUS)
		this.circle.fillColor = Pen.UP_COLOR
		this.group.addChild(this.circle)

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(new paper.Point(x, y))
		this.lines.add(new paper.Point(tipibotWidth, 0))

		this.group.addChild(this.lines)

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
		return this.circle.position
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
				tipibot.moveLinear(point, 0, callback)
			}
		}
		this.circle.position = point
		this.lines.segments[1].point = point
	}

	tipibotWidthChanged() {
		this.lines.segments[2].point.x = Settings.tipibot.width
	}

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		let penUpCallback = ()=> {
			this.isPenUp = true
			if(callback != null) {
				callback()
			}
		}
		communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, penUpCallback)
		this.circle.fillColor = Pen.UP_COLOR
		this.isPenUp = true
	}
	
	penDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		let penDownCallback = ()=> {
			this.isPenUp = false
			if(callback != null) {
				callback()
			}
		}
		communication.interpreter.sendPenDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, penDownCallback)
		this.circle.fillColor = Pen.DOWN_COLOR
		this.isPenUp = false
	}
}