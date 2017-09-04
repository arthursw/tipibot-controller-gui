import { Tipibot, tipibot } from "./Tipibot"
import { Settings } from "./Settings"
import { Draggable } from "./Draggable"
import { Communication, communication } from "./Communication/Communication"
import { GUI, Controller } from "./GUI"


declare type Renderer = {
	getWorldPosition(event: MouseEvent): paper.Point
}

export class Plot extends Draggable {

	static gui: GUI = null

	static currentPlot: Plot = null

	public static createCallback(f: (p1?: any)=>void, addValue: boolean = false, parameters: any[] = []) {
		return (value: any)=> { 
			if(Plot.currentPlot != null) { 
				if(addValue) {
					parameters.unshift(value)
				}
				f.apply(Plot.currentPlot, parameters)
			} 
		}
	}

	public static createGUI(gui: GUI) {
		Plot.gui = gui
		let filterFolder = gui.addFolder('Filter')
		filterFolder.add(Settings.plot, 'flatten').name('Flatten').onChange(Plot.onFilterChange)
		filterFolder.add(Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(Plot.onFilterChange)
		filterFolder.add(Settings.plot, 'subdivide').name('Subdivide').onChange(Plot.onFilterChange)
		filterFolder.add(Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(Plot.onFilterChange)

		let transformFolder = gui.addFolder('Transform')
		transformFolder.addSlider('X', 0, 0, Settings.tipibot.width).onChange(Plot.createCallback(Plot.prototype.setX, true))
		transformFolder.addSlider('Y', 0, 0, Settings.tipibot.height).onChange(Plot.createCallback(Plot.prototype.setY, true))
		
		transformFolder.addButton('Flip X', Plot.createCallback(Plot.prototype.flipX))
		transformFolder.addButton('Flip Y', Plot.createCallback(Plot.prototype.flipY))

		transformFolder.addButton('Rotate', Plot.createCallback(Plot.prototype.rotate))

		transformFolder.addSlider('Scale', 1, 0.1, 5).onChange((value: number) => {
			Plot.currentPlot.item.applyMatrix = false
			Plot.currentPlot.item.scaling = new paper.Point(value, value)
		})

	}

	public static onFilterChange() {
		if(Plot.currentPlot != null) {
			Plot.currentPlot.filter()
		}
	}

	originalItem: paper.Item 			// Not flattened
	plotting = false

	constructor(renderer: Renderer, item: paper.Item=null) {
		super(renderer, item)
		this.item.position = this.item.position.add(tipibot.drawArea.getBounds().topLeft)
		this.originalItem = null
		this.filter()
	}

	mouseDown(event:MouseEvent) {
		super.mouseDown(event)
		this.item.selected = this.dragging
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

	filter() {
		if(this.originalItem == null && (Settings.plot.subdivide || Settings.plot.flatten)) {
			this.saveItem()
		} else if(this.originalItem != null) {
			this.loadItem()
		}
		this.flatten()
		this.subdivide()
	}

	filterItem(item: paper.Item, amount: number, filter: (item: paper.Item, amount: number) => void) {
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
			this.item.selected = true
		}
	}
	
	subdividePath(path: paper.Path, maxSegmentLength: number) {
		for(let segment of path.segments) {
			let curve = segment.curve
			do{
				curve = curve.divideAt(maxSegmentLength)
			}while(curve != null);
		}
	}

	subdivideItem(item: paper.Item, maxSegmentLength: number) {
		this.filterItem(item, maxSegmentLength, this.subdividePath)
	}

	flatten() {
		if(Settings.plot.flatten) {
			this.flattenItem(this.item, Settings.plot.flattenPrecision)
			this.item.selected = true
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
		this.plotItem(this.item)			// to be overloaded. The draw button calls plot()
		tipibot.goHome(()=> this.plotFinished(callback))
	}

	plotItem(item: paper.Item) {

	}

	plotFinished(callback: ()=> void = null) {
		this.plotting = false
		callback()
	}

	stop() {
		communication.interpreter.sendStop()
	}

	rotate() {
		this.item.rotate(90)
	}

	flipX() {
		this.item.scale(-1, 1)
	}
	
	flipY() {
		this.item.scale(1, -1)
	}
	
	setX(x: number) {
		this.item.position.x = x
	}
	
	setY(y: number) {
		this.item.position.y = y
	}

	clear() {
		super.delete()
		if(this.item != null) {
			this.item.remove()
		}
		this.item = null
		if(Plot.currentPlot == this) {
			Plot.currentPlot = null
		}
	}
}

export class SVGPlot extends Plot {
	static pen: paper.Item = null
	static svgPlot: SVGPlot = null
	static renderer: Renderer
	static gui: GUI

	public static onImageLoad(event: any) {
		let svg = paper.project.importSVG(event.target.result)
		let svgPlot = new SVGPlot(svg)
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
		SVGPlot.gui.getController('Load SVG').show()
		SVGPlot.gui.getController('Clear SVG').hide()
		SVGPlot.svgPlot.item.remove()
		SVGPlot.svgPlot = null
		Plot.currentPlot = null
	}

	public static drawClicked(event: any) {
		if(Plot.currentPlot != null) {
			if(!Plot.currentPlot.plotting) {
				SVGPlot.gui.getController('Draw').name('Stop & Clear queue')
				Plot.currentPlot.plot()
			} else {
				SVGPlot.gui.getController('Draw').name('Draw')
				communication.interpreter.stopAndClearQueue()
			}
		}
	}

	public static createGUI(gui: GUI) {
		SVGPlot.gui = gui.addFolder('SVG')
		SVGPlot.gui.open()

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
		Plot.currentPlot = this
		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.clear()
			SVGPlot.svgPlot = null
		}
		SVGPlot.svgPlot = this
		paper.project.layers[0].addChild(svg)
	}


	mouseDown(event: MouseEvent) {
		let hitResult = paper.project.hitTest(this.getWorldPosition(event))
		if(hitResult != null && hitResult.item == tipibot.pen.item) {
			return
		}
		super.mouseDown(event)
	}

	drag(delta: paper.Point) {
		super.drag(delta)
		Plot.gui.getFolder('Transform').getController('X').setValueNoCallback(this.item.position.x)
		Plot.gui.getFolder('Transform').getController('Y').setValueNoCallback(this.item.position.y)
	}

	plotItem(item: paper.Item) {
		let matrix = item.globalMatrix
		if(item.className == 'Path' || item.className == 'CompoundPath') {
			let path: paper.Path = <paper.Path>item
			for(let segment of path.segments) {
				if(segment == path.firstSegment) {
					if(!tipibot.getPosition().equals(segment.point.transform(matrix))) {
						tipibot.penUp()
						tipibot.moveDirect(segment.point.transform(matrix))
					}
					tipibot.penDown()
				} else {
					tipibot.moveLinear(segment.point.transform(matrix))
				}
			}
			if(path.closed) {
				tipibot.moveLinear(path.firstSegment.point.transform(matrix))
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