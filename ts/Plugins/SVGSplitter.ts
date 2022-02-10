import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { tipibot } from "../Tipibot"
import { SVGPlot } from "../Plot"
import { project } from "paper/dist/paper-core"

declare let JSZip: any

export class SVGSplitter {
	
	gui: GUI

	constructor() {
	
	}

	loadImage(event: any, name: string) {
		let svg = project.importSVG(event.target.result)

		console.log('SVG imported.')

		this.splitSVG(svg, name)
		
		GUI.stopLoadingAnimation()
	}

	onImageLoad(event: any, name: string) {
		console.log('Importing SVG...')

		GUI.startLoadingAnimation(()=>this.loadImage(event, name))
	}

	handleFileSelect(event: any) {

		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0 ; i < files.length ; i++) {
			let file = files[i] != null ? files[i] : files.item(i)
			
			let imageType = /^image\//

			if (!imageType.test(file.type)) {
				continue
			}

			let reader = new FileReader()
			reader.onload = (event)=> this.onImageLoad(event, file.name)
			reader.readAsText(file)
			break
		}
	}

	createGUI(gui: GUI) {
		this.gui = gui.addFolder('SVG Splitter')
		this.gui.addFileSelectorButton('Split SVG', 'image/svg+xml', false, (event)=> this.handleFileSelect(event))
	}

	exportFile(baseName: string, i: number, project: paper.Project, images: any, group: paper.Group) {
		let fileName = baseName + "_" + i + ".svg"
		console.log("Exporting " + fileName + "...")
		let imageData: any = project.exportSVG({asString: true})
		let blob = new Blob([imageData], {type: 'image/svg+xml'})
		console.log("Exported " + fileName + ".")
		images.file(fileName, blob, {})
		group.removeChildren()
	}

	splitSVG(svg: paper.Item, name: string) {
		let baseName = name.replace(/\.[^/.]+$/, "")
		let extension = name.replace(baseName, "")

		console.log("Collapsing SVG...")
		SVGPlot.collapse(svg)
		console.log("SVG collapsed.")

		SVGPlot.collapse(svg)

		console.log("Flattening and subdividing paths...")
		SVGPlot.filter(svg)
		console.log("Paths flattenned and subdivided.")

		console.log("Splitting long paths...")
		SVGPlot.splitLongPaths(svg)
		console.log("Paths split.")
		console.log("There are " + svg.children.length + " paths.")

		let mainProject = project

		let canvas = document.createElement('canvas')
		canvas.width = svg.strokeBounds.width
		canvas.height = svg.strokeBounds.height

		let newProject = new paper.Project(canvas)

		let background = new paper.Path.Rectangle(svg.bounds)
		background.matrix = svg.matrix
		background.fillColor = new paper.Color('white')
		background.sendToBack()

		let group = new paper.Group()
		group.matrix = svg.matrix
		group.strokeWidth = svg.strokeWidth
		group.fillColor = svg.fillColor
		group.strokeColor = svg.strokeColor

		newProject.view.center = svg.bounds.center

		let nSegments = 0
		let svgs = []

		let zip = new JSZip()

		var images = zip.folder(baseName)

		let i = 0
		while(svg.children.length > 0) {
			let p = <paper.Path>svg.firstChild
			p.remove()
			group.addChild(p)
			nSegments += p.segments.length
			if(nSegments > SVGPlot.nSegmentsMax) {
				this.exportFile(baseName, i, newProject, images, group)
				nSegments = 0
				i++
			}
		}

		if(group.children.length > 0) {
			this.exportFile(baseName, i, newProject, images, group)
			i++
		}

		if(i > 0) {
			console.log("Exports finished.")
			console.log(`The SVG was split in ${i} files.`)
			console.log("Generating zip file...")
			zip.generateAsync({type:"blob"}).then((content: any) => {
				console.log("Zip file generated...")
			    saveAs(content, baseName + ".zip")
			})
		} else {
			console.error('The SVG file seems empty.')
		}

		group.remove()
		newProject.remove()
		canvas.remove()
		svg.remove()

		mainProject.activate()
	}


}