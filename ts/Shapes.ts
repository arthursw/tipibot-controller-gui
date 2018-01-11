declare let MeshLine: any
declare let MeshLineMaterial: any

export class Rect {
	x: number
	y: number
	width: number
	height: number
	
	static fromPaperRect(rectangle: paper.Rectangle) {
		return new Rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
	}

	constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}

	getCenter() {
		return new paper.Point(this.x + this.width / 2, this.y + this.height / 2)
	}

	setTopLeft(point: paper.Point) {
		this.x = point.x
		this.y = point.y
	}

	setCenter(center: paper.Point) {
		this.x = center.x - this.width / 2
		this.y = center.y - this.height / 2
	}

	getPaperRectangle() {
		return new paper.Rectangle(this.x, this.y, this.width, this.height)
	}

	contains(point: paper.Point) {
		return this.x < point.x && point.x < this.x + this.width && this.y < point.y && point.y < this.y + this.height
	}

	top() {
		return new paper.Point(this.x + this.width / 2, this.y)
	}

	bottom() {
		return new paper.Point(this.x + this.width / 2, this.y + this.height)
	}

	left() {
		return new paper.Point(this.x, this.y + this.height / 2)
	}
	
	right() {
		return new paper.Point(this.x + this.width, this.y + this.height / 2)
	}

	topLeft() {
		return new paper.Point(this.x, this.y)
	}

	topRight() {
		return new paper.Point(this.x+this.width, this.y)
	}

	bottomLeft() {
		return new paper.Point(this.x, this.y+this.height)
	}

	bottomRight() {
		return new paper.Point(this.x+this.width, this.y+this.height)
	}

	size() {
		return new paper.Size(this.width, this.height)
	}

	toString() {
		return '' + this.x + ', ' + this.y + ', ' + this.width + ', ' + this.height
	}
}

export class Shape {
	group: paper.Group
	constructor() {
	}

	getPosition() {
		return this.group.position
	}

	setPosition(position: paper.Point) {
		this.group.position = position
	}

	remove() {
		this.group.remove()
	}

	getBounds() {
		return Rect.fromPaperRect(this.group.bounds)
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

// ------------- //
// --- PAPER --- //
// ------------- //

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

export class PaperSprite extends Shape {
	
	rectangle: Rect
	raster: paper.Raster

	constructor(canvas: HTMLCanvasElement) {
		super()

		this.raster = new paper.Raster(canvas)
		this.rectangle = new Rect(0, 0, canvas.width, canvas.height)
	}

	update() {

	}
	
	getPosition() {
		return this.rectangle.getCenter()
	}

	setPosition(position: paper.Point) {
		this.raster.position = new paper.Point(position.x - this.rectangle.width / 2, position.y - this.rectangle.height / 2)
		this.rectangle.setCenter(position)
	}

	remove() {
		if(this.raster != null) {
			this.raster.remove()
		}
		this.raster = null
		this.rectangle = null
	}

	getBounds() {
		return this.rectangle
	}


}
export class PaperShape extends Shape {
	item: paper.Item

	constructor(item: paper.Item) {
		super()
		this.item = item
	}

	getPosition() {
		return this.item.position
	}

	setPosition(position: paper.Point) {
		this.item.position = position
	}

	remove() {
		this.item.remove()
	}

	getBounds() {
		return Rect.fromPaperRect(this.item.bounds)
	}
}

// ------------- //
// --- THREE --- //
// ------------- //

export class ThreeRectangle extends Rectangle {
	line: THREE.Line
	scene: THREE.Scene
	rectangle: paper.Rectangle
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
		this.rectangle = new paper.Rectangle(x, y, width, height)
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
		geometry.verticesNeedUpdate = true
		this.rectangle = new paper.Rectangle(x, y, width, height)
	}
	
	getPosition() {
		return this.rectangle.point
	}

	setPosition(position: paper.Point) {
		this.line.position.set(position.x, position.y, 0)
		this.rectangle.point = position
	}

	remove() {
		this.scene.remove(this.line)
	}

	getBounds() {
		return Rect.fromPaperRect(this.rectangle)
	}
}

export class ThreeCircle extends Circle {
	line: THREE.Line
	scene: THREE.Scene
	rectangle: paper.Rectangle
	constructor(x: number, y:number, radius:number, nSegments:number = 12, scene: THREE.Scene, material: THREE.LineBasicMaterial = null) {
		super()
		this.scene = scene
		this.update(x, y, radius, nSegments, material)
		this.rectangle = new paper.Rectangle(x-radius, y-radius, 2*radius, 2*radius)
	}

	update(x: number, y:number, radius:number, nSegments:number = 12, material: THREE.LineBasicMaterial = null) {
		this.rectangle = new paper.Rectangle(x-radius, y-radius, 2*radius, 2*radius)
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
			geometry.vertices.push(new THREE.Vector3(0 + radius * Math.cos(i * angleStep), 0 + radius * Math.sin(i * angleStep)))
		}
		this.line.position.x = x
		this.line.position.y = y
		this.scene.add(this.line)
	}

	getPosition() {
		return this.rectangle.center
	}

	setPosition(position: paper.Point) {
		this.line.position.set(position.x, position.y, 0)
		this.rectangle.center = position
	}

	remove() {
		this.scene.remove(this.line)
	}

	getBounds() {
		return Rect.fromPaperRect(this.rectangle)
	}
}

export class ThreeTarget extends Target {

	targetGroup: THREE.Group
	line: THREE.Line = null
	hLine: THREE.Line = null
	vLine: THREE.Line = null
	scene: THREE.Scene = null
	rectangle: paper.Rectangle

	constructor(x: number, y:number, radius:number, nSegments:number = 12, scene: THREE.Scene, material: THREE.LineBasicMaterial = null) {
		super()
		this.targetGroup = new THREE.Group()
		this.scene = scene
		this.update(x, y, radius, nSegments, material)
		this.rectangle = new paper.Rectangle(x-radius, y-radius, 2*radius, 2*radius)
	}

	update(x: number, y:number, radius:number, nSegments:number = 12, material: THREE.LineBasicMaterial = null) {
		this.rectangle = new paper.Rectangle(x-radius, y-radius, 2*radius, 2*radius)
		if(material == null && this.line != null) {
			material = <THREE.LineBasicMaterial> this.line.material
		}
		if(this.targetGroup != null) {
			this.scene.remove(this.targetGroup)
		}
		let geometry = new THREE.Geometry()
		let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff })
		this.line = new THREE.Line(geometry, mat)
		let angleStep = 2 * Math.PI / nSegments
		for(let i=0 ; i<=nSegments ; i++) {
			geometry.vertices.push(new THREE.Vector3(0 + radius * Math.cos(i * angleStep), 0 + radius * Math.sin(i * angleStep)))
		}
		this.targetGroup.add(this.line)

		let hGeometry = new THREE.Geometry()
		this.hLine = new THREE.Line(hGeometry, mat)
		hGeometry.vertices.push(new THREE.Vector3(0 - radius, 0))
		hGeometry.vertices.push(new THREE.Vector3(0 + radius, 0))
		this.targetGroup.add(this.hLine)

		let vGeometry = new THREE.Geometry()
		this.vLine = new THREE.Line(vGeometry, mat)
		vGeometry.vertices.push(new THREE.Vector3(0, 0 - radius))
		vGeometry.vertices.push(new THREE.Vector3(0, 0 + radius))
		this.targetGroup.add(this.vLine)

		this.scene.add(this.targetGroup)
		this.targetGroup.position.set(x, y, 0)
	}
	
	getPosition() {
		return this.rectangle.center
	}

	setPosition(position: paper.Point) {
		this.targetGroup.position.set(position.x, position.y, 0)
		this.rectangle.center = position
	}

	remove() {
		if(this.targetGroup != null) {
			this.scene.remove(this.targetGroup)
		}
		this.targetGroup = null
		this.line = null
		this.hLine = null
		this.vLine = null
	}

	getBounds() {
		return Rect.fromPaperRect(this.rectangle)
	}
}

export class ThreeSprite extends Shape {
	
	rectangle: Rect
	scene: THREE.Scene
	sprite: THREE.Sprite

	constructor(scene: THREE.Scene, canvas: HTMLCanvasElement) {
		super()

		this.scene = scene

		var spriteMap = new THREE.TextureLoader().load( canvas.toDataURL() );
		var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff, rotation: Math.PI } );
		this.sprite = new THREE.Sprite( spriteMaterial );
		this.sprite.scale.set(-canvas.width, canvas.height, 1);
		scene.add( this.sprite );
		(<any>window).sprite = this.sprite

		// this.rectangle = new Rect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height)
		this.rectangle = new Rect(0, 0, canvas.width, canvas.height)
	}

	update() {

	}
	
	getPosition() {
		return this.rectangle.topLeft()
	}

	setPosition(position: paper.Point) {
		this.sprite.position.set(position.x - this.rectangle.width / 2, position.y - this.rectangle.height / 2, 0)
		// this.rectangle.setCenter(position)
		this.rectangle.x = position.x
		this.rectangle.y = position.y
	}

	remove() {
		this.scene.remove(this.sprite)
		this.sprite = null
		this.rectangle = null
	}

	getBounds() {
		return this.rectangle
	}


}

export class ThreeShape extends Shape {
	lineGroup: THREE.Group
	lines: THREE.LineSegments
	mesh: THREE.Mesh
	scene: THREE.Scene
	rectangle: Rect
	item: paper.Item

	constructor(item:paper.Item, scene: THREE.Scene, material: THREE.LineBasicMaterial = null) {
		super()
		this.item = item
		this.scene = scene
		this.update(item, material)
		this.rectangle = Rect.fromPaperRect(item.bounds)
		
	}

	createMeshLineMeshes(item: paper.Item, material: any) {
		if(!item.visible) {
			return
		}
		let matrix = item.globalMatrix
		if((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
			let path: paper.Path = <paper.Path>item
			// let geometry = new THREE.Geometry()
			// let line = new THREE.Line(geometry, material)
			let geometry = new THREE.Geometry()
			let line = new MeshLine()

			if(path.segments != null) {
				for(let segment of path.segments) {
					let point = segment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
				}
				if(path.closed) {
					let point = path.firstSegment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
				}
			}
			
			line.setGeometry( geometry )
			let mesh = new THREE.Mesh(line.geometry, material)
			this.lineGroup.add(mesh)
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.createMeshLineMeshes(child, material)
		}
	}

	createMeshLineGroup(item: paper.Item, material: THREE.LineBasicMaterial) {
		if(!item.visible) {
			return
		}
		let matrix = item.globalMatrix
		if((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
			let path: paper.Path = <paper.Path>item
			let geometry = new THREE.Geometry()
			let line = new THREE.Line(geometry, material)

			if(path.segments != null) {
				for(let segment of path.segments) {
					let point = segment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
				}
				if(path.closed) {
					let point = path.firstSegment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
				}
			}
			this.lineGroup.add(line)
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.createMeshLineGroup(child, material)
		}
	}

	createMeshLineSegments(item: paper.Item, geometry: THREE.Geometry) {
		if(!item.visible) {
			return
		}
		let matrix = item.globalMatrix
		if((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
			let path: paper.Path = <paper.Path>item

			if(path.segments != null) {
				for(let segment of path.segments) {
					let point = segment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
					if(segment != path.firstSegment && segment != path.lastSegment) {
						geometry.vertices.push(geometry.vertices[geometry.vertices.length-1])
					}
				}
				if(path.closed) {
					let lastPoint = path.lastSegment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(lastPoint.x, lastPoint.y))
					let firstPoint = path.firstSegment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(firstPoint.x, firstPoint.y))

				}
			}
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.createMeshLineSegments(child, geometry)
		}
	}

	createMesh(item: paper.Item, geometry: THREE.Geometry) {
		if(!item.visible) {
			return
		}
		let matrix = item.globalMatrix
		if((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
			let path: paper.Path = <paper.Path>item

			if(path.segments != null) {
				for(let segment of path.segments) {
					let point = segment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
				}
				if(path.closed) {
					let point = path.firstSegment.point.transform(matrix)
					geometry.vertices.push(new THREE.Vector3(point.x, point.y))
				}
			}
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.createMesh(child, geometry)
		}
	}

	update(item: paper.Item, material: THREE.LineBasicMaterial = null) {
		this.rectangle = Rect.fromPaperRect(item.bounds)

		// if(this.mesh != null) {
		// 	this.scene.remove(this.mesh)
		// }

		// if(this.lines != null) {
		// 	this.scene.remove(this.lines)
		// }

		// if(this.lineGroup != null) {
		// 	this.scene.remove(this.lineGroup)
		// }
		// this.lineGroup = new THREE.Group()
		
		// let mat = new MeshLineMaterial( { color: new THREE.Color(0xffffff), resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), sizeAttenuation: true, lineWidth: 0.004, near: 0, far: 500 } )

		let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff })		
		let geometry = new THREE.Geometry()
		this.lines = new THREE.LineSegments(geometry, mat)
		
		this.createMeshLineSegments(item, geometry)
		
		this.scene.add(this.lines)
	}
	
	getPosition() {
		return this.rectangle.getCenter()
	}

	setPosition(position: paper.Point) {
		this.lines.position.set(position.x - this.rectangle.width / 2, position.y - this.rectangle.height / 2, 0)
		this.rectangle.setCenter(position)
	}

	remove() {
		// this.scene.remove(this.lineGroup)
		this.scene.remove(this.lines)
		this.item.remove()
		this.lines = null
		this.rectangle = null
	}

	getBounds() {
		return this.rectangle
	}
}
