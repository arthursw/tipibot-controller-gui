import { Settings } from "./Settings"
import { Pen } from "./Pen"
import { tipibot } from "./Tipibot"

export class VisualFeedback {

	paths: paper.Group
	circle: paper.Path
	lines: paper.Path
	drawing: boolean = false
	
	constructor() {
		this.paths = new paper.Group()
		let positon = tipibot.getPosition()
		this.circle = paper.Path.Circle(positon, Pen.HOME_RADIUS)
		this.circle.fillColor = 'yellow'
		this.circle.strokeColor = 'black'
		this.circle.strokeWidth = 1

		this.lines = new paper.Path()
		this.lines.add(new paper.Point(0, 0))
		this.lines.add(positon)
		this.lines.add(new paper.Point(Settings.tipibot.width, 0))

		this.lines.strokeWidth = 0.5
		this.lines.strokeColor = 'rgba(0, 0, 0, 0.5)'
		this.lines.dashArray = [2, 2]
		this.lines.strokeScaling = false

		document.addEventListener('MessageReceived', (event: CustomEvent)=> this.onMessageReceived(event.detail), false)
	}

	setPosition(point: paper.Point) {
		this.circle.position = point
		this.lines.segments[1].point = point
	}

	computePoint(data: string) {
		let m = data.replace(' - l: ', '')
		let messages = m.split(', r: ')
		let x = parseInt(messages[0])
		let y = parseInt(messages[1].split(' - x: ')[0])
		let lengths = new paper.Point(x, y)
		let lengthsMm = tipibot.stepsToMm(lengths)
		return tipibot.lengthsToCartesian(lengthsMm)
	}

	onMessageReceived(data: string) {
		if(data.indexOf(' - ') == 0) {
			this.onFeedback(data)
		}
	}

	onFeedback(data: string) {
		let point = this.computePoint(data)

		if(!tipibot.pen.isPenUp) {
			if(!this.drawing) {
				let path = new paper.Path()
				path.strokeWidth = Settings.tipibot.penWidth
				path.strokeColor = 'black'
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

}
