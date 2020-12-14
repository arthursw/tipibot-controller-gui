import { Tipibot, tipibot } from "./Tipibot"
import { Settings, settingsManager, SettingsManager } from "./Settings"
import { Communication, communication } from "./Communication/Communication"
import { GUI, Controller } from "./GUI"
import { Pen } from './Pen'
import { Int8BufferAttribute } from "../libs/three"

export class SVGPlot {

	static svgPlot: SVGPlot = null
	static gui: GUI = null
	static transformFolder: GUI = null
	
	static files: File[] = null
	static multipleFiles = false
	static fileIndex = 0
	static currentMatrix: paper.Matrix = null

	readonly pseudoCurvatureDistance = 10 		// in mm
	
	public static readonly nSegmentsPerBatch = 1000
	public static readonly nSegmentsMax = SVGPlot.nSegmentsPerBatch * 3

	currentColorIndex = 0
	nSegments = 0
	currentPath: paper.Path = null

	public static loadImage(event: any, callback: ()=>void = null) {
		let svg = paper.project.importSVG(event.target.result)

		let svgPlot = new SVGPlot(svg)
		// svgPlot.center()

		SVGPlot.gui.getController('Draw').show()
		SVGPlot.gui.getController('Save GCode').show()
		console.log('SVG imported.')

		GUI.stopLoadingAnimation()

		if(callback != null) {
			callback()
		}
	}

	public static onImageLoad(event: any, callback: ()=>void = null) {
		console.log('Importing SVG...')

		GUI.startLoadingAnimation(()=>SVGPlot.loadImage(event, callback))
	}

	public static handleFileSelect(event: any) {
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

		this.multipleFiles = this.files.length > 1
		this.fileIndex = 0

		if(this.files.length < files.length) {
			console.info('Warning: some of the selected files are not SVG images, there will not be imported.')
		}

		if(this.multipleFiles) {
			console.info('Only the first file will be imported for now, the other files will be imported one by one while drawing.')
		}

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

	public static plotFinished(callback:()=> void = null) {
		if(this.multipleFiles) {
			this.fileIndex++
			if(this.fileIndex < this.files.length) {
				this.loadNextFile(()=> this.plotAndLoadLoop(callback))
			} else {
				tipibot.goHome()
				if(callback != null) {
					callback()
				}
				if(Settings.plot.disableMotorsOnceFinished) {
					tipibot.disableMotors(true)
				}
			}
		}
	}

	public static plotAndLoadLoop(callback:()=> void = null) {
		if(this.svgPlot == null) {
			return
		}
		this.svgPlot.plot(()=> SVGPlot.plotFinished(callback), !this.multipleFiles)
	}

	public static saveGCode() {
		if(this.svgPlot == null) {
			return
		}
		this.svgPlot.plot(null, !this.multipleFiles, true)
	}

	public static clearClicked(event: any) {
		this.fileIndex = 0
		communication.interpreter.clearQueue()
		SVGPlot.gui.getController('Load SVG').show()
		SVGPlot.gui.getController('Clear SVG').hide()
		SVGPlot.svgPlot.destroy()
		SVGPlot.svgPlot = null
		SVGPlot.gui.getController('Draw').name('Draw')
		SVGPlot.gui.getController('Draw').hide()
		SVGPlot.gui.getController('Save GCode').hide()
	}

	public static drawClicked(event: any) {
		if(SVGPlot.svgPlot != null) {
			if(!SVGPlot.svgPlot.plotting) {
				SVGPlot.gui.getController('Draw').name('Stop, clear commands & go home')
				SVGPlot.plotAndLoadLoop()
			} else {
				SVGPlot.gui.getController('Draw').name('Draw')
				communication.interpreter.sendStop(true)
				communication.interpreter.clearQueue()
				SVGPlot.svgPlot.plotting = false
				tipibot.goHome()
			}
		}
	}

	public static saveGCodeClicked(event: any) {
		if(SVGPlot.svgPlot != null) {
			communication.interpreter.sendStop(true)
			communication.interpreter.clearQueue()
			communication.interpreter.saveGCode = true
			SVGPlot.saveGCode()
			let gCode = communication.interpreter.getGCode()
			let blob = new Blob([gCode], {type: "text/plain;charset=utf-8"})
			saveAs(blob, "gcode.txt")
			communication.interpreter.clearQueue()
			communication.interpreter.saveGCode = false
		}
	}

	public static createGUI(gui: GUI) {
		SVGPlot.gui = gui.addFolder('Plot')
		SVGPlot.gui.open()

		SVGPlot.gui.add(Settings.plot, 'fullSpeed').name('Full speed').onFinishChange((value)=> settingsManager.save(false))
		SVGPlot.gui.add(Settings.plot, 'optimizeTrajectories').name('Optimize Trajectories').onFinishChange((event)=> settingsManager.save(false))
		SVGPlot.gui.add(Settings.plot, 'disableMotorsOnceFinished').name('Disable motors once finished').onFinishChange((event)=> settingsManager.save(false))
		SVGPlot.gui.add(Settings.plot, 'maxCurvatureFullspeed', 0, 180, 1).name('Max curvature').onFinishChange((value)=> settingsManager.save(false))

		SVGPlot.gui.addFileSelectorButton('Load SVG', 'image/svg+xml', true, (event)=> SVGPlot.handleFileSelect(event))
		let clearSVGButton = SVGPlot.gui.addButton('Clear SVG', SVGPlot.clearClicked)
		clearSVGButton.hide()
		let drawButton = SVGPlot.gui.addButton('Draw', SVGPlot.drawClicked)
		drawButton.hide()
		let saveGCodeButton = SVGPlot.gui.addButton('Save GCode', SVGPlot.saveGCodeClicked)
		saveGCodeButton.hide()

		let filterFolder = SVGPlot.gui.addFolder('Filter')
		filterFolder.add(Settings.plot, 'showPoints').name('Show points').onChange(SVGPlot.createCallback(SVGPlot.prototype.showPoints, true))
		filterFolder.add(Settings.plot, 'flatten').name('Flatten').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))
		filterFolder.add(Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))
		filterFolder.add(Settings.plot, 'subdivide').name('Subdivide').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))
		filterFolder.add(Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))

		let transformFolder = SVGPlot.gui.addFolder('Transform')
		SVGPlot.transformFolder = transformFolder
		transformFolder.addButton('Center', SVGPlot.createCallback(SVGPlot.prototype.center))
		transformFolder.addSlider('X', 0).onFinishChange(SVGPlot.createCallback(SVGPlot.prototype.setX, true))
		transformFolder.addSlider('Y', 0).onFinishChange(SVGPlot.createCallback(SVGPlot.prototype.setY, true))
		
		transformFolder.addButton('Flip horizontally', SVGPlot.createCallback(SVGPlot.prototype.flipX))
		transformFolder.addButton('Flip vertically', SVGPlot.createCallback(SVGPlot.prototype.flipY))

		transformFolder.addButton('Rotate', SVGPlot.createCallback(SVGPlot.prototype.rotate))

		transformFolder.addSlider('Scale', 1, 0.1, 5).onChange(SVGPlot.createCallback(SVGPlot.prototype.scale, true))
	}

	public static createCallback(f: (p1?: any)=>void, addValue: boolean = false, parameters: any[] = []) {
		return (value: any)=> { 
			settingsManager.save(false)
			if(SVGPlot.svgPlot != null) { 
				if(addValue) {
					parameters.unshift(value)
				}
				f.apply(SVGPlot.svgPlot, parameters)
			} 
		}
	}

	public static itemMustBeDrawn(item: paper.Item) {
		return (item.strokeWidth > 0 && item.strokeColor != null) // || item.fillColor != null
	}

	public static convertShapeToPath(shape: paper.Shape): paper.Path {
		if(shape.className != 'Shape' || !this.itemMustBeDrawn(shape)) {
			return <any>shape
		}
		let path = shape.toPath(true)
		shape.parent.addChildren(shape.children)
		shape.remove()
		return path
	}

	// public static collapseItem(item: paper.Item, parent: paper.Item) {
	// 	item.applyMatrix = true

	// 	item = this.convertShapeToPath(<paper.Shape>item)

	// 	if(item.children != null) {
	// 		while(item.children.length > 0) {
	// 			let child = item.firstChild

	// 			child.applyMatrix = true

	// 			if(!this.itemMustBeDrawn(child)) {
	// 				child.strokeWidth = item.strokeWidth
	// 				child.strokeColor = item.strokeColor
	// 				child.fillColor = item.fillColor
	// 			}
	// 			if(child.strokeWidth > 0 && child.strokeColor == null) {
	// 				child.strokeColor == 'black'
	// 			}

	// 			child.remove()

	// 			if(this.itemMustBeDrawn(child)) {
	// 				parent.addChild(child)
	// 				this.collapseItem(child, parent)
	// 			}
	// 		}
	// 	}

	// 	if(item.className != 'Path') {
	// 		item.remove()
	// 	}
	// }

	public static checkBackground(item: paper.Path, parent: paper.Item, group: paper.Group = null, parentStrokeBounds: paper.Rectangle = null) {
		let isPathOrShape = item.className == 'Shape' || item.className == 'Path'
		let hasChildren = item.children != null && item.children.length > 0
		let isAsBigAsParent = item.strokeBounds.contains(parentStrokeBounds)
		let hasFourSegments = item.segments != null && item.segments.length == 4
		if( isPathOrShape && hasFourSegments && item.closed && isAsBigAsParent && !hasChildren ) {
			// We found the background: add it as a sibling of parent, it will be used to correctly position the svg
			item.remove()
			group.addChild(item)
			item.sendToBack()
			item.name = 'background'
			item.strokeColor = null
			item.strokeWidth = 0
			return true
		}
		return false
	}

	public static collapseItem(item: paper.Item, parent: paper.Item, group: paper.Group = null, parentStrokeBounds: paper.Rectangle = null) {
		item.applyMatrix = true

		if(group != null && this.checkBackground(<paper.Path>item, parent, group, parentStrokeBounds)) {
			return
		}

		item = this.convertShapeToPath(<paper.Shape>item)

		if(item.className == 'CompoundPath') {
			for(let child of item.children) {
				child.strokeColor = item.strokeColor
			}
		}

		item.remove()

		if(item.className == 'Path' && this.itemMustBeDrawn(item)) {
			parent.addChild(item)
		}

		while(item.children != null && item.children.length > 0) {
			this.collapseItem(item.firstChild, parent, group, parentStrokeBounds)
		}
	}

	public static collapse(item: paper.Item, group: paper.Group = null, parentStrokeBounds: paper.Rectangle = null) {
		if(item.children == null || item.children.length == 0) {
			return
		}
		let children = item.children.slice() // since we will remove and / or add children in collapse item
		for(let child of children) {
			this.collapseItem(child, item, group, parentStrokeBounds)
		}
	}

	public static subdividePath(path: paper.Path, maxSegmentLength: number) {
		if(path.segments != null) {
			for(let segment of path.segments) {
				let curve = segment.curve
				do{
					curve = curve.divideAt(maxSegmentLength)
				}while(curve != null);
			}
		}
	}

	public static filter(item: paper.Item) {
		for(let child of item.children) {
			if(child.className != 'Path') { 	// can be Shape if it is the background
				continue
			}
			let path = <paper.Path>child
			if(Settings.plot.flatten) {
				path.flatten(Settings.plot.flattenPrecision)
			}
			if(Settings.plot.subdivide) {
				this.subdividePath(path, Settings.plot.maxSegmentLength)
			}
		}
	}

	public static splitLongPaths(item: paper.Item) {
		for(let child of item.children) {	// recheck the newly created path since they still be too long
			let path = <paper.Path>child
			if(path.segments.length > SVGPlot.nSegmentsPerBatch) {
				path.splitAt(path.segments[SVGPlot.nSegmentsPerBatch-1].location)
			}
		}
	}

	group: paper.Group
	background: paper.Item
	item: paper.Item
	raster: paper.Raster
	originalItem: paper.Item 			// Not flattened
	
	plotting = false

	constructor(item: paper.Item=null) {

		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.destroy()
			SVGPlot.svgPlot = null
		}

		SVGPlot.svgPlot = this

		this.group = new paper.Group()
		this.group.sendToBack()

		if(SVGPlot.currentMatrix != null) {
			this.group.applyMatrix = false
			this.group.matrix = SVGPlot.currentMatrix
		}

		this.item = item
		this.item.strokeScaling = true

		// Note in paper.js:
		// When adding a child to a group, the group's position is updated 
		// to the average position of its children
		// and the bounds to fit all children's bounds
		// The children positions are still in global coordinates
		// http://sketch.paperjs.org/#S/hVOxboMwEP2VE0tAQkAGOkTqlKFrpVbKUDo42AErrg/Zph2q/nvPhpBA0lTIkrn37t27O/iONPsQ0SZ6OQpXt1Ea1cj9e57DrhUaGOdSN8CgbqXi4JCujcG+S8G1YriuLHRopZOoQVroO86c4FBpEqEEz2OfwrBGnHl4AOnsoGqEDlymeSDvsdfc+tSDdMCUmmhUaQAD/5W4J2RStsCMAOskpUkNjcI9IwFEQ42QL0qtdLANj6DFFzz5e5z4cMdcO0af6eqDPpTREOIQRKldXKRQJH9C6zNmncGj2KJCQ6pV1PWmU6KKZvBO8lC0HKPThEYfQXddFCmdZPJ+m1YWwVula5oDKpEpbOI5PzkJkPGtn13sq/6Xkud3qo418/yuhH9qaWolLiacbUPkYoJlCmVCJ3QRwOxAqzwNcYWG6UasJvCmo4fTHK6aHbL+a/caHL66BbSwsEBn25w+rzv7LZebmyvQv7k3gh07n2Gjzdv7zy8=

		this.group.addChild(this.item)

		// this.item.position = this.item.position.add(tipibot.drawArea.getBounds().topLeft)
		this.originalItem = null

		this.center()
		console.log("Collapsing SVG...")
		SVGPlot.collapse(this.item, this.group, this.item.strokeBounds)
		this.setBackground()
		console.log("SVG collapsed.")

		this.filter()

		this.group.onMouseDrag = (event)=> this.onMouseDrag(event)

		document.addEventListener('SettingChanged', (event: CustomEvent)=> this.onSettingChanged(event), false)
	}

	setBackground() {
		if(this.group.firstChild.name == 'background') {
			if(this.background != null) {
				this.background.remove()
			}
			this.background = this.group.firstChild
		}
	}
	
	countSegments() {
		let nSegments = 0
		for(let child of this.item.children) {
			let p = <paper.Path>child
			nSegments += p.segments.length
		}
		return nSegments
	}

	warnIfTooManyCommands() {

		let nSegments = this.countSegments()
		
		if(nSegments > SVGPlot.nSegmentsPerBatch) {
			let message = `Warning: there are ${nSegments} segments to draw. 
Optimizing trajectories and computing speeds (in full speed mode) will take some time to compute 
(but it will optimize drawing time), make sure to check your settings before starting drawing.`
			console.info(message)
		}

	}

	onSettingChanged(event: CustomEvent) {
		if(event.detail.all || event.detail.parentNames[0] == 'Pen') {
			if(event.detail.name == 'penWidth' && this.group != null) {
				this.updateShape()
			}
		}
	}

	onMouseDrag(event:any) {
		if(tipibot.pen.dragging || this.checkPlotting()) {
			return
		}
		this.group.position = this.group.position.add(event.delta)
		this.updatePositionGUI()
	}

	updatePositionGUI() {
		// SVGPlot.transformFolder.getController('X').setValueNoCallback(this.group.bounds.left - tipibot.drawArea.bounds.left)
		SVGPlot.transformFolder.getController('Y').setValueNoCallback(this.group.bounds.top - tipibot.drawArea.bounds.top)
	}

	saveItem() {
		// Fix paper.js bug: Maximum call stack size exceeded when cloning a path with many segments: https://github.com/paperjs/paper.js/issues/1493
		let nSegmentsMax = 100000
		for(let child of this.item.children) {
			let p = <paper.Path>child
			if(p.segments != null && p.segments.length > nSegmentsMax) {
				p.splitAt(p.segments[nSegmentsMax-1].location)
			}
		}
		this.originalItem = this.item.clone(false)
	}

	loadItem() {
		this.originalItem.position = this.item.position
		this.originalItem.applyMatrix = false
		this.originalItem.scaling = this.item.scaling
		this.item.remove()
		this.item = this.originalItem.clone(false)
		this.group.addChild(this.item)
	}

	updateShape() {
		if(this.raster != null) {
			this.raster.remove()
		}

		this.item.strokeWidth = Settings.tipibot.penWidth / this.group.scaling.x
		
		for(let child of this.item.children) {
			child.strokeWidth = Settings.tipibot.penWidth / this.group.scaling.x
		}

		this.item.selected = false
		this.item.visible = true

		// this.item.strokeColor = 'black'
		this.raster = this.item.rasterize(paper.project.view.resolution)
		this.group.addChild(this.raster)
		this.raster.sendToBack()
		if(this.background != null) {
			this.background.sendToBack()
		}
		this.item.selected = Settings.plot.showPoints
		this.item.visible = Settings.plot.showPoints
	}

	filter() {
		if(this.checkPlotting()) {
			return
		}

		if(this.originalItem == null && (Settings.plot.subdivide || Settings.plot.flatten)) {
			this.saveItem()
		} else if(this.originalItem != null) {
			this.loadItem()
		}
		
		console.log("Flattening and subdividing paths...")
		SVGPlot.filter(this.item)
		console.log("Paths flattenned and subdivided.")
		console.log("Splitting long paths...")
		SVGPlot.splitLongPaths(this.item)
		console.log("Paths split.")
		console.log("There are " + this.item.children.length + " paths in this SVG.")

		this.warnIfTooManyCommands()
		this.updateShape()
	}

	findClosestPath(path: paper.Path, parent: paper.Item): paper.Path {
		if(path.className != 'Path' || path.firstSegment == null || path.lastSegment == null) {
			return null
		}
		let closestPath: paper.Path = null
		let minDistance = Number.MAX_VALUE
		let reverse = false
		let leavePoint = path.closed ? path.firstSegment.point : path.lastSegment.point
		for(let child of parent.children) {
			let p = <paper.Path>child
			if(p == path || p.segments == null) {
				continue
			}
			let distance = p.firstSegment.point.getDistance(leavePoint)
			if(distance < minDistance) {
				minDistance = distance
				closestPath = p
				reverse = false
			}
			distance = p.lastSegment.point.getDistance(leavePoint)
			if(distance < minDistance) {
				minDistance = distance
				closestPath = p
				reverse = true
			}
		}
		if(reverse) {
			closestPath.reverse()
		}
		return closestPath
	}

	optimizeTrajectories(item: paper.Item) {

		let sortedPaths = []
		let currentChild = item.firstChild

		let nLogs = 0
		do {
			currentChild.remove()
			sortedPaths.push(currentChild)
			currentChild = this.findClosestPath(<paper.Path>currentChild, item)
			
			if(nLogs > 100) {
				console.log('Items to process: ' + item.children.length)
				nLogs = 0
			}
			nLogs++

		} while(item.children.length > 0 && currentChild != null) 					// check that currentChild != null since item could 
																					// have only empty compound paths
																					// (this can happen after collapsing CompoundPaths)

		item.addChildren(sortedPaths)

		// let path = new paper.Path()
		// path.strokeColor = 'purple'
		// path.strokeWidth = 1
		// path.strokeScaling = true
		// for(let child of item.children) {
		// 	let p = <paper.Path>child
		// 	if(p.segments != null) {
		// 		path.addSegments(p.segments)
		// 		if(p.closed) {
		// 			path.add(p.firstSegment)
		// 		}
		// 	}
		// }
		// let c1 = paper.Path.Circle(path.firstSegment.point, 3)
		// c1.fillColor = 'orange'
		// let c2 = paper.Path.Circle(path.lastSegment.point, 3)
		// c2.fillColor = 'turquoise'
		// path.sendToBack()

	}

	plot(callback: ()=> void = null, goHomeOnceFinished = true, gCode = false) {
		this.plotting = true
		console.log('Generating drawing commands...')
		
		// Clone item to apply matrix without loosing points, matrix & visibility information
		let clone = this.item.clone()
		clone.applyMatrix = true
		clone.transform(this.group.matrix)
		clone.visible = true
		
		GUI.startLoadingAnimation()

		// sort by stroke colors
		let colorToPaths = new Map<string, paper.Path[]>()

		for(let p of clone.children) {
			let color = p.strokeColor instanceof paper.Color ? (p.strokeColor as any).toCSS() : p.strokeColor
			let ctp = colorToPaths.get(color)
			if(ctp != null) {
				ctp.push(p as paper.Path)
			} else {
				colorToPaths.set(color, [p as paper.Path])
			}
		}

		for(let [color, paths] of colorToPaths) {
			console.log('color', color, paths.length)
			let colorGroup = new paper.Group()
			colorGroup.addChildren(paths)
			if(Settings.plot.optimizeTrajectories) {
				this.optimizeTrajectories(colorGroup)
			}
			clone.addChildren(colorGroup.children)
			colorGroup.remove()
		}

		GUI.stopLoadingAnimation()

		this.currentPath = <paper.Path>clone.firstChild
		let currentColor = this.getColorCSS(this.currentPath.strokeColor)
		tipibot.sendChangePen(currentColor, this.currentColorIndex++)

		if(!gCode) {
			this.plotNext(()=> {
				if(goHomeOnceFinished) {
					tipibot.goHome(()=> this.plotFinished(callback))
				} else {
					this.plotFinished(callback)
				}
			})
		} else {
			this.plotGCode()
			if(goHomeOnceFinished) {
				tipibot.goHome()
			}
			if(Settings.plot.disableMotorsOnceFinished) {
				tipibot.disableMotors(true)
			}
		}

		clone.remove()
	}

	showPoints(show: boolean) {
		this.item.selected = show
		this.item.visible = show
	}

	storeMatrix() {
		SVGPlot.currentMatrix = this.group.matrix
	}

	checkPlotting() {
		if(this.plotting) {
			console.error('You cannot apply any filter or transformation while the machine is plotting.')
			return true
		}
		return false
	}

	rotate() {
		if(this.checkPlotting()) {
			return
		}

		this.group.rotate(90)
		this.updateShape()
		this.updatePositionGUI()
		this.storeMatrix()
	}

	scale(value: number) {
		if(this.checkPlotting()) {
			return
		}

		this.group.applyMatrix = false
		this.group.scaling = new paper.Point(Math.sign(this.group.scaling.x) * value, Math.sign(this.group.scaling.y) * value)

		this.updateShape()
		this.updatePositionGUI()
		this.storeMatrix()
	}

	center() {
		if(this.checkPlotting()) {
			return
		}

		this.group.position = tipibot.drawArea.bounds.center
		this.updatePositionGUI()
		this.storeMatrix()
	}

	flipX() {
		if(this.checkPlotting()) {
			return
		}

		this.group.scale(-1, 1)
		this.updateShape()
		this.storeMatrix()
	}
	
	flipY() {
		if(this.checkPlotting()) {
			return
		}

		this.group.scale(1, -1)
		this.updateShape()
		this.storeMatrix()
	}
	
	setX(x: number) {
		if(this.checkPlotting()) {
			return
		}
		this.group.position.x = tipibot.drawArea.bounds.left + x + this.group.bounds.width / 2
		this.storeMatrix()
	}
	
	setY(y: number) {
		if(this.checkPlotting()) {
			return
		}
		this.group.position.y = tipibot.drawArea.bounds.top + y + this.group.bounds.height / 2
		this.storeMatrix()
	}

	getAngle(segment: paper.Segment) {
		if(segment.previous == null || segment.point == null || segment.next == null) {
			return 180
		}
		let pointToPrevious = segment.previous.point.subtract(segment.point)
		let pointToNext = segment.next.point.subtract(segment.point)
		let angle = pointToPrevious.getDirectedAngle(pointToNext)
		return 180 - Math.abs(angle)
	}

	getPseudoCurvature(segment: paper.Segment) {
		if(segment.previous == null || segment.point == null || segment.next == null) {
			return 180
		}
		
		let angle = this.getAngle(segment)
		let currentSegment = segment.previous
		let distance = currentSegment.curve.length
		while(currentSegment != null && distance < this.pseudoCurvatureDistance / 2) {
			angle += this.getAngle(currentSegment)
			currentSegment = currentSegment.previous
			distance += currentSegment != null ? currentSegment.curve.length : 0
		}
		distance = segment.curve.length
		currentSegment = segment.next
		while(currentSegment.next != null && distance < this.pseudoCurvatureDistance / 2) {
			angle += this.getAngle(currentSegment)
			currentSegment = currentSegment.next
			distance += currentSegment != null ? currentSegment.curve.length : 0
		}

		return Math.max(angle, 180)
	}

	computeSpeeds(path: paper.Path) {
		if(Settings.plot.maxCurvatureFullspeed >= 180) {
			return new Array(path.segments.length).fill(Settings.tipibot.maxSpeed)
		}
		let maxSpeed = Settings.tipibot.maxSpeed
		let acceleration = Settings.tipibot.acceleration
		let mmPerSteps = SettingsManager.mmPerSteps()

		let brakingDistanceSteps = maxSpeed * maxSpeed / (2.0 * acceleration)
		let brakingDistanceMm = brakingDistanceSteps * mmPerSteps

		let reversedSpeeds: number[] = []
		let currentSegment = path.lastSegment
		let previousMinSpeed = null
		let distanceToLastMinSpeed = 0

		while(currentSegment != null) {

			let pseudoCurvature = this.getPseudoCurvature(currentSegment)
			let speedRatio = 1 - Math.min(pseudoCurvature / Settings.plot.maxCurvatureFullspeed, 1)
			let minSpeed = speedRatio * Settings.tipibot.maxSpeed
			
			let recomputeBrakingDistance = true

			if(distanceToLastMinSpeed < brakingDistanceMm && previousMinSpeed != null) {
				let ratio = distanceToLastMinSpeed / brakingDistanceMm
				let resultingSpeed = previousMinSpeed + (maxSpeed - previousMinSpeed) * ratio
				if(resultingSpeed < minSpeed) {
					minSpeed = resultingSpeed
					recomputeBrakingDistance = false
				}
			}

			reversedSpeeds.push(minSpeed)

			if(recomputeBrakingDistance) {

				previousMinSpeed = minSpeed
				distanceToLastMinSpeed = 0
				brakingDistanceSteps = ( (maxSpeed - minSpeed) / acceleration ) * ( (minSpeed + maxSpeed) / 2 )
				brakingDistanceMm = brakingDistanceSteps * mmPerSteps
			}

			currentSegment = currentSegment == path.firstSegment ? null : currentSegment.previous
			distanceToLastMinSpeed += currentSegment != null ? currentSegment.curve.length : 0
		}

		let speeds = []
		for(let i=reversedSpeeds.length-1 ; i>=0 ; i--) {
			speeds.push(reversedSpeeds[i])
		}
		return speeds
	}

	moveTipibotLinear(segment: paper.Segment, speeds: number[]) {
		let point = segment.point
		let minSpeed = 0
		if(Settings.plot.fullSpeed) {
			minSpeed = speeds[segment.index]
			// let speedRatio = minSpeed / Settings.tipibot.maxSpeed
			// let circle = paper.Path.Circle(point, 4)
			// circle.fillColor = <any> { hue: speedRatio * 240, saturation: 1, brightness: 1 }
		}
		tipibot.moveLinear(point, minSpeed, Settings.tipibot.drawSpeed, ()=> tipibot.pen.setPosition(point, true, false), false)
	}

	plotPath(path: paper.Path) {
		if(path.className != 'Path' || !SVGPlot.itemMustBeDrawn(path) || path.segments == null) {
			return
		}
		let speeds = Settings.plot.fullSpeed ? this.computeSpeeds(path) : null

		for(let segment of path.segments) {
			let point = segment.point

			if(segment == path.firstSegment) {
				if(!tipibot.lastSentPosition.equals(point)) {
					tipibot.penUp()
					tipibot.moveDirect(point, ()=> tipibot.pen.setPosition(point, true, false), false)
				}
				tipibot.penDown()
			} else {
				this.moveTipibotLinear(segment, speeds)
			}
		}
		if(path.closed) {
			this.moveTipibotLinear(path.firstSegment, speeds)
		}
	}

	getColorCSS(color: paper.Color | string) {
		return color instanceof paper.Color ? (color as any).toCSS() : color
	}

	plotCurrentPath() {
		this.plotPath(this.currentPath)
		this.nSegments += this.currentPath.segments.length
		let currentPath = <paper.Path>this.currentPath.nextSibling
		if(currentPath != null) {
			let currentColor = this.getColorCSS(this.currentPath.strokeColor)
			let nextColor = this.getColorCSS(currentPath.strokeColor)
			if(currentColor != null && nextColor != null && currentColor != nextColor) {
				let wasPenUp = tipibot.pen.isUp
				tipibot.penUp()
				tipibot.sendChangePen(nextColor, this.currentColorIndex++)
				if(!wasPenUp) {
					tipibot.penDown()
				} 
			}
		}
		this.currentPath = currentPath
	}

	plotGCode() {
		this.nSegments = 0
		while(this.currentPath != null) {
			this.plotCurrentPath()
		}
	}

	plotNextLoaded(callback: ()=> void) {
		this.nSegments = 0

		while(this.currentPath != null && this.nSegments <= SVGPlot.nSegmentsPerBatch) {
			this.plotCurrentPath()
		}
		
		console.log('Commands generated.')
		GUI.stopLoadingAnimation()
		
		if(this.currentPath != null) {

			while(this.currentPath.segments.length > SVGPlot.nSegmentsPerBatch) {
				this.currentPath.splitAt(this.currentPath.segments[SVGPlot.nSegmentsPerBatch-1].location)
			}

			tipibot.executeOnceFinished(()=> this.plotNext(callback))
		} else {
			callback()
		}
	}

	plotNext(callback: ()=> void) {
		console.log('Generating commands...')

		GUI.startLoadingAnimation(()=> this.plotNextLoaded(callback))
	}

	// plotItemStep(): any {
	// 	let item = this.currentItem

	// 	// if we didn't already plot the item: plot it along with its children
	// 	if(item.data.plotted == null || !item.data.plotted) {

	// 		// plot path
	// 		if(item.className == 'Path' || item.className == 'CompoundPath') {
	// 			let path: paper.Path = <paper.Path>item
	// 			let segment = this.currentSegment != null ? this.currentSegment : path.firstSegment
	// 			if(segment == path.firstSegment) {
	// 				if(!tipibot.getPosition().equals(segment.point)) {
	// 					tipibot.penUp()
	// 					tipibot.moveDirect(segment.point, this.plotItemStep)
	// 				}
	// 				tipibot.penDown()
	// 			} else {
	// 				tipibot.moveLinear(segment.point, this.plotItemStep)
	// 			}

	// 			// go to next segment
	// 			this.currentSegment = segment.next != path.firstSegment ? segment.next : null

	// 		} else if(item.className == 'Shape') {
	// 			console.error('A shape was found in the SVG to plot.')
	// 		}

	// 		// plot children
	// 		if(item.children.length > 0) {
	// 			this.currentItem = item.firstChild
	// 			this.currentSegment = null
	// 			this.plotItemStep()
	// 			return
	// 		}
	// 		item.data.plotted = true
	// 	}

	// 	// plot next siblings if any, or go up to parent
	// 	if(item != this.item && item.parent != null && item.index < item.parent.children.length - 1) {
	// 		if(item.index < item.parent.children.length - 1) {
	// 			this.currentItem = item.nextSibling
	// 			this.currentSegment = null
	// 			this.plotItemStep()
	// 			return
	// 		} else {
	// 			this.currentItem = item.parent
	// 			this.currentSegment = null
	// 			this.plotItemStep()
	// 			return
	// 		}
	// 	}

	// 	if(item == this.item) {
	// 		this.clearData(item)
	// 	}
	// }
	
	plotFinished(callback: ()=> void = null) {
		SVGPlot.gui.getController('Draw').name('Draw')

		this.plotting = false
		if(callback != null) {
			callback()
		}
		if(!SVGPlot.multipleFiles) {
			if(Settings.plot.disableMotorsOnceFinished) {
				tipibot.disableMotors(true)
			}
		}
	}

	clearData(item: paper.Item) {
		item.data = null
		if(item.children) {
			for(let child of item.children) {
				this.clearData(child)
			}
		}
	}

	clear() {
		if(SVGPlot.svgPlot == this) {
			SVGPlot.svgPlot = null
		}
		if(this.raster != null) {
			this.raster.remove()
			this.raster = null
		}
		if(this.item != null) {
			this.item.remove()
			this.item = null
		}
		if(this.originalItem != null) {
			this.originalItem.remove()
			this.originalItem = null
		}
		if(this.background != null) {
			this.background.remove()
			this.background = null
		}
		this.group.removeChildren()
	}

	destroy() {
		this.clear()
		if(this.group != null) {
			this.group.remove()
			this.group = null
		}
	}
}