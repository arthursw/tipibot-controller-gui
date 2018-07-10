import { GUI, Controller } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"

let tipibotHeight = 2020
let tipibotWidth = 1780

let paperHeight = 900
let paperWidth = 1200

let homeX = 0
let homeY = 388

export let Settings = {
	autoConnect: true,
	firmware: 'Tipibot',
	forceLinearMoves: true,
	tipibot: {
		width: tipibotWidth,
		height: tipibotHeight,
		homeX: tipibotWidth / 2,
		homeY: paperHeight + homeY,
		invertMotorLeft: false,
		invertMotorRight: false,
		maxSpeed: 500,
		acceleration: 200,
		stepsPerRev: 200,
		microstepResolution: 32,
		mmPerRev: 96,
		progressiveMicrosteps: false,
		penWidth: 2
	},
	servo: {
		speed: 100,
		position: {
			invert: false,
			up: 90,
			down: 180,
		},
		delay: {
			up: {
				before: 0,
				after: 0,
			},
			down: {
				before: 1000,
				after: 2000,
			},
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
		maxSegmentLength: 10,
		fullSpeed: true,
		maxCurvatureFullspeed: 45,
	},
	feedback: {
		enable: true,
		rate: 10
	}
}

const MAX_SPEED = 10000

declare let saveAs: any

export class SettingsManager {
	
	gui: GUI = null
	tipibotPositionFolder: GUI = null
	drawAreaDimensionsFolder: GUI = null
	motorsFolder: GUI = null
	homeFolder: GUI = null
	tipibot: TipibotInterface

	static mmPerSteps() {
		return Settings.tipibot.mmPerRev / ( Settings.tipibot.stepsPerRev * Settings.tipibot.microstepResolution );
	}

	static stepsPerMm() {
		return ( Settings.tipibot.stepsPerRev * Settings.tipibot.microstepResolution ) / Settings.tipibot.mmPerRev;
	}

	static mmToSteps(point: paper.Point): paper.Point {
		return point.multiply(SettingsManager.stepsPerMm())
	}

	static stepsToMm(point: paper.Point): paper.Point {
		return point.multiply(SettingsManager.mmPerSteps())
	}

	static servoUpAngle() {
		return Settings.servo.position.invert ? Settings.servo.position.down : Settings.servo.position.up
	}

	static servoDownAngle() {
		return Settings.servo.position.invert ?  Settings.servo.position.up : Settings.servo.position.down
	}

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
		this.tipibotPositionFolder.addButton('Set position with mouse', () => this.tipibot.toggleSetPosition() )
		this.tipibotPositionFolder.addButton('Set position to home', () => this.tipibot.setPositionToHome() )
		
		let position = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.tipibotPositionFolder.add(position, 'x', 0, Settings.tipibot.width).name('X')
		this.tipibotPositionFolder.add(position, 'y', 0, Settings.tipibot.height).name('Y')

		this.homeFolder = settingsFolder.addFolder('Home')
		this.homeFolder.addButton('Set home', ()=> this.tipibot.setHome())
		this.homeFolder.add( {'Position': 'Bottom'}, 'Position', ['Custom', 'Top', 'Center', 'Bottom', 'Left', 'Right', 'TopLeft', 'BottomLeft', 'TopRight', 'BottomRight'])
		this.homeFolder.add(Settings.tipibot, 'homeX', 0, Settings.tipibot.width).name('Home X')
		this.homeFolder.add(Settings.tipibot, 'homeY', 0, Settings.tipibot.height).name('Home Y')
		this.homeFolder.open()

		let tipibotDimensionsFolder = settingsFolder.addFolder('Machine dimensions')
		tipibotDimensionsFolder.add(Settings.tipibot, 'width', 100, 10000, 1).name('Width')
		tipibotDimensionsFolder.add(Settings.tipibot, 'height', 100, 10000, 1).name('Height')

		this.drawAreaDimensionsFolder = settingsFolder.addFolder('Draw area dimensions')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'y', 0, Settings.tipibot.height, 1).name('Offset Y')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'width', 0, Settings.tipibot.width, 1).name('Width')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'height', 0, Settings.tipibot.height, 1).name('Height')

		let penFolder = settingsFolder.addFolder('Pen')

		penFolder.add(Settings.tipibot, 'penWidth', 0.1, 20).name('Pen width')
		penFolder.add(Settings.servo, 'speed', 1, 360, 1).name('Servo speed deg/sec.')

		let anglesFolder = penFolder.addFolder('Angles')
		anglesFolder.add(Settings.servo.position, 'invert').name('Invert')
		anglesFolder.add(Settings.servo.position, 'up', 0, 180, 1).name('Up')
		anglesFolder.add(Settings.servo.position, 'down', 0, 180, 1).name('Down')

		let delaysFolder = penFolder.addFolder('Delays')
		let delaysUpFolder = delaysFolder.addFolder('Up')
		delaysUpFolder.add(Settings.servo.delay.up, 'before', 0, 3000, 1).name('Before')
		delaysUpFolder.add(Settings.servo.delay.up, 'after', 0, 3000, 1).name('After')

		let delaysDownFolder = delaysFolder.addFolder('Down')
		delaysDownFolder.add(Settings.servo.delay.down, 'before', 0, 3000, 1).name('Before')
		delaysDownFolder.add(Settings.servo.delay.down, 'after', 0, 3000, 1).name('After')

		this.motorsFolder = settingsFolder.addFolder('Motors')

		this.motorsFolder.add(Settings.tipibot, 'invertMotorLeft').name('Invert left motor')
		this.motorsFolder.add(Settings.tipibot, 'invertMotorRight').name('Invert right motor')
		this.motorsFolder.add(Settings.tipibot, 'maxSpeed', 1, MAX_SPEED, 1).name('Max speed steps/sec.')
		this.motorsFolder.add({maxSpeedMm: Settings.tipibot.maxSpeed * SettingsManager.mmPerSteps()}, 'maxSpeedMm', 0.1, MAX_SPEED * SettingsManager.mmPerSteps(), 0.01).name('Max speed mm/sec.')
		this.motorsFolder.add(Settings.tipibot, 'acceleration', 1, 5000, 1).name('Acceleration')
		this.motorsFolder.add(Settings.tipibot, 'stepsPerRev', 1, 500, 1).name('Steps per rev.')
		this.motorsFolder.add(Settings.tipibot, 'microstepResolution', 1, 64, 1).name('Step multiplier')
		this.motorsFolder.add(Settings.tipibot, 'mmPerRev', 1, 250, 1).name('Mm per rev.')
		this.motorsFolder.add(Settings.tipibot, 'progressiveMicrosteps').name('Progressive Microsteps')

		let feedbackFolder = settingsFolder.addFolder('Feedback')
		feedbackFolder.add(Settings.feedback, 'enable').name('Enable feedback')
		feedbackFolder.add(Settings.feedback, 'rate', 1, 100).name('Feedback rate (info/sec.)')

		settingsFolder.add(Settings, 'forceLinearMoves').name('Force linear moves')

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

	updateHomePosition(homePositionName: string, updateSliders = true) {
		if(homePositionName == 'Top') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y
		} else if(homePositionName == 'Center') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y + Settings.drawArea.height / 2
		} else if(homePositionName == 'Bottom') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y + Settings.drawArea.height
		} else if(homePositionName == 'Left') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2 - Settings.drawArea.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y + Settings.drawArea.height / 2
		} else if(homePositionName == 'Right') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2 + Settings.drawArea.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y + Settings.drawArea.height / 2
		} else if(homePositionName == 'TopLeft') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2 - Settings.drawArea.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y
		} else if(homePositionName == 'BottomLeft') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2 - Settings.drawArea.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y + Settings.drawArea.height
		} else if(homePositionName == 'TopRight') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2 + Settings.drawArea.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y
		} else if(homePositionName == 'BottomRight') {
			Settings.tipibot.homeX = Settings.tipibot.width / 2 + Settings.drawArea.width / 2
			Settings.tipibot.homeY = Settings.drawArea.y + Settings.drawArea.height
		}
		if(updateSliders) {
			this.homeFolder.getController('homeX').setValueNoCallback(Settings.tipibot.homeX)
			this.homeFolder.getController('homeY').setValueNoCallback(Settings.tipibot.homeY)
		}
		this.tipibot.setHome(false)
	}

	settingChanged(parentNames: string[], name: string, value: any=null, changeFinished=false) {

		// update sliders and transmit change to concerned object
		if(parentNames[0] == 'Machine dimensions') {
			if(name == 'width') {
				this.tipibotPositionFolder.getController('x').max(value, false)
				this.drawAreaDimensionsFolder.getController('width').max(value, changeFinished)
				document.dispatchEvent(new CustomEvent('MachineWidthChanged'))
			} else if(name == 'height') {
				this.tipibotPositionFolder.getController('y').max(value, false)
				this.drawAreaDimensionsFolder.getController('height').max(value, changeFinished)
				this.drawAreaDimensionsFolder.getController('y').max(value - Settings.drawArea.height, changeFinished)
			}
			if(name == 'width' || name == 'height') {
				this.updateHomePosition(this.homeFolder.getController('Position').getValue(), true)
				this.tipibot.sizeChanged(changeFinished)
			}
		} else if(parentNames[0] == 'Home') {
			if(name == 'Position') {
				this.updateHomePosition(value, true)
			}
			if(name == 'homeX' || name == 'homeY') {
				this.homeFolder.getController('Position').setValueNoCallback('Custom')
				this.tipibot.setHome(false)
			}
		} else if(parentNames[0] == 'Motors') {
			if(name == 'maxSpeed') {
				let maxSpeedMm = value * SettingsManager.mmPerSteps()
				this.motorsFolder.getController('maxSpeedMm').setValueNoCallback(maxSpeedMm)
				this.tipibot.maxSpeedChanged(changeFinished)
			} else if(name == 'maxSpeedMm') {
				let maxSpeedSteps = value / SettingsManager.mmPerSteps()
				this.motorsFolder.getController('maxSpeed').setValueNoCallback(maxSpeedSteps)
				Settings.tipibot.maxSpeed = maxSpeedSteps
				this.tipibot.maxSpeedChanged(changeFinished)
			} else if(name == 'acceleration') {
				this.tipibot.accelerationChanged(changeFinished)
			} else if(name == 'mmPerRev') {
				this.tipibot.mmPerRevChanged(changeFinished)
			} else if(name == 'stepsPerRev') {
				this.tipibot.stepsPerRevChanged(changeFinished)
			} else if(name == 'microstepResolution') {
				this.tipibot.microstepResolutionChanged(changeFinished)
			} else if(name == 'penWidth') {
				this.tipibot.penWidthChanged(changeFinished)
			} else if(name == 'invertMotorLeft' || name == 'invertMotorRight' && changeFinished) {
				this.tipibot.sendInvertXY()
			} else if(name == 'progressiveMicrosteps' && changeFinished) {
				this.tipibot.sendProgressiveMicrosteps()
			}
			if(name == 'mmPerRev' || 'stepsPerRev' || 'microstepResolution') {
				let maxSpeedMm = Settings.tipibot.maxSpeed * SettingsManager.mmPerSteps()
				let maxSpeedMmController = this.motorsFolder.getController('maxSpeedMm')
				maxSpeedMmController.max(MAX_SPEED * SettingsManager.mmPerSteps())
				maxSpeedMmController.setValueNoCallback(maxSpeedMm)
			}
		} else if(parentNames[0] == 'Position') {
			if(name == 'x') {
				this.tipibot.setX(value, changeFinished)
			} else if(name == 'y') {
				this.tipibot.setY(value, changeFinished)
			}
		} else if(parentNames[0] == 'Angles' && parentNames[1] == 'Pen' && (name == 'up' || name == 'down') ) {
			if(changeFinished) {
				this.tipibot.servoChanged(changeFinished)
			}
		} else if(parentNames[0] == 'Pen') {
			if(name == 'penWidth') {
				if(changeFinished) {
					this.tipibot.penWidthChanged(true)
				}
			} else if(name == 'speed') {
				this.tipibot.servoChanged(changeFinished)
			}
		} else if(parentNames[0] == 'Draw area dimensions') {
			this.tipibot.drawAreaChanged(changeFinished)
			this.updateHomePosition(this.homeFolder.getController('Position').getValue(), true)
		} else if(parentNames[0] == 'Feedback') {
			this.tipibot.feedbackChanged(changeFinished)
		}
		this.save(false)
	}

	// When loading settings (load from json file)
	settingsChanged() {

		this.tipibotPositionFolder.getController('x').max(Settings.tipibot.width, false)
		this.tipibotPositionFolder.getController('y').max(Settings.tipibot.height, false)
		this.drawAreaDimensionsFolder.getController('width').max(Settings.tipibot.width, false)
		this.drawAreaDimensionsFolder.getController('height').max(Settings.tipibot.height, false)
		this.drawAreaDimensionsFolder.getController('y').max(Settings.tipibot.height - Settings.drawArea.height, false)
		this.tipibotPositionFolder.getController('x').setValue(Settings.tipibot.homeX, false)
		this.tipibotPositionFolder.getController('y').setValue(Settings.tipibot.homeY, false)
		this.homeFolder.getController('Position').setValue('Custom', false)
		this.homeFolder.getController('homeX').setValue(Settings.tipibot.homeX, false)
		this.homeFolder.getController('homeY').setValue(Settings.tipibot.homeY, false)

		for(let controller of this.getControllers()) {
			controller.updateDisplay()
		}

		this.tipibot.maxSpeedChanged(true)
		this.tipibot.mmPerRevChanged(true)
		this.tipibot.stepsPerRevChanged(true)
		this.tipibot.microstepResolutionChanged(true)
		this.tipibot.penWidthChanged(true)
		this.tipibot.servoChanged(true)
		this.tipibot.sizeChanged(true)
		this.tipibot.drawAreaChanged(true)
		// this.tipibot.setX(Settings.tipibot.homeX, false)
		// this.tipibot.setY(Settings.tipibot.homeY, true)
		this.tipibot.setHome(false)

		// save to local storage
		this.save(false)
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
		if(source == null) {
			return
		}
		for(let property in target) {
			if(typeof(target[property]) === 'object') {
				this.copyObjectProperties(target[property], source[property])
			} else if (source[property] != null) {
				if(typeof target[property] == typeof source[property]) {
					target[property] = source[property]
				}
			}
		}
	}

	copyObjectPropertiesFromJSON(target: any, jsonSource: any) {
		if(jsonSource == null) {
			return
		}
		this.copyObjectProperties(target, JSON.parse(jsonSource))
	}

	onJsonLoad(event: any) {
		if(event.target != null && event.target.result != null) {
			this.copyObjectPropertiesFromJSON(Settings, event.target.result)
			this.settingsChanged()
			this.updateSliders()
		}
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
		this.copyObjectPropertiesFromJSON(Settings, localStorage.getItem('settings'))
	}
}

export let settingsManager = new SettingsManager()