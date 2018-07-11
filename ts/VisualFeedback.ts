import { Settings, SettingsManager } from "./Settings"
import { Pen } from "./Pen"
import { tipibot } from "./Tipibot"

export let visualFeedback: VisualFeedback = null

export class VisualFeedback {

	group: paper.Group
	paths: paper.Group
	subTargets: paper.Group
	circle: paper.Path
	lines: paper.Path
	drawing: boolean = false

	readonly positionPrefix = '-p: l: '
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

		let positon = tipibot.getPosition()
		this.circle = paper.Path.Circle(positon, Pen.HOME_RADIUS)
		this.circle.fillColor = 'yellow'
		this.circle.strokeColor = 'black'
		this.circle.strokeWidth = 1
		this.group.addChild(this.circle)

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(positon)
		this.lines.add(new paper.Point(Settings.tipibot.width, 0))

		this.lines.strokeWidth = 0.5
		this.lines.strokeColor = 'rgba(0, 0, 0, 0.5)'
		this.lines.dashArray = [2, 2]
		this.lines.strokeScaling = false
		this.group.addChild(this.lines)

		document.addEventListener('MessageReceived', (event: CustomEvent)=> this.onMessageReceived(event.detail), false)
		document.addEventListener('SettingChanged', (event: CustomEvent)=> this.onSettingChanged(event), false)

		this.group.sendToBack()
	}

	clear() {
		this.paths.removeChildren()
		this.subTargets.removeChildren()
	}

	setVisible(visible: boolean) {
		this.group.visible = visible
	}

	setPosition(point: paper.Point) {
		this.circle.position = point
		this.lines.segments[1].point = point
	}

	computePoint(data: string, prefix: string) {
		let m = data.replace(prefix, '')
		let messages = m.split(', r: ')
		let x = parseInt(messages[0])
		let y = parseInt(messages[1])
		let lengths = new paper.Point(x, y)
		let lengthsMm = SettingsManager.stepsToMm(lengths)
		return tipibot.lengthsToCartesian(lengthsMm)
	}

	onMessageReceived(data: string) {
		if(data.indexOf(this.positionPrefix) == 0) {
			this.updatePosition(data)
		} else if(data.indexOf(this.subTargetPrefix) == 0) {
			this.setSubTarget(data)
		}
	}

	updatePosition(data: string) {
		let point = this.computePoint(data, this.positionPrefix)

		if(!tipibot.pen.isPenUp) {
			if(!this.drawing) {
				let path = new paper.Path()
				path.strokeWidth = Settings.tipibot.penWidth
				path.strokeColor = 'black'
				path.strokeScaling = true
				this.paths.addChild(path)
				this.drawing = true
			} else {
				let path = <paper.Path>this.paths.lastChild
				path.add(point)
			}
		} else {
			this.drawing = false
		}

		this.setPosition(point)
	}

	setSubTarget(data: string) {
		let point = this.computePoint(data, this.subTargetPrefix)

		if(!tipibot.pen.isPenUp) {
			let path = new paper.Path()
			path.strokeWidth = 0.1
			path.strokeColor = 'red'
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
	}
}