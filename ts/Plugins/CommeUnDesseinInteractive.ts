import { GUI, Controller } from "../GUI"
import { CommeUnDessein, StorageKeys, CommeUnDesseinSize } from "./CommeUnDesseinStatic"
import { TipibotInteractive as Tipibot } from "../TipibotInteractive"
import { visualFeedback } from "../VisualFeedback"
import { Communication } from "../Communication/CommunicationStatic"

export class CommeUnDesseinInteractive extends CommeUnDessein {

	startButton: Controller
	
	constructor(testMode=false) {
		super(testMode)
	}

	createGUI(gui: GUI) {
		let folderName = 'Comme un dessein'
		if(this.testMode) {
			folderName += ' (Test mode)'
		}
		let commeUnDesseinGUI = gui.addFolder(folderName)
		commeUnDesseinGUI.add(this, 'origin').onFinishChange((value) => this.settingsChanged(StorageKeys.Origin, value))
		commeUnDesseinGUI.add(this, 'mode').onFinishChange((value) => this.settingsChanged(StorageKeys.Mode, value))
		commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => this.settingsChanged(StorageKeys.CommeUnDesseinSecret, value))

		CommeUnDesseinSize.width = parseInt(window.localStorage.getItem('commeUnDesseinWidth')) || Tipibot.tipibot.drawArea.bounds.width
		CommeUnDesseinSize.height = parseInt(window.localStorage.getItem('commeUnDesseinHeight')) || Tipibot.tipibot.drawArea.bounds.height

		commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, 5000, 1).name('Width').onFinishChange((value)=> {
			window.localStorage.setItem('commeUnDesseinWidth', value)
		})
		commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, 5000, 1).name('Height').onFinishChange((value)=> {
			window.localStorage.setItem('commeUnDesseinHeight', value)
		})

		this.startButton = commeUnDesseinGUI.addButton('Start', ()=> this.toggleStart())
		// commeUnDesseinGUI.open()
	}

	settingsChanged(key:string, value: any) {
		localStorage.setItem(key, value)
		Communication.communication.send('comme-un-dessein', { key: key, value: value })
	}

	toggleStart() {
		if(!this.started) {
			this.startButton.setName('Stop, clear queue & go home')
		} else {
			this.startButton.setName('Start')
		}
		super.toggleStart()
	}

	setDrawingStatusDrawn(pk: string) {
		if(visualFeedback.paths.children.length > 0) {
			visualFeedback.paths.removeChildren()
		}
		super.setDrawingStatusDrawn(pk)
	}
}