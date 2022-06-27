import { Settings, paper } from "./Settings"
import { Tipibot } from "./TipibotStatic"
import * as PerspT from 'perspective-transform'

// if (isServer) {
//     var PerspT = require('perspective-transform');
// }
// Calibration will draw a width x height rectangle (at the center of the paper) with different settings 
// to calibrate the y offset and the width of the machine

export class Calibration {
	
    amount: number = 10
    width = 200
    height = 287
    applyTransform = false
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
        this.loadPoints()
    }
    
    loadPoints() {
        if(Settings.transformMatrix == null || Settings.transformMatrix.destinationPoints == null || Settings.transformMatrix.destinationPoints.length < 8) {
            this.points = this.getDrawAreaPoints()
            Settings.transformMatrix.destinationPoints = this.points.slice()
            return
        }
        this.points = Settings.transformMatrix.destinationPoints
        this.applyTransform = Settings.transformMatrix.apply
        this.updateTransformMatrix()
    }

    getDrawAreaPoints() {
        let rectangle = Tipibot.tipibot.computeDrawArea()
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

    updateTransformMatrix() {
        let srcCorners = this.getDrawAreaPoints()
        let dstCorners = this.points
        this.transformMatrix = PerspT(srcCorners, dstCorners)
    }

    updateTransform(pointIndex: number) {
        let position = Tipibot.tipibot.getPosition()
        Settings.transformMatrix.destinationPoints[2 * pointIndex] = position.x
        Settings.transformMatrix.destinationPoints[2 * pointIndex + 1] = position.y
        this.points[2 * pointIndex] = position.x
        this.points[2 * pointIndex + 1] = position.y

        this.updateTransformMatrix()
        this.updatePreviewTransform()
    }

    resetTransform() {
        this.points = this.getDrawAreaPoints()
        this.transformMatrix = null
        if(this.previewTransform) {
            this.updatePreviewTransform()
        } else if(this.previewRectangleItem != null) {
            this.previewTransformItem.remove()
            this.previewTransformItem = null
        }
    }

    transform(point: paper.Point) {
        return this.transformMatrix != null ? new paper.Point(this.transformMatrix.transform(point.x, point.y)) : point
    }

    getRectangle(): paper.Rectangle {
        let drawArea = Tipibot.tipibot.computeDrawArea()
        let topLeft = drawArea.center.subtract(new paper.Point(this.width/2, this.height/2))
        let rectangle = new paper.Rectangle(topLeft, new paper.Size(this.width, this.height))
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

    updatePreviewTransform() {
        let rectangle = Tipibot.tipibot.computeDrawArea()

        let topLeft = this.transform(rectangle.topLeft)
        let topRight = this.transform(rectangle.topRight)
        let bottomRight = this.transform(rectangle.bottomRight)
        let bottomLeft = this.transform(rectangle.bottomLeft)

        if(this.previewTransformItem != null) {
            this.previewTransformItem.remove()
            this.previewTransformItem = null
        }

        this.previewTransformItem = new paper.Path()
        this.previewTransformItem.add(topLeft)
        this.previewTransformItem.add(topRight)
        this.previewTransformItem.add(bottomRight)
        this.previewTransformItem.add(bottomLeft)
        this.previewTransformItem.add(topLeft)

        this.previewTransformItem.strokeColor = new paper.Color('orange')
        this.previewTransformItem.strokeWidth = 1
    }

    togglePreviewTransform() {
        if(this.previewTransform) {
            this.updatePreviewTransform()
        } else if(this.previewTransformItem != null) {
            this.previewTransformItem.remove()
            this.previewTransformItem = null
        }
    }

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