import $ = require("jquery");
import { GUI, Controller } from "../GUI"
import { Communication } from "./CommunicationStatic"
import { Settings } from "../Settings"
import { settingsManager } from "../SettingsManager"

export class CommunicationInteractive extends Communication {

	gui: GUI
	portController: any
	autoConnectController: Controller
	autoConnectIntervalID: NodeJS.Timeout = null
	folderTitle: any
	serialCommunicationSpeedController: Controller = null

	constructor(gui:GUI) {
		super(false)
		Communication.communication = this
		this.createGUI(gui)
		this.portController = null
		this.initializeInterpreter(Settings.firmware)
		this.connectToWebsocket()
	}

	createGUI(gui: GUI) {
		this.gui = gui.addFolder('Communication')
		this.folderTitle = $(this.gui.getDomElement()).find('.title')
		this.folderTitle.append($('<icon>').addClass('serial').append(String.fromCharCode(9679)))
		this.folderTitle.append($('<icon>').addClass('websocket').append(String.fromCharCode(9679)))
	}

	startAutoConnection() {
		this.autoConnectIntervalID = setInterval(()=> this.tryConnectSerialPort(), 1000)
	}

	stopAutoConnection() {
		clearInterval(this.autoConnectIntervalID)
		this.autoConnectIntervalID = null
	}

	setPortName(port:string) {
		this.portController.object[this.portController.property] = port
		this.portController.updateDisplay()
	}

	onSerialPortConnectionOpened(port:string) {
		super.onSerialPortConnectionOpened(port)
		if(port != null) {
			this.setPortName(port)
		}
		this.stopAutoConnection()
		this.interpreter.serialPortConnectionOpened()

		this.folderTitle.find('.serial').addClass('connected')
	}

	onSerialPortConnectionClosed(port: string) {
		super.onSerialPortConnectionClosed(port)
		if(Settings.autoConnect) {
			this.startAutoConnection()
		}
		this.folderTitle.find('.serial').removeClass('connected')
	}

	initializePortController(options: string[]) {

		this.portController = this.portController.options(options)
		
		$(this.portController.domElement.parentElement.parentElement).mousedown( (event)=> {
			this.autoConnectController.setValue(false)
		})

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	onMessage(messageObject: any) {
		super.onMessage(messageObject)
		let type = messageObject.type
		let data = messageObject.data
		let port = messageObject.port

		if(type == 'list') {
			let options = ['Disconnected']
			for(let port of data) {
				options.push(port.path)
			}
			this.initializePortController(options)

			if(Settings.autoConnect) {
				for(let port of data) {
					if(port.manufacturer != null && port.manufacturer.indexOf('Arduino') >= 0) {
						this.portController.setValue(port.path)
						break
					}
				}
			}
		} else if(type == 'connected') {
			this.setPortName(port)
		} else if(type == 'not-connected') {
			this.folderTitle.find('.serial').removeClass('connected').removeClass('simulator')
			if(Settings.autoConnect) {
				this.startAutoConnection()
			}
		} else if(type == 'connected-to-simulator') {
			this.folderTitle.find('.serial').removeClass('connected').addClass('simulator')
		} else if(type == 'load-settings') {
			settingsManager.loadObjectandOverwriteLocalStorage(data)
		}
		return
	}

	connectToWebsocket() {
		let serverController = this.gui.add(Settings, 'websocketServerURL')
		serverController.onFinishChange((value)=> {
			settingsManager.save(false)
		})
		let firmwareController = this.gui.add( Settings, 'firmware', ['Tipibot', 'Polargraph', 'PenPlotter', 'Makelangelo', 'FredBot'] ).name('Firmware')
		firmwareController.onFinishChange((value)=> {
			this.serialCommunicationSpeedController.setValueNoCallback(`${this.interpreter.serialCommunicationSpeed}`)
			settingsManager.save(false)
			this.initializeInterpreter(value)
		})
		this.serialCommunicationSpeedController = this.gui.add(this, 'serialCommunicationSpeed', ['57600', '115200', '250000']).name('Baud-rate')
		this.serialCommunicationSpeedController.onFinishChange((value)=> {
			// Reconnect with new speed
			
			this.serialCommunicationSpeed = parseInt(value)
			let portPath = this.portController.object[this.portController.property]
			if(portPath != 'Disconnected') {
				this.disconnectSerialPort()
				this.portController.setValue(portPath)
			}
		})
		// When new firmware selected: set default com speed

		this.autoConnectController = this.gui.add(Settings, 'autoConnect').name('Auto connect').onFinishChange((value)=> {
			settingsManager.save(false)
			if(value) {
				this.startAutoConnection()
			} else {
				this.stopAutoConnection()
			}
		})

		this.portController = this.gui.add( {'Connection': 'Disconnected'}, 'Connection' )
		
		this.gui.addButton('Disconnect', ()=> this.disconnectSerialPort() )

		this.gui.addButton('Refresh', ()=> {
			this.send('list')
		})

		this.initializePortController(['Disconnected'])

		super.connectToWebsocket()
	}

	onWebSocketOpen(event: any) {
		this.folderTitle.find('.websocket').addClass('connected')
		super.onWebSocketOpen(event)
	}

	onWebSocketClose(event: any) {
		this.folderTitle.find('.websocket').removeClass('connected')
		super.onWebSocketClose(event)
	}

	disconnectSerialPort() {
		super.disconnectSerialPort()
		this.autoConnectController.setValue(false)
		this.portController.setValue('Disconnected')
	}

}