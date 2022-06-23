import { Settings, paper } from "../Settings"
import { GUI } from "../GUI"
import { tipibot } from "../TipibotInteractive"
import { ajaxPrefilter, isPlainObject } from "jquery"

declare var Two: any

export class GCodeViewer {
	
    gui: GUI
    fileName: string = null
    group = new paper.Group()

	constructor() {
	}

	handleFileSelect(event: any) {

		let files: FileList = event.dataTransfer != null ? event.dataTransfer.files : event.target.files

		for (let i = 0 ; i < files.length ; i++) {
			let file = files[i] != null ? files[i] : files.item(i)
			let reader = new FileReader()
			reader.onload = (event: any)=> this.onGCodeLoad(event.target.result as string, file.name)
			reader.readAsText(file)
			break
		}
    }
    
    convertFromMakelangeloCoordinates(point: paper.Point) {
        let tipibotSize = new paper.Size(Settings.tipibot.width, Settings.tipibot.height)
        point.y *= -1
        return point.add(tipibotSize.multiply(0.5) as any)
    }
    
    onGCodeLoad(gcode: string, name: string) {
        this.fileName = name
        let lines = gcode.split('\n')
        // find two first G0 Z--
        let zMin = null
        let zMax = null
        for(let line of lines) {
            if(line.indexOf('G0') == 0 && line.indexOf('Z') > 0) {
                let commands = line.split(' ')
                for(let command of commands) {
                    if(command.indexOf('Z') == 0) {
                        let z = parseFloat(command.substr(1))
                        if(zMin == null && zMax == null) {
                            zMin = z
                            zMax = z
                        } else {
                            if(z > zMin) {
                                zMax = z
                            } else {
                                zMin = z
                            }
                            break
                        }
                    }
                }
            }
        }
        let currentPosition = tipibot.getHome()
        let currentColor = new paper.Color(0,0,0)
        let penUp = true
        let currentPen = null
        let path: paper.Path = null
        for(let line of lines) {
            if(line.indexOf('G0') == 0) {
                let commands = line.split(' ')
                let xyz: any = {}
                for(let command of commands) {
                    xyz[command[0]] = parseFloat(command.substr(1))
                }
                if(xyz['Z'] != null) {
                    if(xyz['Z'] != currentPen) {
                        currentPen = xyz['Z']
                        penUp = !penUp
                    }
                    if(!penUp) {
                        path = new paper.Path()
                        path.strokeColor = currentColor
                        path.strokeWidth = 1
                        path.add(currentPosition)
                        this.group.addChild(path)
                    } else {
                        path = null
                    }
                }
                if(xyz['X'] != null || xyz['Y'] != null) {
                    let x = xyz['X'] != null ? xyz['X'] + 0.5 * Settings.tipibot.width : currentPosition.x
                    let y = xyz['Y'] != null ? - xyz['Y'] + 0.5 * Settings.tipibot.height : currentPosition.y
                    currentPosition = new paper.Point(x, y)
                    if(!penUp && path != null) {
                        // if(Math.random()< 0.01) {
                        //     console.log(currentPosition)
                        // }
                        path.add(currentPosition)
                    }
                }
            }
            if(line.indexOf('M117 Change pen to ') == 0) {
                line = line.replace('M117 Change pen to ', '').replace('Click to continue', '')
                currentColor = new paper.Color(line as any)
            }
        }
    }

	createGUI(gui: GUI) {
		this.gui = gui.addFolder('GCode Viewer')
        this.gui.addFileSelectorButton('Open GCode', 'text/*', false, (event)=> this.handleFileSelect(event))
        this.gui.addButton('Save to SVG', ()=> this.saveSVG())
        this.gui.addButton('Clear', ()=> this.clear())
    }
    
    saveSVG() {
        var container = document.createElement('div')

        var params = { width: Settings.drawArea.width, height: Settings.drawArea.height }
        let drawArea = tipibot.computeDrawArea()
        var two = new Two(params).appendTo(container)
        
        let blobs = []

        for(let child of this.group.children) {
            let anchors = new Array<any>()
            for(let segment of (child as paper.Path).segments) {
                anchors.push(new Two.Anchor(segment.point.x - drawArea.left, segment.point.y - drawArea.top, segment.handleIn.x, segment.handleIn.y, segment.handleOut.x, segment.handleOut.y, 'M'))
            }
            let line = two.makePath(anchors, false)
            line.linewidth = child.strokeWidth;
            line.stroke = (child as any).strokeColor.toCSS()
        }

        two.update()

        // let svg = exportProject.exportSVG({ asString: true });
        container.firstElementChild.setAttribute('xmlns', "http://www.w3.org/2000/svg")

        var svgString = container.innerHTML

        // let svgString: any = this.group.exportSVG({ asString: true })
        let blob = new Blob([svgString], {type: 'image/svg+xml'})
        let url = URL.createObjectURL(blob)
        let link = document.createElement("a")
        document.body.appendChild(link)
        link.download = this.fileName + '.svg'
        link.href = url
        link.click()
        document.body.removeChild(link)
    }

    clear() {
        this.group.removeChildren()
    }
}