import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { Command } from "../Communication/Interpreter"
import { tipibot } from "../Tipibot"

export class CommandDisplay {

	listJ: any
	gui: GUI
	pauseButton: Controller

	constructor() {

		// $('#commands-content').click((event)=> this.click(event))

		document.addEventListener('QueueCommand', (event: CustomEvent)=> this.queueCommand(event.detail), false)
		document.addEventListener('SendCommand', (event: CustomEvent)=> this.sendCommand(event.detail), false)
		document.addEventListener('CommandExecuted', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
		document.addEventListener('ClearQueue', (event: CustomEvent)=> this.clearQueue(), false)
	}

	createGUI(gui: GUI) {
		this.gui = gui.addFolder('Commands')
		this.gui.open()

		this.pauseButton = this.gui.add({'Pause': false}, 'Pause').onChange((value) => communication.interpreter.setPause(value))
		this.gui.addButton('Emergency stop', () => {
			this.pauseButton.setValue(true)
			communication.interpreter.sendStop(true)
		})
		this.gui.addButton('Clear commands', () => communication.interpreter.clearQueue() )

		let commandList = this.gui.addFolder('Command list')

		this.listJ = $('<ul id="command-list" class="c-list">')
		commandList.open()
		this.listJ.insertAfter($(commandList.gui.domElement).find('li'))
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
		closeButtonJ.click((event)=> this.removeCommand(command.id))
		liJ.append(closeButtonJ)
		return liJ
	}

	removeCommand(id: number) {
		this.listJ.find('#' + id).remove()
		this.updateName()
		document.dispatchEvent(new CustomEvent('CommandListChanged'))
	}

	updateName() {
		$('#commands h3').text('Command list (' + this.listJ.children().length + ')')
	}

	queueCommand(command: Command) {
		this.listJ.append(this.createCommandItem(command))
		this.updateName()
		document.dispatchEvent(new CustomEvent('CommandListChanged'))
	}

	sendCommand(command: Command) {
		this.listJ.find('#'+command.id).addClass('sent')
	}

	commandExecuted(command: Command) {
		this.removeCommand(command.id)
	}

	clearQueue() {
		this.listJ.children().remove()
		this.updateName()
		document.dispatchEvent(new CustomEvent('CommandListChanged'))
	}
}