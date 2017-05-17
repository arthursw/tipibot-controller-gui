let machineHeight = 2020
let machineWidth = 1780

let paperHeight = 1220
let paperWidth = 1780

let homeX = 0
let homeY = 388

export let Settings = {
	machine: {
		width: machineWidth,
		height: machineHeight,
		homeX: machineWidth / 2,
		homeY: paperHeight + homeY,
		speed: 1440
	},
	servo: {
		position: {
			up: 900,
			down: 1500,
		},
		delay: {
			up: 150,
			down: 150,
		}
	},
	drawArea: {
		x: homeX,
		y: homeY,
		width: paperWidth,
		height: paperHeight
	}

}

declare let saveAs: any

export class SettingsManager {
	
	static createGUI(gui: any) {

		let loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'/>")
		let loadController = gui.add({loadSettings: function() { loadDivJ.click() }}, 'loadSettings')
		$(loadController.domElement).append(loadDivJ)
		loadDivJ.hide()
		loadDivJ.change(SettingsManager.handleFileSelect)
	}

	static save() {
		let json = JSON.stringify(Settings)
		var blob = new Blob([json], {type: "application/json"})
		saveAs(blob, "settings.json")
		localStorage.setItem('settings', json)
	}

	static onJsonLoad(event: any) {
		Settings = JSON.parse(event.target.result)
	}

	static handleFileSelect(event: any) {
		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0; i < files.length; i++) {
			let file = files.item(i)
			
			let reader = new FileReader()
			reader.onload = this.onJsonLoad
			reader.readAsText(file)
		}
	}

	static loadLocalStorage() {
		Settings = JSON.parse(localStorage.getItem('settings'))
	}
 }