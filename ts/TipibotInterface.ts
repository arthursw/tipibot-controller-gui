import { GUI, Controller } from "./GUI"

export interface TipibotInterface {
	tipibotArea: paper.Path
	drawArea: paper.Path
	initializedCommunication: boolean
	pen: { tipibotWidthChanged: (sendChange: boolean)=>void, isPenUp: boolean }

	createGUI(gui:GUI): void
	getPosition(): paper.Point
	setX(x: number, sendChange?: boolean): void
	setY(y: number, sendChange?: boolean): void
	toggleSetPosition(setPosition?: boolean): void
	setHome(setPosition?: boolean):  void

	sizeChanged(sendChange: boolean): void
	drawAreaChanged(sendChange: boolean): void

	penUp(servoUpValue?: number, servoUpTempoBefore?: number): void
	penDown(servoDownValue?: number, servoDownTempoBefore?: number): void

	cartesianToLengths(point: paper.Point): paper.Point
	lengthsToCartesian(lengths: paper.Point): paper.Point

	sendInvertXY(): void
	sendProgressiveMicrosteps(): void
	maxSpeedChanged(sendChange?: boolean): void
	accelerationChanged(sendChange?: boolean): void
	stepsPerRevChanged(sendChange?: boolean): void
	mmPerRevChanged(sendChange?: boolean): void
	microstepResolutionChanged(sendChange?: boolean): void
	penWidthChanged(sendChange?: boolean): void
	servoChanged(sendChange: boolean): void

	windowResize(): void
	feedbackChanged(sendChange: boolean): void
}