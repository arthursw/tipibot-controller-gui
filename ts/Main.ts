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
import { Renderer } from "./RendererInterface"
import { ThreeRenderer, PaperRenderer } from "./Renderers"
import { Pen } from "./Pen"
import { Plot, SVGPlot } from "./Plot"
import { Communication } from "./Communication/Communication"
import { CommandDisplay } from "./Communication/CommandDisplay"
import { InteractiveItem } from "./InteractiveItem"
import { GUI } from "./GUI"
import { Console } from "./Console"
import { Circle } from "./Shapes"
import { VisualFeedback } from "./VisualFeedback"
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
	communication.interpreter.send({ id: -1, data: message, callback: ()=> console.log('Command' + message + ' done.') })
}

w.addPlugin = function(pluginName: string, testMode: boolean) {
	if(pluginName == 'CommeUnDessein') {
		
		let commeUnDessein = new CommeUnDessein(testMode)
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

		gui = new GUI({ autoPlace: false })

		// let console = new Console()

		let customContainer = document.getElementById('gui')
		customContainer.appendChild(gui.getDomElement())
		
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

		let commandDisplay = new CommandDisplay()
		commandDisplay.createGUI(gui)

		let visualFeedback = new VisualFeedback()

		// debug
		w.tipibot = tipibot
		w.settingsManager = settingsManager
		w.gui = gui
		w.renderer = renderer
		w.communication = communication
		w.commandDisplay = commandDisplay
		w.visualFeedback = visualFeedback
	}

	initialize()
	
	let animate = () => {
		w.nCall = 0
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
			InteractiveItem.mouseDown(event)
		}
		renderer.mouseDown(event)
	}

	function mouseMove(event: MouseEvent) {
		InteractiveItem.mouseMove(event)
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
			InteractiveItem.mouseUp(event)
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
		InteractiveItem.mouseLeave(event)
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
