import { GUI, Controller } from "../GUI"
import { Settings } from "../Settings"
import { TipibotInterface} from "../TipibotInterface"
import { Interpreter } from "./Interpreter"
import { Polargraph } from "./Polargraph"

// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent

export const SERIAL_COMMUNICATION_SPEED = 57600

declare var io: any

export class Communication {

	socket: any
	gui: GUI
	portController: Controller
	serialPorts: Array<string>
	interpreter: Interpreter

	constructor(gui:GUI) {
		communication = this
		this.socket = null
		this.gui = gui
		this.portController = null
		this.serialPorts = []
		this.connectToArduinoCreateAgent()
		this.interpreter = new Polargraph()
		// this.createGUI()
	}

	// createGUI() {
	// 	this.gui.addButton('Connect to arduino agent', ()=> this.connectToArduinoCreateAgent())
	// }

	setTipibot(tipibot: TipibotInterface) {
		this.interpreter.setTipibot(tipibot)
	}

	connectToArduinoCreateAgent() {

		// Find proper websocket port with http requests info
		// It will listen to http and websocket connections on a range of ports from 8990 to 9000.

		let portNumber = 8991

		let connectionSuccess = (data: any, textStatus: string, jqXHR: any) => {
			console.log( "connection to arduino-create-agent success" )
			console.log("textStatus: ")
			console.log(textStatus)
			console.log(data)
			if(data.hasOwnProperty('ws')) {
				this.openWebsocketConnection(data.ws)
			}
		}

		let connectionError = (jqXHR: any, textStatus: string, errorThrown: any) => {
			console.log( "connection to arduino-create-agent error" )
			console.log("errorThrown: ")
			console.log(errorThrown)
			console.log("textStatus: ")
			console.log(textStatus)
			if(portNumber == 9000) {
				portNumber = 8990
			}
			else if(portNumber == 8990) {
				console.log( "Error: impossible to connect to arduino-create-agent" )
				return
			} else {
				portNumber++
			}
			connectArduinoCreateAgent()
		}

		let connectArduinoCreateAgent = () => {
			return $.ajax( { url: "http://localhost:" + portNumber + "/info" } ).done(connectionSuccess).fail(connectionError)
		}

		connectArduinoCreateAgent()

		// this.openWebsocketConnection("ws://localhost:8991")
	}

	serialConnectionPortChanged(value: string) {
		if(value == 'Disconnected') {
			this.socket.emit('command', 'close ' + this.interpreter.serialPort)
			
			document.dispatchEvent(new CustomEvent('Disconnect'))
		}
		else if(value == 'Refresh') {
			this.serialPorts = []
			this.socket.emit('command', 'list')
		} else {
			this.interpreter.setSerialPort(value);
			document.dispatchEvent(new CustomEvent('Connect', { detail: value }))
			this.socket.emit('command', 'open ' + value + ' ' + SERIAL_COMMUNICATION_SPEED)
		}
	}

	initializeSerialConnectionPorts(data: any) {
		// this.gui.getController('Connect to arduino agent').hide()
		for(let port of data.Ports) {
			if(this.serialPorts.indexOf(port.Name) < 0) {
				this.serialPorts.push(port.Name)
			}
		}

		let portNames = ['Disconnected', 'Refresh'].concat(this.serialPorts)

		if(this.portController == null) {
			this.portController = this.gui.add( {'Connection': 'Disconnected'}, 'Connection' )
		} else {
			this.portController = this.portController.options(portNames)
		}

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	checkSerialConnection(event: any) {
		if(event.data.hasOwnProperty('Cmd')) {
			console.log(event.data.Cmd)
		} else {
			console.log('Unknown response: ', event)
		}
	}

	onWebSocketConnect(response: any) {
		console.log('connect response: ', response)
		this.socket.emit('command', 'list')	
	}

	onWebSocketMessage(message: string) {
		let data = null
		try {
			data = JSON.parse(message)
		} catch (e) {
			return
	    }
		// List serial ports response (list):
		if(data.hasOwnProperty('Ports') && data.hasOwnProperty('Network')) {
			this.initializeSerialConnectionPorts(data)
			return
		}

		// Command responses:
		if(data.hasOwnProperty('Cmd')) {
			switch (data.Cmd) {
				case 'Open':
					console.log('Port: ' + data.Port)
					console.log(data.Desc)
					this.interpreter.connectionOpened(data.Desc)
					break;
				case 'OpenFail':
					console.log('Port: ' + data.Port)
					console.log(data.Desc)
					break;
				case 'Close':
					console.log('Port: ' + data.Port)
					console.log(data.Desc)
					break;
				case 'Queued':
					console.log('Queued:')
					console.log('QCnt: ' + data.QCnt)
					console.log('Ids: ', data.Ids)
					console.log('D: ', data.D)
					console.log('Port: ' + data.Port)
					break;
				case 'Write':
					console.log('Write:')
					console.log('QCnt: ' + data.QCnt)
					console.log('Ids: ', data.Ids)
					console.log('P: ' + data.P)
					break;
				case 'CompleteFake':
					console.log('CompleteFake:')
					console.log('QCnt: ' + data.QCnt)
					console.log('Ids: ', data.Ids)
					console.log('P: ' + data.P)
					break;
				default:
					console.error('Received unknown command: ' + data.Cmd)
					break;
			}
		} else if(data.hasOwnProperty('Error')) {
			console.error(data.Error)
		} else if(data.hasOwnProperty('D')) { 				// Output from the serial port
			this.interpreter.messageReceived(data.D)
		}
	}

	openWebsocketConnection(websocketPort: string) {
		
		// this.socket = io('ws://localhost:3000')
		this.socket = io(websocketPort)
		this.interpreter.setSocket(this.socket)
		
		this.socket.on('connect', (response: any) => this.onWebSocketConnect(response))

		// window.ws = this.socket

		this.socket.on('message', (message: any) => this.onWebSocketMessage(message))

		return

	}


}

export let communication: Communication = null