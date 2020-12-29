import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { Command, SpecialCommandTypes } from "../Communication/Interpreter"
import { Pen, MoveType } from "../Pen"
import { tipibot } from "../Tipibot"

export class CommandDisplay {

	listJ: any
	gui: GUI
	pauseButton: Controller

	constructor() {

		// $('#commands-content').click((event)=> this.click(event))

		document.addEventListener('QueueCommand', (event: CustomEvent)=> this.queueCommand(event.detail), false)
		document.addEventListener('QueueCommands', (event: CustomEvent)=> this.queueCommands(event.detail), false)
		document.addEventListener('SendCommand', (event: CustomEvent)=> this.sendCommand(event.detail), false)
		document.addEventListener('CommandExecuted', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
		document.addEventListener('ClearQueue', (event: CustomEvent)=> this.clearQueue(), false)
		document.addEventListener('CancelCommand', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
	}

	createGUI(gui: GUI) {
		this.gui = gui.addFolder('Commands')
		this.gui.open()

		tipibot.gui = this.gui
		let position = { moveX: Settings.tipibot.homeX, moveY: Settings.tipibot.homeY }
		this.gui.add(position, 'moveX', 0, Settings.tipibot.width).name('Move X').onFinishChange((value)=> tipibot.move(MoveType.Direct, new paper.Point(value, tipibot.getPosition().y)))
		this.gui.add(position, 'moveY', 0, Settings.tipibot.height).name('Move Y').onFinishChange((value)=> tipibot.move(MoveType.Direct, new paper.Point(tipibot.getPosition().x, value)))

		let goHomeButton = this.gui.addButton('Go home', ()=> tipibot.goHome(()=> console.log('I am home :-)')))


		tipibot.penStateButton = this.gui.addButton('Pen down', () => tipibot.togglePenState() )
		tipibot.motorsEnableButton = this.gui.addButton('Disable motors', ()=> tipibot.toggleMotors())
		
		this.gui.addButton('Initialize', ()=> communication.interpreter.initialize(false))

		this.pauseButton = this.gui.add({'Pause': false}, 'Pause').onChange((value) => communication.interpreter.setPause(value))
		this.gui.addButton('Emergency stop', () => {
			this.pauseButton.setValue(true)
			communication.interpreter.sendStop(true)
		})
		this.gui.addButton('Save commands', () => this.saveCommands() )
		this.gui.addButton('Clear commands', () => communication.interpreter.clearQueue() )

		let commandList = this.gui.addFolder('Command list')

		this.listJ = $('<ul id="command-list" class="c-list">')
		commandList.open()
		this.listJ.insertAfter($(commandList.gui.domElement).find('li'))
	}

	saveCommands() {
		let gCode = communication.interpreter.getGCode()
		let blob = new Blob([gCode], {type: "text/plain;charset=utf-8"})
		saveAs(blob, "gcode.txt")
	}

	click(event: any) {
		if(event.target.tagName == 'BUTTON') {
			let commandID = parseInt(event.target.parentNode.id)
			communication.interpreter.removeCommand(commandID)
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
			communication.interpreter.removeCommand(command.id)
			this.removeCommand(command.id)
		})
		liJ.append(closeButtonJ)
		return liJ
	}

	queueCommands(commandIDs: number[]): any {
		let id = (''+Math.random()).replace('.','')
		let liJ = $('<li id="'+id+'" class="commands">')
		let nCommands = commandIDs.length
		let messageJ = $('<div>').text('' + nCommands + '/' + nCommands + ' commands').addClass('message').attr('data-n-commands', nCommands).attr('data-total-commands', nCommands)
		liJ.append(messageJ)
		
		let closeButtonJ = $('<button>x</button>')
		closeButtonJ.click((event)=> {
			for(let commandID of commandIDs) {
				communication.interpreter.removeCommand(commandID)
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
		document.dispatchEvent(new CustomEvent('CommandListChanged'))
	}

	updateName() {
		$('#commands h3').text('Command list (' + this.listJ.children().length + ')')
	}

	queueCommand(command: Command) {
		// if(Settings.disableCommandList) {
		// 	return
		// }
		this.listJ.append(this.createCommandItem(command))
		this.updateName()
		document.dispatchEvent(new CustomEvent('CommandListChanged'))
	}

	sendCommand(command: Command) {
		if(command.special == SpecialCommandTypes.ChangePen) {
			this.pauseButton.setValue(true)
			return
		}
		// if(Settings.disableCommandList) {
		// 	return
		// }
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
		document.dispatchEvent(new CustomEvent('CommandListChanged'))
	}
}