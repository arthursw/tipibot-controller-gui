export class Rectangle {
	constructor() {

	}
}

export class Circle {
	constructor() {

	}
}

export class PaperRectangle {
	path: paper.Path
	constructor(x: number, y:number, width:number, height:number, layer: paper.Layer = null) {
		let position = new paper.Point(x, y)
		let size = new paper.Size(width, height)
		this.path = paper.Path.Rectangle(position, size)
		this.path.strokeWidth = 1 
		this.path.strokeColor = 'black'
		if(layer) {
			layer.addChild(this.path)
		}
	}
}

export class PaperCircle {
	path: paper.Path
	constructor(x: number, y:number, radius:number, layer: paper.Layer = null) {
		let position = new paper.Point(x, y)
		this.path = paper.Path.Circle(position, radius)
		this.path.strokeWidth = 1 
		this.path.strokeColor = 'black'
		if(layer) {
			layer.addChild(this.path)
		}
	}
}


export class ThreeRectangle extends Rectangle {
	line: THREE.Line
	constructor(x: number, y:number, width:number, height:number, scene: THREE.Scene, material: THREE.LineBasicMaterial = null) {
		super()
		let geometry = new THREE.Geometry()
		let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff })
		this.line = new THREE.Line(geometry, mat)
		geometry.vertices.push(
			new THREE.Vector3( x, y, 0 ),
			new THREE.Vector3( x + width, y, 0 ),
			new THREE.Vector3( x + width, y + height, 0 ),
			new THREE.Vector3( x, y + height, 0 ),
			new THREE.Vector3( x, y, 0 )
		)
		scene.add(this.line)
	}
}

export class ThreeCircle extends Circle {
	line: THREE.Line
	constructor(x: number, y:number, radius:number, nSegments:number = 12, scene: THREE.Scene, material: THREE.LineBasicMaterial = null) {
		super()
		let geometry = new THREE.Geometry()
		let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff })
		this.line = new THREE.Line(geometry, mat)
		let angleStep = 2 * Math.PI / nSegments
		for(let i=0 ; i<=nSegments ; i++) {
			geometry.vertices.push(new THREE.Vector3(x + radius * Math.cos(i * angleStep), y + radius * Math.sin(i * angleStep)))
		}
		scene.add(this.line)
	}
}