import { Communication } from "./Communication"
import { Draggable } from "./Draggable"
import { Settings } from "./Settings"

const RADIUS = 20

export class Pen extends Draggable {
	communication: Communication

	constructor(communication: Communication) {
		super(null)
		this.communication = communication
	}

	settingsChanged() {
		this.setPosition(new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY))
	}

	getPosition(): paper.Point {
		return null
	}

	setPosition(point: paper.Point) {
	}

	mouseStop(event: MouseEvent) {
		if(this.dragging) {
			this.communication.sendMoveDirect(this.getWorldPosition(event))
		}
		super.mouseStop(event)
	}
}

export class PaperPen extends Pen {

	circle: paper.Path
	lines: paper.Path

	constructor(communication: Communication) {
		super(communication)
	}

	initialize(x: number, y:number, tipibotWidth: number, layer: paper.Layer = null) {
		this.circle = paper.Path.Circle(new paper.Point(x, y), RADIUS)
		this.circle.strokeWidth = 1
		this.circle.strokeColor = 'black'
		this.circle.fillColor = 'black'

		this.item = this.circle

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

	setPosition(point: paper.Point) {
		this.circle.position = point
		this.lines.segments[1].point = point
	}

	drag(delta: paper.Point) {
		this.setPosition(this.circle.position.add(delta))
	}

	mouseStop(event: MouseEvent) {
		if(this.dragging) {
			this.setPosition(this.circle.position)
		}
		super.mouseStop(event)
	}

	settingsChanged() {
		this.lines.segments[2].point.x = Settings.tipibot.width
		super.settingsChanged()
	}
}

export class ThreePen extends Pen {

	circle: THREE.Mesh
	camera: THREE.OrthographicCamera
	lines: THREE.Line

	constructor(communication: Communication) {
		super(communication)
	}

	initialize(x: number, y:number, tipibotWidth: number, camera: THREE.OrthographicCamera, scene: THREE.Scene = null, lineMat: THREE.LineBasicMaterial = null) {
		let geometry = new THREE.CircleGeometry( RADIUS, 32 )
		let material = new THREE.MeshBasicMaterial( { color: 0xffff00 } )
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

	setPosition(point: paper.Point) {
		let position = this.pointToVector(point)
		this.circle.position.copy(position);
		(<THREE.Geometry>this.lines.geometry).vertices[1].copy(position);
		(<THREE.Geometry>this.lines.geometry).verticesNeedUpdate = true;
	}
	
	settingsChanged() {
		(<THREE.Geometry>this.lines.geometry).vertices[2].x = Settings.tipibot.width
		super.settingsChanged()
	}

	pointToVector(point: paper.Point): THREE.Vector3 {
		return new THREE.Vector3(point.x, point.y, 0)
	}

	vectorToPoint(point: THREE.Vector3): paper.Point {
		return new paper.Point(point.x, point.y)
	}

	mouseDown(event:MouseEvent) {

		let position = this.getWorldPosition(event)
		if(position.getDistance(new paper.Point(this.circle.position.x, this.circle.position.y), true) < RADIUS * RADIUS) {
			this.dragging = true
			this.previousPosition = position.clone()
		}
	}

	mouseMove(event:MouseEvent) {

		let position = this.getWorldPosition(event)
		if(this.dragging) {
			let circlePosition = this.vectorToPoint(this.circle.position)
			this.setPosition(circlePosition.add(position.subtract(this.previousPosition)))

			this.previousPosition = position.clone()
		}
	}

	mouseStop(event: MouseEvent) {
		if(this.dragging) {
			this.communication.sendMoveDirect(this.getWorldPosition(event))
		}
		this.dragging = false
	}

	mouseUp(event:MouseEvent) {
		this.mouseStop(event)
	}

	mouseLeave(event:MouseEvent) {
		this.mouseStop(event)
	}
}