import { Settings, SettingsManager, settingsManager } from "../Settings"
import { Interpreter, Communication } from "./Interpreter"

export class Makelangelo extends Interpreter {

	name = 'makelangelo'
	lastCommandWasMove = false

	constructor(communication: Communication) {
		super(communication)
		this.continueMessage = '> '
	}
	
	initialize(initializeAtHome=true) {
		// When initializing with PenPlotter on procesing:
		// M4 X840 E0.5 S6400.0 P80.0
		// Marlin1.0.2
		// echo: Last Updated: May  1 2020 18:20:12 | Author: (none, default config)
		// M1 Y250
		// Compiled: May  1 2020
		// echo: Free Memory: 5311  PlannerBufferBytes: 1232
		// G0 F1010

		// this.sendPenWidth(Settings.tipibot.penWidth)
		this.sendSpecs()
		// // Initialize at home position by default; it is always possible to set position afterward
		// // This is to ensure the tipibot is correctly automatically initialized even when the user moves it without initializing it before 
		this.sendSetPosition(initializeAtHome ? new paper.Point(Settings.tipibot.homeX, Settings.tipibot.homeY - Settings.tipibot.penOffset) : this.tipibot.getGondolaPosition())
		this.sendMaxSpeed()
		this.tipibot.initializedCommunication = true
	}

	convertToMakelangeloCoordinates(point: paper.Point) {
		let tipibotSize = new paper.Size(Settings.tipibot.width, Settings.tipibot.height)
		let makelangeloPoint = point.subtract(tipibotSize.multiply(0.5))
		makelangeloPoint.y *= -1
		return makelangeloPoint
	}

    sendSetHome(point: paper.Point=this.tipibot.getHome()) {
		super.sendSetHome(point)
		this.lastCommandWasMove = false
		point = this.convertToMakelangeloCoordinates(point)
		let message = 'Set home: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		this.queue('D6 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message)
	}

	sendSetPosition(point: paper.Point=this.tipibot.getPosition()) {
		super.sendSetPosition(point)
		this.lastCommandWasMove = false
		point = this.convertToMakelangeloCoordinates(point)
		// let lengths = this.tipibot.cartesianToLengths(point)
		// let lengthsSteps = SettingsManager.mmToSteps(lengths)
		// console.log('set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		let message = 'Set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2)
		this.queue('G92 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message)
	}

	sendMoveDirect(point: paper.Point, callback: () => any = null) {
		super.sendMoveDirect(point, callback)
		point = this.convertToMakelangeloCoordinates(point)
		let speed = Settings.tipibot.maxSpeed
		let speedInMMperSec = speed * SettingsManager.mmPerSteps()
		// let lengths = this.tipibot.cartesianToLengths(point)
		// let lengthsSteps = SettingsManager.mmToSteps(lengths)
		let message = 'Move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ', speed: ' + speedInMMperSec.toFixed(2)
		// console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		// this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + ' P' + minSpeed.toFixed(2) + '\n', message, callback)
		let speedCommand = this.lastCommandWasMove ? '' :  ' F' +  speedInMMperSec.toFixed(2)
		this.lastCommandWasMove = true
		this.queue('G1' + speedCommand + ' X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback)
	}

	sendMoveLinear(point: paper.Point, minSpeed: number=0, callback: () => any = null) {
		super.sendMoveLinear(point, minSpeed, callback)
		point = this.convertToMakelangeloCoordinates(point)
		let speed = Settings.tipibot.maxSpeed
		let speedInMMperSec = speed * SettingsManager.mmPerSteps()
		// let lengths = this.tipibot.cartesianToLengths(point)
		// let lengthsSteps = SettingsManager.mmToSteps(lengths)
		let message = 'Move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ', speed: ' + speedInMMperSec.toFixed(2) // + ', min speed: ' + minSpeed.toFixed(2)
		// console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
		// this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + ' P' + minSpeed.toFixed(2) + '\n', message, callback)
		let speedCommand = this.lastCommandWasMove ? '' :  ' F' +  speedInMMperSec.toFixed(2)
		this.lastCommandWasMove = true
		this.queue('G0' + speedCommand + ' X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback)
	}

	sendMaxSpeed(speed: number=Settings.tipibot.maxSpeed) {
		this.sendMaxSpeedAndAcceleration(speed, Settings.tipibot.acceleration)
	}

	sendAcceleration(acceleration: number=Settings.tipibot.acceleration) {
		this.sendMaxSpeedAndAcceleration(Settings.tipibot.maxSpeed, acceleration)
	}

	sendMaxSpeedAndAcceleration(speed: number=Settings.tipibot.maxSpeed, acceleration: number=Settings.tipibot.acceleration) {
		this.lastCommandWasMove = false
		let speedInMMperSec = speed * SettingsManager.mmPerSteps()
		let message = 'Set speed: ' + speedInMMperSec.toFixed(2) + ', set acceleration: ' + acceleration.toFixed(2)
		// this.queue('G0 F' + speed.toFixed(2) + ' S' + acceleration.toFixed(2) + '\n', message)
		let speedParameters = 'G0 F' + speedInMMperSec.toFixed(2) + ' A' + acceleration.toFixed(2) + '\n'
		this.queue(speedParameters, message)
	}

	sendInvertXY(invertMotorLeft: boolean=Settings.tipibot.invertMotorLeft, invertMotorRight: boolean=Settings.tipibot.invertMotorRight) {
		// console.log('invertMotorLeft: ' + invertMotorLeft + ', invertMotorRight: ' + invertMotorRight)
		// let message = 'Invert motors: left: ' + invertMotorLeft + ', right: ' + invertMotorRight
		// this.queue('M12 X' + (invertMotorLeft ? -1 : 1) + ' Y' + (invertMotorRight ? -1 : 1) + '\n', message)
		console.log('error: command not implemented')
	}

	sendProgressiveMicrosteps(progressiveMicrosteps: boolean = Settings.tipibot.progressiveMicrosteps) {
		// console.log('progressiveMicrosteps: ' + progressiveMicrosteps)
		// let message = 'Set progressiveMicrosteps: ' + progressiveMicrosteps
		// this.queue('M13 F' + (progressiveMicrosteps ? -1 : 1) + '\n', message)
		console.log('error: command not implemented')
	}
	
	sendSize(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height) {
		// todo: test
		this.lastCommandWasMove = false
		let message = 'Send size: ' + tipibotWidth.toFixed(2)
		this.queue('M4 X' + tipibotWidth.toFixed(2) + '\n', message)
	}
	
	sendStepsPerRev(stepsPerRev: number=Settings.tipibot.stepsPerRev) {
		this.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, stepsPerRev, Settings.tipibot.mmPerRev, Settings.tipibot.microstepResolution)
	}

	sendMmPerRev(mmPerRev: number=Settings.tipibot.mmPerRev) {
		this.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, mmPerRev, Settings.tipibot.microstepResolution)
	}

	sendStepMultiplier(microstepResolution: number=Settings.tipibot.microstepResolution) {
		this.sendSpecs(Settings.tipibot.width, Settings.tipibot.height, Settings.tipibot.stepsPerRev, Settings.tipibot.mmPerRev, microstepResolution)
	}

	sendSpecs(tipibotWidth: number=Settings.tipibot.width, tipibotHeight: number=Settings.tipibot.height, stepsPerRev: number=Settings.tipibot.stepsPerRev, mmPerRev: number=Settings.tipibot.mmPerRev, microstepResolution: number=Settings.tipibot.microstepResolution) {
		// let stepsPerRevolution = stepsPerRev*microstepResolution
		// let millimetersPerStep = mmPerRev / stepsPerRevolution;
		// let message = 'Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + (stepsPerRev*microstepResolution) + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep
		// console.log(message)
		// this.queue('M4 X' + tipibotWidth + ' E0.5 S' + (stepsPerRev*microstepResolution) + ' P' + mmPerRev + '\n', message)
		this.lastCommandWasMove = false

		let limitRight = tipibotWidth / 2;
		let limitLeft = -tipibotWidth / 2;
		let limitTop = tipibotHeight / 2;
		let limitBottom = -tipibotHeight / 2;

		let message = 'Set limit right: ' + limitRight.toFixed(2) + ', limit left: ' + limitLeft.toFixed(2)
		let limitsX = "M101 A0 T" + limitRight.toFixed(2) + " B" + limitLeft.toFixed(2) + "\n"
		this.queue(limitsX, message)
		message = 'Set limit top: ' + limitTop.toFixed(2) + ', limit bottom: ' + limitBottom.toFixed(2)
		let limitsY = "M101 A1 T" + limitTop.toFixed(2) + " B" + limitBottom.toFixed(2) + "\n"
		this.queue(limitsY, message)
		message = 'Set limit servo: '
		let limitsZ = "M101 A2 T170 B10\n"
		this.queue(limitsZ, message)

		this.sendSetHome()
		this.sendMaxSpeedAndAcceleration()
	}

	sendPause(delay: number, callback: ()=> void = null) {
		this.lastCommandWasMove = false

		// Todo: floor delay
		let message = 'Wait: ' + delay
		// G4 [Snn] [Pnn]
		// Wait S milliseconds and P seconds.
		let seconds = Math.floor(delay)
		let milliseconds = (seconds - delay) * 1000
		this.queue('G4 S' + milliseconds + ' P' + seconds + '\n', message, callback)
		// console.log('error: command not implemented')
	}

	sendMotorOn() {
		let message = 'Enable motors'
		this.queue('M17\n', message)
	}

	sendMotorOff() {
		let message = 'Disable motors'
		this.queue('M18\n', message)
	}

	// convertServoValue(servoValue: number) {
	// 	// pen plotter needs servo value in microseconds
	// 	// see https://www.arduino.cc/en/Reference/ServoWriteMicroseconds
	// 	return 700 + 1600 * servoValue / 180
	// }

	sendPenState(servoValue: number, delayBefore: number = 0, delayAfter: number = 0, callback: ()=> void = null) {
		this.lastCommandWasMove = false
		
		let servoSpeed = Settings.servo.speed
		let message = 'Move pen' + (servoValue == Settings.servo.position.up ? ' up' : servoValue == Settings.servo.position.down ? ' down' : '') + ': ' + servoValue + ' servo speed: ' + servoSpeed
		// servoValue = this.convertServoValue(servoValue)
		if(delayBefore > 0) {
			this.sendPause(delayBefore)
		}
		// this.queue('M340 P3 S' + servoValue + '\n', message, delayAfter <= 0 ? callback : undefined)
		
		this.queue('G0 F' + servoSpeed + ' Z' + servoValue + '\n', message, delayAfter <= 0 ? callback : undefined)

		if(delayAfter > 0) {
			this.sendPause(delayAfter, callback)
		}
	}

	sendPenUp(servoUpValue: number = SettingsManager.servoUpAngle(), delayBefore: number = Settings.servo.delay.up.before, delayAfter: number = Settings.servo.delay.up.after, callback: ()=> void = null) {
		this.sendPenState(servoUpValue, delayBefore, delayAfter, callback)
	}

	sendPenDown(servoDownValue: number = SettingsManager.servoDownAngle(), delayBefore: number = Settings.servo.delay.down.before, delayAfter: number = Settings.servo.delay.down.after, callback: ()=> void = null) {
		this.sendPenState(servoDownValue, delayBefore, delayAfter, callback)
	}

	sendChangePen(penName: string, penIndex: number) {
		let name = ''

		switch(penName) {
			case '0xff0000': name="red";	break;
			case '0x00ff00': name="green";	break;
			case '0x0000ff': name="blue";	break;
			case '0x000000': name="black";	break;
			case '0x00ffff': name="cyan";	break;
			case '0xff00ff': name="magenta";break;
			case '0xffff00': name="yellow";	break;
			case '0xffffff': name="white";	break;
			default: name = penName;  break;
		}
		
		this.queue('M117\n', 'Clear message')
		let changeString = 'Change pen to ' + name
		let continueString = 'Click to continue'
		this.queue('M06 T' + penIndex + '\n', 'Change pen to ' + parseInt(penName))
		this.queue('M117 '+ changeString + ' ' + continueString + '\n', changeString + ' ' + continueString)
		this.queue('M300 S60 P250\n', 'Beep')
		this.queue('M226\n', 'Pause for user input')
		this.queue('M117\n', 'Clear message')
	}

	sendStop(force = true) {
		if(force) {
			this.communication.send('data', 'M0\n')
			return
		}
		let message = 'Stop'
		this.queue('M0\n', message)
		console.log('error: command not implemented')
	}
}
