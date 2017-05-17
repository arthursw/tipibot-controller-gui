import { Draggable } from "./Draggable"
import { Communication } from "./Communication"

export class Plot extends Draggable {

	public static createGUI(gui: any) {
		gui.add({plot: function() { console.log('plot') }}, 'plot')
	}

	constructor() {
		super()
	}

	plot() {

	}
}

export class SVGPlot extends Plot {
	static pen: paper.Item = null
	static svgPlot: SVGPlot = null
	static scale: number = 1

	svgItem: paper.Item

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
		let loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'/>")
		let loadController = gui.add({loadSVG: function() { loadDivJ.click() }}, 'loadSVG')
		$(loadController.domElement).append(loadDivJ)
		loadDivJ.hide()
		loadDivJ.change(SVGPlot.handleFileSelect)
		let scaleController = gui.add(SVGPlot, 'scale', 0.1, 5)

		scaleController.onChange((value: number) => {
			SVGPlot.svgPlot.svgItem.scaling = new paper.Point(value, value)
		}
	}

	constructor(svg: paper.Item) {
		super()
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
		if(hitResult != null && hitResult.item == SVGPlot.pen) {
			return
		}
		super.mouseDown(event)
	}

	plot() {
		this.plotItem(this.svgItem)
	}

	plotItem(item: paper.Item) {
		if(item.className == 'Path' || item.className == 'CompoundPath') {
			let path: paper.Path = <paper.Path>item
			for(let segment of path.segments) {
				if(segment == path.firstSegment) {
					if(!Communication.communication.currentPosition.equals(segment.point)) {
						Communication.communication.sendMoveDirect(segment.point)
					}
					Communication.communication.sendPenDown(1450, 540)
				} else {
					Communication.communication.sendMoveLinear(segment.point)
					if(segment == path.lastSegment) {
						Communication.communication.sendPenUp(1450, 540)
					}
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
}