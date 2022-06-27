import { Settings, paper } from "./Settings"
import { Tipibot } from "./TipibotStatic"
import { Communication } from "./Communication/CommunicationStatic"
import { GUI } from "./GUI"
import { SVGPlotStatic } from "./PlotStatic";
import { settingsManager } from "./SettingsManager";

export class SVGPlotInteractive extends SVGPlotStatic {

	static gui: GUI = null
	static transformFolder: GUI = null

	public static loadImage(event: any, callback: ()=>void = null) {
		let svg = paper.project.importSVG(event.target.result)

		let svgPlot = new SVGPlotStatic(svg)

		SVGPlotInteractive.gui.getController('Draw').show()
		SVGPlotInteractive.gui.getController('Save GCode').show()
		console.log('SVG imported.')

		GUI.stopLoadingAnimation()

		if(callback != null) {
			callback()
		}
	}

	public static onImageLoad(event: any, callback: ()=>void = null) {
		console.log('Importing SVG...')

		GUI.startLoadingAnimation(()=>SVGPlotInteractive.loadImage(event, callback))
	}

	public static handleFileSelect(event: any) {
		document.dispatchEvent(new CustomEvent('Load SVG'))

		this.gui.getController('Load SVG').hide()
		this.gui.getController('Clear SVG').show()

		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		this.files = []

		for (let i = 0; i < files.length; i++) {
			let file = files[i] != null ? files[i] : files.item(i)
			
			let imageType = /^image\//

			if (!imageType.test(file.type)) {
				continue
			}

			this.files.push(file)
		}

		// this.multipleFiles = this.files.length > 1
		this.fileIndex = 0

		if(this.files.length < files.length) {
			console.info('Warning: some of the selected files are not SVG images, there will not be imported.')
		}

		// if(this.multipleFiles) {
		// 	console.info('Only the first file will be imported for now, the other files will be imported one by one while drawing.')
		// }

		this.loadNextFile()
	}

	public static loadNextFile(callback: ()=>void = null) {
		if(this.fileIndex >= this.files.length) {
			return
		}
		let file = this.files[this.fileIndex]
		let reader = new FileReader()
		reader.onload = (event)=> this.onImageLoad(event, callback)
		reader.readAsText(file)
	}

	public static clearClicked(event: any) {
		document.dispatchEvent(new CustomEvent('Clear SVG'))
		this.fileIndex = 0
		Communication.interpreter.clearQueue()
		SVGPlotInteractive.gui.getController('Load SVG').show()
		SVGPlotInteractive.gui.getController('Clear SVG').hide()
		SVGPlotInteractive.svgPlot.destroy()
		SVGPlotInteractive.svgPlot = null
		SVGPlotInteractive.gui.getController('Draw').name('Draw')
		SVGPlotInteractive.gui.getController('Draw').hide()
		SVGPlotInteractive.gui.getController('Save GCode').hide()
	}

	public static drawClicked(event: any) {
		if(SVGPlotInteractive.svgPlot != null) {
			if(!SVGPlotInteractive.svgPlot.plotting) {
				SVGPlotInteractive.gui.getController('Draw').name('Stop, clear commands & go home')
				document.dispatchEvent(new CustomEvent('Draw'))
				SVGPlotInteractive.plotAndLoadLoop()
			} else {
				SVGPlotInteractive.gui.getController('Draw').name('Draw')
				document.dispatchEvent(new CustomEvent('Stop drawing'))
				Communication.interpreter.sendStop(true)
				Communication.interpreter.clearQueue()
				SVGPlotInteractive.svgPlot.plotting = false
				Tipibot.tipibot.goHome()
			}
		}
	}

	public static saveGCodeClicked(event: any) {
		if(SVGPlotInteractive.svgPlot != null) {
			Communication.interpreter.sendStop(true)
			Communication.interpreter.clearQueue()
			Communication.interpreter.justQueueCommands = true
			SVGPlotInteractive.saveGCode()
			let gCode = Communication.interpreter.getGCode()
			let blob = new Blob([gCode], {type: "text/plain;charset=utf-8"})
			saveAs(blob, "gcode.txt")
			Communication.interpreter.clearQueue()
			Communication.interpreter.justQueueCommands = false
		}
	}

	public static createGUI(gui: GUI) {
		SVGPlotInteractive.gui = gui.addFolder('Plot')
		SVGPlotInteractive.gui.open()

		// SVGPlotInteractive.gui.add(Settings.plot, 'fullSpeed').name('Full speed').onFinishChange((value)=> settingsManager.save(false))
		SVGPlotInteractive.gui.add(Settings.plot, 'optimizeTrajectories').name('Optimize Trajectories').onFinishChange((event)=> settingsManager.save(false))
		SVGPlotInteractive.gui.add(Settings.plot, 'disableMotorsOnceFinished').name('Disable motors once finished').onFinishChange((event)=> settingsManager.save(false))
		// SVGPlotInteractive.gui.add(Settings.plot, 'maxCurvatureFullspeed', 0, 180, 1).name('Max curvature').onFinishChange((value)=> settingsManager.save(false))

		SVGPlotInteractive.gui.addFileSelectorButton('Load SVG', 'image/svg+xml', true, (event)=> SVGPlotInteractive.handleFileSelect(event))
		let clearSVGButton = SVGPlotInteractive.gui.addButton('Clear SVG', SVGPlotInteractive.clearClicked)
		clearSVGButton.hide()
		let drawButton = SVGPlotInteractive.gui.addButton('Draw', SVGPlotInteractive.drawClicked)
		drawButton.hide()
		let saveGCodeButton = SVGPlotInteractive.gui.addButton('Save GCode', SVGPlotInteractive.saveGCodeClicked)
		saveGCodeButton.hide()

		let filterFolder = SVGPlotInteractive.gui.addFolder('Filter')
		filterFolder.add(Settings.plot, 'showPoints').name('Show points').onChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.showPoints, true))
		filterFolder.add(Settings.plot, 'flatten').name('Flatten').onChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.filter))
		filterFolder.add(Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.filter))
		filterFolder.add(Settings.plot, 'subdivide').name('Subdivide').onChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.filter))
		filterFolder.add(Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.filter))

		let transformFolder = SVGPlotInteractive.gui.addFolder('Transform')
		SVGPlotInteractive.transformFolder = transformFolder
		transformFolder.addButton('Center', SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.center))
		transformFolder.addSlider('X', 0).onFinishChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.setX, true))
		transformFolder.addSlider('Y', 0).onFinishChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.setY, true))
		
		transformFolder.addButton('Flip horizontally', SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.flipX))
		transformFolder.addButton('Flip vertically', SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.flipY))

		transformFolder.addButton('Rotate', SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.rotate))

		transformFolder.addSlider('Scale', 1, 0.1, 5).onChange(SVGPlotInteractive.createCallback(SVGPlotInteractive.prototype.scale, true))
	}

	public static createCallback(f: (p1?: any)=>void, addValue: boolean = false, parameters: any[] = []) {
		return (value: any)=> { 
			settingsManager.save(false)
			if(SVGPlotInteractive.svgPlot != null) { 
				if(addValue) {
					parameters.unshift(value)
				}
				f.apply(SVGPlotInteractive.svgPlot, parameters)
			} 
		}
	}

	constructor(item: paper.Item=null) {
		super(item)
	}

	onMouseDrag(event:any) {
		if(Tipibot.tipibot.pen.dragging || this.checkPlotting()) {
			return
		}
		this.group.position = this.group.position.add(event.delta)
		this.updatePositionGUI()
	}

	updatePositionGUI() {
		SVGPlotInteractive.transformFolder.getController('X').setValueNoCallback(this.group.bounds.left - Tipibot.tipibot.drawArea.bounds.left)
		SVGPlotInteractive.transformFolder.getController('Y').setValueNoCallback(this.group.bounds.top - Tipibot.tipibot.drawArea.bounds.top)
	}

	plot(callback: ()=> void = null, goHomeOnceFinished = true, gCode = false) {
		GUI.startLoadingAnimation()
		super.plot(callback, goHomeOnceFinished, gCode)
		GUI.stopLoadingAnimation()
	}

	plotFinished(callback: ()=> void = null) {
		SVGPlotInteractive.gui.getController('Draw').name('Draw')
		super.plotFinished(callback)
	}

	rotate() {
		super.rotate()
		this.updatePositionGUI()
	}

	scale(value: number) {
		super.scale(value)
		this.updatePositionGUI()
	}

	center() {
		super.center()
		this.updatePositionGUI()
	}
}