import { Settings, paper, isServer } from "../Settings"
import { SVGPlotStatic } from "../PlotStatic"
import { Communication } from "../Communication/CommunicationStatic"
import { Tipibot } from "../TipibotStatic"

const RequestTimeout = 2000

// let scale = 1000

// export let CommeUnDesseinSize = new paper.Size(4000, 3000)

let commeUnDesseinToDrawArea = function(point: paper.Point, cityWidth: number, cityHeight: number, cityPixelPerMm: number): paper.Point {
	let drawArea = Tipibot.tipibot.drawArea.bounds
	const CommeUnDesseinDrawArea = new paper.Rectangle(-cityWidth*cityPixelPerMm/2, -cityHeight*cityPixelPerMm/2, cityWidth*cityPixelPerMm, cityHeight*cityPixelPerMm)
	return point.subtract(CommeUnDesseinDrawArea.topLeft).divide(CommeUnDesseinDrawArea.size as any).multiply(drawArea.size as any).add(drawArea.topLeft)
}

// let posOnPlanetToProject = function(point: paper.Point, planet: paper.Point): paper.Point {
// 	if (point.x == null && point.y == null) {
// 		point = new paper.Point(point)
// 	}
// 	let x = planet.x * 180 + point.x
// 	let y = planet.y * 90 + point.y
// 	x *= scale
// 	y *= scale
// 	return new paper.Point(x, y)
// }

// let posOnPlanetToDrawArea = function(point: paper.Point, planet: paper.Point) {
// 	let posOnProject = posOnPlanetToProject(point, planet)
// 	return commeUnDesseinToDrawArea(posOnProject)
// }

let commeundesseinAjaxURL = '/ajaxCallNoCSRF/'

export const StorageKeys = {
	CommeUnDessein: 'comme-un-dessein',
	Mode: 'mode',
	Origin: 'origin',
	Secret: 'secret',
	Width: 'width',
	Height: 'height',
}

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

export enum State {
	NextDrawing,
	RequestedNextDrawing,
	Drawing,
	SetStatus,
	RequestedSetStatus,
	Stopped
}

export class CommeUnDessein {

	mode: string = 'CommeUnDessein'
	origin: string = ''
	secret: string = '******'
	currentDrawing: { items: any[], pk: string }
	state: State = State.Stopped
	testMode: boolean
	// started: boolean = false
	timeoutID: NodeJS.Timeout = null
	isConnectedToServer = false

	// settings = {
	// 	mode: '',
	// 	origin: '',
	// 	secret: '',		
	// }
	static commeUnDessein: CommeUnDessein

	constructor(testMode=false) {
		this.testMode = testMode
	}

	toggleStart() {
		if(this.state == State.Stopped) {
			if(document.cookie.indexOf('csrftoken') < 0) {
				console.log('Old Warning (which you can ignore safely): the Comme un dessein csrf token cookie is not present, please visit http://commeundessein.co/ before starting Comme un Dessein')
			}
			if(!this.isConnectedToServer) {
				this.start()
			} else {
				Communication.communication.send('comme-un-dessein-start')
			}
		} else {
			if(!this.isConnectedToServer) {
				this.stopAndClear()
			} else {
				Communication.communication.send('comme-un-dessein-stop')
			}
		}
	}

	start() {
		this.setState(State.NextDrawing)
		this.requestNextDrawing()
	}

	stopAndClear() {
		if(SVGPlotStatic.svgPlot != null) {
			SVGPlotStatic.svgPlot.destroy()
		}
		Communication.interpreter.sendStop(true)
		Communication.interpreter.clearQueue()
		Tipibot.tipibot.goHome()
		this.setState(State.Stopped)
		clearTimeout(this.timeoutID)
	}

	setState(state: State) {
		this.state = state
	}

	request(data: { method: string, url: string, data: any }, callback: (response:any)=> void, error: (response:any)=> void) {
		// $.ajax(data).done(callback).fail(error)
		console.log('static request')
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

		this.setState(State.RequestedNextDrawing)
		
		console.log('Request next drawing...')

		// let url = this.testMode ? 'http://localhost:8000/ajaxCallNoCSRF/' : commeundesseinAjaxURL
		let url = this.origin + commeundesseinAjaxURL
		
		// $.ajax({ method: "GET", url: url, data: data, xhrFields: { withCredentials: false }, headers: {'Access-Control-Allow-Origin':true} }).done((response) => {
		this.request({ method: "POST", url: url, data: data }, (res)=> this.requestNextDrawingCallback(res), (res)=> this.requestNextDrawingError(res))
		// $.ajax({ method: "POST", url: url, data: data }).done((response) =>this.requestNextDrawingCallback(response)).fail((response) => this.requestNextDrawingError(response))
	}

	requestNextDrawingCallback(response: any) {
		console.log('requestNextDrawingCallback')
		console.log(response)

		if(this.testMode) {
			console.log(response)
		}
		if (response.message == 'no path') {
			console.log('There are no path to draw. Request next drawing in a few seconds...')
			if(this.state != State.Stopped) {
				clearTimeout(this.timeoutID)
				this.setState(State.NextDrawing)
				this.timeoutID = setTimeout(() => this.requestNextDrawing(), RequestTimeout)
			}
			return
		}
		if(this.state != State.RequestedNextDrawing) {
			console.error('CommeUnDessein trying to set to draw while not in RequestedNextDrawing state')
			return
		}
		this.drawSVG(response)
	}

	requestNextDrawingError(response: any) {
		console.error('getNextValidatedDrawing request failed')
		console.error(response)
		if(this.state != State.Stopped) {
			clearTimeout(this.timeoutID)
			this.setState(State.NextDrawing)
			this.timeoutID = setTimeout(() => this.requestNextDrawing(), RequestTimeout)
		}
	}


	drawSVG(response: any) {
		console.log('drawSVG')
		if (response.state == 'error') {
			console.log(response)
			return
		}
		this.setState(State.Drawing)
		this.currentDrawing = response
		
		let drawing = new paper.Group()
		
		console.log('import svg...')
		let newItem = paper.project.importSVG(response.svg, (item: paper.Item, svg: string)=> {
			console.log('imported svg...')
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
				if(path.strokeWidth <= 0.2 || path.strokeColor.equals(new paper.Color(1,1,1)) || path.strokeColor == null || path.opacity <= 0.1 || strokeColor.alpha <= 0.2 || !path.visible) {
					continue
				}

				let controlPath: paper.Path = <paper.Path>path.clone()

				controlPath.flatten(Settings.plot.flattenPrecision)
				
				// now that controlPath is flattened: convert in draw area coordinates
				for(let segment of controlPath.segments) {
					segment.point = commeUnDesseinToDrawArea(segment.point, response.cityWidth, response.cityHeight, response.cityPixelPerMm)
				}
				drawing.addChild(controlPath)
			}
			item.remove()
			if(SVGPlotStatic.svgPlot != null) {
				SVGPlotStatic.svgPlot.destroy()
			}
			console.log('new svg plot...')
			SVGPlotStatic.svgPlot = new SVGPlotStatic(drawing)
			SVGPlotStatic.svgPlot.plot(() => this.setDrawingStatusDrawn(response.pk))
		})
	}

	// draw(response: any) {
	// 	if (response.state == 'error') {
	// 		console.log(response)
	// 		return
	// 	}
	//	this.setState(State.Drawing)
	// 	this.currentDrawing = response

	// 	let drawing = new paper.Group()

	// 	for (let itemJson of response.items) {
	// 		let item = JSON.parse(itemJson)

	// 		let pk = item._id.$oid
	// 		let id = item.clientId
	// 		let date = item.date != null ? item.date.$date : null
	// 		let data = item.data != null && item.data.length > 0 ? JSON.parse(item.data) : null

	// 		let points = data.points
	// 		let planet = data.planet

	// 		let controlPath = new paper.Path()

	// 		for (let i = 0; i < points.length; i += 4) {
	// 			let point = points[i]
	// 			// points and handles in project coordinates
	// 			// do not convert in draw area cooredinates before flattening (to keep handle proportions)
	// 			controlPath.add(posOnPlanetToProject(point, planet))
	// 			controlPath.lastSegment.handleIn = new paper.Point(points[i + 1])
	// 			controlPath.lastSegment.handleOut = new paper.Point(points[i + 2])
	// 			// controlPath.lastSegment.rtype = points[i+3]
	// 		}
	// 		controlPath.flatten(Settings.plot.flattenPrecision)
	// 		// now that controlPath is flattened: convert in draw area coordinates
	// 		for(let segment of controlPath.segments) {
	// 			segment.point = commeUnDesseinToDrawArea(segment.point)
	// 		}
	// 		drawing.addChild(controlPath)
	// 	}
	// 	if(SVGPlotStatic.svgPlot != null) {
	// 		SVGPlotStatic.svgPlot.destroy()
	// 	}
	// 	SVGPlotStatic.svgPlot = new SVGPlot(drawing)
	// 	SVGPlotStatic.svgPlot.plot(() => this.setDrawingStatusDrawn(response.pk))
	// }

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
		this.setState(State.RequestedSetStatus)

		if(this.testMode) {
			console.log('setDrawingStatusDrawn')
		}

		let url = this.origin + commeundesseinAjaxURL

		this.request({ method: "POST", url: url, data: data }, (res)=> this.setDrawingStatusDrawnCallback(res, url), (res)=> this.setDrawingStatusDrawnError(res, pk))
	}

	setDrawingStatusDrawnCallback(response:any, url:string) {
		// console.log(response)
		if(this.testMode) {
			console.log(response)
		}
		if (response.state == 'error') {
			console.error(response)
			return
		}
		if(this.state != State.RequestedSetStatus) {
			console.log('CommeUnDessein trying to requestNextDrawing while not in RequestedSetStatus state, which happens if user has stopped CommeUnDessein before the request answer:', url)
			return
		}
		this.setState(State.NextDrawing)
		this.requestNextDrawing()
	}

	setDrawingStatusDrawnError(response:any, pk:string) {
		console.error('setDrawingStatusDrawn request failed')
		console.error(response)
		this.setState(State.Drawing)
		if(this.state != (State.Stopped as any)) {
			this.setDrawingStatusDrawn(pk)
		}
	}

	saveSettings(key: string, value: any) {
	}
}