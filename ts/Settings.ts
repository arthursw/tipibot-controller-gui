import { GUI, Controller } from "./GUI"

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
	
	penUp: (servoUpValue?: number, servoUpTempo?: number)=> any
	penDown: (servoDownValue?: number, servoDownTempo?: number)=> any

	isPenUp: boolean

}

export class SettingsManager {
	
	tipibotFolder: GUI = null
	servoFolder: GUI = null
	servoPositionFolder: GUI = null
	servoDelayFolder: GUI = null
	drawAreaFolder: GUI = null
	xSlider: Controller = null
	ySlider: Controller = null
	tipibot: Tipibot
	setPositionButton: Controller = null
	penStateButton: Controller = null
	settingPosition: boolean = false

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

		let loadController = gui.addFileSelectorButton('loadSettings', 'application/json', this.handleFileSelect )

		gui.add(this, 'saveSettings')

		this.tipibotFolder = gui.addFolder('Tipibot')
		this.tipibotFolder.add(Settings.tipibot, 'width', 100, 10000)
		this.tipibotFolder.add(Settings.tipibot, 'height', 100, 10000)
		this.tipibotFolder.add(Settings.tipibot, 'homeX', 0, Settings.tipibot.width)
		this.tipibotFolder.add(Settings.tipibot, 'homeY', 0, Settings.tipibot.height)
		this.tipibotFolder.add(Settings.tipibot, 'speed', 0, 5000)

		this.servoFolder = gui.addFolder('Servo')

		this.servoPositionFolder = this.servoFolder.addFolder('Position')
		this.servoPositionFolder.add(Settings.servo.position, 'up', 0, 3600)
		this.servoPositionFolder.add(Settings.servo.position, 'down', 0, 3600)

		this.servoDelayFolder = this.servoFolder.addFolder('Delay')
		this.servoDelayFolder.add(Settings.servo.delay, 'up', 0, 1000)
		this.servoDelayFolder.add(Settings.servo.delay, 'down', 0, 1000)

		this.drawAreaFolder = gui.addFolder('DrawArea')
		this.drawAreaFolder.add(Settings.drawArea, 'x', 0, Settings.tipibot.width)
		this.drawAreaFolder.add(Settings.drawArea, 'y', 0, Settings.tipibot.height)
		this.drawAreaFolder.add(Settings.drawArea, 'width', 0, Settings.tipibot.width)
		this.drawAreaFolder.add(Settings.drawArea, 'height', 0, Settings.tipibot.height)

		let controllers = this.getControllers()

		for(let controller of controllers) {
			controller.onChange(this.settingChanged)
		}
	}

	addTipibotToGUI(tipibot: Tipibot) {
		this.tipibot = tipibot
		let position = tipibot.getPosition()
		this.xSlider = this.tipibotFolder.addSlider('x', position.x, 0, Settings.tipibot.width).onChange((value: number)=>{tipibot.setX(value)})
		this.ySlider = this.tipibotFolder.addSlider('y', position.y, 0, Settings.tipibot.height).onChange((value: number)=>{tipibot.setY(value)})

		this.setPositionButton = this.tipibotFolder.addButton('setPosition', () => this.toggleSetPosition() )
		this.penStateButton = this.tipibotFolder.addButton('penDown', () => this.changePenState() )
	}

	toggleSetPosition(setPosition: boolean = !this.settingPosition) {
		if(!setPosition) {
			this.setPositionButton.changeName('setPosition')
		} else {
			this.setPositionButton.changeName('cancel')
		}
		this.settingPosition = setPosition
	}

	setPositionSliders(point: paper.Point) {
		this.xSlider.setValueNoCallback(point.x)
		this.ySlider.setValueNoCallback(point.y)
	}

	changePenState() {
		if(this.tipibot.isPenUp) {
			this.tipibot.penDown()
		} else {
			this.tipibot.penUp()
		}
	}

	penUp() {
		this.penStateButton.changeName('penDown')
	}

	penDown() {
		this.penStateButton.changeName('penUp')
	}

	settingChanged(value: any=null) {
		this.xSlider.max(Settings.tipibot.width)
		this.ySlider.max(Settings.tipibot.height)

		this.xSlider.setValue(Settings.tipibot.homeX)
		this.ySlider.setValue(Settings.tipibot.homeY)

		for(let controller of this.drawAreaFolder.getControllers().concat(this.tipibotFolder.getControllers())) {
			if(controller.getName() == 'x' || controller.getName() == 'width' || controller.getName() == 'homeX') {
				controller.max(Settings.tipibot.width)
			}
			if(controller.getName() == 'y' || controller.getName() == 'height' || controller.getName() == 'homeX') {
				controller.max(Settings.tipibot.height)
			}
		}

		this.tipibot.settingsChanged()
	}

	saveSettings() {
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
		this.settingChanged()
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