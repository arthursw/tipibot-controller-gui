import { Settings, paper, stepsToMm } from "./Settings"
import { Pen } from "./Pen"
import { Tipibot } from "./TipibotStatic"

export let visualFeedback: VisualFeedback = null

export class VisualFeedback {

	group: paper.Group
	paths: paper.Group
	subTargets: paper.Group
	circle: paper.Path
	lines: paper.Path
	offsetLine: paper.Path
	drawing: boolean = false
	isPenUp: boolean = true

	readonly positionPrefix = '-p: l: '
	readonly penPrefix = '-pen: '
	readonly subTargetPrefix = '-st: l: '
	
	static initialize() {
		visualFeedback = new VisualFeedback()
	}

	constructor() {
		this.paths = new paper.Group()
		this.subTargets = new paper.Group()
		this.group = new paper.Group()
		this.group.addChild(this.paths)
		this.group.addChild(this.subTargets)

		let positon = Tipibot.tipibot.getPosition()
		let gondolaPosition = Tipibot.tipibot.getGondolaPosition()
		this.circle = new paper.Path.Circle(positon, Pen.HOME_RADIUS)
		this.circle.fillColor = new paper.Color('rgba(255, 193, 7, 0.25)')
		this.circle.strokeColor = new paper.Color('black')
		this.circle.strokeWidth = 1
		this.group.addChild(this.circle)

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(gondolaPosition)
		this.lines.add(new paper.Point(Settings.tipibot.width, 0))

		this.lines.strokeWidth = 0.5
		this.lines.strokeColor = new paper.Color('rgba(0, 0, 0, 0.5)')
		this.lines.dashArray = [2, 2]
		this.lines.strokeScaling = false
		this.group.addChild(this.lines)

		this.offsetLine = new paper.Path()
		this.offsetLine.add(gondolaPosition)
		this.offsetLine.add(positon)
		this.offsetLine.dashArray = [2, 2]
		this.group.addChild(this.offsetLine)

		document.addEventListener('MessageReceived', (event: CustomEvent)=> this.onMessageReceived(event.detail), false)
		document.addEventListener('SettingChanged', (event: CustomEvent)=> this.onSettingChanged(event), false)
		document.addEventListener('ClearFeedback', (event: CustomEvent)=> this.clear(), false)
		document.addEventListener('ZoomChanged', (event: CustomEvent)=> this.onZoomChanged(), false)

		this.group.sendToBack()
	}

	clear() {
		this.paths.removeChildren()
		this.subTargets.removeChildren()
	}

	onZoomChanged() {
		this.circle.applyMatrix = false
		this.circle.scaling = new paper.Point(1 / paper.project.view.zoom, 1 / paper.project.view.zoom)
	}

	setVisible(visible: boolean) {
		this.group.visible = visible
	}

	setPosition(point: paper.Point) {
		this.circle.position = point
		this.offsetLine.segments[1].point = point
		let center = new paper.Point(point.x, point.y - Settings.tipibot.penOffset)
		this.lines.segments[1].point = center
		this.offsetLine.segments[0].point = center
	}

	computePoint(data: string, prefix: string) {
		let m = data.replace(prefix, '')
		let messages = m.split(', r: ')
		let x = parseInt(messages[0])
		let y = parseInt(messages[1])
		let lengths = new paper.Point(x, y)
		let lengthsMm = stepsToMm(lengths)
		return Tipibot.tipibot.lengthsToCartesian(lengthsMm)
	}

	onMessageReceived(data: string) {
		if(data.indexOf(this.positionPrefix) == 0) {
			this.updatePosition(data)
		} else if(data.indexOf(this.subTargetPrefix) == 0) {
			this.setSubTarget(data)
		} else if(data.indexOf(this.penPrefix) == 0) {
			this.updatePen(data)
		}
	}

	updatePosition(data: string) {
		let point = this.computePoint(data, this.positionPrefix)
		
		if((<any>point).isNaN()) {
			return
		}

		if(!this.isPenUp) {
			if(!this.drawing && this.paths) {
				let path = new paper.Path()
				path.strokeWidth = Settings.tipibot.penWidth
				path.strokeColor = new paper.Color('black')
				path.strokeScaling = true
				path.add(point)
				this.paths.addChild(path)
				this.drawing = true
			} else if(this.paths.lastChild != null) {
				let path = <paper.Path>this.paths.lastChild
				path.add(point)
			}
		} else {
			this.drawing = false
		}

		this.setPosition(point)
	}

	updatePen(data: string) {
		let m = data.replace(this.penPrefix, '')
		let position = Math.round(parseFloat(m))
		this.isPenUp = Math.abs(position - Math.round(Settings.servo.position.up)) < 0.1 ? true : Math.abs(position - Math.round(Settings.servo.position.down)) < 0.1 ? false : null
		if(Settings.servo.position.invert) {
			this.isPenUp = !this.isPenUp
		}
		this.circle.fillColor = new paper.Color( this.isPenUp ? 'rgba(255, 193, 7, 0.25)' : 'rgba(255, 193, 7, 0.9)' )
	}

	setSubTarget(data: string) {
		let point = this.computePoint(data, this.subTargetPrefix)

		if(!this.isPenUp) {
			let path = new paper.Path()
			path.strokeWidth = 0.1
			path.strokeColor = new paper.Color('red')
			path.strokeScaling = true
			this.subTargets.addChild(path)

			let size = 2
			path.add(point.add(size))
			path.add(point.add(-size))
			path.add(point)
			path.add(point.add(new paper.Point(size, -size)))
			path.add(point.add(new paper.Point(-size, size)))

		}
	}

	onSettingChanged(event: CustomEvent) {
		if(event.detail.all || event.detail.parentNames[0] == 'Machine dimensions') {
			if(event.detail.name == 'width') {
				this.lines.segments[2].point.x = Settings.tipibot.width
			}
		}
		
		if(event.detail.all || event.detail.parentNames[0] == 'Feedback') {
			this.setVisible(Settings.feedback.enable)
		}

		if(event.detail.all || event.detail.parentNames[0] == 'Pen' && event.detail.name == 'penOffset') {
			this.setPosition(this.circle.position)
		}
	}
}