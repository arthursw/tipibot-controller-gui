import { Settings } from "./Settings"

// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent

declare var io: any

declare type Command = {
	data: string
	callback: ()=> any
}

export class Communication {

	serialPort: string
	socket: any
	gui: any
	portController: any
	serialPorts: Array<string>
	commandQueue: Array<Command>

	constructor(gui:any) {
		communication = this
		this.serialPort = ''
		this.socket = null
		this.gui = gui
		this.portController = null
		this.serialPorts = []
		this.commandQueue = []
		this.connectToArduinoCreateAgent()
	}

	connectToArduinoCreateAgent() {

		// Find proper websocket port with http requests info
		// It will listen to http and websocket connections on a range of ports from 8990 to 9000.

		let portNumber = 8990

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
			portNumber++
			if(portNumber > 9000) {
				console.log( "Error: impossible to connect to arduino-create-agent" )
				return
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
			this.socket.emit('command', 'close ' + this.serialPort)
		}
		else if(value == 'Refresh') {
			this.serialPorts = []
			this.socket.emit('command', 'list')
		} else {
			this.serialPort = value
			this.socket.emit('command', 'open ' + value + ' 115200')
		}
	}

	initializeSerialConnectionPorts(data: any) {
		for(let port of data.Ports) {
			if(this.serialPorts.indexOf(port.Name) < 0) {
				this.serialPorts.push(port.Name)
			}
		}
		let portNames = ['Disconnected', 'Refresh'].concat(this.serialPorts)

		if(this.portController == null) {
			this.portController = this.gui.add( {'port': 'Disconnected'}, 'port' )
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

	openWebsocketConnection(websocketPort: string) {

		this.socket = io(websocketPort)
		
		this.socket.on('connect', (response: any) => {
			console.log('connect response: ', response)

			// this.socket.emit('command', 'log on')	
			this.socket.emit('command', 'list')	
		})

		// window.ws = this.socket

		this.socket.on('message', (message: any) => {
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
						this.messageReceived()
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
				console.log('Serial output: ', data.D)
			}
		})

		return

	}

	send(data: string) {
		this.socket.emit('command', 'send ' + this.serialPort + ' ' + data)
	}

	messageReceived() {
		if(this.commandQueue.length > 0) {
			let command = this.commandQueue.shift()
			command.callback()
			this.send(this.commandQueue[0].data)
		}
	}

	queue(data: string, callback: () => any = null) {
		if(this.socket == null) {
			return
		}

		this.commandQueue.push({ data: data, callback: callback })

		if(this.commandQueue.length == 1) {
			this.send(data)
		}
	}

	clearQueue() {
		this.commandQueue = []
	}

    sendSetPosition(point: paper.Point) {
		this.queue('G92 X' + point.x + ' Y' + point.y + '\n')
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		this.queue('G0 X' + point.x + ' Y' + point.y + '\n', callback)
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		this.queue('G1 X' + point.x + ' Y' + point.y + '\n', callback)
	}

	sendSpeed(speed: number) {
		this.queue('G0 F' + speed + '\n')
	}

	sendTipibotSpecs(tipibotWidth: number, stepsPerRev: number, mmPerRev: number) {
		this.queue('M4 X' + tipibotWidth + ' S' + stepsPerRev + ' P' + mmPerRev + '\n')
	}

	sendPause(delay: number) {
		this.queue('G4 P' + delay + '\n')
	}

	sendMotorOff() {
		this.queue('M84\n')
	}

	sendPenState(servoValue: number, servoTempo: number = 0) {
		this.queue('G4 P' + servoTempo + '\n')
		this.queue('M340 P3 S' + servoValue + '\n')
		this.queue('G4 P0\n')
	}

	sendPenUp(servoUpValue: number = Settings.servo.position.up, servoUpTempo: number = Settings.servo.delay.up) {
		this.sendPenState(servoUpValue, servoUpTempo)
	}

	sendPenDown(servoDownValue: number = Settings.servo.position.down, servoDownTempo: number = Settings.servo.delay.down) {
		this.sendPenState(servoDownValue, servoDownTempo)
	}
}

export let communication: Communication = null