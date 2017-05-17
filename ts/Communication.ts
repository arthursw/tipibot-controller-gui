// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent

// TODO: check if we can get rid of commandSent: this is bad since we could send two different commands before recieving the first answer :(

declare var io: any

export class Communication {
	static communication: Communication = null

	commandSent: string
	serialPort: string
	socket: any
	gui: any

	constructor(gui:any) {
		Communication.communication = this
		this.commandSent = ''
		this.serialPort = ''
		this.socket = null
		this.gui = gui
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

	initializeSerailConnectionPorts(event: any) {

		let portNames = ['Disconnected', 'Refresh']
		for(let listItem of event.data) {
			if(listItem.hasOwnProperty('Network') && !listItem.Network && listItem.hasOwnProperty('Ports')) {
				for(let portName of listItem.Ports) {
					portNames.push(portName)
				}
			}
		}

		let controller = this.gui.add( {'port': 'Disconnected'}, 'port', portNames )
		
		controller.onChange((value: string) => {
			if(value == 'Disconnected') {
				this.commandSent = 'close'
				this.socket.send('close ' + this.serialPort)
			}
			if(value != 'Refresh') {
				this.commandSent = 'list'
				this.socket.send(this.commandSent)
			} else {
				this.commandSent = 'open'
				this.serialPort = value
				this.socket.send('open ' + value + ' 115200')
			}
		})
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
			this.commandSent = 'list'

			// this.socket.emit('command', 'log on')	
			this.socket.emit('command', 'list')	
		})

		// window.ws = this.socket

		this.socket.on('message', function (event: any) {
			console.log(event)

			if(this.commandSent == 'list') {
				this.initializeSerailConnectionPorts(event)
			} else if(this.commandSent == 'open') {
				this.checkSerialConnection(event)
			} else if(this.commandSent == 'close') {
				this.checkSerialConnection(event)
			} else if(this.commandSent == 'sent') {
				console.log('send response')
			}
		})

		return

	}

	send(data: string) {
		if(this.socket == null) {
			return
		}
		this.commandSent = 'sent'
		this.socket.emit('command', 'send ' + this.serialPort + ' ' + data)
	}

    sendSetPosition(point: paper.Point) {
		this.send('G92 X' + point.x + ' Y' + point.y + '\n')
    }

	sendMoveDirect(point: paper.Point) {
		this.send('G0 X' + point.x + ' Y' + point.y + '\n')
	}

	sendMoveLinear(point: paper.Point) {
		this.send('G1 X' + point.x + ' Y' + point.y + '\n')
	}

	sendSpeed(speed: number) {
		this.send('G0 F' + speed + '\n')
	}

	sendMachineSpecs(machineWidth: number, stepsPerRev: number, mmPerRev: number) {
		this.send('M4 X' + machineWidth + ' S' + stepsPerRev + ' P' + mmPerRev + '\n')
	}

	sendPause(delay: number) {
		this.send('G4 P' + delay + '\n')
	}

	sendMotorOff() {
		this.send('M84\n')
	}

	sendPenLift(servoTempo: number, servoValue: number) {
		this.send('G4 P' + servoTempo + '\n')
		this.send('M340 P3 S' + servoValue + '\n')
		this.send('G4 P0\n')
	}

	sendPenUp(servoUpTempo: number, servoUpValue: number) {
		this.sendPenLift(servoUpTempo, servoUpValue)
	}

	sendPenDown(servoDownTempo: number, servoDownValue: number) {
		this.sendPenLift(servoDownTempo, servoDownValue)
	}
}