import { Settings, settingsManager } from "../Settings"
import { GUI } from "../GUI"
import { SVGPlot } from "../Plot"
import { } from "../Renderers"

let scale = 1000

let posOnPlanetToProject = function(point: paper.Point, planet: paper.Point) {
	if(point.x == null && point.y == null) {
		point = new paper.Point(point)
	}
	let x = planet.x * 360 + point.x
	let y = planet.y * 180 + point.y
	x *= scale
	y *= scale
	return new paper.Point(x, y)
}

let commeundesseinAjaxURL = '/ajaxCall/'
const CommeUnDesseinSecretKey = 'CommeUnDesseinSecret'

export class CommeUnDessein {
	
	mode: string = 'CommeUnDessein'
	secret: string = '******'
	requestDrawingInterval: number = null

	constructor() {
		let secret = localStorage.getItem(CommeUnDesseinSecretKey)
		if(secret != null) {
			this.secret = secret
		}
	}

	startRequesting() {
		this.requestDrawingInterval = setInterval(() => this.requestNextDrawing(), 2000)
	}

	createGUI(gui: GUI) {
		gui.add(this, 'mode')
		gui.add(this, 'secret').onFinishChange((value)=> localStorage.setItem(CommeUnDesseinSecretKey, value))
	}

	requestNextDrawing() {
		clearInterval(this.requestDrawingInterval)
		this.requestDrawingInterval = null
		
		let args = {
			city: this.mode
		}
		let data = {
			data: JSON.stringify({ function: 'getNextValidatedDrawing', args: args })
		}
		$.ajax( { method: "POST", url: commeundesseinAjaxURL, data: data } ).done((results)=> {
			if(results.message == 'no path') {
				this.startRequesting()
				return
			}
			this.draw(results)
			return
		}).fail((results)=> {
			console.error('getNextValidatedDrawing request failed')
			console.error(results)
			this.startRequesting()
		})
	}

	draw(results: any) {
		if(results.state == 'error') {
			console.log(results)
		}
		for(let i of results.item) {
			let item = JSON.parse(i)
			
			let pk = item._id.$oid
			let id = item.clientId
			let date = item.date ? item.date.$date : null
			let data = item.data && item.data.length>0 ? JSON.parse(item.data) : null

			let points = data.points
			let planet = data.planet

			let controlPath = new paper.Path()

			for(let i=0 ; i<points.length ; i+=4) {
				let point = points[i]
				controlPath.add(posOnPlanetToProject(point, planet))
				controlPath.lastSegment.handleIn = new paper.Point(points[i+1])
				controlPath.lastSegment.handleOut = new paper.Point(points[i+2])
				// controlPath.lastSegment.rtype = points[i+3]
			}
			controlPath.flatten(0.25)
			
			SVGPlot.svgPlot.clear()
			SVGPlot.svgPlot = new SVGPlot(controlPath)
			SVGPlot.svgPlot.plot(()=> this.setDrawingStatusDrawn(pk))
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

		$.ajax( { method: "POST", url: commeundesseinAjaxURL, data: data } ).done((results)=> {
			if(results.state == 'error') {
				console.error(results)
				return
			}
			this.startRequesting()
			return
		}).fail((results)=> {
			console.error('setDrawingStatusDrawn request failed')
			console.error(results)
			this.setDrawingStatusDrawn(pk)
		})
	}
}