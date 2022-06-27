import { Settings } from "./Settings"
import { settingsManager } from "./SettingsManager"
import { GUI, Controller } from "./GUI"
import { Calibration } from "./CalibrationStatic"

export class CalibrationInteractive extends Calibration {
	
	gui: GUI
    previewTransformController: Controller
    
	static initialize(gui: any=null) {
        Calibration.calibration = new CalibrationInteractive(gui)
    }
    
	constructor(gui: GUI) {
        super()
        this.createGUI(gui)
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

    updateTransform(pointIndex: number) {
        super.updateTransform(pointIndex)
        settingsManager.save(false)
        this.previewTransformController.setValue(true, true)
    }
}