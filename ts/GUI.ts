declare var dat: any

declare type DatController = {
	domElement: HTMLElement
	property: string
	object: any
	__gui: { name: string, parent: any }
	onChange: (value: any) => any
	onFinishChange: (value: any) => any
	setValue: (value: number | string | boolean) => any
	max: (value: number) => any
	min: (value: number) => any
	step: (value: number) => any
	updateDisplay(): () => any
	options: (options: string[]) => any
	name: (n: string) => DatController
}

declare type DatFolder = {
	__controllers: DatController[]
	addFolder: (options: any)=> DatFolder
	add: (object: any, propertyName: string, min?: number | string[], max?: number, step?: number) => DatController
	domElement: HTMLElement
	open: ()=> void
	close: ()=> void
}

export class Controller {
	controller: DatController
	gui: GUI
	
	constructor(controller: DatController, gui: GUI) {
		this.controller = controller
		this.gui = gui
	}

	getDomElement(): HTMLElement {
		return this.controller.domElement
	}

	getParentNames(): string[] {
		let names: string[] = []
		let gui = this.gui
		do {
			names.push(gui.name)
			gui = gui.parent
		} while(gui != null)
		return names
	}

	getParentDomElement(): HTMLElement {
		return this.getDomElement().parentElement.parentElement
	}

	contains(element: HTMLElement): boolean {
		return this.getParentDomElement().contains(element)
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

	setValue(value: number | string | boolean, callback=true) {
		if(callback) {
			return this.controller.setValue(value)
		}
		this.setValueNoCallback(value)
	}

	setValueNoCallback(value: number | string | boolean) {
		this.controller.object[this.controller.property] = value
		this.controller.updateDisplay()
	}

	max(value: number, callback=false) {
		this.controller.max(value)
		this.setValue(Math.min(value, this.getValue()), callback)
	}

	min(value: number, callback=false) {
		this.controller.min(value)
		this.setValue(Math.max(value, this.getValue()), callback)
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

	hide(): void {
		$(this.getParentDomElement()).hide()
	}

	show(): void {
		$(this.getParentDomElement()).show()
	}
}

export class GUI {
	gui: DatFolder
	parent: GUI
	name: string
	nameToController: Map<string, Controller>
	nameToFolder: Map<string, GUI>

	static loadingTimeoutID: number = null
	
	public static startLoadingAnimation(callback: ()=> any = null) {
		$('#loading').removeClass('hidden')
		clearTimeout(GUI.loadingTimeoutID)
		GUI.loadingTimeoutID = setTimeout(()=> {
			$('#loading').addClass('loading')
			if(callback != null) {
				setTimeout(()=>callback(), 400)
			}
		}, 100)
	}

	public static stopLoadingAnimation() {
		$('#loading').removeClass('loading')
		clearTimeout(GUI.loadingTimeoutID)
		GUI.loadingTimeoutID = setTimeout(()=>$('#loading').addClass('hidden'), 1000)
	}

	constructor(options: any = null, name: string = null, parent: GUI = null) {
		this.gui = parent != null && name != null ? parent.gui.addFolder(name) : new dat.GUI(options)
		this.name = name
		this.parent = parent
		this.nameToController = new Map<string, Controller>()
		this.nameToFolder = new Map<string, GUI>()
	}

	getDomElement(): HTMLElement {
		return this.gui.domElement
	}
	
	add(object: any, propertyName: string, min: number | string[] = null, max: number = null, step: number = null): Controller {
		let controller = new Controller( this.gui.add(object, propertyName, min, max, step), this )
		this.nameToController.set(propertyName, controller)
		return controller
	}

	addButton(name: string, callback: (value?: any)=>any): Controller {
		let object:any = {}
		object[name] = callback
		return this.add(object, name)
	}

	setName(name: string) {
		$(this.getDomElement()).find('li.title').text(name)
	}

	addFileSelectorButton(name: string, fileType: string, callback: (event: any)=>any): Controller {	

		let divJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='" + fileType + "'/>")

		let button = this.addButton(name, (event)=> divJ.click())
		// $(button.getDomElement()).append(divJ)
		divJ.insertAfter(button.getParentDomElement())
		divJ.hide()
		divJ.change((event)=> {
			callback(event)
			divJ.val('')
		})

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
		let folder = new GUI(null, name, this)
		this.nameToFolder.set(name, folder)
		return folder
	}

	getController(name: string): Controller {
		return this.nameToController.get(name)
	}

	getControllers(): Controller[] {
		let keyValues = Array.from(this.nameToController)
		return Array.from(keyValues, keyValue => keyValue[1])
	}

	getAllControllers(): Controller[] {
		let controllers = this.getControllers()
		for(let f of this.nameToFolder) {
			let folder = f[1]
			controllers = controllers.concat(folder.getAllControllers())
		}
		return controllers
	}

	getFolder(name: string): GUI {
		return this.nameToFolder.get(name)
	}

	getFolders(): GUI[] {
		let keyValues = Array.from(this.nameToFolder)
		return Array.from(keyValues, keyValue => keyValue[1])
	}

	hide(): void {
		$(this.gui.domElement).hide()
	}

	show(): void {
		$(this.gui.domElement).show()
	}

	open() {
		this.gui.open()
	}

	close() {
		this.gui.close()
	}
}