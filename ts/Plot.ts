import { PlotInterface } from "./PlotInterface"
import { Tipibot, tipibot } from "./Tipibot"
import { Settings, settingsManager, SettingsManager } from "./Settings"
import { InteractiveItem } from "./InteractiveItem"
import { Communication, communication } from "./Communication/Communication"
import { GUI, Controller } from "./GUI"
import { Renderer } from "./RendererInterface"
import { ThreeRenderer, PaperRenderer } from "./Renderers"
import { Pen } from './Pen'


export class Plot extends PlotInterface {

	static gui: GUI = null
	static showPoints = false
	static transformFolder: GUI = null
	readonly pseudoCurvatureDistance = 10 		// in mm

	public static createCallback(f: (p1?: any)=>void, addValue: boolean = false, parameters: any[] = []) {
		return (value: any)=> { 
			if(PlotInterface.currentPlot != null) { 
				if(addValue) {
					parameters.unshift(value)
				}
				f.apply(PlotInterface.currentPlot, parameters)
			} 
		}
	}

	public static createGUI(gui: GUI) {
		Plot.gui = gui
		let filterFolder = gui.addFolder('Filter')
		filterFolder.add(Plot, 'showPoints').name('Show points').onChange(Plot.createCallback(Plot.prototype.showPoints, true))
		filterFolder.add(Settings.plot, 'flatten').name('Flatten').onChange(Plot.createCallback(Plot.prototype.filter))
		filterFolder.add(Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(Plot.createCallback(Plot.prototype.filter))
		filterFolder.add(Settings.plot, 'subdivide').name('Subdivide').onChange(Plot.createCallback(Plot.prototype.filter))
		filterFolder.add(Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(Plot.createCallback(Plot.prototype.filter))

		let transformFolder = gui.addFolder('Transform')
		Plot.transformFolder = transformFolder
		transformFolder.addButton('Center', Plot.createCallback(Plot.prototype.center))
		transformFolder.addSlider('X', 0, 0, Settings.drawArea.width).onChange(Plot.createCallback(Plot.prototype.setX, true))
		transformFolder.addSlider('Y', 0, 0, Settings.drawArea.height).onChange(Plot.createCallback(Plot.prototype.setY, true))
		
		transformFolder.addButton('Flip X', Plot.createCallback(Plot.prototype.flipX))
		transformFolder.addButton('Flip Y', Plot.createCallback(Plot.prototype.flipY))

		transformFolder.addButton('Rotate', Plot.createCallback(Plot.prototype.rotate))

		transformFolder.addSlider('Scale', 1, 0.1, 5).onChange(Plot.createCallback(Plot.prototype.scale, true))

	}

	originalItem: paper.Item 			// Not flattened
	item: paper.Item
	plotting = false

	constructor(renderer: Renderer, item: paper.Item=null) {
		super(renderer, null, true)
		this.item = item
		// this.item.position = this.item.position.add(tipibot.drawArea.getBounds().topLeft)
		this.originalItem = null
		this.filter()
	}

	mouseDown(event:MouseEvent): boolean {
		let result = super.mouseDown(event)
		this.item.selected = this.dragging
		return result
	}

	updateItemPosition() {
		this.item.position = this.shape.getBounds().getCenter()
	}

	updatePositonGUI(drawAreaTopLeft = tipibot.drawArea.getBounds().topLeft()) {
		Plot.transformFolder.getController('X').setValueNoCallback(this.item.bounds.left - drawAreaTopLeft.x)
		Plot.transformFolder.getController('Y').setValueNoCallback(this.item.bounds.top - drawAreaTopLeft.y)
	}

	updateItemPositionAndGUI() {
		this.updateItemPosition()
		this.updatePositonGUI()
	}

	drag(delta: paper.Point) {
		let result = super.drag(delta);
		this.updateItemPositionAndGUI()
		return result;
	}

	mouseUp(event:MouseEvent): boolean {
		let result = super.mouseUp(event);
		this.updateItemPositionAndGUI()
		return result;
	}

	itemMustBeDrawn(item: paper.Path | paper.Shape) {
		return (item.strokeWidth > 0 && item.strokeColor != null) || item.fillColor != null;
	}

	saveItem() {
		this.originalItem = this.item.clone(false)
	}

	loadItem() {
		this.originalItem.position = this.item.position
		this.originalItem.applyMatrix = false
		this.originalItem.scaling = this.item.scaling
		this.item.remove()
		this.item = this.originalItem.clone(false)		// If we clone an item which is not on the project, it won't be inserted in the project
		paper.project.activeLayer.addChild(this.item)	// <- insert here
	}

	updateShape() {
		if(this.shape != null) {
			this.shape.remove()
		}

		this.item.strokeWidth = Settings.tipibot.penWidth

		// HACK !!!
		// Todo: create two SvgPlot classes : one for ThreeRenderers and one for PaperRenderers
		if(this.renderer instanceof ThreeRenderer) {

			// this.shape = this.renderer.createShape(this.item, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 10, linecap: 'round', linejoin:  'round' }))
			// this.shape.setPosition(tipibot.drawArea.getBounds().getCenter())

			// paper.project.clear()
			paper.view.viewSize = new paper.Size(Math.min(this.item.bounds.width, 2000), Math.min(this.item.bounds.height, 2000))
			paper.project.activeLayer.addChild(this.item)
			paper.project.deselectAll()
			this.item.selected = false
			paper.view.setCenter(this.item.bounds.center)

			let margin = 100
			let ratio = Math.max((this.item.bounds.width + margin) / paper.view.viewSize.width, (this.item.bounds.height + margin) / paper.view.viewSize.height)
			paper.view.zoom = 1 / ratio

			// var image = new Image()
			// image.src = paper.view.element.toDataURL()

			// let w = window.open("")
			// w.document.write(image.outerHTML)

			this.shape = this.renderer.createSprite(paper.view.element)
			// paper.project.clear()
			
			this.shape.setPosition(tipibot.drawArea.getBounds().getCenter())

		} else {
			this.item.selected = false
			this.item.visible = true
			// Remove any invisible child from item: 
			// an invisible shape could be smaller bounds than a path strokeBounds, resulting in item bounds too small
			// item bounds could be equal to shape bounds instead of path stroke bounds
			// this is a paper.js bug
			if(this.item.children != null) {
				for(let child of this.item.children) {
					if(!child.visible || child.fillColor == null && child.strokeColor == null) {
						child.remove()
					}
				}
			}
			let raster = this.item.rasterize(paper.project.view.resolution)
			raster.sendToBack()
			this.shape = this.renderer.createShape(raster)
			this.item.selected = Plot.showPoints
			this.item.visible = Plot.showPoints
		}
	}

	filter() {
		if(this.originalItem == null && (Settings.plot.subdivide || Settings.plot.flatten)) {
			this.saveItem()
		} else if(this.originalItem != null) {
			this.loadItem()
		}
		this.flatten()
		this.subdivide()
		this.updateShape()
	}

	filterItem(item: paper.Item, amount: number, filter: (item: paper.Item, amount: number) => void) {
		if(!item.visible) {
			return
		}
		if(item.className == 'Path' || item.className == 'CompoundPath') {
			let path = <paper.Path>item
			filter.call(this, path, amount)
		} else if(item.className == 'Shape') {
			let shape = <paper.Shape>item
			if(this.itemMustBeDrawn(shape)) {
				let path = shape.toPath(true)
				filter.call(this, path, amount)
				item.parent.addChildren(item.children)
				item.remove()
			}
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.filterItem(child, amount, filter)
		}
	}

	subdivide() {
		if(Settings.plot.subdivide) {
			this.subdivideItem(this.item, Settings.plot.maxSegmentLength)
		}
	}
	
	subdividePath(path: paper.Path, maxSegmentLength: number) {
		if(path.segments != null) {
			for(let segment of path.segments) {
				let curve = segment.curve
				do{
					curve = curve.divideAt(maxSegmentLength)
				}while(curve != null);
			}
		}
	}

	subdivideItem(item: paper.Item, maxSegmentLength: number) {
		this.filterItem(item, maxSegmentLength, this.subdividePath)
	}

	flatten() {
		if(Settings.plot.flatten) {
			this.flattenItem(this.item, Settings.plot.flattenPrecision)
		}
	}

	flattenPath(path: paper.Path, flattenPrecision: number) {
		path.flatten(flattenPrecision)
	}

	flattenItem(item: paper.Item, flattenPrecision: number) {
		this.filterItem(item, flattenPrecision, this.flattenPath)
	}

	plot(callback: ()=> void = null) {
		this.plotting = true
		// Clone item to apply matrix without loosing points, matrix & visibility information
		let clone = this.item.clone()
		clone.applyMatrix = true
		clone.visible = true
		this.plotItem(clone)			// to be overloaded. The draw button calls plot()
		clone.remove()
		tipibot.goHome(()=> this.plotFinished(callback))
	}

	plotItem(item: paper.Item) {

	}

	plotFinished(callback: ()=> void = null) {
		this.plotting = false
		if(callback != null) {
			callback()
		}
	}

	stop() {
		communication.interpreter.sendStop()
	}

	showPoints(show: boolean) {
		this.item.selected = show
		this.item.visible = show
	}

	rotate() {
		this.item.rotate(90)
		this.updateShape()
		this.updateItemPositionAndGUI()
	}

	scale(value: number) {

		this.item.applyMatrix = false
		this.item.scaling = new paper.Point(Math.sign(this.item.scaling.x) * value, Math.sign(this.item.scaling.y) * value)

		this.updateShape()
		this.updatePositonGUI()
		// this.updateItemPositionAndGUI()
	}

	center() {
		this.shape.setPosition(tipibot.drawArea.getBounds().getCenter())
		this.updateItemPositionAndGUI()
	}

	flipX() {
		this.item.scale(-1, 1)
		this.updateShape()
	}
	
	flipY() {
		this.item.scale(1, -1)
		this.updateShape()
	}
	
	setX(x: number) {
		let drawArea = tipibot.drawArea.getBounds()
		this.shape.setX(drawArea.topLeft().x + x + this.shape.getWidth() / 2)
		this.updateItemPosition()
	}
	
	setY(y: number) {
		let drawArea = tipibot.drawArea.getBounds()
		this.shape.setY(drawArea.topLeft().y + y + this.shape.getHeight() / 2)
		this.updateItemPosition()
	}

	clear() {
		super.delete()
		if(this.shape != null) {
			this.shape.remove()
		}
		this.shape = null
		if(this.item != null) {
			this.item.remove()
		}
		this.item = null
		if(this.originalItem != null) {
			this.originalItem.remove()
		}
		this.originalItem = null
		if(PlotInterface.currentPlot == this) {
			PlotInterface.currentPlot = null
		}
	}
}

export class SVGPlot extends Plot {
	static svgPlot: SVGPlot = null
	static renderer: Renderer
	static gui: GUI

	public static onImageLoad(event: any) {
		let svg = paper.project.importSVG(event.target.result)

		let svgPlot = new SVGPlot(svg)
		svgPlot.center()

		// Hack: Find a better way to handle ThreeRenderer and PaperRenderer
		if(this.renderer instanceof ThreeRenderer) {
			svg.remove()
			paper.project.clear()
		}

		SVGPlot.gui.getController('Draw').show()
	}

	public static handleFileSelect(event: any) {
		SVGPlot.gui.getController('Load SVG').hide()
		SVGPlot.gui.getController('Clear SVG').show()

		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0; i < files.length; i++) {
			let file = files.item(i)
			
			let imageType = /^image\//

			if (!imageType.test(file.type)) {
				continue
			}

			let reader = new FileReader()
			reader.onload = (event)=> SVGPlot.onImageLoad(event)
			reader.readAsText(file)
		}
	}

	public static clearClicked(event: any) {
		communication.interpreter.clearQueue()
		SVGPlot.gui.getController('Load SVG').show()
		SVGPlot.gui.getController('Clear SVG').hide()
		SVGPlot.svgPlot.clear()
		SVGPlot.svgPlot = null
		SVGPlot.gui.getController('Draw').name('Draw')
		SVGPlot.gui.getController('Draw').hide()
	}

	public static drawClicked(event: any) {
		if(PlotInterface.currentPlot != null) {
			if(!PlotInterface.currentPlot.plotting) {
				SVGPlot.gui.getController('Draw').name('Stop & Clear commands')
				PlotInterface.currentPlot.plot()
			} else {
				SVGPlot.gui.getController('Draw').name('Draw')
				communication.interpreter.stop()
				communication.interpreter.clearQueue()
			}
		}
	}

	public static createGUI(gui: GUI) {
		SVGPlot.gui = gui.addFolder('Plot')
		SVGPlot.gui.open()

		SVGPlot.gui.add(Settings.plot, 'fullSpeed').name('Full speed').onFinishChange((value)=> settingsManager.save(false))
		SVGPlot.gui.add(Settings.plot, 'maxCurvatureFullspeed', 0, 180, 1).name('Max curvature').onFinishChange((value)=> settingsManager.save(false))

		SVGPlot.gui.addFileSelectorButton('Load SVG', 'image/svg+xml', (event)=> SVGPlot.handleFileSelect(event))
		let clearSVGButton = SVGPlot.gui.addButton('Clear SVG', SVGPlot.clearClicked)
		clearSVGButton.hide()
		let drawButton = SVGPlot.gui.addButton('Draw', SVGPlot.drawClicked)
		drawButton.hide()


	}

	currentItem: paper.Item
	currentSegment: paper.Segment

	constructor(svg: paper.Item, renderer: Renderer=SVGPlot.renderer) {
		super(renderer, svg)
		PlotInterface.currentPlot = this
		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.clear()
			SVGPlot.svgPlot = null
		}
		SVGPlot.svgPlot = this
		paper.project.layers[0].addChild(svg)
		svg.sendToBack()
	}


	mouseDown(event: MouseEvent): boolean {
		// let hitResult = paper.project.hitTest(this.getWorldPosition(event))
		// if(hitResult != null && hitResult.item == tipibot.pen.item) {
		// 	return
		// }
		if(tipibot.pen.getPosition().getDistance(this.getWorldPosition(event)) < Pen.RADIUS) {
			return false
		}
		super.mouseDown(event)
	}

	drag(delta: paper.Point) {
		super.drag(delta)
		// Plot.gui.getFolder('Transform').getController('X').setValueNoCallback(this.item.position.x)
		// Plot.gui.getFolder('Transform').getController('Y').setValueNoCallback(this.item.position.y)
	}

	getAngle(segment: paper.Segment) {
		let pointToPrevious = segment.previous.point.subtract(segment.point)
		let pointToNext = segment.next.point.subtract(segment.point)
		let angle = pointToPrevious.getDirectedAngle(pointToNext)
		return 180 - Math.abs(angle)
	}

	getPseudoCurvature(segment: paper.Segment) {
		if(segment.previous == null || segment.point == null || segment.next == null) {
			return 180
		}
		// no need to transform points to compute angle
		
		let angle = this.getAngle(segment)
		let currentSegment = segment.previous
		let distance = currentSegment.curve.length
		while(currentSegment != null && distance < this.pseudoCurvatureDistance / 2) {
			angle += this.getAngle(currentSegment)
			currentSegment = currentSegment.previous
			distance += currentSegment.curve.length
		}
		distance = segment.curve.length
		currentSegment = segment.next
		while(currentSegment.next != null && distance < this.pseudoCurvatureDistance / 2) {
			angle += this.getAngle(currentSegment)
			currentSegment = currentSegment.next
			distance += currentSegment.curve.length
		}

		return angle
	}

	// mustMoveFullSpeed(segment: paper.Segment) {
	// 	return this.getPseudoCurvature(segment) < Settings.plot.maxCurvatureFullspeed
	// }

	// computeFullSpeed(path: paper.Path, fullSpeedPoints: Set<paper.Point>) {
	// 	let maxBrakingDistanceSteps = Settings.tipibot.maxSpeed * Settings.tipibot.maxSpeed / (2.0 * Settings.tipibot.acceleration)
	// 	let maxBrakingDistanceMm = maxBrakingDistanceSteps * SettingsManager.mmPerSteps()
	// 	let currentSegment = path.lastSegment.previous
	// 	let distanceToBrake = maxBrakingDistanceMm
	// 	let distance = 0
		
	// 	// go from last segment to first segment
	// 	// compute the distance to brake after which all points will be full speed
	// 	// if the current segment is before distance to brake: just compute distance to brake
	// 	// if the current segment is after distance to brake: 
	// 	//    if the distance fall on the current curve: divide it
	// 	//    in any case: set point to full speed
		
	// 	// to recompute distance to brake:
	// 	// maxBrakingDistanceMm = maxSpeed * maxSpeed / (2 * acceleration)
	// 	// the new distance to brake is the maximum between the current distance to break and the distance to break for the current point
		
	// 	// the distance to break for the current point is maxBrakingDistanceMm * ratio
	// 	// where ratio is 1 when the pseudo curvature is Settings.plot.maxCurvatureFullspeed and 0 when it is 0
	// 	// => the more pseudo curvature, the longer the distance is

	// 	while(currentSegment != null) {
	// 		let curveLength = currentSegment.curve.length
	// 		distance += curveLength
	// 		if(distance > distanceToBrake) {
	// 			if(distance - distanceToBrake < curveLength) {
	// 				let curveLocation =  1 - (curveLength / (distance - distanceToBrake))
	// 				currentSegment.curve.divideAt(curveLocation)
	// 				let circle = paper.Path.Circle(currentSegment.curve.point2, 2)
	// 				circle.fillColor = 'blue'
	// 				fullSpeedPoints.add(currentSegment.curve.point2)
	// 			}
	// 			// let circle = paper.Path.Circle(currentSegment.point, 2)
	// 			// circle.fillColor = 'blue'
	// 		}
	// 		let pseudoCurvature = this.getPseudoCurvature(currentSegment)
	// 		let ratio = Math.min(pseudoCurvature / Settings.plot.maxCurvatureFullspeed, 1)
	// 		console.log(distance, distanceToBrake, maxBrakingDistanceMm, ratio)
	// 		distanceToBrake = Math.max(distanceToBrake, distance + ratio * maxBrakingDistanceMm)
	// 		currentSegment = currentSegment.previous
	// 	}
	// }

	computeSpeeds(path: paper.Path) {
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

			currentSegment = currentSegment.previous
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
		tipibot.moveLinear(point, minSpeed, ()=> tipibot.pen.setPosition(point, true, false), false)
	}

	plotItem(item: paper.Item) {
		if(!item.visible) {
			return
		}
		// let matrix = item.globalMatrix
		if((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
			let path: paper.Path = <paper.Path>item
			if(path.segments != null) {

				let speeds = Settings.plot.fullSpeed ? this.computeSpeeds(path) : null

				for(let segment of path.segments) {
					// let point = segment.point.transform(matrix)
					let point = segment.point

					if(segment == path.firstSegment) {
						if(!tipibot.getPosition().equals(point)) {
							tipibot.penUp()
							if(Settings.forceLinearMoves) {
								tipibot.moveLinear(point, 0, ()=> tipibot.pen.setPosition(point, true, false), false)
							} else {
								tipibot.moveDirect(point, ()=> tipibot.pen.setPosition(point, true, false), false)
							}
						}
						tipibot.penDown()
					} else {
						this.moveTipibotLinear(segment, speeds)
					}
				}
				if(path.closed) {
					// let point = path.firstSegment.point.transform(matrix)
					this.moveTipibotLinear(path.firstSegment, speeds)
				}
			}
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.plotItem(child)
		}
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
		super.plotFinished(callback)
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
		super.clear()
	}
}