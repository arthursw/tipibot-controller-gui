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
    firmware: 'Tipibot',
    forceLinearMoves: true,
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
        showPoints: false,
        flatten: true,
        flattenPrecision: 0.25,
        subdivide: false,
        maxSegmentLength: 10,
        fullSpeed: true,
        maxCurvatureFullspeed: 45,
    },
    feedback: {
        enable: true,
        rate: 10
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
        this.tipibotPositionFolder.addButton('Set position to home', () => this.tipibot.setHome());
        this.tipibotPositionFolder.addButton('Set position with mouse', () => this.tipibot.toggleSetPosition());
        let position = new paper.Point(exports.Settings.tipibot.homeX, exports.Settings.tipibot.homeY);
        this.tipibotPositionFolder.add(position, 'x', 0, exports.Settings.tipibot.width).name('X');
        this.tipibotPositionFolder.add(position, 'y', 0, exports.Settings.tipibot.height).name('Y');
        this.tipibotPositionFolder.open();
        this.homeFolder = settingsFolder.addFolder('Home');
        // this.homeFolder.addButton('Set home', ()=> this.tipibot.setHome())
        this.homeFolder.add({ 'Position': 'Bottom' }, 'Position', ['Custom', 'Top', 'Center', 'Bottom', 'Left', 'Right', 'TopLeft', 'BottomLeft', 'TopRight', 'BottomRight']);
        this.homeFolder.add(exports.Settings.tipibot, 'homeX', 0, exports.Settings.tipibot.width).name('Home X');
        this.homeFolder.add(exports.Settings.tipibot, 'homeY', 0, exports.Settings.tipibot.height).name('Home Y');
        // this.homeFolder.open()
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
        let feedbackFolder = settingsFolder.addFolder('Feedback');
        feedbackFolder.add(exports.Settings.feedback, 'enable').name('Enable feedback');
        feedbackFolder.add(exports.Settings.feedback, 'rate', 1, 100, 1).name('Feedback rate (info/sec.)');
        settingsFolder.add(exports.Settings, 'forceLinearMoves').name('Force linear moves');
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
        if (parentNames[0] == 'Machine dimensions') {
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
            if (name == 'mmPerRev' || 'stepsPerRev' || 'microstepResolution') {
                let maxSpeedMm = exports.Settings.tipibot.maxSpeed * SettingsManager.mmPerSteps();
                let maxSpeedMmController = this.motorsFolder.getController('maxSpeedMm');
                maxSpeedMmController.max(MAX_SPEED * SettingsManager.mmPerSteps());
                maxSpeedMmController.setValueNoCallback(maxSpeedMm);
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
        else if (parentNames[0] == 'Feedback') {
            this.tipibot.feedbackChanged(changeFinished);
        }
        document.dispatchEvent(new CustomEvent('SettingChanged', { detail: { parentNames: parentNames, name: name, value: value, changeFinished: changeFinished } }));
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
        document.dispatchEvent(new CustomEvent('SettingChanged', { detail: { all: true } }));
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
const Polargraph_1 = __webpack_require__(14);
const PenPlotter_1 = __webpack_require__(7);
const TipibotInterpreter_1 = __webpack_require__(15);
// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent
// export const 57600 = 57600
exports.SERIAL_COMMUNICATION_SPEED = 115200;
let PORT = window.localStorage.getItem('port') || 6842;
class Communication {
    constructor(gui) {
        this.autoConnectIntervalID = -1;
        this.serialPortConnectionOpened = false;
        exports.communication = this;
        this.socket = null;
        this.gui = gui;
        this.portController = null;
        this.initializeInterpreter(Settings_1.Settings.firmware);
        this.connectToSerial();
        if (Settings_1.Settings.autoConnect) {
            this.startAutoConnection();
        }
    }
    setTipibot(tipibot) {
        this.interpreter.setTipibot(tipibot);
    }
    startAutoConnection() {
        this.autoConnectIntervalID = setInterval(() => this.tryConnectSerialPort(), 1000);
    }
    stopAutoConnection() {
        clearInterval(this.autoConnectIntervalID);
        this.autoConnectIntervalID = null;
    }
    setPortName(port) {
        this.portController.object[this.portController.property] = port.path;
        this.portController.updateDisplay();
    }
    onSerialPortConnectionOpened(port = null) {
        if (port != null) {
            this.setPortName(port);
        }
        this.serialPortConnectionOpened = true;
        this.stopAutoConnection();
        this.interpreter.serialPortConnectionOpened();
        this.gui.setName('Communication - connected');
    }
    onSerialPortConnectionClosed() {
        this.serialPortConnectionOpened = false;
        if (Settings_1.Settings.autoConnect) {
            this.startAutoConnection();
        }
        // this.interpreter.connectionClosed()	
        this.gui.setName('Communication - disconnectSerialPorted');
    }
    initializePortController(options) {
        this.portController = this.portController.options(options);
        $(this.portController.domElement.parentElement.parentElement).mousedown((event) => {
            this.autoConnectController.setValue(false);
        });
        this.portController.onFinishChange((value) => this.serialConnectionPortChanged(value));
    }
    initializeInterpreter(interpreterName) {
        let tipibot = this.interpreter ? this.interpreter.tipibot : null;
        if (this.serialPortConnectionOpened) {
            this.disconnectSerialPort();
        }
        if (interpreterName == 'Tipibot') {
            this.interpreter = new TipibotInterpreter_1.TipibotInterpreter(this);
        }
        else if (interpreterName == 'Polargraph') {
            this.interpreter = new Polargraph_1.Polargraph(this);
        }
        else if (interpreterName == 'PenPlotter') {
            this.interpreter = new PenPlotter_1.PenPlotter(this);
        }
        this.interpreter.setTipibot(tipibot);
        console.log('initialize ' + interpreterName);
    }
    onMessage(event) {
        let json = JSON.parse(event.data);
        let type = json.type;
        let data = json.data;
        if (type == 'opened') {
            this.onSerialPortConnectionOpened();
        }
        else if (type == 'closed') {
            this.onSerialPortConnectionClosed();
        }
        else if (type == 'list') {
            let options = ['Disconnected'];
            for (let port of data) {
                options.push(port.comName);
            }
            this.initializePortController(options);
            if (Settings_1.Settings.autoConnect) {
                for (let port of data) {
                    if (port.manufacturer != null && port.manufacturer.indexOf('Arduino') >= 0) {
                        this.portController.setValue(port.comName);
                        break;
                    }
                }
            }
        }
        else if (type == 'connected') {
            this.setPortName(data);
        }
        else if (type == 'not-connected') {
        }
        else if (type == 'data') {
            this.interpreter.messageReceived(data);
        }
        else if (type == 'warning') {
        }
        else if (type == 'already-opened') {
            this.onSerialPortConnectionOpened(data);
        }
        else if (type == 'error') {
            console.error(data);
        }
    }
    connectToSerial() {
        let firmwareController = this.gui.add(Settings_1.Settings, 'firmware', ['Tipibot', 'Polargraph', 'PenPlotter']).name('Firmware');
        firmwareController.onFinishChange((value) => {
            Settings_1.settingsManager.save(false);
            this.initializeInterpreter(value);
        });
        this.autoConnectController = this.gui.add(Settings_1.Settings, 'autoConnect').name('Auto connect').onFinishChange((value) => {
            Settings_1.settingsManager.save(false);
            if (value) {
                this.startAutoConnection();
            }
            else {
                this.stopAutoConnection();
            }
        });
        this.portController = this.gui.add({ 'Connection': 'Disconnected' }, 'Connection');
        this.gui.addButton('Disconnect', () => this.disconnectSerialPort());
        this.gui.addButton('Refresh', () => {
            this.send('list');
        });
        this.initializePortController(['Disconnected']);
        this.socket = new WebSocket('ws://localhost:' + PORT);
        this.socket.addEventListener('message', (event) => this.onMessage(event));
        this.socket.addEventListener('open', (event) => this.send('is-connected'));
    }
    disconnectSerialPort() {
        this.interpreter.clearQueue();
        this.interpreter.sendStop(true);
        this.autoConnectController.setValue(false);
        this.onSerialPortConnectionClosed();
        this.send('close');
        document.dispatchEvent(new CustomEvent('Disconnect'));
        this.portController.setValue('Disconnected');
    }
    serialConnectionPortChanged(portName) {
        if (portName == 'Disconnected' && this.serialPortConnectionOpened) {
            this.disconnectSerialPort();
        }
        else if (portName != 'Disconnected') {
            this.interpreter.setSerialPort(portName);
            document.dispatchEvent(new CustomEvent('Connect', { detail: portName }));
            console.log('open: ' + portName + ', at: ' + this.interpreter.serialCommunicationSpeed);
            this.send('open', { name: portName, baudRate: this.interpreter.serialCommunicationSpeed });
        }
    }
    tryConnectSerialPort() {
        if (!Settings_1.Settings.autoConnect || this.serialPortConnectionOpened) {
            return;
        }
        this.send('list');
    }
    send(type, data = null) {
        let message = { type: type, data: data };
        this.socket.send(JSON.stringify(message));
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
const Pen_1 = __webpack_require__(3);
class Tipibot {
    constructor() {
        this.gui = null;
        this.penStateButton = null;
        this.motorsEnableButton = null;
        this.settingPosition = false;
        this.pauseButton = null;
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
        this.pauseButton = gui.add({ 'Pause': false }, 'Pause').onChange((value) => Communication_1.communication.interpreter.setPause(value));
        gui.addButton('Emergency stop', () => Communication_1.communication.interpreter.stop());
        gui.addButton('Clear commands', () => Communication_1.communication.interpreter.clearQueue());
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
            this.penDown(Settings_1.SettingsManager.servoDownAngle(), Settings_1.Settings.servo.delay.down.before, Settings_1.Settings.servo.delay.down.after, callback, true);
        }
        else {
            this.penUp(Settings_1.SettingsManager.servoUpAngle(), Settings_1.Settings.servo.delay.up.before, Settings_1.Settings.servo.delay.up.after, callback, true);
        }
    }
    computeTipibotArea() {
        return new paper.Rectangle(0, 0, Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height);
    }
    computeDrawArea() {
        return new paper.Rectangle(Settings_1.Settings.tipibot.width / 2 - Settings_1.Settings.drawArea.width / 2, Settings_1.Settings.drawArea.y, Settings_1.Settings.drawArea.width, Settings_1.Settings.drawArea.height);
    }
    createTarget(x, y, radius) {
        let group = new paper.Group();
        let position = new paper.Point(x, y);
        let circle = paper.Path.Circle(position, radius);
        circle.strokeWidth = 1;
        group.addChild(circle);
        let hLine = new paper.Path();
        hLine.add(new paper.Point(position.x - radius, position.y));
        hLine.add(new paper.Point(position.x + radius, position.y));
        group.addChild(hLine);
        let vLine = new paper.Path();
        vLine.add(new paper.Point(position.x, position.y - radius));
        vLine.add(new paper.Point(position.x, position.y + radius));
        group.addChild(vLine);
        return group;
    }
    createMoveToButton(position) {
        let size = 25;
        let rectangle = paper.Path.Rectangle(position.subtract(size), position.add(size));
        rectangle.fillColor = 'rgba(0, 0, 0, 0.05)';
        rectangle.onMouseUp = (event) => this.moveToButtonClicked(event, rectangle.position);
        return rectangle;
    }
    initialize(gui) {
        this.tipibotArea = paper.Path.Rectangle(this.computeTipibotArea());
        this.drawArea = paper.Path.Rectangle(this.computeDrawArea());
        this.motorLeft = paper.Path.Circle(new paper.Point(0, 0), 50);
        this.motorRight = paper.Path.Circle(new paper.Point(Settings_1.Settings.tipibot.width, 0), 50);
        this.pen = new Pen_1.Pen(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY, Settings_1.Settings.tipibot.width);
        this.home = this.createTarget(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY, Pen_1.Pen.HOME_RADIUS);
        let homePoint = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        let moveToButtonClicked = this.moveToButtonClicked.bind(this);
        this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.topLeft));
        this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.topRight));
        this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.bottomLeft));
        this.moveToButtons.push(this.createMoveToButton(this.drawArea.bounds.bottomRight));
        this.moveToButtons.push(this.createMoveToButton(homePoint));
        this.pen.group.bringToFront();
        Settings_1.settingsManager.setTipibot(this);
        this.createGUI(gui);
    }
    moveToButtonClicked(event, point) {
        let moveType = Pen_1.Pen.moveTypeFromMouseEvent(event);
        if (moveType == Pen_1.MoveType.Direct) {
            this.moveDirect(point);
        }
        else {
            this.moveLinear(point);
        }
    }
    updateMoveToButtons() {
        let homePoint = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        this.moveToButtons[0].position = this.drawArea.bounds.topLeft;
        this.moveToButtons[1].position = this.drawArea.bounds.topRight;
        this.moveToButtons[2].position = this.drawArea.bounds.bottomLeft;
        this.moveToButtons[3].position = this.drawArea.bounds.bottomRight;
        this.moveToButtons[4].position = homePoint;
    }
    updateTipibotArea() {
        this.tipibotArea.remove();
        this.tipibotArea = paper.Path.Rectangle(this.computeTipibotArea());
    }
    updateDrawArea() {
        this.drawArea.remove();
        this.drawArea = paper.Path.Rectangle(this.computeDrawArea());
    }
    sizeChanged(sendChange) {
        this.motorRight.position.x = Settings_1.Settings.tipibot.width;
        this.updateTipibotArea();
        this.updateDrawArea();
        this.pen.tipibotWidthChanged();
        if (sendChange) {
            Communication_1.communication.interpreter.sendSize();
        }
        this.updateMoveToButtons();
    }
    drawAreaChanged(sendChange) {
        this.updateDrawArea();
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
    sendInvertXY() {
        Communication_1.communication.interpreter.sendInvertXY();
        Communication_1.communication.interpreter.sendSetPosition(this.getPosition());
    }
    sendProgressiveMicrosteps() {
        Communication_1.communication.interpreter.sendProgressiveMicrosteps();
    }
    move(moveType, point, minSpeed = 0, callback = null, movePen = true) {
        this.checkInitialized();
        let moveCallback = movePen ? callback : () => {
            this.pen.setPosition(point, true, false);
            if (callback != null) {
                callback();
            }
        };
        if (moveType == Pen_1.MoveType.Direct) {
            Communication_1.communication.interpreter.sendMoveDirect(point, moveCallback);
        }
        else if (moveType == Pen_1.MoveType.Linear) {
            Communication_1.communication.interpreter.sendMoveLinear(point, minSpeed, moveCallback);
        }
        this.enableMotors(false);
        if (movePen) {
            this.pen.setPosition(point, true, false);
        }
    }
    moveDirect(point, callback = null, movePen = true) {
        this.move(Pen_1.MoveType.Direct, point, 0, callback, movePen);
    }
    moveLinear(point, minSpeed = 0, callback = null, movePen = true) {
        this.move(Pen_1.MoveType.Linear, point, minSpeed, callback, movePen);
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
    feedbackChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendFeedback(Settings_1.Settings.feedback.enable, Settings_1.Settings.feedback.rate);
        }
    }
    penWidthChanged(sendChange) {
        if (sendChange) {
            Communication_1.communication.interpreter.sendPenWidth(Settings_1.Settings.tipibot.penWidth);
        }
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
        this.home.position = homePosition;
        if (setPosition) {
            this.setPosition(homePosition);
        }
        this.updateMoveToButtons();
    }
    goHome(callback = null) {
        let homePoint = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        // let goHomeCallback = ()=> {
        // 	this.pen.setPosition(homePoint, true, false)
        // 	callback()
        // }
        this.penUp(Settings_1.SettingsManager.servoUpAngle(), Settings_1.Settings.servo.delay.up.before, Settings_1.Settings.servo.delay.up.after, null, true);
        // this.penUp(null, null, null, true)
        // The pen will make me (tipibot) move :-)
        // this.pen.setPosition(homePoint, true, true, MoveType.Direct, goHomeCallback)
        this.moveDirect(homePoint, callback, false);
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
    keyUp(event) {
    }
    windowResize() {
        this.motorRight.position.x = Settings_1.Settings.tipibot.width;
        this.updateTipibotArea();
        this.updateDrawArea();
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
const Settings_1 = __webpack_require__(0);
const Tipibot_1 = __webpack_require__(2);
var MoveType;
(function (MoveType) {
    MoveType[MoveType["Direct"] = 0] = "Direct";
    MoveType[MoveType["Linear"] = 1] = "Linear";
})(MoveType = exports.MoveType || (exports.MoveType = {}));
class Pen {
    constructor(x, y, tipibotWidth) {
        this.isPenUp = true;
        this.dragging = false;
        this.initialize(x, y, tipibotWidth);
    }
    static moveTypeFromMouseEvent(event) {
        return Settings_1.Settings.forceLinearMoves || event.altKey ? MoveType.Linear : MoveType.Direct;
    }
    initialize(x, y, tipibotWidth) {
        this.group = new paper.Group();
        this.circle = paper.Path.Circle(new paper.Point(x, y), Pen.RADIUS);
        this.circle.fillColor = Pen.UP_COLOR;
        this.group.addChild(this.circle);
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(new paper.Point(x, y));
        this.lines.add(new paper.Point(tipibotWidth, 0));
        this.group.addChild(this.lines);
        this.previousPosition = new paper.Point(0, 0);
        this.group.onMouseDrag = (event) => this.onMouseDrag(event);
        this.group.onMouseUp = (event) => this.onMouseUp(event);
    }
    onMouseDrag(event) {
        this.setPosition(this.circle.position.add(event.delta), true, false);
        this.dragging = true;
    }
    onMouseUp(event) {
        if (this.dragging) {
            this.setPosition(this.getPosition(), true, true, Pen.moveTypeFromMouseEvent(event));
        }
        this.dragging = false;
    }
    getPosition() {
        return this.circle.position;
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
            else {
                Tipibot_1.tipibot.moveLinear(point, 0, callback);
            }
        }
        this.circle.position = point;
        this.lines.segments[1].point = point;
    }
    tipibotWidthChanged() {
        this.lines.segments[2].point.x = Settings_1.Settings.tipibot.width;
    }
    penUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        let penUpCallback = () => {
            this.isPenUp = true;
            if (callback != null) {
                callback();
            }
        };
        Communication_1.communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, penUpCallback);
        this.circle.fillColor = Pen.UP_COLOR;
        this.isPenUp = true;
    }
    penDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        let penDownCallback = () => {
            this.isPenUp = false;
            if (callback != null) {
                callback();
            }
        };
        Communication_1.communication.interpreter.sendPenDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, penDownCallback);
        this.circle.fillColor = Pen.DOWN_COLOR;
        this.isPenUp = false;
    }
}
Pen.HOME_RADIUS = 10;
Pen.RADIUS = 20;
Pen.UP_COLOR = 'rgba(0, 20, 210, 0.25)';
Pen.DOWN_COLOR = 'rgba(0, 20, 210, 0.75)';
exports.Pen = Pen;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Tipibot_1 = __webpack_require__(2);
const Settings_1 = __webpack_require__(0);
const Communication_1 = __webpack_require__(1);
class SVGPlot {
    constructor(item = null) {
        this.pseudoCurvatureDistance = 10; // in mm
        this.plotting = false;
        if (SVGPlot.svgPlot != null) {
            SVGPlot.svgPlot.clear();
            SVGPlot.svgPlot = null;
        }
        SVGPlot.svgPlot = this;
        this.group = new paper.Group();
        this.group.sendToBack();
        this.item = item;
        this.item.strokeScaling = true;
        // Note in paper.js:
        // When adding a child to a group, the group's position is updated 
        // to the average position of its children
        // and the bounds to fit all children's bounds
        // The children positions are still in global coordinates
        // http://sketch.paperjs.org/#S/hVOxboMwEP2VE0tAQkAGOkTqlKFrpVbKUDo42AErrg/Zph2q/nvPhpBA0lTIkrn37t27O/iONPsQ0SZ6OQpXt1Ea1cj9e57DrhUaGOdSN8CgbqXi4JCujcG+S8G1YriuLHRopZOoQVroO86c4FBpEqEEz2OfwrBGnHl4AOnsoGqEDlymeSDvsdfc+tSDdMCUmmhUaQAD/5W4J2RStsCMAOskpUkNjcI9IwFEQ42QL0qtdLANj6DFFzz5e5z4cMdcO0af6eqDPpTREOIQRKldXKRQJH9C6zNmncGj2KJCQ6pV1PWmU6KKZvBO8lC0HKPThEYfQXddFCmdZPJ+m1YWwVula5oDKpEpbOI5PzkJkPGtn13sq/6Xkud3qo418/yuhH9qaWolLiacbUPkYoJlCmVCJ3QRwOxAqzwNcYWG6UasJvCmo4fTHK6aHbL+a/caHL66BbSwsEBn25w+rzv7LZebmyvQv7k3gh07n2Gjzdv7zy8=
        this.group.addChild(this.item);
        // this.item.position = this.item.position.add(tipibot.drawArea.getBounds().topLeft)
        this.originalItem = null;
        this.filter();
        this.group.onMouseDrag = (event) => this.onMouseDrag(event);
        document.addEventListener('SettingChanged', (event) => this.onSettingChanged(event), false);
    }
    static onImageLoad(event) {
        let svg = paper.project.importSVG(event.target.result);
        let svgPlot = new SVGPlot(svg);
        svgPlot.center();
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
        if (SVGPlot.svgPlot != null) {
            if (!SVGPlot.svgPlot.plotting) {
                SVGPlot.gui.getController('Draw').name('Stop & Clear commands');
                SVGPlot.svgPlot.plot();
            }
            else {
                SVGPlot.gui.getController('Draw').name('Draw');
                Communication_1.communication.interpreter.stop();
                Communication_1.communication.interpreter.clearQueue();
            }
        }
    }
    static createGUI(gui) {
        SVGPlot.gui = gui.addFolder('Plot');
        SVGPlot.gui.open();
        SVGPlot.gui.add(Settings_1.Settings.plot, 'fullSpeed').name('Full speed').onFinishChange((value) => Settings_1.settingsManager.save(false));
        SVGPlot.gui.add(Settings_1.Settings.plot, 'maxCurvatureFullspeed', 0, 180, 1).name('Max curvature').onFinishChange((value) => Settings_1.settingsManager.save(false));
        SVGPlot.gui.addFileSelectorButton('Load SVG', 'image/svg+xml', (event) => SVGPlot.handleFileSelect(event));
        let clearSVGButton = SVGPlot.gui.addButton('Clear SVG', SVGPlot.clearClicked);
        clearSVGButton.hide();
        let drawButton = SVGPlot.gui.addButton('Draw', SVGPlot.drawClicked);
        drawButton.hide();
        let filterFolder = gui.addFolder('Filter');
        filterFolder.add(Settings_1.Settings.plot, 'showPoints').name('Show points').onChange(SVGPlot.createCallback(SVGPlot.prototype.showPoints, true));
        filterFolder.add(Settings_1.Settings.plot, 'flatten').name('Flatten').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'subdivide').name('Subdivide').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        let transformFolder = gui.addFolder('Transform');
        SVGPlot.transformFolder = transformFolder;
        transformFolder.addButton('Center', SVGPlot.createCallback(SVGPlot.prototype.center));
        transformFolder.addSlider('X', 0, 0, Settings_1.Settings.drawArea.width).onChange(SVGPlot.createCallback(SVGPlot.prototype.setX, true));
        transformFolder.addSlider('Y', 0, 0, Settings_1.Settings.drawArea.height).onChange(SVGPlot.createCallback(SVGPlot.prototype.setY, true));
        transformFolder.addButton('Flip X', SVGPlot.createCallback(SVGPlot.prototype.flipX));
        transformFolder.addButton('Flip Y', SVGPlot.createCallback(SVGPlot.prototype.flipY));
        transformFolder.addButton('Rotate', SVGPlot.createCallback(SVGPlot.prototype.rotate));
        transformFolder.addSlider('Scale', 1, 0.1, 5).onChange(SVGPlot.createCallback(SVGPlot.prototype.scale, true));
    }
    static createCallback(f, addValue = false, parameters = []) {
        return (value) => {
            if (SVGPlot.svgPlot != null) {
                if (addValue) {
                    parameters.unshift(value);
                }
                f.apply(SVGPlot.svgPlot, parameters);
            }
        };
    }
    onSettingChanged(event) {
        if (event.detail.all || event.detail.parentNames[0] == 'Pen') {
            if (event.detail.name == 'penWidth') {
                this.updateShape();
            }
        }
    }
    onMouseDrag(event) {
        this.group.position = this.group.position.add(event.delta);
        this.updatePositionGUI();
    }
    updatePositionGUI() {
        SVGPlot.transformFolder.getController('X').setValueNoCallback(this.group.bounds.left - Tipibot_1.tipibot.drawArea.bounds.left);
        SVGPlot.transformFolder.getController('Y').setValueNoCallback(this.group.bounds.top - Tipibot_1.tipibot.drawArea.bounds.top);
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
        this.item = this.originalItem.clone(false);
        this.group.addChild(this.item);
    }
    updateShape() {
        if (this.raster != null) {
            this.raster.remove();
        }
        this.item.strokeWidth = Settings_1.Settings.tipibot.penWidth / this.group.scaling.x;
        this.item.selected = false;
        this.item.visible = true;
        // Remove any invisible child from item: 
        // an invisible shape could be smaller bounds than a path strokeBounds, resulting in item bounds too small
        // item bounds could be equal to shape bounds instead of path stroke bounds
        // this is a paper.js bug
        if (this.item.children != null) {
            for (let child of this.item.children) {
                if (!child.visible || child.fillColor == null && child.strokeColor == null) {
                    child.remove();
                }
            }
        }
        this.item.strokeColor = 'black';
        this.raster = this.item.rasterize(paper.project.view.resolution);
        this.group.addChild(this.raster);
        this.raster.sendToBack();
        this.item.selected = Settings_1.Settings.plot.showPoints;
        this.item.visible = Settings_1.Settings.plot.showPoints;
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
        // Clone item to apply matrix without loosing points, matrix & visibility information
        let clone = this.item.clone();
        clone.applyMatrix = true;
        clone.visible = true;
        this.plotItem(clone); // to be overloaded. The draw button calls plot()
        clone.remove();
        Tipibot_1.tipibot.goHome(() => this.plotFinished(callback));
    }
    stop() {
        Communication_1.communication.interpreter.sendStop();
    }
    showPoints(show) {
        this.item.selected = show;
        this.item.visible = show;
    }
    rotate() {
        this.group.rotate(90);
        this.updateShape();
        this.updatePositionGUI();
    }
    scale(value) {
        this.group.applyMatrix = false;
        this.group.scaling = new paper.Point(Math.sign(this.group.scaling.x) * value, Math.sign(this.group.scaling.y) * value);
        this.updateShape();
        this.updatePositionGUI();
    }
    center() {
        this.group.position = Tipibot_1.tipibot.drawArea.bounds.center;
        this.updatePositionGUI();
    }
    flipX() {
        this.group.scale(-1, 1);
        this.updateShape();
    }
    flipY() {
        this.group.scale(1, -1);
        this.updateShape();
    }
    setX(x) {
        this.group.position.x = Tipibot_1.tipibot.drawArea.bounds.left + x + this.group.bounds.width / 2;
    }
    setY(y) {
        this.group.position.y = Tipibot_1.tipibot.drawArea.bounds.top + y + this.group.bounds.height / 2;
    }
    getAngle(segment) {
        let pointToPrevious = segment.previous.point.subtract(segment.point);
        let pointToNext = segment.next.point.subtract(segment.point);
        let angle = pointToPrevious.getDirectedAngle(pointToNext);
        return 180 - Math.abs(angle);
    }
    getPseudoCurvature(segment) {
        if (segment.previous == null || segment.point == null || segment.next == null) {
            return 180;
        }
        // no need to transform points to compute angle
        let angle = this.getAngle(segment);
        let currentSegment = segment.previous;
        let distance = currentSegment.curve.length;
        while (currentSegment != null && distance < this.pseudoCurvatureDistance / 2) {
            angle += this.getAngle(currentSegment);
            currentSegment = currentSegment.previous;
            distance += currentSegment.curve.length;
        }
        distance = segment.curve.length;
        currentSegment = segment.next;
        while (currentSegment.next != null && distance < this.pseudoCurvatureDistance / 2) {
            angle += this.getAngle(currentSegment);
            currentSegment = currentSegment.next;
            distance += currentSegment.curve.length;
        }
        return angle;
    }
    // mustMoveFullSpeed(segment: paper.Segment) {
    // 	return this.getPseudoCurvature(segment) < Settings.plot.maxCurvatureFullspeed
    // }
    // computeFullSpeed(path: paper.Path, fullSpeedPoints: Set<paper.Point>) {
    // 	let maxBrakingDistanceSteps = Settings.tipibot.maxSpeed * Settings.tipibot.maxSpeed / (2.0 * Settings.tipibot.acceleration)
    // 	let maxBrakingDistanceMm = maxBrakingDistanceSteps * SettingsManager.mmPerSteps()
    // 	let currentSegment = path.lastSegment.previous
    // 	let distanceToBrake = maxBrakingDistanceMm
    // 	let distance = 0
    // 	// go from last segment to first segment
    // 	// compute the distance to brake after which all points will be full speed
    // 	// if the current segment is before distance to brake: just compute distance to brake
    // 	// if the current segment is after distance to brake: 
    // 	//    if the distance fall on the current curve: divide it
    // 	//    in any case: set point to full speed
    // 	// to recompute distance to brake:
    // 	// maxBrakingDistanceMm = maxSpeed * maxSpeed / (2 * acceleration)
    // 	// the new distance to brake is the maximum between the current distance to break and the distance to break for the current point
    // 	// the distance to break for the current point is maxBrakingDistanceMm * ratio
    // 	// where ratio is 1 when the pseudo curvature is Settings.plot.maxCurvatureFullspeed and 0 when it is 0
    // 	// => the more pseudo curvature, the longer the distance is
    // 	while(currentSegment != null) {
    // 		let curveLength = currentSegment.curve.length
    // 		distance += curveLength
    // 		if(distance > distanceToBrake) {
    // 			if(distance - distanceToBrake < curveLength) {
    // 				let curveLocation =  1 - (curveLength / (distance - distanceToBrake))
    // 				currentSegment.curve.divideAt(curveLocation)
    // 				let circle = paper.Path.Circle(currentSegment.curve.point2, 2)
    // 				circle.fillColor = 'blue'
    // 				fullSpeedPoints.add(currentSegment.curve.point2)
    // 			}
    // 			// let circle = paper.Path.Circle(currentSegment.point, 2)
    // 			// circle.fillColor = 'blue'
    // 		}
    // 		let pseudoCurvature = this.getPseudoCurvature(currentSegment)
    // 		let ratio = Math.min(pseudoCurvature / Settings.plot.maxCurvatureFullspeed, 1)
    // 		console.log(distance, distanceToBrake, maxBrakingDistanceMm, ratio)
    // 		distanceToBrake = Math.max(distanceToBrake, distance + ratio * maxBrakingDistanceMm)
    // 		currentSegment = currentSegment.previous
    // 	}
    // }
    computeSpeeds(path) {
        let maxSpeed = Settings_1.Settings.tipibot.maxSpeed;
        let acceleration = Settings_1.Settings.tipibot.acceleration;
        let mmPerSteps = Settings_1.SettingsManager.mmPerSteps();
        let brakingDistanceSteps = maxSpeed * maxSpeed / (2.0 * acceleration);
        let brakingDistanceMm = brakingDistanceSteps * mmPerSteps;
        let reversedSpeeds = [];
        let currentSegment = path.lastSegment;
        let previousMinSpeed = null;
        let distanceToLastMinSpeed = 0;
        while (currentSegment != null) {
            let pseudoCurvature = this.getPseudoCurvature(currentSegment);
            let speedRatio = 1 - Math.min(pseudoCurvature / Settings_1.Settings.plot.maxCurvatureFullspeed, 1);
            let minSpeed = speedRatio * Settings_1.Settings.tipibot.maxSpeed;
            let recomputeBrakingDistance = true;
            if (distanceToLastMinSpeed < brakingDistanceMm && previousMinSpeed != null) {
                let ratio = distanceToLastMinSpeed / brakingDistanceMm;
                let resultingSpeed = previousMinSpeed + (maxSpeed - previousMinSpeed) * ratio;
                if (resultingSpeed < minSpeed) {
                    minSpeed = resultingSpeed;
                    recomputeBrakingDistance = false;
                }
            }
            reversedSpeeds.push(minSpeed);
            if (recomputeBrakingDistance) {
                previousMinSpeed = minSpeed;
                distanceToLastMinSpeed = 0;
                brakingDistanceSteps = ((maxSpeed - minSpeed) / acceleration) * ((minSpeed + maxSpeed) / 2);
                brakingDistanceMm = brakingDistanceSteps * mmPerSteps;
            }
            currentSegment = currentSegment.previous;
            distanceToLastMinSpeed += currentSegment != null ? currentSegment.curve.length : 0;
        }
        let speeds = [];
        for (let i = reversedSpeeds.length - 1; i >= 0; i--) {
            speeds.push(reversedSpeeds[i]);
        }
        return speeds;
    }
    moveTipibotLinear(segment, speeds) {
        let point = segment.point;
        let minSpeed = 0;
        if (Settings_1.Settings.plot.fullSpeed) {
            minSpeed = speeds[segment.index];
            // let speedRatio = minSpeed / Settings.tipibot.maxSpeed
            // let circle = paper.Path.Circle(point, 4)
            // circle.fillColor = <any> { hue: speedRatio * 240, saturation: 1, brightness: 1 }
        }
        Tipibot_1.tipibot.moveLinear(point, minSpeed, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
    }
    plotItem(item) {
        if (!item.visible) {
            return;
        }
        // let matrix = item.globalMatrix
        if ((item.className == 'Path' || item.className == 'CompoundPath') && item.strokeWidth > 0) {
            let path = item;
            if (path.segments != null) {
                let speeds = Settings_1.Settings.plot.fullSpeed ? this.computeSpeeds(path) : null;
                for (let segment of path.segments) {
                    // let point = segment.point.transform(matrix)
                    let point = segment.point;
                    if (segment == path.firstSegment) {
                        if (!Tipibot_1.tipibot.getPosition().equals(point)) {
                            Tipibot_1.tipibot.penUp();
                            if (Settings_1.Settings.forceLinearMoves) {
                                Tipibot_1.tipibot.moveLinear(point, 0, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                            }
                            else {
                                Tipibot_1.tipibot.moveDirect(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                            }
                        }
                        Tipibot_1.tipibot.penDown();
                    }
                    else {
                        this.moveTipibotLinear(segment, speeds);
                    }
                }
                if (path.closed) {
                    // let point = path.firstSegment.point.transform(matrix)
                    this.moveTipibotLinear(path.firstSegment, speeds);
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
        this.plotting = false;
        if (callback != null) {
            callback();
        }
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
        if (this.raster != null) {
            this.raster.remove();
        }
        this.raster = null;
        if (this.item != null) {
            this.item.remove();
        }
        this.item = null;
        if (this.originalItem != null) {
            this.originalItem.remove();
        }
        this.originalItem = null;
        if (this.group != null) {
            this.group.remove();
        }
        this.group = null;
    }
}
SVGPlot.svgPlot = null;
SVGPlot.gui = null;
SVGPlot.transformFolder = null;
exports.SVGPlot = SVGPlot;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Pen_1 = __webpack_require__(3);
const Tipibot_1 = __webpack_require__(2);
exports.visualFeedback = null;
class VisualFeedback {
    constructor() {
        this.drawing = false;
        this.positionPrefix = '-p: l: ';
        this.subTargetPrefix = '-st: l: ';
        this.paths = new paper.Group();
        this.subTargets = new paper.Group();
        this.group = new paper.Group();
        this.group.addChild(this.paths);
        this.group.addChild(this.subTargets);
        let positon = Tipibot_1.tipibot.getPosition();
        this.circle = paper.Path.Circle(positon, Pen_1.Pen.HOME_RADIUS);
        this.circle.fillColor = 'yellow';
        this.circle.strokeColor = 'black';
        this.circle.strokeWidth = 1;
        this.group.addChild(this.circle);
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(positon);
        this.lines.add(new paper.Point(Settings_1.Settings.tipibot.width, 0));
        this.lines.strokeWidth = 0.5;
        this.lines.strokeColor = 'rgba(0, 0, 0, 0.5)';
        this.lines.dashArray = [2, 2];
        this.lines.strokeScaling = false;
        this.group.addChild(this.lines);
        document.addEventListener('MessageReceived', (event) => this.onMessageReceived(event.detail), false);
        document.addEventListener('SettingChanged', (event) => this.onSettingChanged(event), false);
        this.group.sendToBack();
    }
    static initialize() {
        exports.visualFeedback = new VisualFeedback();
    }
    clear() {
        this.paths.removeChildren();
        this.subTargets.removeChildren();
    }
    setVisible(visible) {
        this.group.visible = visible;
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
                path.strokeScaling = true;
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
            path.strokeScaling = true;
            this.subTargets.addChild(path);
            let size = 2;
            path.add(point.add(size));
            path.add(point.add(-size));
            path.add(point);
            path.add(point.add(new paper.Point(size, -size)));
            path.add(point.add(new paper.Point(-size, size)));
        }
    }
    onSettingChanged(event) {
        if (event.detail.all || event.detail.parentNames[0] == 'Machine dimensions') {
            if (event.detail.name == 'width') {
                this.lines.segments[2].point.x = Settings_1.Settings.tipibot.width;
            }
        }
        if (event.detail.all || event.detail.parentNames[0] == 'Feedback') {
            this.setVisible(Settings_1.Settings.feedback.enable);
        }
    }
}
exports.VisualFeedback = VisualFeedback;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const MAX_INPUT_BUFFER_LENGTH = 500;
class Interpreter {
    constructor(communication) {
        this.commandID = 0;
        this.continueMessage = 'READY';
        this.serialCommunicationSpeed = 115200;
        this.commandQueue = [];
        this.pause = false;
        this.serialInput = '';
        this.tempoNextCommand = false;
        this.communication = communication;
    }
    setSerialPort(serialPort) {
        this.serialPort = serialPort;
    }
    setTipibot(tipibot) {
        this.tipibot = tipibot;
    }
    serialPortConnectionOpened() {
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
        this.sendServoSpeed();
        this.sendFeedback();
        this.tipibot.initializedCommunication = true;
    }
    send(command) {
        if (this.pause) {
            return;
        }
        document.dispatchEvent(new CustomEvent('SendCommand', { detail: command }));
        console.log('send: ' + command.message + ' - ' + command.data);
        this.communication.send('data', command.data);
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
        if (message.indexOf('-p: l: ') != 0) {
            console.log(message);
        }
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
    stop() {
        if (!this.pause) {
            this.setPause(true);
        }
        this.sendStop(true);
    }
    setPause(pause) {
        this.pause = pause;
        this.tipibot.pauseButton.setValueNoCallback(this.pause);
        if (!this.pause && this.commandQueue.length > 0) {
            this.send(this.commandQueue[0]);
        }
    }
    queue(data, message, callback = null) {
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
    sendSetPosition(point = this.tipibot.getPosition()) {
    }
    sendMoveDirect(point, callback = null) {
    }
    sendMoveLinear(point, minSpeed = 0, callback = null) {
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
    sendStop(force = true) {
    }
    sendPenLiftRange(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoUpValue = Settings_1.SettingsManager.servoUpAngle()) {
    }
    sendPenDelays(servoDownDelay = Settings_1.Settings.servo.delay.down.before, servoUpDelay = Settings_1.Settings.servo.delay.up.before) {
    }
    sendFeedback(enable = Settings_1.Settings.feedback.enable, rate = Settings_1.Settings.feedback.rate) {
    }
}
exports.Interpreter = Interpreter;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Interpreter_1 = __webpack_require__(6);
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
    sendMoveLinear(point, minSpeed = 0, callback = null) {
        super.sendMoveLinear(point, minSpeed, callback);
        let lengths = this.tipibot.cartesianToLengths(point);
        let lengthsSteps = Settings_1.SettingsManager.mmToSteps(lengths);
        let message = 'Move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ', min speed: ' + minSpeed.toFixed(2);
        // console.log('move linear: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ' - l: ' + Math.round(lengthsSteps.x) + ', r: ' + Math.round(lengthsSteps.y))
        this.queue('G1 X' + point.x.toFixed(2) + ' Y' + point.y.toFixed(2) + ' P' + minSpeed.toFixed(2) + '\n', message, callback);
    }
    sendMaxSpeed(speed = Settings_1.Settings.tipibot.maxSpeed) {
        // console.log('set speed: ' + speed)
        let message = 'Set max speed: ' + speed.toFixed(2);
        this.queue('G0 F' + speed.toFixed(2) + '\n', message);
    }
    sendAcceleration(acceleration = Settings_1.Settings.tipibot.acceleration) {
        console.log('set acceleration: ' + acceleration);
        let message = 'Set acceleration: ' + acceleration.toFixed(2);
        this.queue('G0 S' + acceleration.toFixed(2) + '\n', message);
    }
    sendMaxSpeedAndAcceleration(speed = Settings_1.Settings.tipibot.maxSpeed, acceleration = Settings_1.Settings.tipibot.acceleration) {
        console.log('set speed: ' + speed);
        console.log('set acceleration: ' + acceleration);
        let message = 'Set speed: ' + acceleration.toFixed(2) + ', set acceleration: ' + acceleration.toFixed(2);
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
        if (delayBefore > 0) {
            this.sendPause(delayBefore);
        }
        this.queue('M340 P3 S' + servoValue + '\n', message);
        if (delayAfter > 0) {
            this.sendPause(delayAfter, callback);
        }
        // this.queue('G4 P' + delayAfter + '\n', callback)
    }
    sendPenUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), delayBefore = Settings_1.Settings.servo.delay.up.before, delayAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        this.sendPenState(servoUpValue, delayBefore, delayAfter, callback);
    }
    sendPenDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), delayBefore = Settings_1.Settings.servo.delay.down.before, delayAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        this.sendPenState(servoDownValue, delayBefore, delayAfter, callback);
    }
    sendStop(force = true) {
        if (force) {
            this.communication.send('data', 'M0\n');
            return;
        }
        let message = 'Stop';
        this.queue('M0\n', message);
    }
}
exports.PenPlotter = PenPlotter;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Communication_1 = __webpack_require__(1);
class CommandDisplay {
    constructor() {
        // $('#commands-content').click((event)=> this.click(event))
        document.addEventListener('QueueCommand', (event) => this.queueCommand(event.detail), false);
        document.addEventListener('SendCommand', (event) => this.sendCommand(event.detail), false);
        document.addEventListener('CommandExecuted', (event) => this.commandExecuted(event.detail), false);
        document.addEventListener('ClearQueue', (event) => this.clearQueue(), false);
    }
    createGUI(gui) {
        // let folderName = 'Command list'
        // this.gui = gui.addFolder(folderName)
        // this.listJ = $('<ul id="command-list">')
        // this.gui.open()
        // this.listJ.insertAfter($(this.gui.gui.domElement).find('li'))
        this.listJ = $('#command-list');
    }
    click(event) {
        if (event.target.tagName == 'BUTTON') {
            let commandID = parseInt(event.target.parentNode.id);
            Communication_1.communication.interpreter.removeCommand(commandID);
            this.removeCommand(commandID);
        }
    }
    createCommandItem(command) {
        let liJ = $('<li id="' + command.id + '"">');
        let messageJ = $('<div>').append(command.message).addClass('message');
        let dataJ = $('<div>').append(command.data).addClass('data');
        liJ.append(messageJ);
        liJ.append(dataJ);
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
        $('#commands h3').text('Command list (' + this.listJ.children().length + ')');
    }
    queueCommand(command) {
        this.listJ.append(this.createCommandItem(command));
        this.updateName();
        document.dispatchEvent(new CustomEvent('AddedCommand'));
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
class Console {
    constructor() {
        document.addEventListener('AddedCommand', (event) => this.scrollToBottom(), false);
        this.log = console.log.bind(console);
        this.error = console.error.bind(console);
        this.info = console.info.bind(console);
        this.table = console.table.bind(console);
        let log = (args, logger, type) => {
            if (typeof logger === 'function') {
                logger.apply(console, args);
            }
            let div = $('<li>');
            for (let arg of args) {
                let p = null;
                if (typeof arg == 'object') {
                    p = this.logTable(arg);
                }
                else if (arg instanceof Array) {
                    let result = JSON.stringify(arg);
                    if (result.length > 100) {
                        result = result.substr(0, 20) + '...' + result.substr(result.length - 20);
                    }
                    p = $('<p>').append(result).addClass(type);
                }
                else {
                    p = $('<p>').append(arg).addClass(type);
                }
                div.append(p);
            }
            let consoleJ = $('#console ul');
            consoleJ.append(div);
            this.scrollToBottom(consoleJ);
        };
        console.log = (...args) => {
            log(args, this.log, 'log');
        };
        console.error = (...args) => log(args, this.error, 'error');
        console.info = (...args) => log(args, this.info, 'info');
        console.table = (...args) => log(args, this.table, 'table');
    }
    scrollToBottom(consoleJ = $('#console ul')) {
        consoleJ.scrollTop(consoleJ.get(0).scrollHeight);
    }
    printTable(objArr, keys) {
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
            let $tdata = document.createElement('td');
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
    logTable(...args) {
        var objArr = args[0];
        var keys;
        if (typeof objArr[0] !== 'undefined') {
            keys = Object.keys(objArr[0]);
        }
        return this.printTable(objArr, keys);
    }
    ;
}
exports.Console = Console;


/***/ }),
/* 10 */
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
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Plot_1 = __webpack_require__(4);
const Communication_1 = __webpack_require__(1);
const Tipibot_1 = __webpack_require__(2);
const VisualFeedback_1 = __webpack_require__(5);
const RequestTimeout = 2000;
let scale = 1000;
let CommeUnDesseinSize = new paper.Size(4000, 3000);
let commeUnDesseinToDrawArea = function (point) {
    let drawArea = Tipibot_1.tipibot.drawArea.bounds;
    let CommeUnDesseinPosition = new paper.Point(-CommeUnDesseinSize.width / 2, -CommeUnDesseinSize.height / 2);
    const CommeUnDesseinDrawArea = new paper.Rectangle(CommeUnDesseinPosition, CommeUnDesseinSize);
    return point.subtract(CommeUnDesseinDrawArea.topLeft).divide(CommeUnDesseinDrawArea.size).multiply(drawArea.size).add(drawArea.topLeft);
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
const ModeKey = 'Mode';
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
        this.mode = localStorage.getItem(ModeKey) || 'CommeUnDessein';
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
        commeUnDesseinGUI.add(this, 'mode').onFinishChange((value) => localStorage.setItem(ModeKey, value));
        commeUnDesseinGUI.add(this, 'secret').onFinishChange((value) => localStorage.setItem(CommeUnDesseinSecretKey, value));
        CommeUnDesseinSize.width = parseInt(window.localStorage.getItem('commeUnDesseinWidth')) || Tipibot_1.tipibot.drawArea.bounds.width;
        CommeUnDesseinSize.height = parseInt(window.localStorage.getItem('commeUnDesseinHeight')) || Tipibot_1.tipibot.drawArea.bounds.height;
        commeUnDesseinGUI.add(CommeUnDesseinSize, 'width', 0, 5000, 1).name('Width').onFinishChange((value) => {
            window.localStorage.setItem('commeUnDesseinWidth', value);
        });
        commeUnDesseinGUI.add(CommeUnDesseinSize, 'height', 0, 5000, 1).name('Height').onFinishChange((value) => {
            window.localStorage.setItem('commeUnDesseinHeight', value);
        });
        commeUnDesseinGUI.addButton('Start', () => this.requestNextDrawing());
        commeUnDesseinGUI.addButton('Stop & Clear', () => this.stopAndClear());
        commeUnDesseinGUI.open();
    }
    stopAndClear() {
        if (Plot_1.SVGPlot.svgPlot != null) {
            Plot_1.SVGPlot.svgPlot.clear();
        }
        Communication_1.communication.interpreter.stop();
        Communication_1.communication.interpreter.clearQueue();
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
            if (item.visible == false) {
                console.error('When receiving next validated drawing: while importing SVG: the imported item is not visible: ignore.');
                return;
            }
            for (let path of item.children) {
                if (path.className != 'Path') {
                    continue;
                }
                // Ignore anything that humans can't see to avoid hacks
                let strokeColor = path.strokeColor;
                if (path.strokeWidth <= 0.2 || path.strokeColor == 'white' || path.strokeColor == null || path.opacity <= 0.1 || strokeColor.alpha <= 0.2 || !path.visible) {
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
            item.remove();
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
        if (VisualFeedback_1.visualFeedback.paths.children.length > 0) {
            VisualFeedback_1.visualFeedback.paths.removeChildren();
        }
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
            console.log(results);
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
/* 12 */
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
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
class Renderer {
    constructor() {
        this.canvas = document.createElement('canvas');
        let containerJ = $('#canvas');
        this.canvas.width = containerJ.width();
        this.canvas.height = containerJ.height();
        containerJ.get(0).appendChild(this.canvas);
        paper.setup(this.canvas);
        paper.project.currentStyle.strokeColor = 'black';
        paper.project.currentStyle.strokeWidth = 0.5;
        paper.project.currentStyle.strokeScaling = false;
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
        document.addEventListener('SettingChanged', (event) => this.onSettingChanged(event), false);
    }
    onSettingChanged(event) {
        if (event.detail.all || event.detail.parentNames[0] == 'Machine dimensions') {
            this.centerOnTipibot(Settings_1.Settings.tipibot, true);
        }
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
    windowResize() {
        let containerJ = $('#canvas');
        let width = containerJ.width();
        let height = containerJ.height();
        let canvasJ = $(this.canvas);
        canvasJ.width(width);
        canvasJ.height(height);
        paper.view.viewSize = new paper.Size(width, height);
    }
    getMousePosition(event) {
        return new paper.Point(event.clientX, event.clientY);
    }
    getWorldPosition(event) {
        return paper.view.viewToProject(this.getMousePosition(event));
    }
    mouseDown(event) {
        this.dragging = true;
        this.previousPosition = this.getMousePosition(event);
    }
    mouseMove(event) {
        if (event.buttons == 4 || this.spacePressed && this.dragging) {
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
        let cursorPosition = this.getWorldPosition(event);
        paper.view.zoom = Math.max(0.1, Math.min(5, paper.view.zoom + event.deltaY / 500));
        let newCursorPosition = this.getWorldPosition(event);
        paper.view.translate(newCursorPosition.subtract(cursorPosition));
    }
    keyDown(event) {
        switch (event.keyCode) {
            case 32:
                this.spacePressed = true;
                $('#canvas').addClass('grab');
        }
    }
    keyUp(event) {
        switch (event.keyCode) {
            case 32:
                this.spacePressed = false;
                $('#canvas').removeClass('grab');
        }
    }
    render() {
    }
}
exports.Renderer = Renderer;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Interpreter_1 = __webpack_require__(6);
const commands = {
    CMD_CHANGELENGTH: "C01,",
    CMD_CHANGEPENWIDTH: "C02,",
    CMD_CHANGEMOTORSPEED: "C03,",
    CMD_CHANGEMOTORACCEL: "C04,",
    CMD_DRAWPIXEL: "C05,",
    CMD_DRAWSCRIBBLEPIXEL: "C06,",
    CMD_DRAWRECT: "C07,",
    CMD_CHANGEDRAWINGDIRECTION: "C08,",
    CMD_SETPOSITION: "C09,",
    CMD_TESTPATTERN: "C10,",
    CMD_TESTPENWIDTHSQUARE: "C11,",
    CMD_TESTPENWIDTHSCRIBBLE: "C12,",
    CMD_PENDOWN: "C13,",
    CMD_PENUP: "C14,",
    CMD_DRAWSAWPIXEL: "C15,",
    CMD_DRAWROUNDPIXEL: "C16,",
    CMD_CHANGELENGTHDIRECT: "C17,",
    CMD_TXIMAGEBLOCK: "C18,",
    CMD_STARTROVE: "C19,",
    CMD_STOPROVE: "C20,",
    CMD_SET_ROVE_AREA: "C21,",
    CMD_LOADMAGEFILE: "C23,",
    CMD_CHANGEMACHINESIZE: "C24,",
    CMD_CHANGEMACHINENAME: "C25,",
    CMD_REQUESTMACHINESIZE: "C26,",
    CMD_RESETMACHINE: "C27,",
    CMD_DRAWDIRECTIONTEST: "C28,",
    CMD_CHANGEMACHINEMMPERREV: "C29,",
    CMD_CHANGEMACHINESTEPSPERREV: "C30,",
    CMD_SETMOTORSPEED: "C31,",
    CMD_SETMOTORACCEL: "C32,",
    CMD_MACHINE_MODE_STORE_COMMANDS: "C33,",
    CMD_MACHINE_MODE_EXEC_FROM_STORE: "C34,",
    CMD_MACHINE_MODE_LIVE: "C35,",
    CMD_RANDOM_DRAW: "C36,",
    CMD_SETMACHINESTEPMULTIPLIER: "C37,",
    CMD_START_TEXT: "C38,",
    CMD_DRAW_SPRITE: "C39,",
    CMD_CHANGELENGTH_RELATIVE: "C40,",
    CMD_SWIRLING: "C41,",
    CMD_DRAW_RANDOM_SPRITE: "C42,",
    CMD_DRAW_NORWEGIAN: "C43,",
    CMD_DRAW_NORWEGIAN_OUTLINE: "C44,",
    CMD_SETPENLIFTRANGE: "C45,",
    CMD_SELECT_ROVE_SOURCE_IMAGE: "C46",
    CMD_RENDER_ROVE: "C47",
    CMD_ACTIVATE_MACHINE_BUTTON: "C49",
    CMD_DEACTIVATE_MACHINE_BUTTON: "C50",
    CMD_DELAY: "C60,"
};
class Polargraph extends Interpreter_1.Interpreter {
    constructor(communication) {
        super(communication);
        this.keepTipibotAwakeInterval = null;
        this.serialCommunicationSpeed = 57600;
    }
    // startKeepingTipibotAwake() {
    // 	this.keepTipibotAwakeInterval = setTimeout(()=> this.keepTipibotAwake(), 30000)
    // }
    // keepTipibotAwake() {
    // 	this.sendPenUp()
    // }
    initialize(initializeAtHome = true) {
        super.initialize(initializeAtHome);
        this.sendPenDown();
        this.sendPenUp();
    }
    send(command) {
        // let commandCode = command.data.substr(0, 3)
        // for(let commandName in commands) {
        // 	let code: string = (<any>commands)[commandName].substr(0, 3)
        // 	if(code == commandCode) {
        // 		console.log("Send command: " + commandName)
        // 	}
        // }
        command.data += String.fromCharCode(10);
        // command.data += '\n'
        super.send(command);
    }
    queue(data, message, callback = null) {
        // clearTimeout(this.keepTipibotAwakeInterval)
        // this.keepTipibotAwakeInterval = null
        let commandCode = data.substr(0, 3);
        for (let commandName in commands) {
            let code = commands[commandName].substr(0, 3);
            // if(code == commandCode) {
            // 	console.log("Queue command: " + commandName)
            // }
        }
        super.queue(data, message, callback);
    }
    queueEmpty() {
        // this.startKeepingTipibotAwake()
    }
    messageReceived(message) {
        // super.messageReceived(message + '\n')
        super.messageReceived(message);
    }
    getMaxSegmentLength() {
        return 2;
    }
    sendMoveToNativePosition(direct, p, callback = null) {
        p = this.tipibot.cartesianToLengths(p);
        p = Settings_1.SettingsManager.mmToSteps(p).divide(Settings_1.Settings.tipibot.microstepResolution);
        let command = null;
        if (direct) {
            command = commands.CMD_CHANGELENGTHDIRECT + Math.round(p.x) + "," + Math.round(p.y) + "," + this.getMaxSegmentLength() + ',END';
        }
        else {
            command = commands.CMD_CHANGELENGTH + Math.round(p.x) + "," + Math.round(p.y) + ',END';
        }
        let message =  true ? 'direct' : 'linear' + ': ' + p.x.toFixed(2) + ', ' + p.y.toFixed(2);
        this.queue(command, message, callback);
    }
    sendSetPosition(point = this.tipibot.getPosition()) {
        point = this.tipibot.cartesianToLengths(point);
        let pointInSteps = Settings_1.SettingsManager.mmToSteps(point).divide(Settings_1.Settings.tipibot.microstepResolution);
        let command = commands.CMD_SETPOSITION + Math.round(pointInSteps.x) + "," + Math.round(pointInSteps.y) + ',END';
        let message = 'Set position: ' + point.x.toFixed(2) + ', ' + point.y.toFixed(2);
        this.queue(command, message);
    }
    sendMoveDirect(point, callback = null) {
        this.sendMoveToNativePosition(true, point, callback);
    }
    sendMoveLinear(point, minSpeed = 0, callback = null) {
        // Just like in Polagraph controller:
        // this.sendMoveToNativePosition(false, point, callback);
        this.sendMoveToNativePosition(true, point, callback);
    }
    sendMaxSpeed(speed = Settings_1.Settings.tipibot.maxSpeed, acceleration = Settings_1.Settings.tipibot.acceleration) {
        let message = 'Set max speed: ' + speed.toFixed(2);
        this.queue(commands.CMD_SETMOTORSPEED + speed.toFixed(2) + ',1,END', message);
        message = 'Set acceleration: ' + acceleration.toFixed(2);
        this.queue(commands.CMD_SETMOTORACCEL + acceleration.toFixed(2) + ',1,END', message);
    }
    sendSize(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height) {
        let message = 'Set size: ' + tipibotWidth.toFixed(2) + ',' + tipibotHeight.toFixed(2);
        this.queue(commands.CMD_CHANGEMACHINESIZE + tipibotWidth + ',' + tipibotHeight + ',END', message);
    }
    sendStepsPerRev(stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev) {
        let message = 'Set steps per rev: ' + stepsPerRev;
        this.queue(commands.CMD_CHANGEMACHINESTEPSPERREV + stepsPerRev + ',END', message);
    }
    sendMmPerRev(mmPerRev = Settings_1.Settings.tipibot.mmPerRev) {
        let message = 'Set mm per rev: ' + mmPerRev;
        this.queue(commands.CMD_CHANGEMACHINEMMPERREV + mmPerRev + ',END', message);
    }
    sendStepMultiplier(microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
        let message = 'Set microstepResolution: ' + microstepResolution;
        this.queue(commands.CMD_SETMACHINESTEPMULTIPLIER + microstepResolution + ',END', message);
    }
    sendSpecs(tipibotWidth = Settings_1.Settings.tipibot.width, tipibotHeight = Settings_1.Settings.tipibot.height, stepsPerRev = Settings_1.Settings.tipibot.stepsPerRev, mmPerRev = Settings_1.Settings.tipibot.mmPerRev, microstepResolution = Settings_1.Settings.tipibot.microstepResolution) {
        this.sendSize(tipibotWidth, tipibotHeight);
        this.sendMmPerRev(mmPerRev);
        this.sendStepsPerRev(stepsPerRev);
        this.sendStepMultiplier(microstepResolution);
    }
    sendPause(delay, callback = null) {
        // Todo: floor delay
        let message = 'Wait: ' + delay;
        this.queue(commands.CMD_DELAY + delay + ",END", message, callback);
    }
    sendMotorOff() {
    }
    sendPenLiftRange(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoUpValue = Settings_1.SettingsManager.servoUpAngle()) {
        let message = 'Set pen lift range: ' + servoDownValue + ',' + servoUpValue;
        this.queue(commands.CMD_SETPENLIFTRANGE + servoDownValue + ',' + servoUpValue + ',1,END', message);
    }
    sendPenDelays(servoDownDelay = Settings_1.Settings.servo.delay.down.before, servoUpDelay = Settings_1.Settings.servo.delay.up.before) {
    }
    sendPenUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        if (servoUpTempoBefore > 0) {
            this.sendPause(servoUpTempoBefore);
        }
        let message = 'Set pen up: ' + Settings_1.SettingsManager.servoUpAngle();
        this.queue(commands.CMD_PENUP + Settings_1.SettingsManager.servoUpAngle() + ",END", message);
        // this.queue(commands.CMD_PENUP + "END", callback);
        if (servoUpTempoAfter > 0) {
            this.sendPause(servoUpTempoAfter, callback);
        }
    }
    sendPenDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        if (servoDownTempoBefore > 0) {
            this.sendPause(servoDownTempoBefore);
        }
        let message = 'Set pen down: ' + Settings_1.SettingsManager.servoDownAngle();
        this.queue(commands.CMD_PENDOWN + Settings_1.SettingsManager.servoDownAngle() + ",END", message);
        // this.queue(commands.CMD_PENDOWN + "END", callback);
        if (servoDownTempoAfter > 0) {
            this.sendPause(servoDownTempoAfter, callback);
        }
    }
    sendStop() {
    }
    sendPenWidth(penWidth) {
        let message = 'Set pen width: ' + penWidth.toFixed(2);
        this.queue(commands.CMD_CHANGEPENWIDTH + penWidth.toFixed(2) + ',END', message);
    }
}
exports.Polargraph = Polargraph;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const PenPlotter_1 = __webpack_require__(7);
class TipibotInterpreter extends PenPlotter_1.PenPlotter {
    constructor() {
        super(...arguments);
        this.continueMessage = 'READY';
        this.initializationMessage = 'Initialize';
    }
    serialPortConnectionOpened() {
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
    sendFeedback(enable = Settings_1.Settings.feedback.enable, rate = Settings_1.Settings.feedback.rate) {
        if (!enable) {
            rate = 0;
        }
        let message = 'Set feedback: ' + enable + ', rate: ' + rate.toFixed(2);
        this.queue('M15 F' + rate.toFixed(2) + '\n', message);
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
// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"
const Settings_1 = __webpack_require__(0);
const Tipibot_1 = __webpack_require__(2);
const Renderer_1 = __webpack_require__(13);
const Pen_1 = __webpack_require__(3);
const Plot_1 = __webpack_require__(4);
const Communication_1 = __webpack_require__(1);
const CommandDisplay_1 = __webpack_require__(8);
const GUI_1 = __webpack_require__(10);
const Console_1 = __webpack_require__(9);
const VisualFeedback_1 = __webpack_require__(5);
const CommeUnDessein_1 = __webpack_require__(11);
const Telescreen_1 = __webpack_require__(12);
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
        let console = new Console_1.Console();
        let customContainer = document.getElementById('gui');
        customContainer.appendChild(gui.getDomElement());
        let communicationFolder = gui.addFolder('Communication');
        communication = new Communication_1.Communication(communicationFolder);
        let commandFolder = gui.addFolder('Commands');
        commandFolder.open();
        Settings_1.settingsManager.createGUI(gui);
        Plot_1.SVGPlot.createGUI(gui);
        renderer = new Renderer_1.Renderer();
        communication.setTipibot(Tipibot_1.tipibot);
        Tipibot_1.tipibot.initialize(commandFolder);
        renderer.centerOnTipibot(Settings_1.Settings.tipibot);
        let commandDisplay = new CommandDisplay_1.CommandDisplay();
        commandDisplay.createGUI(gui);
        VisualFeedback_1.VisualFeedback.initialize();
        w.addPlugin('CommeUnDessein');
        // debug
        w.tipibot = Tipibot_1.tipibot;
        w.settingsManager = Settings_1.settingsManager;
        w.gui = gui;
        w.renderer = renderer;
        w.communication = communication;
        w.commandDisplay = commandDisplay;
        w.visualFeedback = VisualFeedback_1.visualFeedback;
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
        renderer.mouseDown(event);
    }
    function mouseMove(event) {
        renderer.mouseMove(event);
        if (Tipibot_1.tipibot.settingPosition) {
            let position = renderer.getWorldPosition(event);
            if (positionPreview == null) {
                positionPreview = paper.Path.Circle(position, Pen_1.Pen.HOME_RADIUS);
            }
            positionPreview.position = position;
            Tipibot_1.tipibot.setPositionSliders(position);
        }
    }
    function mouseUp(event) {
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
        renderer.mouseLeave(event);
    }
    function mouseWheel(event) {
        renderer.mouseWheel(event);
    }
    function keyDown(event) {
        Tipibot_1.tipibot.keyDown(event);
        renderer.keyDown(event);
    }
    function keyUp(event) {
        Tipibot_1.tipibot.keyUp(event);
        renderer.keyUp(event);
    }
    window.addEventListener('resize', windowResize, false);
    document.body.addEventListener('mousedown', mouseDown);
    document.body.addEventListener('mousemove', mouseMove);
    document.body.addEventListener('mouseup', mouseUp);
    document.body.addEventListener('mouseleave', mouseLeave);
    document.body.addEventListener('keydown', keyDown);
    document.body.addEventListener('keyup', keyUp);
    addWheelListener(document.body, mouseWheel);
});


/***/ })
/******/ ]);