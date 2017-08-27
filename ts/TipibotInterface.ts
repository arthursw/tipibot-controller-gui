import { GUI } from "./GUI"

export interface TipibotInterface {

	createGUI: (gui:GUI)=> void
	getPosition: ()=> paper.Point
	setX: (x: number)=> void
	setY: (y: number)=> void
	settingChanged: (parentName: string, name: string, value: any)=> void
	settingsChanged: ()=> void
	
	penUp: (servoUpValue?: number, servoUpTempo?: number)=> void
	penDown: (servoDownValue?: number, servoDownTempo?: number)=> void

	isPenUp: boolean

	mmToSteps(point: paper.Point): paper.Point
}