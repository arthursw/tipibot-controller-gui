import { GUI } from "./GUI"
import { TipibotInterface } from "./TipibotInterface"
import { copyObjectPropertiesFromJSON, isServer, mmPerSteps, Settings, paper, createEvent, copyObjectProperties } from "./Settings"

const MAX_SPEED = 20000

declare let saveAs: any

export let capitalizeFirstLetter = (name: string) => {
	return name.charAt(0).toUpperCase() + name.slice(1)
}
export class SettingsManager {
	
	gui: GUI = null
	tipibotPositionFolder: GUI = null
	drawAreaDimensionsFolder: GUI = null
	settingsFolder: GUI = null
	motorsFolder: GUI = null
	homeFolder: GUI = null
	anglesFolder: GUI = null
	tipibot: TipibotInterface
	virtualKeyboard: any = null
	debug = false

	constructor() {
		if(!isServer) {
			this.loadLocalStorage()
		}
	}

	getControllers() {
		return this.gui.getFolder('Settings').getAllControllers()
	}

	createGUI(gui: GUI, virtualKeyboard: any) {
		this.gui = gui
		this.virtualKeyboard = virtualKeyboard
		let settingsFolder = gui.addFolder('Settings')
		this.settingsFolder = settingsFolder
		settingsFolder.open()

		let loadSaveFolder = settingsFolder.addFolder('Load & Save')
		loadSaveFolder.addFileSelectorButton('Load', 'application/json', false, (event:any) => this.handleFileSelect(event) )
		loadSaveFolder.add(this, 'save').name('Save')

		this.tipibotPositionFolder = settingsFolder.addFolder('Position')
		this.tipibotPositionFolder.addButton('Set position to home', () => this.tipibot.setHome() )
		this.tipibotPositionFolder.addButton('Set position with mouse', () => this.tipibot.toggleSetPosition() )
		
		let position = new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY)
		this.tipibotPositionFolder.add(position, 'x', 0, Settings.tipibot.width).name('X')
		this.tipibotPositionFolder.add(position, 'y', 0, Settings.tipibot.height).name('Y')
		this.tipibotPositionFolder.open()

		this.homeFolder = settingsFolder.addFolder('Home')
		// this.homeFolder.addButton('Set home', ()=> this.tipibot.setHome())
		this.homeFolder.add( {'Position': 'Bottom'}, 'Position', ['Custom', 'Top', 'Center', 'Bottom', 'Left', 'Right', 'TopLeft', 'BottomLeft', 'TopRight', 'BottomRight'])
		this.homeFolder.add(Settings.tipibot, 'homeX', 0, Settings.tipibot.width).name('Home X')
		this.homeFolder.add(Settings.tipibot, 'homeY', 0, Settings.tipibot.height).name('Home Y')
		// this.homeFolder.open()

		let tipibotDimensionsFolder = settingsFolder.addFolder('Machine dimensions')
		tipibotDimensionsFolder.add(Settings.tipibot, 'width', 100, 10000, 1).name('Width')
		tipibotDimensionsFolder.add(Settings.tipibot, 'height', 100, 10000, 1).name('Height')
		tipibotDimensionsFolder.add(Settings.tipibot, 'stringLength', 100, 10000, 1).name('String length')

		this.drawAreaDimensionsFolder = settingsFolder.addFolder('Draw area dimensions')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'y', 0, Settings.tipibot.height, 1).name('Offset Y')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'width', 0, Settings.tipibot.width, 1).name('Width')
		this.drawAreaDimensionsFolder.add(Settings.drawArea, 'height', 0, Settings.tipibot.height, 1).name('Height')

		let penFolder = settingsFolder.addFolder('Pen')

		penFolder.add(Settings.tipibot, 'penWidth', 0.1, 20).name('Pen width')
		penFolder.add(Settings.tipibot, 'penOffset', -200, 200, 1).name('Pen offset')
		penFolder.add(Settings.servo, 'delta', 0, 45, 1).name('Angle delta')
		penFolder.add(Settings.servo, 'speed', 1, 360, 1).name('Servo speed deg/sec.')

		this.anglesFolder = penFolder.addFolder('Angles')
		this.anglesFolder.add(Settings.servo.position, 'invert').name('Invert')
		this.anglesFolder.add(Settings.servo.position, 'up', 0, 3180).name('Up')
		this.anglesFolder.add(Settings.servo.position, 'down', 0, 3180).name('Down')
		this.anglesFolder.add(Settings.servo.position, 'close', 0, 3180).name('Close')
		this.anglesFolder.add(Settings.servo.position, 'drop', 0, 3180).name('Drop')

		let delaysFolder = penFolder.addFolder('Delays')
		let delaysUpFolder = delaysFolder.addFolder('Up')
		delaysUpFolder.add(Settings.servo.delay.up, 'before', 0, 3000, 1).name('Before')
		delaysUpFolder.add(Settings.servo.delay.up, 'after', 0, 3000, 1).name('After')

		let delaysDownFolder = delaysFolder.addFolder('Down')
		delaysDownFolder.add(Settings.servo.delay.down, 'before', 0, 3000, 1).name('Before')
		delaysDownFolder.add(Settings.servo.delay.down, 'after', 0, 3000, 1).name('After')
		
		let groundStationFolder = settingsFolder.addFolder('Ground station')
		
		groundStationFolder.add(Settings.groundStation.speeds, 'gondola', 0, 10000, 1).name('Gondola speed')
		groundStationFolder.add(Settings.groundStation.speeds, 'station', 0, 10000, 1).name('Station speed')

		let xFolder = groundStationFolder.addFolder('X')
		for(let name in Settings.groundStation.x) {
			xFolder.add(Settings.groundStation.x, name).name(capitalizeFirstLetter(name))
		}

		let yFolder = groundStationFolder.addFolder('Y')
		for(let name in Settings.groundStation.y) {
			yFolder.add(Settings.groundStation.y, name).name(capitalizeFirstLetter(name))
		}
		let extruderFolder = groundStationFolder.addFolder('Extruder')

		extruderFolder.add(Settings.groundStation.extruder, 'drop', -1000, 1000, 1).name('Drop')
		extruderFolder.add(Settings.groundStation.extruder, 'close', -1000, 1000, 1).name('Close')
		extruderFolder.add(Settings.groundStation.extruder, 'open', -1000, 1000, 1).name('Open')

		let actionsFolder = groundStationFolder.addFolder('Actions')
		actionsFolder.addButton('Move above station', ()=> this.tipibot.moveAboveStation())
		for(let name in Settings.groundStation.x) {
			if(name == 'station') {
				continue
			}
			actionsFolder.addButton('Pick ' + capitalizeFirstLetter(name), ()=> this.tipibot.pickPen(name))
			actionsFolder.addButton('Drop ' + capitalizeFirstLetter(name), ()=> this.tipibot.dropPen(name))
		}
		actionsFolder.addButton('Open pen', ()=> this.tipibot.openPen())
		actionsFolder.addButton('Close pen', ()=> this.tipibot.closePen())

		this.motorsFolder = settingsFolder.addFolder('Motors')

		this.motorsFolder.add(Settings.tipibot, 'invertMotorLeft').name('Invert left motor')
		this.motorsFolder.add(Settings.tipibot, 'invertMotorRight').name('Invert right motor')
		this.motorsFolder.add(Settings.tipibot, 'drawSpeed', 1, MAX_SPEED, 1).name('Draw speed steps/sec.')
		this.motorsFolder.add(Settings.tipibot, 'maxSpeed', 1, MAX_SPEED, 1).name('Max speed steps/sec.')
		this.motorsFolder.add({maxSpeedMm: Settings.tipibot.maxSpeed * mmPerSteps()}, 'maxSpeedMm', 0.1, MAX_SPEED * mmPerSteps(), 0.01).name('Max speed mm/sec.')
		this.motorsFolder.add(Settings.tipibot, 'acceleration', 1, 5000, 1).name('Acceleration')
		this.motorsFolder.add(Settings.tipibot, 'stepsPerRev', 1, 500, 1).name('Steps per rev.')
		this.motorsFolder.add(Settings.tipibot, 'microstepResolution', 1, 256, 1).name('Step multiplier')
		this.motorsFolder.add(Settings.tipibot, 'mmPerRev', 1, 250, 1).name('Mm per rev.')
		this.motorsFolder.add(Settings.tipibot, 'progressiveMicrosteps').name('Progressive Microsteps')

		let feedbackFolder = settingsFolder.addFolder('Feedback')
		feedbackFolder.add(Settings.feedback, 'enable').name('Enable feedback')
		feedbackFolder.add(Settings.feedback, 'rate', 1, 100, 1).name('Feedback rate (info/sec.)')
		feedbackFolder.addButton('Clear feedback', () => document.dispatchEvent(createEvent('ClearFeedback')))
		
		settingsFolder.add(Settings, 'forceLinearMoves').name('Force linear moves')
		settingsFolder.add(Settings, 'forceInitialization').name('Force initialization')
		// settingsFolder.add(Settings, 'disableMouseInteractions').name('Disable mouse interactions')
		// settingsFolder.add(Settings, 'disableCommandList').name('Disable command list')
		settingsFolder.add(Settings, 'enableTouchKeyboard').name('Touch Keyboard')

		let controllers = this.getControllers()

		for(let controller of controllers) {
			let name = controller.getName()
			let parentNames = controller.getParentNames()
			controller.onChange( (value: any) => this.settingChanged(parentNames, name, value, false) )
			controller.onFinishChange( (value: any) => this.settingChanged(parentNames, name, value, true) )
		}

		// Add settings which should not call this.settingsChanged (to save settings): touch move and fullscreen 
		virtualKeyboard.createGUI(settingsFolder)

		settingsFolder.add({ 'fullscreen': false }, 'fullscreen').onChange((value) => {
			if (value) {
				let elem: any = document.body;
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
				} else if (elem.webkitRequestFullscreen) { /* Safari */
					elem.webkitRequestFullscreen();
				} else if (elem.msRequestFullscreen) { /* IE11 */
					elem.msRequestFullscreen();
				}
			} else {
				let doc: any = document;
				if (doc.exitFullscreen) {
					doc.exitFullscreen();
				} else if (doc.webkitExitFullscreen) { /* Safari */
					doc.webkitExitFullscreen();
				} else if (doc.msExitFullscreen) { /* IE11 */
					doc.msExitFullscreen();
				}
			}
		}).name('Fullscreen')
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
		if(settingsManager.debug) {
			debugger
		}
		// update sliders and transmit change to concerned object
		if(parentNames[0] == 'Machine dimensions') {
			if(name == 'width') {
				this.tipibotPositionFolder.getController('x').max(value, false)
				this.drawAreaDimensionsFolder.getController('width').max(value, changeFinished)
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
			if(name == 'drawSpeed') {
				this.tipibot.drawSpeedChanged(changeFinished)
			} else if(name == 'maxSpeed') {
				let maxSpeedMm = value * mmPerSteps()
				this.motorsFolder.getController('maxSpeedMm').setValueNoCallback(maxSpeedMm)
				this.tipibot.maxSpeedChanged(changeFinished)
			} else if(name == 'maxSpeedMm') {
				let maxSpeedSteps = value / mmPerSteps()
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
			} else if(name == 'invertMotorLeft' || name == 'invertMotorRight' && changeFinished) {
				this.tipibot.sendInvertXY()
			} else if(name == 'progressiveMicrosteps' && changeFinished) {
				this.tipibot.sendProgressiveMicrosteps()
			}
			if(name == 'mmPerRev' || 'stepsPerRev' || 'microstepResolution') {
				let maxSpeedMm = Settings.tipibot.maxSpeed * mmPerSteps()
				let maxSpeedMmController = this.motorsFolder.getController('maxSpeedMm')
				maxSpeedMmController.max(MAX_SPEED * mmPerSteps())
				maxSpeedMmController.setValueNoCallback(maxSpeedMm)
			}
		} else if(parentNames[0] == 'Position') {
			if(name == 'x') {
				this.tipibot.setX(value, changeFinished)
			} else if(name == 'y') {
				this.tipibot.setY(value, changeFinished)
			}
		} else if(parentNames[0] == 'Angles' && parentNames[1] == 'Pen' && (name == 'up' || name == 'down' || name == 'close' || name == 'drop') ) {
			if(changeFinished) {
				this.tipibot.servoChanged(changeFinished, name, false)
			}
			for(let angleName of ['up', 'down', 'close', 'drop']) {
				if(name == angleName) {
					this.anglesFolder.getController(angleName).setValueNoCallback(value)
				}
			}
		} else if(parentNames[0] == 'Pen') {
			if(name == 'penWidth') {
				if(changeFinished) {
					this.tipibot.penWidthChanged(true)
				}
			// } else if(name == 'speed') {
			// 	this.tipibot.servoChanged(changeFinished, null, true)
			} else if(name == 'penOffset') {
				this.tipibot.setPosition(this.tipibot.getPosition(), changeFinished, false)
			}
		} else if(parentNames[0] == 'Extruder') {
			this.tipibot.moveGroundStation(value)
		} else if(parentNames[0] == 'Draw area dimensions') {
			if(name == 'y') {
				this.drawAreaDimensionsFolder.getController('height').max(Settings.tipibot.height - value, changeFinished)
			}
			this.tipibot.drawAreaChanged(changeFinished)
			this.updateHomePosition(this.homeFolder.getController('Position').getValue(), true)
		} else if(parentNames[0] == 'Feedback') {
			this.tipibot.feedbackChanged(changeFinished)
		} else if(name == 'enableTouchKeyboard') {
			if(!value) {
				this.virtualKeyboard.enableArrowsController.hide()
			} else {
				this.virtualKeyboard.enableArrowsController.show()
			}
		}
		document.dispatchEvent(createEvent('SettingChanged', { detail: { parentNames: parentNames, name: name, value: value, changeFinished: changeFinished } }))
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

		this.tipibot.drawSpeedChanged(true)
		this.tipibot.maxSpeedChanged(true)
		this.tipibot.mmPerRevChanged(true)
		this.tipibot.stepsPerRevChanged(true)
		this.tipibot.microstepResolutionChanged(true)
		this.tipibot.penWidthChanged(true)
		this.tipibot.servoChanged(true, null, true)
		this.tipibot.sizeChanged(true)
		this.tipibot.drawAreaChanged(true)
		// this.tipibot.setX(Settings.tipibot.homeX, false)
		// this.tipibot.setY(Settings.tipibot.homeY, true)
		this.tipibot.setHome(false)

		document.dispatchEvent(createEvent('SettingChanged', { detail: { all: true } }))

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

	onJsonLoad(event: any) {
		if(event.target != null && event.target.result != null) {
			copyObjectPropertiesFromJSON(Settings, event.target.result)
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
		copyObjectPropertiesFromJSON(Settings, localStorage.getItem('settings'))
	}

	loadJSONandOverwriteLocalStorage(settingsJsonString: string) {
		copyObjectPropertiesFromJSON(Settings, settingsJsonString)
		this.save(false)
	}

	loadObjectandOverwriteLocalStorage(settings: any) {
		copyObjectProperties(Settings, settings)
		this.save(false)
	}
}

export let settingsManager = new SettingsManager()