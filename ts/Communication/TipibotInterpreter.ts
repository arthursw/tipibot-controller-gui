import { Settings, settingsManager } from "../Settings"
import { Interpreter } from "./Interpreter"
import { PenPlotter } from "./PenPlotter"

export class TipibotInterpreter extends PenPlotter {

	readonly continueMessage = 'READY'
	readonly initializationMessage = 'Initialize'

	connectionOpened() {

	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, microstepResolution: number=Settings.tipibot.microstepResolution) {
		let stepsPerRevolution = stepsPerRev*microstepResolution
		let millimetersPerStep = mmPerRev / stepsPerRevolution;
		console.log('Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + stepsPerRev + ', microstepResolution: ' + microstepResolution + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep)
		this.queue('M4 X' + tipibotWidth + ' S' + stepsPerRev + ' F' + microstepResolution + ' P' + mmPerRev + '\n')
	}

	sendSpeed(speed: number=Settings.tipibot.speed) {
		console.log('set speed: ' + speed)
		this.queue('G0 F' + speed + '\n')
	}

	sendAcceleration(acceleration: number=Settings.tipibot.acceleration) {
		console.log('set acceleration: ' + acceleration)
		this.queue('G0 S' + acceleration + '\n')
	}

	sendSpeedAndAcceleration(speed: number=Settings.tipibot.speed, acceleration: number=Settings.tipibot.acceleration) {
		this.queue('G0 F' + speed + ' S' + acceleration + '\n')
	}

	processMessage(message: string) {
		super.processMessage(message)
		if(message.indexOf(this.initializationMessage) == 0) {
			this.initialize()
		}
	}
}
