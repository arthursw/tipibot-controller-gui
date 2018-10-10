import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { tipibot } from "../Tipibot"
import { SVGPlot } from "../Plot"

export class FileManager {
	
	gui: GUI
	saveFileName: string
	printingFileName: string
	filesFolder: GUI
	listJ: JQuery

	constructor() {
		this.saveFileName = 'drawing.txt'
		document.addEventListener('ServerMessage', (event: CustomEvent)=> this.onServerMessage(event.detail), false)
		this.printingFileName = null
	}

	createGUI(gui: GUI) {
		this.gui = gui.addFolder('File Manager')
		this.gui.add(this, 'saveFileName').name('File name')
		this.gui.addButton('Save file', ()=> this.saveFile())
		this.filesFolder = this.gui.addFolder('Files')

		this.listJ = $('<ul id="console-list" class="c-list">')

		this.listJ.insertAfter($(this.filesFolder.gui.domElement).find('li'))


	}

	saveFile() {
		if(SVGPlot.svgPlot == null) {
			console.error('No SVG loaded.')
			return
		}
		if(communication.interpreter.commandQueue.length > 0) {
			console.error('Command queue is not empty ; please finish / empty queue before saving a file.')
			return
		}
		communication.send('write-file', this.saveFileName)
		SVGPlot.plotAndLoadLoop(()=> communication.send('close-file'))
	}

	exportFile(baseName: string, i: number, project: paper.Project, images: any, group: paper.Group) {
		let fileName = baseName + "_" + i + ".svg"
		console.log("Exporting " + fileName + "...")
		let imageData = project.exportSVG({asString: true})
		let blob = new Blob([imageData], {type: 'image/svg+xml'})
		console.log("Exported " + fileName + ".")
		images.file(fileName, blob, {})
		group.removeChildren()
	}

	listFiles() {
		communication.send('list-files')
	}

	createFileItem(fileName: string): any {
		let liJ = $('<li>').attr('id', fileName)
		let messageJ = $('<div>').append(fileName).addClass('file-name')
		liJ.append(messageJ)

		let printButtonJ = $('<button>Print</button>').addClass('print')
		printButtonJ.click((event)=> this.printFileItem(fileName))
		liJ.append(printButtonJ)

		let closeButtonJ = $('<button>x</button>').addClass('close')
		closeButtonJ.click((event)=> this.removeFileItem(fileName))
		liJ.append(closeButtonJ)
		return liJ
	}

	printFileItem(fileName: string) {
		if(this.printingFileName != null) {
			if(this.printingFileName == fileName) {
				this.listJ.find('#' + fileName).find('.print').text('Print')
				communication.send('cancel-print-file', fileName)
				this.printingFileName = null
			} else {
				console.error('The file ' + this.printingFileName + ' is already being printed.')
			}
			return
		}
		this.listJ.find('#' + fileName).find('.print').text('Cancel print')
		communication.send('print-file', fileName)
		this.printingFileName = fileName
	}

	removeFileItem(fileName: string) {
		this.listJ.find('#' + fileName).remove()

		communication.send('delete-file', fileName)
	}

	onServerMessage(json: {type: string, data: any}) {


		if(json.type == 'files') {
			this.listJ.children().remove()
			for(let fileName of json.data) {
				this.createFileItem(fileName)
			}
		} else if(json.type == 'file-printed') {
			this.listJ.find('#' + json.data).find('.print').text('Print')
			console.info('File ' + json.data + ' printed.')
		}
	}
}