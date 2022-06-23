import { GUI, Controller } from "../GUI"
import { CommeUnDessein, StorageKeys, CommeUnDesseinSize } from "./CommeUnDesseinStatic"
import { tipibot } from "../TipibotInteractive"

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
		commeUnDesseinGUI.add(this, 'origin').onFinishChange((value) => localStorage.setItem(StorageKeys.Origin, value))
		commeUnDesseinGUI.add(this, 'mode').onFinishChange((value) => localStorage.setItem(StorageKeys.Mode, value))
		commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => localStorage.setItem(StorageKeys.CommeUnDesseinSecret, value))
		commeUnDesseinGUI.add(this, 'serverMode').onFinishChange((value)=> localStorage.setItem(StorageKeys.CommeUnDesseinServerMode, value))

		CommeUnDesseinSize.width = parseInt(window.localStorage.getItem('commeUnDesseinWidth')) || tipibot.drawArea.bounds.width
		CommeUnDesseinSize.height = parseInt(window.localStorage.getItem('commeUnDesseinHeight')) || tipibot.drawArea.bounds.height

		commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, 5000, 1).name('Width').onFinishChange((value)=> {
			window.localStorage.setItem('commeUnDesseinWidth', value)
		})
		commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, 5000, 1).name('Height').onFinishChange((value)=> {
			window.localStorage.setItem('commeUnDesseinHeight', value)
		})

		this.startButton = commeUnDesseinGUI.addButton('Start', ()=> this.toggleStart())
		// commeUnDesseinGUI.open()
	}

	toggleStart() {
		if(!this.started) {
			this.startButton.setName('Stop, clear queue & go home')
		} else {
			this.startButton.setName('Start')
		}
		super.toggleStart()
	}
}