import { Settings, settingsManager } from "../Settings"
import { GUI } from "../GUI"
import { SVGPlot } from "../Plot"
import { communication } from "../Communication/Communication"
import { tipibot } from "../Tipibot"


const RequestTimeout = 2000

let scale = 1000

let CommeUnDesseinSize = new paper.Size(4000, 3000)

let commeUnDesseinToDrawArea = function(point: paper.Point): paper.Point {
	let drawArea = tipibot.drawArea.getBounds()
	let CommeUnDesseinPosition = new paper.Point(-CommeUnDesseinSize.width/2, -CommeUnDesseinSize.height/2)
	const CommeUnDesseinDrawArea = new paper.Rectangle(CommeUnDesseinPosition, CommeUnDesseinSize)
	return point.subtract(CommeUnDesseinDrawArea.topLeft).divide(CommeUnDesseinDrawArea.size).add(drawArea.topLeft()).multiply(drawArea.size())
}

let posOnPlanetToProject = function(point: paper.Point, planet: paper.Point): paper.Point {
	if (point.x == null && point.y == null) {
		point = new paper.Point(point)
	}
	let x = planet.x * 360 + point.x
	let y = planet.y * 180 + point.y
	x *= scale
	y *= scale
	return new paper.Point(x, y)
}

let posOnPlanetToDrawArea = function(point: paper.Point, planet: paper.Point) {
	let posOnProject = posOnPlanetToProject(point, planet)
	return commeUnDesseinToDrawArea(posOnProject)
}

let commeundesseinAjaxURL = '/ajaxCall/'
const CommeUnDesseinSecretKey = 'CommeUnDesseinSecret'


$.ajaxSetup({
	beforeSend: function(xhr, settings) {
		
		let getCookie = function(name: string) {
			var cookie, cookieValue, cookies, i;
			cookieValue = null;
			if (document.cookie && document.cookie !== '') {
				cookies = document.cookie.split(';');
				i = 0;
				while (i < cookies.length) {
					cookie = jQuery.trim(cookies[i]);
					if (cookie.substring(0, name.length + 1) === name + '=') {
						cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
						break;
					}
					i++;
				}
			}
			return cookieValue;
		};

		if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
			xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
		}
	}
});

enum State {
	NextDrawing,
	RequestedNextDrawing,
	Drawing,
	SetStatus,
	RequestedSetStatus
}

export class CommeUnDessein {

	mode: string = 'CommeUnDessein'
	secret: string = '******'
	currentDrawing: { items: any[], pk: string }
	state: State = State.NextDrawing
	testMode: boolean

	constructor(testMode=false) {
		this.testMode = testMode
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
		commeUnDesseinGUI.add(this, 'mode')
		commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => localStorage.setItem(CommeUnDesseinSecretKey, value))
		
		CommeUnDesseinSize.width = tipibot.drawArea.getBounds().width
		CommeUnDesseinSize.height = tipibot.drawArea.getBounds().height

		commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, Settings.tipibot.width).name('Width')
		commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, Settings.tipibot.height).name('Height')

		commeUnDesseinGUI.addButton('Start', ()=> this.requestNextDrawing())
		commeUnDesseinGUI.addButton('Stop & Clear', ()=> this.stopAndClear())
		commeUnDesseinGUI.open()
	}

	stopAndClear() {
		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.clear()
		}
		communication.interpreter.stopAndClearQueue()
		this.state = State.NextDrawing
	}

	requestNextDrawing() {
		if(this.state != State.NextDrawing) {
			console.error('CommeUnDessein trying to request next drawing while not in NextDrawing state')
			return
		}

		let args = {
			city: { name: this.mode, secret: this.secret }
		}
		let functionName: String = this.testMode ? 'getNextTestDrawing' : 'getNextValidatedDrawing'
		let data = {
			data: JSON.stringify({ function: functionName, args: args })
		}
		this.state = State.RequestedNextDrawing
		
		if(this.testMode) {
			console.log('requestNextDrawing')
		}

		// let url = this.testMode ? 'http://localhost:8000/ajaxCallNoCSRF/' : commeundesseinAjaxURL
		let url = commeundesseinAjaxURL
		// $.ajax({ method: "GET", url: url, data: data, xhrFields: { withCredentials: false }, headers: {'Access-Control-Allow-Origin':true} }).done((results) => {
		$.ajax({ method: "POST", url: url, data: data }).done((results) => {
			if(this.testMode) {
				console.log(results)
			}
			if (results.message == 'no path') {
				this.state = State.NextDrawing
				setTimeout(() => this.requestNextDrawing(), RequestTimeout)
				return
			}
			if(this.state != State.RequestedNextDrawing) {
				console.error('CommeUnDessein trying to set to draw while not in RequestedNextDrawing state')
				return
			}
			this.draw(results)
			return
		}).fail((results) => {
			console.error('getNextValidatedDrawing request failed')
			console.error(results)
			this.state = State.NextDrawing
			setTimeout(() => this.requestNextDrawing(), RequestTimeout)
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
			SVGPlot.svgPlot.clear()
		}
		SVGPlot.svgPlot = new SVGPlot(drawing)
		SVGPlot.svgPlot.plot(() => this.setDrawingStatusDrawn(results.pk))
	}

	setDrawingStatusDrawn(pk: string) {

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

		let url = commeundesseinAjaxURL
		$.ajax({ method: "POST", url: url, data: data }).done((results) => {
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
			this.requestNextDrawing()
			return
		}).fail((results) => {
			console.error('setDrawingStatusDrawn request failed')
			console.error(results)
			this.state = State.Drawing
			this.setDrawingStatusDrawn(pk)
		})
	}
}