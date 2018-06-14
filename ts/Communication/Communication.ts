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
	portController: any
	interpreter: Interpreter

	constructor(gui:GUI) {
		communication = this
		this.socket = null
		this.gui = gui
		this.portController = null
		this.interpreter = new Polargraph()
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

		this.socket = io('ws://localhost:3030')

		this.interpreter.setSocket(this.socket)
		
		this.socket.on('list', (ports: any) => {

			let options = ['Disconnected']
			for(let port of ports) {
				options.push(port.comName)
			}
			
			this.portController = this.portController.options(options)
			this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
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