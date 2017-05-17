/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/paper/index.d.ts"/>

// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"

import { Settings, SettingsManager } from "./Settings"
import { Renderer, ThreeRenderer, PaperRenderer } from "./Renderers"
import { Pen } from "./Pen"
import { Plot, SVGPlot } from "./Plot"
import { Communication } from "./Communication"
import { Draggable } from "./Draggable"

declare var addWheelListener: any
declare var dat: any

let communication: Communication = null

let container = null

let pen: Pen
let renderer: Renderer

let drawing = {
	scale: 1,
}

document.addEventListener("DOMContentLoaded", function(event) { 


	function initialize() {

		var gui = new dat.GUI();

		SettingsManager.createGUI(gui)
		SVGPlot.createGUI(gui)
		Plot.createGUI(gui)

		gui.add(Settings.machine, 'speed', 0, 2000)
		

		communication = new Communication(gui)

		renderer = new PaperRenderer()

		let machineRectangle = renderer.createRectangle(0, 0, Settings.machine.width, Settings.machine.height)
		let paperRectangle = renderer.createRectangle(Settings.drawArea.x, Settings.drawArea.y, Settings.drawArea.width, Settings.drawArea.height)
		let motorLeft = renderer.createCircle(0, 0, 50, 24)
		let motorRight = renderer.createCircle(Settings.machine.width, 0, 50, 24)

		renderer.centerOnMachine(Settings.machine)

		// Pen
		pen = renderer.createPen(Settings.machine.homeX, Settings.machine.homeY, Settings.machine.width, communication)
		SVGPlot.pen = pen.item

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

	function getWorldPosition(event:MouseEvent): paper.Point {
		return paper.view.viewToProject(new paper.Point(event.clientX, event.clientY))
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
	}

	function mouseUp(event: MouseEvent) {
		for(let draggable of Draggable.draggables) {
			draggable.mouseUp(event)
		}
		renderer.mouseUp(event)
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
