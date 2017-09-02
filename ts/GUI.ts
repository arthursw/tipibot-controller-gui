declare var dat: any

declare type DatController = {
	domElement: HTMLElement
	property: string
	object: any
	__gui: { name: string, parent: any }
	onChange: (value: any) => any
	onFinishChange: (value: any) => any
	setValue: (value: number) => any
	max: (value: number) => any
	min: (value: number) => any
	step: (value: number) => any
	updateDisplay(): () => any
	options: (options: string[]) => any
	name: (n: string) => DatController
}

declare type DatFolder = {
	__controllers: Controller[]
}

export class Controller {
	controller: DatController
	
	constructor(controller: DatController) {
		this.controller = controller
	}

	getDomElement(): HTMLElement {
		return this.controller.domElement
	}

	getParent(): { name: string, parent: any } {
		return this.controller.__gui
	}

	getTopParentName(): string {
		let name = ''
		let folder = this.getParent()
		do {
			name = folder.name
			folder = folder.parent
		} while(folder.name)
		return name
	}

	getParentDomElement(): HTMLElement {
		return this.getDomElement().parentElement.parentElement
	}

	contains(element: HTMLElement): boolean {
		return $.contains(this.getParentDomElement(), element)
	}

	getProperty(): string {
		return this.controller.property
	}

	getName(): string {
		return this.controller.property
	}

	getValue(): any {
		return this.controller.object[this.controller.property]
	}

	onChange(callback: (value: any) => any) {
		this.controller.onChange(callback)
		return this
	}

	onFinishChange(callback: (value: any) => any) {
		this.controller.onFinishChange(callback)
		return this
	}

	setValue(value: number, noCallback=false) {
		if(noCallback) {
			return this.setValueNoCallback(value)
		}
		this.controller.setValue(value)
	}

	setValueNoCallback(value: number) {
		this.controller.object[this.controller.property] = value
		this.controller.updateDisplay()
	}

	max(value: number, noCallback=true) {
		this.controller.max(value)
		if(noCallback) {
			this.setValueNoCallback(Math.min(value, this.getValue()))
		} else {
			this.setValue(Math.min(value, this.getValue()))
		}
	}

	min(value: number, noCallback=true) {
		this.controller.min(value)
		if(noCallback) {
			this.setValueNoCallback(Math.max(value, this.getValue()))
		} else {
			this.setValue(Math.max(value, this.getValue()))
		}
	}

	step(value: number) {
		this.controller.step(value)
	}

	updateDisplay() {
		this.controller.updateDisplay()
	}

	options(options: string[]): any {
		return this.controller.options(options)
	}

	setName(name: string): Controller {
		this.name(name)
		return this
	}

	name(name: string): Controller {
		this.controller.name(name)
		return this
	}
}

export class GUI {
	gui: any
	nameToController: Map<string, Controller>

	constructor(folder: DatFolder = null, options: any = null) {
		this.nameToController = new Map<string, Controller>()
		this.gui = folder != null ? folder : new dat.GUI(options)
	}

	getDomElement(): HTMLElement {
		return this.gui.domElement
	}
	
	add(object: any, propertyName: string, min: number = null, max: number = null, step: number = null): Controller {
		let controller = new Controller( this.gui.add(object, propertyName, min, max, step) )
		this.nameToController.set(propertyName, controller)
		return controller
	}

	addButton(name: string, callback: (value?: any)=>any): Controller {
		let object:any = {}
		object[name] = callback
		return this.add(object, name)
	}

	addFileSelectorButton(name: string, fileType: string, callback: (event: any)=>any): Controller {	

		let divJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='" + fileType + "'/>")

		let button = this.addButton(name, ()=> divJ.click() )
		$(button.getDomElement()).append(divJ)
		divJ.hide()
		divJ.change(callback)

		return button
	}

	addSlider(name: string, value: number, min: number, max: number, step: number=null): Controller {
		let object:any = {}
		object[name] = value
		let slider:any = this.add(object, name, min, max)
		if(step != null) {
			slider.step(step)
		}
		return slider
	}

	addFolder(name: string): GUI {
		return new GUI(this.gui.addFolder(name))
	}

	getController(name: string): Controller {
		return this.nameToController.get(name)
	}

	getControllers(): Controller[] {
		let keyValues = Array.from(this.nameToController)
		return Array.from(keyValues, keyValue => keyValue[1])
	}
}