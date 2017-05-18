import { Tipibot, tipibot } from "./Tipibot"
import { Settings } from "./Settings"
import { Draggable } from "./Draggable"
import { Communication } from "./Communication"

export class Plot extends Draggable {
	static currentPlot: Plot = null

	public static createGUI(gui: any) {
		gui.add({plot: function() { console.log('plot') }}, 'plot')
	}

	constructor() {
		super()
	}

	plot() {
		Plot.currentPlot.plot()
	}
}

export class SVGPlot extends Plot {
	static pen: paper.Item = null
	static svgPlot: SVGPlot = null
	static scale: number = 1

	svgItem: paper.Item
	currentItem: paper.Item
	currentSegment: paper.Segment

	public static onImageLoad(event: any) {
		let svgPlot = new SVGPlot(paper.project.importSVG(event.target.result))
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

	public static createGUI(gui: any) {
		let loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]' accept='image/svg+xml'/>")
		let loadController = gui.add({loadSVG: function() { loadDivJ.click() }}, 'loadSVG')
		$(loadController.domElement).append(loadDivJ)
		loadDivJ.hide()
		loadDivJ.change(SVGPlot.handleFileSelect)
		let scaleController = gui.add(SVGPlot, 'scale', 0.1, 5)

		scaleController.onChange((value: number) => {
			SVGPlot.svgPlot.svgItem.scaling = new paper.Point(value, value)
		})
	}

	constructor(svg: paper.Item) {
		super()
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