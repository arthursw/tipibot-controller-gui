import $ = require("jquery");
import { GUI, Controller } from "../GUI"
import { CommeUnDessein, StorageKeys, State } from "./CommeUnDesseinStatic"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"
import { visualFeedback } from "../VisualFeedback"
import { Communication } from "../Communication/CommunicationStatic"

export class CommeUnDesseinInteractive extends CommeUnDessein {

	startButton: Controller
	
	constructor(testMode=false) {
		super(testMode)
		this.mode = this.getItem(StorageKeys.Mode) || 'CommeUnDessein'
		this.origin = this.getItem(StorageKeys.Origin) || ''
		let secret = this.getItem(StorageKeys.Secret)
		if (secret != null) {
			this.secret = secret
		}
	}

	getItem(key:string) {
		return localStorage.getItem(StorageKeys.CommeUnDessein + key)
	}

	setItem(key:string, value:string) {
		return localStorage.setItem(StorageKeys.CommeUnDessein + key, value)
	}

	createGUI(gui: GUI) {
		let folderName = 'Comme un dessein'
		if(this.testMode) {
			folderName += ' (Test mode)'
		}
		let commeUnDesseinGUI = gui.addFolder(folderName)
		commeUnDesseinGUI.add(this, 'origin').onFinishChange((value) => this.settingsChanged(StorageKeys.Origin, value))
		commeUnDesseinGUI.add(this, 'mode').onFinishChange((value) => this.settingsChanged(StorageKeys.Mode, value))
		commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => this.settingsChanged(StorageKeys.Secret, value))

		// CommeUnDesseinSize.width = parseInt(this.getItem(StorageKeys.Width)) || Tipibot.tipibot.drawArea.bounds.width
		// CommeUnDesseinSize.height = parseInt(this.getItem(StorageKeys.Height)) || Tipibot.tipibot.drawArea.bounds.height

		// commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, 5000, 1).name('Width').onFinishChange((value)=> {
		// 	this.setItem(StorageKeys.Width, value)
		// })
		// commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, 5000, 1).name('Height').onFinishChange((value)=> {
		// 	this.setItem(StorageKeys.Height, value)
		// })

		this.startButton = commeUnDesseinGUI.addButton('Start', ()=> this.toggleStart())
		// commeUnDesseinGUI.open()

		document.addEventListener('ServerMessage', (event: CustomEvent)=> this.onServerMessage(event.detail), false)
	}
	
	request(data: { method: string, url: string, data: any }, callback: (response:any)=> void, error: (response:any)=> void) {
		console.log('interactive request')
		$.ajax(data).done(callback).fail(error)
	}

	onServerMessage(json: {type: string, data: any}) {
		if(json.type == 'comme-un-dessein-state') {
			console.log('server changed comme un dessein state: ', json.data)
			console.log(State)
			this.isConnectedToServer = true
			this.state = json.data.state
			this.updateStartButton()
		}
	}

	updateStartButton() {
		let server = this.isConnectedToServer ? ' server' : ''
		if(this.state != State.Stopped) {
			this.startButton.setName('Stop' + server + ', clear queue & go home')
		} else {
			this.startButton.setName('Start' + server)
		}
	}

	toggleStart() {
		this.updateStartButton()
		super.toggleStart()
	}

	settingsChanged(key:string, value: any) {
		this.setItem(key, value)
		Communication.communication.send('comme-un-dessein-changed', { key: key, value: value })
	}

	setDrawingStatusDrawn(pk: string) {
		if(visualFeedback.paths.children.length > 0) {
			visualFeedback.paths.removeChildren()
		}
		super.setDrawingStatusDrawn(pk)
	}
}