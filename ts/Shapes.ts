export class Shape {
	group: paper.Group
	constructor() {
	}

	setPosition(position: paper.Point) {
		this.group.position = position
	}

	remove() {
		this.group.remove()
	}

	getBounds() {
		return this.group.bounds
	}
}

export class Rectangle extends Shape {
	constructor() {
		super()
	}

	update(x: number, y:number, width:number, height:number) {

	}

	updateRectangle(rectangle: paper.Rectangle) {
		this.update(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
	}
}

export class Circle extends Shape {
	constructor() {
		super()
	}

	update(x: number, y:number, radius:number) {
	}
}

export class Target extends Shape {
	constructor() {
		super()
	}
	update(x: number, y: number, radius: number) {

	}
}

export class PaperRectangle extends Rectangle {
	rectangle: paper.Path
	constructor(x: number, y:number, width:number, height:number, layer: paper.Layer = null) {
		super()
		this.group = new paper.Group()
		this.update(x, y, width, height, layer)
	}

	update(x: number, y:number, width:number, height:number, layer: paper.Layer = null) {
		if(layer == null && this.group != null) {
			layer = <paper.Layer>this.group.parent
		}
		if(this.group != null) {
			this.group.removeChildren()
		}
		let position = new paper.Point(x, y)
		let size = new paper.Size(width, height)
		this.rectangle = paper.Path.Rectangle(position, size)
		this.rectangle.strokeWidth = 1 
		this.rectangle.strokeColor = 'black'
		this.group.addChild(this.rectangle)
		if(layer) {
			layer.addChild(this.group)
		}
	}
}

export class PaperCircle extends Circle {
	circle: paper.Path = null

	constructor(x: number, y:number, radius:number, layer: paper.Layer = null) {
		super()
		this.group = new paper.Group()
		let position = new paper.Point(x, y)
		this.circle = paper.Path.Circle(position, radius)
		this.circle.strokeWidth = 1 
		this.circle.strokeColor = 'black'
		this.group.addChild(this.circle)
		if(layer) {
			layer.addChild(this.group)
		}
	}

	update(x: number, y:number, radius:number, layer: paper.Layer = null) {
		if(layer != null && this.group != null && this.group.parent != layer) {
			layer.addChild(this.group)
		}

		this.circle.position.x = x
		this.circle.position.y = y
	}
}

export class PaperTarget extends Target {
	circle: paper.Path

	constructor(x: number, y:number, radius:number, layer: paper.Layer = null) {
		super()
		this.group = new paper.Group()
		this.update(x, y, radius, layer)
	}

	update(x: number, y:number, radius:number, layer: paper.Layer = null) {
		if(layer == null && this.group != null) {
			layer = <paper.Layer>this.group.parent
		}
		if(this.group != null) {
			this.group.removeChildren()
		}
		let position = new paper.Point(x, y)
		this.circle = paper.Path.Circle(position, radius)
		this.circle.strokeWidth = 1 
		this.circle.strokeColor = 'black'
		this.group.addChild(this.circle)

		let hLine = new paper.Path()
		hLine.add(new paper.Point(position.x - radius, position.y))
		hLine.add(new paper.Point(position.x + radius, position.y))
		hLine.strokeWidth = 1 
		hLine.strokeColor = 'black'
		this.group.addChild(hLine)

		let vLine = new paper.Path()
		vLine.add(new paper.Point(position.x, position.y - radius))
		vLine.add(new paper.Point(position.x, position.y + radius))
		vLine.strokeWidth = 1 
		vLine.strokeColor = 'black'
		this.group.addChild(vLine)
		
		if(layer) {
			layer.addChild(this.group)
		}
	}
}

export class ThreeRectangle extends Rectangle {
	line: THREE.Line
	scene: THREE.Scene
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
		this.scene = scene
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

	setPosition(position: paper.Point) {
		this.line.position.set(position.x, position.y, 0)
	}

	remove() {
		this.scene.remove(this.line)
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

	setPosition(position: paper.Point) {
		this.line.position.set(position.x, position.y, 0)
	}

	remove() {
		this.scene.remove(this.line)
	}
}

export class ThreeTarget extends Target {

	line: THREE.Line = null
	hLine: THREE.Line = null
	vLine: THREE.Line = null
	scene: THREE.Scene = null

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

		let hGeometry = new THREE.Geometry()
		this.hLine = new THREE.Line(hGeometry, mat)
		hGeometry.vertices.push(new THREE.Vector3(x - radius, y))
		hGeometry.vertices.push(new THREE.Vector3(x + radius, y))
		this.scene.add(this.hLine)

		let vGeometry = new THREE.Geometry()
		this.vLine = new THREE.Line(vGeometry, mat)
		vGeometry.vertices.push(new THREE.Vector3(x, y - radius))
		vGeometry.vertices.push(new THREE.Vector3(x, y + radius))
		this.scene.add(this.vLine)

	}

	setPosition(position: paper.Point) {
		this.line.position.set(position.x, position.y, 0)
		this.hLine.position.set(position.x, position.y, 0)
		this.vLine.position.set(position.x, position.y, 0)
	}

	remove() {
		this.scene.remove(this.line)
		this.scene.remove(this.hLine)
		this.scene.remove(this.vLine)
	}
}