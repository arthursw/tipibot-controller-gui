import { Communication, communication } from "./Communication/Communication"
import { InteractiveItem } from "./InteractiveItem"
import { Settings, settingsManager } from "./Settings"
import { tipibot } from "./Tipibot"
import { Renderer } from "./RendererInterface"

export class Pen extends InteractiveItem {
	public static HOME_RADIUS = 10
	public static RADIUS = 20

	constructor(renderer: Renderer) {
		super(renderer, null, true)
	}

	tipibotWidthChanged() {
	}

	getPosition(): paper.Point {
		return this.shape.getPosition() // will be overloaded
	}

	setPosition(point: paper.Point, updateSliders: boolean=true, move: boolean=true, callback: ()=> any = null) {
		if(updateSliders) {
			tipibot.setPositionSliders(point)
		}
		if(move) {
			tipibot.moveDirect(point, callback)
		}
	}

	mouseStop(event: MouseEvent): boolean {
		return super.mouseStop(event)
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
		this.circle.strokeWidth = 1
		this.circle.strokeColor = 'black'
		this.circle.fillColor = 'black'

		this.shape = this.renderer.createShape(this.circle)

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(new paper.Point(x, y))
		this.lines.add(new paper.Point(tipibotWidth, 0))

		this.lines.strokeWidth = 1
		this.lines.strokeColor = 'black'

		this.previousPosition = new paper.Point(0, 0)
		
		if(layer) {
			layer.addChild(this.circle)
			layer.addChild(this.lines)
		}
	}

	getPosition(): paper.Point {
		return this.circle.position
	}

	setPosition(point: paper.Point, updateSliders: boolean=true, move: boolean=true, callback: ()=> any = null) {
		this.circle.position = point
		this.lines.segments[1].point = point
		super.setPosition(point, updateSliders, move, callback)
	}

	drag(delta: paper.Point) {
		this.setPosition(this.circle.position.add(delta), true, false)
	}

	mouseStop(event: MouseEvent) {
		if(this.dragging) {
			this.setPosition(this.circle.position)
		}
		return super.mouseStop(event)
	}

	tipibotWidthChanged() {
		this.lines.segments[2].point.x = Settings.tipibot.width
	}
}

export class ThreePen extends Pen {

	circle: THREE.Mesh
	camera: THREE.OrthographicCamera
	lines: THREE.Line

	constructor(renderer: Renderer) {
		super(renderer)
	}

	initialize(x: number, y:number, tipibotWidth: number, camera: THREE.OrthographicCamera, scene: THREE.Scene = null, lineMat: THREE.LineBasicMaterial = null) {
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

	setPosition(point: paper.Point, updateSliders: boolean=true, move: boolean=true, callback: ()=> any = null) {
		let position = this.pointToVector(point)
		this.circle.position.copy(position)
		let geometry = <THREE.Geometry>this.lines.geometry
		geometry.vertices[1].copy(position)
		geometry.verticesNeedUpdate = true
		super.setPosition(point, updateSliders, move, callback)
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