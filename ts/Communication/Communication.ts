import { GUI, Controller } from "../GUI"
import { Settings, settingsManager } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"
import { Interpreter, SERIAL_COMMUNICATION_SPEED as ISERIAL_COMMUNICATION_SPEED } from "./Interpreter"
import { Polargraph } from "./Polargraph"
import { PenPlotter } from "./PenPlotter"
import { TipibotInterpreter } from "./TipibotInterpreter"
import { FredBot } from "./FredBot"
import { Makelangelo } from "./Makelangelo"

// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent

// export const 57600 = 57600

export const SERIAL_COMMUNICATION_SPEED = ISERIAL_COMMUNICATION_SPEED

let PORT = window.localStorage.getItem('port') || 6842

declare var io: any

export class Communication {

	socket: any
	gui: GUI
	portController: any
	interpreter: Interpreter
	autoConnectController: Controller
	autoConnectIntervalID = -1
	serialPortConnectionOpened = false
	folderTitle: any

	constructor(gui:GUI) {
		communication = this
		this.socket = null
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

	setTipibot(tipibot: TipibotInterface) {
		this.interpreter.setTipibot(tipibot)
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
		if(port != null) {
			this.setPortName(port)
		}
		this.serialPortConnectionOpened = true
		this.stopAutoConnection()
		this.interpreter.serialPortConnectionOpened()

		this.folderTitle.find('.serial').addClass('connected')
	}

	onSerialPortConnectionClosed() {
		this.serialPortConnectionOpened = false
		if(Settings.autoConnect) {
			this.startAutoConnection()
		}
		// this.interpreter.connectionClosed()
		this.folderTitle.find('.serial').removeClass('connected')
	}

	initializePortController(options: string[]) {

		this.portController = this.portController.options(options)
		
		$(this.portController.domElement.parentElement.parentElement).mousedown( (event)=> {
			this.autoConnectController.setValue(false)
		})

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	initializeInterpreter(interpreterName: string) {
		let tipibot = this.interpreter ? this.interpreter.tipibot : null
		if(this.serialPortConnectionOpened) {
			this.disconnectSerialPort()
		}
		if(interpreterName == 'Tipibot') {
			this.interpreter = new TipibotInterpreter(this)
		} else if(interpreterName == 'Polargraph') {
			this.interpreter = new Polargraph(this)
		} else if(interpreterName == 'PenPlotter') {
			this.interpreter = new PenPlotter(this)
		} else if(interpreterName == 'FredBot') {
			this.interpreter = new FredBot(this)
		} else if(interpreterName == 'Makelangelo') {
			this.interpreter = new Makelangelo(this)
		}
		this.interpreter.setTipibot(tipibot)
		console.log('initialize '+interpreterName)
	}

	onMessage(event: any) {
		let json = JSON.parse(event.data);
		let type = json.type;
		let data = json.data;

		document.dispatchEvent(new CustomEvent('ServerMessage', { detail: json }))

		if(type == 'opened') {
			this.onSerialPortConnectionOpened()
		} else if(type == 'closed') {
			this.onSerialPortConnectionClosed()
		} else if(type == 'list') {

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
		} else if(type == 'data') {
			this.interpreter.messageReceived(data)
		} else if(type == 'info') {
			console.info(data)
		} else if(type == 'warning') {
			console.warn(data)
		} else if(type == 'already-opened') {
			this.onSerialPortConnectionOpened(data)
		} else if(type == 'error') {
			console.error(data)
		}
	}

	connectToSerial() {
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

		this.socket = new WebSocket('ws://localhost:' + PORT)

		this.socket.addEventListener('message',  (event:any)=> this.onMessage(event))
		this.socket.addEventListener('open',  (event:any)=> this.onWebSocketOpen(event))
		this.socket.addEventListener('close',  (event:any)=> this.onWebSocketClose(event))
		this.socket.addEventListener('error',  (event:any)=> this.onWebSocketError(event))
	}

	onWebSocketOpen(event: any) {
		this.folderTitle.find('.websocket').addClass('connected')
		this.send('is-connected')
	}

	onWebSocketClose(event: any) {
		this.folderTitle.find('.websocket').removeClass('connected')
		console.error('WebSocket disconnected')
	}

	onWebSocketError(event: any) {
		console.error('WebSocket error')
		// console.error(event)
	}

	disconnectSerialPort() {
		this.interpreter.clearQueue()
		this.interpreter.sendStop(true)
		this.autoConnectController.setValue(false)
		this.onSerialPortConnectionClosed()
		this.send('close')
		document.dispatchEvent(new CustomEvent('Disconnect'))
		this.portController.setValue('Disconnected')
	}

	serialConnectionPortChanged(portName: string) {
		if(portName == 'Disconnected' && this.serialPortConnectionOpened) {
			this.disconnectSerialPort()
		} else if(portName != 'Disconnected') {
			this.interpreter.setSerialPort(portName);
			document.dispatchEvent(new CustomEvent('Connect', { detail: portName }))
			console.log('open: ' + portName + ', at: ' + this.interpreter.serialCommunicationSpeed)
			this.send('open', { name: portName, baudRate: this.interpreter.serialCommunicationSpeed })
		}
	}

	tryConnectSerialPort() {
		if(!Settings.autoConnect || this.serialPortConnectionOpened) {
			return
		}
		this.send('list')
	}

	send(type: string, data: any = null) {
		let message = { type: type, data: data }
		this.socket.send(JSON.stringify(message))
		// console.log('Send ', type, data)
		// console.log('Wait for "ready"...')
	}
}

export let communication: Communication = null