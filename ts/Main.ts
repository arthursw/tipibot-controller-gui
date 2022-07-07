/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/file-saver/index.d.ts"/>

// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"
import $ = require("jquery");
import { Settings, paper } from "./Settings"
import { settingsManager } from "./SettingsManager"
import { TipibotInteractive as Tipibot } from "./TipibotInteractive"
import { Renderer } from "./Renderer"
import { Pen } from "./Pen"
import { SVGPlot } from "./Plot"
// import { CalibrationInteractive } from "./CalibrationInteractive"
import { CommunicationInteractive } from "./Communication/CommunicationInteractive"
import { CommandDisplay } from "./Communication/CommandDisplay"
import { initializeKeyboard } from "./Keyboard"
import { GUI } from "./GUI"
import { Console } from "./Console"
import { VisualFeedback, visualFeedback } from "./VisualFeedback"
import { CommeUnDesseinInteractive } from "./Plugins/CommeUnDesseinInteractive"
import { Telescreen } from "./Plugins/Telescreen"
import { SVGSplitter } from "./Plugins/SVGSplitter"
import { FileManager } from "./Plugins/FileManager"
import { LiveDrawing } from "./Plugins/LiveDrawing"
import { GCodeViewer } from "./Plugins/GCodeViewer"


declare var addWheelListener: any
declare var dat: any

let communication: CommunicationInteractive = null

let container = null

let renderer: Renderer = null

let gui: GUI

let positionPreview: paper.Path = null

let drawing = {
	scale: 1,
}

let w = <any>window

document.addEventListener("DOMContentLoaded", function (event:any) {


	function initialize() {

		dat.GUI.DEFAULT_WIDTH = 325

		renderer = new Renderer()

		w.virtualKeyboard = initializeKeyboard()

		gui = new GUI({ autoPlace: false })
		
		let controllerConsole = new Console()

		let commandDisplay = new CommandDisplay()

		commandDisplay.createGUI(controllerConsole)
		controllerConsole.createGUI()

		let customContainer = document.getElementById('gui')
		customContainer.appendChild(gui.getDomElement())
		
		communication = new CommunicationInteractive(gui)

		settingsManager.createGUI(gui, w.virtualKeyboard)

		SVGPlot.createGUI(gui)

		// CalibrationInteractive.initialize(gui)
		
		communication.setTipibot(Tipibot.tipibot)
		Tipibot.tipibot.initialize()

		renderer.centerOnTipibot(Settings.tipibot)


		VisualFeedback.initialize()


		let pluginFolder = gui.addFolder('Plugins')

		let commeUnDessein = new CommeUnDesseinInteractive()
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

		let gcodeViewer = new GCodeViewer()
		gcodeViewer.createGUI(pluginFolder)

		// debug
		w.tipibot = Tipibot.tipibot
		w.settingsManager = settingsManager
		w.Settings = Settings
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
		requestAnimationFrame(animate)
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

		if (Tipibot.tipibot.settingPosition) {
			let position = renderer.getWorldPosition(event)
			if (positionPreview == null) {
				positionPreview = new paper.Path.Circle(position, Pen.HOME_RADIUS)
			}
			positionPreview.position = position
			Tipibot.tipibot.setPositionSliders(position)
		}
	}

	function mouseUp(event: MouseEvent) {
		renderer.mouseUp(event)
		if (Tipibot.tipibot.settingPosition && !settingsManager.tipibotPositionFolder.getController('Set position with mouse').contains(<HTMLElement>event.target)) {
			if (positionPreview != null) {
				positionPreview.remove()
				positionPreview = null
			}
			Tipibot.tipibot.setPosition(renderer.getWorldPosition(event))
			Tipibot.tipibot.toggleSetPosition(false, false)
		}
	}

	function mouseLeave(event: MouseEvent) {
		renderer.mouseLeave(event)
	}

	function mouseWheel(event: WheelEvent) {
		renderer.mouseWheel(event)
	}

	function keyDown(event: KeyboardEvent) {
		Tipibot.tipibot.keyDown(event)
		renderer.keyDown(event)
	}

	function keyUp(event: KeyboardEvent) {
		Tipibot.tipibot.keyUp(event)
		renderer.keyUp(event)
	}


	window.addEventListener('resize', windowResize, false)
	document.body.addEventListener('mousedown', mouseDown)
	document.body.addEventListener('mousemove', mouseMove)
	document.body.addEventListener('mouseup', mouseUp)
	document.body.addEventListener('mouseleave', mouseLeave)
	document.body.addEventListener('keydown', keyDown)
	document.body.addEventListener('keyup', keyUp)
	addWheelListener(document.body, mouseWheel)
});
