let tipibotHeight = 2020
let tipibotWidth = 1780

let paperHeight = 1220
let paperWidth = 1780

let homeX = 0
let homeY = 388

export let Settings = {
	tipibot: {
		width: tipibotWidth,
		height: tipibotHeight,
		homeX: tipibotWidth / 2,
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
declare type Tipibot = {
	getPosition: ()=> paper.Point
	setX: (x: number)=> any
	setY: (y: number)=> any
	settingsChanged: ()=> any
}

export class SettingsManager {
	
	static tipibotFolder: any = null
	static servoFolder: any = null
	static servoPositionFolder: any = null
	static servoDelayFolder: any = null
	static drawAreaFolder: any = null
	static xSlider: any = null
	static ySlider: any = null
	static tipibot: Tipibot

	static getControllers() {
		let controllers = SettingsManager.tipibotFolder.__controllers
		controllers = controllers.concat(SettingsManager.servoPositionFolder.__controllers)
		controllers = controllers.concat(SettingsManager.servoDelayFolder.__controllers)
		controllers = controllers.concat(SettingsManager.drawAreaFolder.__controllers)
		return controllers
	}

	static createGUI(gui: any) {

		let loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='application/json'/>")
		let loadController = gui.add({loadSettings: function() { loadDivJ.click() }}, 'loadSettings')
		$(loadController.domElement).append(loadDivJ)
		loadDivJ.hide()
		loadDivJ.change(SettingsManager.handleFileSelect)

		gui.add(SettingsManager, 'saveSettings')

		SettingsManager.tipibotFolder = gui.addFolder('Tipibot')
		SettingsManager.tipibotFolder.add(Settings.tipibot, 'width', 100, 10000)
		SettingsManager.tipibotFolder.add(Settings.tipibot, 'height', 100, 10000)
		SettingsManager.tipibotFolder.add(Settings.tipibot, 'homeX', 0, Settings.tipibot.width)
		SettingsManager.tipibotFolder.add(Settings.tipibot, 'homeY', 0, Settings.tipibot.height)
		SettingsManager.tipibotFolder.add(Settings.tipibot, 'speed', 0, 5000)

		SettingsManager.servoFolder = gui.addFolder('Servo')

		SettingsManager.servoPositionFolder = SettingsManager.servoFolder.addFolder('Position')
		SettingsManager.servoPositionFolder.add(Settings.servo.position, 'up', 0, 3600)
		SettingsManager.servoPositionFolder.add(Settings.servo.position, 'down', 0, 3600)

		SettingsManager.servoDelayFolder = SettingsManager.servoFolder.addFolder('Delay')
		SettingsManager.servoDelayFolder.add(Settings.servo.delay, 'up', 0, 1000)
		SettingsManager.servoDelayFolder.add(Settings.servo.delay, 'down', 0, 1000)

		SettingsManager.drawAreaFolder = gui.addFolder('DrawArea')
		SettingsManager.drawAreaFolder.add(Settings.drawArea, 'x', 0, Settings.tipibot.width)
		SettingsManager.drawAreaFolder.add(Settings.drawArea, 'y', 0, Settings.tipibot.height)
		SettingsManager.drawAreaFolder.add(Settings.drawArea, 'width', 0, Settings.tipibot.width)
		SettingsManager.drawAreaFolder.add(Settings.drawArea, 'height', 0, Settings.tipibot.height)

		let controllers = SettingsManager.getControllers()

		for(let controller of controllers) {
			controller.onChange(SettingsManager.settingChanged)
		}
	}

	static addTipibotToGUI(tipibot: Tipibot) {
		SettingsManager.tipibot = tipibot
		let position = tipibot.getPosition()
		SettingsManager.xSlider = SettingsManager.tipibotFolder.add(position, 'x', 0, Settings.tipibot.width).onChange((value: number)=>{tipibot.setX(value)})
		SettingsManager.ySlider = SettingsManager.tipibotFolder.add(position, 'y', 0, Settings.tipibot.height).onChange((value: number)=>{tipibot.setY(value)})
	}

	public static settingChanged(value: any=null) {
		SettingsManager.xSlider.max(Settings.tipibot.width)
		SettingsManager.ySlider.max(Settings.tipibot.height)

		SettingsManager.xSlider.setValue(Settings.tipibot.homeX)
		SettingsManager.ySlider.setValue(Settings.tipibot.homeY)

		for(let controller of SettingsManager.drawAreaFolder.__controllers.concat(SettingsManager.tipibotFolder.__controllers)) {
			if(controller.property == 'x' || controller.property == 'width' || controller.property == 'homeX') {
				controller.max(Settings.tipibot.width)
			}
			if(controller.property == 'y' || controller.property == 'height' || controller.property == 'homeX') {
				controller.max(Settings.tipibot.height)
			}
		}

		SettingsManager.tipibot.settingsChanged()
	}

	static saveSettings() {
		let json = JSON.stringify(Settings)
		var blob = new Blob([json], {type: "application/json"})
		saveAs(blob, "settings.json")
		localStorage.setItem('settings', json)
	}

	static updateSliders() {
		let controllers = SettingsManager.getControllers()

		for(let controller of controllers) {
			controller.updateDisplay()
		}
	}

	static copyObjectProperties(Target: any, Source: any) {
		for(let property in Target) {
			if(typeof(Target[property]) === 'object') {
				SettingsManager.copyObjectProperties(Target[property], Source[property])
			} else {
				Target[property] = Source[property]
			}
		}
	}

	static onJsonLoad(event: any) {
		SettingsManager.copyObjectProperties(Settings, JSON.parse(event.target.result))
		SettingsManager.settingChanged()
		SettingsManager.updateSliders()
	}

	static handleFileSelect(event: any) {
		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0; i < files.length; i++) {
			let file = files.item(i)
			
			let reader = new FileReader()
			reader.onload = SettingsManager.onJsonLoad
			reader.readAsText(file)
		}
	}

	static loadLocalStorage() {
		Settings = JSON.parse(localStorage.getItem('settings'))
	}
 }