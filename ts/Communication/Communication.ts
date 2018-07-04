import { GUI, Controller } from "../GUI"
import { Settings } from "../Settings"
import { TipibotInterface } from "../TipibotInterface"
import { Interpreter } from "./Interpreter"
import { Polargraph } from "./Polargraph"
import { PenPlotter } from "./PenPlotter"
import { TipibotInterpreter } from "./TipibotInterpreter"
// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent

// export const SERIAL_COMMUNICATION_SPEED = 57600
export const SERIAL_COMMUNICATION_SPEED = 115200

let PORT = window.localStorage.getItem('port') || 6842

declare var io: any

class Socket {
	socket: WebSocket
	communication: Communication

	constructor(url: string, communication: Communication) {
		this.socket = new WebSocket(url)
		this.communication = communication;
		this.socket.addEventListener('message',  (event:any)=> {
			let json = JSON.parse(event.data);
			let type = json.type;
			let data = json.data;
			let interpreter = this.communication.interpreter;

			if(type == 'opened') {
				communication.onConnectionOpened()
			} else if(type == 'closed') {
				communication.onConnectionClosed()
			} else if(type == 'list') {

				let options = ['Disconnected']
				for(let port of data) {
					options.push(port.comName)
				}
				communication.initializePortController(options)

				if(Settings.autoConnect) {
					for(let port of data) {
						if(port.manufacturer != null && port.manufacturer.indexOf('Arduino') >= 0) {
							communication.portController.setValue(port.comName)
							break
						}
					}
				}

			} else if(type == 'data') {
				
				// If receiving messages while not connected: consider it as simulation
				if(communication.portController.getValue().indexOf('Disconnected') == 0) {
					data += '\n'
				}

				interpreter.messageReceived(data)
			} else if(type == 'error') {
				console.error(data)
			}

		});
	}

	on() {
		// this.socket.addEventListener.apply(this.socket, arguments)
	}

	emit() {
		let message = { type: arguments[0], data: arguments[1] }
		this.socket.send.apply(this.socket, [JSON.stringify(message)])
	}

}

export class Communication {

	socket: any
	gui: GUI
	portController: any
	interpreter: Interpreter
	autoConnectController: Controller
	autoConnectIntervalID = -1
	connectionOpened = false

	constructor(gui:GUI) {
		communication = this
		this.socket = null
		this.gui = gui
		this.portController = null
		this.interpreter = new TipibotInterpreter()
		// this.interpreter = new Polargraph()
		this.connectToSerial()

		if(Settings.autoConnect) {
			this.startAutoConnection()
		}
	}

	setTipibot(tipibot: TipibotInterface) {
		this.interpreter.setTipibot(tipibot)
	}

	startAutoConnection() {
		this.autoConnectIntervalID = setInterval(()=> this.tryConnection(), 1000)
	}

	stopAutoConnection() {
		clearInterval(this.autoConnectIntervalID)
		this.autoConnectIntervalID = null
	}

	onConnectionOpened() {
		this.connectionOpened = true
		this.stopAutoConnection()
		this.interpreter.connectionOpened()

		this.gui.setName('Communication - connected')
	}

	onConnectionClosed() {
		this.connectionOpened = false
		if(Settings.autoConnect) {
			this.startAutoConnection()
		}
		// this.interpreter.connectionClosed()	
		this.gui.setName('Communication - closed')
	}

	initializePortController(options: string[]) {

		this.portController = this.portController.options(options)
		
		$(this.portController.domElement.parentElement.parentElement).mousedown( (event)=> {
			this.autoConnectController.setValue(false)
		})

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	connectToSerial() {
		this.autoConnectController = this.gui.add(Settings, 'autoConnect').name('Auto connect').onFinishChange((value)=> {
			if(value) {
				this.startAutoConnection()
			} else {
				this.stopAutoConnection()
			}
		})

		this.portController = this.gui.add( {'Connection': 'Disconnected'}, 'Connection' )
		
		this.gui.addButton('Disconnect', ()=> this.disconnect() )

		this.gui.addButton('Refresh', ()=> {
			this.socket.emit('list')
		})

		this.initializePortController(['Disconnected'])

		// this.socket = io('ws://localhost:' + PORT)
		// this.socket = io('ws://localhost:' + PORT, {transports: ['websocket', 'polling', 'flashsocket']})
		
		this.socket = new Socket('ws://localhost:' + PORT, this)

		this.interpreter.setSocket(this.socket)
		
		this.socket.on('list', (ports: any) => {

			
		})

		this.socket.on('opened', () => {
			this.interpreter.connectionOpened()
		})

		this.socket.on('data', (data: any) => {
			this.interpreter.messageReceived(data)
		})

		this.socket.on('error', (message: any) => {
			console.error(message)
		})

		// window.sendToSerial = (message: string)=> {
		// 	this.socket.emit('data', message)
		// }
	}

	disconnect() {
		this.autoConnectController.setValue(false)
		this.onConnectionClosed()
		this.socket.emit('close')
		document.dispatchEvent(new CustomEvent('Disconnect'))
		this.portController.setValue('Disconnected')
	}

	serialConnectionPortChanged(portName: string) {
		if(portName == 'Disconnected' && this.connectionOpened) {
			this.disconnect()
		} else {
			this.interpreter.setSerialPort(portName);
			document.dispatchEvent(new CustomEvent('Connect', { detail: portName }))
			this.socket.emit('open', { name: portName, baudRate: SERIAL_COMMUNICATION_SPEED })
		}
	}

	tryConnection() {
		if(!Settings.autoConnect || this.connectionOpened) {
			return
		}
		this.socket.emit('list')
	}
}

export let communication: Communication = null