import { Tipibot, tipibot } from "./Tipibot"
import { Settings } from "./Settings"
import { Draggable } from "./Draggable"
import { Communication, communication } from "./Communication"
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
		Plot.plotFolder.addButton('plot', Plot.createCallback(Plot.prototype.plot))
		Plot.plotFolder.addButton('stop', Plot.createCallback(Plot.prototype.stop))
		Plot.plotFolder.addButton('rotate', Plot.createCallback(Plot.prototype.rotate))
		Plot.plotFolder.addButton('flipX', Plot.createCallback(Plot.prototype.flipX))
		Plot.plotFolder.addButton('flipY', Plot.createCallback(Plot.prototype.flipY))

		Plot.xSlider = Plot.plotFolder.addSlider('x', 0, 0, Settings.tipibot.width).onChange(Plot.createCallback(Plot.prototype.setX, true))
		Plot.ySlider = Plot.plotFolder.addSlider('y', 0, 0, Settings.tipibot.height).onChange(Plot.createCallback(Plot.prototype.setY, true))
	}

	constructor(renderer: Renderer) {
		super(renderer)
	}

	plot() {
	}

	stop() {
		communication.sendStop()
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
	static scale: number = 1
	static renderer: Renderer
	static gui: GUI

	svgItem: paper.Item
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
		gui.addFileSelectorButton('loadSVG', 'image/svg+xml', SVGPlot.handleFileSelect)

		let scaleController = gui.add(SVGPlot, 'scale', 0.1, 5)

		scaleController.onChange((value: number) => {
			SVGPlot.svgPlot.svgItem.scaling = new paper.Point(value, value)
		})
	}

	constructor(svg: paper.Item, renderer: Renderer) {
		super(renderer)
		Plot.currentPlot = this
		SVGPlot.svgPlot = this
		this.svgItem = svg
		paper.project.layers[0].addChild(svg)
		this.flatten(svg, 20)
		this.item = this.svgItem
	}

	flatten(item: paper.Item, flatness: number) {
		if(item.className == 'Path' || item.className == 'CompoundPath') {
			(<paper.Path>item).flatten(flatness)
		} else if(item.className == 'Shape') {
			(<paper.Shape>item).toPath(true).flatten(flatness)
			item.parent.addChildren(item.children)
			item.remove()
		}
		if(item.children == null) {
			return
		}
		for(let child of item.children) {
			this.flatten(child, flatness)
		}
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

	plot() {
		this.plotItem(this.svgItem)
		tipibot.goHome()
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
		} else if(item.className == 'Shape') {
			console.error('A shape was found in the SVG to plot.')
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
		if(item != this.svgItem && item.parent != null && item.index < item.parent.children.length - 1) {
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

		if(item == this.svgItem) {
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