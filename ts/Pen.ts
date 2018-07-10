import { Communication, communication } from "./Communication/Communication"
import { InteractiveItem } from "./InteractiveItem"
import { Settings, SettingsManager, settingsManager } from "./Settings"
import { tipibot } from "./Tipibot"
import { Renderer } from "./RendererInterface"

export enum MoveType {
    Direct,
    Linear,
}

export class Pen extends InteractiveItem {
	public static HOME_RADIUS = 10
	public static RADIUS = 20
	isPenUp: boolean 						// TODO: this variable is both used to tell feedback and to store gui controller state: this must be improved!

	static moveTypeFromMouseEvent(event: MouseEvent) {
		return 	Settings.forceLinearMoves || event.altKey ? MoveType.Linear : MoveType.Direct
	}

	constructor(renderer: Renderer) {
		super(renderer, null, true)
		this.isPenUp = true
	}

	tipibotWidthChanged() {
	}

	getPosition(): paper.Point {
		return this.shape.getPosition() // will be overloaded
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
	}

	mouseStop(event: MouseEvent) {
		if(this.dragging) {
			this.setPosition(this.getPosition(), true, true, Pen.moveTypeFromMouseEvent(event))
		}
		return super.mouseStop(event)
	}

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		let penUpCallback = ()=> {
			this.isPenUp = true
			if(callback != null) {
				callback()
			}
		}
		communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, penUpCallback)
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
		this.isPenUp = false
	}
}

export class PaperPen extends Pen {

	circle: paper.Path
	lines: paper.Path

	constructor(renderer: Renderer) {
		super(renderer)
	}

	initialize(x: number, y:number, tipibotWidth: number, layer: paper.Layer = null) {
		this.circle = paper.Path.Circle(new paper.Point(x, y), Pen.RADIUS)
		this.circle.strokeWidth = 0.5
		this.circle.strokeColor = 'black'
		this.circle.fillColor = null
		this.circle.strokeScaling = false

		this.shape = this.renderer.createShape(this.circle)

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(new paper.Point(x, y))
		this.lines.add(new paper.Point(tipibotWidth, 0))

		this.lines.strokeWidth = 0.5
		this.lines.strokeColor = 'black'
		this.lines.strokeScaling = false

		this.previousPosition = new paper.Point(0, 0)
		
		if(layer) {
			layer.addChild(this.circle)
			layer.addChild(this.lines)
		}
	}

	getPosition(): paper.Point {
		return this.circle.position
	}

	setPosition(point: paper.Point, updateSliders: boolean=true, move: boolean=true, moveType: MoveType=MoveType.Direct, callback: ()=> any = null) {
		if(point == null || Number.isNaN(point.x) || Number.isNaN(point.y)) {
			return
		}
		super.setPosition(point, updateSliders, move, moveType, callback)
		this.circle.position = point
		this.lines.segments[1].point = point
	}

	drag(delta: paper.Point) {
		this.setPosition(this.circle.position.add(delta), true, false)
	}

	tipibotWidthChanged() {
		this.lines.segments[2].point.x = Settings.tipibot.width
	}

	penUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		super.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback)
		this.circle.fillColor = null
		this.isPenUp = true
	}
	
	penDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		super.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback)
		this.circle.fillColor = 'rgba(0, 0, 0, 0.25)'
		this.isPenUp = false
	}
}

export class ThreePen extends Pen {

	circle: THREE.Mesh
	camera: THREE.Camera
	lines: THREE.Line

	constructor(renderer: Renderer) {
		super(renderer)
	}

	initialize(x: number, y:number, tipibotWidth: number, camera: THREE.Camera, scene: THREE.Scene = null, lineMat: THREE.LineBasicMaterial = null) {
		let geometry = new THREE.CircleGeometry( Pen.RADIUS, 32 )
		let material = new THREE.MeshBasicMaterial( { color: 0x4274f4, opacity: 0.7, transparent: true } )
		this.circle = new THREE.Mesh( geometry, material )
		this.circle.position.x = x
		this.circle.position.y = y
		this.circle.rotation.x = Math.PI

		let lineGeometry = new THREE.Geometry()
		let lineMaterial = lineMat != null ? lineMat : new THREE.LineBasicMaterial({ color: 0xffffff })

		lineGeometry.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( x, y, 0 ),
			new THREE.Vector3( tipibotWidth, 0, 0 )
		)

		this.lines = new THREE.Line(lineGeometry, lineMaterial)

		this.camera = camera

		if(scene) {
			scene.add(this.lines)
			scene.add(this.circle)
		}

	}

	getPosition(): paper.Point {
		return this.vectorToPoint(this.circle.position)
	}

	setPosition(point: paper.Point, updateSliders: boolean=true, move: boolean=true, moveType: MoveType=MoveType.Direct, callback: ()=> any = null) {
		if(point == null || Number.isNaN(point.x) || Number.isNaN(point.y)) {
			return
		}
		super.setPosition(point, updateSliders, move, moveType, callback)
		let position = this.pointToVector(point)
		this.circle.position.copy(position)
		let geometry = <THREE.Geometry>this.lines.geometry
		geometry.vertices[1].copy(position)
		geometry.verticesNeedUpdate = true
	}
	
	tipibotWidthChanged() {
		let geometry = <THREE.Geometry>this.lines.geometry
		geometry.vertices[2].x = Settings.tipibot.width
		geometry.verticesNeedUpdate = true
	}

	pointToVector(point: paper.Point): THREE.Vector3 {
		return new THREE.Vector3(point.x, point.y, 0)
	}

	vectorToPoint(point: THREE.Vector3): paper.Point {
		return new paper.Point(point.x, point.y)
	}

	mouseDown(event:MouseEvent): boolean {
		let position = this.getWorldPosition(event)
		if(position.getDistance(new paper.Point(this.circle.position.x, this.circle.position.y), true) < Pen.RADIUS * Pen.RADIUS) {
			this.dragging = true
			this.previousPosition = position.clone()
			return false
		}
		return true
	}

	mouseMove(event:MouseEvent): boolean {

		let position = this.getWorldPosition(event)
		if(this.dragging) {
			let circlePosition = this.vectorToPoint(this.circle.position)
			this.setPosition(circlePosition.add(position.subtract(this.previousPosition)), true, false)

			this.previousPosition = position.clone()
			return false
		}
		return true
	}

	mouseUp(event:MouseEvent): boolean {
		return this.mouseStop(event)
	}

	mouseLeave(event:MouseEvent): boolean {
		return this.mouseStop(event)
	}
}