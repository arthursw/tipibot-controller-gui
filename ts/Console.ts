import $ = require("jquery");
import { GUI } from "./GUI"
declare var dat: any

export class Console {

	readonly MAX_NUM_MESSAGES = 1000
	scrollingToBottom = false
	skipScrollToBottom = false

	gui: GUI
	folder: GUI
	listJ: JQuery

	log: ()=> void
	warn: ()=> void
	error: ()=> void
	info: ()=> void
	table: ()=> void

	constructor() {
		document.addEventListener('CommandListChanged', (event: CustomEvent)=> this.scrollToBottom(), false)

		this.log = console.log.bind(console)
		this.error = console.error.bind(console)
		this.info = console.info.bind(console)
		this.warn = console.warn.bind(console)
		this.table = console.table.bind(console)

		let log = (args: any[], logger: (message:string)=>void, type: string)=> {
			
			if (typeof logger === 'function') {
				logger.apply(console, args);
			}

			let div = $('<li>')

			if(type == 'table') {
				let p = this.logTable.apply(this, args)
				div.append(p)
			} else {
				for(let arg of args) {
					let p = null
					if(typeof arg == 'object') {
						// p = this.logObject(arg)
						p = $('<p>').append(arg).addClass(type)
					} else if(arg instanceof Array) {
						let result = JSON.stringify(arg)
						if(result.length > 100) {
							result = result.substr(0, 20) + '...' + result.substr(result.length-20)
						}
						p = $('<p>').append(result).addClass(type)
					} else {
						p = $('<p>').append(arg).addClass(type)
					}
					div.append(p)
				}
			}

			let consoleJ = this.listJ
			if(consoleJ.children().length >= this.MAX_NUM_MESSAGES) {
				consoleJ.find('li:first-child').remove()
			}
			consoleJ.append(div)
			this.scrollToBottom(consoleJ)
		}

		console.log = (...args: any[])=> log(args, this.log, 'log')
		console.error = (...args: any[])=> log(args, this.error, 'error')
		console.info = (...args: any[])=> log(args, this.info, 'info')
		console.warn = (...args: any[])=> log(args, this.warn, 'warn')
		console.table = (...args: any[])=> log(args, this.table, 'table')

		this.gui = new GUI({ autoPlace: false })

		let customContainer = document.getElementById('info')
		customContainer.appendChild(this.gui.getDomElement())
	}

	createGUI() {
		this.folder = this.gui.addFolder('Console')
		this.folder.open()
		this.listJ = $('<ul id="console-list" class="c-list">')

		this.listJ.insertAfter($(this.folder.gui.domElement).find('li'))

		this.listJ.scroll((event)=> {
			if(!this.scrollingToBottom) {
				let consoleE = this.listJ.get(0)
				this.skipScrollToBottom = consoleE.scrollTop + consoleE.clientHeight < consoleE.scrollHeight
			}
			this.scrollingToBottom = false
		});

		this.updateMaxHeight()
		window.addEventListener( 'resize', ()=> this.updateMaxHeight(), false )
		$('#info').click(()=> this.updateMaxHeight()) // to handle the case when user opens / closes a folder
	}

	updateMaxHeight() {
		this.listJ.css('max-height', $('#info').outerHeight() - this.listJ.offset().top)
	}

	scrollToBottom(consoleJ = this.listJ) {
		this.updateMaxHeight()
		if(this.skipScrollToBottom) {
			return
		}
		this.scrollingToBottom = true
		consoleJ.scrollTop(consoleJ.get(0).scrollHeight)
	}

	printTable(objArr: any, keys: string[]) {

		var numCols = keys.length;
		var len = objArr.length;
		var $table = document.createElement('table');
		$table.style.width = '100%';
		$table.setAttribute('border', '1');
		var $head = document.createElement('thead');
		var $tdata = document.createElement('td');
		$tdata.innerHTML = 'Index';
		$head.appendChild($tdata);

		for (var k = 0; k < numCols; k++) {
			$tdata = document.createElement('td');
			$tdata.innerHTML = keys[k];
			$head.appendChild($tdata);
		}
		$table.appendChild($head);

		for (var i = 0; i < len; i++) {
			var $line = document.createElement('tr');
			let $tdata: any = <any>document.createElement('td');
			$tdata.innerHTML = i;
			$line.appendChild($tdata);

			for (var j = 0; j < numCols; j++) {
				$tdata = document.createElement('td');
				$tdata.innerHTML = objArr[i][keys[j]];
				$line.appendChild($tdata);
			}
			$table.appendChild($line);
		}
		return $table;
	}

	logObject(object: any) {
		let properties = []
		for(let property in object) {
			properties.push({name: property, value: object[property]})
		}
		return this.printTable(properties, ['name', 'value']);
	};

	logTable(...args: any[]) {
		var objArr = args[0];
		var keys;

		if (typeof objArr !== 'undefined') {
			keys = Object.keys(objArr);
		}
		
		return this.printTable(objArr, keys);
	}

}