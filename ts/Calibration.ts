import { Settings, settingsManager, paper } from "./Settings"
import { GUI, Controller } from "./GUI"
import { tipibot } from "./TipibotInteractive"
declare var PerspT: any

// Calibration will draw a width x height rectangle (at the center of the paper) with different settings 
// to calibrate the y offset and the width of the machine

export let calibration: Calibration = null

export class Calibration {
	
	gui: GUI
    amount: number = 10
    width = 200
    height = 287
    applyTransform = false
    previewTransform = false
    previewTransformController: Controller
    previewRectangle = false
    previewRectangleItem: paper.Item = null
    previewTransformItem: paper.Path = null
    cornersOnly = false
    points: number[] = []
    transformMatrix: any = null

	static initialize(gui: GUI) {
        calibration = new Calibration(gui)
    }
    
	constructor(gui: GUI) {
        this.loadPoints()
        this.createGUI(gui)
    }
    
    loadPoints() {
        if(!Settings.transformMatrix == null || Settings.transformMatrix.destinationPoints == null || Settings.transformMatrix.destinationPoints.length < 8) {
            this.points = this.getDrawAreaPoints()
            Settings.transformMatrix.destinationPoints = this.points.slice()
            return
        }
        this.points = Settings.transformMatrix.destinationPoints
        this.applyTransform = Settings.transformMatrix.apply
        this.updateTransformMatrix()
    }

	createGUI(gui: GUI) {
        this.gui = gui.addFolder('Calibration')

        this.gui.addButton('Set top left', ()=> this.updateTransform(0))
        this.gui.addButton('Set top right', ()=> this.updateTransform(1))
        this.gui.addButton('Set bottom right', ()=> this.updateTransform(2))
        this.gui.addButton('Set bottom left', ()=> this.updateTransform(3))
        this.gui.addButton('Reset transform', ()=> this.resetTransform())
        this.previewTransformController = this.gui.add(this, 'previewTransform').name('Preview transform').onFinishChange(()=> this.togglePreviewTransform())
        this.gui.add(this, 'applyTransform').name('Apply transform').onFinishChange((value)=> {
            Settings.transformMatrix.apply = this.applyTransform
            settingsManager.save(false)
        })

        let testRectangleFolder = this.gui.addFolder('Rectangle test')

		testRectangleFolder.add(this, 'width', 0, 5000, 1).name('Width').onChange(()=> this.updatePreviewRectangle())
		testRectangleFolder.add(this, 'height', 0, 5000, 1).name('Height').onChange(()=> this.updatePreviewRectangle())
		testRectangleFolder.add(this, 'previewRectangle').name('Preview rectangle').onFinishChange(()=> this.togglePreviewRectangle())
        testRectangleFolder.add(this, 'cornersOnly').name('Corners only').onFinishChange(()=> this.updatePreviewRectangle())
        testRectangleFolder.addButton('Draw rectangle', ()=> this.drawRectangle())

        let parameterCalibrationFolder = testRectangleFolder.addFolder('Parameter calibration')
        parameterCalibrationFolder.add(this, 'amount', 0, 100, 1).name('Amount')
        parameterCalibrationFolder.addButton('Calibrate Y', ()=> this.calibrateY())
        parameterCalibrationFolder.addButton('Calibrate Width', ()=> this.calibrateWidth())
    }

    getDrawAreaPoints() {
        let rectangle = tipibot.computeDrawArea()
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
        let position = tipibot.getPosition()
        Settings.transformMatrix.destinationPoints[2 * pointIndex] = position.x
        Settings.transformMatrix.destinationPoints[2 * pointIndex + 1] = position.y
        settingsManager.save(false)
        this.points[2 * pointIndex] = position.x
        this.points[2 * pointIndex + 1] = position.y

        this.updateTransformMatrix()

        this.previewTransformController.setValue(true, true)
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
        let drawArea = tipibot.computeDrawArea()
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
        let rectangle = tipibot.computeDrawArea()

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

        let startPoint = tipibot.getPosition()

        tipibot.sendSpecs()
        tipibot.penUp()
        if(this.cornersOnly){
            tipibot.moveDirect(rectangle.topLeft.add(new paper.Point(0, 10)))
            tipibot.penDown()
            tipibot.moveLinear(rectangle.topLeft)
            tipibot.moveLinear(rectangle.topLeft.add(new paper.Point(10, 0)))
            tipibot.penUp()
            tipibot.moveDirect(rectangle.topRight.add(new paper.Point(-10, 0)))
            tipibot.penDown()
            tipibot.moveLinear(rectangle.topRight)
            tipibot.moveLinear(rectangle.topRight.add(new paper.Point(0, 10)))
            tipibot.penUp()
            tipibot.moveDirect(rectangle.bottomRight.add(new paper.Point(0, -10)))
            tipibot.penDown()
            tipibot.moveLinear(rectangle.bottomRight)
            tipibot.moveLinear(rectangle.bottomRight.add(new paper.Point(-10, 0)))
            tipibot.penUp()
            tipibot.moveDirect(rectangle.bottomLeft.add(new paper.Point(10, 0)))
            tipibot.penDown()
            tipibot.moveLinear(rectangle.bottomLeft)
            tipibot.moveLinear(rectangle.bottomLeft.add(new paper.Point(0, -10)))
        } else {
            tipibot.moveDirect(rectangle.topLeft)
            tipibot.penDown()
            tipibot.moveLinear(rectangle.topRight)
            tipibot.moveLinear(rectangle.bottomRight)
            tipibot.moveLinear(rectangle.bottomLeft)
            tipibot.moveLinear(rectangle.topLeft)
        }
        tipibot.penUp()
        tipibot.moveDirect(startPoint)
    }

	calibrateY() {
        let initialPosition = tipibot.getPosition()
        for(let i = -this.amount ; i <= this.amount ; i += this.amount) {
            tipibot.setPosition(new paper.Point(initialPosition.x, initialPosition.y + i), true, false)
            this.drawRectangle()
        }
        tipibot.setPosition(initialPosition, false, false)
    }
    
	calibrateWidth() {
        let initialPosition = tipibot.getPosition()
        let initialWidth = Settings.tipibot.width
        let initialHeight = Settings.tipibot.height
        let paperCenterX = initialWidth / 2
        for(let i = -this.amount ; i <= this.amount ; i += this.amount) {
            Settings.tipibot.width = initialWidth + i
            tipibot.setPosition(new paper.Point(initialPosition.x + i / 2, initialPosition.y), false, false)
            this.drawRectangle()
        }
        Settings.tipibot.width = initialWidth
        Settings.tipibot.height = initialHeight
        tipibot.setPosition(initialPosition, false, false)
        tipibot.sendSpecs()
	}
}