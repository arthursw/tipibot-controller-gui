import { Settings, settingsManager } from "../Settings"
import { CommunicationInterface } from "./CommunicationInterface"


const CMD_CHANGELENGTH = "C01,";
const CMD_CHANGEPENWIDTH = "C02,";
const CMD_CHANGEMOTORSPEED = "C03,";
const CMD_CHANGEMOTORACCEL = "C04,";
const CMD_DRAWPIXEL = "C05,";
const CMD_DRAWSCRIBBLEPIXEL = "C06,";
const CMD_DRAWRECT = "C07,";
const CMD_CHANGEDRAWINGDIRECTION = "C08,";
const CMD_SETPOSITION = "C09,";
const CMD_TESTPATTERN = "C10,";
const CMD_TESTPENWIDTHSQUARE = "C11,";
const CMD_TESTPENWIDTHSCRIBBLE = "C12,";
const CMD_PENDOWN = "C13,";
const CMD_PENUP = "C14,";
const CMD_DRAWSAWPIXEL = "C15,";
const CMD_DRAWROUNDPIXEL = "C16,";
const CMD_CHANGELENGTHDIRECT = "C17,";
const CMD_TXIMAGEBLOCK = "C18,";
const CMD_STARTROVE = "C19,";
const CMD_STOPROVE = "C20,";
const CMD_SET_ROVE_AREA = "C21,";
const CMD_LOADMAGEFILE = "C23,";
const CMD_CHANGEMACHINESIZE = "C24,";
const CMD_CHANGEMACHINENAME = "C25,";
const CMD_REQUESTMACHINESIZE = "C26,";
const CMD_RESETMACHINE = "C27,";
const CMD_DRAWDIRECTIONTEST = "C28,";
const CMD_CHANGEMACHINEMMPERREV = "C29,";
const CMD_CHANGEMACHINESTEPSPERREV = "C30,";
const CMD_SETMOTORSPEED = "C31,";
const CMD_SETMOTORACCEL = "C32,";
const CMD_MACHINE_MODE_STORE_COMMANDS = "C33,";
const CMD_MACHINE_MODE_EXEC_FROM_STORE = "C34,";
const CMD_MACHINE_MODE_LIVE = "C35,";
const CMD_RANDOM_DRAW = "C36,";
const CMD_SETMACHINESTEPMULTIPLIER = "C37,";
const CMD_START_TEXT = "C38,";
const CMD_DRAW_SPRITE = "C39,";
const CMD_CHANGELENGTH_RELATIVE = "C40,";
const CMD_SWIRLING = "C41,";
const CMD_DRAW_RANDOM_SPRITE = "C42,";
const CMD_DRAW_NORWEGIAN = "C43,";
const CMD_DRAW_NORWEGIAN_OUTLINE = "C44,";
const CMD_SETPENLIFTRANGE = "C45,";
const CMD_SELECT_ROVE_SOURCE_IMAGE = "C46";
const CMD_RENDER_ROVE = "C47";

const CMD_ACTIVATE_MACHINE_BUTTON = "C49";
const CMD_DEACTIVATE_MACHINE_BUTTON = "C50";


export class Polargraph extends CommunicationInterface {

	connectionOpened(description: string) {
		this.sendPenWidth(Settings.tipibot.penWidth)
		this.sendTipibotSpecs()
		this.sendSpeed()
	}

	getMaxSegmentLength() {
		return 2;
	}

	sendMoveToNativePosition(direct: boolean, p: paper.Point, callback: () => any = null ) {
		let command: string = null;
		if (direct) {
			command = CMD_CHANGELENGTHDIRECT + Math.round(p.x) + "," + Math.round(p.y) + "," + this.getMaxSegmentLength() + ',END';
		}
		else {
			command = CMD_CHANGELENGTH + Math.round(p.x) + "," + Math.round(p.y) + ',END';
		}

		this.queue(command, callback);
	}

    sendSetPosition(point: paper.Point) {
		let pointInSteps = this.tipibot.mmToSteps(point);
		let command = CMD_SETPOSITION + Math.round(pointInSteps.x + 0.5) + "," + Math.round(pointInSteps.y + 0.5) + ',END';
		this.queue(command);
    }

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		this.sendMoveToNativePosition(true, point, callback);
	}

	sendMoveLinear(point: paper.Point, callback: () => any = null) {
		this.sendMoveToNativePosition(false, point, callback);
	}

	sendSpeed(speed: number=Settings.tipibot.speed, acceleration: number=Settings.tipibot.acceleration) {
		this.queue(CMD_SETMOTORSPEED + speed.toFixed(2) + ',1,END');
		this.queue(CMD_SETMOTORACCEL + acceleration.toFixed(2) + ',1,END');
	}
	
	sendTipibotSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
		this.queue(CMD_CHANGEMACHINESIZE + tipibotWidth + ',' + tipibotHeight + ',END');
	}

	sendTipibotSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, stepMultiplier: number=Settings.tipibot.stepMultiplier) {
		this.queue(CMD_CHANGEMACHINESIZE + tipibotWidth + ',' + tipibotHeight + ',END');
		this.queue(CMD_CHANGEMACHINEMMPERREV + mmPerRev + ',END');
		this.queue(CMD_CHANGEMACHINESTEPSPERREV + stepsPerRev + ',END');
		this.queue(CMD_SETMACHINESTEPMULTIPLIER + stepMultiplier + ',END');
	}

	sendPause(delay: number) {
	}

	sendMotorOff() {
	}

	sendPenLiftRange(servoDownValue: number, servoUpValue: number) {
		this.queue(CMD_SETPENLIFTRANGE + servoDownValue + ',' + servoUpValue + ',1,END');
	}

	sendPenUp(servoUpValue: number = Settings.servo.position.up, servoUpTempo: number = Settings.servo.delay.up) {
		if (servoUpValue != Settings.servo.position.up) {
			Settings.servo.position.up = servoUpValue;
			settingsManager.updateSliders();
			this.sendPenLiftRange(Settings.servo.position.down, Settings.servo.position.up);
		}
		this.queue(CMD_PENDOWN + "END");
	}

	sendPenDown(servoDownValue: number = Settings.servo.position.down, servoDownTempo: number = Settings.servo.delay.down) {
		if (servoDownValue != Settings.servo.position.down) {
			Settings.servo.position.down = servoDownValue;
			settingsManager.updateSliders();
			this.sendPenLiftRange(Settings.servo.position.down, Settings.servo.position.up);
		}
		this.queue(CMD_PENUP + "END");
	}

	sendStop() {
	}

	sendPenWidth(penWidth: number) {
		this.queue(CMD_CHANGEPENWIDTH + penWidth.toFixed(2) + ',END')
	}
}
