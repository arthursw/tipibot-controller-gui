import { Settings, paper } from "./Settings"
import { settingsManager } from "./SettingsManager"
import { GUI, Controller } from "./GUI"
import { Calibration } from "./CalibrationStatic"
import { Tipibot } from "./TipibotStatic"

// on handle click (if not shift): move to handle
// on validate button: set handle to current position
// on handle drag if shift: update handle position 
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
        this.gui.add(Settings.calibration, 'maxStepSize', 1, 1000, 1).name('Max step size').onFinishChange((value)=> settingsManager.save(false))
        this.gui.add(this, 'nCellsX', 1, 10, 1).name('N cells X').onFinishChange(()=> this.initializeGrid(true))
        this.gui.add(this, 'nCellsY', 1, 10, 1).name('N cells Y').onFinishChange(()=> this.initializeGrid(true))
        
        this.gui.addButton('Apply current handle', ()=> this.applyHandle())
        this.gui.addButton('Reset calibration', ()=> this.initializeGrid(true))

        this.previewTransformController = this.gui.add(this, 'previewTransform').name('Preview transform').onFinishChange((value)=> {
            this.handleGroup.visible = value
            this.gridGroup.visible = value
        })
        this.gui.add(Settings.calibration, 'apply').name('Apply calibration').onFinishChange((value)=> {
            settingsManager.save(false)
        })

        let testRectangleFolder = this.gui.addFolder('Rectangle test')
		testRectangleFolder.add(this, 'previewRectangleWidth', 0, 5000, 1).name('Width').onChange(()=> this.updatePreviewRectangle())
		testRectangleFolder.add(this, 'previewRectangleHeight', 0, 5000, 1).name('Height').onChange(()=> this.updatePreviewRectangle())
		testRectangleFolder.add(this, 'previewRectangle').name('Preview rectangle').onFinishChange(()=> this.togglePreviewRectangle())
        testRectangleFolder.add(this, 'cornersOnly').name('Corners only').onFinishChange(()=> this.updatePreviewRectangle())
        testRectangleFolder.addButton('Draw rectangle', ()=> this.drawRectangle())

        let parameterCalibrationFolder = testRectangleFolder.addFolder('Parameter calibration')
        parameterCalibrationFolder.add(this, 'amount', 0, 100, 1).name('Amount')
        parameterCalibrationFolder.addButton('Calibrate Y', ()=> this.calibrateY())
        parameterCalibrationFolder.addButton('Calibrate Width', ()=> this.calibrateWidth())
    }

    applyHandle() {
        this.handles[this.currentHandle.y][this.currentHandle.x].position = Tipibot.tipibot.getPosition()
        this.saveHandles()
        this.updateGrid()
        this.previewTransformController.setValue(true, true)
    }
}