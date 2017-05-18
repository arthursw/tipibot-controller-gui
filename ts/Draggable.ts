export class Draggable {
	
	static draggables: Array<Draggable> = new Array<Draggable>()

	dragging: boolean
	previousPosition: paper.Point
	item: paper.Item

	constructor(item: paper.Item=null) {
		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)
		this.item = item
		Draggable.draggables.push(this)
	}

	drag(delta: paper.Point) {
		this.item.position = this.item.position.add(delta)
	}

	getWorldPosition(event:MouseEvent): paper.Point {
		return paper.view.viewToProject(new paper.Point(event.clientX, event.clientY))
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
}