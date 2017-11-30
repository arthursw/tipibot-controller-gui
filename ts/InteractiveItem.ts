import { Shape } from './Shapes'
import { Renderer } from './RendererInterface'

export class InteractiveItem {
	
	static interactiveItems: Array<InteractiveItem> = new Array<InteractiveItem>()

	renderer: Renderer
	draggable: boolean
	dragging: boolean
	previousPosition: paper.Point
	// item: paper.Item
	shape: Shape
	clickCallback: (event:MouseEvent, item: InteractiveItem)=> void

	static mouseDown(event: MouseEvent) {
		for(let interactiveItem of InteractiveItem.interactiveItems) {
			if(!interactiveItem.mouseDown(event)) {
				return
			}
		}
	}

	static mouseMove(event: MouseEvent) {
		for(let interactiveItem of InteractiveItem.interactiveItems) {
			if(!interactiveItem.mouseMove(event)) {
				return
			}
		}
	}

	static mouseStop(event: MouseEvent) {
		for(let interactiveItem of InteractiveItem.interactiveItems) {
			if(!interactiveItem.mouseStop(event)) {
				return
			}
		}
	}
	
	static mouseUp(event: MouseEvent) {
		for(let interactiveItem of InteractiveItem.interactiveItems) {
			if(!interactiveItem.mouseUp(event)) {
				return
			}
		}
	}

	static mouseLeave(event: MouseEvent) {
		for(let interactiveItem of InteractiveItem.interactiveItems) {
			if(!interactiveItem.mouseLeave(event)) {
				return
			}
		}
	}


	// constructor(renderer: Renderer, item: paper.Item=null) {
	constructor(renderer: Renderer, shape: Shape=null, draggable=false, clickCallback:(event:MouseEvent, item: InteractiveItem)=> void=null) {
		this.clickCallback = clickCallback
		this.renderer = renderer
		this.draggable = draggable
		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)
		this.shape = shape
		InteractiveItem.interactiveItems.push(this)
	}

	moveAbove(otherItem: InteractiveItem) {
		let thisIndex = InteractiveItem.interactiveItems.indexOf(this)
		InteractiveItem.interactiveItems.splice(thisIndex, 1)
		let otherIndex = InteractiveItem.interactiveItems.indexOf(otherItem)
		InteractiveItem.interactiveItems.splice(otherIndex, 0, this)
	}

	moveBelow(otherItem: InteractiveItem) {
		let thisIndex = InteractiveItem.interactiveItems.indexOf(this)
		InteractiveItem.interactiveItems.splice(thisIndex, 1)
		let otherIndex = InteractiveItem.interactiveItems.indexOf(otherItem)
		InteractiveItem.interactiveItems.splice(otherIndex + 1, 0, this)
	}

	moveToTop() {
		let thisIndex = InteractiveItem.interactiveItems.indexOf(this)
		InteractiveItem.interactiveItems.splice(thisIndex, 1)
		InteractiveItem.interactiveItems.splice(0, 0, this)
	}

	moveToBottom() {
		let thisIndex = InteractiveItem.interactiveItems.indexOf(this)
		InteractiveItem.interactiveItems.splice(thisIndex, 1)
		InteractiveItem.interactiveItems.push(this)
	}

	drag(delta: paper.Point) {
		this.shape.setPosition(this.shape.getPosition().add(delta))
	}

	getWorldPosition(event:MouseEvent): paper.Point {
		return this.renderer.getWorldPosition(event)
	}

	mouseDown(event:MouseEvent): boolean {
		let position =  this.getWorldPosition(event)
		if(this.shape.getBounds().contains(position)) {
			this.dragging = true
			this.previousPosition = position.clone()
			return false
		}
		return true
	}

	mouseMove(event:MouseEvent): boolean {
		if(this.draggable && this.dragging) {
			let position = <paper.Point> this.getWorldPosition(event)
			this.drag(position.subtract(this.previousPosition))
			this.previousPosition = position.clone()
			return false
		}
		return true
	}

	mouseStop(event: MouseEvent): boolean {
		this.dragging = false
		return true
	}

	mouseUp(event:MouseEvent): boolean {
		let position =  this.getWorldPosition(event)
		if(this.dragging && this.shape.getBounds().contains(position) && this.clickCallback != null) {
			this.clickCallback.call(this, event, this)
			return false
		}
		this.mouseStop(event)
		return true
	}

	mouseLeave(event:MouseEvent): boolean {
		this.mouseStop(event)
		return true
	}

	delete() {
		InteractiveItem.interactiveItems.splice(InteractiveItem.interactiveItems.indexOf(this), 1)
	}
}