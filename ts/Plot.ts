import { Tipibot, tipibot } from "./Tipibot"
import { Settings } from "./Settings"
import { Draggable } from "./Draggable"
import { Communication, communication } from "./Communication/Communication"
import { GUI, Controller } from "./GUI"


declare type Renderer = {
	getWorldPosition(event: MouseEvent): paper.Point
}

export class Plot extends Draggable {

	static plotFolder: GUI = null

	static currentPlot: Plot = null

	static xSlider: Controller = null
	static ySlider: Controller = null

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
		Plot.plotFolder = gui.addFolder('Plot')

		Plot.plotFolder.add(Settings.plot, 'flatten').name('Flatten').onChange(Plot.onFilterChange)
		Plot.plotFolder.add(Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(Plot.onFilterChange)
		Plot.plotFolder.add(Settings.plot, 'subdivide').name('Subdivide').onChange(Plot.onFilterChange)
		Plot.plotFolder.add(Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(Plot.onFilterChange)

		Plot.plotFolder.addButton('Draw', Plot.createCallback(Plot.prototype.plot))
		Plot.plotFolder.add({'Pause': false}, 'Pause').onChange((value)=>communication.interpreter.setPause(value))
		Plot.plotFolder.addButton('Stop', Plot.createCallback(Plot.prototype.stop))
		Plot.plotFolder.addButton('Rotate', Plot.createCallback(Plot.prototype.rotate))
		Plot.plotFolder.addButton('Flip X', Plot.createCallback(Plot.prototype.flipX))
		Plot.plotFolder.addButton('Flip Y', Plot.createCallback(Plot.prototype.flipY))

		Plot.xSlider = Plot.plotFolder.addSlider('X', 0, 0, Settings.tipibot.width).onChange(Plot.createCallback(Plot.prototype.setX, true))
		Plot.ySlider = Plot.plotFolder.addSlider('Y', 0, 0, Settings.tipibot.height).onChange(Plot.createCallback(Plot.prototype.setY, true))
	}

	public static onFilterChange() {
		if(Plot.currentPlot != null) {
			Plot.currentPlot.filter()
		}
	}

	originalItem: paper.Item 			// Not flattened

	constructor(renderer: Renderer, item: paper.Item=null) {
		super(renderer, item)
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

	plot() {
		this.plotItem(this.item)			// to be overloaded. The draw button calls plot()
		tipibot.goHome()
	}

	plotItem(item: paper.Item) {

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
}

export class SVGPlot extends Plot {
	static pen: paper.Item = null
	static svgPlot: SVGPlot = null
	static renderer: Renderer
	static gui: GUI

	currentItem: paper.Item
	currentSegment: paper.Segment

	public static onImageLoad(event: any) {
		let svgPlot = new SVGPlot(paper.project.importSVG(event.target.result), SVGPlot.renderer)
	}

	public static handleFileSelect(event: any) {
		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0; i < files.length; i++) {
			let file = files.item(i)
			
			let imageType = /^image\//

			if (!imageType.test(file.type)) {
				continue
			}

			let reader = new FileReader()
			reader.onload = SVGPlot.onImageLoad
			reader.readAsText(file)
		}
	}

	public static createGUI(gui: GUI) {
		SVGPlot.gui = gui
		gui.addFileSelectorButton('Load SVG', 'image/svg+xml', SVGPlot.handleFileSelect)

		let scaleController = gui.addSlider('Scale', 1, 0.1, 5)

		scaleController.onChange((value: number) => {
			SVGPlot.svgPlot.item.applyMatrix = false
			SVGPlot.svgPlot.item.scaling = new paper.Point(value, value)
		})
	}

	constructor(svg: paper.Item, renderer: Renderer) {
		super(renderer, svg)
		Plot.currentPlot = this
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
		Plot.xSlider.setValueNoCallback(this.item.position.x)
		Plot.ySlider.setValueNoCallback(this.item.position.y)
	}

	plotItem(item: paper.Item) {
		if(item.className == 'Path' || item.className == 'CompoundPath') {
			let path: paper.Path = <paper.Path>item
			for(let segment of path.segments) {
				if(segment == path.firstSegment) {
					if(!tipibot.getPosition().equals(segment.point)) {
						tipibot.penUp()
						tipibot.moveDirect(segment.point)
					}
					tipibot.penDown()
				} else {
					tipibot.moveLinear(segment.point)
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

	plotItemStep(): any {
		let item = this.currentItem

		// if we didn't already plot the item: plot it along with its children
		if(item.data.plotted == null || !item.data.plotted) {

			// plot path
			if(item.className == 'Path' || item.className == 'CompoundPath') {
				let path: paper.Path = <paper.Path>item
				let segment = this.currentSegment != null ? this.currentSegment : path.firstSegment
				if(segment == path.firstSegment) {
					if(!tipibot.getPosition().equals(segment.point)) {
						tipibot.penUp()
						tipibot.moveDirect(segment.point, this.plotItemStep)
					}
					tipibot.penDown()
				} else {
					tipibot.moveLinear(segment.point, this.plotItemStep)
				}

				// go to next segment
				this.currentSegment = segment.next != path.firstSegment ? segment.next : null

			} else if(item.className == 'Shape') {
				console.error('A shape was found in the SVG to plot.')
			}

			// plot children
			if(item.children.length > 0) {
				this.currentItem = item.firstChild
				this.currentSegment = null
				this.plotItemStep()
				return
			}
			item.data.plotted = true
		}

		// plot next siblings if any, or go up to parent
		if(item != this.item && item.parent != null && item.index < item.parent.children.length - 1) {
			if(item.index < item.parent.children.length - 1) {
				this.currentItem = item.nextSibling
				this.currentSegment = null
				this.plotItemStep()
				return
			} else {
				this.currentItem = item.parent
				this.currentSegment = null
				this.plotItemStep()
				return
			}
		}

		if(item == this.item) {
			this.clearData(item)
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
}