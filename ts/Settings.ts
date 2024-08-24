export let paper = require('paper');
export let isServer = (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined')
export let document: Document = isServer ? (new EventTarget() as any) : window.document
export let createEvent = (name:string, data:any=null):any => isServer ? new Event(name, data) : new CustomEvent(name, data)

let tipibotHeight = 2020
let tipibotWidth = 1780
let tipibotStringLength = 2640

let paperHeight = 900
let paperWidth = 1200

let homeX = 0
let homeY = 388

export let Settings = {
	websocketServerURL: 'localhost:6842',
	autoConnect: true,
	firmware: 'Tipibot',
	forceLinearMoves: true,
	forceInitialization: true,
	// disableMouseInteractions: false,
	disableCommandList: false,
	enableTouchKeyboard: false,
	tipibot: {
		width: tipibotWidth,
		height: tipibotHeight,
		stringLength: tipibotStringLength,
		enableLimits: true,
		limitH: 250,
		limitV: 500,
		homeX: tipibotWidth / 2,
		homeY: paperHeight + homeY,
		invertMotorLeft: false,
		invertMotorRight: false,
		drawSpeed: 330,
		manoeuverSpeed: 1000,
		maxSpeed: 4042,
		acceleration: 200,
		stepsPerRev: 200,
		microstepResolution: 32,
		mmPerRev: 96,
		progressiveMicrosteps: false,
		penWidth: 2,
		penOffset: 0
	},
	servo: {
		delta: 5,
		speed: 500,
		position: {
			invert: false,
			up: 10,
			down: 30,
			close: 100,
			drop: 170,
		},
		delay: {
			up: {
				before: 0,
				after: 0,
			},
			down: {
				before: 1000,
				after: 2000,
			},
		}
	},
	groundStation: {
		speed: 7000,
		useColors: false,
		activateWhenOpening: false,
		penDownWhenClosing: true,
		y: {
			above: 200,
			cap: 100,
			station: 10,
			pen: 0,
		},
		x: {
			station: 0,
			red: 100,
			greend: 200,
			blue: 300,
			black: 400,
		},
		extruder: {
			drop: 0,
			close: 50,
			activate: 30,
			open: -300,
		}
	},
	drawArea: {
		y: homeY,
		width: paperWidth,
		height: paperHeight
	},
	calibration: {
		grid: new Array<Array<number[]>>(),
		apply: false,
		maxStepSize: 10
	},
	plot: {
		showPoints: false,
		optimizeTrajectories: true,
		disableMotorsOnceFinished: false,
		flatten: true,
		flattenPrecision: 0.25,
		subdivide: false,
		maxSegmentLength: 10,
		// fullSpeed: true,
		// maxCurvatureFullspeed: 45
	},
	feedback: {
		enable: true,
		rate: 10
	}
}

export let mmPerSteps = ()=> {
	return Settings.tipibot.mmPerRev / ( Settings.tipibot.stepsPerRev * Settings.tipibot.microstepResolution );
}

export let stepsPerMm = ()=> {
	return ( Settings.tipibot.stepsPerRev * Settings.tipibot.microstepResolution ) / Settings.tipibot.mmPerRev;
}

export let mmToSteps = (point: paper.Point): paper.Point => {
	return point.multiply(stepsPerMm())
}

export let stepsToMm = (point: paper.Point): paper.Point => {
	return point.multiply(mmPerSteps())
}

export let servoUpAngle = () => {
	return Settings.servo.position.invert ? Settings.servo.position.down : Settings.servo.position.up
}

export let servoDownAngle = () => {
	return Settings.servo.position.invert ?  Settings.servo.position.up : Settings.servo.position.down
}

export let autoHomePosition = () => {
	let autoHomePositionX = Settings.tipibot.width / 2
	return new paper.Point(autoHomePositionX, Math.sqrt(Settings.tipibot.stringLength * Settings.tipibot.stringLength - autoHomePositionX * autoHomePositionX))
}

export let copyObjectProperties = (target: any, source: any) => {
	if(source == null) {
		return
	}
	for(let property in target) {
		if(target[property] instanceof Array) {
			target[property] = source[property].slice()
		}
		else if(typeof(target[property]) === 'object') {
			copyObjectProperties(target[property], source[property])
		} else if (source[property] != null) {
			if(typeof target[property] == typeof source[property]) {
				target[property] = source[property]
			}
		}
	}
}

export let copyObjectPropertiesFromJSON = (target: any, jsonSource: any) => {
	if(jsonSource == null) {
		return
	}
	copyObjectProperties(target, JSON.parse(jsonSource))
}
