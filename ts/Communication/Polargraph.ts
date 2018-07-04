import { Settings, SettingsManager, settingsManager } from "../Settings"
import { Interpreter, Command } from "./Interpreter"

const commands = {
	CMD_CHANGELENGTH: "C01,",
	CMD_CHANGEPENWIDTH: "C02,",
	CMD_CHANGEMOTORSPEED: "C03,",
	CMD_CHANGEMOTORACCEL: "C04,",
	CMD_DRAWPIXEL: "C05,",
	CMD_DRAWSCRIBBLEPIXEL: "C06,",
	CMD_DRAWRECT: "C07,",
	CMD_CHANGEDRAWINGDIRECTION: "C08,",
	CMD_SETPOSITION: "C09,",
	CMD_TESTPATTERN: "C10,",
	CMD_TESTPENWIDTHSQUARE: "C11,",
	CMD_TESTPENWIDTHSCRIBBLE: "C12,",
	CMD_PENDOWN: "C13,",
	CMD_PENUP: "C14,",
	CMD_DRAWSAWPIXEL: "C15,",
	CMD_DRAWROUNDPIXEL: "C16,",
	CMD_CHANGELENGTHDIRECT: "C17,",
	CMD_TXIMAGEBLOCK: "C18,",
	CMD_STARTROVE: "C19,",
	CMD_STOPROVE: "C20,",
	CMD_SET_ROVE_AREA: "C21,",
	CMD_LOADMAGEFILE: "C23,",
	CMD_CHANGEMACHINESIZE: "C24,",
	CMD_CHANGEMACHINENAME: "C25,",
	CMD_REQUESTMACHINESIZE: "C26,",
	CMD_RESETMACHINE: "C27,",
	CMD_DRAWDIRECTIONTEST: "C28,",
	CMD_CHANGEMACHINEMMPERREV: "C29,",
	CMD_CHANGEMACHINESTEPSPERREV: "C30,",
	CMD_SETMOTORSPEED: "C31,",
	CMD_SETMOTORACCEL: "C32,",
	CMD_MACHINE_MODE_STORE_COMMANDS: "C33,",
	CMD_MACHINE_MODE_EXEC_FROM_STORE: "C34,",
	CMD_MACHINE_MODE_LIVE: "C35,",
	CMD_RANDOM_DRAW: "C36,",
	CMD_SETMACHINESTEPMULTIPLIER: "C37,",
	CMD_START_TEXT: "C38,",
	CMD_DRAW_SPRITE: "C39,",
	CMD_CHANGELENGTH_RELATIVE: "C40,",
	CMD_SWIRLING: "C41,",
	CMD_DRAW_RANDOM_SPRITE: "C42,",
	CMD_DRAW_NORWEGIAN: "C43,",
	CMD_DRAW_NORWEGIAN_OUTLINE: "C44,",
	CMD_SETPENLIFTRANGE: "C45,",
	CMD_SELECT_ROVE_SOURCE_IMAGE: "C46",
	CMD_RENDER_ROVE: "C47",
	CMD_ACTIVATE_MACHINE_BUTTON: "C49",
	CMD_DEACTIVATE_MACHINE_BUTTON: "C50",
	CMD_DELAY: "C60,"
}

export class Polargraph extends Interpreter {

	keepTipibotAwakeInterval: number = null

	// startKeepingTipibotAwake() {
	// 	this.keepTipibotAwakeInterval = setTimeout(()=> this.keepTipibotAwake(), 30000)
	// }

	// keepTipibotAwake() {
	// 	this.sendPenUp()
	// }

	send(command: Command) {
		// let commandCode = command.data.substr(0, 3)
		// for(let commandName in commands) {
		// 	let code: string = (<any>commands)[commandName].substr(0, 3)
		// 	if(code == commandCode) {
		// 		console.log("Send command: " + commandName)
		// 	}
		// }
		command.data += String.fromCharCode(10)
		super.send(command)
	}
	
	queue(data: string, callback: () => any = null) {
		// clearTimeout(this.keepTipibotAwakeInterval)
		// this.keepTipibotAwakeInterval = null

		let commandCode = data.substr(0, 3)
		for(let commandName in commands) {
			let code: string = (<any>commands)[commandName].substr(0, 3)
			// if(code == commandCode) {
			// 	console.log("Queue command: " + commandName)
			// }
		}
		super.queue(data, callback)
	}

	queueEmpty() {
		// this.startKeepingTipibotAwake()
	}

	getMaxSegmentLength() {
		return 2;
	}

	sendMoveToNativePosition(direct: boolean, p: paper.Point, callback: () => any = null ) {
		p = this.tipibot.cartesianToLengths(p)
		p = SettingsManager.mmToSteps(p).divide(Settings.tipibot.microstepResolution)
		let command: string = null;
		if (direct) {
			command = commands.CMD_CHANGELENGTHDIRECT + Math.round(p.x) + "," + Math.round(p.y) + "," + this.getMaxSegmentLength() + ',END';
		}
		else {
			command = commands.CMD_CHANGELENGTH + Math.round(p.x) + "," + Math.round(p.y) + ',END';
		}

		this.queue(command, callback);
	}

    sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
    	point = this.tipibot.cartesianToLengths(point)
		let pointInSteps = SettingsManager.mmToSteps(point).divide(Settings.tipibot.microstepResolution);
		let command = commands.CMD_SETPOSITION + Math.round(pointInSteps.x) + "," + Math.round(pointInSteps.y) + ',END';
		this.queue(command);
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		this.sendMoveToNativePosition(true, point, callback);
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		// Just like in Polagraph controller:
		// this.sendMoveToNativePosition(false, point, callback);
		this.sendMoveToNativePosition(true, point, callback);
	}

	sendMaxSpeed(speed: number=Settings.tipibot.maxSpeed, acceleration: number=Settings.tipibot.acceleration) {
		this.queue(commands.CMD_SETMOTORSPEED + speed.toFixed(2) + ',1,END');
		this.queue(commands.CMD_SETMOTORACCEL + acceleration.toFixed(2) + ',1,END');
	}
	
	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
		this.queue(commands.CMD_CHANGEMACHINESIZE + tipibotWidth + ',' + tipibotHeight + ',END');
	}
	
	sendStepsPerRev(stepsPerRev: number=Settings.tipibot.stepsPerRev) {
		
		this.queue(commands.CMD_CHANGEMACHINESTEPSPERREV + stepsPerRev + ',END');
	}

	sendMmPerRev(mmPerRev: number=Settings.tipibot.mmPerRev) {
		this.queue(commands.CMD_CHANGEMACHINEMMPERREV + mmPerRev + ',END');
	}

	sendStepMultiplier(microstepResolution: number=Settings.tipibot.microstepResolution) {
		this.queue(commands.CMD_SETMACHINESTEPMULTIPLIER + microstepResolution + ',END');
	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, microstepResolution: number=Settings.tipibot.microstepResolution) {
		this.sendSize(tipibotWidth, tipibotHeight)
		this.sendMmPerRev(mmPerRev)
		this.sendStepsPerRev(stepsPerRev)
		this.sendStepMultiplier(microstepResolution)
	}

	sendPause(delay: number) {
	}

	sendMotorOff() {
	}

	sendPenLiftRange(servoDownValue: number=SettingsManager.servoDownAngle(), servoUpValue: number=SettingsManager.servoUpAngle()) {
		this.queue(commands.CMD_SETPENLIFTRANGE + servoDownValue + ',' + servoUpValue + ',1,END');
	}

	sendPenDelays(servoDownDelay: number=Settings.servo.delay.down.before, servoUpDelay: number=Settings.servo.delay.up.before) {
	}

	sendPenUp(servoUpValue: number = SettingsManager.servoUpAngle(), servoUpTempoBefore: number = Settings.servo.delay.up.before, servoUpTempoAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		if(servoUpTempoBefore > 0) {
			this.queue(commands.CMD_DELAY + servoUpTempoBefore + ",END", callback);
		}
		this.queue(commands.CMD_PENUP + SettingsManager.servoUpAngle() + ",END", callback);
		// this.queue(commands.CMD_PENUP + "END", callback);
		if(servoUpTempoAfter > 0) {
			this.queue(commands.CMD_DELAY + servoUpTempoAfter + ",END", callback);
		}
	}

	sendPenDown(servoDownValue: number = SettingsManager.servoDownAngle(), servoDownTempoBefore: number = Settings.servo.delay.down.before, servoDownTempoAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		if(servoDownTempoBefore > 0) {
			this.queue(commands.CMD_DELAY + servoDownTempoBefore + ",END", callback);
		}
		this.queue(commands.CMD_PENDOWN + SettingsManager.servoDownAngle() + ",END", callback);
		// this.queue(commands.CMD_PENDOWN + "END", callback);
		if(servoDownTempoAfter > 0) {
			this.queue(commands.CMD_DELAY + servoDownTempoAfter + ",END", callback);
		}
	}

	sendStop() {
	}

	sendPenWidth(penWidth: number) {
		this.queue(commands.CMD_CHANGEPENWIDTH + penWidth.toFixed(2) + ',END')
	}
}
