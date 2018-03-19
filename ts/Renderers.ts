import { Shape, Rectangle, Circle, Target, ThreeRectangle, ThreeCircle, ThreeTarget, ThreeSprite, ThreeShape, PaperRectangle, PaperCircle, PaperTarget, PaperSprite, PaperShape } from "./Shapes"
import { Pen, ThreePen, PaperPen } from "./Pen"
import { Renderer } from "./RendererInterface"
import { Communication } from "./Communication/Communication"

export class PaperRenderer extends Renderer {
	
	canvas: HTMLCanvasElement
	dragging: boolean
	previousPosition: paper.Point
	tipibotLayer: paper.Layer
	drawingLayer: paper.Layer

	constructor() {
		super()
		this.canvas = document.createElement('canvas')
		let containerJ = $('#canvas')
		this.canvas.width = containerJ.width()
		this.canvas.height = containerJ.height()
		containerJ.get(0).appendChild(this.canvas)

		paper.setup(<any>this.canvas)

		this.tipibotLayer = new paper.Layer()

		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)

	}

	centerOnTipibot(tipibot: {width: number, height: number}, zoom=true) {
		if(zoom) {
			let margin = 100
			let ratio = Math.max((tipibot.width + margin) / this.canvas.width, (tipibot.height + margin) / this.canvas.height)
			paper.view.zoom = 1 / ratio
		}

		paper.view.setCenter(new paper.Point(tipibot.width / 2, tipibot.height / 2))
	}

	getDomElement(): any {
		return paper.view.element
	}

	createRectangle(rectangle: paper.Rectangle): Rectangle {
		return new PaperRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.tipibotLayer)
	}

	createCircle(x: number, y:number, radius:number, nSegments:number = 12): Circle {
		return new PaperCircle(x, y, radius, this.tipibotLayer)
	}

	createPen(x: number, y:number, tipibotWidth: number): Pen {
		let pen = new PaperPen(this)
		pen.initialize(x, y, tipibotWidth, this.tipibotLayer)
		return pen
	}

	createTarget(x: number, y: number, radius: number): Target {
		return new PaperTarget(x, y, radius, this.tipibotLayer)
	}

	createSprite(canvas: HTMLCanvasElement) {
		return new PaperSprite(canvas)
	}

	createShape(item: paper.Item): Shape {
		return new PaperShape(item)
	}
	
	createDrawingLayer() {
		this.drawingLayer = new paper.Layer()
		this.drawingLayer.moveBelow(this.tipibotLayer)
	}

	windowResize(){
		let containerJ = $('#canvas')
		let width = containerJ.width()
		let height = containerJ.height()
		let canvasJ = $(this.canvas)
		canvasJ.width(width)
		canvasJ.height(height)
		paper.view.viewSize = new paper.Size(width, height)
	}

	mouseDown(event: MouseEvent) {
		this.dragging = true
		this.previousPosition = this.getMousePosition(event)
	}

	mouseMove(event: MouseEvent) {
		if(event.buttons == 4 && this.dragging) { 											// wheel button
			let position = this.getMousePosition(event)
			paper.view.translate(position.subtract(this.previousPosition).divide(paper.view.zoom))
			paper.view.draw()
			this.previousPosition.x = position.x
			this.previousPosition.y = position.y
		}
	}

	mouseUp(event: MouseEvent) {
		this.dragging = false
	}

	mouseLeave(event: MouseEvent) {
		this.dragging = false
	}

	mouseWheel(event: WheelEvent) {
		if(event.target != this.getDomElement()) {
			return
		}
		paper.view.zoom = Math.max(0.1, Math.min(5, paper.view.zoom + event.deltaY / 500))
	}

	render() {
	}
}

export class ThreeRenderer extends Renderer {

	camera: THREE.OrthographicCamera
	scene: THREE.Scene
	renderer: THREE.WebGLRenderer
	lineMaterial: THREE.LineBasicMaterial

	dragging: boolean
	previousPosition: THREE.Vector2

	constructor() {
		super()

		// Setup paper to be able to call paper.project.importSVG()

		let paperCanvas = document.createElement('canvas')
		paper.setup(paperCanvas)

		this.dragging = false
		this.previousPosition = new THREE.Vector2()

		let containerJ = $('#canvas')
		let width = containerJ.width()
		let height = containerJ.height()


		// this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera = new THREE.OrthographicCamera( 0, width, 0, height, - 500, 1000 )
		this.scene = new THREE.Scene()
		this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })

		let ambientLight = new THREE.AmbientLight( Math.random() * 0x10 )
		this.scene.add( ambientLight )

		this.renderer = new THREE.WebGLRenderer( { preserveDrawingBuffer: true, antialias: true } )
		this.renderer.setPixelRatio( window.devicePixelRatio )
		console.log(width, height)
		this.renderer.setSize( width, height )

		containerJ.append( this.renderer.domElement )

		// var spriteMap = new THREE.TextureLoader().load( "out.png" );
		// spriteMap.minFilter = THREE.LinearFilter;
		// var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
		// let sprite = new THREE.Sprite( spriteMaterial );
		// sprite.scale.set(500, 500, 1)
		// this.scene.add( sprite );
	}

	centerOnTipibot(tipibot: {width: number, height: number}, zoom=true) {
		this.setCameraCenterTo(new THREE.Vector3(tipibot.width / 2, tipibot.height / 2, 0))
		
		if(zoom) {
			let margin = 100
			let size = this.renderer.getSize()
			let ratio = Math.max((tipibot.width + margin) / size.width, (tipibot.height + margin) / size.height)
			this.camera.zoom = 1 / ratio
			this.camera.updateProjectionMatrix()
		}
	}
	
	getDomElement(): any {
		return this.renderer.domElement
	}

	createRectangle(rectangle: paper.Rectangle): Rectangle {
		return new ThreeRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.scene, this.lineMaterial )
	}

	createCircle(x: number, y:number, radius:number, nSegments:number = 12): Circle {
		return new ThreeCircle(x, y, radius, nSegments, this.scene, this.lineMaterial )
	}

	createPen(x: number, y:number, tipibotWidth: number): Pen {
		let pen = new ThreePen(this)
		pen.initialize(x, y, tipibotWidth, this.camera, this.scene, this.lineMaterial)
		return pen
	}

	createSprite(canvas: HTMLCanvasElement) {
		return new ThreeSprite(this.scene, canvas)
	}

	createTarget(x: number, y: number, radius: number): Target {
		return new ThreeTarget(x, y, radius, 12, this.scene)
	}

	createShape(item: paper.Item, material = this.lineMaterial): Shape {
		return new ThreeShape(item, this.scene, material)
	}

	setCameraCenterTo(point: THREE.Vector3) {
		let size = this.renderer.getSize()
		this.camera.position.x = point.x - size.width / 2
		this.camera.position.y = point.y - size.height / 2
		this.camera.position.z = point.z
	}

	getWorldPosition(event: MouseEvent) {
		let size = this.renderer.getSize()
		let windowCenter = new paper.Point(size.width / 2, size.height / 2)
		let windowOrigin = windowCenter.subtract(windowCenter.divide(this.camera.zoom).subtract(this.camera.position))
		let delta = this.getMousePosition(event).divide(this.camera.zoom)

		return windowOrigin.add(delta)
	}

	windowResize(){
		let containerJ = $('#canvas')
		let width = containerJ.width()
		let height = containerJ.height()

		this.camera.left = 0
		this.camera.right = width
		this.camera.top = 0
		this.camera.bottom = height
		this.camera.updateProjectionMatrix()

		this.renderer.setSize( width, height )
	}

	mouseDown(event: MouseEvent) {
		this.dragging = true
		this.previousPosition.x = event.clientX
		this.previousPosition.y = event.clientY
	}

	mouseMove(event: MouseEvent) {
		if(event.buttons == 4 || event.shiftKey && this.dragging) { 											// wheel button
			this.camera.position.x += (this.previousPosition.x - event.clientX) / this.camera.zoom
			this.camera.position.y += (this.previousPosition.y - event.clientY) / this.camera.zoom
			this.previousPosition.x = event.clientX
			this.previousPosition.y = event.clientY
		}
	}

	mouseUp(event: MouseEvent) {
		this.dragging = false
	}

	mouseLeave(event: MouseEvent) {
		this.dragging = false
	}

	mouseWheel(event: WheelEvent) {
		if(event.target != this.getDomElement()) {
			return
		}
		this.camera.zoom += ( event.deltaY / 500 )
		this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom))
		this.camera.updateProjectionMatrix()
	}

	render() {
		this.renderer.render( this.scene, this.camera );
	}
}