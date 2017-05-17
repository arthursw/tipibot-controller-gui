import { Communication } from "./Communication"
import { Draggable } from "./Draggable"

const RADIUS = 20

export class Pen extends Draggable {
	communication: Communication

	constructor(communication: Communication) {
		super(null)
		this.communication = communication
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

	initialize(x: number, y:number, machineWidth: number, layer: paper.Layer = null) {
		this.circle = paper.Path.Circle(new paper.Point(x, y), RADIUS)
		this.circle.strokeWidth = 1
		this.circle.strokeColor = 'black'
		this.circle.fillColor = 'black'
		this.circle.onMouseDrag = (event: any) => {
    		this.circle.position = this.circle.position.add(event.delta)
		}

		this.item = this.circle

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(new paper.Point(x, y))
		this.lines.add(new paper.Point(machineWidth, 0))

		this.lines.strokeWidth = 1
		this.lines.strokeColor = 'black'

		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)
		
		if(layer) {
			layer.addChild(this.circle)
			layer.addChild(this.lines)
		}
	}

	drag(delta: paper.Point) {
		this.lines.segments[1].point = this.circle.position.clone()
	}
}

export class ThreePen extends Pen {

	circle: THREE.Mesh
	camera: THREE.OrthographicCamera
	lines: THREE.Line

	constructor(communication: Communication) {
		super(communication)
	}

	initialize(x: number, y:number, machineWidth: number, camera: THREE.OrthographicCamera, scene: THREE.Scene = null, lineMat: THREE.LineBasicMaterial = null) {
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
			new THREE.Vector3( machineWidth, 0, 0 )
		)

		this.lines = new THREE.Line(lineGeometry, lineMaterial)

		this.camera = camera

		if(scene) {
			scene.add(this.lines)
			scene.add(this.circle)
		}

	}

	pointToVector(point: paper.Point): THREE.Vector3 {
		return new THREE.Vector3(point.x, point.y, 0)
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
			let delta: THREE.Vector3 = this.pointToVector(position.subtract(this.previousPosition))
			this.circle.position.add(delta);
			(<THREE.Geometry>this.lines.geometry).vertices[1].copy(this.circle.position);
			(<THREE.Geometry>this.lines.geometry).verticesNeedUpdate = true;

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