export class Rectangle {
	constructor() {

	}

	update(x: number, y:number, width:number, height:number) {

	}

	updateRectangle(rectangle: paper.Rectangle) {
		this.update(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
	}
}

export class Circle {
	constructor() {

	}

	update(x: number, y:number, radius:number) {
	}
}

export class PaperRectangle extends Rectangle {
	path: paper.Path
	constructor(x: number, y:number, width:number, height:number, layer: paper.Layer = null) {
		super()
		this.update(x, y, width, height, layer)
	}

	update(x: number, y:number, width:number, height:number, layer: paper.Layer = null) {
		if(layer == null && this.path != null) {
			layer = <paper.Layer>this.path.parent
		}
		if(this.path != null) {
			this.path.remove()
		}
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

export class PaperCircle extends Circle {
	path: paper.Path
	constructor(x: number, y:number, radius:number, layer: paper.Layer = null) {
		super()
		this.update(x, y, radius, layer)
	}

	update(x: number, y:number, radius:number, layer: paper.Layer = null) {
		if(layer == null && this.path != null) {
			layer = <paper.Layer>this.path.parent
		}
		if(this.path != null) {
			this.path.remove()
		}
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

	update(x: number, y:number, width:number, height:number) {
		let x2 = x + width
		let y2 = y + height
		let geometry: THREE.Geometry = <THREE.Geometry>this.line.geometry
		geometry.vertices[0].x = x
		geometry.vertices[0].y = y
		geometry.vertices[1].x = x
		geometry.vertices[1].y = y2
		geometry.vertices[2].x = x2
		geometry.vertices[2].y = y2
		geometry.vertices[3].x = x2
		geometry.vertices[3].y = y
		geometry.vertices[4].x = x
		geometry.vertices[4].y = y
	}
}

export class ThreeCircle extends Circle {
	line: THREE.Line
	scene: THREE.Scene
	constructor(x: number, y:number, radius:number, nSegments:number = 12, scene: THREE.Scene, material: THREE.LineBasicMaterial = null) {
		super()
		this.scene = scene
		this.update(x, y, radius, nSegments, material)
	}

	update(x: number, y:number, radius:number, nSegments:number = 12, material: THREE.LineBasicMaterial = null) {
		if(material == null && this.line != null) {
			material = <THREE.LineBasicMaterial> this.line.material
		}
		if(this.line != null) {
			this.scene.remove(this.line)
		}
		let geometry = new THREE.Geometry()
		let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff })
		this.line = new THREE.Line(geometry, mat)
		let angleStep = 2 * Math.PI / nSegments
		for(let i=0 ; i<=nSegments ; i++) {
			geometry.vertices.push(new THREE.Vector3(x + radius * Math.cos(i * angleStep), y + radius * Math.sin(i * angleStep)))
		}
		this.scene.add(this.line)
	}
}