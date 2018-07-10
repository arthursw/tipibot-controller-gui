import { Shape, Rectangle, Circle, Target, ThreeRectangle, ThreeCircle, ThreeShape, PaperRectangle, PaperCircle, PaperTarget, PaperShape } from "./Shapes"

export class Renderer {
	constructor() {

	}

	centerOnTipibot(tipibot: {width: number, height: number}, zoom=true) {
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

	createPen(x: number, y:number, tipibotWidth: number): any {
		return null
	}

	createTarget(x: number, y: number, radius: number): Target {
		return null
	}

	createSprite(canvas: HTMLCanvasElement): Shape {
		return null
	}

	createShape(item: paper.Item, material: THREE.LineBasicMaterial = null): Shape {
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

	keyDown(event: KeyboardEvent) {
	}

	keyUp(event: KeyboardEvent) {
	}


	render() {
	}
}
