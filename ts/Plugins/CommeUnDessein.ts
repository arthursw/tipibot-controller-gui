import { Settings, settingsManager } from "../Settings"
import { GUI } from "../GUI"
import { SVGPlot } from "../Plot"
import { communication } from "../Communication/Communication"
import { tipibot } from "../Tipibot"

let scale = 1000

let CommeUnDesseinSize = new paper.Size(4000, 3000)
let CommeUnDesseinPosition = new paper.Point(-CommeUnDesseinSize.width/2, -CommeUnDesseinSize.height/2)
const CommeUnDesseinDrawArea = new paper.Rectangle(CommeUnDesseinPosition, CommeUnDesseinSize)

let commeUnDesseinToDrawArea = function(point: paper.Point) {
	let drawArea = tipibot.drawArea.getBounds()
	return point.subtract(CommeUnDesseinDrawArea.topLeft).divide(CommeUnDesseinDrawArea.size).multiply(drawArea.size).add(drawArea.topLeft)
}

let posOnPlanetToProject = function(point: paper.Point, planet: paper.Point) {
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


export class CommeUnDessein {

	mode: string = 'CommeUnDessein'
	secret: string = '******'
	requestDrawingInterval: number = null

	constructor() {
		let secret = localStorage.getItem(CommeUnDesseinSecretKey)
		if (secret != null) {
			this.secret = secret
		}
	}

	startRequesting() {
		this.requestDrawingInterval = setInterval(() => this.requestNextDrawing(), 2000)
	}

	createGUI(gui: GUI) {
		let commeUnDesseinGUI = gui.addFolder('Comme un dessein')
		commeUnDesseinGUI.add(this, 'mode')
		commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => localStorage.setItem(CommeUnDesseinSecretKey, value))
		commeUnDesseinGUI.addButton('Start', ()=> this.startRequesting())
		commeUnDesseinGUI.addButton('Stop & Clear', ()=> this.stopAndClear())
	}

	stopAndClear() {
		clearInterval(this.requestDrawingInterval)
		if(SVGPlot.svgPlot != null) {
			SVGPlot.svgPlot.clear()
		}
		communication.interpreter.stopAndClearQueue()
	}

	requestNextDrawing() {
		clearInterval(this.requestDrawingInterval)
		this.requestDrawingInterval = null

		let args = {
			city: { name: this.mode }
		}
		let data = {
			data: JSON.stringify({ function: 'getNextValidatedDrawing', args: args })
		}
		$.ajax({ method: "POST", url: commeundesseinAjaxURL, data: data }).done((results) => {
			if (results.message == 'no path') {
				this.startRequesting()
				return
			}
			this.draw(results)
			return
		}).fail((results) => {
			console.error('getNextValidatedDrawing request failed')
			console.error(results)
			this.startRequesting()
		})
	}

	draw(results: any) {
		if (results.state == 'error') {
			console.log(results)
		}
		for (let itemJson of results.items) {
			let item = JSON.parse(itemJson)

			let pk = item._id.$oid
			let id = item.clientId
			let date = item.date ? item.date.$date : null
			let data = item.data && item.data.length > 0 ? JSON.parse(item.data) : null

			let points = data.points
			let planet = data.planet

			let controlPath = new paper.Path()

			for (let i = 0; i < points.length; i += 4) {
				let point = points[i]
				controlPath.add(posOnPlanetToDrawArea(point, planet))
				controlPath.lastSegment.handleIn = new paper.Point(points[i + 1])
				controlPath.lastSegment.handleOut = new paper.Point(points[i + 2])
				// controlPath.lastSegment.rtype = points[i+3]
			}
			controlPath.flatten(0.25)

			if(SVGPlot.svgPlot != null) {
				SVGPlot.svgPlot.clear()
			}
			SVGPlot.svgPlot = new SVGPlot(controlPath)
			SVGPlot.svgPlot.plot(() => this.setDrawingStatusDrawn(pk))
		}
	}

	setDrawingStatusDrawn(pk: string) {

		let args = {
			pk: pk,
			secret: this.secret
		}
		let data = {
			data: JSON.stringify({ function: 'setDrawingStatusDrawn', args: args })
		}

		$.ajax({ method: "POST", url: commeundesseinAjaxURL, data: data }).done((results) => {
			if (results.state == 'error') {
				console.error(results)
				return
			}
			this.startRequesting()
			return
		}).fail((results) => {
			console.error('setDrawingStatusDrawn request failed')
			console.error(results)
			this.setDrawingStatusDrawn(pk)
		})
	}
}