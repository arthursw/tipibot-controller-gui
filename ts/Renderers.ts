import { Rectangle, Circle, ThreeRectangle, ThreeCircle, PaperRectangle, PaperCircle } from "./Shapes"
import { Pen, ThreePen, PaperPen } from "./Pen"
import { Communication } from "./Communication/Communication"

export class Renderer {
	constructor() {

	}

	centerOnTipibot(tipibot: {width: number, height: number}) {
	}

	getDomElement(): any {
		return null
	}

	createRectangle(rectangle: paper.Rectangle): Rectangle {
		return null
	}

	createCircle(x: number, y:number, radius:number, nSegments:number = 12): Circle {
		return null
	}

	createPen(x: number, y:number, tipibotWidth: number, communication: Communication): Pen {
		return null
	}

	createDrawingLayer() {

	}

	getMousePosition(event: MouseEvent): paper.Point {
		return new paper.Point(event.clientX, event.clientY)
	}

	getWorldPosition(event: MouseEvent): paper.Point {
		return paper.view.viewToProject(this.getMousePosition(event))
	}

	windowResize(){
	}

	mouseDown(event: MouseEvent) {
	}

	mouseMove(event: MouseEvent) {
	}

	mouseUp(event: MouseEvent) {
	}

	mouseLeave(event: MouseEvent) {
	}
	
	mouseWheel(event: WheelEvent) {
	}

	render() {
	}
}

export class PaperRenderer extends Renderer {
	
	canvas: HTMLCanvasElement
	dragging: boolean
	previousPosition: paper.Point
	tipibotLayer: paper.Layer
	drawingLayer: paper.Layer

	constructor() {
		super()
		this.canvas = document.createElement('canvas')
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight
		document.body.appendChild(this.canvas)

		paper.setup(<any>this.canvas)

		this.tipibotLayer = new paper.Layer()

		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)

	}

	centerOnTipibot(tipibot: {width: number, height: number}) {
		let margin = 100
		let ratio = Math.max((tipibot.width + margin) / window.innerWidth, (tipibot.height + margin) / window.innerHeight)
		paper.view.zoom = 1 / ratio

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

	createPen(x: number, y:number, tipibotWidth: number, communication: Communication): Pen {
		let pen = new PaperPen(communication, this)
		pen.initialize(x, y, tipibotWidth, this.tipibotLayer)
		return pen
	}
	
	createDrawingLayer() {
		this.drawingLayer = new paper.Layer()
		this.drawingLayer.moveBelow(this.tipibotLayer)
	}

	windowResize(){
		let canvasJ = $(this.canvas)
		canvasJ.width(window.innerWidth)
		canvasJ.height(window.innerHeight)
		paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
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
		this.dragging = false
		this.previousPosition = new THREE.Vector2()

		this.camera = new THREE.OrthographicCamera( 0, window.innerWidth, 0, window.innerHeight, - 500, 1000 )
		this.scene = new THREE.Scene()
		this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })

		let ambientLight = new THREE.AmbientLight( Math.random() * 0x10 )
		this.scene.add( ambientLight )

		this.renderer = new THREE.WebGLRenderer( { preserveDrawingBuffer: true } )
		this.renderer.setPixelRatio( window.devicePixelRatio )
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		let container = document.createElement( 'div' )
		document.body.appendChild( container )
		container.appendChild( this.getDomElement() )
	}

	centerOnTipibot(tipibot: {width: number, height: number}) {
		this.setCameraCenterTo(new THREE.Vector3(tipibot.width / 2, tipibot.height / 2, 0))

		let margin = 100
		let ratio = Math.max((tipibot.width + margin) / window.innerWidth, (tipibot.height + margin) / window.innerHeight)
		this.camera.zoom = 1 / ratio
		this.camera.updateProjectionMatrix()
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

	createPen(x: number, y:number, tipibotWidth: number, communication: Communication): Pen {
		let pen = new ThreePen(communication, this)
		pen.initialize(x, y, tipibotWidth, this.camera, this.scene, this.lineMaterial)
		return pen
	}

	setCameraCenterTo(point: THREE.Vector3) {
		this.camera.position.x = point.x - window.innerWidth / 2
		this.camera.position.y = point.y - window.innerHeight / 2
		this.camera.position.z = point.z
	}

	getWorldPosition(event: MouseEvent) {
		let windowCenter = new paper.Point(window.innerWidth / 2, window.innerHeight / 2)
		let windowOrigin = windowCenter.subtract(windowCenter.divide(this.camera.zoom).subtract(this.camera.position))
		let delta = this.getMousePosition(event).divide(this.camera.zoom)

		return windowOrigin.add(delta)
	}

	windowResize(){
		this.camera.left = 0
		this.camera.right = window.innerWidth
		this.camera.top = 0
		this.camera.bottom = window.innerHeight
		this.camera.updateProjectionMatrix()

		this.renderer.setSize( window.innerWidth, window.innerHeight )
	}

	mouseDown(event: MouseEvent) {
		this.dragging = true
		this.previousPosition.x = event.clientX
		this.previousPosition.y = event.clientY
	}

	mouseMove(event: MouseEvent) {
		if(event.buttons == 4 && this.dragging) { 											// wheel button
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