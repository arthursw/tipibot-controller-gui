/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/paper/index.d.ts"/>
/// <reference path="../node_modules/@types/file-saver/index.d.ts"/>

// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"

import { Settings, settingsManager } from "./Settings"
import { Tipibot, tipibot } from "./Tipibot"
import { Renderer } from "./Renderer"
import { Pen } from "./Pen"
import { SVGPlot } from "./Plot"
import { Communication } from "./Communication/Communication"
import { CommandDisplay } from "./Communication/CommandDisplay"
import { GUI } from "./GUI"
import { Console } from "./Console"
import { VisualFeedback, visualFeedback } from "./VisualFeedback"
import { CommeUnDessein } from "./Plugins/CommeUnDessein"
import { Telescreen } from "./Plugins/Telescreen"
import { SVGSplitter } from "./Plugins/SVGSplitter"
import { FileManager } from "./Plugins/FileManager"
import { LiveDrawing } from "./Plugins/LiveDrawing"

declare var addWheelListener: any
declare var dat: any

let communication: Communication = null

let container = null

let renderer: Renderer = null

let gui: GUI

let positionPreview: paper.Path = null

let drawing = {
	scale: 1,
}

let w = <any>window

document.addEventListener("DOMContentLoaded", function(event) { 


	function initialize() {

		dat.GUI.DEFAULT_WIDTH = 325
		gui = new GUI({ autoPlace: false })

		let controllerConsole = new Console()
		let commandDisplay = new CommandDisplay()
		commandDisplay.createGUI(controllerConsole.gui)
		controllerConsole.createGUI()

		let customContainer = document.getElementById('gui')
		customContainer.appendChild(gui.getDomElement())
		
		communication = new Communication(gui)

		settingsManager.createGUI(gui)
		
		SVGPlot.createGUI(gui)
		
		renderer = new Renderer()
		
		communication.setTipibot(tipibot)
		tipibot.initialize()

		renderer.centerOnTipibot(Settings.tipibot)


		VisualFeedback.initialize()
		

		let pluginFolder = gui.addFolder('Plugins')

		let commeUnDessein = new CommeUnDessein()
		commeUnDessein.createGUI(pluginFolder)

		let telescreen = new Telescreen()
		telescreen.createGUI(pluginFolder)

		let svgSplitter = new SVGSplitter()
		svgSplitter.createGUI(pluginFolder)

		let fileManager = new FileManager()
		fileManager.createGUI(pluginFolder)

		let liveDrawing = new LiveDrawing()
		liveDrawing.createGUI(pluginFolder)
		liveDrawing.setRenderer(renderer)
		
		// debug
		w.tipibot = tipibot
		w.settingsManager = settingsManager
		w.gui = gui
		w.GUI = GUI
		w.renderer = renderer
		w.communication = communication
		w.commandDisplay = commandDisplay
		w.visualFeedback = visualFeedback
		w.SVGPlot = SVGPlot
		w.commeUnDessein = commeUnDessein
		w.telescreen = telescreen
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
	}

	function eventWasOnGUI(event: MouseEvent) {
		return $.contains(document.getElementById('gui'), <any>event.target) || $.contains(document.getElementById('info'), <any>event.target)
	}

	function mouseDown(event: MouseEvent) {
		renderer.mouseDown(event)
	}

	function mouseMove(event: MouseEvent) {
		renderer.mouseMove(event)

		if(tipibot.settingPosition) {
			let position = renderer.getWorldPosition(event)
			if(positionPreview == null) {
				positionPreview = paper.Path.Circle(position, Pen.HOME_RADIUS)
			}
			positionPreview.position = position
			tipibot.setPositionSliders(position)
		}
	}

	function mouseUp(event: MouseEvent) {
		renderer.mouseUp(event)
		if(tipibot.settingPosition && !settingsManager.tipibotPositionFolder.getController('Set position with mouse').contains(<HTMLElement>event.target) ) {
			if(positionPreview != null) {
				positionPreview.remove()
				positionPreview = null
			}
			tipibot.setPosition(renderer.getWorldPosition(event))
			tipibot.toggleSetPosition(false, false)
		}
	}

	function mouseLeave(event: MouseEvent) {
		renderer.mouseLeave(event)
	}

	function mouseWheel(event: WheelEvent) {
		renderer.mouseWheel(event)
	}

	function keyDown(event: KeyboardEvent) {
		tipibot.keyDown(event)
		renderer.keyDown(event)
	}

	function keyUp(event: KeyboardEvent) {
		tipibot.keyUp(event)
		renderer.keyUp(event)
	}

	window.addEventListener( 'resize', windowResize, false )
	document.body.addEventListener('mousedown', mouseDown)
	document.body.addEventListener('mousemove', mouseMove)
	document.body.addEventListener('mouseup', mouseUp)
	document.body.addEventListener('mouseleave', mouseLeave)
	document.body.addEventListener('keydown', keyDown)
	document.body.addEventListener('keyup', keyUp)
	addWheelListener(document.body, mouseWheel)
});
