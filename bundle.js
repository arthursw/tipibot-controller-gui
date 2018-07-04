/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
let tipibotHeight = 2020;
let tipibotWidth = 1780;
let paperHeight = 900;
let paperWidth = 1200;
let homeX = 0;
let homeY = 388;
exports.Settings = {
    autoConnect: true,
    tipibot: {
        width: tipibotWidth,
        height: tipibotHeight,
        homeX: tipibotWidth / 2,
        homeY: paperHeight + homeY,
        invertMotorLeft: false,
        invertMotorRight: false,
        maxSpeed: 500,
        acceleration: 200,
        stepsPerRev: 200,
        microstepResolution: 32,
        mmPerRev: 96,
        progressiveMicrosteps: false,
        penWidth: 2
    },
    servo: {
        speed: 100,
        position: {
            invert: false,
            up: 90,
            down: 180,
        },
        delay: {
            up: {
                before: 0,
                after: 0,
            },
            down: {
                before: 1000,
                after: 2000,
            },
        }
    },
    drawArea: {
        y: homeY,
        width: paperWidth,
        height: paperHeight
    },
    plot: {
        flatten: true,
        flattenPrecision: 0.25,
        subdivide: false,
        maxSegmentLength: 10,
        fullSpeed: true
    }
};
const MAX_SPEED = 10000;
class SettingsManager {
    constructor() {
        this.gui = null;
        this.tipibotPositionFolder = null;
        this.drawAreaDimensionsFolder = null;
        this.motorsFolder = null;
        this.homeFolder = null;
        this.loadLocalStorage();
    }
    static mmPerSteps() {
        return exports.Settings.tipibot.mmPerRev / (exports.Settings.tipibot.stepsPerRev * exports.Settings.tipibot.microstepResolution);
    }
    static stepsPerMm() {
        return (exports.Settings.tipibot.stepsPerRev * exports.Settings.tipibot.microstepResolution) / exports.Settings.tipibot.mmPerRev;
    }
    static mmToSteps(point) {
        return point.multiply(SettingsManager.stepsPerMm());
    }
    static stepsToMm(point) {
        return point.multiply(SettingsManager.mmPerSteps());
    }
    static servoUpAngle() {
        return exports.Settings.servo.position.invert ? exports.Settings.servo.position.down : exports.Settings.servo.position.up;
    }
    static servoDownAngle() {
        return exports.Settings.servo.position.invert ? exports.Settings.servo.position.up : exports.Settings.servo.position.down;
    }
    getControllers() {
        return this.gui.getFolder('Settings').getAllControllers();
    }
    createGUI(gui) {
        this.gui = gui;
        let settingsFolder = gui.addFolder('Settings');
        settingsFolder.open();
        let loadSaveFolder = settingsFolder.addFolder('Load & Save');
        loadSaveFolder.addFileSelectorButton('Load', 'application/json', (event) => this.handleFileSelect(event));
        loadSaveFolder.add(this, 'save').name('Save');
        this.tipibotPositionFolder = settingsFolder.addFolder('Position');
        this.tipibotPositionFolder.addButton('Set position with mouse', () => this.tipibot.toggleSetPosition());
        this.tipibotPositionFolder.addButton('Set position to home', () => this.tipibot.setPositionToHome());
        let position = new paper.Point(exports.Settings.tipibot.homeX, exports.Settings.tipibot.homeY);
        this.tipibotPositionFolder.add(position, 'x', 0, exports.Settings.tipibot.width).name('X');
        this.tipibotPositionFolder.add(position, 'y', 0, exports.Settings.tipibot.height).name('Y');
        this.homeFolder = settingsFolder.addFolder('Home');
        this.homeFolder.addButton('Set home', () => this.tipibot.setHome());
        this.homeFolder.add({ 'Position': 'Bottom' }, 'Position', ['Custom', 'Top', 'Center', 'Bottom', 'Left', 'Right', 'TopLeft', 'BottomLeft', 'TopRight', 'BottomRight']);
        this.homeFolder.add(exports.Settings.tipibot, 'homeX', 0, exports.Settings.tipibot.width).name('Home X');
        this.homeFolder.add(exports.Settings.tipibot, 'homeY', 0, exports.Settings.tipibot.height).name('Home Y');
        this.homeFolder.open();
        let tipibotDimensionsFolder = settingsFolder.addFolder('Machine dimensions');
        tipibotDimensionsFolder.add(exports.Settings.tipibot, 'width', 100, 10000, 1).name('Width');
        tipibotDimensionsFolder.add(exports.Settings.tipibot, 'height', 100, 10000, 1).name('Height');
        this.drawAreaDimensionsFolder = settingsFolder.addFolder('Draw area dimensions');
        this.drawAreaDimensionsFolder.add(exports.Settings.drawArea, 'y', 0, exports.Settings.tipibot.height, 1).name('Offset Y');
        this.drawAreaDimensionsFolder.add(exports.Settings.drawArea, 'width', 0, exports.Settings.tipibot.width, 1).name('Width');
        this.drawAreaDimensionsFolder.add(exports.Settings.drawArea, 'height', 0, exports.Settings.tipibot.height, 1).name('Height');
        let penFolder = settingsFolder.addFolder('Pen');
        penFolder.add(exports.Settings.tipibot, 'penWidth', 0.1, 20).name('Pen width');
        penFolder.add(exports.Settings.servo, 'speed', 1, 360, 1).name('Servo speed deg/sec.');
        let anglesFolder = penFolder.addFolder('Angles');
        anglesFolder.add(exports.Settings.servo.position, 'invert').name('Invert');
        anglesFolder.add(exports.Settings.servo.position, 'up', 0, 180, 1).name('Up');
        anglesFolder.add(exports.Settings.servo.position, 'down', 0, 180, 1).name('Down');
        let delaysFolder = penFolder.addFolder('Delays');
        let delaysUpFolder = delaysFolder.addFolder('Up');
        delaysUpFolder.add(exports.Settings.servo.delay.up, 'before', 0, 3000, 1).name('Before');
        delaysUpFolder.add(exports.Settings.servo.delay.up, 'after', 0, 3000, 1).name('After');
        let delaysDownFolder = delaysFolder.addFolder('Down');
        delaysDownFolder.add(exports.Settings.servo.delay.down, 'before', 0, 3000, 1).name('Before');
        delaysDownFolder.add(exports.Settings.servo.delay.down, 'after', 0, 3000, 1).name('After');
        this.motorsFolder = settingsFolder.addFolder('Motors');
        this.motorsFolder.add(exports.Settings.tipibot, 'invertMotorLeft').name('Invert left motor');
        this.motorsFolder.add(exports.Settings.tipibot, 'invertMotorRight').name('Invert right motor');
        this.motorsFolder.add(exports.Settings.tipibot, 'maxSpeed', 1, MAX_SPEED, 1).name('Max speed steps/sec.');
        this.motorsFolder.add({ maxSpeedMm: exports.Settings.tipibot.maxSpeed * SettingsManager.mmPerSteps() }, 'maxSpeedMm', 0.1, MAX_SPEED * SettingsManager.mmPerSteps(), 0.01).name('Max speed mm/sec.');
        this.motorsFolder.add(exports.Settings.tipibot, 'acceleration', 1, 5000, 1).name('Acceleration');
        this.motorsFolder.add(exports.Settings.tipibot, 'stepsPerRev', 1, 500, 1).name('Steps per rev.');
        this.motorsFolder.add(exports.Settings.tipibot, 'microstepResolution', 1, 64, 1).name('Step multiplier');
        this.motorsFolder.add(exports.Settings.tipibot, 'mmPerRev', 1, 250, 1).name('Mm per rev.');
        this.motorsFolder.add(exports.Settings.tipibot, 'progressiveMicrosteps').name('Progressive Microsteps');
        let controllers = this.getControllers();
        for (let controller of controllers) {
            let name = controller.getName();
            let parentNames = controller.getParentNames();
            controller.onChange((value) => this.settingChanged(parentNames, name, value, false));
            controller.onFinishChange((value) => this.settingChanged(parentNames, name, value, true));
        }
    }
    setTipibot(tipibot) {
        this.tipibot = tipibot;
    }
    updateHomePosition(homePositionName, updateSliders = true) {
        if (homePositionName == 'Top') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y;
        }
        else if (homePositionName == 'Center') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y + exports.Settings.drawArea.height / 2;
        }
        else if (homePositionName == 'Bottom') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y + exports.Settings.drawArea.height;
        }
        else if (homePositionName == 'Left') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2 - exports.Settings.drawArea.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y + exports.Settings.drawArea.height / 2;
        }
        else if (homePositionName == 'Right') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2 + exports.Settings.drawArea.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y + exports.Settings.drawArea.height / 2;
        }
        else if (homePositionName == 'TopLeft') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2 - exports.Settings.drawArea.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y;
        }
        else if (homePositionName == 'BottomLeft') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2 - exports.Settings.drawArea.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y + exports.Settings.drawArea.height;
        }
        else if (homePositionName == 'TopRight') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2 + exports.Settings.drawArea.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y;
        }
        else if (homePositionName == 'BottomRight') {
            exports.Settings.tipibot.homeX = exports.Settings.tipibot.width / 2 + exports.Settings.drawArea.width / 2;
            exports.Settings.tipibot.homeY = exports.Settings.drawArea.y + exports.Settings.drawArea.height;
        }
        if (updateSliders) {
            this.homeFolder.getController('homeX').setValueNoCallback(exports.Settings.tipibot.homeX);
            this.homeFolder.getController('homeY').setValueNoCallback(exports.Settings.tipibot.homeY);
        }
        this.tipibot.setHome(false);
    }
    settingChanged(parentNames, name, value = null, changeFinished = false) {
        // update sliders and transmit change to concerned object
        if (parentNames[0] == 'Tipibot dimensions') {
            if (name == 'width') {
                this.tipibotPositionFolder.getController('x').max(value, false);
                this.drawAreaDimensionsFolder.getController('width').max(value, changeFinished);
            }
            else if (name == 'height') {
                this.tipibotPositionFolder.getController('y').max(value, false);
                this.drawAreaDimensionsFolder.getController('height').max(value, changeFinished);
                this.drawAreaDimensionsFolder.getController('y').max(value - exports.Settings.drawArea.height, changeFinished);
            }
            if (name == 'width' || name == 'height') {
                this.updateHomePosition(this.homeFolder.getController('Position').getValue(), true);
                this.tipibot.sizeChanged(changeFinished);
            }
        }
        else if (parentNames[0] == 'Home') {
            if (name == 'Position') {
                this.updateHomePosition(value, true);
            }
            if (name == 'homeX' || name == 'homeY') {
                this.homeFolder.getController('Position').setValueNoCallback('Custom');
                this.tipibot.setHome(false);
            }
        }
        else if (parentNames[0] == 'Motors') {
            if (name == 'maxSpeed') {
                let maxSpeedMm = value * SettingsManager.mmPerSteps();
                this.motorsFolder.getController('maxSpeedMm').setValueNoCallback(maxSpeedMm);
                this.tipibot.maxSpeedChanged(changeFinished);
            }
            else if (name == 'maxSpeedMm') {
                let maxSpeedSteps = value / SettingsManager.mmPerSteps();
                this.motorsFolder.getController('maxSpeed').setValueNoCallback(maxSpeedSteps);
                exports.Settings.tipibot.maxSpeed = maxSpeedSteps;
                this.tipibot.maxSpeedChanged(changeFinished);
            }
            else if (name == 'acceleration') {
                this.tipibot.accelerationChanged(changeFinished);
            }
            else if (name == 'mmPerRev') {
                this.tipibot.mmPerRevChanged(changeFinished);
            }
            else if (name == 'stepsPerRev') {
                this.tipibot.stepsPerRevChanged(changeFinished);
            }
            else if (name == 'microstepResolution') {
                this.tipibot.microstepResolutionChanged(changeFinished);
            }
            else if (name == 'penWidth') {
                this.tipibot.penWidthChanged(changeFinished);
            }
            else if (name == 'invertMotorLeft' || name == 'invertMotorRight' && changeFinished) {
                this.tipibot.sendInvertXY();
            }
            else if (name == 'progressiveMicrosteps' && changeFinished) {
                this.tipibot.sendProgressiveMicrosteps();
            }
        }
        else if (parentNames[0] == 'Position') {
            if (name == 'x') {
                this.tipibot.setX(value, changeFinished);
            }
            else if (name == 'y') {
                this.tipibot.setY(value, changeFinished);
            }
        }
        else if (parentNames[0] == 'Angles' && parentNames[1] == 'Pen' && (name == 'up' || name == 'down')) {
            if (changeFinished) {
                this.tipibot.servoChanged(changeFinished);
            }
        }
        else if (parentNames[0] == 'Pen') {
            if (name == 'penWidth') {
                if (changeFinished) {
                    this.tipibot.penWidthChanged(true);
                }
            }
            else if (name == 'speed') {
                this.tipibot.servoChanged(changeFinished);
            }
        }
        else if (parentNames[0] == 'Draw area dimensions') {
            this.tipibot.drawAreaChanged(changeFinished);
            this.updateHomePosition(this.homeFolder.getController('Position').getValue(), true);
        }
        this.save(false);
    }
    // When loading settings (load from json file)
    settingsChanged() {
        this.tipibotPositionFolder.getController('x').max(exports.Settings.tipibot.width, false);
        this.tipibotPositionFolder.getController('y').max(exports.Settings.tipibot.height, false);
        this.drawAreaDimensionsFolder.getController('width').max(exports.Settings.tipibot.width, false);
        this.drawAreaDimensionsFolder.getController('height').max(exports.Settings.tipibot.height, false);
        this.drawAreaDimensionsFolder.getController('y').max(exports.Settings.tipibot.height - exports.Settings.drawArea.height, false);
        this.tipibotPositionFolder.getController('x').setValue(exports.Settings.tipibot.homeX, false);
        this.tipibotPositionFolder.getController('y').setValue(exports.Settings.tipibot.homeY, false);
        this.homeFolder.getController('Position').setValue('Custom', false);
        this.homeFolder.getController('homeX').setValue(exports.Settings.tipibot.homeX, false);
        this.homeFolder.getController('homeY').setValue(exports.Settings.tipibot.homeY, false);
        for (let controller of this.getControllers()) {
            controller.updateDisplay();
        }
        this.tipibot.maxSpeedChanged(true);
        this.tipibot.mmPerRevChanged(true);
        this.tipibot.stepsPerRevChanged(true);
        this.tipibot.microstepResolutionChanged(true);
        this.tipibot.penWidthChanged(true);
        this.tipibot.servoChanged(true);
        this.tipibot.sizeChanged(true);
        this.tipibot.drawAreaChanged(true);
        // this.tipibot.setX(Settings.tipibot.homeX, false)
        // this.tipibot.setY(Settings.tipibot.homeY, true)
        this.tipibot.setHome(false);
        // save to local storage
        this.save(false);
    }
    save(saveFile = true) {
        let json = JSON.stringify(exports.Settings, null, '\t');
        localStorage.setItem('settings', json);
        if (saveFile) {
            var blob = new Blob([json], { type: "application/json" });
            saveAs(blob, "settings.json");
        }
    }
    updateSliders() {
        let controllers = this.getControllers();
        for (let controller of controllers) {
            controller.updateDisplay();
        }
    }
    copyObjectProperties(target, source) {
        if (source == null) {
            return;
        }
        for (let property in target) {
            if (typeof (target[property]) === 'object') {
                this.copyObjectProperties(target[property], source[property]);
            }
            else if (source[property] != null) {
                if (typeof target[property] == typeof source[property]) {
                    target[property] = source[property];
                }
            }
        }
    }
    copyObjectPropertiesFromJSON(target, jsonSource) {
        if (jsonSource == null) {
            return;
        }
        this.copyObjectProperties(target, JSON.parse(jsonSource));
    }
    onJsonLoad(event) {
        if (event.target != null && event.target.result != null) {
            this.copyObjectPropertiesFromJSON(exports.Settings, event.target.result);
            this.settingsChanged();
            this.updateSliders();
        }
    }
    handleFileSelect(event) {
        let files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (let i = 0; i < files.length; i++) {
            let file = files.item(i);
            let reader = new FileReader();
            reader.onload = (event) => this.onJsonLoad(event);
            reader.readAsText(file);
        }
    }
    loadLocalStorage() {
        this.copyObjectPropertiesFromJSON(exports.Settings, localStorage.getItem('settings'));
    }
}
exports.SettingsManager = SettingsManager;
exports.settingsManager = new SettingsManager();


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const TipibotInterpreter_1 = __webpack_require__(15);
// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent
// export const SERIAL_COMMUNICATION_SPEED = 57600
exports.SERIAL_COMMUNICATION_SPEED = 115200;
let PORT = window.localStorage.getItem('port') || 6842;
class Socket {
    constructor(url, communication) {
        this.socket = new WebSocket(url);
        this.communication = communication;
        this.socket.addEventListener('message', (event) => {
            let json = JSON.parse(event.data);
            let type = json.type;
            let data = json.data;
            let interpreter = this.communication.interpreter;
            if (type == 'opened') {
                communication.onConnectionOpened();
            }
            else if (type == 'closed') {
                communication.onConnectionClosed();
            }
            else if (type == 'list') {
                let options = ['Disconnected'];
                for (let port of data) {
                    options.push(port.comName);
                }
                communication.initializePortController(options);
                if (Settings_1.Settings.autoConnect) {
                    for (let port of data) {
                        if (port.manufacturer != null && port.manufacturer.indexOf('Arduino') >= 0) {
                            communication.portController.setValue(port.comName);
                            break;
                        }
                    }
                }
            }
            else if (type == 'data') {
                // If receiving messages while not connected: consider it as simulation
                if (communication.portController.getValue().indexOf('Disconnected') == 0) {
                    data += '\n';
                }
                interpreter.messageReceived(data);
            }
            else if (type == 'error') {
                console.error(data);
            }
        });
    }
    on() {
        // this.socket.addEventListener.apply(this.socket, arguments)
    }
    emit() {
        let message = { type: arguments[0], data: arguments[1] };
        this.socket.send.apply(this.socket, [JSON.stringify(message)]);
    }
}
class Communication {
    constructor(gui) {
        this.autoConnectIntervalID = -1;
        this.connectionOpened = false;
        exports.communication = this;
        this.socket = null;
        this.gui = gui;
        this.portController = null;
        this.interpreter = new TipibotInterpreter_1.TipibotInterpreter();
        // this.interpreter = new Polargraph()
        this.connectToSerial();
        if (Settings_1.Settings.autoConnect) {
            this.startAutoConnection();
        }
    }
    setTipibot(tipibot) {
        this.interpreter.setTipibot(tipibot);
    }
    startAutoConnection() {
        this.autoConnectIntervalID = setInterval(() => this.tryConnection(), 1000);
    }
    stopAutoConnection() {
        clearInterval(this.autoConnectIntervalID);
        this.autoConnectIntervalID = null;
    }
    onConnectionOpened() {
        this.connectionOpened = true;
        this.stopAutoConnection();
        this.interpreter.connectionOpened();
        this.gui.setName('Communication - connected');
    }
    onConnectionClosed() {
        this.connectionOpened = false;
        if (Settings_1.Settings.autoConnect) {
            this.startAutoConnection();
        }
        // this.interpreter.connectionClosed()	
        this.gui.setName('Communication - closed');
    }
    initializePortController(options) {
        this.portController = this.portController.options(options);
        $(this.portController.domElement.parentElement.parentElement).mousedown((event) => {
            this.autoConnectController.setValue(false);
        });
        this.portController.onFinishChange((value) => this.serialConnectionPortChanged(value));
    }
    connectToSerial() {
        this.autoConnectController = this.gui.add(Settings_1.Settings, 'autoConnect').name('Auto connect').onFinishChange((value) => {
            if (value) {
                this.startAutoConnection();
            }
            else {
                this.stopAutoConnection();
            }
        });
        this.portController = this.gui.add({ 'Connection': 'Disconnected' }, 'Connection');
        this.gui.addButton('Disconnect', () => this.disconnect());
        this.gui.addButton('Refresh', () => {
            this.socket.emit('list');
        });
        this.initializePortController(['Disconnected']);
        // this.socket = io('ws://localhost:' + PORT)
        // this.socket = io('ws://localhost:' + PORT, {transports: ['websocket', 'polling', 'flashsocket']})
        this.socket = new Socket('ws://localhost:' + PORT, this);
        this.interpreter.setSocket(this.socket);
        this.socket.on('list', (ports) => {
        });
        this.socket.on('opened', () => {
            this.interpreter.connectionOpened();
        });
        this.socket.on('data', (data) => {
            this.interpreter.messageReceived(data);
        });
        this.socket.on('error', (message) => {
            console.error(message);
        });
        // window.sendToSerial = (message: string)=> {
        // 	this.socket.emit('data', message)
        // }
    }
    disconnect() {
        this.autoConnectController.setValue(false);
        this.onConnectionClosed();
        this.socket.emit('close');
        document.dispatchEvent(new CustomEvent('Disconnect'));
        this.portController.setValue('Disconnected');
    }
    serialConnectionPortChanged(portName) {
        if (portName == 'Disconnected' && this.connectionOpened) {
            this.disconnect();
        }
        else {
            this.interpreter.setSerialPort(portName);
            document.dispatchEvent(new CustomEvent('Connect', { detail: portName }));
            this.socket.emit('open', { name: portName, baudRate: exports.SERIAL_COMMUNICATION_SPEED });
        }
    }
    tryConnection() {
        if (!Settings_1.Settings.autoConnect || this.connectionOpened) {
            return;
        }
        this.socket.emit('list');
    }
}
exports.Communication = Communication;
exports.communication = null;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Communication_1 = __webpack_require__(1);
const Settings_1 = __webpack_require__(0);
const InteractiveItem_1 = __webpack_require__(4);
const Pen_1 = __webpack_require__(3);
const PlotInterface_1 = __webpack_require__(7);
class Tipibot {
    constructor() {
        this.gui = null;
        this.renderer = null;
        this.penStateButton = null;
        this.motorsEnableButton = null;
        this.settingPosition = false;
        this.initialPosition = null;
        this.initializedCommunication = false;
        this.motorsEnabled = true;
        this.moveToButtons = [];
    }
    cartesianToLengths(point) {
        let lx2 = Settings_1.Settings.tipibot.width - point.x;
        let lengths = new paper.Point(Math.sqrt(point.x * point.x + point.y * point.y), Math.sqrt(lx2 * lx2 + point.y * point.y));
        return lengths;
    }
    lengthsToCartesian(lengths) {
        let r1 = lengths.x;
        let r2 = lengths.y;
        let w = Settings_1.Settings.tipibot.width;
        let x = (r1 * r1 - r2 * r2 + w * w) / (2 * w);
        let y = Math.sqrt(r1 * r1 - x * x);
        return new paper.Point(x, y);
    }
    createGUI(gui) {
        this.gui = gui;
        let position = { moveX: Settings_1.Settings.tipibot.homeX, moveY: Settings_1.Settings.tipibot.homeY };
        gui.add(position, 'moveX', 0, Settings_1.Settings.tipibot.width).name('Move X').onFinishChange((value) => this.setX(value));
        gui.add(position, 'moveY', 0, Settings_1.Settings.tipibot.height).name('Move Y').onFinishChange((value) => this.setY(value));
        let goHomeButton = gui.addButton('Go home', () => this.goHome(() => console.log('I am home :-)')));
        this.penStateButton = gui.addButton('Pen down', () => this.togglePenState());
        this.motorsEnableButton = gui.addButton('Disable motors', () => this.toggleMotors());
        gui.add({ 'Pause': false }, 'Pause').onChange((value) => Communication_1.communication.interpreter.setPause(value));
        gui.addButton('Stop & Clear queue', () => Communication_1.communication.interpreter.stopAndClearQueue());
        // DEBUG
        gui.addButton('Send specs', () => Communication_1.communication.interpreter.initialize(false));
    }
    setPositionSliders(point) {
        Settings_1.settingsManager.tipibotPositionFolder.getController('x').setValue(point.x, false);
        Settings_1.settingsManager.tipibotPositionFolder.getController('y').setValue(point.y, false);
        this.gui.getController('moveX').setValue(point.x, false);
        this.gui.getController('moveY').setValue(point.y, false);
    }
    toggleSetPosition(setPosition = !this.settingPosition, cancel = true) {
        if (!setPosition) {
            Settings_1.settingsManager.tipibotPositionFolder.getController('Set position with mouse').setName('Set position with mouse');
            if (cancel) {
                this.setPositionSliders(this.initialPosition);
            }
        }
        else {
            Settings_1.settingsManager.tipibotPositionFolder.getController('Set position with mouse').setName('Cancel');
            this.initialPosition = this.getPosition();
        }
        this.settingPosition = setPosition;
    }
    togglePenState() {
        let callback = () => console.log('pen state changed');
        if (this.pen.isPenUp) {
            this.penDown(Settings_1.SettingsManager.servoDownAngle(), Settings_1.Settings.servo.delay.down.before, Settings_1.Settings.servo.delay.down.after, callback);
        }
        else {
            this.penUp(Settings_1.SettingsManager.servoUpAngle(), Settings_1.Settings.servo.delay.up.before, Settings_1.Settings.servo.delay.up.after, callback);
        }
    }
    computeTipibotArea() {
        return new paper.Rectangle(0, 0, Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height);
    }
    computeDrawArea() {
        return new paper.Rectangle(Settings_1.Settings.tipibot.width / 2 - Settings_1.Settings.drawArea.width / 2, Settings_1.Settings.drawArea.y, Settings_1.Settings.drawArea.width, Settings_1.Settings.drawArea.height);
    }
    initialize(renderer, gui) {
        this.renderer = renderer;
        this.tipibotArea = renderer.createRectangle(this.computeTipibotArea());
        this.drawArea = renderer.createRectangle(this.computeDrawArea());
        this.motorLeft = renderer.createCircle(0, 0, 50, 24);
        this.motorRight = renderer.createCircle(Settings_1.Settings.tipibot.width, 0, 50, 24);
        this.pen = renderer.createPen(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY, Settings_1.Settings.tipibot.width);
        this.home = renderer.createTarget(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY, Pen_1.Pen.HOME_RADIUS);
        let moveButtonSize = 25;
        let drawAreaBounds = this.drawArea.getBounds();
        let homePoint = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        let moveToButtonClicked = this.moveToButtonClicked.bind(this);
        this.moveToButtons.push(new InteractiveItem_1.InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.topLeft().subtract(moveButtonSize), drawAreaBounds.topLeft().add(moveButtonSize))), false, moveToButtonClicked));
        this.moveToButtons.push(new InteractiveItem_1.InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.topRight().subtract(moveButtonSize), drawAreaBounds.topRight().add(moveButtonSize))), false, moveToButtonClicked));
        this.moveToButtons.push(new InteractiveItem_1.InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.bottomLeft().subtract(moveButtonSize), drawAreaBounds.bottomLeft().add(moveButtonSize))), false, moveToButtonClicked));
        this.moveToButtons.push(new InteractiveItem_1.InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(drawAreaBounds.bottomRight().subtract(moveButtonSize), drawAreaBounds.bottomRight().add(moveButtonSize))), false, moveToButtonClicked));
        this.moveToButtons.push(new InteractiveItem_1.InteractiveItem(renderer, renderer.createRectangle(new paper.Rectangle(homePoint.subtract(moveButtonSize), homePoint.add(moveButtonSize))), false, moveToButtonClicked));
        Settings_1.settingsManager.setTipibot(this);
        this.createGUI(gui);
    }
    moveToButtonClicked(event, moveToButton) {
        let moveType = Pen_1.Pen.moveTypeFromMouseEvent(event);
        let point = moveToButton.shape.getBounds().getCenter();
        if (moveType == Pen_1.MoveType.Direct) {
            this.moveDirect(point);
        }
        else if (moveType == Pen_1.MoveType.DirectFullSpeed) {
            this.moveDirectFullSpeed(point);
        }
        else {
            this.moveLinear(point);
        }
    }
    updateMoveToButtons() {
        let homePoint = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        let drawAreaBounds = this.drawArea.getBounds();
        this.moveToButtons[0].setPosition(drawAreaBounds.topLeft());
        this.moveToButtons[1].setPosition(drawAreaBounds.topRight());
        this.moveToButtons[2].setPosition(drawAreaBounds.bottomLeft());
        this.moveToButtons[3].setPosition(drawAreaBounds.bottomRight());
        this.moveToButtons[4].setPosition(homePoint);
    }
    sizeChanged(sendChange) {
        this.motorRight.update(Settings_1.Settings.tipibot.width, 0, 50);
        this.tipibotArea.updateRectangle(this.computeTipibotArea());
        this.drawArea.updateRectangle(this.computeDrawArea());
        this.pen.tipibotWidthChanged();
        if (sendChange) {
            Communication_1.communication.interpreter.sendSize();
        }
        this.renderer.centerOnTipibot(this.tipibotArea.getBounds(), true);
        this.updateMoveToButtons();
    }
    drawAreaChanged(sendChange) {
        this.drawArea.updateRectangle(this.computeDrawArea());
        this.updateMoveToButtons();
    }
    maxSpeedChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendMaxSpeed();
        }
    }
    accelerationChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendAcceleration();
        }
    }
    getPosition() {
        return this.pen.getPosition();
    }
    getLengths() {
        return this.cartesianToLengths(this.getPosition());
    }
    setX(x, sendChange = true) {
        let p = this.getPosition();
        this.setPosition(new paper.Point(x, p.y), sendChange);
    }
    setY(y, sendChange = true) {
        let p = this.getPosition();
        this.setPosition(new paper.Point(p.x, y), sendChange);
    }
    checkInitialized() {
        if (!this.initializedCommunication) {
            Communication_1.communication.interpreter.initialize();
        }
    }
    setPosition(point, sendChange = true) {
        this.pen.setPosition(point, false, false);
        if (sendChange) {
            this.checkInitialized();
            Communication_1.communication.interpreter.sendSetPosition(point);
        }
    }
    setPositionToHome(sendChange = true) {
        let point = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        this.setPosition(point);
    }
    sendInvertXY() {
        Communication_1.communication.interpreter.sendInvertXY();
        Communication_1.communication.interpreter.sendSetPosition(this.getPosition());
    }
    sendProgressiveMicrosteps() {
        Communication_1.communication.interpreter.sendProgressiveMicrosteps();
    }
    move(moveType, point, callback = null, movePen = true) {
        this.checkInitialized();
        if (moveType == Pen_1.MoveType.Direct) {
            Communication_1.communication.interpreter.sendMoveDirect(point, callback);
        }
        else if (moveType == Pen_1.MoveType.DirectFullSpeed) {
            Communication_1.communication.interpreter.sendMoveDirectFullSpeed(point, callback);
        }
        else if (moveType == Pen_1.MoveType.Linear) {
            Communication_1.communication.interpreter.sendMoveLinear(point, callback);
        }
        else if (moveType == Pen_1.MoveType.LinearFullSpeed) {
            Communication_1.communication.interpreter.sendMoveLinearFullSpeed(point, callback);
        }
        this.enableMotors(false);
        if (movePen) {
            this.pen.setPosition(point, true, false);
        }
    }
    moveDirect(point, callback = null, movePen = true) {
        this.move(Pen_1.MoveType.Direct, point, callback, movePen);
    }
    moveDirectFullSpeed(point, callback = null, movePen = true) {
        this.move(Pen_1.MoveType.DirectFullSpeed, point, callback, movePen);
    }
    moveLinear(point, callback = null, movePen = true) {
        this.move(Pen_1.MoveType.Linear, point, callback, movePen);
    }
    moveLinearFullSpeed(point, callback = null, movePen = true) {
        this.move(Pen_1.MoveType.LinearFullSpeed, point, callback, movePen);
    }
    setSpeed(speed) {
        Communication_1.communication.interpreter.sendMaxSpeed(speed);
    }
    stepsPerRevChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendStepsPerRev(Settings_1.Settings.tipibot.stepsPerRev);
        }
    }
    mmPerRevChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendMmPerRev(Settings_1.Settings.tipibot.mmPerRev);
        }
    }
    microstepResolutionChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendStepMultiplier(Settings_1.Settings.tipibot.microstepResolution);
        }
    }
    penWidthChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendPenWidth(Settings_1.Settings.tipibot.penWidth);
        }
        PlotInterface_1.PlotInterface.currentPlot.updateShape();
    }
    servoChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendPenLiftRange();
            Communication_1.communication.interpreter.sendPenDelays();
            Communication_1.communication.interpreter.sendServoSpeed();
        }
    }
    sendSpecs() {
        Communication_1.communication.interpreter.sendSpecs(Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height, Settings_1.Settings.tipibot.stepsPerRev, Settings_1.Settings.tipibot.mmPerRev, Settings_1.Settings.tipibot.microstepResolution);
    }
    pause(delay) {
        Communication_1.communication.interpreter.sendPause(delay);
    }
    disableMotors(send) {
        if (send) {
            Communication_1.communication.interpreter.sendMotorOff();
        }
        this.motorsEnableButton.setName('Enable motors');
        this.motorsEnabled = false;
    }
    enableMotors(send) {
        if (send) {
            Communication_1.communication.interpreter.sendMotorOn();
        }
        this.motorsEnableButton.setName('Disable motors');
        this.motorsEnabled = true;
    }
    toggleMotors() {
        if (this.motorsEnabled) {
            this.disableMotors(true);
        }
        else {
            this.enableMotors(true);
        }
    }
    penUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null, force = false) {
        if (!this.pen.isPenUp || force) {
            this.pen.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback);
            this.penStateButton.setName('Pen down');
        }
    }
    penDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null, force = false) {
        if (this.pen.isPenUp || force) {
            this.pen.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback);
            this.penStateButton.setName('Pen up');
        }
    }
    setHome(setPosition = true) {
        let homePosition = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        this.home.setPosition(homePosition);
        if (setPosition) {
            this.setPosition(homePosition);
        }
        this.updateMoveToButtons();
    }
    goHome(callback = null) {
        this.penUp(Settings_1.SettingsManager.servoUpAngle(), Settings_1.Settings.servo.delay.up.before, Settings_1.Settings.servo.delay.up.after, null, true);
        // this.penUp(null, null, null, true)
        // The pen will make me (tipibot) move :-)
        this.pen.setPosition(new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY), true, true, Pen_1.MoveType.Direct, callback);
    }
    keyDown(event) {
        let amount = event.shiftKey ? 25 : event.ctrlKey ? 10 : event.altKey ? 5 : 1;
        switch (event.keyCode) {
            case 37:
                this.moveDirect(this.getPosition().add(new paper.Point(-amount, 0)));
                break;
            case 38:
                this.moveDirect(this.getPosition().add(new paper.Point(0, -amount)));
                break;
            case 39:
                this.moveDirect(this.getPosition().add(new paper.Point(amount, 0)));
                break;
            case 40:
                this.moveDirect(this.getPosition().add(new paper.Point(0, amount)));
                break;
            default:
                break;
        }
    }
    windowResize() {
        this.motorRight.update(Settings_1.Settings.tipibot.width, 0, 50);
        this.tipibotArea.updateRectangle(this.computeTipibotArea());
        this.drawArea.updateRectangle(this.computeDrawArea());
    }
}
exports.Tipibot = Tipibot;
exports.tipibot = new Tipibot();


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Communication_1 = __webpack_require__(1);
const InteractiveItem_1 = __webpack_require__(4);
const Settings_1 = __webpack_require__(0);
const Tipibot_1 = __webpack_require__(2);
var MoveType;
(function (MoveType) {
    MoveType[MoveType["Direct"] = 0] = "Direct";
    MoveType[MoveType["DirectFullSpeed"] = 1] = "DirectFullSpeed";
    MoveType[MoveType["Linear"] = 2] = "Linear";
    MoveType[MoveType["LinearFullSpeed"] = 3] = "LinearFullSpeed";
})(MoveType = exports.MoveType || (exports.MoveType = {}));
class Pen extends InteractiveItem_1.InteractiveItem {
    constructor(renderer) {
        super(renderer, null, true);
        this.isPenUp = true;
    }
    static moveTypeFromMouseEvent(event) {
        return event.metaKey && event.altKey || event.ctrlKey && event.altKey ? MoveType.LinearFullSpeed :
            event.ctrlKey || event.shiftKey || event.metaKey ? MoveType.Linear :
                event.altKey ? MoveType.DirectFullSpeed : MoveType.Direct;
    }
    tipibotWidthChanged() {
    }
    getPosition() {
        return this.shape.getPosition(); // will be overloaded
    }
    setPosition(point, updateSliders = true, move = true, moveType = MoveType.Direct, callback = null) {
        if (point == null || Number.isNaN(point.x) || Number.isNaN(point.y)) {
            return;
        }
        if (updateSliders) {
            Tipibot_1.tipibot.setPositionSliders(point);
        }
        if (move) {
            if (moveType == MoveType.Direct) {
                Tipibot_1.tipibot.moveDirect(point, callback);
            }
            else if (moveType == MoveType.DirectFullSpeed) {
                Tipibot_1.tipibot.moveDirectFullSpeed(point, callback);
            }
            else {
                Tipibot_1.tipibot.moveLinear(point, callback);
            }
        }
    }
    mouseStop(event) {
        if (this.dragging) {
            this.setPosition(this.getPosition(), true, true, Pen.moveTypeFromMouseEvent(event));
        }
        return super.mouseStop(event);
    }
    penUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        Communication_1.communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback);
        this.isPenUp = true;
    }
    penDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        Communication_1.communication.interpreter.sendPenDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback);
        this.isPenUp = false;
    }
}
Pen.HOME_RADIUS = 10;
Pen.RADIUS = 20;
exports.Pen = Pen;
class PaperPen extends Pen {
    constructor(renderer) {
        super(renderer);
    }
    initialize(x, y, tipibotWidth, layer = null) {
        this.circle = paper.Path.Circle(new paper.Point(x, y), Pen.RADIUS);
        this.circle.strokeWidth = 0.5;
        this.circle.strokeColor = 'black';
        this.circle.fillColor = null;
        this.circle.strokeScaling = false;
        this.shape = this.renderer.createShape(this.circle);
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(new paper.Point(x, y));
        this.lines.add(new paper.Point(tipibotWidth, 0));
        this.lines.strokeWidth = 0.5;
        this.lines.strokeColor = 'black';
        this.lines.strokeScaling = false;
        this.previousPosition = new paper.Point(0, 0);
        if (layer) {
            layer.addChild(this.circle);
            layer.addChild(this.lines);
        }
    }
    getPosition() {
        return this.circle.position;
    }
    setPosition(point, updateSliders = true, move = true, moveType = MoveType.Direct, callback = null) {
        if (point == null || Number.isNaN(point.x) || Number.isNaN(point.y)) {
            return;
        }
        super.setPosition(point, updateSliders, move, moveType, callback);
        this.circle.position = point;
        this.lines.segments[1].point = point;
    }
    drag(delta) {
        this.setPosition(this.circle.position.add(delta), true, false);
    }
    tipibotWidthChanged() {
        this.lines.segments[2].point.x = Settings_1.Settings.tipibot.width;
    }
    penUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        super.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback);
        this.circle.fillColor = null;
        this.isPenUp = true;
    }
    penDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        super.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback);
        this.circle.fillColor = 'rgba(0, 0, 0, 0.25)';
        this.isPenUp = false;
    }
}
exports.PaperPen = PaperPen;
class ThreePen extends Pen {
    constructor(renderer) {
        super(renderer);
    }
    initialize(x, y, tipibotWidth, camera, scene = null, lineMat = null) {
        let geometry = new THREE.CircleGeometry(Pen.RADIUS, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0x4274f4, opacity: 0.7, transparent: true });
        this.circle = new THREE.Mesh(geometry, material);
        this.circle.position.x = x;
        this.circle.position.y = y;
        this.circle.rotation.x = Math.PI;
        let lineGeometry = new THREE.Geometry();
        let lineMaterial = lineMat != null ? lineMat : new THREE.LineBasicMaterial({ color: 0xffffff });
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0), new THREE.Vector3(tipibotWidth, 0, 0));
        this.lines = new THREE.Line(lineGeometry, lineMaterial);
        this.camera = camera;
        if (scene) {
            scene.add(this.lines);
            scene.add(this.circle);
        }
    }
    getPosition() {
        return this.vectorToPoint(this.circle.position);
    }
    setPosition(point, updateSliders = true, move = true, moveType = MoveType.Direct, callback = null) {
        if (point == null || Number.isNaN(point.x) || Number.isNaN(point.y)) {
            return;
        }
        super.setPosition(point, updateSliders, move, moveType, callback);
        let position = this.pointToVector(point);
        this.circle.position.copy(position);
        let geometry = this.lines.geometry;
        geometry.vertices[1].copy(position);
        geometry.verticesNeedUpdate = true;
    }
    tipibotWidthChanged() {
        let geometry = this.lines.geometry;
        geometry.vertices[2].x = Settings_1.Settings.tipibot.width;
        geometry.verticesNeedUpdate = true;
    }
    pointToVector(point) {
        return new THREE.Vector3(point.x, point.y, 0);
    }
    vectorToPoint(point) {
        return new paper.Point(point.x, point.y);
    }
    mouseDown(event) {
        let position = this.getWorldPosition(event);
        if (position.getDistance(new paper.Point(this.circle.position.x, this.circle.position.y), true) < Pen.RADIUS * Pen.RADIUS) {
            this.dragging = true;
            this.previousPosition = position.clone();
            return false;
        }
        return true;
    }
    mouseMove(event) {
        let position = this.getWorldPosition(event);
        if (this.dragging) {
            let circlePosition = this.vectorToPoint(this.circle.position);
            this.setPosition(circlePosition.add(position.subtract(this.previousPosition)), true, false);
            this.previousPosition = position.clone();
            return false;
        }
        return true;
    }
    mouseUp(event) {
        return this.mouseStop(event);
    }
    mouseLeave(event) {
        return this.mouseStop(event);
    }
}
exports.ThreePen = ThreePen;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class InteractiveItem {
    // constructor(renderer: Renderer, item: paper.Item=null) {
    constructor(renderer, shape = null, draggable = false, clickCallback = null) {
        this.clickCallback = clickCallback;
        this.renderer = renderer;
        this.draggable = draggable;
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
        this.shape = shape;
        InteractiveItem.interactiveItems.push(this);
    }
    static mouseDown(event) {
        for (let interactiveItem of InteractiveItem.interactiveItems) {
            if (!interactiveItem.mouseDown(event)) {
                return;
            }
        }
    }
    static mouseMove(event) {
        for (let interactiveItem of InteractiveItem.interactiveItems) {
            if (!interactiveItem.mouseMove(event)) {
                return;
            }
        }
    }
    static mouseStop(event) {
        for (let interactiveItem of InteractiveItem.interactiveItems) {
            if (!interactiveItem.mouseStop(event)) {
                return;
            }
        }
    }
    static mouseUp(event) {
        for (let interactiveItem of InteractiveItem.interactiveItems) {
            if (!interactiveItem.mouseUp(event)) {
                return;
            }
        }
    }
    static mouseLeave(event) {
        for (let interactiveItem of InteractiveItem.interactiveItems) {
            if (!interactiveItem.mouseLeave(event)) {
                return;
            }
        }
    }
    moveAbove(otherItem) {
        let thisIndex = InteractiveItem.interactiveItems.indexOf(this);
        InteractiveItem.interactiveItems.splice(thisIndex, 1);
        let otherIndex = InteractiveItem.interactiveItems.indexOf(otherItem);
        InteractiveItem.interactiveItems.splice(otherIndex, 0, this);
    }
    moveBelow(otherItem) {
        let thisIndex = InteractiveItem.interactiveItems.indexOf(this);
        InteractiveItem.interactiveItems.splice(thisIndex, 1);
        let otherIndex = InteractiveItem.interactiveItems.indexOf(otherItem);
        InteractiveItem.interactiveItems.splice(otherIndex + 1, 0, this);
    }
    moveToTop() {
        let thisIndex = InteractiveItem.interactiveItems.indexOf(this);
        InteractiveItem.interactiveItems.splice(thisIndex, 1);
        InteractiveItem.interactiveItems.splice(0, 0, this);
    }
    moveToBottom() {
        let thisIndex = InteractiveItem.interactiveItems.indexOf(this);
        InteractiveItem.interactiveItems.splice(thisIndex, 1);
        InteractiveItem.interactiveItems.push(this);
    }
    setPosition(position) {
        this.shape.setPosition(position);
    }
    setX(x) {
        this.shape.setX(x);
    }
    setY(y) {
        this.shape.setY(y);
    }
    drag(delta) {
        this.shape.setPosition(this.shape.getPosition().add(delta));
    }
    getWorldPosition(event) {
        return this.renderer.getWorldPosition(event);
    }
    mouseDown(event) {
        let position = this.getWorldPosition(event);
        if (this.shape.getBounds().contains(position)) {
            this.dragging = true;
            this.previousPosition = position.clone();
            return false;
        }
        return true;
    }
    mouseMove(event) {
        if (this.draggable && this.dragging) {
            let position = this.getWorldPosition(event);
            this.drag(position.subtract(this.previousPosition));
            this.previousPosition = position.clone();
            return false;
        }
        return true;
    }
    mouseStop(event) {
        this.dragging = false;
        return true;
    }
    mouseUp(event) {
        let position = this.getWorldPosition(event);
        if (this.dragging && this.shape.getBounds().contains(position) && this.clickCallback != null) {
            this.clickCallback.call(this, event, this);
            return false;
        }
        this.mouseStop(event);
        return true;
    }
    mouseLeave(event) {
        this.mouseStop(event);
        return true;
    }
    delete() {
        InteractiveItem.interactiveItems.splice(InteractiveItem.interactiveItems.indexOf(this), 1);
    }
}
InteractiveItem.interactiveItems = new Array();
exports.InteractiveItem = InteractiveItem;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const PlotInterface_1 = __webpack_require__(7);
const Tipibot_1 = __webpack_require__(2);
const Settings_1 = __webpack_require__(0);
const Communication_1 = __webpack_require__(1);
const Renderers_1 = __webpack_require__(6);
const Pen_1 = __webpack_require__(3);
class Plot extends PlotInterface_1.PlotInterface {
    constructor(renderer, item = null) {
        super(renderer, null, true);
        this.plotting = false;
        this.item = item;
        // this.item.position = this.item.position.add(tipibot.drawArea.getBounds().topLeft)
        this.originalItem = null;
        this.filter();
    }
    static createCallback(f, addValue = false, parameters = []) {
        return (value) => {
            if (PlotInterface_1.PlotInterface.currentPlot != null) {
                if (addValue) {
                    parameters.unshift(value);
                }
                f.apply(PlotInterface_1.PlotInterface.currentPlot, parameters);
            }
        };
    }
    static createGUI(gui) {
        Plot.gui = gui;
        let filterFolder = gui.addFolder('Filter');
        filterFolder.add(Plot, 'showPoints').name('Show points').onChange(Plot.createCallback(Plot.prototype.showPoints, true));
        filterFolder.add(Settings_1.Settings.plot, 'flatten').name('Flatten').onChange(Plot.createCallback(Plot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(Plot.createCallback(Plot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'subdivide').name('Subdivide').onChange(Plot.createCallback(Plot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(Plot.createCallback(Plot.prototype.filter));
        let transformFolder = gui.addFolder('Transform');
        Plot.transformFolder = transformFolder;
        transformFolder.addButton('Center', Plot.createCallback(Plot.prototype.center));
        transformFolder.addSlider('X', 0, 0, Settings_1.Settings.drawArea.width).onChange(Plot.createCallback(Plot.prototype.setX, true));
        transformFolder.addSlider('Y', 0, 0, Settings_1.Settings.drawArea.height).onChange(Plot.createCallback(Plot.prototype.setY, true));
        transformFolder.addButton('Flip X', Plot.createCallback(Plot.prototype.flipX));
        transformFolder.addButton('Flip Y', Plot.createCallback(Plot.prototype.flipY));
        transformFolder.addButton('Rotate', Plot.createCallback(Plot.prototype.rotate));
        transformFolder.addSlider('Scale', 1, 0.1, 5).onChange(Plot.createCallback(Plot.prototype.scale, true));
    }
    mouseDown(event) {
        let result = super.mouseDown(event);
        this.item.selected = this.dragging;
        return result;
    }
    updateItemPosition() {
        this.item.position = this.shape.getBounds().getCenter();
    }
    updatePositonGUI(drawAreaTopLeft = Tipibot_1.tipibot.drawArea.getBounds().topLeft()) {
        Plot.transformFolder.getController('X').setValue(this.item.bounds.left - drawAreaTopLeft.x, false);
        Plot.transformFolder.getController('Y').setValue(this.item.bounds.top - drawAreaTopLeft.y, false);
    }
    updateItemPositionAndGUI() {
        this.updateItemPosition();
        this.updatePositonGUI();
    }
    drag(delta) {
        let result = super.drag(delta);
        this.updateItemPositionAndGUI();
        return result;
    }
    mouseUp(event) {
        let result = super.mouseUp(event);
        this.updateItemPositionAndGUI();
        return result;
    }
    itemMustBeDrawn(item) {
        return (item.strokeWidth > 0 && item.strokeColor != null) || item.fillColor != null;
    }
    saveItem() {
        this.originalItem = this.item.clone(false);
    }
    loadItem() {
        this.originalItem.position = this.item.position;
        this.originalItem.applyMatrix = false;
        this.originalItem.scaling = this.item.scaling;
        this.item.remove();
        this.item = this.originalItem.clone(false); // If we clone an item which is not on the project, it won't be inserted in the project
        paper.project.activeLayer.addChild(this.item); // <- insert here
    }
    updateShape() {
        if (this.shape != null) {
            this.shape.remove();
        }
        this.item.strokeWidth = Settings_1.Settings.tipibot.penWidth;
        // HACK !!!
        // Todo: create two SvgPlot classes : one for ThreeRenderers and one for PaperRenderers
        if (this.renderer instanceof Renderers_1.ThreeRenderer) {
            // this.shape = this.renderer.createShape(this.item, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 10, linecap: 'round', linejoin:  'round' }))
            // this.shape.setPosition(tipibot.drawArea.getBounds().getCenter())
            // paper.project.clear()
            paper.view.viewSize = new paper.Size(Math.min(this.item.bounds.width, 2000), Math.min(this.item.bounds.height, 2000));
            paper.project.activeLayer.addChild(this.item);
            paper.project.deselectAll();
            this.item.selected = false;
            paper.view.setCenter(this.item.bounds.center);
            let margin = 100;
            let ratio = Math.max((this.item.bounds.width + margin) / paper.view.viewSize.width, (this.item.bounds.height + margin) / paper.view.viewSize.height);
            paper.view.zoom = 1 / ratio;
            // var image = new Image()
            // image.src = paper.view.element.toDataURL()
            // let w = window.open("")
            // w.document.write(image.outerHTML)
            this.shape = this.renderer.createSprite(paper.view.element);
            // paper.project.clear()
            this.shape.setPosition(Tipibot_1.tipibot.drawArea.getBounds().getCenter());
        }
        else {
            this.item.selected = false;
            this.item.visible = true;
            let raster = this.item.rasterize(paper.project.view.resolution);
            raster.sendToBack();
            this.shape = this.renderer.createShape(raster);
            this.item.selected = Plot.showPoints;
            this.item.visible = Plot.showPoints;
        }
    }
    filter() {
        if (this.originalItem == null && (Settings_1.Settings.plot.subdivide || Settings_1.Settings.plot.flatten)) {
            this.saveItem();
        }
        else if (this.originalItem != null) {
            this.loadItem();
        }
        this.flatten();
        this.subdivide();
        this.updateShape();
    }
    filterItem(item, amount, filter) {
        if (!item.visible) {
            return;
        }
        if (item.className == 'Path' || item.className == 'CompoundPath') {
            let path = item;
            filter.call(this, path, amount);
        }
        else if (item.className == 'Shape') {
            let shape = item;
            if (this.itemMustBeDrawn(shape)) {
                let path = shape.toPath(true);
                filter.call(this, path, amount);
                item.parent.addChildren(item.children);
                item.remove();
            }
        }
        if (item.children == null) {
            return;
        }
        for (let child of item.children) {
            this.filterItem(child, amount, filter);
        }
    }
    subdivide() {
        if (Settings_1.Settings.plot.subdivide) {
            this.subdivideItem(this.item, Settings_1.Settings.plot.maxSegmentLength);
        }
    }
    subdividePath(path, maxSegmentLength) {
        if (path.segments != null) {
            for (let segment of path.segments) {
                let curve = segment.curve;
                do {
                    curve = curve.divideAt(maxSegmentLength);
                } while (curve != null);
            }
        }
    }
    subdivideItem(item, maxSegmentLength) {
        this.filterItem(item, maxSegmentLength, this.subdividePath);
    }
    flatten() {
        if (Settings_1.Settings.plot.flatten) {
            this.flattenItem(this.item, Settings_1.Settings.plot.flattenPrecision);
        }
    }
    flattenPath(path, flattenPrecision) {
        path.flatten(flattenPrecision);
    }
    flattenItem(item, flattenPrecision) {
        this.filterItem(item, flattenPrecision, this.flattenPath);
    }
    plot(callback = null) {
        this.plotting = true;
        this.plotItem(this.item); // to be overloaded. The draw button calls plot()
        Tipibot_1.tipibot.goHome(() => this.plotFinished(callback));
    }
    plotItem(item) {
    }
    plotFinished(callback = null) {
        this.plotting = false;
        if (callback != null) {
            callback();
        }
    }
    stop() {
        Communication_1.communication.interpreter.sendStop();
    }
    showPoints(show) {
        this.item.selected = show;
        this.item.visible = show;
    }
    rotate() {
        this.item.rotate(90);
        this.updateShape();
        this.updateItemPositionAndGUI();
    }
    scale(value) {
        this.item.applyMatrix = false;
        this.item.scaling = new paper.Point(value, value);
        this.updateShape();
        this.updateItemPositionAndGUI();
    }
    center() {
        this.shape.setPosition(Tipibot_1.tipibot.drawArea.getBounds().getCenter());
        this.updateItemPositionAndGUI();
    }
    flipX() {
        this.item.scale(-1, 1);
        this.updateShape();
    }
    flipY() {
        this.item.scale(1, -1);
        this.updateShape();
    }
    setX(x) {
        let drawArea = Tipibot_1.tipibot.drawArea.getBounds();
        this.shape.setX(drawArea.topLeft().x + x + this.shape.getWidth() / 2);
        this.updateItemPosition();
    }
    setY(y) {
        let drawArea = Tipibot_1.tipibot.drawArea.getBounds();
        this.shape.setY(drawArea.topLeft().y + y + this.shape.getHeight() / 2);
        this.updateItemPosition();
    }
    clear() {
        super.delete();
        if (this.shape != null) {
            this.shape.remove();
        }
        this.shape = null;
        if (this.item != null) {
            this.item.remove();
        }
        this.item = null;
        if (PlotInterface_1.PlotInterface.currentPlot == this) {
            PlotInterface_1.PlotInterface.currentPlot = null;
        }
    }
}
Plot.gui = null;
Plot.showPoints = false;
Plot.transformFolder = null;
exports.Plot = Plot;
class SVGPlot extends Plot {
    constructor(svg, renderer = SVGPlot.renderer) {
        super(renderer, svg);
        PlotInterface_1.PlotInterface.currentPlot = this;
        if (SVGPlot.svgPlot != null) {
            SVGPlot.svgPlot.clear();
            SVGPlot.svgPlot = null;
        }
        SVGPlot.svgPlot = this;
        paper.project.layers[0].addChild(svg);
        svg.sendToBack();
    }
    static onImageLoad(event) {
        let svg = paper.project.importSVG(event.target.result);
        let svgPlot = new SVGPlot(svg);
        svgPlot.center();
        // Hack: Find a better way to handle ThreeRenderer and PaperRenderer
        if (this.renderer instanceof Renderers_1.ThreeRenderer) {
            svg.remove();
            paper.project.clear();
        }
        SVGPlot.gui.getController('Draw').show();
    }
    static handleFileSelect(event) {
        SVGPlot.gui.getController('Load SVG').hide();
        SVGPlot.gui.getController('Clear SVG').show();
        let files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (let i = 0; i < files.length; i++) {
            let file = files.item(i);
            let imageType = /^image\//;
            if (!imageType.test(file.type)) {
                continue;
            }
            let reader = new FileReader();
            reader.onload = (event) => SVGPlot.onImageLoad(event);
            reader.readAsText(file);
        }
    }
    static clearClicked(event) {
        Communication_1.communication.interpreter.clearQueue();
        SVGPlot.gui.getController('Load SVG').show();
        SVGPlot.gui.getController('Clear SVG').hide();
        SVGPlot.svgPlot.clear();
        SVGPlot.svgPlot = null;
        SVGPlot.gui.getController('Draw').name('Draw');
        SVGPlot.gui.getController('Draw').hide();
    }
    static drawClicked(event) {
        if (PlotInterface_1.PlotInterface.currentPlot != null) {
            if (!PlotInterface_1.PlotInterface.currentPlot.plotting) {
                SVGPlot.gui.getController('Draw').name('Stop & Clear queue');
                PlotInterface_1.PlotInterface.currentPlot.plot();
            }
            else {
                SVGPlot.gui.getController('Draw').name('Draw');
                Communication_1.communication.interpreter.stopAndClearQueue();
            }
        }
    }
    static createGUI(gui) {
        SVGPlot.gui = gui.addFolder('Plot');
        SVGPlot.gui.open();
        SVGPlot.gui.add(Settings_1.Settings.plot, 'fullSpeed').name('Full speed');
        SVGPlot.gui.addFileSelectorButton('Load SVG', 'image/svg+xml', (event) => SVGPlot.handleFileSelect(event));
        let clearSVGButton = SVGPlot.gui.addButton('Clear SVG', SVGPlot.clearClicked);
        clearSVGButton.hide();
        let drawButton = SVGPlot.gui.addButton('Draw', SVGPlot.drawClicked);
        drawButton.hide();
    }
    mouseDown(event) {
        // let hitResult = paper.project.hitTest(this.getWorldPosition(event))
        // if(hitResult != null && hitResult.item == tipibot.pen.item) {
        // 	return
        // }
        if (Tipibot_1.tipibot.pen.getPosition().getDistance(this.getWorldPosition(event)) < Pen_1.Pen.RADIUS) {
            return false;
        }
        super.mouseDown(event);
    }
    drag(delta) {
        super.drag(delta);
        // Plot.gui.getFolder('Transform').getController('X').setValueNoCallback(this.item.position.x)
        // Plot.gui.getFolder('Transform').getController('Y').setValueNoCallback(this.item.position.y)
    }
    mustMoveFullSpeed(segment) {
        if (segment.previous == null || segment.point == null || segment.next == null) {
            return false;
        }
        // no need to transform points to compute angle
        let pointToPrevious = segment.previous.point.subtract(segment.point);
        let pointToNext = segment.next.point.subtract(segment.point);
        let angle = pointToPrevious.getDirectedAngle(pointToNext);
        return Math.abs(angle) > 135;
    }
    plotItem(item) {
        if (!item.visible) {
            return;
        }
        let matrix = item.globalMatrix;
        if ((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
            let path = item;
            if (path.segments != null) {
                for (let segment of path.segments) {
                    let point = segment.point.transform(matrix);
                    if (segment == path.firstSegment) {
                        if (!Tipibot_1.tipibot.getPosition().equals(point)) {
                            Tipibot_1.tipibot.penUp();
                            Tipibot_1.tipibot.moveDirect(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                        }
                        Tipibot_1.tipibot.penDown();
                    }
                    else {
                        if (Settings_1.Settings.plot.fullSpeed && this.mustMoveFullSpeed(segment)) {
                            Tipibot_1.tipibot.moveLinearFullSpeed(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                        }
                        else {
                            Tipibot_1.tipibot.moveLinear(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                        }
                    }
                }
                if (path.closed) {
                    let point = path.firstSegment.point.transform(matrix);
                    if (Settings_1.Settings.plot.fullSpeed && this.mustMoveFullSpeed(path.firstSegment)) {
                        Tipibot_1.tipibot.moveLinearFullSpeed(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                    }
                    else {
                        Tipibot_1.tipibot.moveLinear(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                    }
                }
            }
        }
        if (item.children == null) {
            return;
        }
        for (let child of item.children) {
            this.plotItem(child);
        }
    }
    // plotItemStep(): any {
    // 	let item = this.currentItem
    // 	// if we didn't already plot the item: plot it along with its children
    // 	if(item.data.plotted == null || !item.data.plotted) {
    // 		// plot path
    // 		if(item.className == 'Path' || item.className == 'CompoundPath') {
    // 			let path: paper.Path = <paper.Path>item
    // 			let segment = this.currentSegment != null ? this.currentSegment : path.firstSegment
    // 			if(segment == path.firstSegment) {
    // 				if(!tipibot.getPosition().equals(segment.point)) {
    // 					tipibot.penUp()
    // 					tipibot.moveDirect(segment.point, this.plotItemStep)
    // 				}
    // 				tipibot.penDown()
    // 			} else {
    // 				tipibot.moveLinear(segment.point, this.plotItemStep)
    // 			}
    // 			// go to next segment
    // 			this.currentSegment = segment.next != path.firstSegment ? segment.next : null
    // 		} else if(item.className == 'Shape') {
    // 			console.error('A shape was found in the SVG to plot.')
    // 		}
    // 		// plot children
    // 		if(item.children.length > 0) {
    // 			this.currentItem = item.firstChild
    // 			this.currentSegment = null
    // 			this.plotItemStep()
    // 			return
    // 		}
    // 		item.data.plotted = true
    // 	}
    // 	// plot next siblings if any, or go up to parent
    // 	if(item != this.item && item.parent != null && item.index < item.parent.children.length - 1) {
    // 		if(item.index < item.parent.children.length - 1) {
    // 			this.currentItem = item.nextSibling
    // 			this.currentSegment = null
    // 			this.plotItemStep()
    // 			return
    // 		} else {
    // 			this.currentItem = item.parent
    // 			this.currentSegment = null
    // 			this.plotItemStep()
    // 			return
    // 		}
    // 	}
    // 	if(item == this.item) {
    // 		this.clearData(item)
    // 	}
    // }
    plotFinished(callback = null) {
        SVGPlot.gui.getController('Draw').name('Draw');
        super.plotFinished(callback);
    }
    clearData(item) {
        item.data = null;
        if (item.children) {
            for (let child of item.children) {
                this.clearData(child);
            }
        }
    }
    clear() {
        if (SVGPlot.svgPlot == this) {
            SVGPlot.svgPlot = null;
        }
        super.clear();
    }
}
SVGPlot.svgPlot = null;
exports.SVGPlot = SVGPlot;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Shapes_1 = __webpack_require__(18);
const Pen_1 = __webpack_require__(3);
const RendererInterface_1 = __webpack_require__(17);
class PaperRenderer extends RendererInterface_1.Renderer {
    constructor() {
        super();
        this.canvas = document.createElement('canvas');
        let containerJ = $('#canvas');
        this.canvas.width = containerJ.width();
        this.canvas.height = containerJ.height();
        containerJ.get(0).appendChild(this.canvas);
        paper.setup(this.canvas);
        this.tipibotLayer = new paper.Layer();
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
    }
    centerOnTipibot(tipibot, zoom = true) {
        if (zoom) {
            let margin = 200;
            let ratio = Math.max((tipibot.width + margin) / this.canvas.width * window.devicePixelRatio, (tipibot.height + margin) / this.canvas.height * window.devicePixelRatio);
            paper.view.zoom = 1 / ratio;
        }
        paper.view.setCenter(new paper.Point(tipibot.width / 2, tipibot.height / 2));
    }
    getDomElement() {
        return paper.view.element;
    }
    createRectangle(rectangle) {
        return new Shapes_1.PaperRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.tipibotLayer);
    }
    createCircle(x, y, radius, nSegments = 12) {
        return new Shapes_1.PaperCircle(x, y, radius, this.tipibotLayer);
    }
    createPen(x, y, tipibotWidth) {
        let pen = new Pen_1.PaperPen(this);
        pen.initialize(x, y, tipibotWidth, this.tipibotLayer);
        return pen;
    }
    createTarget(x, y, radius) {
        return new Shapes_1.PaperTarget(x, y, radius, this.tipibotLayer);
    }
    createSprite(canvas) {
        return new Shapes_1.PaperSprite(canvas);
    }
    createShape(item) {
        return new Shapes_1.PaperShape(item);
    }
    createDrawingLayer() {
        this.drawingLayer = new paper.Layer();
        this.drawingLayer.moveBelow(this.tipibotLayer);
    }
    windowResize() {
        let containerJ = $('#canvas');
        let width = containerJ.width();
        let height = containerJ.height();
        let canvasJ = $(this.canvas);
        canvasJ.width(width);
        canvasJ.height(height);
        paper.view.viewSize = new paper.Size(width, height);
    }
    mouseDown(event) {
        this.dragging = true;
        this.previousPosition = this.getMousePosition(event);
    }
    mouseMove(event) {
        if (event.buttons == 4 || event.shiftKey && this.dragging) {
            let position = this.getMousePosition(event);
            paper.view.translate(position.subtract(this.previousPosition).divide(paper.view.zoom));
            paper.view.draw();
            this.previousPosition.x = position.x;
            this.previousPosition.y = position.y;
        }
    }
    mouseUp(event) {
        this.dragging = false;
    }
    mouseLeave(event) {
        this.dragging = false;
    }
    mouseWheel(event) {
        if (event.target != this.getDomElement()) {
            return;
        }
        paper.view.zoom = Math.max(0.1, Math.min(5, paper.view.zoom + event.deltaY / 500));
    }
    render() {
    }
}
exports.PaperRenderer = PaperRenderer;
class ThreeRenderer extends RendererInterface_1.Renderer {
    constructor() {
        super();
        // Setup paper to be able to call paper.project.importSVG()
        let paperCanvas = document.createElement('canvas');
        paper.setup(paperCanvas);
        this.dragging = false;
        this.previousPosition = new THREE.Vector2();
        let containerJ = $('#canvas');
        let width = containerJ.width();
        let height = containerJ.height();
        // this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera = new THREE.OrthographicCamera(0, width, 0, height, -500, 1000);
        this.scene = new THREE.Scene();
        this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        let ambientLight = new THREE.AmbientLight(Math.random() * 0x10);
        this.scene.add(ambientLight);
        this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        console.log(width, height);
        this.renderer.setSize(width, height);
        containerJ.append(this.renderer.domElement);
        // var spriteMap = new THREE.TextureLoader().load( "out.png" );
        // spriteMap.minFilter = THREE.LinearFilter;
        // var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
        // let sprite = new THREE.Sprite( spriteMaterial );
        // sprite.scale.set(500, 500, 1)
        // this.scene.add( sprite );
    }
    centerOnTipibot(tipibot, zoom = true) {
        this.setCameraCenterTo(new THREE.Vector3(tipibot.width / 2, tipibot.height / 2, 0));
        if (zoom) {
            let margin = 100;
            let size = this.renderer.getSize();
            let ratio = Math.max((tipibot.width + margin) / size.width, (tipibot.height + margin) / size.height);
            this.camera.zoom = 1 / ratio;
            this.camera.updateProjectionMatrix();
        }
    }
    getDomElement() {
        return this.renderer.domElement;
    }
    createRectangle(rectangle) {
        return new Shapes_1.ThreeRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.scene, this.lineMaterial);
    }
    createCircle(x, y, radius, nSegments = 12) {
        return new Shapes_1.ThreeCircle(x, y, radius, nSegments, this.scene, this.lineMaterial);
    }
    createPen(x, y, tipibotWidth) {
        let pen = new Pen_1.ThreePen(this);
        pen.initialize(x, y, tipibotWidth, this.camera, this.scene, this.lineMaterial);
        return pen;
    }
    createSprite(canvas) {
        return new Shapes_1.ThreeSprite(this.scene, canvas);
    }
    createTarget(x, y, radius) {
        return new Shapes_1.ThreeTarget(x, y, radius, 12, this.scene);
    }
    createShape(item, material = this.lineMaterial) {
        return new Shapes_1.ThreeShape(item, this.scene, material);
    }
    setCameraCenterTo(point) {
        let size = this.renderer.getSize();
        this.camera.position.x = point.x - size.width / 2;
        this.camera.position.y = point.y - size.height / 2;
        this.camera.position.z = point.z;
    }
    getWorldPosition(event) {
        let size = this.renderer.getSize();
        let windowCenter = new paper.Point(size.width / 2, size.height / 2);
        let windowOrigin = windowCenter.subtract(windowCenter.divide(this.camera.zoom).subtract(this.camera.position));
        let delta = this.getMousePosition(event).divide(this.camera.zoom);
        return windowOrigin.add(delta);
    }
    windowResize() {
        let containerJ = $('#canvas');
        let width = containerJ.width();
        let height = containerJ.height();
        this.camera.left = 0;
        this.camera.right = width;
        this.camera.top = 0;
        this.camera.bottom = height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    mouseDown(event) {
        this.dragging = true;
        this.previousPosition.x = event.clientX;
        this.previousPosition.y = event.clientY;
    }
    mouseMove(event) {
        if (event.buttons == 4 || event.shiftKey && this.dragging) {
            this.camera.position.x += (this.previousPosition.x - event.clientX) / this.camera.zoom;
            this.camera.position.y += (this.previousPosition.y - event.clientY) / this.camera.zoom;
            this.previousPosition.x = event.clientX;
            this.previousPosition.y = event.clientY;
        }
    }
    mouseUp(event) {
        this.dragging = false;
    }
    mouseLeave(event) {
        this.dragging = false;
    }
    mouseWheel(event) {
        if (event.target != this.getDomElement()) {
            return;
        }
        this.camera.zoom += (event.deltaY / 500);
        this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom));
        this.camera.updateProjectionMatrix();
    }
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
exports.ThreeRenderer = ThreeRenderer;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const InteractiveItem_1 = __webpack_require__(4);
class PlotInterface extends InteractiveItem_1.InteractiveItem {
}
exports.PlotInterface = PlotInterface;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Communication_1 = __webpack_require__(1);
class CommandDisplay {
    constructor() {
        $('#commands-content').click((event) => this.click(event));
        document.addEventListener('QueueCommand', (event) => this.queueCommand(event.detail), false);
        document.addEventListener('SendCommand', (event) => this.sendCommand(event.detail), false);
        document.addEventListener('CommandExecuted', (event) => this.commandExecuted(event.detail), false);
        document.addEventListener('ClearQueue', (event) => this.clearQueue(), false);
    }
    createGUI(gui) {
        let folderName = 'Command list';
        this.gui = gui.addFolder(folderName);
        this.listJ = $('<ul id="command-list">');
        this.gui.open();
        this.listJ.insertAfter($(this.gui.gui.domElement).find('li'));
    }
    click(event) {
        if (event.target.tagName == 'BUTTON') {
            let commandID = parseInt(event.target.parentNode.id);
            Communication_1.communication.interpreter.removeCommand(commandID);
            this.removeCommand(commandID);
        }
    }
    createCommandItem(command) {
        let liJ = $('<li id="' + command.id + '"">' + command.message + '<br>' + command.data + '</li>');
        let closeButtonJ = $('<button>x</button>');
        closeButtonJ.click((event) => this.removeCommand(command.id));
        liJ.append(closeButtonJ);
        return liJ;
    }
    removeCommand(id) {
        this.listJ.find('#' + id).remove();
        this.updateName();
    }
    updateName() {
        this.gui.setName('Command list (' + this.listJ.children().length + ')');
    }
    queueCommand(command) {
        this.listJ.append(this.createCommandItem(command));
        this.updateName();
    }
    sendCommand(command) {
        this.listJ.find('#' + command.id).addClass('sent');
    }
    commandExecuted(command) {
        this.removeCommand(command.id);
    }
    clearQueue() {
        this.listJ.children().remove();
        this.updateName();
    }
}
exports.CommandDisplay = CommandDisplay;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Controller {
    constructor(controller, gui) {
        this.controller = controller;
        this.gui = gui;
    }
    getDomElement() {
        return this.controller.domElement;
    }
    getParentNames() {
        let names = [];
        let gui = this.gui;
        do {
            names.push(gui.name);
            gui = gui.parent;
        } while (gui != null);
        return names;
    }
    getParentDomElement() {
        return this.getDomElement().parentElement.parentElement;
    }
    contains(element) {
        return this.getParentDomElement().contains(element);
    }
    getProperty() {
        return this.controller.property;
    }
    getName() {
        return this.controller.property;
    }
    getValue() {
        return this.controller.object[this.controller.property];
    }
    onChange(callback) {
        this.controller.onChange(callback);
        return this;
    }
    onFinishChange(callback) {
        this.controller.onFinishChange(callback);
        return this;
    }
    setValue(value, callback = true) {
        if (callback) {
            return this.controller.setValue(value);
        }
        this.setValueNoCallback(value);
    }
    setValueNoCallback(value) {
        this.controller.object[this.controller.property] = value;
        this.controller.updateDisplay();
    }
    max(value, callback = false) {
        this.controller.max(value);
        this.setValue(Math.min(value, this.getValue()), callback);
    }
    min(value, callback = false) {
        this.controller.min(value);
        this.setValue(Math.max(value, this.getValue()), callback);
    }
    step(value) {
        this.controller.step(value);
    }
    updateDisplay() {
        this.controller.updateDisplay();
    }
    options(options) {
        return this.controller.options(options);
    }
    setName(name) {
        this.name(name);
        return this;
    }
    name(name) {
        this.controller.name(name);
        return this;
    }
    hide() {
        $(this.getParentDomElement()).hide();
    }
    show() {
        $(this.getParentDomElement()).show();
    }
}
exports.Controller = Controller;
class GUI {
    constructor(options = null, name = null, parent = null) {
        this.gui = parent != null && name != null ? parent.gui.addFolder(name) : new dat.GUI(options);
        this.name = name;
        this.parent = parent;
        this.nameToController = new Map();
        this.nameToFolder = new Map();
    }
    getDomElement() {
        return this.gui.domElement;
    }
    add(object, propertyName, min = null, max = null, step = null) {
        let controller = new Controller(this.gui.add(object, propertyName, min, max, step), this);
        this.nameToController.set(propertyName, controller);
        return controller;
    }
    addButton(name, callback) {
        let object = {};
        object[name] = callback;
        return this.add(object, name);
    }
    setName(name) {
        $(this.getDomElement()).find('li.title').text(name);
    }
    addFileSelectorButton(name, fileType, callback) {
        let divJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='" + fileType + "'/>");
        let button = this.addButton(name, (event) => divJ.click());
        // $(button.getDomElement()).append(divJ)
        divJ.insertAfter(button.getParentDomElement());
        divJ.hide();
        divJ.change((event) => {
            callback(event);
            divJ.val('');
        });
        return button;
    }
    addSlider(name, value, min, max, step = null) {
        let object = {};
        object[name] = value;
        let slider = this.add(object, name, min, max);
        if (step != null) {
            slider.step(step);
        }
        return slider;
    }
    addFolder(name) {
        let folder = new GUI(null, name, this);
        this.nameToFolder.set(name, folder);
        return folder;
    }
    getController(name) {
        return this.nameToController.get(name);
    }
    getControllers() {
        let keyValues = Array.from(this.nameToController);
        return Array.from(keyValues, keyValue => keyValue[1]);
    }
    getAllControllers() {
        let controllers = this.getControllers();
        for (let f of this.nameToFolder) {
            let folder = f[1];
            controllers = controllers.concat(folder.getAllControllers());
        }
        return controllers;
    }
    getFolder(name) {
        return this.nameToFolder.get(name);
    }
    getFolders() {
        let keyValues = Array.from(this.nameToFolder);
        return Array.from(keyValues, keyValue => keyValue[1]);
    }
    hide() {
        $(this.gui.domElement).hide();
    }
    show() {
        $(this.gui.domElement).show();
    }
    open() {
        this.gui.open();
    }
    close() {
        this.gui.close();
    }
}
exports.GUI = GUI;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Plot_1 = __webpack_require__(5);
const Communication_1 = __webpack_require__(1);
const Tipibot_1 = __webpack_require__(2);
const RequestTimeout = 2000;
let scale = 1000;
let CommeUnDesseinSize = new paper.Size(4000, 3000);
let commeUnDesseinToDrawArea = function (point) {
    let drawArea = Tipibot_1.tipibot.drawArea.getBounds();
    let CommeUnDesseinPosition = new paper.Point(-CommeUnDesseinSize.width / 2, -CommeUnDesseinSize.height / 2);
    const CommeUnDesseinDrawArea = new paper.Rectangle(CommeUnDesseinPosition, CommeUnDesseinSize);
    return point.subtract(CommeUnDesseinDrawArea.topLeft).divide(CommeUnDesseinDrawArea.size).multiply(drawArea.size()).add(drawArea.topLeft());
};
let posOnPlanetToProject = function (point, planet) {
    if (point.x == null && point.y == null) {
        point = new paper.Point(point);
    }
    let x = planet.x * 360 + point.x;
    let y = planet.y * 180 + point.y;
    x *= scale;
    y *= scale;
    return new paper.Point(x, y);
};
let posOnPlanetToDrawArea = function (point, planet) {
    let posOnProject = posOnPlanetToProject(point, planet);
    return commeUnDesseinToDrawArea(posOnProject);
};
let commeundesseinAjaxURL = '/ajaxCall/';
const CommeUnDesseinSecretKey = 'CommeUnDesseinSecret';
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        let getCookie = function (name) {
            var cookie, cookieValue, cookies, i;
            cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                cookies = document.cookie.split(';');
                i = 0;
                while (i < cookies.length) {
                    cookie = jQuery.trim(cookies[i]);
                    if (cookie.substring(0, name.length + 1) === name + '=') {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                    i++;
                }
            }
            return cookieValue;
        };
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
            xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
        }
    }
});
var State;
(function (State) {
    State[State["NextDrawing"] = 0] = "NextDrawing";
    State[State["RequestedNextDrawing"] = 1] = "RequestedNextDrawing";
    State[State["Drawing"] = 2] = "Drawing";
    State[State["SetStatus"] = 3] = "SetStatus";
    State[State["RequestedSetStatus"] = 4] = "RequestedSetStatus";
})(State || (State = {}));
class CommeUnDessein {
    constructor(testMode = false) {
        this.mode = 'CommeUnDessein';
        this.secret = '******';
        this.state = State.NextDrawing;
        this.testMode = testMode;
        let secret = localStorage.getItem(CommeUnDesseinSecretKey);
        if (secret != null) {
            this.secret = secret;
        }
    }
    createGUI(gui) {
        let folderName = 'Comme un dessein';
        if (this.testMode) {
            folderName += ' (Test mode)';
        }
        let commeUnDesseinGUI = gui.addFolder(folderName);
        commeUnDesseinGUI.add(this, 'mode');
        commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => localStorage.setItem(CommeUnDesseinSecretKey, value));
        CommeUnDesseinSize.width = Tipibot_1.tipibot.drawArea.getBounds().width;
        CommeUnDesseinSize.height = Tipibot_1.tipibot.drawArea.getBounds().height;
        commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, Settings_1.Settings.tipibot.width).name('Width');
        commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, Settings_1.Settings.tipibot.height).name('Height');
        commeUnDesseinGUI.addButton('Start', () => this.requestNextDrawing());
        commeUnDesseinGUI.addButton('Stop & Clear', () => this.stopAndClear());
        commeUnDesseinGUI.open();
    }
    stopAndClear() {
        if (Plot_1.SVGPlot.svgPlot != null) {
            Plot_1.SVGPlot.svgPlot.clear();
        }
        Communication_1.communication.interpreter.stopAndClearQueue();
        this.state = State.NextDrawing;
    }
    requestNextDrawing() {
        if (this.state != State.NextDrawing) {
            console.error('CommeUnDessein trying to request next drawing while not in NextDrawing state');
            return;
        }
        let args = {
            city: { name: this.mode, secret: this.secret }
        };
        let functionName = this.testMode ? 'getNextTestDrawing' : 'getNextValidatedDrawing';
        let data = {
            data: JSON.stringify({ function: functionName, args: args })
        };
        this.state = State.RequestedNextDrawing;
        if (this.testMode) {
            console.log('requestNextDrawing');
        }
        // let url = this.testMode ? 'http://localhost:8000/ajaxCallNoCSRF/' : commeundesseinAjaxURL
        let url = commeundesseinAjaxURL;
        // $.ajax({ method: "GET", url: url, data: data, xhrFields: { withCredentials: false }, headers: {'Access-Control-Allow-Origin':true} }).done((results) => {
        $.ajax({ method: "POST", url: url, data: data }).done((results) => {
            if (this.testMode) {
                console.log(results);
            }
            if (results.message == 'no path') {
                this.state = State.NextDrawing;
                setTimeout(() => this.requestNextDrawing(), RequestTimeout);
                return;
            }
            if (this.state != State.RequestedNextDrawing) {
                console.error('CommeUnDessein trying to set to draw while not in RequestedNextDrawing state');
                return;
            }
            this.drawSVG(results);
            return;
        }).fail((results) => {
            console.error('getNextValidatedDrawing request failed');
            console.error(results);
            this.state = State.NextDrawing;
            setTimeout(() => this.requestNextDrawing(), RequestTimeout);
        });
    }
    drawSVG(results) {
        if (results.state == 'error') {
            console.log(results);
            return;
        }
        this.state = State.Drawing;
        this.currentDrawing = results;
        let drawing = new paper.Group();
        paper.project.importSVG(results.svg, (item, svg) => {
            for (let path of item.children) {
                if (path.className != 'Path') {
                    continue;
                }
                // Ignore anything that humans can't see to avoid hacks
                let strokeColor = path.strokeColor;
                if (path.strokeWidth <= 0.2 || path.strokeColor == 'white' || path.strokeColor == null || path.opacity <= 0.1 || strokeColor.alpha <= 0.2) {
                    continue;
                }
                let controlPath = path.clone();
                controlPath.flatten(Settings_1.Settings.plot.flattenPrecision);
                // now that controlPath is flattened: convert in draw area coordinates
                for (let segment of controlPath.segments) {
                    segment.point = commeUnDesseinToDrawArea(segment.point);
                }
                drawing.addChild(controlPath);
            }
            if (Plot_1.SVGPlot.svgPlot != null) {
                Plot_1.SVGPlot.svgPlot.clear();
            }
            Plot_1.SVGPlot.svgPlot = new Plot_1.SVGPlot(drawing);
            Plot_1.SVGPlot.svgPlot.plot(() => this.setDrawingStatusDrawn(results.pk));
        });
    }
    draw(results) {
        if (results.state == 'error') {
            console.log(results);
            return;
        }
        this.state = State.Drawing;
        this.currentDrawing = results;
        let drawing = new paper.Group();
        for (let itemJson of results.items) {
            let item = JSON.parse(itemJson);
            let pk = item._id.$oid;
            let id = item.clientId;
            let date = item.date != null ? item.date.$date : null;
            let data = item.data != null && item.data.length > 0 ? JSON.parse(item.data) : null;
            let points = data.points;
            let planet = data.planet;
            let controlPath = new paper.Path();
            for (let i = 0; i < points.length; i += 4) {
                let point = points[i];
                // points and handles in project coordinates
                // do not convert in draw area cooredinates before flattening (to keep handle proportions)
                controlPath.add(posOnPlanetToProject(point, planet));
                controlPath.lastSegment.handleIn = new paper.Point(points[i + 1]);
                controlPath.lastSegment.handleOut = new paper.Point(points[i + 2]);
                // controlPath.lastSegment.rtype = points[i+3]
            }
            controlPath.flatten(Settings_1.Settings.plot.flattenPrecision);
            // now that controlPath is flattened: convert in draw area coordinates
            for (let segment of controlPath.segments) {
                segment.point = commeUnDesseinToDrawArea(segment.point);
            }
            drawing.addChild(controlPath);
        }
        if (Plot_1.SVGPlot.svgPlot != null) {
            Plot_1.SVGPlot.svgPlot.clear();
        }
        Plot_1.SVGPlot.svgPlot = new Plot_1.SVGPlot(drawing);
        Plot_1.SVGPlot.svgPlot.plot(() => this.setDrawingStatusDrawn(results.pk));
    }
    setDrawingStatusDrawn(pk) {
        if (this.state != State.Drawing) {
            console.error('CommeUnDessein trying to setDrawingStatusDrawn while not in Drawing state');
            return;
        }
        let args = {
            pk: pk,
            secret: this.secret
        };
        let functionName = this.testMode ? 'setDrawingStatusDrawnTest' : 'setDrawingStatusDrawn';
        let data = {
            data: JSON.stringify({ function: functionName, args: args })
        };
        this.state = State.RequestedSetStatus;
        if (this.testMode) {
            console.log('setDrawingStatusDrawn');
        }
        let url = commeundesseinAjaxURL;
        $.ajax({ method: "POST", url: url, data: data }).done((results) => {
            if (this.testMode) {
                console.log(results);
            }
            if (results.state == 'error') {
                console.error(results);
                return;
            }
            if (this.state != State.RequestedSetStatus) {
                console.error('CommeUnDessein trying to requestNextDrawing while not in RequestedSetStatus state');
                return;
            }
            this.state = State.NextDrawing;
            this.requestNextDrawing();
            return;
        }).fail((results) => {
            console.error('setDrawingStatusDrawn request failed');
            console.error(results);
            this.state = State.Drawing;
            this.setDrawingStatusDrawn(pk);
        });
    }
}
exports.CommeUnDessein = CommeUnDessein;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Tipibot_1 = __webpack_require__(2);
class Move {
    constructor(telescreen) {
        this.timeoutID = -1;
        this.telescreen = telescreen;
    }
    moveTipibot(moveType) {
        this.timeoutID = null;
        if (moveType == 'linear') {
            Tipibot_1.tipibot.moveLinear(this.telescreen.position);
        }
        else if (moveType == 'direct') {
            Tipibot_1.tipibot.moveDirect(this.telescreen.position);
        }
    }
    moveTipibotDeferred(moveType) {
        this.clearTimeout();
        this.timeoutID = setTimeout(() => this.moveTipibot(moveType), 500);
    }
    clearTimeout() {
        if (this.timeoutID != null) {
            clearTimeout(this.timeoutID);
            this.timeoutID = null;
        }
    }
    positiveLeft() { }
    negativeLeft() { }
    positiveRight() { }
    negativeRight() { }
}
class OrthographicMove extends Move {
    positiveLeft() {
        this.telescreen.position.x += this.telescreen.speed;
        this.moveTipibotDeferred('linear');
    }
    negativeLeft() {
        this.telescreen.position.x -= this.telescreen.speed;
        this.moveTipibotDeferred('linear');
    }
    positiveRight() {
        this.telescreen.position.y += this.telescreen.speed;
        this.moveTipibotDeferred('linear');
    }
    negativeRight() {
        this.telescreen.position.y -= this.telescreen.speed;
        this.moveTipibotDeferred('linear');
    }
}
class PolarMove extends Move {
    positiveLeft() {
        let lengths = Tipibot_1.tipibot.cartesianToLengths(this.telescreen.position);
        lengths.x += this.telescreen.speed;
        this.telescreen.position = Tipibot_1.tipibot.lengthsToCartesian(lengths);
        this.moveTipibotDeferred('direct');
    }
    negativeLeft() {
        let lengths = Tipibot_1.tipibot.cartesianToLengths(this.telescreen.position);
        lengths.x -= this.telescreen.speed;
        this.telescreen.position = Tipibot_1.tipibot.lengthsToCartesian(lengths);
        this.moveTipibotDeferred('direct');
    }
    positiveRight() {
        let lengths = Tipibot_1.tipibot.cartesianToLengths(this.telescreen.position);
        lengths.y += this.telescreen.speed;
        this.telescreen.position = Tipibot_1.tipibot.lengthsToCartesian(lengths);
        this.moveTipibotDeferred('direct');
    }
    negativeRight() {
        let lengths = Tipibot_1.tipibot.cartesianToLengths(this.telescreen.position);
        lengths.y -= this.telescreen.speed;
        this.telescreen.position = Tipibot_1.tipibot.lengthsToCartesian(lengths);
        this.moveTipibotDeferred('direct');
    }
}
class DirectionMove extends Move {
    constructor() {
        super(...arguments);
        this.direction = new paper.Point(1, 0);
    }
    positiveLeft() {
        this.direction.angle += 360 / 30;
    }
    negativeLeft() {
        this.direction.angle -= 360 / 30;
    }
    positiveRight() {
        this.telescreen.position = this.telescreen.position.add(this.direction.multiply(this.telescreen.speed));
        this.moveTipibotDeferred('linear');
    }
    negativeRight() {
        this.telescreen.position = this.telescreen.position.subtract(this.direction.multiply(this.telescreen.speed));
        this.moveTipibotDeferred('linear');
    }
}
class Telescreen {
    constructor() {
        this.speed = 1;
        this.move = null;
        this.moves = new Map();
        this.moves.set('Orthographic', new OrthographicMove(this));
        this.moves.set('Polar', new PolarMove(this));
        this.moves.set('Direction', new DirectionMove(this));
        document.addEventListener('Disconnect', () => this.disconnect(), false);
        document.addEventListener('Connect', (event) => this.connect(event.detail), false);
        document.addEventListener('MessageReceived', (event) => this.messageReceived(event.detail), false);
        this.move = this.moves.get('Orthographic');
        this.position = Tipibot_1.tipibot.getPosition();
    }
    createGUI(gui) {
        let telescreenGUI = gui.addFolder('Telescreen');
        telescreenGUI.addSlider('Speed', 1, 1, 100, 1).onChange((value) => this.speed = value);
        this.modeController = telescreenGUI.add({ 'Mode': 'Orthographic' }, 'Mode', ['Orthographic', 'Polar', 'Direction']).onFinishChange((value) => this.modeChanged(value));
        telescreenGUI.open();
    }
    changeMode(mode) {
        for (let m of this.moves) {
            m[1].clearTimeout();
        }
        this.move = this.moves.get(mode);
    }
    modeChanged(mode) {
        this.changeMode(mode);
    }
    cycleMode() {
        let movesList = [];
        let i = 0;
        let currentMoveIndex = 0;
        for (let m of this.moves) {
            if (m[1] == this.move) {
                currentMoveIndex = i;
            }
            movesList.push(m[0]);
            i++;
        }
        let newMove = movesList[i + 1 < movesList.length ? i + 1 : 0];
        this.changeMode(newMove);
        this.modeController.setValue(newMove);
        this.modeController.updateDisplay();
    }
    connect(port) {
        // for(let serialPort of communication.serialPorts) {
        // 	if(serialPort != port) {
        // 		communication.socket.emit('command', 'open ' + serialPort + ' ' + SERIAL_COMMUNICATION_SPEED)
        // 	}
        // }
    }
    disconnect() {
        // for(let serialPort of communication.serialPorts) {
        // 	if(serialPort != communication.interpreter.serialPort) {
        // 		communication.socket.emit('command', 'close ' + serialPort)
        // 	}
        // }
    }
    messageReceived(message) {
        let position = Tipibot_1.tipibot.getPosition();
        if (message.indexOf('left') == 0) {
            if (message.indexOf('+') > 0) {
                this.move.positiveLeft();
            }
            else if (message.indexOf('-') > 0) {
                this.move.negativeLeft();
            }
            else if (message.indexOf('OFF') > 0) {
                Tipibot_1.tipibot.togglePenState();
            }
        }
        else if (message.indexOf('right') == 0) {
            if (message.indexOf('+') > 0) {
                this.move.positiveRight();
            }
            else if (message.indexOf('-') > 0) {
                this.move.negativeRight();
            }
            else if (message.indexOf('OFF') > 0) {
                this.cycleMode();
            }
        }
    }
}
exports.Telescreen = Telescreen;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Pen_1 = __webpack_require__(3);
const Tipibot_1 = __webpack_require__(2);
class VisualFeedback {
    constructor() {
        this.drawing = false;
        this.positionPrefix = 'position: l: ';
        this.subTargetPrefix = 'sub target: l: ';
        this.paths = new paper.Group();
        this.subTargets = new paper.Group();
        let positon = Tipibot_1.tipibot.getPosition();
        this.circle = paper.Path.Circle(positon, Pen_1.Pen.HOME_RADIUS);
        this.circle.fillColor = 'yellow';
        this.circle.strokeColor = 'black';
        this.circle.strokeWidth = 1;
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(positon);
        this.lines.add(new paper.Point(Settings_1.Settings.tipibot.width, 0));
        this.lines.strokeWidth = 0.5;
        this.lines.strokeColor = 'rgba(0, 0, 0, 0.5)';
        this.lines.dashArray = [2, 2];
        this.lines.strokeScaling = false;
        document.addEventListener('MessageReceived', (event) => this.onMessageReceived(event.detail), false);
    }
    clear() {
        this.paths.removeChildren();
        this.subTargets.removeChildren();
    }
    setPosition(point) {
        this.circle.position = point;
        this.lines.segments[1].point = point;
    }
    computePoint(data, prefix) {
        let m = data.replace(prefix, '');
        let messages = m.split(', r: ');
        let x = parseInt(messages[0]);
        let y = parseInt(messages[1]);
        let lengths = new paper.Point(x, y);
        let lengthsMm = Settings_1.SettingsManager.stepsToMm(lengths);
        return Tipibot_1.tipibot.lengthsToCartesian(lengthsMm);
    }
    onMessageReceived(data) {
        if (data.indexOf(this.positionPrefix) == 0) {
            this.updatePosition(data);
        }
        else if (data.indexOf(this.subTargetPrefix) == 0) {
            this.setSubTarget(data);
        }
    }
    updatePosition(data) {
        let point = this.computePoint(data, this.positionPrefix);
        if (!Tipibot_1.tipibot.pen.isPenUp) {
            if (!this.drawing) {
                let path = new paper.Path();
                path.strokeWidth = Settings_1.Settings.tipibot.penWidth;
                path.strokeColor = 'black';
                this.paths.addChild(path);
                this.drawing = true;
            }
            else {
                let path = this.paths.lastChild;
                path.add(point);
            }
        }
        else {
            this.drawing = false;
        }
        this.setPosition(point);
    }
    setSubTarget(data) {
        let point = this.computePoint(data, this.subTargetPrefix);
        if (!Tipibot_1.tipibot.pen.isPenUp) {
            let path = new paper.Path();
            path.strokeWidth = 0.1;
            path.strokeColor = 'red';
            this.subTargets.addChild(path);
            let size = 2;
            path.add(point.add(size));
            path.add(point.add(-size));
            path.add(point);
            path.add(point.add(new paper.Point(size, -size)));
            path.add(point.add(new paper.Point(-size, size)));
        }
    }
}
exports.VisualFeedback = VisualFeedback;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const MAX_INPUT_BUFFER_LENGTH = 500;
class Interpreter {
    constructor() {
        this.commandID = 0;
        this.continueMessage = 'READY';
        this.commandQueue = [];
        this.pause = false;
        this.serialInput = '';
        this.tempoNextCommand = false;
    }
    setSerialPort(serialPort) {
        this.serialPort = serialPort;
    }
    setSocket(socket) {
        this.socket = socket;
    }
    setTipibot(tipibot) {
        this.tipibot = tipibot;
    }
    connectionOpened() {
        this.initialize();
    }
    initialize(initializeAtHome = true) {
        this.sendPenWidth(Settings_1.Settings.tipibot.penWidth);
        this.sendSpecs();
        this.sendInvertXY();
        // Initialize at home position by default; it is always possible to set position afterward
        // This is to ensure the tipibot is correctly automatically initialized even when the user moves it without initializing it before 
        this.sendSetPosition(initializeAtHome ? new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY) : this.tipibot.getPosition());
        this.sendMaxSpeedAndAcceleration();
        this.tipibot.initializedCommunication = true;
    }
    send(command) {
        if (this.pause) {
            return;
        }
        document.dispatchEvent(new CustomEvent('SendCommand', { detail: command }));
        // this.socket.emit('command', 'send ' + this.serialPort + ' ' + command.data)
        console.log('send: ' + command.message + ' - ' + command.data);
        this.socket.emit('data', command.data);
    }
    messageReceived(message) {
        if (message == null) {
            return;
        }
        this.serialInput += message;
        let messages = this.serialInput.split('\n');
        // process all messages except the last one (it is either empty if the serial input ends with '\n', or it is not a finished message)
        for (let i = 0; i < messages.length - 1; i++) {
            this.processMessage(messages[i]);
        }
        // Clear any old message
        if (this.serialInput.endsWith('\n')) {
            this.serialInput = '';
        }
        else {
            this.serialInput = messages[messages.length - 1];
        }
    }
    processMessage(message) {
        console.log(message);
        // if(message.indexOf('++')==0) {
        // 	console.log(message)
        // }
        document.dispatchEvent(new CustomEvent('MessageReceived', { detail: message }));
        if (message.indexOf(this.continueMessage) == 0) {
            if (this.commandQueue.length > 0) {
                let command = this.commandQueue.shift();
                if (command.callback != null) {
                    command.callback();
                }
                document.dispatchEvent(new CustomEvent('CommandExecuted', { detail: command }));
                if (this.commandQueue.length > 0) {
                    this.send(this.commandQueue[0]);
                }
                else {
                    this.queueEmpty();
                }
            }
        }
    }
    queueEmpty() {
    }
    setPause(pause) {
        this.pause = pause;
        if (!this.pause && this.commandQueue.length > 0) {
            this.send(this.commandQueue[0]);
        }
    }
    queue(data, message, callback = null) {
        if (this.socket == null) {
            return;
        }
        let command = { id: this.commandID++, data: data, callback: callback, message: message };
        document.dispatchEvent(new CustomEvent('QueueCommand', { detail: command }));
        this.commandQueue.push(command);
        if (this.commandQueue.length == 1) {
            this.send(command);
        }
    }
    removeCommand(commandID) {
        let index = this.commandQueue.findIndex((command) => command.id == commandID);
        if (index >= 0) {
            this.commandQueue.splice(index, 1);
        }
    }
    clearQueue() {
        this.commandQueue = [];
        document.dispatchEvent(new CustomEvent('ClearQueue', { detail: null }));
    }
    stopAndClearQueue() {
        this.clearQueue();
        this.sendStop();
    }
    sendSetPosition(point = this.tipibot.getPosition()) {
    }
    sendMoveDirect(point, callback = null) {
    }
    sendMoveDirectFullSpeed(point, callback = null) {
    }
    sendMoveLinearFullSpeed(point, callback = null) {
    }
    sendMoveLinear(point, callback = null) {
    }
    sendMaxSpeed(speed = Settings_1.Settings.tipibot.maxSpeed, acceleration = Settings_1.Settings.tipibot.acceleration) {
    }
    sendAcceleration(acceleration = Settings_1.Settings.tipibot.acceleration) {
    }
    sendMaxSpeedAndAcceleration(speed = Settings_1.Settings.tipibot.maxSpeed, acceleration = Settings_1.Settings.tipibot.acceleration) {
    }
    sendSize(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height) {
    }
    sendStepsPerRev(stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev) {
    }
    sendMmPerRev(mmPerRev = Settings_1.Settings.tipibot.mmPerRev) {
    }
    sendStepMultiplier(microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
    }
    sendPenWidth(penWidth = Settings_1.Settings.tipibot.penWidth) {
    }
    sendServoSpeed(servoSpeed = Settings_1.Settings.servo.speed) {
    }
    sendSpecs(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height, stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev, mmPerRev = Settings_1.Settings.tipibot.mmPerRev, microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
    }
    sendInvertXY(invertMotorLeft = Settings_1.Settings.tipibot.invertMotorLeft, invertMotorRight = Settings_1.Settings.tipibot.invertMotorRight) {
    }
    sendProgressiveMicrosteps(progressiveMicrosteps = Settings_1.Settings.tipibot.progressiveMicrosteps) {
    }
    sendPause(delay) {
    }
    sendMotorOff() {
    }
    sendMotorOn() {
    }
    sendPenState(servoValue, servoTempo = 0) {
    }
    sendPenUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
    }
    sendPenDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
    }
    sendStop() {
    }
    sendPenLiftRange(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoUpValue = Settings_1.SettingsManager.servoUpAngle()) {
    }
    sendPenDelays(servoDownDelay = Settings_1.Settings.servo.delay.down.before, servoUpDelay = Settings_1.Settings.servo.delay.up.before) {
    }
}
exports.Interpreter = Interpreter;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Interpreter_1 = __webpack_require__(13);
class PenPlotter extends Interpreter_1.Interpreter {
    sendSetPosition(point = this.tipibot.getPosition()) {
        super.sendSetPosition(point);
        let lengths = this.tipibot.cartesianToLengths(point);
        let lengthsSteps = Settings_1.SettingsManager.mmToSteps(lengths);
        // console.log('set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
        let message = 'Set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2);
        this.queue('G92 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message);
    }
    sendMoveDirect(point, callback = null) {
        super.sendMoveDirect(point, callback);
        let lengths = this.tipibot.cartesianToLengths(point);
        let lengthsSteps = Settings_1.SettingsManager.mmToSteps(lengths);
        let message = 'Move direct: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2);
        // console.log('move direct: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
        this.queue('G0 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback);
    }
    sendMoveLinear(point, callback = null) {
        super.sendMoveLinear(point, callback);
        let lengths = this.tipibot.cartesianToLengths(point);
        let lengthsSteps = Settings_1.SettingsManager.mmToSteps(lengths);
        let message = 'Move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2);
        // console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
        this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback);
    }
    sendMaxSpeed(speed = Settings_1.Settings.tipibot.maxSpeed) {
        // console.log('set speed: ' + speed)
        let message = 'Set max speed: ' + speed;
        this.queue('G0 F' + speed.toFixed(2) + '\n', message);
    }
    sendAcceleration(acceleration = Settings_1.Settings.tipibot.acceleration) {
        console.log('set acceleration: ' + acceleration);
        let message = 'Set acceleration: ' + acceleration;
        this.queue('G0 S' + acceleration.toFixed(2) + '\n', message);
    }
    sendMaxSpeedAndAcceleration(speed = Settings_1.Settings.tipibot.maxSpeed, acceleration = Settings_1.Settings.tipibot.acceleration) {
        console.log('set speed: ' + speed);
        console.log('set acceleration: ' + acceleration);
        let message = 'Set speed: ' + acceleration + ', set acceleration: ' + acceleration;
        this.queue('G0 F' + speed.toFixed(2) + ' S' + acceleration.toFixed(2) + '\n', message);
    }
    sendInvertXY(invertMotorLeft = Settings_1.Settings.tipibot.invertMotorLeft, invertMotorRight = Settings_1.Settings.tipibot.invertMotorRight) {
        // console.log('invertMotorLeft: ' + invertMotorLeft + ', invertMotorRight: ' + invertMotorRight)
        let message = 'Invert motors: left: ' + invertMotorLeft + ', right: ' + invertMotorRight;
        this.queue('M12 X' + (invertMotorLeft ? -1 : 1) + ' Y' + (invertMotorRight ? -1 : 1) + '\n', message);
    }
    sendProgressiveMicrosteps(progressiveMicrosteps = Settings_1.Settings.tipibot.progressiveMicrosteps) {
        // console.log('progressiveMicrosteps: ' + progressiveMicrosteps)
        let message = 'Set progressiveMicrosteps: ' + progressiveMicrosteps;
        this.queue('M13 F' + (progressiveMicrosteps ? -1 : 1) + '\n', message);
    }
    sendSize(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height) {
        // todo: test
        let message = 'Send size: ' + tipibotWidth.toFixed(2);
        this.queue('M4 X' + tipibotWidth.toFixed(2) + '\n', message);
    }
    sendStepsPerRev(stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev) {
        this.sendSpecs(Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height, stepsPerRev, Settings_1.Settings.tipibot.mmPerRev, Settings_1.Settings.tipibot.microstepResolution);
    }
    sendMmPerRev(mmPerRev = Settings_1.Settings.tipibot.mmPerRev) {
        this.sendSpecs(Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height, Settings_1.Settings.tipibot.stepsPerRev, mmPerRev, Settings_1.Settings.tipibot.microstepResolution);
    }
    sendStepMultiplier(microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
        this.sendSpecs(Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height, Settings_1.Settings.tipibot.stepsPerRev, Settings_1.Settings.tipibot.mmPerRev, microstepResolution);
    }
    sendSpecs(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height, stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev, mmPerRev = Settings_1.Settings.tipibot.mmPerRev, microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
        let stepsPerRevolution = stepsPerRev * microstepResolution;
        let millimetersPerStep = mmPerRev / stepsPerRevolution;
        let message = 'Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + (stepsPerRev * microstepResolution) + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep;
        console.log(message);
        this.queue('M4 X' + tipibotWidth + ' S' + (stepsPerRev * microstepResolution) + ' P' + mmPerRev + '\n', message);
    }
    sendPause(delay, callback = null) {
        // Todo: floor delay
        let message = 'Wait: ' + delay;
        this.queue('G4 P' + delay + '\n', message, callback);
    }
    sendMotorOff() {
        let message = 'Disable motors';
        this.queue('M84\n', message);
    }
    convertServoValue(servoValue) {
        // pen plotter needs servo value in microseconds
        // see https://www.arduino.cc/en/Reference/ServoWriteMicroseconds
        return 700 + 1600 * servoValue / 180;
    }
    sendPenState(servoValue, delayBefore = 0, delayAfter = 0, callback = null) {
        servoValue = this.convertServoValue(servoValue);
        let message = 'Move servo: ' + servoValue;
        this.sendPause(delayBefore);
        this.queue('M340 P3 S' + servoValue + '\n', message);
        this.sendPause(delayAfter, callback);
        // this.queue('G4 P' + delayAfter + '\n', callback)
    }
    sendPenUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), delayBefore = Settings_1.Settings.servo.delay.up.before, delayAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        this.sendPenState(servoUpValue, delayBefore, delayAfter, callback);
    }
    sendPenDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), delayBefore = Settings_1.Settings.servo.delay.down.before, delayAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        this.sendPenState(servoDownValue, delayBefore, delayAfter, callback);
    }
    sendStop() {
        let message = 'Stop';
        this.queue('M0\n', message);
    }
}
exports.PenPlotter = PenPlotter;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const PenPlotter_1 = __webpack_require__(14);
class TipibotInterpreter extends PenPlotter_1.PenPlotter {
    constructor() {
        super(...arguments);
        this.continueMessage = 'READY';
        this.initializationMessage = 'Initialize';
    }
    connectionOpened() {
    }
    sendMoveDirectFullSpeed(point, callback = null) {
        super.sendMoveDirectFullSpeed(point, callback);
        let lengths = this.tipibot.cartesianToLengths(point);
        let lengthsSteps = Settings_1.SettingsManager.mmToSteps(lengths);
        // console.log('move direct max speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
        let message = 'Move direct full speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2);
        this.queue('G2 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback);
    }
    sendMoveLinearFullSpeed(point, callback = null) {
        super.sendMoveLinearFullSpeed(point, callback);
        let lengths = this.tipibot.cartesianToLengths(point);
        let lengthsSteps = Settings_1.SettingsManager.mmToSteps(lengths);
        // console.log('move linear full speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
        let message = 'Move linear full speed: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2);
        this.queue('G3 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + '\n', message, callback);
    }
    sendSpecs(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height, stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev, mmPerRev = Settings_1.Settings.tipibot.mmPerRev, microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
        let stepsPerRevolution = stepsPerRev * microstepResolution;
        let millimetersPerStep = mmPerRev / stepsPerRevolution;
        // console.log('Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + stepsPerRev + ', microstepResolution: ' + microstepResolution + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep)
        let message = 'Setup: tipibotWidth: ' + tipibotWidth + ', stepsPerRevolution: ' + stepsPerRev + ', microstepResolution: ' + microstepResolution + ', mmPerRev: ' + mmPerRev + ', millimetersPerStep: ' + millimetersPerStep;
        this.queue('M4 X' + tipibotWidth + ' S' + stepsPerRev + ' F' + microstepResolution + ' P' + mmPerRev + '\n', message);
    }
    sendServoSpeed(servoSpeed = Settings_1.Settings.servo.speed) {
        let message = 'Set servo speed: ' + servoSpeed;
        this.queue('M14 F' + servoSpeed + '\n', message);
    }
    convertServoValue(servoValue) {
        return servoValue;
    }
    sendMotorOn() {
        let message = 'Enable motors';
        this.queue('M85\n', message);
    }
    processMessage(message) {
        super.processMessage(message);
        if (message.indexOf(this.initializationMessage) == 0) {
            this.initialize();
        }
    }
}
exports.TipibotInterpreter = TipibotInterpreter;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/paper/index.d.ts"/>
/// <reference path="../node_modules/@types/file-saver/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
// Todo:
// - make a visual difference between penUp / penDown (on the pen: fill / no fill)
// - up/down/left/right keys to move pen position
// - reorganize GUI folders (settings)
// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"
const Settings_1 = __webpack_require__(0);
const Tipibot_1 = __webpack_require__(2);
const Renderers_1 = __webpack_require__(6);
const Pen_1 = __webpack_require__(3);
const Plot_1 = __webpack_require__(5);
const Communication_1 = __webpack_require__(1);
const CommandDisplay_1 = __webpack_require__(8);
const InteractiveItem_1 = __webpack_require__(4);
const GUI_1 = __webpack_require__(9);
const VisualFeedback_1 = __webpack_require__(12);
const CommeUnDessein_1 = __webpack_require__(10);
const Telescreen_1 = __webpack_require__(11);
let communication = null;
let container = null;
let renderer = null;
let gui;
let positionPreview = null;
let drawing = {
    scale: 1,
};
let w = window;
w.send = function (message) {
    communication.interpreter.send({ id: -1, data: message, callback: () => console.log('Command' + message + ' done.'), message: message });
};
w.addPlugin = function (pluginName, testMode) {
    if (pluginName == 'CommeUnDessein') {
        let commeUnDessein = new CommeUnDessein_1.CommeUnDessein(testMode);
        commeUnDessein.createGUI(gui);
        w.commeUnDessein = commeUnDessein;
    }
    else if (pluginName == 'Telescreen') {
        let telescreen = new Telescreen_1.Telescreen();
        telescreen.createGUI(gui);
        w.telescreen = telescreen;
    }
};
document.addEventListener("DOMContentLoaded", function (event) {
    function initialize() {
        dat.GUI.DEFAULT_WIDTH = 325;
        gui = new GUI_1.GUI({ autoPlace: false });
        // let console = new Console()
        let customContainer = document.getElementById('gui');
        customContainer.appendChild(gui.getDomElement());
        let communicationFolder = gui.addFolder('Communication');
        communication = new Communication_1.Communication(communicationFolder);
        let commandFolder = gui.addFolder('Commands');
        commandFolder.open();
        Settings_1.settingsManager.createGUI(gui);
        Plot_1.SVGPlot.createGUI(gui);
        Plot_1.Plot.createGUI(Plot_1.SVGPlot.gui);
        renderer = new Renderers_1.PaperRenderer();
        Plot_1.SVGPlot.renderer = renderer;
        communication.setTipibot(Tipibot_1.tipibot);
        Tipibot_1.tipibot.initialize(renderer, commandFolder);
        renderer.centerOnTipibot(Settings_1.Settings.tipibot);
        renderer.createDrawingLayer();
        let commandDisplay = new CommandDisplay_1.CommandDisplay();
        commandDisplay.createGUI(gui);
        let visualFeedback = new VisualFeedback_1.VisualFeedback();
        // debug
        w.tipibot = Tipibot_1.tipibot;
        w.settingsManager = Settings_1.settingsManager;
        w.gui = gui;
        w.renderer = renderer;
        w.communication = communication;
        w.commandDisplay = commandDisplay;
        w.visualFeedback = visualFeedback;
        w.SVGPlot = Plot_1.SVGPlot;
    }
    initialize();
    let animate = () => {
        w.nCall = 0;
        requestAnimationFrame(animate);
        renderer.render();
    };
    animate();
    function windowResize() {
        renderer.windowResize();
        renderer.centerOnTipibot(Settings_1.Settings.tipibot, false);
    }
    function eventWasOnGUI(event) {
        return $.contains(gui.getDomElement(), event.target);
    }
    function mouseDown(event) {
        if (!eventWasOnGUI(event)) {
            InteractiveItem_1.InteractiveItem.mouseDown(event);
        }
        renderer.mouseDown(event);
    }
    function mouseMove(event) {
        InteractiveItem_1.InteractiveItem.mouseMove(event);
        renderer.mouseMove(event);
        if (Tipibot_1.tipibot.settingPosition) {
            let position = renderer.getWorldPosition(event);
            if (positionPreview == null) {
                positionPreview = renderer.createCircle(position.x, position.y, Pen_1.Pen.HOME_RADIUS);
            }
            positionPreview.setPosition(position);
            Tipibot_1.tipibot.setPositionSliders(position);
        }
    }
    function mouseUp(event) {
        if (!eventWasOnGUI(event)) {
            InteractiveItem_1.InteractiveItem.mouseUp(event);
        }
        renderer.mouseUp(event);
        if (Tipibot_1.tipibot.settingPosition && !Settings_1.settingsManager.tipibotPositionFolder.getController('Set position with mouse').contains(event.target)) {
            if (positionPreview != null) {
                positionPreview.remove();
                positionPreview = null;
            }
            Tipibot_1.tipibot.setPosition(renderer.getWorldPosition(event));
            Tipibot_1.tipibot.toggleSetPosition(false, false);
        }
    }
    function mouseLeave(event) {
        InteractiveItem_1.InteractiveItem.mouseLeave(event);
        renderer.mouseLeave(event);
    }
    function mouseWheel(event) {
        renderer.mouseWheel(event);
    }
    function keyDown(event) {
        Tipibot_1.tipibot.keyDown(event);
    }
    window.addEventListener('resize', windowResize, false);
    document.body.addEventListener('mousedown', mouseDown);
    document.body.addEventListener('mousemove', mouseMove);
    document.body.addEventListener('mouseup', mouseUp);
    document.body.addEventListener('mouseleave', mouseLeave);
    document.body.addEventListener('keydown', keyDown);
    addWheelListener(document.body, mouseWheel);
});


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Renderer {
    constructor() {
    }
    centerOnTipibot(tipibot, zoom = true) {
    }
    getDomElement() {
        return null;
    }
    createRectangle(rectangle) {
        return null;
    }
    createCircle(x, y, radius, nSegments = 12) {
        return null;
    }
    createPen(x, y, tipibotWidth) {
        return null;
    }
    createTarget(x, y, radius) {
        return null;
    }
    createSprite(canvas) {
        return null;
    }
    createShape(item, material = null) {
        return null;
    }
    createDrawingLayer() {
    }
    getMousePosition(event) {
        return new paper.Point(event.clientX, event.clientY);
    }
    getWorldPosition(event) {
        return paper.view.viewToProject(this.getMousePosition(event));
    }
    windowResize() {
    }
    mouseDown(event) {
    }
    mouseMove(event) {
    }
    mouseUp(event) {
    }
    mouseLeave(event) {
    }
    mouseWheel(event) {
    }
    render() {
    }
}
exports.Renderer = Renderer;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Rect {
    static fromPaperRect(rectangle) {
        return new Rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    }
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    getCenter() {
        return new paper.Point(this.x + this.width / 2, this.y + this.height / 2);
    }
    setTopLeft(point) {
        this.x = point.x;
        this.y = point.y;
    }
    setCenter(center) {
        this.x = center.x - this.width / 2;
        this.y = center.y - this.height / 2;
    }
    getPaperRectangle() {
        return new paper.Rectangle(this.x, this.y, this.width, this.height);
    }
    contains(point) {
        return this.x < point.x && point.x < this.x + this.width && this.y < point.y && point.y < this.y + this.height;
    }
    top() {
        return new paper.Point(this.x + this.width / 2, this.y);
    }
    bottom() {
        return new paper.Point(this.x + this.width / 2, this.y + this.height);
    }
    left() {
        return new paper.Point(this.x, this.y + this.height / 2);
    }
    right() {
        return new paper.Point(this.x + this.width, this.y + this.height / 2);
    }
    topLeft() {
        return new paper.Point(this.x, this.y);
    }
    topRight() {
        return new paper.Point(this.x + this.width, this.y);
    }
    bottomLeft() {
        return new paper.Point(this.x, this.y + this.height);
    }
    bottomRight() {
        return new paper.Point(this.x + this.width, this.y + this.height);
    }
    size() {
        return new paper.Size(this.width, this.height);
    }
    toString() {
        return '' + this.x + ', ' + this.y + ', ' + this.width + ', ' + this.height;
    }
}
exports.Rect = Rect;
class Shape {
    constructor() {
    }
    getPosition() {
        return this.group.position;
    }
    getX() {
        return this.group.position.x;
    }
    getY() {
        return this.group.position.y;
    }
    setX(x) {
        this.group.position.x = x;
    }
    setY(y) {
        this.group.position.y = y;
    }
    setPosition(position) {
        this.group.position = position;
    }
    remove() {
        this.group.remove();
    }
    getBounds() {
        return Rect.fromPaperRect(this.group.bounds);
    }
    getWidth() {
        return this.group.bounds.width;
    }
    getHeight() {
        return this.group.bounds.height;
    }
}
exports.Shape = Shape;
class Rectangle extends Shape {
    constructor() {
        super();
    }
    update(x, y, width, height) {
    }
    updateRectangle(rectangle) {
        this.update(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    }
}
exports.Rectangle = Rectangle;
class Circle extends Shape {
    constructor() {
        super();
    }
    update(x, y, radius) {
    }
}
exports.Circle = Circle;
class Target extends Shape {
    constructor() {
        super();
    }
    update(x, y, radius) {
    }
}
exports.Target = Target;
// ------------- //
// --- PAPER --- //
// ------------- //
class PaperRectangle extends Rectangle {
    constructor(x, y, width, height, layer = null) {
        super();
        this.group = new paper.Group();
        this.update(x, y, width, height, layer);
    }
    update(x, y, width, height, layer = null) {
        if (layer == null && this.group != null) {
            layer = this.group.parent;
        }
        if (this.group != null) {
            this.group.removeChildren();
        }
        let position = new paper.Point(x, y);
        let size = new paper.Size(width, height);
        this.rectangle = paper.Path.Rectangle(position, size);
        this.rectangle.strokeWidth = 0.5;
        this.rectangle.strokeColor = 'black';
        this.rectangle.strokeScaling = false;
        this.group.addChild(this.rectangle);
        if (layer) {
            layer.addChild(this.group);
        }
    }
}
exports.PaperRectangle = PaperRectangle;
class PaperCircle extends Circle {
    constructor(x, y, radius, layer = null) {
        super();
        this.circle = null;
        this.group = new paper.Group();
        let position = new paper.Point(x, y);
        this.circle = paper.Path.Circle(position, radius);
        this.circle.strokeWidth = 0.5;
        this.circle.strokeColor = 'black';
        this.circle.strokeScaling = false;
        this.group.addChild(this.circle);
        if (layer) {
            layer.addChild(this.group);
        }
    }
    update(x, y, radius, layer = null) {
        if (layer != null && this.group != null && this.group.parent != layer) {
            layer.addChild(this.group);
        }
        this.circle.position.x = x;
        this.circle.position.y = y;
    }
}
exports.PaperCircle = PaperCircle;
class PaperTarget extends Target {
    constructor(x, y, radius, layer = null) {
        super();
        this.group = new paper.Group();
        this.update(x, y, radius, layer);
    }
    update(x, y, radius, layer = null) {
        if (layer == null && this.group != null) {
            layer = this.group.parent;
        }
        if (this.group != null) {
            this.group.removeChildren();
        }
        let position = new paper.Point(x, y);
        this.circle = paper.Path.Circle(position, radius);
        this.circle.strokeWidth = 1;
        this.circle.strokeColor = 'black';
        this.circle.strokeScaling = false;
        this.group.addChild(this.circle);
        let hLine = new paper.Path();
        hLine.add(new paper.Point(position.x - radius, position.y));
        hLine.add(new paper.Point(position.x + radius, position.y));
        hLine.strokeWidth = 0.5;
        hLine.strokeColor = 'black';
        hLine.strokeScaling = false;
        this.group.addChild(hLine);
        let vLine = new paper.Path();
        vLine.add(new paper.Point(position.x, position.y - radius));
        vLine.add(new paper.Point(position.x, position.y + radius));
        vLine.strokeWidth = 0.5;
        vLine.strokeColor = 'black';
        vLine.strokeScaling = false;
        this.group.addChild(vLine);
        if (layer) {
            layer.addChild(this.group);
        }
    }
}
exports.PaperTarget = PaperTarget;
class PaperSprite extends Shape {
    constructor(canvas) {
        super();
        this.raster = new paper.Raster(canvas);
        this.rectangle = new Rect(0, 0, canvas.width, canvas.height);
    }
    update() {
    }
    getPosition() {
        return this.rectangle.getCenter();
    }
    setPosition(position) {
        this.raster.position = new paper.Point(position.x - this.rectangle.width / 2, position.y - this.rectangle.height / 2);
        this.rectangle.setCenter(position);
    }
    remove() {
        if (this.raster != null) {
            this.raster.remove();
        }
        this.raster = null;
        this.rectangle = null;
    }
    getBounds() {
        return this.rectangle;
    }
}
exports.PaperSprite = PaperSprite;
class PaperShape extends Shape {
    constructor(item) {
        super();
        this.item = item;
    }
    getPosition() {
        return this.item.position;
    }
    setPosition(position) {
        this.item.position = position;
    }
    remove() {
        this.item.remove();
    }
    getBounds() {
        return Rect.fromPaperRect(this.item.bounds);
    }
    getX() {
        return this.item.position.x;
    }
    getY() {
        return this.item.position.y;
    }
    setX(x) {
        this.item.position.x = x;
    }
    setY(y) {
        this.item.position.y = y;
    }
    getWidth() {
        return this.item.bounds.width;
    }
    getHeight() {
        return this.item.bounds.height;
    }
}
exports.PaperShape = PaperShape;
// ------------- //
// --- THREE --- //
// ------------- //
class ThreeRectangle extends Rectangle {
    constructor(x, y, width, height, scene, material = null) {
        super();
        let geometry = new THREE.Geometry();
        let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        this.line = new THREE.Line(geometry, mat);
        geometry.vertices.push(new THREE.Vector3(x, y, 0), new THREE.Vector3(x + width, y, 0), new THREE.Vector3(x + width, y + height, 0), new THREE.Vector3(x, y + height, 0), new THREE.Vector3(x, y, 0));
        this.rectangle = new paper.Rectangle(x, y, width, height);
        scene.add(this.line);
        this.scene = scene;
    }
    update(x, y, width, height) {
        let x2 = x + width;
        let y2 = y + height;
        let geometry = this.line.geometry;
        geometry.vertices[0].x = x;
        geometry.vertices[0].y = y;
        geometry.vertices[1].x = x;
        geometry.vertices[1].y = y2;
        geometry.vertices[2].x = x2;
        geometry.vertices[2].y = y2;
        geometry.vertices[3].x = x2;
        geometry.vertices[3].y = y;
        geometry.vertices[4].x = x;
        geometry.vertices[4].y = y;
        geometry.verticesNeedUpdate = true;
        this.rectangle = new paper.Rectangle(x, y, width, height);
    }
    getPosition() {
        return this.rectangle.point;
    }
    setPosition(position) {
        this.line.position.set(position.x, position.y, 0);
        this.rectangle.point = position;
    }
    remove() {
        this.scene.remove(this.line);
    }
    getBounds() {
        return Rect.fromPaperRect(this.rectangle);
    }
}
exports.ThreeRectangle = ThreeRectangle;
class ThreeCircle extends Circle {
    constructor(x, y, radius, nSegments = 12, scene, material = null) {
        super();
        this.scene = scene;
        this.update(x, y, radius, nSegments, material);
        this.rectangle = new paper.Rectangle(x - radius, y - radius, 2 * radius, 2 * radius);
    }
    update(x, y, radius, nSegments = 12, material = null) {
        this.rectangle = new paper.Rectangle(x - radius, y - radius, 2 * radius, 2 * radius);
        if (material == null && this.line != null) {
            material = this.line.material;
        }
        if (this.line != null) {
            this.scene.remove(this.line);
        }
        let geometry = new THREE.Geometry();
        let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        this.line = new THREE.Line(geometry, mat);
        let angleStep = 2 * Math.PI / nSegments;
        for (let i = 0; i <= nSegments; i++) {
            geometry.vertices.push(new THREE.Vector3(0 + radius * Math.cos(i * angleStep), 0 + radius * Math.sin(i * angleStep)));
        }
        this.line.position.x = x;
        this.line.position.y = y;
        this.scene.add(this.line);
    }
    getPosition() {
        return this.rectangle.center;
    }
    setPosition(position) {
        this.line.position.set(position.x, position.y, 0);
        this.rectangle.center = position;
    }
    remove() {
        this.scene.remove(this.line);
    }
    getBounds() {
        return Rect.fromPaperRect(this.rectangle);
    }
}
exports.ThreeCircle = ThreeCircle;
class ThreeTarget extends Target {
    constructor(x, y, radius, nSegments = 12, scene, material = null) {
        super();
        this.line = null;
        this.hLine = null;
        this.vLine = null;
        this.scene = null;
        this.targetGroup = new THREE.Group();
        this.scene = scene;
        this.update(x, y, radius, nSegments, material);
        this.rectangle = new paper.Rectangle(x - radius, y - radius, 2 * radius, 2 * radius);
    }
    update(x, y, radius, nSegments = 12, material = null) {
        this.rectangle = new paper.Rectangle(x - radius, y - radius, 2 * radius, 2 * radius);
        if (material == null && this.line != null) {
            material = this.line.material;
        }
        if (this.targetGroup != null) {
            this.scene.remove(this.targetGroup);
        }
        let geometry = new THREE.Geometry();
        let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        this.line = new THREE.Line(geometry, mat);
        let angleStep = 2 * Math.PI / nSegments;
        for (let i = 0; i <= nSegments; i++) {
            geometry.vertices.push(new THREE.Vector3(0 + radius * Math.cos(i * angleStep), 0 + radius * Math.sin(i * angleStep)));
        }
        this.targetGroup.add(this.line);
        let hGeometry = new THREE.Geometry();
        this.hLine = new THREE.Line(hGeometry, mat);
        hGeometry.vertices.push(new THREE.Vector3(0 - radius, 0));
        hGeometry.vertices.push(new THREE.Vector3(0 + radius, 0));
        this.targetGroup.add(this.hLine);
        let vGeometry = new THREE.Geometry();
        this.vLine = new THREE.Line(vGeometry, mat);
        vGeometry.vertices.push(new THREE.Vector3(0, 0 - radius));
        vGeometry.vertices.push(new THREE.Vector3(0, 0 + radius));
        this.targetGroup.add(this.vLine);
        this.scene.add(this.targetGroup);
        this.targetGroup.position.set(x, y, 0);
    }
    getPosition() {
        return this.rectangle.center;
    }
    setPosition(position) {
        this.targetGroup.position.set(position.x, position.y, 0);
        this.rectangle.center = position;
    }
    remove() {
        if (this.targetGroup != null) {
            this.scene.remove(this.targetGroup);
        }
        this.targetGroup = null;
        this.line = null;
        this.hLine = null;
        this.vLine = null;
    }
    getBounds() {
        return Rect.fromPaperRect(this.rectangle);
    }
}
exports.ThreeTarget = ThreeTarget;
class ThreeSprite extends Shape {
    constructor(scene, canvas) {
        super();
        this.scene = scene;
        var spriteMap = new THREE.TextureLoader().load(canvas.toDataURL());
        var spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap, color: 0xffffff, rotation: Math.PI });
        this.sprite = new THREE.Sprite(spriteMaterial);
        this.sprite.scale.set(-canvas.width, canvas.height, 1);
        scene.add(this.sprite);
        window.sprite = this.sprite;
        // this.rectangle = new Rect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height)
        this.rectangle = new Rect(0, 0, canvas.width, canvas.height);
    }
    update() {
    }
    getPosition() {
        return this.rectangle.topLeft();
    }
    setPosition(position) {
        this.sprite.position.set(position.x - this.rectangle.width / 2, position.y - this.rectangle.height / 2, 0);
        // this.rectangle.setCenter(position)
        this.rectangle.x = position.x;
        this.rectangle.y = position.y;
    }
    remove() {
        this.scene.remove(this.sprite);
        this.sprite = null;
        this.rectangle = null;
    }
    getBounds() {
        return this.rectangle;
    }
}
exports.ThreeSprite = ThreeSprite;
class ThreeShape extends Shape {
    constructor(item, scene, material = null) {
        super();
        this.item = item;
        this.scene = scene;
        this.update(item, material);
        this.rectangle = Rect.fromPaperRect(item.bounds);
    }
    createMeshLineMeshes(item, material) {
        if (!item.visible) {
            return;
        }
        let matrix = item.globalMatrix;
        if ((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
            let path = item;
            // let geometry = new THREE.Geometry()
            // let line = new THREE.Line(geometry, material)
            let geometry = new THREE.Geometry();
            let line = new MeshLine();
            if (path.segments != null) {
                for (let segment of path.segments) {
                    let point = segment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                }
                if (path.closed) {
                    let point = path.firstSegment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                }
            }
            line.setGeometry(geometry);
            let mesh = new THREE.Mesh(line.geometry, material);
            this.lineGroup.add(mesh);
        }
        if (item.children == null) {
            return;
        }
        for (let child of item.children) {
            this.createMeshLineMeshes(child, material);
        }
    }
    createMeshLineGroup(item, material) {
        if (!item.visible) {
            return;
        }
        let matrix = item.globalMatrix;
        if ((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
            let path = item;
            let geometry = new THREE.Geometry();
            let line = new THREE.Line(geometry, material);
            if (path.segments != null) {
                for (let segment of path.segments) {
                    let point = segment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                }
                if (path.closed) {
                    let point = path.firstSegment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                }
            }
            this.lineGroup.add(line);
        }
        if (item.children == null) {
            return;
        }
        for (let child of item.children) {
            this.createMeshLineGroup(child, material);
        }
    }
    createMeshLineSegments(item, geometry) {
        if (!item.visible) {
            return;
        }
        let matrix = item.globalMatrix;
        if ((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
            let path = item;
            if (path.segments != null) {
                for (let segment of path.segments) {
                    let point = segment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                    if (segment != path.firstSegment && segment != path.lastSegment) {
                        geometry.vertices.push(geometry.vertices[geometry.vertices.length - 1]);
                    }
                }
                if (path.closed) {
                    let lastPoint = path.lastSegment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(lastPoint.x, lastPoint.y));
                    let firstPoint = path.firstSegment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(firstPoint.x, firstPoint.y));
                }
            }
        }
        if (item.children == null) {
            return;
        }
        for (let child of item.children) {
            this.createMeshLineSegments(child, geometry);
        }
    }
    createMesh(item, geometry) {
        if (!item.visible) {
            return;
        }
        let matrix = item.globalMatrix;
        if ((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
            let path = item;
            if (path.segments != null) {
                for (let segment of path.segments) {
                    let point = segment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                }
                if (path.closed) {
                    let point = path.firstSegment.point.transform(matrix);
                    geometry.vertices.push(new THREE.Vector3(point.x, point.y));
                }
            }
        }
        if (item.children == null) {
            return;
        }
        for (let child of item.children) {
            this.createMesh(child, geometry);
        }
    }
    update(item, material = null) {
        this.rectangle = Rect.fromPaperRect(item.bounds);
        // if(this.mesh != null) {
        // 	this.scene.remove(this.mesh)
        // }
        // if(this.lines != null) {
        // 	this.scene.remove(this.lines)
        // }
        // if(this.lineGroup != null) {
        // 	this.scene.remove(this.lineGroup)
        // }
        // this.lineGroup = new THREE.Group()
        // let mat = new MeshLineMaterial( { color: new THREE.Color(0xffffff), resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), sizeAttenuation: true, lineWidth: 0.004, near: 0, far: 500 } )
        let mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        let geometry = new THREE.Geometry();
        this.lines = new THREE.LineSegments(geometry, mat);
        this.createMeshLineSegments(item, geometry);
        this.scene.add(this.lines);
    }
    getPosition() {
        return this.rectangle.getCenter();
    }
    setPosition(position) {
        this.lines.position.set(position.x - this.rectangle.width / 2, position.y - this.rectangle.height / 2, 0);
        this.rectangle.setCenter(position);
    }
    remove() {
        // this.scene.remove(this.lineGroup)
        this.scene.remove(this.lines);
        this.item.remove();
        this.lines = null;
        this.rectangle = null;
    }
    getBounds() {
        return this.rectangle;
    }
    getX() {
        return this.rectangle.x;
    }
    getY() {
        return this.rectangle.y;
    }
    setX(x) {
        this.setPosition(new paper.Point(x, this.getY()));
    }
    setY(y) {
        this.setPosition(new paper.Point(this.getX(), y));
    }
    getWidth() {
        return this.rectangle.width;
    }
    getHeight() {
        return this.rectangle.height;
    }
}
exports.ThreeShape = ThreeShape;


/***/ })
/******/ ]);