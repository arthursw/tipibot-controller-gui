var userAgent = navigator.userAgent.toLowerCase();

if (userAgent.indexOf(' electron/') > -1) {
   
	// Fix to make jQuery work in electron, see https://stackoverflow.com/questions/32621988/electron-jquery-is-not-defined
	if (typeof module === 'object') {
		window.module = module;
		module = undefined;
	}

	const Store = require('../store.js')

	// Create a store to load config file
	const store = new Store({
	  // We'll call our data file 'user-preferences'
	  configName: 'user-preferences',
	  defaults: {
	    port: 6842
	  }
	})

	window.localStorage.setItem('port', store.get('port'));
}