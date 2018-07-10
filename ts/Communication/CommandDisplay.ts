import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { communication, SERIAL_COMMUNICATION_SPEED } from "../Communication/Communication"
import { Command } from "../Communication/Interpreter"
import { tipibot } from "../Tipibot"

export class CommandDisplay {

	listJ: any
	gui: GUI

	constructor() {

		// $('#commands-content').click((event)=> this.click(event))

		document.addEventListener('QueueCommand', (event: CustomEvent)=> this.queueCommand(event.detail), false)
		document.addEventListener('SendCommand', (event: CustomEvent)=> this.sendCommand(event.detail), false)
		document.addEventListener('CommandExecuted', (event: CustomEvent)=> this.commandExecuted(event.detail), false)
		document.addEventListener('ClearQueue', (event: CustomEvent)=> this.clearQueue(), false)
	}

	createGUI(gui: GUI) {
		// let folderName = 'Command list'
		// this.gui = gui.addFolder(folderName)
		// this.listJ = $('<ul id="command-list">')
		// this.gui.open()
		// this.listJ.insertAfter($(this.gui.gui.domElement).find('li'))
		this.listJ = $('#command-list')
	}

	click(event: any) {
		if(event.target.tagName == 'BUTTON') {
			let commandID = parseInt(event.target.parentNode.id)
			communication.interpreter.removeCommand(commandID)
			this.removeCommand(commandID)
		}
	}

	createCommandItem(command: Command): any {
		let liJ = $('<li id="' + command.id + '"">' + command.message + '<br>' + command.data + '</li>')
		let closeButtonJ = $('<button>x</button>')
		closeButtonJ.click((event)=> this.removeCommand(command.id))
		liJ.append(closeButtonJ)
		return liJ
	}

	removeCommand(id: number) {
		this.listJ.find('#' + id).remove()
		this.updateName()
	}

	updateName() {
		$('#commands h3').text('Command list (' + this.listJ.children().length + ')')
	}

	queueCommand(command: Command) {
		this.listJ.append(this.createCommandItem(command))
		this.updateName()
		document.dispatchEvent(new CustomEvent('AddedCommand'))
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
	}
}