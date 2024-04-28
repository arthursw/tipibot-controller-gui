import { Settings, paper, isServer } from "./Settings"
import { Tipibot } from "./TipibotStatic"
// import * as PerspT from 'perspective-transform'

import { Communication } from "./Communication/CommunicationStatic";

const PerspT = require('perspective-transform');
// if (isServer) {
//     var ServerPerspT = require('perspective-transform');
// }
// Calibration will draw a width x height rectangle (at the center of the paper) with different settings 
// to calibrate the y offset and the width of the machine

const HANDLE_SIZE = 100

export class Calibration {
	
    nCellsX = 3
    nCellsY = 2
    maxStepSize = 100
    matrices: Array<Array<any>> = []
    handles: Array<Array<paper.Path>> = []
    grid: Array<Array<paper.Path>> = []
    handleGroup: paper.Group = null
    gridGroup: paper.Group = null
    currentHandle: paper.Point

    amount: number = 10
    previewRectangleWidth = 210-10
    previewRectangleHeight = 297-10
    previewTransform = false
    previewRectangle = false
    previewRectangleItem: paper.Item = null
    previewTransformItem: paper.Path = null
    cornersOnly = false
    points: number[] = []
    transformMatrix: any = null
    
    static calibration: Calibration = null

	static initialize() {
        Calibration.calibration = new Calibration()
    }
    
	constructor() {
        this.handleGroup = new paper.Group()
        this.gridGroup = new paper.Group()
        this.currentHandle = new paper.Point(0, 0)
        this.loadHandles()
        if(this.nCellsX == 0 || this.nCellsY == 0) {
            this.nCellsX = 3
            this.nCellsY = 2
            this.initializeGrid()
        }
    }

    getPointsFromRectangle(rectangle: paper.Rectangle) {
        let points = []
        points.push(rectangle.topLeft.x)
        points.push(rectangle.topLeft.y)
        points.push(rectangle.topRight.x)
        points.push(rectangle.topRight.y)
        points.push(rectangle.bottomRight.x)
        points.push(rectangle.bottomRight.y)
        points.push(rectangle.bottomLeft.x)
        points.push(rectangle.bottomLeft.y)
        return points
    }
    
    getTransformMatrix(srcCorners: number[], dstCorners: number[]) {
        // return isServer ? ServerPerspT(srcCorners, dstCorners) : PerspT(srcCorners, dstCorners)
        return PerspT(srcCorners, dstCorners)
    }

    getTransformMatrixFromRectangles(sourceRectangle: paper.Rectangle, destinationRectangle: paper.Rectangle) {
        return this.getTransformMatrix(this.getPointsFromRectangle(sourceRectangle), this.getPointsFromRectangle(destinationRectangle))
    }

    getDrawAreaPoints() {
        let rectangle = Tipibot.tipibot.computeDrawArea()
        return this.getPointsFromRectangle(rectangle)
    }

    moveTipibot(end: paper.Point, moveCallback: ()=>any = null) {
        let start = this.transform(Tipibot.tipibot.lastSentPosition)
        let delta = end.subtract(start)
        let length = delta.length
        delta = delta.divide(length)
        let nSteps = Math.ceil(length / Settings.calibration.maxStepSize)
        for(let n=0 ; n<nSteps ; n++) {
            let point = start.add(delta.multiply(n*length/nSteps))
            point = this.transform(point)
            Communication.interpreter.sendMoveDirect(point, n==nSteps-1 ? moveCallback : null)
        }
    }

    getMatrix(point: paper.Point) {
        let drawArea = Tipibot.tipibot.computeDrawArea()
        let cell = drawArea.size.divide(point.subtract(drawArea.topLeft) as any) as any
        return this.matrices != null && this.matrices.length > cell.y && this.matrices[cell.y].length > cell.x ? this.matrices[cell.y][cell.x] : null
    }

    transform(point: paper.Point) {
        let matrix = this.getMatrix(point)
        return matrix != null ? new paper.Point(matrix.transform(point.x, point.y)) : point
    }

    createHandle(point: paper.Point, x: number, y: number) {
        let handle = new paper.Path.Rectangle(new paper.Rectangle(point.x-HANDLE_SIZE/2, point.y-HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE))
        handle.strokeColor = new paper.Color(('black'))
        handle.strokeWidth = 1
        handle.fillColor = new paper.Color(1, 1, 1, 0.1)
        if(!isServer) {
            handle.onMouseDrag = (event:paper.MouseEvent) => this.onHandleDrag(event, x, y)
            handle.onClick = (event:paper.MouseEvent) => this.onHandleClick(event, x, y)
            handle.onMouseUp = (event:paper.MouseEvent) => this.onHandleUp(event, x, y)
        }
        this.handleGroup.addChild(handle)
        return handle
    }

    initializeGrid(save=false) {
        this.gridGroup.removeChildren()
        this.handleGroup.removeChildren()
        let drawArea = Tipibot.tipibot.computeDrawArea()
        let cellWidth = drawArea.width / this.nCellsX
        let cellHeight = drawArea.height / this.nCellsY
        this.handles = []
        for(let y=0 ; y<this.nCellsY+1 ; y++) {
            let handlesRow = []
            for(let x=0 ; x<this.nCellsX+1 ; x++) {
                handlesRow.push(this.createHandle(new paper.Point(drawArea.left+x*cellWidth, drawArea.top+y*cellHeight), x, y))
            }
            this.handles.push(handlesRow)
        }
        this.updateGrid()
        if(save) {
            this.saveHandles()
        }
    }

    onHandleDrag(event:paper.MouseEvent, x: number, y: number) {
        if(event.modifiers.shiftKey) {
            this.handles[y][x].position = event.point
            this.updateGrid()
        }
    }

    resetHandles() {
        for(let handlesRow of this.handles) {
            for(let handle of handlesRow) {
                handle.strokeColor = new paper.Color('black')
            }
        }
    }

    onHandleClick(event: paper.MouseEvent, x:number, y: number) {
        if(!event.modifiers.shiftKey) {
            Tipibot.tipibot.moveDirect(this.handles[y][x].position)
            this.currentHandle.x = x
            this.currentHandle.y = y
            this.resetHandles()
            this.handles[y][x].strokeColor = new paper.Color('green')
        }
    }

    onHandleUp(event:paper.MouseEvent, x: number, y: number) {
        this.saveHandles()
    }

    getPointListFromPath(path: paper.Path) {
        let pointList = []
        for(let segment of path.segments) {
            pointList.push(segment.point.x)
            pointList.push(segment.point.y)
        }
        return pointList
    }

    updateGrid() {
        this.gridGroup.removeChildren()
        this.grid = []
        this.matrices = []
        let drawArea = Tipibot.tipibot.computeDrawArea()
        let cellWidth = drawArea.width / this.nCellsX
        let cellHeight = drawArea.height / this.nCellsY
        for(let y=0 ; y<this.nCellsY ; y++) {
            let matricesRow = []
            let gridRow = []
            for(let x=0 ; x<this.nCellsX ; x++) {
                let point = new paper.Point(x*cellWidth, y*cellHeight)
                let topLeft = drawArea.topLeft.add(point)
                let bottomRight = drawArea.topLeft.add(new paper.Point((x+1)*cellWidth, (y+1)*cellHeight))
                let cellRectangle = new paper.Rectangle(topLeft, bottomRight)
                let path = new paper.Path()
                path.add(this.handles[y][x].position)
                path.add(this.handles[y][x+1].position)
                path.add(this.handles[y+1][x+1].position)
                path.add(this.handles[y+1][x].position)
                path.strokeColor = new paper.Color('orange')
                path.strokeWidth = 1
                matricesRow.push(this.getTransformMatrix(this.getPointsFromRectangle(cellRectangle), this.getPointListFromPath(path)))
                path.closed = true
                this.gridGroup.addChild(path)
                gridRow.push(path)

            }
            this.matrices.push(matricesRow)
            this.grid.push(gridRow)
        }
    }

    saveHandles() {
        Settings.calibration.grid = new Array<Array<number[]>>()
        for(let y=0 ; y<this.nCellsY+1 ; y++) {
            let row = []
            for(let x=0 ; x<this.nCellsX+1 ; x++) {
            let point = this.handles[y][x].position
                row.push([point.x, point.y])
            }
            Settings.calibration.grid.push(row)
        }
    }

    loadHandles() {
        this.handles = []
        this.nCellsX = 0
        this.nCellsY = 0
        for(let row of Settings.calibration.grid) {
            this.nCellsX = 0
            let handleRow = []
            for(let point of row) {
                handleRow.push(this.createHandle(new paper.Point(point[0], point[1]), this.nCellsX, this.nCellsY))
                this.nCellsX += 1
            }
            this.nCellsY += 1
            this.handles.push(handleRow)
        }
        this.nCellsX -= 1
        this.nCellsY -= 1
        this.updateGrid()
    }

    getRectangle(): paper.Rectangle {
        let drawArea = Tipibot.tipibot.computeDrawArea()
        let topLeft = drawArea.center.subtract(new paper.Point(this.previewRectangleWidth/2, this.previewRectangleHeight/2))
        let rectangle = new paper.Rectangle(topLeft, new paper.Size(this.previewRectangleWidth, this.previewRectangleHeight))
        return rectangle
    }

    updatePreviewRectangle() {
        if(this.previewRectangleItem != null) {
            this.previewRectangleItem.remove()
            this.previewRectangleItem = null
        }
        let rectangle = this.getRectangle()
        if(this.cornersOnly) {
            this.previewRectangleItem = new paper.Group()
            let topLeft = new paper.Path()
            topLeft.add(rectangle.topLeft.add(new paper.Point(0, 10)))
            topLeft.add(rectangle.topLeft)
            topLeft.add(rectangle.topLeft.add(new paper.Point(10, 0)))
            let topRight = new paper.Path()
            topRight.add(rectangle.topRight.add(new paper.Point(-10, 0)))
            topRight.add(rectangle.topRight)
            topRight.add(rectangle.topRight.add(new paper.Point(0, 10)))
            let bottomRight = new paper.Path()
            bottomRight.add(rectangle.bottomRight.add(new paper.Point(0, -10)))
            bottomRight.add(rectangle.bottomRight)
            bottomRight.add(rectangle.bottomRight.add(new paper.Point(-10, 0)))
            let bottomLeft = new paper.Path()
            bottomLeft.add(rectangle.bottomLeft.add(new paper.Point(10, 0)))
            bottomLeft.add(rectangle.bottomLeft)
            bottomLeft.add(rectangle.bottomLeft.add(new paper.Point(0, -10)))
            this.previewRectangleItem.addChild(topLeft)
            this.previewRectangleItem.addChild(topRight)
            this.previewRectangleItem.addChild(bottomRight)
            this.previewRectangleItem.addChild(bottomLeft)
        } else {
            console.log('h')
            this.previewRectangleItem = new paper.Path.Rectangle(rectangle)
        }
        this.previewRectangleItem.strokeColor = new paper.Color('green')
        this.previewRectangleItem.strokeWidth = 1
    }

    togglePreviewRectangle() {
        if(this.previewRectangle) {
            this.updatePreviewRectangle()
        } else if(this.previewRectangleItem != null) {
            this.previewRectangleItem.remove()
            this.previewRectangleItem = null
        }
    }

    // updatePreviewTransform() {
    //     let rectangle = Tipibot.tipibot.computeDrawArea()

    //     let topLeft = this.transform(rectangle.topLeft)
    //     let topRight = this.transform(rectangle.topRight)
    //     let bottomRight = this.transform(rectangle.bottomRight)
    //     let bottomLeft = this.transform(rectangle.bottomLeft)

    //     if(this.previewTransformItem != null) {
    //         this.previewTransformItem.remove()
    //         this.previewTransformItem = null
    //     }

    //     this.previewTransformItem = new paper.Path()
    //     this.previewTransformItem.add(topLeft)
    //     this.previewTransformItem.add(topRight)
    //     this.previewTransformItem.add(bottomRight)
    //     this.previewTransformItem.add(bottomLeft)
    //     this.previewTransformItem.add(topLeft)

    //     this.previewTransformItem.strokeColor = new paper.Color('orange')
    //     this.previewTransformItem.strokeWidth = 1
    // }

    // togglePreviewTransform() {
    //     if(this.previewTransform) {
    //         this.updatePreviewTransform()
    //     } else if(this.previewTransformItem != null) {
    //         this.previewTransformItem.remove()
    //         this.previewTransformItem = null
    //     }
    // }

    drawRectangle() {
        let rectangle = this.getRectangle()

        let startPoint = Tipibot.tipibot.getPosition()

        Tipibot.tipibot.sendSpecs()
        Tipibot.tipibot.penUp()
        if(this.cornersOnly){
            Tipibot.tipibot.moveDirect(rectangle.topLeft.add(new paper.Point(0, 10)))
            Tipibot.tipibot.penDown()
            Tipibot.tipibot.moveLinear(rectangle.topLeft)
            Tipibot.tipibot.moveLinear(rectangle.topLeft.add(new paper.Point(10, 0)))
            Tipibot.tipibot.penUp()
            Tipibot.tipibot.moveDirect(rectangle.topRight.add(new paper.Point(-10, 0)))
            Tipibot.tipibot.penDown()
            Tipibot.tipibot.moveLinear(rectangle.topRight)
            Tipibot.tipibot.moveLinear(rectangle.topRight.add(new paper.Point(0, 10)))
            Tipibot.tipibot.penUp()
            Tipibot.tipibot.moveDirect(rectangle.bottomRight.add(new paper.Point(0, -10)))
            Tipibot.tipibot.penDown()
            Tipibot.tipibot.moveLinear(rectangle.bottomRight)
            Tipibot.tipibot.moveLinear(rectangle.bottomRight.add(new paper.Point(-10, 0)))
            Tipibot.tipibot.penUp()
            Tipibot.tipibot.moveDirect(rectangle.bottomLeft.add(new paper.Point(10, 0)))
            Tipibot.tipibot.penDown()
            Tipibot.tipibot.moveLinear(rectangle.bottomLeft)
            Tipibot.tipibot.moveLinear(rectangle.bottomLeft.add(new paper.Point(0, -10)))
        } else {
            Tipibot.tipibot.moveDirect(rectangle.topLeft)
            Tipibot.tipibot.penDown()
            Tipibot.tipibot.moveLinear(rectangle.topRight)
            Tipibot.tipibot.moveLinear(rectangle.bottomRight)
            Tipibot.tipibot.moveLinear(rectangle.bottomLeft)
            Tipibot.tipibot.moveLinear(rectangle.topLeft)
        }
        Tipibot.tipibot.penUp()
        Tipibot.tipibot.moveDirect(startPoint)
    }

	calibrateY() {
        let initialPosition = Tipibot.tipibot.getPosition()
        for(let i = -this.amount ; i <= this.amount ; i += this.amount) {
            Tipibot.tipibot.setPosition(new paper.Point(initialPosition.x, initialPosition.y + i), true, false)
            this.drawRectangle()
        }
        Tipibot.tipibot.setPosition(initialPosition, false, false)
    }
    
	calibrateWidth() {
        let initialPosition = Tipibot.tipibot.getPosition()
        let initialWidth = Settings.tipibot.width
        let initialHeight = Settings.tipibot.height
        let paperCenterX = initialWidth / 2
        for(let i = -this.amount ; i <= this.amount ; i += this.amount) {
            Settings.tipibot.width = initialWidth + i
            Tipibot.tipibot.setPosition(new paper.Point(initialPosition.x + i / 2, initialPosition.y), false, false)
            this.drawRectangle()
        }
        Settings.tipibot.width = initialWidth
        Settings.tipibot.height = initialHeight
        Tipibot.tipibot.setPosition(initialPosition, false, false)
        Tipibot.tipibot.sendSpecs()
	}
}