declare type Renderer = {
	getWorldPosition(event: MouseEvent): paper.Point
}

export class Draggable {
	
	static draggables: Array<Draggable> = new Array<Draggable>()

	renderer: Renderer
	dragging: boolean
	previousPosition: paper.Point
	item: paper.Item

	constructor(renderer: Renderer, item: paper.Item=null) {
		this.renderer = renderer
		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)
		this.item = item
		Draggable.draggables.push(this)
	}

	drag(delta: paper.Point) {
		this.item.position = this.item.position.add(delta)
	}

	getWorldPosition(event:MouseEvent): paper.Point {
		return this.renderer.getWorldPosition(event)
	}

	mouseDown(event:MouseEvent) {
		let position =  this.getWorldPosition(event)
		if(this.item.bounds.contains(position)) {
			this.dragging = true
			this.previousPosition = position.clone()
		}
	}

	mouseMove(event:MouseEvent) {
		let position = <paper.Point> this.getWorldPosition(event)

		if(this.dragging) {
			this.drag(position.subtract(this.previousPosition))
			this.previousPosition = position.clone()
		}
	}

	mouseStop(event: MouseEvent) {
		this.dragging = false
	}

	mouseUp(event:MouseEvent) {
		this.mouseStop(event)
	}

	mouseLeave(event:MouseEvent) {
		this.mouseStop(event)
	}

	delete() {
		Draggable.draggables.splice(Draggable.draggables.indexOf(this), 1)
	}
}