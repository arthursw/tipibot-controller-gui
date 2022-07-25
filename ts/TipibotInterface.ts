import * as paperjs from 'paper';

export enum MoveType {
    Direct,
    Linear,
}

export interface TipibotInterface {
	tipibotArea: paper.Path
	drawArea: paper.Path
	initializedCommunication: boolean
	motorsEnabled: boolean
	pen: { tipibotWidthChanged: (sendChange: boolean)=>void } //, isUp: boolean }

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

	move(moveType: MoveType, point: paper.Point, minSpeed?: number, maxSpeed?: number, callback?: () => any, movePen?:boolean): void
	penUp(servoUpValue?: number, servoUpTempoBefore?: number): void
	penDown(servoDownValue?: number, servoDownTempoBefore?: number): void
	moveGroundStation(position: number, callback?:()=> any): void
	moveAboveStation(callback?:()=> any): void
	pickPen(name: string, force?:boolean, callback?:()=> any): void
	changePen(name: string, callback?:()=> any): void
	dropPen(name?: string, force?:boolean, callback?:()=> any): void
	openPen(force?:boolean, callback?:()=> any): void
	activatePen(callback?:()=> any): void
	closePen(force?:boolean, callback?:()=> any): void

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
	servoChanged(sendChange: boolean, penState: string, specs: boolean): void

	windowResize(): void
	feedbackChanged(sendChange: boolean): void
}