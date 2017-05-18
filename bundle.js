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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Draggable = (function () {
    function Draggable(item) {
        if (item === void 0) { item = null; }
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
        this.item = item;
        Draggable.draggables.push(this);
    }
    Draggable.prototype.drag = function (delta) {
        this.item.position = this.item.position.add(delta);
    };
    Draggable.prototype.getWorldPosition = function (event) {
        return paper.view.viewToProject(new paper.Point(event.clientX, event.clientY));
    };
    Draggable.prototype.mouseDown = function (event) {
        var position = this.getWorldPosition(event);
        if (this.item.bounds.contains(position)) {
            this.dragging = true;
            this.previousPosition = position.clone();
        }
    };
    Draggable.prototype.mouseMove = function (event) {
        var position = this.getWorldPosition(event);
        if (this.dragging) {
            this.drag(position.subtract(this.previousPosition));
            this.previousPosition = position.clone();
        }
    };
    Draggable.prototype.mouseStop = function (event) {
        this.dragging = false;
    };
    Draggable.prototype.mouseUp = function (event) {
        this.mouseStop(event);
    };
    Draggable.prototype.mouseLeave = function (event) {
        this.mouseStop(event);
    };
    return Draggable;
}());
Draggable.draggables = new Array();
exports.Draggable = Draggable;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tipibotHeight = 2020;
var tipibotWidth = 1780;
var paperHeight = 1220;
var paperWidth = 1780;
var homeX = 0;
var homeY = 388;
exports.Settings = {
    tipibot: {
        width: tipibotWidth,
        height: tipibotHeight,
        homeX: tipibotWidth / 2,
        homeY: paperHeight + homeY,
        speed: 1440
    },
    servo: {
        position: {
            up: 900,
            down: 1500,
        },
        delay: {
            up: 150,
            down: 150,
        }
    },
    drawArea: {
        x: homeX,
        y: homeY,
        width: paperWidth,
        height: paperHeight
    }
};
var SettingsManager = (function () {
    function SettingsManager() {
    }
    SettingsManager.getControllers = function () {
        var controllers = SettingsManager.tipibotFolder.__controllers;
        controllers = controllers.concat(SettingsManager.servoPositionFolder.__controllers);
        controllers = controllers.concat(SettingsManager.servoDelayFolder.__controllers);
        controllers = controllers.concat(SettingsManager.drawAreaFolder.__controllers);
        return controllers;
    };
    SettingsManager.createGUI = function (gui) {
        var loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='application/json'/>");
        var loadController = gui.add({ loadSettings: function () { loadDivJ.click(); } }, 'loadSettings');
        $(loadController.domElement).append(loadDivJ);
        loadDivJ.hide();
        loadDivJ.change(SettingsManager.handleFileSelect);
        gui.add(SettingsManager, 'saveSettings');
        SettingsManager.tipibotFolder = gui.addFolder('Tipibot');
        SettingsManager.tipibotFolder.add(exports.Settings.tipibot, 'width', 100, 10000);
        SettingsManager.tipibotFolder.add(exports.Settings.tipibot, 'height', 100, 10000);
        SettingsManager.tipibotFolder.add(exports.Settings.tipibot, 'homeX', 0, exports.Settings.tipibot.width);
        SettingsManager.tipibotFolder.add(exports.Settings.tipibot, 'homeY', 0, exports.Settings.tipibot.height);
        SettingsManager.tipibotFolder.add(exports.Settings.tipibot, 'speed', 0, 5000);
        SettingsManager.servoFolder = gui.addFolder('Servo');
        SettingsManager.servoPositionFolder = SettingsManager.servoFolder.addFolder('Position');
        SettingsManager.servoPositionFolder.add(exports.Settings.servo.position, 'up', 0, 3600);
        SettingsManager.servoPositionFolder.add(exports.Settings.servo.position, 'down', 0, 3600);
        SettingsManager.servoDelayFolder = SettingsManager.servoFolder.addFolder('Delay');
        SettingsManager.servoDelayFolder.add(exports.Settings.servo.delay, 'up', 0, 1000);
        SettingsManager.servoDelayFolder.add(exports.Settings.servo.delay, 'down', 0, 1000);
        SettingsManager.drawAreaFolder = gui.addFolder('DrawArea');
        SettingsManager.drawAreaFolder.add(exports.Settings.drawArea, 'x', 0, exports.Settings.tipibot.width);
        SettingsManager.drawAreaFolder.add(exports.Settings.drawArea, 'y', 0, exports.Settings.tipibot.height);
        SettingsManager.drawAreaFolder.add(exports.Settings.drawArea, 'width', 0, exports.Settings.tipibot.width);
        SettingsManager.drawAreaFolder.add(exports.Settings.drawArea, 'height', 0, exports.Settings.tipibot.height);
        var controllers = SettingsManager.getControllers();
        for (var _i = 0, controllers_1 = controllers; _i < controllers_1.length; _i++) {
            var controller = controllers_1[_i];
            controller.onChange(SettingsManager.settingChanged);
        }
    };
    SettingsManager.addTipibotToGUI = function (tipibot) {
        SettingsManager.tipibot = tipibot;
        var position = tipibot.getPosition();
        SettingsManager.xSlider = SettingsManager.tipibotFolder.add(position, 'x', 0, exports.Settings.tipibot.width).onChange(function (value) { tipibot.setX(value); });
        SettingsManager.ySlider = SettingsManager.tipibotFolder.add(position, 'y', 0, exports.Settings.tipibot.height).onChange(function (value) { tipibot.setY(value); });
    };
    SettingsManager.settingChanged = function (value) {
        if (value === void 0) { value = null; }
        SettingsManager.xSlider.max(exports.Settings.tipibot.width);
        SettingsManager.ySlider.max(exports.Settings.tipibot.height);
        SettingsManager.xSlider.setValue(exports.Settings.tipibot.homeX);
        SettingsManager.ySlider.setValue(exports.Settings.tipibot.homeY);
        for (var _i = 0, _a = SettingsManager.drawAreaFolder.__controllers.concat(SettingsManager.tipibotFolder.__controllers); _i < _a.length; _i++) {
            var controller = _a[_i];
            if (controller.property == 'x' || controller.property == 'width' || controller.property == 'homeX') {
                controller.max(exports.Settings.tipibot.width);
            }
            if (controller.property == 'y' || controller.property == 'height' || controller.property == 'homeX') {
                controller.max(exports.Settings.tipibot.height);
            }
        }
        SettingsManager.tipibot.settingsChanged();
    };
    SettingsManager.saveSettings = function () {
        var json = JSON.stringify(exports.Settings);
        var blob = new Blob([json], { type: "application/json" });
        saveAs(blob, "settings.json");
        localStorage.setItem('settings', json);
    };
    SettingsManager.updateSliders = function () {
        var controllers = SettingsManager.getControllers();
        for (var _i = 0, controllers_2 = controllers; _i < controllers_2.length; _i++) {
            var controller = controllers_2[_i];
            controller.updateDisplay();
        }
    };
    SettingsManager.copyObjectProperties = function (Target, Source) {
        for (var property in Target) {
            if (typeof (Target[property]) === 'object') {
                SettingsManager.copyObjectProperties(Target[property], Source[property]);
            }
            else {
                Target[property] = Source[property];
            }
        }
    };
    SettingsManager.onJsonLoad = function (event) {
        SettingsManager.copyObjectProperties(exports.Settings, JSON.parse(event.target.result));
        SettingsManager.settingChanged();
        SettingsManager.updateSliders();
    };
    SettingsManager.handleFileSelect = function (event) {
        var files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (var i = 0; i < files.length; i++) {
            var file = files.item(i);
            var reader = new FileReader();
            reader.onload = SettingsManager.onJsonLoad;
            reader.readAsText(file);
        }
    };
    SettingsManager.loadLocalStorage = function () {
        exports.Settings = JSON.parse(localStorage.getItem('settings'));
    };
    return SettingsManager;
}());
SettingsManager.tipibotFolder = null;
SettingsManager.servoFolder = null;
SettingsManager.servoPositionFolder = null;
SettingsManager.servoDelayFolder = null;
SettingsManager.drawAreaFolder = null;
SettingsManager.xSlider = null;
SettingsManager.ySlider = null;
exports.SettingsManager = SettingsManager;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Settings_1 = __webpack_require__(1);
var Communication = (function () {
    function Communication(gui) {
        exports.communication = this;
        this.serialPort = '';
        this.socket = null;
        this.gui = gui;
        this.portController = null;
        this.serialPorts = [];
        this.commandQueue = [];
        this.connectToArduinoCreateAgent();
    }
    Communication.prototype.connectToArduinoCreateAgent = function () {
        // Find proper websocket port with http requests info
        // It will listen to http and websocket connections on a range of ports from 8990 to 9000.
        var _this = this;
        var portNumber = 8990;
        var connectionSuccess = function (data, textStatus, jqXHR) {
            console.log("connection to arduino-create-agent success");
            console.log("textStatus: ");
            console.log(textStatus);
            console.log(data);
            if (data.hasOwnProperty('ws')) {
                _this.openWebsocketConnection(data.ws);
            }
        };
        var connectionError = function (jqXHR, textStatus, errorThrown) {
            console.log("connection to arduino-create-agent error");
            console.log("errorThrown: ");
            console.log(errorThrown);
            console.log("textStatus: ");
            console.log(textStatus);
            portNumber++;
            if (portNumber > 9000) {
                console.log("Error: impossible to connect to arduino-create-agent");
                return;
            }
            connectArduinoCreateAgent();
        };
        var connectArduinoCreateAgent = function () {
            return $.ajax({ url: "http://localhost:" + portNumber + "/info" }).done(connectionSuccess).fail(connectionError);
        };
        connectArduinoCreateAgent();
        // this.openWebsocketConnection("ws://localhost:8991")
    };
    Communication.prototype.serialConnectionPortChanged = function (value) {
        if (value == 'Disconnected') {
            this.socket.emit('command', 'close ' + this.serialPort);
        }
        else if (value == 'Refresh') {
            this.serialPorts = [];
            this.socket.emit('command', 'list');
        }
        else {
            this.serialPort = value;
            this.socket.emit('command', 'open ' + value + ' 115200');
        }
    };
    Communication.prototype.initializeSerialConnectionPorts = function (data) {
        var _this = this;
        for (var _i = 0, _a = data.Ports; _i < _a.length; _i++) {
            var port = _a[_i];
            if (this.serialPorts.indexOf(port.Name) < 0) {
                this.serialPorts.push(port.Name);
            }
        }
        var portNames = ['Disconnected', 'Refresh'].concat(this.serialPorts);
        if (this.portController == null) {
            this.portController = this.gui.add({ 'port': 'Disconnected' }, 'port');
        }
        else {
            this.portController = this.portController.options(portNames);
        }
        this.portController.onFinishChange(function (value) { return _this.serialConnectionPortChanged(value); });
    };
    Communication.prototype.checkSerialConnection = function (event) {
        if (event.data.hasOwnProperty('Cmd')) {
            console.log(event.data.Cmd);
        }
        else {
            console.log('Unknown response: ', event);
        }
    };
    Communication.prototype.openWebsocketConnection = function (websocketPort) {
        var _this = this;
        this.socket = io(websocketPort);
        this.socket.on('connect', function (response) {
            console.log('connect response: ', response);
            // this.socket.emit('command', 'log on')	
            _this.socket.emit('command', 'list');
        });
        // window.ws = this.socket
        this.socket.on('message', function (message) {
            var data = null;
            try {
                data = JSON.parse(message);
            }
            catch (e) {
                return;
            }
            // List serial ports response (list):
            if (data.hasOwnProperty('Ports') && data.hasOwnProperty('Network')) {
                _this.initializeSerialConnectionPorts(data);
                return;
            }
            // Command responses:
            if (data.hasOwnProperty('Cmd')) {
                switch (data.Cmd) {
                    case 'Open':
                        console.log('Port: ' + data.Port);
                        console.log(data.Desc);
                        break;
                    case 'OpenFail':
                        console.log('Port: ' + data.Port);
                        console.log(data.Desc);
                        break;
                    case 'Close':
                        console.log('Port: ' + data.Port);
                        console.log(data.Desc);
                        break;
                    case 'Queued':
                        console.log('Queued:');
                        console.log('QCnt: ' + data.QCnt);
                        console.log('Ids: ', data.Ids);
                        console.log('D: ', data.D);
                        console.log('Port: ' + data.Port);
                        break;
                    case 'Write':
                        console.log('Write:');
                        console.log('QCnt: ' + data.QCnt);
                        console.log('Ids: ', data.Ids);
                        console.log('P: ' + data.P);
                        _this.messageReceived();
                        break;
                    case 'CompleteFake':
                        console.log('CompleteFake:');
                        console.log('QCnt: ' + data.QCnt);
                        console.log('Ids: ', data.Ids);
                        console.log('P: ' + data.P);
                        break;
                    default:
                        console.error('Received unknown command: ' + data.Cmd);
                        break;
                }
            }
            else if (data.hasOwnProperty('Error')) {
                console.error(data.Error);
            }
            else if (data.hasOwnProperty('D')) {
                console.log('Serial output: ', data.D);
            }
        });
        return;
    };
    Communication.prototype.send = function (data) {
        this.socket.emit('command', 'send ' + this.serialPort + ' ' + data);
    };
    Communication.prototype.messageReceived = function () {
        if (this.commandQueue.length > 0) {
            var command = this.commandQueue.shift();
            command.callback();
            this.send(this.commandQueue[0].data);
        }
    };
    Communication.prototype.queue = function (data, callback) {
        if (callback === void 0) { callback = null; }
        if (this.socket == null) {
            return;
        }
        this.commandQueue.push({ data: data, callback: callback });
        if (this.commandQueue.length == 1) {
            this.send(data);
        }
    };
    Communication.prototype.clearQueue = function () {
        this.commandQueue = [];
    };
    Communication.prototype.sendSetPosition = function (point) {
        this.queue('G92 X' + point.x + ' Y' + point.y + '\n');
    };
    Communication.prototype.sendMoveDirect = function (point, callback) {
        if (callback === void 0) { callback = null; }
        this.queue('G0 X' + point.x + ' Y' + point.y + '\n', callback);
    };
    Communication.prototype.sendMoveLinear = function (point, callback) {
        if (callback === void 0) { callback = null; }
        this.queue('G1 X' + point.x + ' Y' + point.y + '\n', callback);
    };
    Communication.prototype.sendSpeed = function (speed) {
        this.queue('G0 F' + speed + '\n');
    };
    Communication.prototype.sendTipibotSpecs = function (tipibotWidth, stepsPerRev, mmPerRev) {
        this.queue('M4 X' + tipibotWidth + ' S' + stepsPerRev + ' P' + mmPerRev + '\n');
    };
    Communication.prototype.sendPause = function (delay) {
        this.queue('G4 P' + delay + '\n');
    };
    Communication.prototype.sendMotorOff = function () {
        this.queue('M84\n');
    };
    Communication.prototype.sendPenState = function (servoValue, servoTempo) {
        if (servoTempo === void 0) { servoTempo = 0; }
        this.queue('G4 P' + servoTempo + '\n');
        this.queue('M340 P3 S' + servoValue + '\n');
        this.queue('G4 P0\n');
    };
    Communication.prototype.sendPenUp = function (servoUpValue, servoUpTempo) {
        if (servoUpValue === void 0) { servoUpValue = Settings_1.Settings.servo.position.up; }
        if (servoUpTempo === void 0) { servoUpTempo = Settings_1.Settings.servo.delay.up; }
        this.sendPenState(servoUpValue, servoUpTempo);
    };
    Communication.prototype.sendPenDown = function (servoDownValue, servoDownTempo) {
        if (servoDownValue === void 0) { servoDownValue = Settings_1.Settings.servo.position.down; }
        if (servoDownTempo === void 0) { servoDownTempo = Settings_1.Settings.servo.delay.down; }
        this.sendPenState(servoDownValue, servoDownTempo);
    };
    return Communication;
}());
exports.Communication = Communication;
exports.communication = null;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Communication_1 = __webpack_require__(2);
var Settings_1 = __webpack_require__(1);
var Tipibot = (function () {
    function Tipibot() {
        this.isPenUp = true;
    }
    Tipibot.prototype.tipibotRectangle = function () {
        return new paper.Rectangle(0, 0, Settings_1.Settings.tipibot.width, Settings_1.Settings.tipibot.height);
    };
    Tipibot.prototype.paperRectangle = function () {
        return new paper.Rectangle(Settings_1.Settings.tipibot.width / 2 - Settings_1.Settings.drawArea.width / 2 + Settings_1.Settings.drawArea.x, Settings_1.Settings.drawArea.y, Settings_1.Settings.drawArea.width, Settings_1.Settings.drawArea.height);
    };
    Tipibot.prototype.initialize = function (renderer) {
        this.area = renderer.createRectangle(this.tipibotRectangle());
        this.paper = renderer.createRectangle(this.paperRectangle());
        this.motorLeft = renderer.createCircle(0, 0, 50, 24);
        this.motorRight = renderer.createCircle(Settings_1.Settings.tipibot.width, 0, 50, 24);
        this.pen = renderer.createPen(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY, Settings_1.Settings.tipibot.width, Communication_1.communication);
        Settings_1.SettingsManager.addTipibotToGUI(this);
    };
    Tipibot.prototype.settingsChanged = function () {
        this.area.updateRectangle(this.tipibotRectangle());
        this.paper.updateRectangle(this.paperRectangle());
        this.motorRight.update(Settings_1.Settings.tipibot.width, 0, 50);
        this.pen.settingsChanged();
    };
    Tipibot.prototype.getPosition = function () {
        return this.pen.getPosition();
    };
    Tipibot.prototype.setX = function (x) {
        var p = this.getPosition();
        this.setPosition(new paper.Point(x, p.y));
    };
    Tipibot.prototype.setY = function (y) {
        var p = this.getPosition();
        this.setPosition(new paper.Point(p.x, y));
    };
    Tipibot.prototype.setPosition = function (point) {
        this.pen.setPosition(point);
        Communication_1.communication.sendSetPosition(point);
    };
    Tipibot.prototype.moveDirect = function (point, callback) {
        if (callback === void 0) { callback = null; }
        Communication_1.communication.sendMoveDirect(point, callback);
    };
    Tipibot.prototype.moveLinear = function (point, callback) {
        if (callback === void 0) { callback = null; }
        Communication_1.communication.sendMoveLinear(point, callback);
    };
    Tipibot.prototype.setSpeed = function (speed) {
        Communication_1.communication.sendSpeed(speed);
    };
    Tipibot.prototype.tipibotSpecs = function (tipibotWidth, stepsPerRev, mmPerRev) {
        Communication_1.communication.sendTipibotSpecs(tipibotWidth, stepsPerRev, mmPerRev);
    };
    Tipibot.prototype.pause = function (delay) {
        Communication_1.communication.sendPause(delay);
    };
    Tipibot.prototype.motorOff = function () {
        Communication_1.communication.sendMotorOff();
    };
    Tipibot.prototype.penUp = function (servoUpValue, servoUpTempo) {
        if (servoUpValue === void 0) { servoUpValue = Settings_1.Settings.servo.position.up; }
        if (servoUpTempo === void 0) { servoUpTempo = Settings_1.Settings.servo.delay.up; }
        if (!this.isPenUp) {
            Communication_1.communication.sendPenUp(servoUpValue, servoUpTempo);
        }
    };
    Tipibot.prototype.penDown = function (servoDownValue, servoDownTempo) {
        if (servoDownValue === void 0) { servoDownValue = Settings_1.Settings.servo.position.down; }
        if (servoDownTempo === void 0) { servoDownTempo = Settings_1.Settings.servo.delay.down; }
        if (this.isPenUp) {
            Communication_1.communication.sendPenUp(servoDownValue, servoDownTempo);
        }
    };
    Tipibot.prototype.goHome = function () {
        this.penUp();
        this.moveDirect(new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY));
    };
    return Tipibot;
}());
exports.Tipibot = Tipibot;
exports.tipibot = new Tipibot();


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Tipibot_1 = __webpack_require__(3);
var Draggable_1 = __webpack_require__(0);
var Plot = (function (_super) {
    __extends(Plot, _super);
    function Plot() {
        return _super.call(this) || this;
    }
    Plot.createGUI = function (gui) {
        gui.add({ plot: function () { console.log('plot'); } }, 'plot');
    };
    Plot.prototype.plot = function () {
        Plot.currentPlot.plot();
    };
    return Plot;
}(Draggable_1.Draggable));
Plot.currentPlot = null;
exports.Plot = Plot;
var SVGPlot = (function (_super) {
    __extends(SVGPlot, _super);
    function SVGPlot(svg) {
        var _this = _super.call(this) || this;
        Plot.currentPlot = _this;
        SVGPlot.svgPlot = _this;
        _this.svgItem = svg;
        paper.project.layers[0].addChild(svg);
        _this.flatten(svg, 20);
        _this.item = _this.svgItem;
        return _this;
    }
    SVGPlot.onImageLoad = function (event) {
        var svgPlot = new SVGPlot(paper.project.importSVG(event.target.result));
    };
    SVGPlot.handleFileSelect = function (event) {
        var files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (var i = 0; i < files.length; i++) {
            var file = files.item(i);
            var imageType = /^image\//;
            if (!imageType.test(file.type)) {
                continue;
            }
            var reader = new FileReader();
            reader.onload = SVGPlot.onImageLoad;
            reader.readAsText(file);
        }
    };
    SVGPlot.createGUI = function (gui) {
        var loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]' accept='image/svg+xml'/>");
        var loadController = gui.add({ loadSVG: function () { loadDivJ.click(); } }, 'loadSVG');
        $(loadController.domElement).append(loadDivJ);
        loadDivJ.hide();
        loadDivJ.change(SVGPlot.handleFileSelect);
        var scaleController = gui.add(SVGPlot, 'scale', 0.1, 5);
        scaleController.onChange(function (value) {
            SVGPlot.svgPlot.svgItem.scaling = new paper.Point(value, value);
        });
    };
    SVGPlot.prototype.flatten = function (item, flatness) {
        if (item.className == 'Path' || item.className == 'CompoundPath') {
            item.flatten(flatness);
        }
        else if (item.className == 'Shape') {
            item.toPath(true).flatten(flatness);
            item.parent.addChildren(item.children);
            item.remove();
        }
        if (item.children == null) {
            return;
        }
        for (var _i = 0, _a = item.children; _i < _a.length; _i++) {
            var child = _a[_i];
            this.flatten(child, flatness);
        }
    };
    SVGPlot.prototype.mouseDown = function (event) {
        var hitResult = paper.project.hitTest(this.getWorldPosition(event));
        if (hitResult != null && hitResult.item == Tipibot_1.tipibot.pen.item) {
            return;
        }
        _super.prototype.mouseDown.call(this, event);
    };
    SVGPlot.prototype.plot = function () {
        this.plotItem(this.svgItem);
        Tipibot_1.tipibot.goHome();
    };
    SVGPlot.prototype.plotItem = function (item) {
        if (item.className == 'Path' || item.className == 'CompoundPath') {
            var path = item;
            for (var _i = 0, _a = path.segments; _i < _a.length; _i++) {
                var segment = _a[_i];
                if (segment == path.firstSegment) {
                    if (!Tipibot_1.tipibot.getPosition().equals(segment.point)) {
                        Tipibot_1.tipibot.penUp();
                        Tipibot_1.tipibot.moveDirect(segment.point);
                    }
                    Tipibot_1.tipibot.penDown();
                }
                else {
                    Tipibot_1.tipibot.moveLinear(segment.point);
                }
            }
        }
        else if (item.className == 'Shape') {
            console.error('A shape was found in the SVG to plot.');
        }
        if (item.children == null) {
            return;
        }
        for (var _b = 0, _c = item.children; _b < _c.length; _b++) {
            var child = _c[_b];
            this.plotItem(child);
        }
    };
    SVGPlot.prototype.plotItemStep = function () {
        var item = this.currentItem;
        // if we didn't already plot the item: plot it along with its children
        if (item.data.plotted == null || !item.data.plotted) {
            // plot path
            if (item.className == 'Path' || item.className == 'CompoundPath') {
                var path = item;
                var segment = this.currentSegment != null ? this.currentSegment : path.firstSegment;
                if (segment == path.firstSegment) {
                    if (!Tipibot_1.tipibot.getPosition().equals(segment.point)) {
                        Tipibot_1.tipibot.penUp();
                        Tipibot_1.tipibot.moveDirect(segment.point, this.plotItemStep);
                    }
                    Tipibot_1.tipibot.penDown();
                }
                else {
                    Tipibot_1.tipibot.moveLinear(segment.point, this.plotItemStep);
                }
                // go to next segment
                this.currentSegment = segment.next != path.firstSegment ? segment.next : null;
            }
            else if (item.className == 'Shape') {
                console.error('A shape was found in the SVG to plot.');
            }
            // plot children
            if (item.children.length > 0) {
                this.currentItem = item.firstChild;
                this.currentSegment = null;
                this.plotItemStep();
                return;
            }
            item.data.plotted = true;
        }
        // plot next siblings if any, or go up to parent
        if (item != this.svgItem && item.parent != null && item.index < item.parent.children.length - 1) {
            if (item.index < item.parent.children.length - 1) {
                this.currentItem = item.nextSibling;
                this.currentSegment = null;
                this.plotItemStep();
                return;
            }
            else {
                this.currentItem = item.parent;
                this.currentSegment = null;
                this.plotItemStep();
                return;
            }
        }
        if (item == this.svgItem) {
            this.clearData(item);
        }
    };
    SVGPlot.prototype.clearData = function (item) {
        item.data = null;
        if (item.children) {
            for (var _i = 0, _a = item.children; _i < _a.length; _i++) {
                var child = _a[_i];
                this.clearData(child);
            }
        }
    };
    return SVGPlot;
}(Plot));
SVGPlot.pen = null;
SVGPlot.svgPlot = null;
SVGPlot.scale = 1;
exports.SVGPlot = SVGPlot;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Shapes_1 = __webpack_require__(8);
var Pen_1 = __webpack_require__(7);
var Renderer = (function () {
    function Renderer() {
    }
    Renderer.prototype.centerOnTipibot = function (tipibot) {
    };
    Renderer.prototype.getDomElement = function () {
        return null;
    };
    Renderer.prototype.createRectangle = function (rectangle) {
        return null;
    };
    Renderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return null;
    };
    Renderer.prototype.createPen = function (x, y, tipibotWidth, communication) {
        return null;
    };
    Renderer.prototype.createDrawingLayer = function () {
    };
    Renderer.prototype.windowResize = function () {
    };
    Renderer.prototype.mouseDown = function (event) {
    };
    Renderer.prototype.mouseMove = function (event) {
    };
    Renderer.prototype.mouseUp = function (event) {
    };
    Renderer.prototype.mouseLeave = function (event) {
    };
    Renderer.prototype.mouseWheel = function (event) {
    };
    Renderer.prototype.render = function () {
    };
    return Renderer;
}());
exports.Renderer = Renderer;
var PaperRenderer = (function () {
    function PaperRenderer() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        document.body.appendChild(this.canvas);
        paper.setup(this.canvas);
        this.tipibotLayer = new paper.Layer();
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
    }
    PaperRenderer.prototype.centerOnTipibot = function (tipibot) {
        var margin = 100;
        var ratio = Math.max((tipibot.width + margin) / window.innerWidth, (tipibot.height + margin) / window.innerHeight);
        paper.view.zoom = 1 / ratio;
        console.log(paper.view.zoom);
        paper.view.setCenter(new paper.Point(tipibot.width / 2, tipibot.height / 2));
    };
    PaperRenderer.prototype.getDomElement = function () {
        return null;
    };
    PaperRenderer.prototype.createRectangle = function (rectangle) {
        return new Shapes_1.PaperRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.tipibotLayer);
    };
    PaperRenderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return new Shapes_1.PaperCircle(x, y, radius, this.tipibotLayer);
    };
    PaperRenderer.prototype.createPen = function (x, y, tipibotWidth, communication) {
        var pen = new Pen_1.PaperPen(communication);
        pen.initialize(x, y, tipibotWidth, this.tipibotLayer);
        return pen;
    };
    PaperRenderer.prototype.createDrawingLayer = function () {
        this.drawingLayer = new paper.Layer();
        this.drawingLayer.moveBelow(this.tipibotLayer);
    };
    PaperRenderer.prototype.windowResize = function () {
        var canvasJ = $(this.canvas);
        canvasJ.width(window.innerWidth);
        canvasJ.height(window.innerHeight);
        paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);
    };
    PaperRenderer.prototype.mouseDown = function (event) {
        this.dragging = true;
        this.previousPosition = new paper.Point(event.clientX, event.clientY);
    };
    PaperRenderer.prototype.mouseMove = function (event) {
        if (event.buttons == 4 && this.dragging) {
            var position = new paper.Point(event.clientX, event.clientY);
            paper.view.translate(position.subtract(this.previousPosition).divide(paper.view.zoom));
            console.log(paper.view.center);
            paper.view.draw();
            this.previousPosition.x = position.x;
            this.previousPosition.y = position.y;
        }
    };
    PaperRenderer.prototype.mouseUp = function (event) {
        this.dragging = false;
    };
    PaperRenderer.prototype.mouseLeave = function (event) {
        this.dragging = false;
    };
    PaperRenderer.prototype.mouseWheel = function (event) {
        paper.view.zoom = Math.max(0.1, Math.min(5, paper.view.zoom + event.deltaY / 500));
        console.log(paper.view.zoom);
        event.preventDefault();
    };
    PaperRenderer.prototype.render = function () {
    };
    return PaperRenderer;
}());
exports.PaperRenderer = PaperRenderer;
var ThreeRenderer = (function (_super) {
    __extends(ThreeRenderer, _super);
    function ThreeRenderer() {
        var _this = _super.call(this) || this;
        _this.dragging = false;
        _this.previousPosition = new THREE.Vector2();
        _this.camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -500, 1000);
        _this.scene = new THREE.Scene();
        _this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        var ambientLight = new THREE.AmbientLight(Math.random() * 0x10);
        _this.scene.add(ambientLight);
        _this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
        _this.renderer.setPixelRatio(window.devicePixelRatio);
        _this.renderer.setSize(window.innerWidth, window.innerHeight);
        var container = document.createElement('div');
        document.body.appendChild(container);
        container.appendChild(_this.getDomElement());
        return _this;
    }
    ThreeRenderer.prototype.centerOnTipibot = function (tipibot) {
        this.setCameraCenterTo(new THREE.Vector3(tipibot.width / 2, tipibot.height / 2, 0));
        var margin = 100;
        var ratio = Math.max((tipibot.width + margin) / window.innerWidth, (tipibot.height + margin) / window.innerHeight);
        this.camera.zoom = 1 / ratio;
        this.camera.updateProjectionMatrix();
    };
    ThreeRenderer.prototype.getDomElement = function () {
        return this.renderer.domElement;
    };
    ThreeRenderer.prototype.createRectangle = function (rectangle) {
        return new Shapes_1.ThreeRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.scene, this.lineMaterial);
    };
    ThreeRenderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return new Shapes_1.ThreeCircle(x, y, radius, nSegments, this.scene, this.lineMaterial);
    };
    ThreeRenderer.prototype.createPen = function (x, y, tipibotWidth, communication) {
        var pen = new Pen_1.ThreePen(communication);
        pen.initialize(x, y, tipibotWidth, this.camera, this.scene, this.lineMaterial);
        return pen;
    };
    ThreeRenderer.prototype.setCameraCenterTo = function (point) {
        this.camera.position.x = point.x - window.innerWidth / 2;
        this.camera.position.y = point.y - window.innerHeight / 2;
        this.camera.position.z = point.z;
    };
    ThreeRenderer.prototype.windowResize = function () {
        this.camera.left = 0;
        this.camera.right = window.innerWidth;
        this.camera.top = 0;
        this.camera.bottom = window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    ThreeRenderer.prototype.mouseDown = function (event) {
        this.dragging = true;
        this.previousPosition.x = event.clientX;
        this.previousPosition.y = event.clientY;
    };
    ThreeRenderer.prototype.mouseMove = function (event) {
        if (event.buttons == 4 && this.dragging) {
            this.camera.position.x += (this.previousPosition.x - event.clientX) / this.camera.zoom;
            this.camera.position.y += (this.previousPosition.y - event.clientY) / this.camera.zoom;
            this.previousPosition.x = event.clientX;
            this.previousPosition.y = event.clientY;
        }
    };
    ThreeRenderer.prototype.mouseUp = function (event) {
        this.dragging = false;
    };
    ThreeRenderer.prototype.mouseLeave = function (event) {
        this.dragging = false;
    };
    ThreeRenderer.prototype.mouseWheel = function (event) {
        this.camera.zoom += (event.deltaY / 500);
        this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom));
        this.camera.updateProjectionMatrix();
        event.preventDefault();
    };
    ThreeRenderer.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    return ThreeRenderer;
}(Renderer));
exports.ThreeRenderer = ThreeRenderer;


/***/ }),
/* 6 */
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
var Settings_1 = __webpack_require__(1);
var Tipibot_1 = __webpack_require__(3);
var Renderers_1 = __webpack_require__(5);
var Plot_1 = __webpack_require__(4);
var Communication_1 = __webpack_require__(2);
var Draggable_1 = __webpack_require__(0);
var communication = null;
var container = null;
var renderer;
var drawing = {
    scale: 1,
};
document.addEventListener("DOMContentLoaded", function (event) {
    function initialize() {
        var gui = new dat.GUI();
        Settings_1.SettingsManager.createGUI(gui);
        Plot_1.SVGPlot.createGUI(gui);
        Plot_1.Plot.createGUI(gui);
        gui.add(Settings_1.Settings.tipibot, 'speed', 0, 2000);
        communication = new Communication_1.Communication(gui);
        renderer = new Renderers_1.PaperRenderer();
        Tipibot_1.tipibot.initialize(renderer);
        renderer.centerOnTipibot(Settings_1.Settings.tipibot);
        renderer.createDrawingLayer();
    }
    initialize();
    var animate = function () {
        requestAnimationFrame(animate);
        renderer.render();
    };
    animate();
    function windowResize() {
        renderer.windowResize();
    }
    function getWorldPosition(event) {
        return paper.view.viewToProject(new paper.Point(event.clientX, event.clientY));
    }
    function mouseDown(event) {
        for (var _i = 0, _a = Draggable_1.Draggable.draggables; _i < _a.length; _i++) {
            var draggable = _a[_i];
            draggable.mouseDown(event);
        }
        renderer.mouseDown(event);
    }
    function mouseMove(event) {
        for (var _i = 0, _a = Draggable_1.Draggable.draggables; _i < _a.length; _i++) {
            var draggable = _a[_i];
            draggable.mouseMove(event);
        }
        renderer.mouseMove(event);
    }
    function mouseUp(event) {
        for (var _i = 0, _a = Draggable_1.Draggable.draggables; _i < _a.length; _i++) {
            var draggable = _a[_i];
            draggable.mouseUp(event);
        }
        renderer.mouseUp(event);
    }
    function mouseLeave(event) {
        for (var _i = 0, _a = Draggable_1.Draggable.draggables; _i < _a.length; _i++) {
            var draggable = _a[_i];
            draggable.mouseLeave(event);
        }
        renderer.mouseLeave(event);
    }
    function mouseWheel(event) {
        renderer.mouseWheel(event);
    }
    window.addEventListener('resize', windowResize, false);
    document.body.addEventListener('mousedown', mouseDown);
    document.body.addEventListener('mousemove', mouseMove);
    document.body.addEventListener('mouseup', mouseUp);
    document.body.addEventListener('mouseleave', mouseLeave);
    addWheelListener(document.body, mouseWheel);
});


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Draggable_1 = __webpack_require__(0);
var Settings_1 = __webpack_require__(1);
var RADIUS = 20;
var Pen = (function (_super) {
    __extends(Pen, _super);
    function Pen(communication) {
        var _this = _super.call(this, null) || this;
        _this.communication = communication;
        return _this;
    }
    Pen.prototype.settingsChanged = function () {
        this.setPosition(new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY));
    };
    Pen.prototype.getPosition = function () {
        return null;
    };
    Pen.prototype.setPosition = function (point) {
    };
    Pen.prototype.mouseStop = function (event) {
        if (this.dragging) {
            this.communication.sendMoveDirect(this.getWorldPosition(event));
        }
        _super.prototype.mouseStop.call(this, event);
    };
    return Pen;
}(Draggable_1.Draggable));
exports.Pen = Pen;
var PaperPen = (function (_super) {
    __extends(PaperPen, _super);
    function PaperPen(communication) {
        return _super.call(this, communication) || this;
    }
    PaperPen.prototype.initialize = function (x, y, tipibotWidth, layer) {
        if (layer === void 0) { layer = null; }
        this.circle = paper.Path.Circle(new paper.Point(x, y), RADIUS);
        this.circle.strokeWidth = 1;
        this.circle.strokeColor = 'black';
        this.circle.fillColor = 'black';
        this.item = this.circle;
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(new paper.Point(x, y));
        this.lines.add(new paper.Point(tipibotWidth, 0));
        this.lines.strokeWidth = 1;
        this.lines.strokeColor = 'black';
        this.previousPosition = new paper.Point(0, 0);
        if (layer) {
            layer.addChild(this.circle);
            layer.addChild(this.lines);
        }
    };
    PaperPen.prototype.getPosition = function () {
        return this.circle.position;
    };
    PaperPen.prototype.setPosition = function (point) {
        this.circle.position = point;
        this.lines.segments[1].point = point;
    };
    PaperPen.prototype.drag = function (delta) {
        this.setPosition(this.circle.position.add(delta));
    };
    PaperPen.prototype.mouseStop = function (event) {
        if (this.dragging) {
            this.setPosition(this.circle.position);
        }
        _super.prototype.mouseStop.call(this, event);
    };
    PaperPen.prototype.settingsChanged = function () {
        this.lines.segments[2].point.x = Settings_1.Settings.tipibot.width;
        _super.prototype.settingsChanged.call(this);
    };
    return PaperPen;
}(Pen));
exports.PaperPen = PaperPen;
var ThreePen = (function (_super) {
    __extends(ThreePen, _super);
    function ThreePen(communication) {
        return _super.call(this, communication) || this;
    }
    ThreePen.prototype.initialize = function (x, y, tipibotWidth, camera, scene, lineMat) {
        if (scene === void 0) { scene = null; }
        if (lineMat === void 0) { lineMat = null; }
        var geometry = new THREE.CircleGeometry(RADIUS, 32);
        var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.circle = new THREE.Mesh(geometry, material);
        this.circle.position.x = x;
        this.circle.position.y = y;
        this.circle.rotation.x = Math.PI;
        var lineGeometry = new THREE.Geometry();
        var lineMaterial = lineMat != null ? lineMat : new THREE.LineBasicMaterial({ color: 0xffffff });
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0), new THREE.Vector3(tipibotWidth, 0, 0));
        this.lines = new THREE.Line(lineGeometry, lineMaterial);
        this.camera = camera;
        if (scene) {
            scene.add(this.lines);
            scene.add(this.circle);
        }
    };
    ThreePen.prototype.getPosition = function () {
        return this.vectorToPoint(this.circle.position);
    };
    ThreePen.prototype.setPosition = function (point) {
        var position = this.pointToVector(point);
        this.circle.position.copy(position);
        this.lines.geometry.vertices[1].copy(position);
        this.lines.geometry.verticesNeedUpdate = true;
    };
    ThreePen.prototype.settingsChanged = function () {
        this.lines.geometry.vertices[2].x = Settings_1.Settings.tipibot.width;
        _super.prototype.settingsChanged.call(this);
    };
    ThreePen.prototype.pointToVector = function (point) {
        return new THREE.Vector3(point.x, point.y, 0);
    };
    ThreePen.prototype.vectorToPoint = function (point) {
        return new paper.Point(point.x, point.y);
    };
    ThreePen.prototype.mouseDown = function (event) {
        var position = this.getWorldPosition(event);
        if (position.getDistance(new paper.Point(this.circle.position.x, this.circle.position.y), true) < RADIUS * RADIUS) {
            this.dragging = true;
            this.previousPosition = position.clone();
        }
    };
    ThreePen.prototype.mouseMove = function (event) {
        var position = this.getWorldPosition(event);
        if (this.dragging) {
            var circlePosition = this.vectorToPoint(this.circle.position);
            this.setPosition(circlePosition.add(position.subtract(this.previousPosition)));
            this.previousPosition = position.clone();
        }
    };
    ThreePen.prototype.mouseStop = function (event) {
        if (this.dragging) {
            this.communication.sendMoveDirect(this.getWorldPosition(event));
        }
        this.dragging = false;
    };
    ThreePen.prototype.mouseUp = function (event) {
        this.mouseStop(event);
    };
    ThreePen.prototype.mouseLeave = function (event) {
        this.mouseStop(event);
    };
    return ThreePen;
}(Pen));
exports.ThreePen = ThreePen;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Rectangle = (function () {
    function Rectangle() {
    }
    Rectangle.prototype.update = function (x, y, width, height) {
    };
    Rectangle.prototype.updateRectangle = function (rectangle) {
        this.update(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    };
    return Rectangle;
}());
exports.Rectangle = Rectangle;
var Circle = (function () {
    function Circle() {
    }
    Circle.prototype.update = function (x, y, radius) {
    };
    return Circle;
}());
exports.Circle = Circle;
var PaperRectangle = (function (_super) {
    __extends(PaperRectangle, _super);
    function PaperRectangle(x, y, width, height, layer) {
        if (layer === void 0) { layer = null; }
        var _this = _super.call(this) || this;
        _this.update(x, y, width, height, layer);
        return _this;
    }
    PaperRectangle.prototype.update = function (x, y, width, height, layer) {
        if (layer === void 0) { layer = null; }
        if (layer == null && this.path != null) {
            layer = this.path.parent;
        }
        if (this.path != null) {
            this.path.remove();
        }
        var position = new paper.Point(x, y);
        var size = new paper.Size(width, height);
        this.path = paper.Path.Rectangle(position, size);
        this.path.strokeWidth = 1;
        this.path.strokeColor = 'black';
        if (layer) {
            layer.addChild(this.path);
        }
    };
    return PaperRectangle;
}(Rectangle));
exports.PaperRectangle = PaperRectangle;
var PaperCircle = (function (_super) {
    __extends(PaperCircle, _super);
    function PaperCircle(x, y, radius, layer) {
        if (layer === void 0) { layer = null; }
        var _this = _super.call(this) || this;
        _this.update(x, y, radius, layer);
        return _this;
    }
    PaperCircle.prototype.update = function (x, y, radius, layer) {
        if (layer === void 0) { layer = null; }
        if (layer == null && this.path != null) {
            layer = this.path.parent;
        }
        if (this.path != null) {
            this.path.remove();
        }
        var position = new paper.Point(x, y);
        this.path = paper.Path.Circle(position, radius);
        this.path.strokeWidth = 1;
        this.path.strokeColor = 'black';
        if (layer) {
            layer.addChild(this.path);
        }
    };
    return PaperCircle;
}(Circle));
exports.PaperCircle = PaperCircle;
var ThreeRectangle = (function (_super) {
    __extends(ThreeRectangle, _super);
    function ThreeRectangle(x, y, width, height, scene, material) {
        if (material === void 0) { material = null; }
        var _this = _super.call(this) || this;
        var geometry = new THREE.Geometry();
        var mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        _this.line = new THREE.Line(geometry, mat);
        geometry.vertices.push(new THREE.Vector3(x, y, 0), new THREE.Vector3(x + width, y, 0), new THREE.Vector3(x + width, y + height, 0), new THREE.Vector3(x, y + height, 0), new THREE.Vector3(x, y, 0));
        scene.add(_this.line);
        return _this;
    }
    ThreeRectangle.prototype.update = function (x, y, width, height) {
        var x2 = x + width;
        var y2 = y + height;
        var geometry = this.line.geometry;
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
    };
    return ThreeRectangle;
}(Rectangle));
exports.ThreeRectangle = ThreeRectangle;
var ThreeCircle = (function (_super) {
    __extends(ThreeCircle, _super);
    function ThreeCircle(x, y, radius, nSegments, scene, material) {
        if (nSegments === void 0) { nSegments = 12; }
        if (material === void 0) { material = null; }
        var _this = _super.call(this) || this;
        _this.scene = scene;
        _this.update(x, y, radius, nSegments, material);
        return _this;
    }
    ThreeCircle.prototype.update = function (x, y, radius, nSegments, material) {
        if (nSegments === void 0) { nSegments = 12; }
        if (material === void 0) { material = null; }
        if (material == null && this.line != null) {
            material = this.line.material;
        }
        if (this.line != null) {
            this.scene.remove(this.line);
        }
        var geometry = new THREE.Geometry();
        var mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        this.line = new THREE.Line(geometry, mat);
        var angleStep = 2 * Math.PI / nSegments;
        for (var i = 0; i <= nSegments; i++) {
            geometry.vertices.push(new THREE.Vector3(x + radius * Math.cos(i * angleStep), y + radius * Math.sin(i * angleStep)));
        }
        this.scene.add(this.line);
    };
    return ThreeCircle;
}(Circle));
exports.ThreeCircle = ThreeCircle;


/***/ })
/******/ ]);