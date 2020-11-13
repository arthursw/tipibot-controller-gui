import { GUI, Controller } from "./GUI"

export interface TipibotInterface {
	tipibotArea: paper.Path
	drawArea: paper.Path
	initializedCommunication: boolean
	motorsEnabled: boolean
	pen: { tipibotWidthChanged: (sendChange: boolean)=>void, isUp: boolean }

	getPosition(): paper.Point
	getHome(): paper.Point
	getGondolaPosition(): paper.Point
	setX(x: number, sendChange?: boolean): void
	setY(y: number, sendChange?: boolean): void
	toggleSetPosition(setPosition?: boolean): void
	setHome(setPosition?: boolean):  void
	setPosition(point: paper.Point, sendChange?: boolean, updateSliders?: boolean): void

	sizeChanged(sendChange: boolean): void
	drawAreaChanged(sendChange: boolean): void

	penUp(servoUpValue?: number, servoUpTempoBefore?: number): void
	penDown(servoDownValue?: number, servoDownTempoBefore?: number): void

	cartesianToLengths(point: paper.Point): paper.Point
	lengthsToCartesian(lengths: paper.Point): paper.Point

	sendInvertXY(): void
	sendProgressiveMicrosteps(): void
	drawSpeedChanged(sendChange?: boolean): void
	maxSpeedChanged(sendChange?: boolean): void
	accelerationChanged(sendChange?: boolean): void
	stepsPerRevChanged(sendChange?: boolean): void
	mmPerRevChanged(sendChange?: boolean): void
	microstepResolutionChanged(sendChange?: boolean): void
	penWidthChanged(sendChange?: boolean): void
	servoChanged(sendChange: boolean, up: boolean, specs: boolean): void

	windowResize(): void
	feedbackChanged(sendChange: boolean): void
}