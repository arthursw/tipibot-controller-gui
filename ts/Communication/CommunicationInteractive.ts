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

	constructor(gui:GUI) {
		super(false)
		Communication.communication = this
		this.createGUI(gui)
		this.portController = null
		this.initializeInterpreter(Settings.firmware)
		this.connectToSerial()
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

	setPortName(port: {path: string, isOpened: boolean, baudRate: number}) {
		this.portController.object[this.portController.property] = port.path
		this.portController.updateDisplay()
	}

	onSerialPortConnectionOpened(port: {path: string, isOpened: boolean, baudRate: number} = null) {
		super.onSerialPortConnectionOpened(port)
		if(port != null) {
			this.setPortName(port)
		}
		this.stopAutoConnection()
		this.interpreter.serialPortConnectionOpened()

		this.folderTitle.find('.serial').addClass('connected')
	}

	onSerialPortConnectionClosed() {
		super.onSerialPortConnectionClosed()
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
			this.setPortName(data)
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

	connectToSerial() {
		let serverController = this.gui.add(Settings, 'websocketServerURL')
		serverController.onFinishChange((value)=> {
			settingsManager.save(false)
		})
		let firmwareController = this.gui.add( Settings, 'firmware', ['Tipibot', 'Polargraph', 'PenPlotter', 'Makelangelo', 'FredBot'] ).name('Firmware')
		firmwareController.onFinishChange((value)=> {
			settingsManager.save(false)
			this.initializeInterpreter(value)
		})

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

		super.connectToSerial()
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