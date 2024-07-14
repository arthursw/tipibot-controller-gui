import $ = require("jquery");
import { Settings, paper } from "../Settings"
import { GUI, Controller } from "../GUI"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"
import { Communication } from "../Communication/CommunicationStatic"

class Move {
	
	telescreen: Telescreen
	timeoutID: NodeJS.Timeout = null
	
	constructor(telescreen: Telescreen) {
		this.telescreen = telescreen
	}

	// moveTipibot(moveType: string) {
	// 	this.timeoutID = null
	// 	if(moveType == 'linear') {
	// 		Tipibot.tipibot.moveLinear(this.telescreen.position)
	// 	} else if(moveType == 'direct') {
	// 		Tipibot.tipibot.moveDirect(this.telescreen.position)
	// 	}
	// }

	// moveTipibotDeferred(moveType: string) {
	// 	this.clearTimeout()
	// 	this.timeoutID = setTimeout(()=> this.moveTipibot(moveType), 0)
	// }

	// clearTimeout() {
	// 	if(this.timeoutID != null) {
	// 		clearTimeout(this.timeoutID)
	// 		this.timeoutID = null
	// 	}
	// }

	button1cw(): void {}
	button1ccw(): void {}
	button2cw(): void {}
	button2ccw(): void {}
	update(): void {}
}

class OrthographicMove extends Move {
	
	button1cw() {
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.telescreen.speed, 0)))
	}

	button1ccw() {
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(-this.telescreen.speed, 0)))
	}

	button2cw() {
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.telescreen.speed)))
	}

	button2ccw() {
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, -this.telescreen.speed)))
	}
}

class PolarMove extends Move {
	
	button1cw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.x += this.telescreen.speed
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}

	button1ccw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.x -= this.telescreen.speed
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}

	button2cw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.y += this.telescreen.speed
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}

	button2ccw() {
		let lengths = Tipibot.tipibot.cartesianToLengths(Tipibot.tipibot.getPosition())
		lengths.y -= this.telescreen.speed
		Tipibot.tipibot.moveLinear(Tipibot.tipibot.lengthsToCartesian(lengths))
	}
}

class DirectionMove extends Move {

	acceleration = 0.3
	speed = 0
	direction = new paper.Point(1, 0)

	button1cw() {
		this.direction.angle += 360/30
	}

	button1ccw() {
		this.direction.angle -= 360/30
	}

	button2cw() {
		// Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(this.direction.multiply(this.telescreen.speed)))
		this.speed = Math.min(5, this.speed + this.acceleration)
	}

	button2ccw() {
		// Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().subtract(this.direction.multiply(this.telescreen.speed)))
		this.speed = Math.max(0, this.speed - this.acceleration)
	}

	update(): void {
		if(this.speed > 0 && Communication.interpreter.commandQueue.length < 2) {
			Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(this.direction.multiply(this.speed)))
		}
	}
}

export class Telescreen {
	
	serialCommunicationSpeed = 9600
	port: string = null
	openingPort: string = null
	lastUpdateTime = 0

	speed: number = 1
	threshold1: number = 150
	threshold2: number = 400
	gamepadMode: number = 1

	refreshRate = 20

	moves: Map<string, Move>

	move: Move = null
	modeController: Controller
	portController: any
	choosingPort = false // User is choosing a port with the portController: do not update the portController or it will unselect it
	mustRefreshPortList = false

	lastMessages:any[] = []
	axes:number[] = []
	buttons:boolean[] = []
	
	midi: MIDIAccess = null
	lastMidiMessages: any[] = []

	constructor() {
		this.moves = new Map<string, Move>()
		this.moves.set('Orthographic', new OrthographicMove(this))
		this.moves.set('Polar', new PolarMove(this))
		this.moves.set('Direction', new DirectionMove(this))

		// document.addEventListener('Disconnect', ()=> this.disconnect(), false)
		// document.addEventListener('Connect', (event: CustomEvent)=> this.connect(event.detail), false)
		// document.addEventListener('MessageReceived', (event: CustomEvent)=> this.messageReceived(event.detail), false)

		document.addEventListener('ServerMessage', (event: CustomEvent)=> this.messageReceived(event.detail), false)

		this.move = this.moves.get('Orthographic')

		setInterval(()=> this.move.update(), 50)

	}

	getItem(key:string) {
		return localStorage.getItem('Telescreen:' + key)
	}

	setItem(key:string, value:string) {
		return localStorage.setItem('Telescreen:' + key, value)
	}

	isButtonInverted(id:number) {
		return this.getItem('invertButton'+id) === 'true'
	}

	createGUI(gui: GUI) {
		let telescreenGUI = gui.addFolder('Telescreen')

		this.portController = telescreenGUI.add( {'Connection': 'Disconnected'}, 'Connection' )
		
		
		telescreenGUI.addButton('Disconnect', ()=> this.disconnectSerialPort() )
		
		telescreenGUI.addButton('Listen Gamepad', ()=> this.updateGamepads())
		telescreenGUI.addButton('Listen Midi', ()=> this.initializeMidi() )
		telescreenGUI.addSlider('Speed', 1, 1, 100, 1).onChange((value)=> this.speed = value)

		telescreenGUI.addSlider('Threshold 1', 1, 1, 1000, 1).onChange((value)=> this.threshold1 = value)
		telescreenGUI.addSlider('Threshold 2', 1, 1, 1000, 1).onChange((value)=> this.threshold2 = value)
		
		telescreenGUI.add( {'Invert button 1': this.isButtonInverted(1) }, 'Invert button 1' ).onFinishChange(()=>this.setItem('invertButton1', String(!this.isButtonInverted(1)) ))
		telescreenGUI.add( {'Invert button 2': this.isButtonInverted(2) }, 'Invert button 2' ).onFinishChange(()=>this.setItem('invertButton2', String(!this.isButtonInverted(2)) ))

		this.modeController = telescreenGUI.add({ 'Mode': 'Orthographic' }, 'Mode', <any>['Orthographic', 'Polar', 'Direction']).onFinishChange((value: string)=> this.modeChanged(value))
		// telescreenGUI.open()
	}

	initializeMidi() {
		// let permissionName: any = { name: "midi", sysex: true }
		// navigator.permissions.query(permissionName).then((result) => {
		// 	if (result.state === "granted") {
		// 	  // Access granted.
		// 	} else if (result.state === "prompt") {
		// 	  // Using API will prompt for permission
		// 	}
		// 	// Permission was denied by user prompt or permission policy
		//   });

		  navigator.requestMIDIAccess().then((m)=>this.onMIDISuccess(m), (r)=>this.onMIDIFailure(r));
	}

	onMIDISuccess(midiAccess:any) {
		console.log("MIDI ready!");
		this.midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
		
		midiAccess.inputs.forEach((entry:MIDIInput) => {
		  entry.onmidimessage = (event)=> this.onMIDIMessage(event);
		})
	}

	onMIDIMessage(event:MIDIMessageEvent) {
		// let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
		// for (const character of event.data) {
		//   str += ' ,' + character;//	`0x${character.toString(16)} `;
		// }
		// console.log(str);
		let d = event.data
		let rotaryEncoder = d[0] == 176
		let pad = d[0] == 153 // this means pad was just pressed, then d[0] == 169 during push, and d[0] == 137 on release
		let buttonId = rotaryEncoder && d[1] == 112 || pad && d[1] == 37 ? 1 : rotaryEncoder && d[1] == 114 || pad && d[1] == 36 ? 2 : -1
		let action = pad ? 'x' : rotaryEncoder && d[2] > 64 ? '+' : rotaryEncoder && d[2] < 64 ? '-' : ''
		let realSpeed = Settings.tipibot.maxSpeed
		let realDelta = this.speed
		if(rotaryEncoder && buttonId != -1 && action != '') {
			Settings.tipibot.maxSpeed += Math.abs(d[2]-64) * 1000
			this.speed *= Math.abs(d[2]-64)

			if(this.isButtonInverted(buttonId)) {
				action = action == '-' ? '+' : '-'
			}
		}

		if(buttonId == 1) {
			if(action == '-') {
				this.move.button1cw()
			} else if(action == '+') {
				this.move.button1ccw()
			} else if(action == 'x') {
				Tipibot.tipibot.togglePenState()
			}
		} else if(buttonId == 2) {
			if(action == '-') {
				this.move.button2cw()
			} else if(action == '+') {
				this.move.button2ccw()
			} else if(action == 'x') {
				this.cycleMode()
			}
		}
		Settings.tipibot.maxSpeed = realSpeed
		this.speed = realDelta

		// this.lastMidiMessages.unshift({buttonId: buttonId, action: action, time: event.timeStamp})
		// if(this.lastMidiMessages.length>4){
		// 	this.lastMidiMessages.pop()
		// }
	}
	
	onMIDIFailure(msg:string) {
		console.error(`Failed to get MIDI access - ${msg}`);
	}

	initializePortController(options: string[]) {
		if(this.choosingPort) {
			// if options and this.portController options are different: schedule a refresh
			let optionsDiffer = options.length != this.portController.domElement.childNodes[0].options.length
			for(let option of this.portController.domElement.childNodes[0].options) {
				if(optionsDiffer || options.indexOf(option.value) < 0) {
					optionsDiffer = true
					break
				}
			}
			if(optionsDiffer) {
				this.mustRefreshPortList = true
			}
		}

		this.portController = this.portController.options(options)
		
		$(this.portController.domElement.parentElement.parentElement).mousedown( (event)=> {
			this.choosingPort = true
		})

		this.portController.onFinishChange( (value: any) => this.serialConnectionPortChanged(value) )
	}

	serialConnectionPortChanged(portName: string) {
		this.choosingPort = false
		if(portName == 'Disconnected' && this.port != null) {
			this.disconnectSerialPort()
		} else if(portName != 'Disconnected') {
			this.openingPort = portName
			console.log('open: ' + portName + ', at: ' + this.serialCommunicationSpeed)
			Communication.communication.send('open', { name: portName, baudRate: this.serialCommunicationSpeed }, portName)
		}
		if(this.mustRefreshPortList) {
			Communication.communication.send('list')
			this.mustRefreshPortList = false
		}
	}
	setPortName(port:string) {
		this.portController.object[this.portController.property] = port
		this.portController.updateDisplay()
	}

	disconnectSerialPort() {
		Communication.communication.send('close', null, this.port)
		this.port = null
		this.portController.setValue('Disconnected')
	}

	changeMode(mode: string) {
		// for(let m of this.moves) {
		// 	m[1].clearTimeout()
		// }
		this.move = this.moves.get(mode)
	}

	modeChanged(mode: string) {
		this.changeMode(mode)
	}

	cycleMode() {
		let movesList = []
		let i = 0
		let currentMoveIndex = 0
		for(let m of this.moves) {
			if(m[1] == this.move) {
				currentMoveIndex = i
			}
			movesList.push(m[0])
			i++
		}
		let newMove = movesList[ currentMoveIndex+1 < movesList.length ? currentMoveIndex + 1 : 0]
		this.changeMode(newMove)
		this.modeController.setValue(<any>newMove)
		this.modeController.updateDisplay()
	}

	// connect(port: string) {
	// 	// for(let serialPort of communication.serialPorts) {
	// 	// 	if(serialPort != port) {
	// 	// 		communication.socket.emit('command', 'open ' + serialPort + ' ' + SERIAL_COMMUNICATION_SPEED)
	// 	// 	}
	// 	// }
	// }

	// disconnect() {
	// 	// for(let serialPort of communication.serialPorts) {
	// 	// 	if(serialPort != Communication.interpreter.serialPort) {
	// 	// 		communication.socket.emit('command', 'close ' + serialPort)
	// 	// 	}
	// 	// }
	// }

	messageReceived(messageObject: {type: string, data:any, port: string}) {

		let type = messageObject.type
		let data = messageObject.data
		let port = messageObject.port

		if(type == 'opened') {
			if(port == this.openingPort) {
				this.port = port
				this.openingPort = null
			}
		} else if(type == 'already-opened') {
			if(port == this.openingPort) {
				this.port = port
				this.openingPort = null
			}
		} else if(type == 'closed') {
			this.port = null
		} else if(type == 'list') {
			let options = ['Disconnected']
			for(let port of data) {
				options.push(port.path)
			}
			this.initializePortController(options)
		} else if(type == 'connected') {

		} else if(type == 'not-connected') {
			
		} else if(type == 'connected-to-simulator') {

		} else if(type == 'data') {
			if(port == this.port) {
				this.processMessage(data)
			}
		} else if(type == 'sent') {
			if(port == this.port) {
			}
		}
	}

	processMessage(message: string) {
		let now = Date.now()
		// console.log(message, now-this.lastUpdateTime)
		let buttonId = parseInt(message[0])
		let action = message[1]
		let realSpeed = this.speed
		if(action!='x') {
			// Debounce: if last messages were all in one direction and last update time was almost now: this message should be in the same direction
			for(let lm of this.lastMessages) {
				if(lm.buttonId == buttonId) {
					if(now-lm.time < this.threshold1) {
						this.speed *= 3
					} else if(now-lm.time < this.threshold2) {
						this.speed *= 2
					}
				}
				if(lm.buttonId == buttonId && now - lm.time < 100) {
					action = lm.action
					break
				}
			}
			if(this.isButtonInverted(buttonId)) {
				action = action == '-' ? '+' : '-'
			}
		}
		console.log(buttonId, action)

		this.lastUpdateTime = now
		if(buttonId == 1) {
			if(action == '-') {
				this.move.button1cw()
			} else if(action == '+') {
				this.move.button1ccw()
			} else if(action == 'x') {
				Tipibot.tipibot.togglePenState()
			}
		} else if(buttonId == 2) {
			if(action == '-') {
				this.move.button2cw()
			} else if(action == '+') {
				this.move.button2ccw()
			} else if(action == 'x') {
				this.cycleMode()
			}
		}
		this.speed = realSpeed
		this.lastMessages.unshift({buttonId: buttonId, action: message[1], time: now})
		if(this.lastMessages.length>4){
			this.lastMessages.pop()
		}
	}


    equals(a:number, b:number, tolerance=0.01) {
        return Math.abs(b-a) < tolerance
    }

    updateGamepads() {
        const gamepads = navigator.getGamepads()
        if (!gamepads || gamepads.length == 0) {
            // requestAnimationFrame(()=>this.update())
            setTimeout(()=>this.updateGamepads(), 0)
            return
        }
		if(Communication.interpreter.commandQueue.length > 0) {
			setTimeout(()=>this.updateGamepads(), 0)
			return
		}
        let activated = false

        const gp = gamepads[0]
        if(gp == null) {
            setTimeout(()=>this.updateGamepads(), 0)
            return
        }
        // console.log('gamepad', gp)
		
		let realSpeed = this.speed

        // Arrows
        if(this.equals(gp.axes[0], 0.714)) { // Left
			activated = true
			this.move.button1ccw()
        }
        if(this.equals(gp.axes[0], -0.428)) { // Right
            activated = true
			this.move.button1cw()
        }
        if(this.equals(gp.axes[0], -1)) { // Up
			activated = true
			this.move.button2ccw()
        }
        if(this.equals(gp.axes[0], 0.142)) { // Down
			activated = true
			this.move.button2cw()
        }

        // Move Z
        if(gp.buttons[5].pressed && !gp.buttons[7].pressed) {
			this.speed *= 2
			activated = true
        } else if(!gp.buttons[5].pressed && gp.buttons[7].pressed) {
			this.speed *= 3
            activated = true
        } else if(gp.buttons[5].pressed && gp.buttons[7].pressed) {
			this.speed *= 4
            activated = true
        }
		let epsilon = 0.05
		if(this.gamepadMode == 1) {
			if(Math.abs(gp.axes[1]) > epsilon || Math.abs(gp.axes[2]) > epsilon) { // Up & down
				activated = true
				Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], this.speed * gp.axes[2])))
			}
		} else if (this.gamepadMode == 2) {
			// Left Joystick: Menu selection and actions
			// if(gp.axes[1] < -epsilon) { // Left
			// 	activated = true
			// 	Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], 0)))
			// }
			// if(gp.axes[1] > epsilon) { // Right
			// 	activated = true
			// 	Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], 0)))
			// }
	
			// if(gp.axes[2] < -epsilon) { // Up
			// 	activated = true
			// 	Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.speed * gp.axes[2])))
			// }
			// if(gp.axes[2] > epsilon) { // Down (z axis is inverted)
			// 	activated = true
			// 	Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.speed * gp.axes[2])))
			// }
			// Left Joystick: Menu selection and actions
			if(Math.abs(gp.axes[1]) > epsilon) { // Left & Right
				activated = true
				Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(this.speed * gp.axes[1], 0)))
			}
	
			if(Math.abs(gp.axes[2]) > epsilon) { // Up & down
				activated = true
				Tipibot.tipibot.moveLinear(Tipibot.tipibot.getPosition().add(new paper.Point(0, this.speed * gp.axes[2])))
			}
		}

		// if(Math.abs(gp.axes[1]) > epsilon || Math.abs(gp.axes[2]) > epsilon) {
		// 	this.speed *= Math.max( Math.abs(gp.axes[1]) , Math.abs(gp.axes[2]) )
		// }
        
		// if pressed and was not pressed before
        if(gp.buttons[0].pressed && !this.buttons[0]) {
            activated = true
			Tipibot.tipibot.togglePenState()
        }
        if(gp.buttons[1].pressed && !this.buttons[1]) {
            activated = true
			this.gamepadMode++
			if(this.gamepadMode > 2) {
				this.gamepadMode = 1
			}
        }
        
        if(gp.buttons[4].pressed) {
        }
        if(gp.buttons[6].pressed) {
        }

        if(gp.buttons[9].pressed) { // start
            activated = true
        }

        if(gp.buttons[8].pressed) { // select
			// this.cycleMode()
            activated = true
        }

        // Right Joystick
        if(this.equals(gp.axes[3], -1)) { // Left
			activated = true
        }
        if(this.equals(gp.axes[3], 1)) { // Right
            activated = true
        }

		this.speed = realSpeed
		for(let i=0 ; i<gp.axes.length ; i++) {
			if(this.axes.length == gp.axes.length && this.axes[i] != gp.axes[i]) {
				console.log(i, gp.axes[i])
			}
		}
		this.axes = gp.axes.slice()
		this.buttons = []
        for(let i=0 ; i<gp.buttons.length ; i++) {
            let button = gp.buttons[i]
			this.buttons.push(button.pressed)
            if(button.pressed) {
                console.log(i, button)
            }
        }
        // requestAnimationFrame(()=>this.update())
        setTimeout(()=>this.updateGamepads(), activated ? this.refreshRate : 0)
    }
}

// Charly
// Tester manette de jeu