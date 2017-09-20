/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/paper/index.d.ts"/>
/// <reference path="../node_modules/@types/file-saver/index.d.ts"/>

// Todo:
// - make a visual difference between penUp / penDown (on the pen: fill / no fill)
// - up/down/left/right keys to move pen position
// - reorganize GUI folders (settings)

// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"

import { Settings, settingsManager } from "./Settings"
import { Tipibot, tipibot } from "./Tipibot"
import { Renderer, ThreeRenderer, PaperRenderer } from "./Renderers"
import { Pen } from "./Pen"
import { Plot, SVGPlot } from "./Plot"
import { Communication } from "./Communication/Communication"
import { Draggable } from "./Draggable"
import { GUI } from "./GUI"
import { Circle } from "./Shapes"
import { CommeUnDessein } from "./Plugins/CommeUnDessein"
import { Telescreen } from "./Plugins/Telescreen"

declare var addWheelListener: any

let communication: Communication = null

let container = null

let renderer: Renderer = null

let gui: GUI
let positionPreview: Circle = null

let drawing = {
	scale: 1,
}

let w = <any>window

w.send = function(message: string) {
	communication.interpreter.send(message)
}

w.addPlugin = function(pluginName: string) {
	if(pluginName == 'CommeUnDessein') {
		
		let commeUnDessein = new CommeUnDessein()
		commeUnDessein.createGUI(gui)
		w.commeUnDessein = commeUnDessein

	} else if(pluginName == 'Telescreen') {

		let telescreen = new Telescreen()
		telescreen.createGUI(gui)
		w.telescreen = telescreen

	}
}

document.addEventListener("DOMContentLoaded", function(event) { 


	function initialize() {

		gui = new GUI()
		
		let communicationFolder = gui.addFolder('Communication')
		communication = new Communication(communicationFolder)
		communicationFolder.open()

		let commandFolder = gui.addFolder('Commands')
		commandFolder.open()

		settingsManager.createGUI(gui)
		
		SVGPlot.createGUI(gui)
		Plot.createGUI(SVGPlot.gui)
		
		renderer = new PaperRenderer()
		SVGPlot.renderer = renderer
		
		communication.setTipibot(tipibot)
		tipibot.initialize(renderer, commandFolder)

		renderer.centerOnTipibot(Settings.tipibot)
		renderer.createDrawingLayer()

		// debug
		w.tipibot = tipibot
		w.settingsManager = settingsManager
		w.gui = gui
		w.renderer = renderer
		w.communication = communication
	}

	initialize()
	
	let animate = () => {
		requestAnimationFrame( animate )
		renderer.render()
	}

	animate()

	function windowResize() {
		renderer.windowResize()
		renderer.centerOnTipibot(Settings.tipibot, false)
	}

	function eventWasOnGUI(event: MouseEvent) {
		return $.contains(gui.getDomElement(), <any>event.target)
	}

	function mouseDown(event: MouseEvent) {
		if(!eventWasOnGUI(event)) {
			for(let draggable of Draggable.draggables) {
				draggable.mouseDown(event)
			}
		}
		renderer.mouseDown(event)
	}

	function mouseMove(event: MouseEvent) {
		for(let draggable of Draggable.draggables) {
			draggable.mouseMove(event)
		}
		renderer.mouseMove(event)

		if(tipibot.settingPosition) {
			let position = renderer.getWorldPosition(event)
			if(positionPreview == null) {
				positionPreview = renderer.createCircle(position.x, position.y, Pen.HOME_RADIUS)
			}
			positionPreview.setPosition(position)
			tipibot.setPositionSliders(position)
		}
	}

	function mouseUp(event: MouseEvent) {
		if(!eventWasOnGUI(event)) {
			for(let draggable of Draggable.draggables) {
				draggable.mouseUp(event)
			}
		}
		renderer.mouseUp(event)
		if(tipibot.settingPosition && !settingsManager.tipibotPositionFolder.getController('Set position').contains(<HTMLElement>event.target) ) {
			if(positionPreview != null) {
				positionPreview.remove()
				positionPreview = null
			}
			tipibot.setPosition(renderer.getWorldPosition(event))
			tipibot.toggleSetPosition(false, false)
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

	function keyDown(event: KeyboardEvent) {
		tipibot.keyDown(event)
	}

	window.addEventListener( 'resize', windowResize, false )
	document.body.addEventListener('mousedown', mouseDown)
	document.body.addEventListener('mousemove', mouseMove)
	document.body.addEventListener('mouseup', mouseUp)
	document.body.addEventListener('mouseleave', mouseLeave)
	document.body.addEventListener('keydown', keyDown)
	addWheelListener(document.body, mouseWheel)
});
