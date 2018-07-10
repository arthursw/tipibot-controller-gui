
export class Console {
	log: ()=> void
	error: ()=> void
	info: ()=> void
	table: ()=> void

	constructor() {
		document.addEventListener('AddedCommand', (event: CustomEvent)=> this.scrollToBottom(), false)

		this.log = console.log.bind(console)
		this.error = console.error.bind(console)
		this.info = console.info.bind(console)
		this.table = console.table.bind(console)

		let log = (args: any[], logger: (message:string)=>void, type: string)=> {
			
			if (typeof logger === 'function') {
				logger.apply(console, args);
			}

			let div = $('<li>')

			for(let arg of args) {
				let p = null
				if(typeof arg == 'object') {
					p = this.logTable(arg)
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
			
			let consoleJ = $('#console ul')
			consoleJ.append(div)
			this.scrollToBottom(consoleJ)
		}

		console.log = (...args: any[])=> {
			log(args, this.log, 'log')
		}
		console.error = (...args: any[])=> log(args, this.error, 'error')
		console.info = (...args: any[])=> log(args, this.info, 'info')
		console.table = (...args: any[])=> log(args, this.table, 'table')
	}

	scrollToBottom(consoleJ: JQuery = $('#console ul')) {
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

	logTable(...args: any[]) {
		var objArr = args[0];
		var keys;

		if (typeof objArr[0] !== 'undefined') {
			keys = Object.keys(objArr[0]);
		}
		
		return this.printTable(objArr, keys);
	};

}