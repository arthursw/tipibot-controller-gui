import { Rectangle, Circle} from "./Shapes"
import { GUI } from "./GUI"

export interface TipibotInterface {
	tipibotArea: Rectangle
	drawArea: Rectangle
	initializedCommunication: boolean
	pen: { tipibotWidthChanged: (sendChange: boolean)=>void }

	createGUI: (gui:GUI)=> void
	getPosition: ()=> paper.Point
	setX: (x: number, sendChange?: boolean)=> void
	setY: (y: number, sendChange?: boolean)=> void
	toggleSetPosition: (setPosition?: boolean)=> void
	setHome: (setPosition?: boolean)=> void

	sizeChanged: (sendChange: boolean) => void
	drawAreaChanged: (sendChange: boolean) => void

	penUp: (servoUpValue?: number, servoUpTempoBefore?: number)=> void
	penDown: (servoDownValue?: number, servoDownTempoBefore?: number)=> void

	mmToSteps(point: paper.Point): paper.Point
	stepsToMm(point: paper.Point): paper.Point
	cartesianToLengths(point: paper.Point): paper.Point
	lengthsToCartesian(lengths: paper.Point): paper.Point

	sendInvertXY: ()=> void
	sendProgressiveMicrosteps: ()=> void
	speedChanged: (sendChange?: boolean)=> void
	stepsPerRevChanged: (sendChange?: boolean)=> void
	mmPerRevChanged: (sendChange?: boolean)=> void
	stepMultiplierChanged: (sendChange?: boolean)=> void
	penWidthChanged: (sendChange?: boolean)=> void
	servoChanged: (sendChange: boolean)=> void

	windowResize: ()=>void
}