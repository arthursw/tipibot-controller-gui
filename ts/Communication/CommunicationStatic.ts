import { copyObjectProperties, createEvent, document, Settings } from "../Settings"
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

// let PORT = window.localStorage.getItem('port') || 6842

declare var io: any

export class Communication {

	socket: any
	interpreter: Interpreter
	serialPortConnectionOpened = false
	autoConnectController:any = null
	serialCommunicationSpeed: number = null
	static communication: Communication
	static interpreter: Interpreter

	constructor(intialize=true) {
		Communication.communication = this
		this.socket = null
		if(intialize) {
			this.initializeInterpreter(Settings.firmware)
			this.connectToWebsocket()
		}
		document.addEventListener('SettingChanged', (event: CustomEvent)=> this.onSettingChanged(event), false)
	}

	onSettingChanged(event: CustomEvent) {
		this.send('save-settings', Settings)
	}

	setTipibot(tipibot: TipibotInterface) {
		this.interpreter.setTipibot(tipibot)
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
		Communication.interpreter = this.interpreter
		this.interpreter.setTipibot(tipibot)
		this.serialCommunicationSpeed = this.interpreter.serialCommunicationSpeed
		console.log('initialize '+interpreterName)
	}

	onSerialPortConnectionOpened(port: {path: string, isOpened: boolean, baudRate: number} = null) {
		this.serialPortConnectionOpened = true
	}

	onSerialPortConnectionClosed() {
		this.serialPortConnectionOpened = false
	}

	onMessage(messageObject: any) {

		let type = messageObject.type
		let data = messageObject.data

		if(type == 'opened') {
			this.onSerialPortConnectionOpened()
		} else if(type == 'closed') {
			this.onSerialPortConnectionClosed()
		} else if(type == 'list') {

		} else if(type == 'connected') {

		} else if(type == 'not-connected') {
			
		} else if(type == 'connected-to-simulator') {

		} else if(type == 'data') {
			this.interpreter.messageReceived(messageObject)
		} else if(type == 'sent') {
			this.interpreter.messageSent(messageObject)
		} else if(type == 'info') {
			console.info(data)
		} else if(type == 'warning') {
			console.warn(data)
		} else if(type == 'already-opened') {
			this.onSerialPortConnectionOpened(data)
		} else if(type == 'error') {
			console.error(data)
		} else if(type == 'load-settings') {
			copyObjectProperties(Settings, data)
		}
	}

	onJSONMessage(event: any) {
		let messageObject = JSON.parse(event.data)
		document.dispatchEvent(createEvent('ServerMessage', { detail: messageObject }))
		this.onMessage(messageObject)
		return messageObject
	}

	connectToWebsocket() {
		this.socket = new WebSocket(`ws://${Settings.websocketServerURL}`)

		this.socket.addEventListener('message',  (event:any)=> this.onJSONMessage(event))
		this.socket.addEventListener('open',  (event:any)=> this.onWebSocketOpen(event))
		this.socket.addEventListener('close',  (event:any)=> this.onWebSocketClose(event))
		this.socket.addEventListener('error',  (event:any)=> this.onWebSocketError(event))
	}

	onWebSocketOpen(event: any) {
		this.send('is-connected')
	}

	onWebSocketClose(event: any) {
		console.error('WebSocket disconnected')
	}

	onWebSocketError(event: any) {
		console.error('WebSocket error')
		// console.error(event)
	}

	disconnectSerialPort() {
		this.interpreter.clearQueue()
		this.interpreter.sendStop(true)
		this.onSerialPortConnectionClosed()
		this.send('close')
		document.dispatchEvent(createEvent('Disconnect'))
	}

	serialConnectionPortChanged(portName: string) {
		if(portName == 'Disconnected' && this.serialPortConnectionOpened) {
			this.disconnectSerialPort()
		} else if(portName != 'Disconnected') {
			this.interpreter.setSerialPort(portName);
			document.dispatchEvent(createEvent('Connect', { detail: portName }))
			console.log('open: ' + portName + ', at: ' + this.interpreter.serialCommunicationSpeed)
			this.send('open', { name: portName, baudRate: this.serialCommunicationSpeed })
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