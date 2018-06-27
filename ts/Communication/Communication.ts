import { GUI, Controller } from "../GUI"
import { Settings } from "../Settings"
import { TipibotInterface} from "../TipibotInterface"
import { Interpreter } from "./Interpreter"
import { Polargraph } from "./Polargraph"
import { PenPlotter } from "./PenPlotter"

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
			if(data && data.indexOf(' - ') == 0) {
				let m = data.replace(' - l: ', '')
				let messages = m.split(', r: ')
				let x = parseInt(messages[0])
				let y = parseInt(messages[1].split(' - x: ')[0])
				let lengths = new paper.Point(x, y)
				let lengthsMm = interpreter.tipibot.stepsToMm(lengths)
				let point = interpreter.tipibot.lengthsToCartesian(lengthsMm)
				let pen: any = interpreter.tipibot.pen
				pen.setPosition(point, false, false)
				return;
			}
			if(type == 'opened') {
				interpreter.connectionOpened()
			} else if(type == 'list') {
				let options = ['Disconnected']
				for(let port of data) {
					options.push(port.comName)
				}
				
				communication.portController = communication.portController.options(options)
				communication.portController.onFinishChange( (value: any) => communication.serialConnectionPortChanged(value) )

			} else if(type == 'data') {
				interpreter.messageReceived(data + '\n')
				// interpreter.messageReceived(data)
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

	constructor(gui:GUI) {
		communication = this
		this.socket = null
		this.gui = gui
		this.portController = null
		this.interpreter = new PenPlotter()
		// this.interpreter = new Polargraph()
		this.connectToSerial()
	}

	setTipibot(tipibot: TipibotInterface) {
		this.interpreter.setTipibot(tipibot)
	}

	connectToSerial() {
		
		this.portController = this.gui.add( {'Connection': 'Disconnected'}, 'Connection' )
		this.gui.addButton('Refresh', ()=> {
			this.portController.setValue('Disconnected')
			this.socket.emit('list')
		})
		this.portController = this.portController.options(['Disconnected'])

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )

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

	serialConnectionPortChanged(portName: string) {
		if(portName == 'Disconnected') {
			this.socket.emit('close')
			document.dispatchEvent(new CustomEvent('Disconnect'))
		} else {
			this.interpreter.setSerialPort(portName);
			document.dispatchEvent(new CustomEvent('Connect', { detail: portName }))
			this.socket.emit('open', { name: portName, baudRate: SERIAL_COMMUNICATION_SPEED })
		}
	}
}

export let communication: Communication = null