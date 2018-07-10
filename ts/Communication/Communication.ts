import { GUI, Controller } from "../GUI"
import { Settings, settingsManager } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"
import { Interpreter } from "./Interpreter"
import { Polargraph } from "./Polargraph"
import { PenPlotter } from "./PenPlotter"
import { TipibotInterpreter } from "./TipibotInterpreter"
// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent

// export const 57600 = 57600
export const SERIAL_COMMUNICATION_SPEED = 115200

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

	constructor(gui:GUI) {
		communication = this
		this.socket = null
		this.gui = gui
		this.portController = null
		this.initializeInterpreter(Settings.firmware)
		this.connectToSerial()

		if(Settings.autoConnect) {
			this.startAutoConnection()
		}
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

		this.gui.setName('Communication - connected')
	}

	onSerialPortConnectionClosed() {
		this.serialPortConnectionOpened = false
		if(Settings.autoConnect) {
			this.startAutoConnection()
		}
		// this.interpreter.connectionClosed()	
		this.gui.setName('Communication - disconnectSerialPorted')
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
		}
		this.interpreter.setTipibot(tipibot)
		console.log('initialize '+interpreterName)
	}

	onMessage(event: any) {
		let json = JSON.parse(event.data);
		let type = json.type;
		let data = json.data;

		if(type == 'opened') {
			this.onSerialPortConnectionOpened()
		} else if(type == 'closed') {
			this.onSerialPortConnectionClosed()
		} else if(type == 'list') {

			let options = ['Disconnected']
			for(let port of data) {
				options.push(port.comName)
			}
			this.initializePortController(options)

			if(Settings.autoConnect) {
				for(let port of data) {
					if(port.manufacturer != null && port.manufacturer.indexOf('Arduino') >= 0) {
						this.portController.setValue(port.comName)
						break
					}
				}
			}
		} else if(type == 'connected') {
			this.setPortName(data)
		} else if(type == 'not-connected') {

		} else if(type == 'data') {
			this.interpreter.messageReceived(data)
		} else if(type == 'warning') {
		} else if(type == 'already-opened') {
			this.onSerialPortConnectionOpened(data)
		} else if(type == 'error') {
			console.error(data)
		}
	}

	connectToSerial() {
		let firmwareController = this.gui.add( Settings, 'firmware', ['Tipibot', 'Polargraph', 'PenPlotter'] ).name('Firmware')
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
		this.socket.addEventListener('open',  (event:any)=> this.send('is-connected'))
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
	}
}

export let communication: Communication = null