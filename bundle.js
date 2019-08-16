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
/******/ 	return __webpack_require__(__webpack_require__.s = 20);
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
    forceInitialization: true,
    // disableMouseInteractions: false,
    disableCommandList: false,
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
        penWidth: 2,
        penOffset: 0
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
        optimizeTrajectories: true,
        flatten: true,
        flattenPrecision: 0.25,
        subdivide: false,
        maxSegmentLength: 10,
        fullSpeed: true,
        maxCurvatureFullspeed: 45
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
        this.settingsFolder = null;
        this.motorsFolder = null;
        this.homeFolder = null;
        this.debug = false;
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
        this.settingsFolder = settingsFolder;
        settingsFolder.open();
        let loadSaveFolder = settingsFolder.addFolder('Load & Save');
        loadSaveFolder.addFileSelectorButton('Load', 'application/json', false, (event) => this.handleFileSelect(event));
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
        penFolder.add(exports.Settings.tipibot, 'penOffset', -200, 200, 1).name('Pen offset');
        penFolder.add(exports.Settings.servo, 'speed', 1, 360, 1).name('Servo speed deg/sec.');
        let anglesFolder = penFolder.addFolder('Angles');
        anglesFolder.add(exports.Settings.servo.position, 'invert').name('Invert');
        anglesFolder.add(exports.Settings.servo.position, 'up', 0, 3180).name('Up');
        anglesFolder.add(exports.Settings.servo.position, 'down', 0, 3180).name('Down');
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
        this.motorsFolder.add(exports.Settings.tipibot, 'microstepResolution', 1, 256, 1).name('Step multiplier');
        this.motorsFolder.add(exports.Settings.tipibot, 'mmPerRev', 1, 250, 1).name('Mm per rev.');
        this.motorsFolder.add(exports.Settings.tipibot, 'progressiveMicrosteps').name('Progressive Microsteps');
        let feedbackFolder = settingsFolder.addFolder('Feedback');
        feedbackFolder.add(exports.Settings.feedback, 'enable').name('Enable feedback');
        feedbackFolder.add(exports.Settings.feedback, 'rate', 1, 100, 1).name('Feedback rate (info/sec.)');
        feedbackFolder.addButton('Clear feedback', () => document.dispatchEvent(new CustomEvent('ClearFeedback')));
        settingsFolder.add(exports.Settings, 'forceLinearMoves').name('Force linear moves');
        settingsFolder.add(exports.Settings, 'forceInitialization').name('Force initialization');
        // settingsFolder.add(Settings, 'disableMouseInteractions').name('Disable mouse interactions')
        settingsFolder.add(exports.Settings, 'disableCommandList').name('Disable command list');
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
        if (exports.settingsManager.debug) {
            debugger;
        }
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
                this.tipibot.servoChanged(changeFinished, name == 'up' ? true : name == 'down' ? false : null, false);
            }
        }
        else if (parentNames[0] == 'Pen') {
            if (name == 'penWidth') {
                if (changeFinished) {
                    this.tipibot.penWidthChanged(true);
                }
            }
            else if (name == 'speed') {
                this.tipibot.servoChanged(changeFinished, null, true);
            }
            else if (name == 'penOffset') {
                this.tipibot.setPosition(this.tipibot.getPosition(), changeFinished, false);
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
        this.tipibot.servoChanged(true, null, true);
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
const Polargraph_1 = __webpack_require__(18);
const PenPlotter_1 = __webpack_require__(6);
const TipibotInterpreter_1 = __webpack_require__(19);
const FredBot_1 = __webpack_require__(17);
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
        this.createGUI(gui);
        this.portController = null;
        this.initializeInterpreter(Settings_1.Settings.firmware);
        this.connectToSerial();
    }
    createGUI(gui) {
        this.gui = gui.addFolder('Communication');
        this.folderTitle = $(this.gui.getDomElement()).find('.title');
        this.folderTitle.append($('<icon>').addClass('serial').append(String.fromCharCode(9679)));
        this.folderTitle.append($('<icon>').addClass('websocket').append(String.fromCharCode(9679)));
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
        this.folderTitle.find('.serial').addClass('connected');
    }
    onSerialPortConnectionClosed() {
        this.serialPortConnectionOpened = false;
        if (Settings_1.Settings.autoConnect) {
            this.startAutoConnection();
        }
        // this.interpreter.connectionClosed()
        this.folderTitle.find('.serial').removeClass('connected');
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
        else if (interpreterName == 'FredBot') {
            this.interpreter = new FredBot_1.FredBot(this);
        }
        this.interpreter.setTipibot(tipibot);
        console.log('initialize ' + interpreterName);
    }
    onMessage(event) {
        let json = JSON.parse(event.data);
        let type = json.type;
        let data = json.data;
        document.dispatchEvent(new CustomEvent('ServerMessage', { detail: json }));
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
            this.folderTitle.find('.serial').removeClass('connected').removeClass('simulator');
            if (Settings_1.Settings.autoConnect) {
                this.startAutoConnection();
            }
        }
        else if (type == 'connected-to-simulator') {
            this.folderTitle.find('.serial').removeClass('connected').addClass('simulator');
        }
        else if (type == 'data') {
            this.interpreter.messageReceived(data);
        }
        else if (type == 'info') {
            console.info(data);
        }
        else if (type == 'warning') {
            console.warn(data);
        }
        else if (type == 'already-opened') {
            this.onSerialPortConnectionOpened(data);
        }
        else if (type == 'error') {
            console.error(data);
        }
    }
    connectToSerial() {
        let firmwareController = this.gui.add(Settings_1.Settings, 'firmware', ['Tipibot', 'Polargraph', 'PenPlotter', 'FredBot']).name('Firmware');
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
        this.socket.addEventListener('open', (event) => this.onWebSocketOpen(event));
        this.socket.addEventListener('close', (event) => this.onWebSocketClose(event));
        this.socket.addEventListener('error', (event) => this.onWebSocketError(event));
    }
    onWebSocketOpen(event) {
        this.folderTitle.find('.websocket').addClass('connected');
        this.send('is-connected');
    }
    onWebSocketClose(event) {
        this.folderTitle.find('.websocket').removeClass('connected');
        console.error('WebSocket disconnected');
    }
    onWebSocketError(event) {
        console.error('WebSocket error');
        // console.error(event)
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
        console.log('Send ', type, data);
        console.log('Wait for "ready"...');
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
const Pen_1 = __webpack_require__(4);
class Tipibot {
    constructor() {
        this.penStateButton = null;
        this.motorsEnableButton = null;
        this.settingPosition = false;
        this.initialPosition = null;
        this.initializedCommunication = false;
        this.motorsEnabled = true;
        this.ignoreKeyEvents = false;
        this.moveToButtons = [];
        document.addEventListener('ZoomChanged', (event) => this.onZoomChanged(), false);
        this.lastSentPosition = new paper.Point(0, 0);
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
        if (this.pen.isUp) {
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
        let size = 6;
        let rectangle = paper.Path.Rectangle(position.subtract(size), position.add(size));
        rectangle.fillColor = 'rgba(0, 0, 0, 0.05)';
        rectangle.onMouseUp = (event) => this.moveToButtonClicked(event, rectangle.position);
        return rectangle;
    }
    initialize() {
        this.tipibotArea = paper.Path.Rectangle(this.computeTipibotArea());
        this.drawArea = paper.Path.Rectangle(this.computeDrawArea());
        this.motorLeft = paper.Path.Circle(new paper.Point(0, 0), 50);
        this.motorRight = paper.Path.Circle(new paper.Point(Settings_1.Settings.tipibot.width, 0), 50);
        this.pen = new Pen_1.Pen(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY, Settings_1.Settings.tipibot.penOffset, Settings_1.Settings.tipibot.width);
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
    onZoomChanged() {
        let scaling = new paper.Point(1 / paper.view.zoom, 1 / paper.view.zoom);
        for (let moveToButtons of this.moveToButtons) {
            moveToButtons.applyMatrix = false;
            moveToButtons.scaling = scaling;
        }
        this.pen.circle.applyMatrix = false;
        this.pen.circle.scaling = scaling;
        this.home.applyMatrix = false;
        this.home.scaling = scaling;
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
    getGondolaPosition() {
        let position = this.getPosition();
        position.y -= Settings_1.Settings.tipibot.penOffset;
        return position;
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
        if (Settings_1.Settings.forceInitialization && !this.initializedCommunication) {
            Communication_1.communication.interpreter.initialize();
        }
    }
    sendGondolaPosition() {
        Communication_1.communication.interpreter.sendSetPosition(this.getGondolaPosition());
    }
    setPosition(point, sendChange = true, updateSliders = false) {
        this.pen.setPosition(point, updateSliders, false);
        if (sendChange) {
            this.lastSentPosition = point;
            this.checkInitialized();
            this.sendGondolaPosition();
        }
    }
    sendInvertXY() {
        Communication_1.communication.interpreter.sendInvertXY();
        this.sendGondolaPosition();
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
        this.lastSentPosition = point;
        let target = new paper.Point(point.x, point.y - Settings_1.Settings.tipibot.penOffset);
        if (moveType == Pen_1.MoveType.Direct && !Settings_1.Settings.forceLinearMoves) {
            Communication_1.communication.interpreter.sendMoveDirect(target, moveCallback);
        }
        else {
            Communication_1.communication.interpreter.sendMoveLinear(target, minSpeed, moveCallback);
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
    servoChanged(sendChange, up, specs) {
        if (sendChange) {
            if (specs) {
                Communication_1.communication.interpreter.sendPenLiftRange();
                Communication_1.communication.interpreter.sendPenDelays();
                Communication_1.communication.interpreter.sendServoSpeed();
            }
            if (up != null) {
                if (up) {
                    Communication_1.communication.interpreter.sendPenUp();
                }
                else {
                    Communication_1.communication.interpreter.sendPenDown();
                }
            }
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
    executeOnceFinished(callback) {
        Communication_1.communication.interpreter.executeOnceFinished(callback);
    }
    penUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null, force = false) {
        if (!this.pen.isUp || force) {
            this.pen.penUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, callback);
            this.penStateButton.setName('Pen down');
        }
    }
    penDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null, force = false) {
        if (this.pen.isUp || force) {
            this.pen.penDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, callback);
            this.penStateButton.setName('Pen up');
        }
    }
    setHome(setPosition = true, updateSliders = true) {
        let homePosition = new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY);
        this.home.position = homePosition;
        if (setPosition) {
            this.setPosition(homePosition, updateSliders);
        }
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
        if (this.ignoreKeyEvents) {
            return;
        }
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
    static startLoadingAnimation(callback = null) {
        $('#loading').removeClass('hidden');
        clearTimeout(GUI.loadingTimeoutID);
        GUI.loadingTimeoutID = setTimeout(() => {
            $('#loading').addClass('loading');
            if (callback != null) {
                setTimeout(() => {
                    // TODO: catch error if any to remove loading animation (comment next line and uncomment following lines)
                    callback();
                    // try {
                    // 	callback()
                    // } catch(e) {
                    // 	this.stopLoadingAnimation()
                    // 	console.error(e.message)
                    // 	throw e
                    // }
                }, 400);
            }
        }, 100);
    }
    static stopLoadingAnimation() {
        $('#loading').removeClass('loading');
        clearTimeout(GUI.loadingTimeoutID);
        GUI.loadingTimeoutID = setTimeout(() => $('#loading').addClass('hidden'), 1000);
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
    addFileSelectorButton(name, fileType, multiple = true, callback) {
        let divJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='" + fileType + "' " + (multiple ? "multiple" : "") + "/>");
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
GUI.loadingTimeoutID = null;
exports.GUI = GUI;


/***/ }),
/* 4 */
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
    constructor(x, y, offset, tipibotWidth) {
        this.isUp = true;
        this.dragging = false;
        this.initialize(x, y, offset, tipibotWidth);
    }
    static moveTypeFromMouseEvent(event) {
        return event.altKey ? MoveType.Linear : MoveType.Direct;
    }
    initialize(x, y, offset, tipibotWidth) {
        this.group = new paper.Group();
        let penPosition = new paper.Point(x, y);
        let gondolaPosition = new paper.Point(x, y - offset);
        this.circle = paper.Path.Circle(penPosition, Pen.RADIUS);
        this.circle.fillColor = Pen.UP_COLOR;
        this.group.addChild(this.circle);
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(gondolaPosition);
        this.lines.add(new paper.Point(tipibotWidth, 0));
        this.group.addChild(this.lines);
        this.offsetLine = new paper.Path();
        this.offsetLine.add(gondolaPosition);
        this.offsetLine.add(penPosition);
        this.group.addChild(this.offsetLine);
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
        return this.circle.position.clone();
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
        let center = new paper.Point(point.x, point.y - Settings_1.Settings.tipibot.penOffset);
        this.circle.position = point;
        this.lines.segments[1].point = center;
        this.offsetLine.segments[0].point = center;
        this.offsetLine.segments[1].point = point;
    }
    tipibotWidthChanged() {
        this.lines.segments[2].point.x = Settings_1.Settings.tipibot.width;
    }
    penUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        let penUpCallback = () => {
            this.isUp = true;
            if (callback != null) {
                callback();
            }
        };
        Communication_1.communication.interpreter.sendPenUp(servoUpValue, servoUpTempoBefore, servoUpTempoAfter, penUpCallback);
        this.circle.fillColor = Pen.UP_COLOR;
        this.isUp = true;
    }
    penDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        let penDownCallback = () => {
            this.isUp = false;
            if (callback != null) {
                callback();
            }
        };
        Communication_1.communication.interpreter.sendPenDown(servoDownValue, servoDownTempoBefore, servoDownTempoAfter, penDownCallback);
        this.circle.fillColor = Pen.DOWN_COLOR;
        this.isUp = false;
    }
}
Pen.HOME_RADIUS = 6;
Pen.RADIUS = 6;
Pen.UP_COLOR = 'rgba(0, 20, 210, 0.25)';
Pen.DOWN_COLOR = 'rgba(0, 20, 210, 0.8)';
exports.Pen = Pen;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Tipibot_1 = __webpack_require__(2);
const Settings_1 = __webpack_require__(0);
const Communication_1 = __webpack_require__(1);
const GUI_1 = __webpack_require__(3);
class SVGPlot {
    constructor(item = null) {
        this.pseudoCurvatureDistance = 10; // in mm
        this.nSegments = 0;
        this.currentPath = null;
        this.plotting = false;
        if (SVGPlot.svgPlot != null) {
            SVGPlot.svgPlot.destroy();
            SVGPlot.svgPlot = null;
        }
        SVGPlot.svgPlot = this;
        this.group = new paper.Group();
        this.group.sendToBack();
        if (SVGPlot.currentMatrix != null) {
            this.group.applyMatrix = false;
            this.group.matrix = SVGPlot.currentMatrix;
        }
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
        console.log("Collapsing SVG...");
        SVGPlot.collapse(this.item, this.group, this.item.strokeBounds);
        this.setBackground();
        console.log("SVG collapsed.");
        this.filter();
        this.group.onMouseDrag = (event) => this.onMouseDrag(event);
        document.addEventListener('SettingChanged', (event) => this.onSettingChanged(event), false);
    }
    static loadImage(event, callback = null) {
        let svg = paper.project.importSVG(event.target.result);
        let svgPlot = new SVGPlot(svg);
        svgPlot.center();
        SVGPlot.gui.getController('Draw').show();
        console.log('SVG imported.');
        GUI_1.GUI.stopLoadingAnimation();
        if (callback != null) {
            callback();
        }
    }
    static onImageLoad(event, callback = null) {
        console.log('Importing SVG...');
        GUI_1.GUI.startLoadingAnimation(() => SVGPlot.loadImage(event, callback));
    }
    static handleFileSelect(event) {
        this.gui.getController('Load SVG').hide();
        this.gui.getController('Clear SVG').show();
        let files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        this.files = [];
        for (let i = 0; i < files.length; i++) {
            let file = files[i] != null ? files[i] : files.item(i);
            let imageType = /^image\//;
            if (!imageType.test(file.type)) {
                continue;
            }
            this.files.push(file);
        }
        this.multipleFiles = this.files.length > 1;
        this.fileIndex = 0;
        if (this.files.length < files.length) {
            console.info('Warning: some of the selected files are not SVG images, there will not be imported.');
        }
        if (this.multipleFiles) {
            console.info('Only the first file will be imported for now, the other files will be imported one by one while drawing.');
        }
        this.loadNextFile();
    }
    static loadNextFile(callback = null) {
        if (this.fileIndex >= this.files.length) {
            return;
        }
        let file = this.files[this.fileIndex];
        let reader = new FileReader();
        reader.onload = (event) => this.onImageLoad(event, callback);
        reader.readAsText(file);
    }
    static plotFinished(callback = null) {
        if (this.multipleFiles) {
            this.fileIndex++;
            if (this.fileIndex < this.files.length) {
                this.loadNextFile(() => this.plotAndLoadLoop(callback));
            }
            else {
                Tipibot_1.tipibot.goHome();
                if (callback != null) {
                    callback();
                }
            }
        }
    }
    static plotAndLoadLoop(callback = null) {
        if (this.svgPlot == null) {
            return;
        }
        this.svgPlot.plot(() => SVGPlot.plotFinished(callback), !this.multipleFiles);
    }
    static clearClicked(event) {
        this.fileIndex = 0;
        Communication_1.communication.interpreter.clearQueue();
        SVGPlot.gui.getController('Load SVG').show();
        SVGPlot.gui.getController('Clear SVG').hide();
        SVGPlot.svgPlot.destroy();
        SVGPlot.svgPlot = null;
        SVGPlot.gui.getController('Draw').name('Draw');
        SVGPlot.gui.getController('Draw').hide();
    }
    static drawClicked(event) {
        if (SVGPlot.svgPlot != null) {
            if (!SVGPlot.svgPlot.plotting) {
                SVGPlot.gui.getController('Draw').name('Stop, clear commands & go home');
                SVGPlot.plotAndLoadLoop();
            }
            else {
                SVGPlot.gui.getController('Draw').name('Draw');
                Communication_1.communication.interpreter.sendStop(true);
                Communication_1.communication.interpreter.clearQueue();
                SVGPlot.svgPlot.plotting = false;
                Tipibot_1.tipibot.goHome();
            }
        }
    }
    static createGUI(gui) {
        SVGPlot.gui = gui.addFolder('Plot');
        SVGPlot.gui.open();
        SVGPlot.gui.add(Settings_1.Settings.plot, 'fullSpeed').name('Full speed').onFinishChange((value) => Settings_1.settingsManager.save(false));
        SVGPlot.gui.add(Settings_1.Settings.plot, 'optimizeTrajectories').name('Optimize Trajectories').onFinishChange((event) => Settings_1.settingsManager.save(false));
        SVGPlot.gui.add(Settings_1.Settings.plot, 'maxCurvatureFullspeed', 0, 180, 1).name('Max curvature').onFinishChange((value) => Settings_1.settingsManager.save(false));
        SVGPlot.gui.addFileSelectorButton('Load SVG', 'image/svg+xml', true, (event) => SVGPlot.handleFileSelect(event));
        let clearSVGButton = SVGPlot.gui.addButton('Clear SVG', SVGPlot.clearClicked);
        clearSVGButton.hide();
        let drawButton = SVGPlot.gui.addButton('Draw', SVGPlot.drawClicked);
        drawButton.hide();
        let filterFolder = SVGPlot.gui.addFolder('Filter');
        filterFolder.add(Settings_1.Settings.plot, 'showPoints').name('Show points').onChange(SVGPlot.createCallback(SVGPlot.prototype.showPoints, true));
        filterFolder.add(Settings_1.Settings.plot, 'flatten').name('Flatten').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'flattenPrecision', 0, 10).name('Flatten precision').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'subdivide').name('Subdivide').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        filterFolder.add(Settings_1.Settings.plot, 'maxSegmentLength', 0, 100).name('Max segment length').onChange(SVGPlot.createCallback(SVGPlot.prototype.filter));
        let transformFolder = SVGPlot.gui.addFolder('Transform');
        SVGPlot.transformFolder = transformFolder;
        transformFolder.addButton('Center', SVGPlot.createCallback(SVGPlot.prototype.center));
        transformFolder.addSlider('X', 0, 0, Settings_1.Settings.drawArea.width).onChange(SVGPlot.createCallback(SVGPlot.prototype.setX, true));
        transformFolder.addSlider('Y', 0, 0, Settings_1.Settings.drawArea.height).onChange(SVGPlot.createCallback(SVGPlot.prototype.setY, true));
        transformFolder.addButton('Flip horizontally', SVGPlot.createCallback(SVGPlot.prototype.flipX));
        transformFolder.addButton('Flip vertically', SVGPlot.createCallback(SVGPlot.prototype.flipY));
        transformFolder.addButton('Rotate', SVGPlot.createCallback(SVGPlot.prototype.rotate));
        transformFolder.addSlider('Scale', 1, 0.1, 5).onChange(SVGPlot.createCallback(SVGPlot.prototype.scale, true));
    }
    static createCallback(f, addValue = false, parameters = []) {
        return (value) => {
            Settings_1.settingsManager.save(false);
            if (SVGPlot.svgPlot != null) {
                if (addValue) {
                    parameters.unshift(value);
                }
                f.apply(SVGPlot.svgPlot, parameters);
            }
        };
    }
    static itemMustBeDrawn(item) {
        return (item.strokeWidth > 0 && item.strokeColor != null) || item.fillColor != null;
    }
    static convertShapeToPath(shape) {
        if (shape.className != 'Shape' || !this.itemMustBeDrawn(shape)) {
            return shape;
        }
        let path = shape.toPath(true);
        shape.parent.addChildren(shape.children);
        shape.remove();
        return path;
    }
    // public static collapseItem(item: paper.Item, parent: paper.Item) {
    // 	item.applyMatrix = true
    // 	item = this.convertShapeToPath(<paper.Shape>item)
    // 	if(item.children != null) {
    // 		while(item.children.length > 0) {
    // 			let child = item.firstChild
    // 			child.applyMatrix = true
    // 			if(!this.itemMustBeDrawn(child)) {
    // 				child.strokeWidth = item.strokeWidth
    // 				child.strokeColor = item.strokeColor
    // 				child.fillColor = item.fillColor
    // 			}
    // 			if(child.strokeWidth > 0 && child.strokeColor == null) {
    // 				child.strokeColor == 'black'
    // 			}
    // 			child.remove()
    // 			if(this.itemMustBeDrawn(child)) {
    // 				parent.addChild(child)
    // 				this.collapseItem(child, parent)
    // 			}
    // 		}
    // 	}
    // 	if(item.className != 'Path') {
    // 		item.remove()
    // 	}
    // }
    static checkBackground(item, parent, group = null, parentStrokeBounds = null) {
        let isPathOrShape = item.className == 'Shape' || item.className == 'Path';
        let hasChildren = item.children != null && item.children.length > 0;
        let isAsBigAsParent = item.strokeBounds.contains(parentStrokeBounds);
        let hasFourSegments = item.segments != null && item.segments.length == 4;
        if (isPathOrShape && hasFourSegments && item.closed && isAsBigAsParent && !hasChildren) {
            // We found the background: add it as a sibling of parent, it will be used to correctly position the svg
            item.remove();
            group.addChild(item);
            item.sendToBack();
            item.name = 'background';
            item.strokeColor = null;
            item.strokeWidth = 0;
            return true;
        }
        return false;
    }
    static collapseItem(item, parent, group = null, parentStrokeBounds = null) {
        item.applyMatrix = true;
        if (group != null && this.checkBackground(item, parent, group, parentStrokeBounds)) {
            return;
        }
        item = this.convertShapeToPath(item);
        if (item.strokeWidth == null || item.strokeWidth <= 0 || Number.isNaN(item.strokeWidth)) {
            item.strokeWidth = Number.isNaN(parent.strokeWidth) ? 1 : parent.strokeWidth;
        }
        if (item.strokeColor == null) {
            item.strokeColor = parent.strokeColor != null ? parent.strokeColor : 'black';
        }
        if ((item.strokeWidth == null || item.strokeWidth <= 0 || item.strokeColor == null) && item.fillColor == null) {
            item.fillColor = parent.fillColor;
        }
        item.remove();
        if (item.className == 'Path' && this.itemMustBeDrawn(item)) {
            parent.addChild(item);
        }
        while (item.children != null && item.children.length > 0) {
            this.collapseItem(item.firstChild, parent, group, parentStrokeBounds);
        }
    }
    static collapse(item, group = null, parentStrokeBounds = null) {
        if (item.children == null || item.children.length == 0) {
            return;
        }
        let children = item.children.slice(); // since we will remove and / or add children in collapse item
        for (let child of children) {
            this.collapseItem(child, item, group, parentStrokeBounds);
        }
    }
    static subdividePath(path, maxSegmentLength) {
        if (path.segments != null) {
            for (let segment of path.segments) {
                let curve = segment.curve;
                do {
                    curve = curve.divideAt(maxSegmentLength);
                } while (curve != null);
            }
        }
    }
    static filter(item) {
        for (let child of item.children) {
            if (child.className != 'Path') {
                continue;
            }
            let path = child;
            if (Settings_1.Settings.plot.flatten) {
                path.flatten(Settings_1.Settings.plot.flattenPrecision);
            }
            if (Settings_1.Settings.plot.subdivide) {
                this.subdividePath(path, Settings_1.Settings.plot.maxSegmentLength);
            }
        }
    }
    static splitLongPaths(item) {
        for (let child of item.children) {
            let path = child;
            if (path.segments.length > SVGPlot.nSegmentsPerBatch) {
                path.splitAt(path.segments[SVGPlot.nSegmentsPerBatch - 1].location);
            }
        }
    }
    setBackground() {
        if (this.group.firstChild.name == 'background') {
            if (this.background != null) {
                this.background.remove();
            }
            this.background = this.group.firstChild;
        }
    }
    countSegments() {
        let nSegments = 0;
        for (let child of this.item.children) {
            let p = child;
            nSegments += p.segments.length;
        }
        return nSegments;
    }
    warnIfTooManyCommands() {
        let nSegments = this.countSegments();
        if (nSegments > SVGPlot.nSegmentsPerBatch) {
            let message = `Warning: there are ${nSegments} segments to draw. 
Optimizing trajectories and computing speeds (in full speed mode) will take some time to compute 
(but it will optimize drawing time), make sure to check your settings before starting drawing.`;
            console.info(message);
        }
    }
    onSettingChanged(event) {
        if (event.detail.all || event.detail.parentNames[0] == 'Pen') {
            if (event.detail.name == 'penWidth' && this.group != null) {
                this.updateShape();
            }
        }
    }
    onMouseDrag(event) {
        if (Tipibot_1.tipibot.pen.dragging || this.checkPlotting()) {
            return;
        }
        this.group.position = this.group.position.add(event.delta);
        this.updatePositionGUI();
    }
    updatePositionGUI() {
        SVGPlot.transformFolder.getController('X').setValueNoCallback(this.group.bounds.left - Tipibot_1.tipibot.drawArea.bounds.left);
        SVGPlot.transformFolder.getController('Y').setValueNoCallback(this.group.bounds.top - Tipibot_1.tipibot.drawArea.bounds.top);
    }
    saveItem() {
        // Fix paper.js bug: Maximum call stack size exceeded when cloning a path with many segments: https://github.com/paperjs/paper.js/issues/1493
        let nSegmentsMax = 100000;
        for (let child of this.item.children) {
            let p = child;
            if (p.segments != null && p.segments.length > nSegmentsMax) {
                p.splitAt(p.segments[nSegmentsMax - 1].location);
            }
        }
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
        for (let child of this.item.children) {
            child.strokeWidth = Settings_1.Settings.tipibot.penWidth / this.group.scaling.x;
        }
        this.item.selected = false;
        this.item.visible = true;
        // this.item.strokeColor = 'black'
        this.raster = this.item.rasterize(paper.project.view.resolution);
        this.group.addChild(this.raster);
        this.raster.sendToBack();
        if (this.background != null) {
            this.background.sendToBack();
        }
        this.item.selected = Settings_1.Settings.plot.showPoints;
        this.item.visible = Settings_1.Settings.plot.showPoints;
    }
    filter() {
        if (this.checkPlotting()) {
            return;
        }
        if (this.originalItem == null && (Settings_1.Settings.plot.subdivide || Settings_1.Settings.plot.flatten)) {
            this.saveItem();
        }
        else if (this.originalItem != null) {
            this.loadItem();
        }
        console.log("Flattening and subdividing paths...");
        SVGPlot.filter(this.item);
        console.log("Paths flattenned and subdivided.");
        console.log("Splitting long paths...");
        SVGPlot.splitLongPaths(this.item);
        console.log("Paths split.");
        console.log("There are " + this.item.children.length + " paths in this SVG.");
        this.warnIfTooManyCommands();
        this.updateShape();
    }
    findClosestPath(path, parent) {
        if (path.className != 'Path' || path.firstSegment == null || path.lastSegment == null) {
            return null;
        }
        let closestPath = null;
        let minDistance = Number.MAX_VALUE;
        let reverse = false;
        let leavePoint = path.closed ? path.firstSegment.point : path.lastSegment.point;
        for (let child of parent.children) {
            let p = child;
            if (p == path || p.segments == null) {
                continue;
            }
            let distance = p.firstSegment.point.getDistance(leavePoint);
            if (distance < minDistance) {
                minDistance = distance;
                closestPath = p;
                reverse = false;
            }
            distance = p.lastSegment.point.getDistance(leavePoint);
            if (distance < minDistance) {
                minDistance = distance;
                closestPath = p;
                reverse = true;
            }
        }
        if (reverse) {
            closestPath.reverse();
        }
        return closestPath;
    }
    optimizeTrajectoriesLoaded(item) {
        let sortedPaths = [];
        let currentChild = item.firstChild;
        let nLogs = 0;
        do {
            currentChild.remove();
            sortedPaths.push(currentChild);
            currentChild = this.findClosestPath(currentChild, item);
            if (nLogs > 100) {
                console.log('Items to process: ' + item.children.length);
                nLogs = 0;
            }
            nLogs++;
        } while (item.children.length > 0 && currentChild != null); // check that currentChild != null since item could 
        // have only empty compound paths
        // (this can happen after collapsing CompoundPaths)
        item.addChildren(sortedPaths);
        // let path = new paper.Path()
        // path.strokeColor = 'purple'
        // path.strokeWidth = 1
        // path.strokeScaling = true
        // for(let child of item.children) {
        // 	let p = <paper.Path>child
        // 	if(p.segments != null) {
        // 		path.addSegments(p.segments)
        // 		if(p.closed) {
        // 			path.add(p.firstSegment)
        // 		}
        // 	}
        // }
        // let c1 = paper.Path.Circle(path.firstSegment.point, 3)
        // c1.fillColor = 'orange'
        // let c2 = paper.Path.Circle(path.lastSegment.point, 3)
        // c2.fillColor = 'turquoise'
        // path.sendToBack()
        GUI_1.GUI.stopLoadingAnimation();
    }
    optimizeTrajectories(item) {
        if (item.children == null || item.children.length == 0) {
            return;
        }
        console.log('Optimizing trajectories...');
        GUI_1.GUI.startLoadingAnimation(() => this.optimizeTrajectoriesLoaded(item));
    }
    plot(callback = null, goHomeOnceFinished = true) {
        this.plotting = true;
        console.log('Generating drawing commands...');
        // Clone item to apply matrix without loosing points, matrix & visibility information
        let clone = this.item.clone();
        clone.applyMatrix = true;
        clone.transform(this.group.matrix);
        clone.visible = true;
        if (Settings_1.Settings.plot.optimizeTrajectories) {
            this.optimizeTrajectories(clone);
        }
        this.currentPath = clone.firstChild;
        this.plotNext(() => {
            if (goHomeOnceFinished) {
                Tipibot_1.tipibot.goHome(() => this.plotFinished(callback));
            }
            else {
                this.plotFinished(callback);
            }
        });
        clone.remove();
    }
    showPoints(show) {
        this.item.selected = show;
        this.item.visible = show;
    }
    storeMatrix() {
        SVGPlot.currentMatrix = this.group.matrix;
    }
    checkPlotting() {
        if (this.plotting) {
            console.error('You cannot apply any filter or transformation while the machine is plotting.');
            return true;
        }
        return false;
    }
    rotate() {
        if (this.checkPlotting()) {
            return;
        }
        this.group.rotate(90);
        this.updateShape();
        this.updatePositionGUI();
        this.storeMatrix();
    }
    scale(value) {
        if (this.checkPlotting()) {
            return;
        }
        this.group.applyMatrix = false;
        this.group.scaling = new paper.Point(Math.sign(this.group.scaling.x) * value, Math.sign(this.group.scaling.y) * value);
        this.updateShape();
        this.updatePositionGUI();
        this.storeMatrix();
    }
    center() {
        if (this.checkPlotting()) {
            return;
        }
        this.group.position = Tipibot_1.tipibot.drawArea.bounds.center;
        this.updatePositionGUI();
        this.storeMatrix();
    }
    flipX() {
        if (this.checkPlotting()) {
            return;
        }
        this.group.scale(-1, 1);
        this.updateShape();
        this.storeMatrix();
    }
    flipY() {
        if (this.checkPlotting()) {
            return;
        }
        this.group.scale(1, -1);
        this.updateShape();
        this.storeMatrix();
    }
    setX(x) {
        if (this.checkPlotting()) {
            return;
        }
        this.group.position.x = Tipibot_1.tipibot.drawArea.bounds.left + x + this.group.bounds.width / 2;
        this.storeMatrix();
    }
    setY(y) {
        if (this.checkPlotting()) {
            return;
        }
        this.group.position.y = Tipibot_1.tipibot.drawArea.bounds.top + y + this.group.bounds.height / 2;
        this.storeMatrix();
    }
    getAngle(segment) {
        if (segment.previous == null || segment.point == null || segment.next == null) {
            return 180;
        }
        let pointToPrevious = segment.previous.point.subtract(segment.point);
        let pointToNext = segment.next.point.subtract(segment.point);
        let angle = pointToPrevious.getDirectedAngle(pointToNext);
        return 180 - Math.abs(angle);
    }
    getPseudoCurvature(segment) {
        if (segment.previous == null || segment.point == null || segment.next == null) {
            return 180;
        }
        let angle = this.getAngle(segment);
        let currentSegment = segment.previous;
        let distance = currentSegment.curve.length;
        while (currentSegment != null && distance < this.pseudoCurvatureDistance / 2) {
            angle += this.getAngle(currentSegment);
            currentSegment = currentSegment.previous;
            distance += currentSegment != null ? currentSegment.curve.length : 0;
        }
        distance = segment.curve.length;
        currentSegment = segment.next;
        while (currentSegment.next != null && distance < this.pseudoCurvatureDistance / 2) {
            angle += this.getAngle(currentSegment);
            currentSegment = currentSegment.next;
            distance += currentSegment != null ? currentSegment.curve.length : 0;
        }
        return Math.max(angle, 180);
    }
    computeSpeeds(path) {
        if (Settings_1.Settings.plot.maxCurvatureFullspeed >= 180) {
            return new Array(path.segments.length).fill(Settings_1.Settings.tipibot.maxSpeed);
        }
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
            currentSegment = currentSegment == path.firstSegment ? null : currentSegment.previous;
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
    plotPath(path) {
        if (path.className != 'Path' || !SVGPlot.itemMustBeDrawn(path) || path.segments == null) {
            return;
        }
        let speeds = Settings_1.Settings.plot.fullSpeed ? this.computeSpeeds(path) : null;
        for (let segment of path.segments) {
            let point = segment.point;
            if (segment == path.firstSegment) {
                if (!Tipibot_1.tipibot.lastSentPosition.equals(point)) {
                    Tipibot_1.tipibot.penUp();
                    Tipibot_1.tipibot.moveDirect(point, () => Tipibot_1.tipibot.pen.setPosition(point, true, false), false);
                }
                Tipibot_1.tipibot.penDown();
            }
            else {
                this.moveTipibotLinear(segment, speeds);
            }
        }
        if (path.closed) {
            this.moveTipibotLinear(path.firstSegment, speeds);
        }
    }
    plotNextLoaded(callback) {
        this.nSegments = 0;
        while (this.currentPath != null && this.nSegments <= SVGPlot.nSegmentsPerBatch) {
            this.plotPath(this.currentPath);
            this.nSegments += this.currentPath.segments.length;
            this.currentPath = this.currentPath.nextSibling;
        }
        console.log('Commands generated.');
        GUI_1.GUI.stopLoadingAnimation();
        if (this.currentPath != null) {
            while (this.currentPath.segments.length > SVGPlot.nSegmentsPerBatch) {
                this.currentPath.splitAt(this.currentPath.segments[SVGPlot.nSegmentsPerBatch - 1].location);
            }
            Tipibot_1.tipibot.executeOnceFinished(() => this.plotNext(callback));
        }
        else {
            callback();
        }
    }
    plotNext(callback) {
        console.log('Generating commands...');
        GUI_1.GUI.startLoadingAnimation(() => this.plotNextLoaded(callback));
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
            this.raster = null;
        }
        if (this.item != null) {
            this.item.remove();
            this.item = null;
        }
        if (this.originalItem != null) {
            this.originalItem.remove();
            this.originalItem = null;
        }
        if (this.background != null) {
            this.background.remove();
            this.background = null;
        }
        this.group.removeChildren();
    }
    destroy() {
        this.clear();
        if (this.group != null) {
            this.group.remove();
            this.group = null;
        }
    }
}
SVGPlot.svgPlot = null;
SVGPlot.gui = null;
SVGPlot.transformFolder = null;
SVGPlot.files = null;
SVGPlot.multipleFiles = false;
SVGPlot.fileIndex = 0;
SVGPlot.currentMatrix = null;
SVGPlot.nSegmentsPerBatch = 1000;
SVGPlot.nSegmentsMax = SVGPlot.nSegmentsPerBatch * 3;
exports.SVGPlot = SVGPlot;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Interpreter_1 = __webpack_require__(8);
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
        let message = 'Move pen' + (servoValue == Settings_1.Settings.servo.position.up ? ' up' : servoValue == Settings_1.Settings.servo.position.down ? ' down' : '') + ': ' + servoValue;
        servoValue = this.convertServoValue(servoValue);
        if (delayBefore > 0) {
            this.sendPause(delayBefore);
        }
        this.queue('M340 P3 S' + servoValue + '\n', message, delayAfter <= 0 ? callback : undefined);
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Pen_1 = __webpack_require__(4);
const Tipibot_1 = __webpack_require__(2);
exports.visualFeedback = null;
class VisualFeedback {
    constructor() {
        this.drawing = false;
        this.isPenUp = true;
        this.positionPrefix = '-p: l: ';
        this.penPrefix = '-pen: ';
        this.subTargetPrefix = '-st: l: ';
        this.paths = new paper.Group();
        this.subTargets = new paper.Group();
        this.group = new paper.Group();
        this.group.addChild(this.paths);
        this.group.addChild(this.subTargets);
        let positon = Tipibot_1.tipibot.getPosition();
        let gondolaPosition = Tipibot_1.tipibot.getGondolaPosition();
        this.circle = paper.Path.Circle(positon, Pen_1.Pen.HOME_RADIUS);
        this.circle.fillColor = 'rgba(255, 193, 7, 0.25)';
        this.circle.strokeColor = 'black';
        this.circle.strokeWidth = 1;
        this.group.addChild(this.circle);
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(gondolaPosition);
        this.lines.add(new paper.Point(Settings_1.Settings.tipibot.width, 0));
        this.lines.strokeWidth = 0.5;
        this.lines.strokeColor = 'rgba(0, 0, 0, 0.5)';
        this.lines.dashArray = [2, 2];
        this.lines.strokeScaling = false;
        this.group.addChild(this.lines);
        this.offsetLine = new paper.Path();
        this.offsetLine.add(gondolaPosition);
        this.offsetLine.add(positon);
        this.offsetLine.dashArray = [2, 2];
        this.group.addChild(this.offsetLine);
        document.addEventListener('MessageReceived', (event) => this.onMessageReceived(event.detail), false);
        document.addEventListener('SettingChanged', (event) => this.onSettingChanged(event), false);
        document.addEventListener('ClearFeedback', (event) => this.clear(), false);
        document.addEventListener('ZoomChanged', (event) => this.onZoomChanged(), false);
        this.group.sendToBack();
    }
    static initialize() {
        exports.visualFeedback = new VisualFeedback();
    }
    clear() {
        this.paths.removeChildren();
        this.subTargets.removeChildren();
    }
    onZoomChanged() {
        this.circle.applyMatrix = false;
        this.circle.scaling = new paper.Point(1 / paper.view.zoom, 1 / paper.view.zoom);
    }
    setVisible(visible) {
        this.group.visible = visible;
    }
    setPosition(point) {
        this.circle.position = point;
        this.offsetLine.segments[1].point = point;
        let center = new paper.Point(point.x, point.y - Settings_1.Settings.tipibot.penOffset);
        this.lines.segments[1].point = center;
        this.offsetLine.segments[0].point = center;
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
        else if (data.indexOf(this.penPrefix) == 0) {
            this.updatePen(data);
        }
        else {
            console.log(data);
        }
    }
    updatePosition(data) {
        let point = this.computePoint(data, this.positionPrefix);
        if (point.isNaN()) {
            return;
        }
        if (!this.isPenUp) {
            if (!this.drawing && this.paths) {
                let path = new paper.Path();
                path.strokeWidth = Settings_1.Settings.tipibot.penWidth;
                path.strokeColor = 'black';
                path.strokeScaling = true;
                path.add(point);
                this.paths.addChild(path);
                this.drawing = true;
            }
            else if (this.paths.lastChild != null) {
                let path = this.paths.lastChild;
                path.add(point);
            }
        }
        else {
            this.drawing = false;
        }
        this.setPosition(point);
    }
    updatePen(data) {
        let m = data.replace(this.penPrefix, '');
        let position = Math.round(parseFloat(m));
        this.isPenUp = Math.abs(position - Math.round(Settings_1.Settings.servo.position.up)) < 0.1 ? true : Math.abs(position - Math.round(Settings_1.Settings.servo.position.down)) < 0.1 ? false : null;
        if (Settings_1.Settings.servo.position.invert) {
            this.isPenUp = !this.isPenUp;
        }
        this.circle.fillColor = this.isPenUp ? 'rgba(255, 193, 7, 0.25)' : this.circle.fillColor = 'rgba(255, 193, 7, 0.9)';
    }
    setSubTarget(data) {
        let point = this.computePoint(data, this.subTargetPrefix);
        if (!this.isPenUp) {
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
        if (event.detail.all || event.detail.parentNames[0] == 'Pen' && event.detail.name == 'penOffset') {
            this.setPosition(this.circle.position);
        }
    }
}
exports.VisualFeedback = VisualFeedback;


/***/ }),
/* 8 */
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
        this.sendSetPosition(initializeAtHome ? new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY - Settings_1.Settings.tipibot.penOffset) : this.tipibot.getGondolaPosition());
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
    executeOnceFinished(callback) {
        if (this.commandQueue.length == 0) {
            callback();
        }
        let lastCommand = this.commandQueue[this.commandQueue.length - 1];
        let currentCallback = lastCommand.callback;
        lastCommand.callback = () => {
            currentCallback();
            callback();
        };
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
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Communication_1 = __webpack_require__(1);
const Pen_1 = __webpack_require__(4);
const Tipibot_1 = __webpack_require__(2);
class CommandDisplay {
    constructor() {
        // $('#commands-content').click((event)=> this.click(event))
        document.addEventListener('QueueCommand', (event) => this.queueCommand(event.detail), false);
        document.addEventListener('SendCommand', (event) => this.sendCommand(event.detail), false);
        document.addEventListener('CommandExecuted', (event) => this.commandExecuted(event.detail), false);
        document.addEventListener('ClearQueue', (event) => this.clearQueue(), false);
        document.addEventListener('CancelCommand', (event) => this.commandExecuted(event.detail), false);
    }
    createGUI(gui) {
        this.gui = gui.addFolder('Commands');
        this.gui.open();
        Tipibot_1.tipibot.gui = this.gui;
        let position = { moveX: Settings_1.Settings.tipibot.homeX, moveY: Settings_1.Settings.tipibot.homeY };
        this.gui.add(position, 'moveX', 0, Settings_1.Settings.tipibot.width).name('Move X').onFinishChange((value) => Tipibot_1.tipibot.move(Pen_1.MoveType.Direct, new paper.Point(value, Tipibot_1.tipibot.getPosition().y)));
        this.gui.add(position, 'moveY', 0, Settings_1.Settings.tipibot.height).name('Move Y').onFinishChange((value) => Tipibot_1.tipibot.move(Pen_1.MoveType.Direct, new paper.Point(Tipibot_1.tipibot.getPosition().x, value)));
        let goHomeButton = this.gui.addButton('Go home', () => Tipibot_1.tipibot.goHome(() => console.log('I am home :-)')));
        Tipibot_1.tipibot.penStateButton = this.gui.addButton('Pen down', () => Tipibot_1.tipibot.togglePenState());
        Tipibot_1.tipibot.motorsEnableButton = this.gui.addButton('Disable motors', () => Tipibot_1.tipibot.toggleMotors());
        this.gui.addButton('Initialize', () => Communication_1.communication.interpreter.initialize(false));
        this.pauseButton = this.gui.add({ 'Pause': false }, 'Pause').onChange((value) => Communication_1.communication.interpreter.setPause(value));
        this.gui.addButton('Emergency stop', () => {
            this.pauseButton.setValue(true);
            Communication_1.communication.interpreter.sendStop(true);
        });
        this.gui.addButton('Clear commands', () => Communication_1.communication.interpreter.clearQueue());
        let commandList = this.gui.addFolder('Command list');
        this.listJ = $('<ul id="command-list" class="c-list">');
        commandList.open();
        this.listJ.insertAfter($(commandList.gui.domElement).find('li'));
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
        document.dispatchEvent(new CustomEvent('CommandListChanged'));
    }
    updateName() {
        $('#commands h3').text('Command list (' + this.listJ.children().length + ')');
    }
    queueCommand(command) {
        if (Settings_1.Settings.disableCommandList) {
            return;
        }
        this.listJ.append(this.createCommandItem(command));
        this.updateName();
        document.dispatchEvent(new CustomEvent('CommandListChanged'));
    }
    sendCommand(command) {
        if (Settings_1.Settings.disableCommandList) {
            return;
        }
        this.listJ.find('#' + command.id).addClass('sent');
    }
    commandExecuted(command) {
        if (Settings_1.Settings.disableCommandList) {
            return;
        }
        this.removeCommand(command.id);
    }
    clearQueue() {
        if (Settings_1.Settings.disableCommandList) {
            return;
        }
        this.listJ.children().remove();
        this.updateName();
        document.dispatchEvent(new CustomEvent('CommandListChanged'));
    }
}
exports.CommandDisplay = CommandDisplay;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const GUI_1 = __webpack_require__(3);
class Console {
    constructor() {
        this.MAX_NUM_MESSAGES = 1000;
        this.scrollingToBottom = false;
        this.skipScrollToBottom = false;
        document.addEventListener('CommandListChanged', (event) => this.scrollToBottom(), false);
        this.log = console.log.bind(console);
        this.error = console.error.bind(console);
        this.info = console.info.bind(console);
        this.warn = console.warn.bind(console);
        this.table = console.table.bind(console);
        let log = (args, logger, type) => {
            if (typeof logger === 'function') {
                logger.apply(console, args);
            }
            let div = $('<li>');
            if (type == 'table') {
                let p = this.logTable.apply(this, args);
                div.append(p);
            }
            else {
                for (let arg of args) {
                    let p = null;
                    if (typeof arg == 'object') {
                        // p = this.logObject(arg)
                        p = $('<p>').append(arg).addClass(type);
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
            }
            let consoleJ = this.listJ;
            if (consoleJ.children().length >= this.MAX_NUM_MESSAGES) {
                consoleJ.find('li:first-child').remove();
            }
            consoleJ.append(div);
            this.scrollToBottom(consoleJ);
        };
        console.log = (...args) => log(args, this.log, 'log');
        console.error = (...args) => log(args, this.error, 'error');
        console.info = (...args) => log(args, this.info, 'info');
        console.warn = (...args) => log(args, this.warn, 'warn');
        console.table = (...args) => log(args, this.table, 'table');
        this.gui = new GUI_1.GUI({ autoPlace: false });
        let customContainer = document.getElementById('info');
        customContainer.appendChild(this.gui.getDomElement());
    }
    createGUI() {
        this.folder = this.gui.addFolder('Console');
        this.folder.open();
        this.listJ = $('<ul id="console-list" class="c-list">');
        this.listJ.insertAfter($(this.folder.gui.domElement).find('li'));
        this.listJ.scroll((event) => {
            if (!this.scrollingToBottom) {
                let consoleE = this.listJ.get(0);
                this.skipScrollToBottom = consoleE.scrollTop + consoleE.clientHeight < consoleE.scrollHeight;
            }
            this.scrollingToBottom = false;
        });
        this.updateMaxHeight();
        window.addEventListener('resize', () => this.updateMaxHeight(), false);
        $('#info').click(() => this.updateMaxHeight()); // to handle the case when user opens / closes a folder
    }
    updateMaxHeight() {
        this.listJ.css('max-height', $('#info').outerHeight() - this.listJ.offset().top);
    }
    scrollToBottom(consoleJ = this.listJ) {
        this.updateMaxHeight();
        if (this.skipScrollToBottom) {
            return;
        }
        this.scrollingToBottom = true;
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
    logObject(object) {
        let properties = [];
        for (let property in object) {
            properties.push({ name: property, value: object[property] });
        }
        return this.printTable(properties, ['name', 'value']);
    }
    ;
    logTable(...args) {
        var objArr = args[0];
        var keys;
        if (typeof objArr !== 'undefined') {
            keys = Object.keys(objArr);
        }
        return this.printTable(objArr, keys);
    }
}
exports.Console = Console;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Plot_1 = __webpack_require__(5);
const Communication_1 = __webpack_require__(1);
const Tipibot_1 = __webpack_require__(2);
const VisualFeedback_1 = __webpack_require__(7);
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
let commeundesseinAjaxURL = '/ajaxCallNoCSRF/';
const ModeKey = 'Mode';
const OriginKey = 'Origin';
const CommeUnDesseinSecretKey = 'CommeUnDesseinSecret';
// $.ajaxSetup({
// 	beforeSend: function(xhr, settings) {
// 		let getCookie = function(name: string) {
// 			var cookie, cookieValue, cookies, i;
// 			cookieValue = null;
// 			if (document.cookie && document.cookie !== '') {
// 				cookies = document.cookie.split(';');
// 				i = 0;
// 				while (i < cookies.length) {
// 					cookie = jQuery.trim(cookies[i]);
// 					if (cookie.substring(0, name.length + 1) === name + '=') {
// 						cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
// 						break;
// 					}
// 					i++;
// 				}
// 			}
// 			return cookieValue;
// 		};
// 		if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
// 			xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
// 		}
// 	}
// });
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
        this.origin = '';
        this.secret = '******';
        this.state = State.NextDrawing;
        this.started = false;
        this.timeoutID = -1;
        this.testMode = testMode;
        this.mode = localStorage.getItem(ModeKey) || 'CommeUnDessein';
        this.origin = localStorage.getItem(OriginKey) || '';
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
        commeUnDesseinGUI.add(this, 'origin').onFinishChange((value) => localStorage.setItem(OriginKey, value));
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
        this.startButton = commeUnDesseinGUI.addButton('Start', () => this.toggleStart());
        // commeUnDesseinGUI.open()
    }
    toggleStart() {
        if (!this.started) {
            if (document.cookie.indexOf('csrftoken') < 0) {
                console.error('The csrf token cookie is not present, please visit http://commeundessein.co/ before starting Comme un Dessein');
                return;
            }
            this.startButton.setName('Stop, clear queue & go home');
            this.requestNextDrawing();
        }
        else {
            this.startButton.setName('Start');
            this.stopAndClear();
        }
        this.started = !this.started;
    }
    stopAndClear() {
        if (Plot_1.SVGPlot.svgPlot != null) {
            Plot_1.SVGPlot.svgPlot.destroy();
        }
        Communication_1.communication.interpreter.sendStop(true);
        Communication_1.communication.interpreter.clearQueue();
        Tipibot_1.tipibot.goHome();
        this.state = State.NextDrawing;
        clearTimeout(this.timeoutID);
    }
    requestNextDrawing() {
        if (this.state != State.NextDrawing) {
            console.error('CommeUnDessein trying to request next drawing while not in NextDrawing state');
            return;
        }
        let args = {
            cityName: this.mode, secret: this.secret
        };
        let functionName = this.testMode ? 'getNextTestDrawing' : 'getNextValidatedDrawing';
        let data = {
            data: JSON.stringify({ function: functionName, args: args })
        };
        this.state = State.RequestedNextDrawing;
        console.log('Request next drawing...');
        // let url = this.testMode ? 'http://localhost:8000/ajaxCallNoCSRF/' : commeundesseinAjaxURL
        let url = this.origin + commeundesseinAjaxURL;
        // $.ajax({ method: "GET", url: url, data: data, xhrFields: { withCredentials: false }, headers: {'Access-Control-Allow-Origin':true} }).done((results) => {
        $.ajax({ method: "POST", url: url, data: data }).done((results) => {
            if (this.testMode) {
                console.log(results);
            }
            if (results.message == 'no path') {
                this.state = State.NextDrawing;
                console.log('There are no path to draw. Request next drawing in two seconds...');
                if (this.started) {
                    clearTimeout(this.timeoutID);
                    this.timeoutID = setTimeout(() => this.requestNextDrawing(), RequestTimeout);
                }
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
            if (this.started) {
                clearTimeout(this.timeoutID);
                this.timeoutID = setTimeout(() => this.requestNextDrawing(), RequestTimeout);
            }
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
                Plot_1.SVGPlot.svgPlot.destroy();
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
            Plot_1.SVGPlot.svgPlot.destroy();
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
        let url = this.origin + commeundesseinAjaxURL;
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
            if (this.started) {
                this.requestNextDrawing();
            }
            return;
        }).fail((results) => {
            console.error('setDrawingStatusDrawn request failed');
            console.error(results);
            this.state = State.Drawing;
            if (this.started) {
                this.setDrawingStatusDrawn(pk);
            }
        });
    }
}
exports.CommeUnDessein = CommeUnDessein;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Communication_1 = __webpack_require__(1);
const Plot_1 = __webpack_require__(5);
class FileManager {
    constructor() {
        this.saveFileName = 'drawing.txt';
        document.addEventListener('ServerMessage', (event) => this.onServerMessage(event.detail), false);
        this.printingFileName = null;
    }
    createGUI(gui) {
        this.gui = gui.addFolder('File Manager');
        this.gui.add(this, 'saveFileName').name('File name');
        this.gui.addButton('Save file', () => this.saveFile());
        this.filesFolder = this.gui.addFolder('Files');
        this.listJ = $('<ul id="console-list" class="c-list">');
        this.listJ.insertAfter($(this.filesFolder.gui.domElement).find('li'));
    }
    saveFile() {
        if (Plot_1.SVGPlot.svgPlot == null) {
            console.error('No SVG loaded.');
            return;
        }
        if (Communication_1.communication.interpreter.commandQueue.length > 0) {
            console.error('Command queue is not empty ; please finish / empty queue before saving a file.');
            return;
        }
        Communication_1.communication.send('write-file', this.saveFileName);
        Plot_1.SVGPlot.plotAndLoadLoop(() => Communication_1.communication.send('close-file'));
    }
    exportFile(baseName, i, project, images, group) {
        let fileName = baseName + "_" + i + ".svg";
        console.log("Exporting " + fileName + "...");
        let imageData = project.exportSVG({ asString: true });
        let blob = new Blob([imageData], { type: 'image/svg+xml' });
        console.log("Exported " + fileName + ".");
        images.file(fileName, blob, {});
        group.removeChildren();
    }
    listFiles() {
        Communication_1.communication.send('list-files');
    }
    createFileItem(fileName) {
        let liJ = $('<li>').attr('id', fileName);
        let messageJ = $('<div>').append(fileName).addClass('file-name');
        liJ.append(messageJ);
        let printButtonJ = $('<button>Print</button>').addClass('print');
        printButtonJ.click((event) => this.printFileItem(fileName));
        liJ.append(printButtonJ);
        let closeButtonJ = $('<button>x</button>').addClass('close');
        closeButtonJ.click((event) => this.removeFileItem(fileName));
        liJ.append(closeButtonJ);
        return liJ;
    }
    printFileItem(fileName) {
        if (this.printingFileName != null) {
            if (this.printingFileName == fileName) {
                this.listJ.find('#' + fileName).find('.print').text('Print');
                Communication_1.communication.send('cancel-print-file', fileName);
                this.printingFileName = null;
            }
            else {
                console.error('The file ' + this.printingFileName + ' is already being printed.');
            }
            return;
        }
        this.listJ.find('#' + fileName).find('.print').text('Cancel print');
        Communication_1.communication.send('print-file', fileName);
        this.printingFileName = fileName;
    }
    removeFileItem(fileName) {
        this.listJ.find('#' + fileName).remove();
        Communication_1.communication.send('delete-file', fileName);
    }
    onServerMessage(json) {
        if (json.type == 'files') {
            this.listJ.children().remove();
            for (let fileName of json.data) {
                this.createFileItem(fileName);
            }
        }
        else if (json.type == 'file-printed') {
            this.listJ.find('#' + json.data).find('.print').text('Print');
            console.info('File ' + json.data + ' printed.');
        }
    }
}
exports.FileManager = FileManager;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Communication_1 = __webpack_require__(1);
const Tipibot_1 = __webpack_require__(2);
class LiveDrawing {
    constructor() {
        this.liveDrawing = false;
        this.mouseDown = false;
        this.undoRedo = true;
        this.undoRedoButtons = false;
        this.mustClearCommandQueueOnMouseUp = false;
        document.body.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.body.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.body.addEventListener('mouseup', (event) => this.onMouseUp(event));
        document.body.addEventListener('mouseleave', (event) => this.onMouseLeave(event));
        document.body.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.body.addEventListener('keyup', (event) => this.onKeyUp(event));
        window.addEventListener('resize', (event) => this.windowResize(event));
        document.addEventListener('QueueCommand', (event) => this.queueCommand(event.detail), false);
        document.addEventListener('SendCommand', (event) => this.sendCommand(event.detail), false);
        document.addEventListener('CommandExecuted', (event) => this.commandExecuted(event.detail), false);
        document.addEventListener('ClearQueue', (event) => this.clearQueue(), false);
        this.mode = '4 Symmetries';
        this.nRepetitions = 1;
        this.commandQueues = [];
        this.undoneCommandQueues = [];
    }
    setRenderer(renderer) {
        this.renderer = renderer;
    }
    createGUI(gui) {
        let liveDrawingGui = gui.addFolder('Live drawing');
        this.toggleLiveDrawingButton = liveDrawingGui.addButton('Start', (value) => this.toggleLiveDrawing());
        liveDrawingGui.add(this, 'undoRedo').name('Undo / Redo');
        liveDrawingGui.add(this, 'undoRedoButtons').name('Display buttons');
        liveDrawingGui.add({ 'Mode': this.mode }, 'Mode', ['None', '2 Symmetries', '4 Symmetries', 'N. Repetitions']).onFinishChange((value) => this.renderAxes(value));
        liveDrawingGui.addSlider('N. Repetitions', 1, 1, 10, 1).onChange((value) => {
            this.nRepetitions = value;
            this.renderAxes(this.mode);
        });
        liveDrawingGui.addButton('Clear drawing', (value) => this.clearDrawing());
        liveDrawingGui.addButton('Undo', (value) => this.undo());
        liveDrawingGui.addButton('Redo', (value) => this.redo());
        liveDrawingGui.addButton('Export SVG', (value) => this.exportSVG());
    }
    clearDrawing() {
        this.drawing.removeChildren();
    }
    exportSVG() {
        let svg = this.project.exportSVG({ asString: true });
        // create an svg image, create a link to download the image, and click it
        let blob = new Blob([svg], { type: 'image/svg+xml' });
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a");
        document.body.appendChild(link);
        link.download = 'result.svg';
        link.href = url;
        link.click();
        document.body.removeChild(link);
    }
    renderAxes(mode) {
        this.mode = mode;
        this.axes.removeChildren();
        let bounds = Tipibot_1.tipibot.drawArea.bounds;
        if (mode == 'None') {
        }
        else if (mode == '2 Symmetries' || mode == '4 Symmetries') {
            let v = new paper.Path();
            v.strokeColor = 'black';
            v.strokeWidth = 1;
            v.dashArray = [5, 5];
            v.add(bounds.topCenter);
            v.add(bounds.bottomCenter);
            this.axes.addChild(v);
            let h = v.clone();
            h.firstSegment.point = bounds.leftCenter;
            h.lastSegment.point = bounds.rightCenter;
            // h.rotate(90)
            this.axes.addChild(h);
            if (mode == '4 Symmetries') {
                let d1 = v.clone();
                d1.firstSegment.point.x -= bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2;
                d1.lastSegment.point.x += bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2;
                this.axes.addChild(d1);
                let d2 = v.clone();
                d2.firstSegment.point.x += bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2;
                d2.lastSegment.point.x -= bounds.height < bounds.width ? bounds.height / 2 : bounds.width / 2;
                this.axes.addChild(d2);
            }
        }
        else if (mode == 'N. Repetitions') {
            for (let i = 0; i < this.nRepetitions; i++) {
                let v = new paper.Path();
                v.strokeColor = 'black';
                v.strokeWidth = 1;
                v.dashArray = [5, 5];
                let center = bounds.center;
                v.add(center);
                v.add(bounds.bottomCenter.rotate(i * 360 / this.nRepetitions, center));
                this.axes.addChild(v);
            }
        }
    }
    windowResize(event = null) {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.canvasJ.width(width);
        this.canvasJ.height(height);
        paper.view.viewSize = new paper.Size(width, height);
        this.renderer.centerOnTipibot(this.drawArea.bounds, true, this.canvasJ.get(0));
        this.project.view.setCenter(this.drawArea.bounds.center);
    }
    startLiveDrawing() {
        // settingsManager.settingsFolder.getController('disableMouseInteractions').setValue(true)
        Settings_1.settingsManager.settingsFolder.getController('disableCommandList').setValue(true);
        if (this.canvasJ == null) {
            this.divJ = $('<div>');
            this.canvasJ = $('<canvas>');
            let zIndex = 1000000;
            this.canvasJ.css({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 'z-index': zIndex++, width: window.innerWidth, height: window.innerHeight, background: 'white' });
            this.divJ.append(this.canvasJ);
            this.footerJ = $('<div>').css({ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', 'flex-direction': 'row', 'justify-content': 'center', 'z-index': zIndex++ });
            let buttonCss = {
                width: '200px',
                height: '40px',
                'margin-bottom': '20px',
                'user-select': 'none'
            };
            this.undoButtonJ = $('<button>').html('&#8592;').css(buttonCss).click(() => this.left());
            this.redoButtonJ = $('<button>').html('&#8594;').css(buttonCss).click(() => this.right());
            this.footerJ.append(this.undoButtonJ);
            this.footerJ.append(this.redoButtonJ);
            this.divJ.append(this.footerJ);
            $('body').append(this.divJ);
            this.project = new paper.Project(this.canvasJ.get(0));
            this.project.activate();
            this.axes = new paper.Group();
            this.drawing = new paper.Group();
            this.currentDrawing = new paper.Group();
            this.drawArea = paper.Path.Rectangle(Tipibot_1.tipibot.drawArea.bounds);
            this.drawArea.strokeColor = 'black';
            this.drawArea.strokeWidth = 1;
            if (!this.undoRedoButtons) {
                this.undoButtonJ.hide();
                this.redoButtonJ.hide();
            }
            this.windowResize();
        }
        else {
            this.divJ.show();
            this.project.activate();
            if (this.undoRedoButtons) {
                this.undoButtonJ.show();
                this.redoButtonJ.show();
            }
            else {
                this.undoButtonJ.hide();
                this.redoButtonJ.hide();
            }
        }
        this.renderAxes(this.mode);
        Tipibot_1.tipibot.ignoreKeyEvents = true;
        this.renderer.ignoreWindowResize = true;
    }
    stopLiveDrawing() {
        this.divJ.hide();
        paper.projects[0].activate();
        this.axes.removeChildren();
        Tipibot_1.tipibot.ignoreKeyEvents = false;
        this.renderer.ignoreWindowResize = false;
        this.renderer.windowResize();
    }
    toggleLiveDrawing() {
        this.liveDrawing = !this.liveDrawing;
        this.toggleLiveDrawingButton.setName(this.liveDrawing ? 'Stop' : 'Start');
        if (this.liveDrawing) {
            this.startLiveDrawing();
        }
        else {
            this.stopLiveDrawing();
        }
    }
    createNewCommandQueue() {
        let commandQueue = { commands: new Array(), paths: new Array() };
        this.commandQueues.push(commandQueue);
        return commandQueue;
    }
    eventWasOnGUI(event) {
        return $.contains(document.getElementById('gui'), event.target) || $.contains(document.getElementById('info'), event.target) || $.contains(this.footerJ.get(0), event.target);
    }
    onMouseDown(event) {
        if (!this.liveDrawing || this.eventWasOnGUI(event)) {
            return;
        }
        let point = this.renderer.getWorldPosition(event);
        if (!Tipibot_1.tipibot.drawArea.bounds.contains(point)) {
            return;
        }
        this.mouseDown = true;
        let commandQueue = this.undoRedo ? this.createNewCommandQueue() : null;
        this.currentLine = new paper.Path();
        this.currentLine.strokeWidth = Settings_1.Settings.tipibot.penWidth;
        this.currentLine.strokeColor = 'green';
        this.currentLine.add(point);
        if (this.undoRedo) {
            this.undoneCommandQueues = [];
            Tipibot_1.tipibot.moveDirect(point);
            Tipibot_1.tipibot.penDown();
            this.drawing.addChild(this.currentLine);
            commandQueue.paths.push(this.currentLine);
        }
        else {
            this.currentDrawing.addChild(this.currentLine);
        }
    }
    onMouseMove(event) {
        if (!this.liveDrawing || this.eventWasOnGUI(event)) {
            return;
        }
        if (this.mouseDown) {
            let point = this.renderer.getWorldPosition(event);
            if (!Tipibot_1.tipibot.drawArea.bounds.contains(point) || (this.undoRedo && point.getDistance(this.currentLine.lastSegment.point) < 15)) {
                return;
            }
            if (this.undoRedo) {
                Tipibot_1.tipibot.moveLinear(point);
            }
            this.currentLine.add(point);
        }
    }
    addLines(lines, commandQueue) {
        if (this.undoRedo) {
            this.drawing.addChild(lines);
            this.drawLines(lines);
            commandQueue.paths.push(lines);
        }
        else {
            this.currentDrawing.addChild(lines);
        }
    }
    pathDrawn(lines) {
        lines.strokeColor = 'black';
    }
    penUp(lines) {
        Tipibot_1.tipibot.penUp(undefined, undefined, undefined, () => this.pathDrawn(lines));
    }
    drawLines(lines) {
        Tipibot_1.tipibot.penUp();
        Tipibot_1.tipibot.moveDirect(lines.firstSegment.point);
        Tipibot_1.tipibot.penDown();
        for (let segment of lines.segments) {
            Tipibot_1.tipibot.moveLinear(segment.point);
        }
        this.penUp(lines);
    }
    onMouseUp(event) {
        if (!this.liveDrawing || this.eventWasOnGUI(event)) {
            return;
        }
        let point = this.renderer.getWorldPosition(event);
        if (!Tipibot_1.tipibot.drawArea.bounds.contains(point)) {
            return;
        }
        if (this.undoRedo) {
            Tipibot_1.tipibot.moveLinear(point);
        }
        this.currentLine.add(point);
        this.mouseDown = false;
        if (this.undoRedo) {
            this.penUp(this.currentLine);
        }
        else {
            this.currentLine.simplify();
            this.currentLine.flatten(4.25);
            // this.currentLine.selected = true
        }
        let commandQueue = this.commandQueues[this.commandQueues.length - 1];
        if (this.mode == 'None') {
        }
        else if (this.mode == '2 Symmetries' || this.mode == '4 Symmetries') {
            // let definition = new (<any>paper).SymbolDefinition(this.currentLine)
            // let instance = definition.place()
            let instance = this.currentLine.clone();
            instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
            instance.scaling.y = -1;
            this.addLines(instance, commandQueue);
            instance = this.currentLine.clone(); // definition.place()
            instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
            instance.scaling.x = -1;
            this.addLines(instance, commandQueue);
            instance = this.currentLine.clone(); // definition.place()
            instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
            instance.scaling.x = -1;
            instance.scaling.y = -1;
            this.addLines(instance, commandQueue);
            if (this.mode == '4 Symmetries') {
                let instance = this.currentLine.clone(); // definition.place()
                instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
                instance.rotate(90);
                this.addLines(instance, commandQueue);
                instance = this.currentLine.clone(); // definition.place()
                instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
                instance.rotate(90);
                instance.scaling.x = -1;
                this.addLines(instance, commandQueue);
                instance = this.currentLine.clone(); // definition.place()
                instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
                instance.rotate(90);
                instance.scaling.y = -1;
                this.addLines(instance, commandQueue);
                instance = this.currentLine.clone(); // definition.place()
                instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
                instance.rotate(90);
                instance.scaling.x = -1;
                instance.scaling.y = -1;
                this.addLines(instance, commandQueue);
            }
        }
        else if (this.mode == 'N. Repetitions') {
            //let definition = new (<any>paper).SymbolDefinition(this.currentLine)
            for (let i = 1; i < this.nRepetitions; i++) {
                let instance = this.currentLine.clone(); // definition.place()
                instance.pivot = Tipibot_1.tipibot.drawArea.bounds.center;
                instance.rotate(i * 360 / this.nRepetitions);
                this.addLines(instance, commandQueue);
            }
        }
        if (this.mustClearCommandQueueOnMouseUp && this.commandQueues.length == 1) {
            this.mustClearCommandQueueOnMouseUp = false;
            for (let path of this.commandQueues[0].paths) {
                path.strokeColor = 'blue';
            }
            this.commandQueues = [];
            this.createNewCommandQueue();
        }
    }
    onMouseLeave(event) {
        if (!this.liveDrawing) {
            return;
        }
    }
    onKeyDown(event) {
        if (!this.liveDrawing) {
            return;
        }
        switch (event.keyCode) {
            case 37:
                this.left();
                break;
            case 39:
                this.right();
                break;
            case 27:
                this.toggleLiveDrawing();
                break;
            default:
                break;
        }
    }
    onKeyUp(event) {
        if (!this.liveDrawing) {
            return;
        }
    }
    undo() {
        if (!this.liveDrawing) {
            return;
        }
        let commandQueue = this.commandQueues.pop();
        if (commandQueue != null) {
            this.undoneCommandQueues.push(commandQueue);
            for (let command of commandQueue.commands) {
                Communication_1.communication.interpreter.removeCommand(command.id);
                document.dispatchEvent(new CustomEvent('CancelCommand', { detail: command }));
            }
            for (let path of commandQueue.paths) {
                path.remove();
            }
        }
    }
    redo() {
        if (!this.liveDrawing) {
            return;
        }
        let commandQueue = this.undoneCommandQueues.pop();
        if (commandQueue != null) {
            this.createNewCommandQueue();
            for (let command of commandQueue.commands) {
                Communication_1.communication.interpreter.queue(command.data, command.message, command.callback);
            }
            for (let path of commandQueue.paths) {
                this.drawing.addChild(path);
                this.commandQueues[this.commandQueues.length - 1].paths.push(path);
            }
        }
    }
    left() {
        if (this.undoRedo) {
            this.undo();
        }
        else {
            this.currentDrawing.removeChildren();
        }
    }
    right() {
        if (this.undoRedo) {
            this.redo();
        }
        else {
            for (let child of this.currentDrawing.children.slice()) {
                child.strokeColor = 'black';
                this.drawing.addChild(child);
                this.drawLines(child);
            }
            this.currentDrawing.removeChildren();
        }
    }
    removeCommand(commandQueue, commandID) {
        let index = commandQueue.findIndex((command) => command.id == commandID);
        if (index >= 0) {
            commandQueue.splice(index, 1);
        }
    }
    removeCommandFromQueues(commandID) {
        for (let commandQueue of this.commandQueues) {
            for (let command of commandQueue.commands) {
                if (command.id == commandID) {
                    this.removeCommand(commandQueue.commands, commandID);
                }
            }
        }
    }
    queueCommand(command) {
        if (!this.liveDrawing || !this.undoRedo) {
            return;
        }
        this.commandQueues[this.commandQueues.length - 1].commands.push(command);
    }
    sendCommand(command) {
        if (!this.liveDrawing || !this.undoRedo) {
            return;
        }
        for (let commandQueue of this.commandQueues) {
            for (let c of commandQueue.commands) {
                if (command == c) {
                    console.log('SEND');
                    let index = this.commandQueues.findIndex((cq) => cq == commandQueue);
                    if (index >= 0 && !(this.mouseDown && this.commandQueues.length == 1)) {
                        this.commandQueues.splice(index, 1);
                    }
                    else if (index >= 0 && this.mouseDown && this.commandQueues.length == 1) {
                        this.mustClearCommandQueueOnMouseUp = true;
                    }
                    if (this.commandQueues.length <= 0) {
                        this.createNewCommandQueue();
                    }
                    for (let path of commandQueue.paths) {
                        path.strokeColor = 'blue';
                    }
                    return;
                }
            }
        }
    }
    commandExecuted(command) {
        if (!this.liveDrawing || !this.undoRedo) {
            return;
        }
        this.removeCommandFromQueues(command.id);
    }
    clearQueue() {
        if (!this.liveDrawing) {
            return;
        }
        this.commandQueues = [];
        this.undoneCommandQueues = [];
    }
}
exports.LiveDrawing = LiveDrawing;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const GUI_1 = __webpack_require__(3);
const Plot_1 = __webpack_require__(5);
class SVGSplitter {
    constructor() {
    }
    loadImage(event, name) {
        let svg = paper.project.importSVG(event.target.result);
        console.log('SVG imported.');
        this.splitSVG(svg, name);
        GUI_1.GUI.stopLoadingAnimation();
    }
    onImageLoad(event, name) {
        console.log('Importing SVG...');
        GUI_1.GUI.startLoadingAnimation(() => this.loadImage(event, name));
    }
    handleFileSelect(event) {
        let files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (let i = 0; i < files.length; i++) {
            let file = files[i] != null ? files[i] : files.item(i);
            let imageType = /^image\//;
            if (!imageType.test(file.type)) {
                continue;
            }
            let reader = new FileReader();
            reader.onload = (event) => this.onImageLoad(event, file.name);
            reader.readAsText(file);
            break;
        }
    }
    createGUI(gui) {
        this.gui = gui.addFolder('SVG Splitter');
        this.gui.addFileSelectorButton('Split SVG', 'image/svg+xml', false, (event) => this.handleFileSelect(event));
    }
    exportFile(baseName, i, project, images, group) {
        let fileName = baseName + "_" + i + ".svg";
        console.log("Exporting " + fileName + "...");
        let imageData = project.exportSVG({ asString: true });
        let blob = new Blob([imageData], { type: 'image/svg+xml' });
        console.log("Exported " + fileName + ".");
        images.file(fileName, blob, {});
        group.removeChildren();
    }
    splitSVG(svg, name) {
        let baseName = name.replace(/\.[^/.]+$/, "");
        let extension = name.replace(baseName, "");
        console.log("Collapsing SVG...");
        Plot_1.SVGPlot.collapse(svg);
        console.log("SVG collapsed.");
        Plot_1.SVGPlot.collapse(svg);
        console.log("Flattening and subdividing paths...");
        Plot_1.SVGPlot.filter(svg);
        console.log("Paths flattenned and subdivided.");
        console.log("Splitting long paths...");
        Plot_1.SVGPlot.splitLongPaths(svg);
        console.log("Paths split.");
        console.log("There are " + svg.children.length + " paths.");
        let mainProject = paper.project;
        let canvas = document.createElement('canvas');
        canvas.width = svg.strokeBounds.width;
        canvas.height = svg.strokeBounds.height;
        let project = new paper.Project(canvas);
        let background = paper.Path.Rectangle(svg.bounds);
        background.matrix = svg.matrix;
        background.fillColor = 'white';
        background.sendToBack();
        let group = new paper.Group();
        group.matrix = svg.matrix;
        group.strokeWidth = svg.strokeWidth;
        group.fillColor = svg.fillColor;
        group.strokeColor = svg.strokeColor;
        project.view.setCenter(svg.bounds.center);
        let nSegments = 0;
        let svgs = [];
        let zip = new JSZip();
        var images = zip.folder(baseName);
        let i = 0;
        while (svg.children.length > 0) {
            let p = svg.firstChild;
            p.remove();
            group.addChild(p);
            nSegments += p.segments.length;
            if (nSegments > Plot_1.SVGPlot.nSegmentsMax) {
                this.exportFile(baseName, i, project, images, group);
                nSegments = 0;
                i++;
            }
        }
        if (group.children.length > 0) {
            this.exportFile(baseName, i, project, images, group);
            i++;
        }
        if (i > 0) {
            console.log("Exports finished.");
            console.log(`The SVG was split in ${i} files.`);
            console.log("Generating zip file...");
            zip.generateAsync({ type: "blob" }).then((content) => {
                console.log("Zip file generated...");
                saveAs(content, baseName + ".zip");
            });
        }
        else {
            console.error('The SVG file seems empty.');
        }
        group.remove();
        project.remove();
        canvas.remove();
        svg.remove();
        mainProject.activate();
    }
}
exports.SVGSplitter = SVGSplitter;


/***/ }),
/* 15 */
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
        // telescreenGUI.open()
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
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
class Renderer {
    constructor() {
        this.ignoreWindowResize = false;
        this.canvas = document.createElement('canvas');
        let containerJ = $('#canvas');
        this.canvas.width = containerJ.width();
        this.canvas.height = containerJ.height();
        containerJ.get(0).appendChild(this.canvas);
        paper.setup(this.canvas);
        paper.project.currentStyle.strokeColor = 'black';
        paper.project.currentStyle.strokeWidth = 0.5;
        paper.project.currentStyle.strokeScaling = false;
        let mainLayer = new paper.Layer();
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
        document.addEventListener('SettingChanged', (event) => this.onSettingChanged(event), false);
    }
    onSettingChanged(event) {
        if (event.detail.all || event.detail.parentNames[0] == 'Machine dimensions') {
            this.centerOnTipibot(Settings_1.Settings.tipibot, true);
        }
    }
    centerOnTipibot(tipibot, zoom = true, canvas = this.canvas) {
        if (zoom) {
            let margin = 200;
            let ratio = Math.max((tipibot.width + margin) / canvas.width * window.devicePixelRatio, (tipibot.height + margin) / canvas.height * window.devicePixelRatio);
            paper.view.zoom = 1 / ratio;
            document.dispatchEvent(new CustomEvent('ZoomChanged', { detail: {} }));
        }
        paper.view.setCenter(new paper.Point(tipibot.width / 2, tipibot.height / 2));
    }
    getDomElement() {
        return paper.view.element;
    }
    windowResize() {
        if (this.ignoreWindowResize) {
            return;
        }
        let containerJ = $('#canvas');
        let width = containerJ.width();
        let height = containerJ.height();
        let canvasJ = $(this.canvas);
        canvasJ.width(width);
        canvasJ.height(height);
        paper.view.viewSize = new paper.Size(width, height);
        this.centerOnTipibot(Settings_1.Settings.tipibot, false);
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
        document.dispatchEvent(new CustomEvent('ZoomChanged', { detail: {} }));
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
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const PenPlotter_1 = __webpack_require__(6);
class FredBot extends PenPlotter_1.PenPlotter {
    constructor(communication) {
        super(communication);
        this.continueMessage = 'ok';
        this.initializationMessage = 'Initialize';
        this.serialCommunicationSpeed = 250000;
    }
    serialPortConnectionOpened() {
    }
    convertServoValue(servoValue) {
        return 0.2 + 2 * servoValue / 180;
    }
    sendPenState(servoValue, delayBefore = 0, delayAfter = 0, callback = null) {
        servoValue = this.convertServoValue(servoValue);
        let message = 'Move servo: ' + servoValue;
        if (delayBefore > 0) {
            this.sendPause(delayBefore);
        }
        this.queue('G1 Z' + servoValue + '\n', message);
        if (delayAfter > 0) {
            this.sendPause(delayAfter, callback);
        }
    }
}
exports.FredBot = FredBot;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const Interpreter_1 = __webpack_require__(8);
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
        let message = 'Set pen lift range: ' + servoDownValue.toFixed(2) + ',' + servoUpValue.toFixed(2);
        this.queue(commands.CMD_SETPENLIFTRANGE + servoDownValue.toFixed(2) + ',' + servoUpValue.toFixed(2) + ',1,END', message);
    }
    sendPenDelays(servoDownDelay = Settings_1.Settings.servo.delay.down.before, servoUpDelay = Settings_1.Settings.servo.delay.up.before) {
    }
    sendPenUp(servoUpValue = Settings_1.SettingsManager.servoUpAngle(), servoUpTempoBefore = Settings_1.Settings.servo.delay.up.before, servoUpTempoAfter = Settings_1.Settings.servo.delay.up.after, callback = null) {
        if (servoUpTempoBefore > 0) {
            this.sendPause(servoUpTempoBefore);
        }
        let message = 'Set pen up: ' + Settings_1.SettingsManager.servoUpAngle().toFixed(2);
        this.queue(commands.CMD_PENUP + Settings_1.SettingsManager.servoUpAngle().toFixed(2) + ",END", message);
        // this.queue(commands.CMD_PENUP + "END", callback);
        if (servoUpTempoAfter > 0) {
            this.sendPause(servoUpTempoAfter, callback);
        }
    }
    sendPenDown(servoDownValue = Settings_1.SettingsManager.servoDownAngle(), servoDownTempoBefore = Settings_1.Settings.servo.delay.down.before, servoDownTempoAfter = Settings_1.Settings.servo.delay.down.after, callback = null) {
        if (servoDownTempoBefore > 0) {
            this.sendPause(servoDownTempoBefore);
        }
        let message = 'Set pen down: ' + Settings_1.SettingsManager.servoDownAngle().toFixed(2);
        this.queue(commands.CMD_PENDOWN + Settings_1.SettingsManager.servoDownAngle().toFixed(2) + ",END", message);
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
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = __webpack_require__(0);
const PenPlotter_1 = __webpack_require__(6);
class TipibotInterpreter extends PenPlotter_1.PenPlotter {
    constructor() {
        super(...arguments);
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
        return Math.round(servoValue);
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
/* 20 */
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
const Renderer_1 = __webpack_require__(16);
const Pen_1 = __webpack_require__(4);
const Plot_1 = __webpack_require__(5);
const Communication_1 = __webpack_require__(1);
const CommandDisplay_1 = __webpack_require__(9);
const GUI_1 = __webpack_require__(3);
const Console_1 = __webpack_require__(10);
const VisualFeedback_1 = __webpack_require__(7);
const CommeUnDessein_1 = __webpack_require__(11);
const Telescreen_1 = __webpack_require__(15);
const SVGSplitter_1 = __webpack_require__(14);
const FileManager_1 = __webpack_require__(12);
const LiveDrawing_1 = __webpack_require__(13);
let communication = null;
let container = null;
let renderer = null;
let gui;
let positionPreview = null;
let drawing = {
    scale: 1,
};
let w = window;
document.addEventListener("DOMContentLoaded", function (event) {
    function initialize() {
        dat.GUI.DEFAULT_WIDTH = 325;
        gui = new GUI_1.GUI({ autoPlace: false });
        let controllerConsole = new Console_1.Console();
        let commandDisplay = new CommandDisplay_1.CommandDisplay();
        commandDisplay.createGUI(controllerConsole.gui);
        controllerConsole.createGUI();
        let customContainer = document.getElementById('gui');
        customContainer.appendChild(gui.getDomElement());
        communication = new Communication_1.Communication(gui);
        Settings_1.settingsManager.createGUI(gui);
        Plot_1.SVGPlot.createGUI(gui);
        renderer = new Renderer_1.Renderer();
        communication.setTipibot(Tipibot_1.tipibot);
        Tipibot_1.tipibot.initialize();
        renderer.centerOnTipibot(Settings_1.Settings.tipibot);
        VisualFeedback_1.VisualFeedback.initialize();
        let pluginFolder = gui.addFolder('Plugins');
        let commeUnDessein = new CommeUnDessein_1.CommeUnDessein();
        commeUnDessein.createGUI(pluginFolder);
        let telescreen = new Telescreen_1.Telescreen();
        telescreen.createGUI(pluginFolder);
        let svgSplitter = new SVGSplitter_1.SVGSplitter();
        svgSplitter.createGUI(pluginFolder);
        let fileManager = new FileManager_1.FileManager();
        fileManager.createGUI(pluginFolder);
        let liveDrawing = new LiveDrawing_1.LiveDrawing();
        liveDrawing.createGUI(pluginFolder);
        liveDrawing.setRenderer(renderer);
        // debug
        w.tipibot = Tipibot_1.tipibot;
        w.settingsManager = Settings_1.settingsManager;
        w.gui = gui;
        w.GUI = GUI_1.GUI;
        w.renderer = renderer;
        w.communication = communication;
        w.commandDisplay = commandDisplay;
        w.visualFeedback = VisualFeedback_1.visualFeedback;
        w.SVGPlot = Plot_1.SVGPlot;
        w.commeUnDessein = commeUnDessein;
        w.telescreen = telescreen;
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
    }
    function eventWasOnGUI(event) {
        return $.contains(document.getElementById('gui'), event.target) || $.contains(document.getElementById('info'), event.target);
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