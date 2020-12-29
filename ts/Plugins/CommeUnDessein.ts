import { Settings, settingsManager } from "../Settings"
import { GUI, Controller } from "../GUI"
import { SVGPlot } from "../Plot"
import { communication } from "../Communication/Communication"
import { tipibot } from "../Tipibot"
import { visualFeedback } from "../VisualFeedback"


const RequestTimeout = 2000

let scale = 1000

let CommeUnDesseinSize = new paper.Size(4000, 3000)

let commeUnDesseinToDrawArea = function(point: paper.Point): paper.Point {
	let drawArea = tipibot.drawArea.bounds
	let CommeUnDesseinPosition = new paper.Point(-CommeUnDesseinSize.width/2, -CommeUnDesseinSize.height/2)
	const CommeUnDesseinDrawArea = new paper.Rectangle(CommeUnDesseinPosition, CommeUnDesseinSize)
	return point.subtract(CommeUnDesseinDrawArea.topLeft).divide(CommeUnDesseinDrawArea.size).multiply(drawArea.size).add(drawArea.topLeft)
}

let posOnPlanetToProject = function(point: paper.Point, planet: paper.Point): paper.Point {
	if (point.x == null && point.y == null) {
		point = new paper.Point(point)
	}
	let x = planet.x * 180 + point.x
	let y = planet.y * 90 + point.y
	x *= scale
	y *= scale
	return new paper.Point(x, y)
}

let posOnPlanetToDrawArea = function(point: paper.Point, planet: paper.Point) {
	let posOnProject = posOnPlanetToProject(point, planet)
	return commeUnDesseinToDrawArea(posOnProject)
}

let commeundesseinAjaxURL = '/ajaxCallNoCSRF/'

const ModeKey = 'Mode'
const OriginKey = 'Origin'
const CommeUnDesseinSecretKey = 'CommeUnDesseinSecret'


// $.ajaxSetup({
// 	beforeSend: function(xhr, settings) {
		
// 		let getCookie = function(name: string) {
// 			var cookie, cookieValue, cookies, i;
// 			cookieValue = null;
// 			if (document.cookie && document.cookie !== '') {
// 				cookies = document.cookie.split(';');
// 				i = 0;
// 				while (i < cookies.length) {
// 					cookie = jQuery.trim(cookies[i]);
// 					if (cookie.substring(0, name.length + 1) === name + '=') {
// 						cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
// 						break;
// 					}
// 					i++;
// 				}
// 			}
// 			return cookieValue;
// 		};

// 		if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
// 			xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
// 		}
// 	}
// });

enum State {
	NextDrawing,
	RequestedNextDrawing,
	Drawing,
	SetStatus,
	RequestedSetStatus
}

export class CommeUnDessein {

	mode: string = 'CommeUnDessein'
	origin: string = ''
	secret: string = '******'
	currentDrawing: { items: any[], pk: string }
	state: State = State.NextDrawing
	testMode: boolean
	startButton: Controller
	started: boolean = false
	timeoutID: NodeJS.Timeout = null

	constructor(testMode=false) {
		this.testMode = testMode
		this.mode = localStorage.getItem(ModeKey) || 'CommeUnDessein'
		this.origin = localStorage.getItem(OriginKey) || ''

		let secret = localStorage.getItem(CommeUnDesseinSecretKey)
		if (secret != null) {
			this.secret = secret
		}
	}

	createGUI(gui: GUI) {
		let folderName = 'Comme un dessein'
		if(this.testMode) {
			folderName += ' (Test mode)'
		}
		let commeUnDesseinGUI = gui.addFolder(folderName)
		commeUnDesseinGUI.add(this, 'origin').onFinishChange((value) => localStorage.setItem(OriginKey, value))
		commeUnDesseinGUI.add(this, 'mode').onFinishChange((value) => localStorage.setItem(ModeKey, value))
		commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => localStorage.setItem(CommeUnDesseinSecretKey, value))
		
		CommeUnDesseinSize.width = parseInt(window.localStorage.getItem('commeUnDesseinWidth')) || tipibot.drawArea.bounds.width
		CommeUnDesseinSize.height = parseInt(window.localStorage.getItem('commeUnDesseinHeight')) || tipibot.drawArea.bounds.height

		commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, 5000, 1).name('Width').onFinishChange((value)=> {
			window.localStorage.setItem('commeUnDesseinWidth', value)
		})
		commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, 5000, 1).name('Height').onFinishChange((value)=> {
			window.localStorage.setItem('commeUnDesseinHeight', value)
		})

		this.startButton = commeUnDesseinGUI.addButton('Start', ()=> this.toggleStart())
		// commeUnDesseinGUI.open()
	}

	toggleStart() {
		if(!this.started) {
			if(document.cookie.indexOf('csrftoken') < 0) {
				console.log('Old Warning (which you can ignore safely): the Comme un dessein csrf token cookie is not present, please visit http://commeundessein.co/ before starting Comme un Dessein')
			}
			this.startButton.setName('Stop, clear queue & go home')
			this.requestNextDrawing()
		} else {
			this.startButton.setName('Start')
			this.stopAndClear()
		}
		this.started = !this.started
	}

	stopAndClear() {
		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.destroy()
		}
		communication.interpreter.sendStop(true)
		communication.interpreter.clearQueue()
		tipibot.goHome()
		this.state = State.NextDrawing
		clearTimeout(this.timeoutID)
	}

	requestNextDrawing() {
		if(this.state != State.NextDrawing) {
			console.error('CommeUnDessein trying to request next drawing while not in NextDrawing state')
			return
		}

		let args = {
			cityName: this.mode, secret: this.secret
		}
		let functionName: String = this.testMode ? 'getNextTestDrawing' : 'getNextValidatedDrawing'
		let data = {
			data: JSON.stringify({ function: functionName, args: args })
		}
		this.state = State.RequestedNextDrawing
		
		console.log('Request next drawing...')

		// let url = this.testMode ? 'http://localhost:8000/ajaxCallNoCSRF/' : commeundesseinAjaxURL
		let url = this.origin + commeundesseinAjaxURL
		// $.ajax({ method: "GET", url: url, data: data, xhrFields: { withCredentials: false }, headers: {'Access-Control-Allow-Origin':true} }).done((results) => {
		$.ajax({ method: "POST", url: url, data: data }).done((results) => {
			if(this.testMode) {
				console.log(results)
			}
			if (results.message == 'no path') {
				this.state = State.NextDrawing
				console.log('There are no path to draw. Request next drawing in two seconds...')
				if(this.started) {
					clearTimeout(this.timeoutID)
					this.timeoutID = setTimeout(() => this.requestNextDrawing(), RequestTimeout)
				}
				return
			}
			if(this.state != State.RequestedNextDrawing) {
				console.error('CommeUnDessein trying to set to draw while not in RequestedNextDrawing state')
				return
			}
			this.drawSVG(results)
			return
		}).fail((results) => {
			console.error('getNextValidatedDrawing request failed')
			console.error(results)
			this.state = State.NextDrawing
			if(this.started) {
				clearTimeout(this.timeoutID)
				this.timeoutID = setTimeout(() => this.requestNextDrawing(), RequestTimeout)
			}
		})
	}

	drawSVG(results: any) {
		if (results.state == 'error') {
			console.log(results)
			return
		}
		this.state = State.Drawing
		this.currentDrawing = results

		let drawing = new paper.Group()

		paper.project.importSVG(results.svg, (item: paper.Item, svg: string)=> {
			if(item.visible == false) {
				console.error('When receiving next validated drawing: while importing SVG: the imported item is not visible: ignore.')
				return
			}
			for (let path of item.children) {

				if(path.className != 'Path') {
					continue
				}

				// Ignore anything that humans can't see to avoid hacks
				let strokeColor: any = path.strokeColor
				if(path.strokeWidth <= 0.2 || path.strokeColor == 'white' || path.strokeColor == null || path.opacity <= 0.1 || strokeColor.alpha <= 0.2 || !path.visible) {
					continue
				}

				let controlPath: paper.Path = <paper.Path>path.clone()

				controlPath.flatten(Settings.plot.flattenPrecision)
				
				// now that controlPath is flattened: convert in draw area coordinates
				for(let segment of controlPath.segments) {
					segment.point = commeUnDesseinToDrawArea(segment.point)
				}
				drawing.addChild(controlPath)
			}
			item.remove()
			if(SVGPlot.svgPlot != null) {
				SVGPlot.svgPlot.destroy()
			}
			SVGPlot.svgPlot = new SVGPlot(drawing)
			SVGPlot.svgPlot.plot(() => this.setDrawingStatusDrawn(results.pk))
		})
	}

	draw(results: any) {
		if (results.state == 'error') {
			console.log(results)
			return
		}
		this.state = State.Drawing
		this.currentDrawing = results

		let drawing = new paper.Group()

		for (let itemJson of results.items) {
			let item = JSON.parse(itemJson)

			let pk = item._id.$oid
			let id = item.clientId
			let date = item.date != null ? item.date.$date : null
			let data = item.data != null && item.data.length > 0 ? JSON.parse(item.data) : null

			let points = data.points
			let planet = data.planet

			let controlPath = new paper.Path()

			for (let i = 0; i < points.length; i += 4) {
				let point = points[i]
				// points and handles in project coordinates
				// do not convert in draw area cooredinates before flattening (to keep handle proportions)
				controlPath.add(posOnPlanetToProject(point, planet))
				controlPath.lastSegment.handleIn = new paper.Point(points[i + 1])
				controlPath.lastSegment.handleOut = new paper.Point(points[i + 2])
				// controlPath.lastSegment.rtype = points[i+3]
			}
			controlPath.flatten(Settings.plot.flattenPrecision)
			// now that controlPath is flattened: convert in draw area coordinates
			for(let segment of controlPath.segments) {
				segment.point = commeUnDesseinToDrawArea(segment.point)
			}
			drawing.addChild(controlPath)
		}
		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.destroy()
		}
		SVGPlot.svgPlot = new SVGPlot(drawing)
		SVGPlot.svgPlot.plot(() => this.setDrawingStatusDrawn(results.pk))
	}

	setDrawingStatusDrawn(pk: string) {
		if(visualFeedback.paths.children.length > 0) {
			visualFeedback.paths.removeChildren()
		}

		if(this.state != State.Drawing) {
			console.error('CommeUnDessein trying to setDrawingStatusDrawn while not in Drawing state')
			return
		}

		let args = {
			pk: pk,
			secret: this.secret
		}
		let functionName: String = this.testMode ? 'setDrawingStatusDrawnTest' : 'setDrawingStatusDrawn'
		let data = {
			data: JSON.stringify({ function: functionName, args: args })
		}
		this.state = State.RequestedSetStatus

		if(this.testMode) {
			console.log('setDrawingStatusDrawn')
		}

		let url = this.origin + commeundesseinAjaxURL
		$.ajax({ method: "POST", url: url, data: data }).done((results) => {
			console.log(results)
			if(this.testMode) {
				console.log(results)
			}
			if (results.state == 'error') {
				console.error(results)
				return
			}
			if(this.state != State.RequestedSetStatus) {
				console.error('CommeUnDessein trying to requestNextDrawing while not in RequestedSetStatus state')
				return
			}
			this.state = State.NextDrawing
			if(this.started) {
				this.requestNextDrawing()
			}
			return
		}).fail((results) => {
			console.error('setDrawingStatusDrawn request failed')
			console.error(results)
			this.state = State.Drawing
			if(this.started) {
				this.setDrawingStatusDrawn(pk)
			}
		})
	}
}