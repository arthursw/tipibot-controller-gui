import { Size } from "paper/dist/paper-core"
import { isServer, Settings, paper, document, createEvent } from "./Settings"
export class Renderer {
	
	canvas: HTMLCanvasElement | paper.Size
	dragging: boolean
	previousPosition: paper.Point
	spacePressed: boolean

	ignoreWindowResize = false

	constructor() {
	
		if(!isServer) {
			this.canvas = document.createElement('canvas')
			let container = document.getElementById('canvas')
			this.canvas.width = container.offsetWidth
			this.canvas.height = container.offsetHeight
			container.appendChild(this.canvas)
		} else {
			this.canvas = new Size(1000, 1000)
		}
				
		paper.setup(<any>this.canvas)
		paper.project.currentStyle.strokeColor = new paper.Color('black')
		paper.project.currentStyle.strokeWidth = 0.5
		paper.project.currentStyle.strokeScaling = false

		let mainLayer = new paper.Layer()

		this.dragging = false
		this.previousPosition = new paper.Point(0, 0)
		
		paper.view.draw()
		document.addEventListener('SettingChanged', (event: CustomEvent)=> this.onSettingChanged(event), false)
	}

	onSettingChanged(event: CustomEvent) {
		if(event.detail.all || event.detail.parentNames[0] == 'Machine dimensions') {
			this.centerOnTipibot(Settings.tipibot, true)
		}
	}

	centerOnTipibot(tipibot: {width: number, height: number}, zoom=true, canvas=this.canvas) {
		if(zoom) {
			let margin = 200
			let ratio = isServer ? 1 : Math.max((Settings.tipibot.width + margin) / canvas.width * window.devicePixelRatio, (Settings.tipibot.height + margin) / canvas.height * window.devicePixelRatio)
			paper.view.zoom = 1 / ratio
			document.dispatchEvent(createEvent('ZoomChanged', { detail: { } }))
		}

		paper.view.center = new paper.Point(Settings.tipibot.width / 2, Settings.tipibot.height / 2)
	}

	getDomElement(): any {
		return paper.view.element
	}

	windowResize(){
		if(this.ignoreWindowResize) {
			return
		}
		
		let container = document.getElementById('canvas')
		let width = container.offsetWidth
		let height = container.offsetHeight
		this.canvas.width = width
		this.canvas.height = height
		paper.view.viewSize = new paper.Size(width, height)

		this.centerOnTipibot(Settings.tipibot, false)
	}

	getMousePosition(event: MouseEvent): paper.Point {
		return new paper.Point(event.clientX, event.clientY)
	}

	getWorldPosition(event: MouseEvent): paper.Point {
		return paper.view.viewToProject(this.getMousePosition(event))
	}

	mouseDown(event: MouseEvent) {
		this.dragging = true
		this.previousPosition = this.getMousePosition(event)
	}

	mouseMove(event: MouseEvent) {
		if(event.buttons == 4 || this.spacePressed && this.dragging) { 											// wheel button
			let position = this.getMousePosition(event)
			paper.view.translate(position.subtract(this.previousPosition).divide(paper.view.zoom))
			paper.view.update()
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
		let cursorPosition = this.getWorldPosition(event)
		paper.view.zoom = Math.max(0.1, Math.min(5, paper.view.zoom - event.deltaY / 300))
		document.dispatchEvent(createEvent('ZoomChanged', { detail: { } }))
		let newCursorPosition = this.getWorldPosition(event)
		paper.view.translate(newCursorPosition.subtract(cursorPosition))
	}

	keyDown(event: KeyboardEvent) {
		switch (event.keyCode) {
			case 32: 			// space
				this.spacePressed = true
				document.getElementById('canvas').classList.add('grab')
		}
	}

	keyUp(event: KeyboardEvent) {
		switch (event.keyCode) {
			case 32: 			// space
				this.spacePressed = false
				document.getElementById('canvas').classList.remove('grab')
		}
	}

	render() {
	}
}