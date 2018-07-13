import { Tipibot, tipibot } from "./Tipibot"
import { Settings, settingsManager, SettingsManager } from "./Settings"
import { Communication, communication } from "./Communication/Communication"
import { GUI, Controller } from "./GUI"
import { Pen } from './Pen'

export class SVGPlot {

	static svgPlot: SVGPlot = null
	static gui: GUI = null
	static transformFolder: GUI = null
	readonly pseudoCurvatureDistance = 10 		// in mm

	public static onImageLoad(event: any) {
		let svg = paper.project.importSVG(event.target.result)

		let svgPlot = new SVGPlot(svg)
		svgPlot.center()

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
		if(SVGPlot.svgPlot != null) {
			if(!SVGPlot.svgPlot.plotting) {
				SVGPlot.gui.getController('Draw').name('Stop & Clear commands')
				SVGPlot.svgPlot.plot()
			} else {
				SVGPlot.gui.getController('Draw').name('Draw')
				communication.interpreter.sendStop(true)
				communication.interpreter.clearQueue()
				SVGPlot.svgPlot.plotting = false
				tipibot.goHome()
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

		let filterFolder = gui.addFolder('Filter')
		filterFolder.add(Settings.plot, 'showPoints').name('Show points').onChange(SVGPlot.createCallback(SVGPlot.prototype.showPoints, true))
		filterFolder.add(Settings.plot, 'optimizeTrajectories').name('Optimize Trajectories').onFinishChange((event)=> settingsManager.save(false))
		filterFolder.add(Settings.plot, 'flatten').name('Flatten').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))
		filterFolder.add(Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))
		filterFolder.add(Settings.plot, 'subdivide').name('Subdivide').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))
		filterFolder.add(Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter))

		let transformFolder = gui.addFolder('Transform')
		SVGPlot.transformFolder = transformFolder
		transformFolder.addButton('Center', SVGPlot.createCallback(SVGPlot.prototype.center))
		transformFolder.addSlider('X', 0, 0, Settings.drawArea.width).onChange(SVGPlot.createCallback(SVGPlot.prototype.setX, true))
		transformFolder.addSlider('Y', 0, 0, Settings.drawArea.height).onChange(SVGPlot.createCallback(SVGPlot.prototype.setY, true))
		
		transformFolder.addButton('Flip X', SVGPlot.createCallback(SVGPlot.prototype.flipX))
		transformFolder.addButton('Flip Y', SVGPlot.createCallback(SVGPlot.prototype.flipY))

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

	group: paper.Group
	item: paper.Item
	raster: paper.Raster
	originalItem: paper.Item 			// Not flattened
	
	plotting = false

	constructor(item: paper.Item=null) {

		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.clear()
			SVGPlot.svgPlot = null
		}

		SVGPlot.svgPlot = this

		this.group = new paper.Group()
		this.group.sendToBack()

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
		this.filter()

		this.group.onMouseDrag = (event)=> this.onMouseDrag(event)

		document.addEventListener('SettingChanged', (event: CustomEvent)=> this.onSettingChanged(event), false)
	}

	onSettingChanged(event: CustomEvent) {
		if(event.detail.all || event.detail.parentNames[0] == 'Pen') {
			if(event.detail.name == 'penWidth') {
				this.updateShape()
			}
		}
	}

	onMouseDrag(event:any) {
		this.group.position = this.group.position.add(event.delta)
		this.updatePositionGUI()
	}

	updatePositionGUI() {
		SVGPlot.transformFolder.getController('X').setValueNoCallback(this.group.bounds.left - tipibot.drawArea.bounds.left)
		SVGPlot.transformFolder.getController('Y').setValueNoCallback(this.group.bounds.top - tipibot.drawArea.bounds.top)
	}

	itemMustBeDrawn(item: paper.Item) {
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
		this.item = this.originalItem.clone(false)
		this.group.addChild(this.item)
	}

	updateShape() {
		if(this.raster != null) {
			this.raster.remove()
		}

		this.item.strokeWidth = Settings.tipibot.penWidth / this.group.scaling.x

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

		this.item.strokeColor = 'black'
		this.raster = this.item.rasterize(paper.project.view.resolution)
		this.group.addChild(this.raster)
		this.raster.sendToBack()
		this.item.selected = Settings.plot.showPoints
		this.item.visible = Settings.plot.showPoints
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

	collapseItem(item: paper.Item, parent: paper.Item) {
		item.applyMatrix = true

		item = item.className == 'Shape' ? this.convertShapeToPath(<paper.Shape>item) : item

		if(item == null || item.children == null || item.children.length == 0) {
			return
		}

		while(item.children.length > 0) {
			let child = item.firstChild
			child.remove()
			parent.addChild(child)

			this.collapseItem(child, parent)
		}
	}

	collapse(item: paper.Item) {
		if(item.children == null || item.children.length == 0) {
			return
		}
		let children = item.children.slice()
		for(let child of children) {
			this.collapseItem(child, item)
		}
	}

	findClosestPath(path: paper.Path, parent: paper.Item): paper.Path {
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
		if(item.children == null || item.children.length == 0) {
			return
		}

		this.collapse(item)

		let sortedPaths = []
		let currentChild = item.firstChild

		do {
			currentChild.remove()
			sortedPaths.push(currentChild)
			currentChild = this.findClosestPath(<paper.Path>currentChild, item)
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

	convertShapeToPath(shape: paper.Shape): paper.Path {
		if(!this.itemMustBeDrawn(shape)) {
			return null
		}
		let path = shape.toPath(true)
		shape.parent.addChildren(shape.children)
		shape.remove()
		return path
	}

	filterItem(item: paper.Item, amount: number, filter: (item: paper.Item, amount: number) => void) {
		if(!item.visible) {
			return
		}
		let path = item.className == 'Shape' ? this.convertShapeToPath(<paper.Shape>item) : item
		if(item.className == 'Path' || item.className == 'CompoundPath') {
			filter.call(this, path, amount)
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
		if(Settings.plot.optimizeTrajectories) {
			this.optimizeTrajectories(this.item)
		}
		// Clone item to apply matrix without loosing points, matrix & visibility information
		let clone = this.item.clone()
		clone.applyMatrix = true
		clone.visible = true
		this.plotItem(clone)			// to be overloaded. The draw button calls plot()
		clone.remove()
		tipibot.goHome(()=> this.plotFinished(callback))
	}

	showPoints(show: boolean) {
		this.item.selected = show
		this.item.visible = show
	}

	rotate() {
		this.group.rotate(90)
		this.updateShape()
		this.updatePositionGUI()
	}

	scale(value: number) {

		this.group.applyMatrix = false
		this.group.scaling = new paper.Point(Math.sign(this.group.scaling.x) * value, Math.sign(this.group.scaling.y) * value)

		this.updateShape()
		this.updatePositionGUI()
	}

	center() {
		this.group.position = tipibot.drawArea.bounds.center
		this.updatePositionGUI()
	}

	flipX() {
		this.group.scale(-1, 1)
		this.updateShape()
	}
	
	flipY() {
		this.group.scale(1, -1)
		this.updateShape()
	}
	
	setX(x: number) {
		this.group.position.x = tipibot.drawArea.bounds.left + x + this.group.bounds.width / 2
	}
	
	setY(y: number) {
		this.group.position.y = tipibot.drawArea.bounds.top + y + this.group.bounds.height / 2
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
		let n=0
		while(currentSegment != null && n<10000) {

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
			n++
		}
		if(n >= 9000) {
			debugger
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
		if((item.className == 'Path' || item.className == 'CompoundPath') && this.itemMustBeDrawn(item)) {
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

		this.plotting = false
		if(callback != null) {
			callback()
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
		}
		this.raster = null
		if(this.item != null) {
			this.item.remove()
		}
		this.item = null
		if(this.originalItem != null) {
			this.originalItem.remove()
		}
		this.originalItem = null
		if(this.group != null) {
			this.group.remove()
		}
		this.group = null
	}
}