import $ = require("jquery");
import { Settings, paper, createEvent } from "../Settings"
import { settingsManager } from "../SettingsManager"
import { GUI, Controller } from "../GUI"
import { Communication } from "./CommunicationStatic"
import { Command, SpecialCommandTypes } from "../Communication/Interpreter"
import { MoveType } from "../TipibotInterface"
import { SVGPlot } from "../Plot"
import { Console } from "../Console"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"

export class CommandDisplay {

	listJ: any
	console: Console
	gui: GUI
	connectButton: Controller
	goHomeButton: Controller
	setHomeButton: Controller
	autoHomeButton: Controller
	initializeButton: Controller
	loadSVGButton: Controller
	clearSVGButton: Controller
	drawSVGButton: Controller
	pauseButton: Controller
	emergencyStopButton: Controller
	saveCommandsButton: Controller
	clearCommandsButton: Controller
	commandList: GUI
	advancedLayout = false

	constructor() {

		// $('#commands-content').click((event)=> this.click(event))

		document.addEventListener('QueueCommand', (event: CustomEvent)=> this.queueCommand(event.detail), false)
		document.addEventListener('QueueCommands', (event: CustomEvent)=> this.queueCommands(event.detail), false)
		document.addEventListener('SendCommand', (event: CustomEvent)=> this.sendCommand(event.detail), false)
		document.addEventListener('CommandExecuted', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
		document.addEventListener('ClearQueue', (event: CustomEvent)=> this.clearQueue(), false)
		document.addEventListener('CancelCommand', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
	}

	addIcon(controller: Controller, icon: string) {
		let iconJ = $('#other-controls button.' + icon + ' svg')
		// $(controller.getDomElement().parentElement).prepend(iconJ)
		iconJ.insertBefore(controller.getDomElement())
	}

	initializeMoveControls() {
		$('#move-speed button').click((event)=> { 
			$('#move-speed button').removeClass('selected')
			$(event.target).addClass('selected')
		})
		$('#move-controls button.up-arrow').mousedown(()=> {
			let amount = parseFloat($('#move-speed button.selected').attr('data-value'))
			Tipibot.tipibot.moveDirect(Tipibot.tipibot.getPosition().add(new paper.Point(0, -amount)))
		})
		$('#move-controls button.down-arrow').mousedown(()=> {
			let amount = parseFloat($('#move-speed button.selected').attr('data-value'))
			Tipibot.tipibot.moveDirect(Tipibot.tipibot.getPosition().add(new paper.Point(0, amount)))
		})
		$('#move-controls button.left-arrow').mousedown(()=> {
			let amount = parseFloat($('#move-speed button.selected').attr('data-value'))
			Tipibot.tipibot.moveDirect(Tipibot.tipibot.getPosition().add(new paper.Point(-amount, 0)))
		})
		$('#move-controls button.right-arrow').mousedown(()=> {
			let amount = parseFloat($('#move-speed button.selected').attr('data-value'))
			Tipibot.tipibot.moveDirect(Tipibot.tipibot.getPosition().add(new paper.Point(amount, 0)))
		})
		$('#move-controls button.home').mousedown(()=> {
			Tipibot.tipibot.goHome(()=> console.log('I am home :-)'))
		})
	}

	initializeServoControls() {

		$('#servo-controls button.plus').mousedown(()=> {
			Tipibot.tipibot.penPlus()
		})
		$('#servo-controls button.minus').mousedown(()=> {
			Tipibot.tipibot.penMinus()
		})

		$('#servo-controls button.go-pen-up').mousedown(()=> {
			Tipibot.tipibot.servoChanged(true, 'up', false)
		})
		$('#servo-controls button.go-pen-down').mousedown(()=> {
			Tipibot.tipibot.servoChanged(true, 'down', false)
		})
		$('#servo-controls button.go-pen-close').mousedown(()=> {
			Tipibot.tipibot.servoChanged(true, 'close', false)
		})
		$('#servo-controls button.go-pen-drop').mousedown(()=> {
			Tipibot.tipibot.servoChanged(true, 'drop', false)
		})

		$('#servo-controls button.set-pen-up').mousedown(()=> {
			Settings.servo.position.up = Tipibot.tipibot.pen.angle
			settingsManager.settingChanged(['Angles'], 'up', Settings.servo.position.up, true)
			
		})
		$('#servo-controls button.set-pen-down').mousedown(()=> {
			Settings.servo.position.down = Tipibot.tipibot.pen.angle
			settingsManager.settingChanged(['Angles'], 'down', Settings.servo.position.down, true)
		})
		$('#servo-controls button.set-pen-close').mousedown(()=> {
			Settings.servo.position.close = Tipibot.tipibot.pen.angle
			settingsManager.settingChanged(['Angles'], 'close', Settings.servo.position.close, true)
		})
		$('#servo-controls button.set-pen-drop').mousedown(()=> {
			Settings.servo.position.drop = Tipibot.tipibot.pen.angle
			settingsManager.settingChanged(['Angles'], 'drop', Settings.servo.position.drop, true)
		})
	}

	createGUI(tipibotConsole: Console) {
		this.console = tipibotConsole
		let gui = tipibotConsole.gui
		
		this.initializeMoveControls()
		this.initializeServoControls()

		this.gui = gui.addFolder('Commands')
		let controlsJ = $('#controls')
		controlsJ.insertAfter($(this.gui.getDomElement()).find('li.title'))
		this.gui.open()

		$('#fullscreen').click(()=> {
			let controller = settingsManager.gui.getFolder('Settings').getController('fullscreen')
			controller.setValue(!controller.getValue())
		})
		Tipibot.tipibot.gui = this.gui
		let position = { moveX: Settings.tipibot.homeX, moveY: Settings.tipibot.homeY }
		this.gui.add(position, 'moveX', 0, Settings.tipibot.width).name('Move X').onFinishChange((value)=> Tipibot.tipibot.move(MoveType.Direct, new paper.Point(value, Tipibot.tipibot.getPosition().y)))
		this.gui.add(position, 'moveY', 0, Settings.tipibot.height).name('Move Y').onFinishChange((value)=> Tipibot.tipibot.move(MoveType.Direct, new paper.Point(Tipibot.tipibot.getPosition().x, value)))
		this.connectButton = this.gui.addButton(Communication.communication && Communication.communication.serialPortConnectionOpened ? 'Disconnect' : 'Connect', ()=> {
			if(Communication.communication.serialPortConnectionOpened) {
				Communication.communication.disconnectSerialPort()
			} else {
				if(Communication.communication.autoConnectController != null) {
					Communication.communication.autoConnectController.setValue(true)
				}
			}
		})
		document.addEventListener('Connect', ()=> this.connectButton.setName('Disconnect'))
		document.addEventListener('Disconnect', ()=> this.connectButton.setName('Connect'))
		this.addIcon(this.connectButton, 'connect')

		this.goHomeButton = this.gui.addButton('Go home', ()=> Tipibot.tipibot.goHome(()=> console.log('I am home :-)')))

		this.setHomeButton = this.gui.addButton('Set home', ()=> Tipibot.tipibot.setHome())
		this.addIcon(this.setHomeButton, 'set-home')

		this.autoHomeButton = this.gui.addButton('Auto home', ()=> Tipibot.tipibot.autoHome())
		this.addIcon(this.autoHomeButton, 'set-home')

		Tipibot.tipibot.penStateButton = this.gui.addButton('Pen down', () => Tipibot.tipibot.togglePenState() )
		this.addIcon(Tipibot.tipibot.penStateButton, 'pen')
		Tipibot.tipibot.motorsEnableButton = this.gui.addButton('Disable motors', ()=> Tipibot.tipibot.toggleMotors())
		this.addIcon(Tipibot.tipibot.motorsEnableButton, 'toggle-motors')
		
		this.initializeButton = this.gui.addButton('Initialize', ()=> Communication.interpreter.initialize(false))
		
		this.loadSVGButton = this.gui.addButton('Load SVG', ()=> SVGPlot.gui.getController('Load SVG').click() )
		this.clearSVGButton = this.gui.addButton('Clear SVG', SVGPlot.clearClicked)
		this.clearSVGButton.hide()
		this.addIcon(this.loadSVGButton, 'load-svg')
		this.addIcon(this.clearSVGButton, 'clear')

		document.addEventListener('Load SVG', ()=> { 
			this.loadSVGButton.hide()
			this.clearSVGButton.show()
		})
		document.addEventListener('Clear SVG', ()=> { 
			this.loadSVGButton.show()
			this.clearSVGButton.hide()
		})

		this.drawSVGButton = this.gui.addButton('Draw', ()=> SVGPlot.gui.getController('Draw').click() )
		document.addEventListener('Draw', ()=> this.drawSVGButton.setName('Stop, clear commands & go home'))
		document.addEventListener('Stop drawing', ()=> this.drawSVGButton.setName('Draw'))

		this.addIcon(this.drawSVGButton, 'draw')

		this.pauseButton = this.gui.add({'Pause': false}, 'Pause').onChange((value) => Communication.interpreter.setPause(value))
		this.addIcon(this.pauseButton, 'pause')
		this.emergencyStopButton = this.gui.addButton('Emergency stop', () => {
			this.pauseButton.setValue(true)
			Communication.interpreter.sendStop(true)
			this.connectButton.click()
		})
		this.saveCommandsButton = this.gui.addButton('Save commands', () => this.saveCommands() )
		this.clearCommandsButton = this.gui.addButton('Clear commands', () => Communication.interpreter.clearQueue() )
		let advancesSettingsButton = this.gui.add(this, 'advancedLayout').name('Advanced settings').onFinishChange((value) => this.toggleAdvancedSettings(value) )
		this.addIcon(advancesSettingsButton, 'advanced-settings')

		this.commandList = this.gui.addFolder('Command list')

		this.listJ = $('<ul id="command-list" class="c-list">')
		// this.commandList.open()
		this.listJ.insertAfter($(this.commandList.gui.domElement).find('li'))
		
		this.goHomeButton.hide()
		this.initializeButton.hide()
		// this.emergencyStopButton.hide()
		this.saveCommandsButton.hide()
		this.clearCommandsButton.hide()
		// this.commandList.hide()
	}
	
	toggleAdvancedSettings(advancedLayout: boolean) {
		if(advancedLayout) {
			// this.connectButton.hide()
			// this.loadSVGButton.hide()
			// this.clearSVGButton.hide()
			// this.drawSVGButton.hide()

			this.goHomeButton.show()
			this.initializeButton.show()
			this.saveCommandsButton.show()
			this.clearCommandsButton.show()
			// this.emergencyStopButton.show()
			// this.commandList.show()
			$('body').removeClass('noGui')
			$('body').addClass('advancedLayout')
			$('#gui').show()
		} else {
			// this.connectButton.show()
			// if(SVGPlot.svgPlot != null) {
			// 	this.clearSVGButton.show()
			// } else {
			// 	this.loadSVGButton.show()
			// }
			// this.drawSVGButton.show()

			this.goHomeButton.hide()
			this.initializeButton.hide()
			this.saveCommandsButton.hide()
			this.clearCommandsButton.hide()
			// this.emergencyStopButton.hide()
			// this.commandList.hide()
			$('body').removeClass('noGui')
			$('body').removeClass('advancedLayout')
			$('#gui').hide()
		}
		window.dispatchEvent(new Event('resize'))
	}

	saveCommands() {
		let gCode = Communication.interpreter.getGCode()
		let blob = new Blob([gCode], {type: "text/plain;charset=utf-8"})
		saveAs(blob, "gcode.txt")
	}

	click(event: any) {
		if(event.target.tagName == 'BUTTON') {
			let commandID = parseInt(event.target.parentNode.id)
			Communication.interpreter.removeCommand(commandID)
			this.removeCommand(commandID)
		}
	}

	createCommandItem(command: Command): any {
		let liJ = $('<li id="' + command.id + '"">')
		let messageJ = $('<div>').append(command.message).addClass('message')
		let dataJ = $('<div>').append(command.data).addClass('data')
		liJ.append(messageJ)
		liJ.append(dataJ)
		let closeButtonJ = $('<button>x</button>')
		closeButtonJ.click((event)=> {
			Communication.interpreter.removeCommand(command.id)
			this.removeCommand(command.id)
		})
		liJ.append(closeButtonJ)
		return liJ
	}

	queueCommands(commandIDs: number[]): any {
		if(Settings.disableCommandList) {
			return
		}
		let id = (''+Math.random()).replace('.','')
		let liJ = $('<li id="'+id+'" class="commands">')
		let nCommands = commandIDs.length
		let messageJ = $('<div>').text('' + nCommands + '/' + nCommands + ' commands').addClass('message').attr('data-n-commands', nCommands).attr('data-total-commands', nCommands)
		liJ.append(messageJ)
		
		let closeButtonJ = $('<button>x</button>')
		closeButtonJ.click((event)=> {
			for(let commandID of commandIDs) {
				Communication.interpreter.removeCommand(commandID)
			}
			this.removeCommand(id)
		})
		liJ.append(closeButtonJ)

		this.listJ.append(liJ)
		return
	}

	removeCommand(id: number | string) {
		let itemJ = this.listJ.find('#' + id)
		if(itemJ.length == 0) {
			return
		}
		itemJ.remove()
		this.updateName()
		document.dispatchEvent(createEvent('CommandListChanged'))
	}

	updateName() {
		$('#commands h3').text('Command list (' + this.listJ.children().length + ')')
	}

	queueCommand(command: Command) {
		if(Settings.disableCommandList) {
			return
		}
		this.listJ.append(this.createCommandItem(command))
		this.updateName()
		document.dispatchEvent(createEvent('CommandListChanged'))
	}

	sendCommand(command: Command) {
		if(command.special == SpecialCommandTypes.ChangePen) {
			this.pauseButton.setValue(true)
			return
		}
		if(Settings.disableCommandList) {
			return
		}
		this.listJ.find('#'+command.id).addClass('sent')
	}

	commandExecuted(command: Command) {
		let commandsJ = this.listJ.children().first()
		if(commandsJ.hasClass('commands')) {
			let messageJ = commandsJ.find('.message')
			let nCommands = parseInt(messageJ.attr('data-n-commands')) - 1
			messageJ.attr('data-n-commands', nCommands)
			let totalCommands = messageJ.attr('data-total-commands')
			messageJ.text('' + nCommands + '/' + totalCommands + ' commands')
			if(nCommands == 0) {
				this.removeCommand(commandsJ.attr('id'))
			}
			return
		}
		this.removeCommand(command.id)
	}

	clearQueue() {
		// if(Settings.disableCommandList) {
		// 	return
		// }
		this.listJ.children().remove()
		this.updateName()
		document.dispatchEvent(createEvent('CommandListChanged'))
	}
}