import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"

let tipibotHeight = 2020
let tipibotWidth = 1780

let paperHeight = 900
let paperWidth = 1200

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
	
	gui: GUI = null
	tipibotPositionFolder: GUI = null
	drawAreaDimensionsFolder: GUI = null
	tipibot: TipibotInterface

	constructor() {
		this.loadLocalStorage()
	}

	getControllers() {
		return this.gui.getFolder('Settings').getAllControllers()
	}

	createGUI(gui: GUI) {
		this.gui = gui
		let settingsFolder = gui.addFolder('Settings')
		settingsFolder.open()

		let loadSaveFolder = settingsFolder.addFolder('Load & Save')
		loadSaveFolder.addFileSelectorButton('Load', 'application/json', (event:any) => this.handleFileSelect(event) )
		loadSaveFolder.add(this, 'save').name('Save')

		this.tipibotPositionFolder = settingsFolder.addFolder('Position')
		this.tipibotPositionFolder.addButton('Set position', () => this.tipibot.toggleSetPosition() )
		
		let position = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.tipibotPositionFolder.add(position, 'x', 0, Settings.tipibot.width).name('X').onChange((value: number)=>{this.tipibot.setX(value)})
		this.tipibotPositionFolder.add(position, 'y', 0, Settings.tipibot.height).name('Y').onChange((value: number)=>{this.tipibot.setY(value)})

		let homeFolder = settingsFolder.addFolder('Home')
		homeFolder.addButton('Set home', ()=> this.tipibot.setHome())
		homeFolder.add(Settings.tipibot, 'homeX', 0, Settings.tipibot.width).name('Home X')
		homeFolder.add(Settings.tipibot, 'homeY', 0, Settings.tipibot.height).name('Home Y')
		homeFolder.open()

		let tipibotDimensionsFolder = settingsFolder.addFolder('Tipibot dimensions')
		tipibotDimensionsFolder.add(Settings.tipibot, 'width', 100, 10000, 1).name('Width')
		tipibotDimensionsFolder.add(Settings.tipibot, 'height', 100, 10000, 1).name('Height')

		this.drawAreaDimensionsFolder = settingsFolder.addFolder('Draw area dimensions')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'y', 0, Settings.tipibot.height, 1).name('Offset Y')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'width', 0, Settings.tipibot.width, 1).name('Width')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'height', 0, Settings.tipibot.height, 1).name('Height')

		let penFolder = settingsFolder.addFolder('Pen')
		penFolder.add(Settings.tipibot, 'penWidth', 1, 20, 1).name('Pen width')

		let anglesFolder = penFolder.addFolder('Angles')
		anglesFolder.add(Settings.servo.position, 'up', 0, 3600, 1).name('Up')
		anglesFolder.add(Settings.servo.position, 'down', 0, 3600, 1).name('Down')

		let delaysFolder = penFolder.addFolder('Delays')
		delaysFolder.add(Settings.servo.delay, 'up', 0, 1000, 1).name('Up')
		delaysFolder.add(Settings.servo.delay, 'down', 0, 1000, 1).name('Down')

		let machineFolder = settingsFolder.addFolder('Machine')

		machineFolder.add(Settings.tipibot, 'speed', 100, 10000, 1).name('Speed')
		machineFolder.add(Settings.tipibot, 'acceleration', 50, 1500, 1).name('Acceleration')
		machineFolder.add(Settings.tipibot, 'stepsPerRev', 1, 500, 1).name('Steps per rev.')
		machineFolder.add(Settings.tipibot, 'stepMultiplier', 1, 64, 1).name('Step multiplier')
		machineFolder.add(Settings.tipibot, 'mmPerRev', 1, 250, 1).name('Mm per rev.')

		let controllers = this.getControllers()

		for(let controller of controllers) {
			let name = controller.getName()
			let parentNames = controller.getParentNames()
			controller.onChange( (value: any) => this.settingChanged(parentNames, name, value, false) )
			controller.onFinishChange( (value: any) => this.settingChanged(parentNames, name, value, true) )
		}
	}

	setTipibot(tipibot: TipibotInterface) {
		this.tipibot = tipibot
	}

	settingChanged(parentNames: string[], name: string, value: any=null, finishChanged=false) {

		// update sliders and transmit change to concerned object
		if(parentNames[0] == 'Tipibot dimensions') {
			if(name == 'width') {
				this.tipibotPositionFolder.getController('x').max(value, false)
				this.drawAreaDimensionsFolder.getController('width').max(value, finishChanged)
			} else if(name == 'height') {
				this.tipibotPositionFolder.getController('y').max(value, false)
				this.drawAreaDimensionsFolder.getController('height').max(value, finishChanged)
				this.drawAreaDimensionsFolder.getController('y').max(value - Settings.drawArea.height, finishChanged)
			}
		} else if(parentNames[0] == 'Home') {
			if(name == 'homeX') {
				this.tipibotPositionFolder.getController('x').setValue(value, true)
			} else if(name == 'homeY') {
				this.tipibotPositionFolder.getController('y').setValue(value, true)
			}
			if(name == 'homeX' || name == 'homeY') {
				this.tipibot.setHome(false)
			}
		} else if(parentNames[0] == 'Machine') {
			if(name == 'speed' || name == 'acceleration') {
				this.tipibot.speedChanged(finishChanged)
			} else if(name == 'mmPerRev') {
				this.tipibot.mmPerRevChanged(finishChanged)
			} else if(name == 'stepsPerRev') {
				this.tipibot.stepsPerRevChanged(finishChanged)
			} else if(name == 'stepMultiplier') {
				this.tipibot.stepMultiplierChanged(finishChanged)
			} else if(name == 'penWidth') {
				this.tipibot.penWidthChanged(finishChanged)
			}
		} else if(parentNames[0] == 'Position') {
			if(name == 'x') {
				this.tipibot.setX(value, finishChanged)
			} else if(name == 'y') {
				this.tipibot.setY(value, finishChanged)
			}
		} else if(parentNames[1] == 'Pen') {
			if(finishChanged) {
				this.tipibot.servoChanged(finishChanged)
			}
		} else if(parentNames[0] == 'Draw area dimensions') {
			this.tipibot.drawAreaChanged(finishChanged)
		}
		this.save(false)
	}

	settingsChanged() {

		this.tipibotPositionFolder.getController('x').max(Settings.tipibot.width, false)
		this.tipibotPositionFolder.getController('y').max(Settings.tipibot.height, false)
		this.drawAreaDimensionsFolder.getController('width').max(Settings.tipibot.width, false)
		this.drawAreaDimensionsFolder.getController('height').max(Settings.tipibot.height, false)
		this.drawAreaDimensionsFolder.getController('y').max(Settings.tipibot.height - Settings.drawArea.height, false)
		this.tipibotPositionFolder.getController('x').setValue(Settings.tipibot.homeX, false)
		this.tipibotPositionFolder.getController('y').setValue(Settings.tipibot.homeY, false)

		for(let controller of this.getControllers()) {
			controller.updateDisplay()
		}

		this.tipibot.speedChanged(true)
		this.tipibot.mmPerRevChanged(true)
		this.tipibot.stepsPerRevChanged(true)
		this.tipibot.stepMultiplierChanged(true)
		this.tipibot.penWidthChanged(true)
		this.tipibot.servoChanged(true)
		this.tipibot.sizeChanged(true)
		this.tipibot.drawAreaChanged(true)
		this.tipibot.setX(Settings.tipibot.homeX, false)
		this.tipibot.setY(Settings.tipibot.homeY, true)
	}

	save(saveFile=true) {
		let json = JSON.stringify(Settings, null, '\t')
		localStorage.setItem('settings', json)
		if(saveFile) {
			var blob = new Blob([json], {type: "application/json"})
			saveAs(blob, "settings.json")
		}
	}

	updateSliders() {
		let controllers = this.getControllers()

		for(let controller of controllers) {
			controller.updateDisplay()
		}
	}

	copyObjectProperties(target: any, source: any) {
		for(let property in target) {
			if(typeof(target[property]) === 'object') {
				this.copyObjectProperties(target[property], source[property])
			} else {
				target[property] = source[property]
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
			reader.onload = (event:any) => this.onJsonLoad(event)
			reader.readAsText(file)
		}
	}

	loadLocalStorage() {
		Settings = JSON.parse(localStorage.getItem('settings'))
	}
}

export let settingsManager = new SettingsManager()