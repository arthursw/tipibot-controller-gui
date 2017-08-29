import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"

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
		speed: 1440,
		acceleration: 400,
		stepsPerRev: 200,
		stepMultiplier: 32,
		mmPerRev: 96,
		penWidth: 2
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
	},
	plot: {
		flatten: true,
		flattenPrecision: 0.25,
		subdivide: false,
		maxSegmentLength: 10
	}
}

declare let saveAs: any

export class SettingsManager {
	
	settingsFolder: GUI = null
	tipibotFolder: GUI = null
	servoFolder: GUI = null
	servoPositionFolder: GUI = null
	servoDelayFolder: GUI = null
	drawAreaFolder: GUI = null
	tipibot: TipibotInterface

	constructor() {
	}

	getControllers() {
		let controllers = this.tipibotFolder.getControllers()
		controllers = controllers.concat(this.servoPositionFolder.getControllers())
		controllers = controllers.concat(this.servoDelayFolder.getControllers())
		controllers = controllers.concat(this.drawAreaFolder.getControllers())
		return controllers
	}

	createGUI(gui: GUI) {

		this.settingsFolder = gui.addFolder('Settings')
		this.settingsFolder.addFileSelectorButton('Load', 'application/json', this.handleFileSelect )
		this.settingsFolder.add(this, 'save').name('Save')

		this.tipibotFolder = gui.addFolder('Tipibot')
		this.tipibotFolder.add(Settings.tipibot, 'width', 100, 10000, 1).name('Width')
		this.tipibotFolder.add(Settings.tipibot, 'height', 100, 10000, 1).name('Height')
		this.tipibotFolder.add(Settings.tipibot, 'homeX', 0, 1, Settings.tipibot.width).name('Home X')
		this.tipibotFolder.add(Settings.tipibot, 'homeY', 0, 1, Settings.tipibot.height).name('Home Y')
		this.tipibotFolder.add(Settings.tipibot, 'speed', 100, 10000, 1).name('Speed')
		this.tipibotFolder.add(Settings.tipibot, 'acceleration', 50, 1500, 1).name('Acceleration')
		this.tipibotFolder.add(Settings.tipibot, 'stepsPerRev', 1, 500, 1).name('Steps per rev.')
		this.tipibotFolder.add(Settings.tipibot, 'stepMultiplier', 1, 64, 1).name('Step multiplier')
		this.tipibotFolder.add(Settings.tipibot, 'mmPerRev', 1, 250, 1).name('Mm per rev.')
		this.tipibotFolder.add(Settings.tipibot, 'penWidth', 1, 20, 1).name('Pen width')

		this.servoFolder = gui.addFolder('Servo')

		this.servoPositionFolder = this.servoFolder.addFolder('Position')
		this.servoPositionFolder.add(Settings.servo.position, 'up', 0, 3600, 1).name('Up')
		this.servoPositionFolder.add(Settings.servo.position, 'down', 0, 3600, 1).name('Down')

		this.servoDelayFolder = this.servoFolder.addFolder('Delay')
		this.servoDelayFolder.add(Settings.servo.delay, 'up', 0, 1000, 1).name('Up')
		this.servoDelayFolder.add(Settings.servo.delay, 'down', 0, 1000, 1).name('Down')

		this.drawAreaFolder = gui.addFolder('Draw Area')
		this.drawAreaFolder.add(Settings.drawArea, 'x', 0, Settings.tipibot.width, 1).name('X')
		this.drawAreaFolder.add(Settings.drawArea, 'y', 0, Settings.tipibot.height, 1).name('Y')
		this.drawAreaFolder.add(Settings.drawArea, 'width', 0, Settings.tipibot.width, 1).name('Width')
		this.drawAreaFolder.add(Settings.drawArea, 'height', 0, Settings.tipibot.height, 1).name('Height')

		let controllers = this.getControllers()

		for(let controller of controllers) {
			let name = controller.getName()
			let parentName = controller.getTopParentName()
			controller.onChange( (value: any) => this.settingChanged(parentName, name, value) )
		}
	}

	addTipibotToGUI(tipibot: TipibotInterface) {
		this.tipibot = tipibot
		this.tipibot.createGUI(this.tipibotFolder)
	}

	settingChanged(parentName: string, name: string, value: any=null) {

		if(parentName == 'Tipibot' && (name == 'width' || name == 'height')) {
			for(let controller of this.drawAreaFolder.getControllers().concat(this.tipibotFolder.getControllers())) {
				if(controller.getName() == 'x' || controller.getName() == 'homeX') {
					controller.max(Settings.tipibot.width)
				}
				if(controller.getName() == 'y' || controller.getName() == 'homeX') {
					controller.max(Settings.tipibot.height)
				}
			}
		}

		this.tipibot.settingChanged(parentName, name, value)
	}

	settingsChanged() {
		for(let controller of this.drawAreaFolder.getControllers().concat(this.tipibotFolder.getControllers())) {
			if(controller.getName() == 'x' || controller.getName() == 'homeX') {
				controller.max(Settings.tipibot.width)
			}
			if(controller.getName() == 'y' || controller.getName() == 'homeX') {
				controller.max(Settings.tipibot.height)
			}
		}

		this.tipibot.settingsChanged()
	}

	save() {
		let json = JSON.stringify(Settings, null, '\t')
		var blob = new Blob([json], {type: "application/json"})
		saveAs(blob, "settings.json")
		localStorage.setItem('settings', json)
	}

	updateSliders() {
		let controllers = this.getControllers()

		for(let controller of controllers) {
			controller.updateDisplay()
		}
	}

	copyObjectProperties(Target: any, Source: any) {
		for(let property in Target) {
			if(typeof(Target[property]) === 'object') {
				this.copyObjectProperties(Target[property], Source[property])
			} else {
				Target[property] = Source[property]
			}
		}
	}

	onJsonLoad(event: any) {
		this.copyObjectProperties(Settings, JSON.parse(event.target.result))
		this.settingsChanged()
		this.updateSliders()
	}

	handleFileSelect(event: any) {
		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0; i < files.length; i++) {
			let file = files.item(i)
			
			let reader = new FileReader()
			reader.onload = this.onJsonLoad
			reader.readAsText(file)
		}
	}

	loadLocalStorage() {
		Settings = JSON.parse(localStorage.getItem('settings'))
	}
}

export let settingsManager = new SettingsManager()