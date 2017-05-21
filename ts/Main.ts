/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/paper/index.d.ts"/>
/// <reference path="../node_modules/@types/file-saver/index.d.ts"/>

// Todo:
// - add feedback when setting position (when click setPosition)
// - set position: update x, y in real time
// - make a visual difference between penUp / penDown (on the pen: fill / no fill)
// - stop
// - motorOff
// - goHome
// - up/down/left/right keys to move pen position
// - svg rotate / flipX / flipY


// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"

import { Settings, settingsManager } from "./Settings"
import { Tipibot, tipibot } from "./Tipibot"
import { Renderer, ThreeRenderer, PaperRenderer } from "./Renderers"
import { Pen } from "./Pen"
import { Plot, SVGPlot } from "./Plot"
import { Communication } from "./Communication"
import { Draggable } from "./Draggable"
import { GUI } from "./GUI"
import { Circle } from "./Shapes"

declare var addWheelListener: any

let communication: Communication = null

let container = null

let renderer: Renderer = null

let gui: GUI
let positionPreview: Circle = null

let drawing = {
	scale: 1,
}

document.addEventListener("DOMContentLoaded", function(event) { 


	function initialize() {

		gui = new GUI()

		settingsManager.createGUI(gui)
		SVGPlot.createGUI(gui)
		Plot.createGUI(SVGPlot.gui)

		// gui.add(Settings.tipibot, 'speed', 0, 2000)
		

		communication = new Communication(gui)

		renderer = new PaperRenderer()
		SVGPlot.renderer = renderer

		tipibot.initialize(renderer)

		renderer.centerOnTipibot(Settings.tipibot)
		renderer.createDrawingLayer()
	}

	initialize()
	
	let animate = () => {
		requestAnimationFrame( animate )
		renderer.render()
	}

	animate()

	function windowResize() {
		renderer.windowResize()
	}

	function mouseDown(event: MouseEvent) {
		for(let draggable of Draggable.draggables) {
			draggable.mouseDown(event)
		}
		renderer.mouseDown(event)
	}

	function mouseMove(event: MouseEvent) {
		for(let draggable of Draggable.draggables) {
			draggable.mouseMove(event)
		}
		renderer.mouseMove(event)

		if(settingsManager.settingPosition) {
			let position = renderer.getWorldPosition(event)
			if(positionPreview == null) {
				positionPreview = renderer.createCircle(position.x, position.y, Pen.RADIUS)
			}
			positionPreview.setPosition(position)
			settingsManager.setPositionSliders(position)
		}
	}

	function mouseUp(event: MouseEvent) {
		for(let draggable of Draggable.draggables) {
			draggable.mouseUp(event)
		}
		renderer.mouseUp(event)
		if(settingsManager.settingPosition && !settingsManager.setPositionButton.contains(<HTMLElement>event.target) ) {
			if(positionPreview != null) {
				positionPreview.remove()
				positionPreview = null
			}
			tipibot.setPosition(renderer.getWorldPosition(event))
			settingsManager.toggleSetPosition(false)
		}
	}

	function mouseLeave(event: MouseEvent) {
		for(let draggable of Draggable.draggables) {
			draggable.mouseLeave(event)
		}
		renderer.mouseLeave(event)
	}

	function mouseWheel(event: WheelEvent) {
		renderer.mouseWheel(event)
	}

	window.addEventListener( 'resize', windowResize, false )
	document.body.addEventListener('mousedown', mouseDown)
	document.body.addEventListener('mousemove', mouseMove)
	document.body.addEventListener('mouseup', mouseUp)
	document.body.addEventListener('mouseleave', mouseLeave)
	addWheelListener(document.body, mouseWheel)
});
