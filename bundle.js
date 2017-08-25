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
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
        this.settingsFolder = null;
        this.tipibotFolder = null;
        this.servoFolder = null;
        this.servoPositionFolder = null;
        this.servoDelayFolder = null;
        this.drawAreaFolder = null;
    }
    SettingsManager.prototype.getControllers = function () {
        var controllers = this.tipibotFolder.getControllers();
        controllers = controllers.concat(this.servoPositionFolder.getControllers());
        controllers = controllers.concat(this.servoDelayFolder.getControllers());
        controllers = controllers.concat(this.drawAreaFolder.getControllers());
        return controllers;
    };
    SettingsManager.prototype.createGUI = function (gui) {
        this.settingsFolder = gui.addFolder('Settings');
        this.settingsFolder.addFileSelectorButton('load', 'application/json', this.handleFileSelect);
        this.settingsFolder.add(this, 'save');
        this.tipibotFolder = gui.addFolder('Tipibot');
        this.tipibotFolder.add(exports.Settings.tipibot, 'width', 100, 10000);
        this.tipibotFolder.add(exports.Settings.tipibot, 'height', 100, 10000);
        this.tipibotFolder.add(exports.Settings.tipibot, 'homeX', 0, exports.Settings.tipibot.width);
        this.tipibotFolder.add(exports.Settings.tipibot, 'homeY', 0, exports.Settings.tipibot.height);
        this.tipibotFolder.add(exports.Settings.tipibot, 'speed', 0, 5000);
        this.servoFolder = gui.addFolder('Servo');
        this.servoPositionFolder = this.servoFolder.addFolder('Position');
        this.servoPositionFolder.add(exports.Settings.servo.position, 'up', 0, 3600);
        this.servoPositionFolder.add(exports.Settings.servo.position, 'down', 0, 3600);
        this.servoDelayFolder = this.servoFolder.addFolder('Delay');
        this.servoDelayFolder.add(exports.Settings.servo.delay, 'up', 0, 1000);
        this.servoDelayFolder.add(exports.Settings.servo.delay, 'down', 0, 1000);
        this.drawAreaFolder = gui.addFolder('DrawArea');
        this.drawAreaFolder.add(exports.Settings.drawArea, 'x', 0, exports.Settings.tipibot.width);
        this.drawAreaFolder.add(exports.Settings.drawArea, 'y', 0, exports.Settings.tipibot.height);
        this.drawAreaFolder.add(exports.Settings.drawArea, 'width', 0, exports.Settings.tipibot.width);
        this.drawAreaFolder.add(exports.Settings.drawArea, 'height', 0, exports.Settings.tipibot.height);
        var controllers = this.getControllers();
        for (var _i = 0, controllers_1 = controllers; _i < controllers_1.length; _i++) {
            var controller = controllers_1[_i];
            controller.onChange(this.settingChanged);
        }
    };
    SettingsManager.prototype.addTipibotToGUI = function (tipibot) {
        this.tipibot = tipibot;
        this.tipibot.createGUI(this.tipibotFolder);
    };
    SettingsManager.prototype.settingChanged = function (value) {
        if (value === void 0) { value = null; }
        for (var _i = 0, _a = this.drawAreaFolder.getControllers().concat(this.tipibotFolder.getControllers()); _i < _a.length; _i++) {
            var controller = _a[_i];
            if (controller.getName() == 'x' || controller.getName() == 'width' || controller.getName() == 'homeX') {
                controller.max(exports.Settings.tipibot.width);
            }
            if (controller.getName() == 'y' || controller.getName() == 'height' || controller.getName() == 'homeX') {
                controller.max(exports.Settings.tipibot.height);
            }
        }
        this.tipibot.settingsChanged();
    };
    SettingsManager.prototype.save = function () {
        var json = JSON.stringify(exports.Settings, null, '\t');
        var blob = new Blob([json], { type: "application/json" });
        saveAs(blob, "settings.json");
        localStorage.setItem('settings', json);
    };
    SettingsManager.prototype.updateSliders = function () {
        var controllers = this.getControllers();
        for (var _i = 0, controllers_2 = controllers; _i < controllers_2.length; _i++) {
            var controller = controllers_2[_i];
            controller.updateDisplay();
        }
    };
    SettingsManager.prototype.copyObjectProperties = function (Target, Source) {
        for (var property in Target) {
            if (typeof (Target[property]) === 'object') {
                this.copyObjectProperties(Target[property], Source[property]);
            }
            else {
                Target[property] = Source[property];
            }
        }
    };
    SettingsManager.prototype.onJsonLoad = function (event) {
        this.copyObjectProperties(exports.Settings, JSON.parse(event.target.result));
        this.settingChanged();
        this.updateSliders();
    };
    SettingsManager.prototype.handleFileSelect = function (event) {
        var files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (var i = 0; i < files.length; i++) {
            var file = files.item(i);
            var reader = new FileReader();
            reader.onload = this.onJsonLoad;
            reader.readAsText(file);
        }
    };
    SettingsManager.prototype.loadLocalStorage = function () {
        exports.Settings = JSON.parse(localStorage.getItem('settings'));
    };
    return SettingsManager;
}());
exports.SettingsManager = SettingsManager;
exports.settingsManager = new SettingsManager();


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Settings_1 = __webpack_require__(0);
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
        var portNumber = 8991;
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
            if (portNumber == 9000) {
                portNumber = 8990;
            }
            else if (portNumber == 8990) {
                console.log("Error: impossible to connect to arduino-create-agent");
                return;
            }
            else {
                portNumber++;
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
    Communication.prototype.onWebSocketConnect = function (response) {
        console.log('connect response: ', response);
        this.socket.emit('command', 'list');
    };
    Communication.prototype.onWebSocketMessage = function (message) {
        var data = null;
        try {
            data = JSON.parse(message);
        }
        catch (e) {
            return;
        }
        // List serial ports response (list):
        if (data.hasOwnProperty('Ports') && data.hasOwnProperty('Network')) {
            this.initializeSerialConnectionPorts(data);
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
                    this.messageReceived();
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
    };
    Communication.prototype.openWebsocketConnection = function (websocketPort) {
        var _this = this;
        this.socket = io('ws://localhost:3000');
        // this.socket = io(websocketPort)
        this.socket.on('connect', function (response) { return _this.onWebSocketConnect(response); });
        // window.ws = this.socket
        this.socket.on('message', function (message) { return _this.onWebSocketMessage(message); });
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
    Communication.prototype.sendStop = function () {
        this.queue('M0\n');
    };
    return Communication;
}());
exports.Communication = Communication;
exports.communication = null;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Draggable = (function () {
    function Draggable(renderer, item) {
        if (item === void 0) { item = null; }
        this.renderer = renderer;
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
        this.item = item;
        Draggable.draggables.push(this);
    }
    Draggable.prototype.drag = function (delta) {
        this.item.position = this.item.position.add(delta);
    };
    Draggable.prototype.getWorldPosition = function (event) {
        return this.renderer.getWorldPosition(event);
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
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Communication_1 = __webpack_require__(1);
var Settings_1 = __webpack_require__(0);
var Tipibot = (function () {
    function Tipibot() {
        this.xSlider = null;
        this.ySlider = null;
        this.setPositionButton = null;
        this.penStateButton = null;
        this.settingPosition = false;
        this.isPenUp = true;
    }
    Tipibot.prototype.createGUI = function (gui) {
        var _this = this;
        var goHomeButton = gui.addButton('goHome', function () { return _this.goHome(); });
        var position = this.getPosition();
        this.xSlider = gui.addSlider('x', position.x, 0, Settings_1.Settings.tipibot.width).onChange(function (value) { _this.setX(value); });
        this.ySlider = gui.addSlider('y', position.y, 0, Settings_1.Settings.tipibot.height).onChange(function (value) { _this.setY(value); });
        this.setPositionButton = gui.addButton('setPosition', function () { return _this.toggleSetPosition(); });
        this.penStateButton = gui.addButton('penDown', function () { return _this.changePenState(); });
        var motorsOffButton = gui.addButton('motorsOff', function () { return _this.motorsOff(); });
    };
    Tipibot.prototype.setPositionSliders = function (point) {
        this.xSlider.setValueNoCallback(point.x);
        this.ySlider.setValueNoCallback(point.y);
    };
    Tipibot.prototype.toggleSetPosition = function (setPosition) {
        if (setPosition === void 0) { setPosition = !this.settingPosition; }
        if (!setPosition) {
            this.setPositionButton.changeName('setPosition');
        }
        else {
            this.setPositionButton.changeName('cancel');
        }
        this.settingPosition = setPosition;
    };
    Tipibot.prototype.changePenState = function () {
        if (this.isPenUp) {
            this.penDown();
        }
        else {
            this.penUp();
        }
    };
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
        Settings_1.settingsManager.addTipibotToGUI(this);
    };
    Tipibot.prototype.settingsChanged = function () {
        this.xSlider.max(Settings_1.Settings.tipibot.width);
        this.ySlider.max(Settings_1.Settings.tipibot.height);
        this.xSlider.setValue(Settings_1.Settings.tipibot.homeX);
        this.ySlider.setValue(Settings_1.Settings.tipibot.homeY);
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
            this.penStateButton.changeName('penDown');
            this.isPenUp = true;
        }
    };
    Tipibot.prototype.penDown = function (servoDownValue, servoDownTempo) {
        if (servoDownValue === void 0) { servoDownValue = Settings_1.Settings.servo.position.down; }
        if (servoDownTempo === void 0) { servoDownTempo = Settings_1.Settings.servo.delay.down; }
        if (this.isPenUp) {
            Communication_1.communication.sendPenUp(servoDownValue, servoDownTempo);
            this.penStateButton.changeName('penUp');
            this.isPenUp = false;
        }
    };
    Tipibot.prototype.goHome = function () {
        this.penUp();
        this.moveDirect(new paper.Point(Settings_1.Settings.tipibot.homeX, Settings_1.Settings.tipibot.homeY));
    };
    Tipibot.prototype.motorsOff = function () {
        Communication_1.communication.sendMotorOff();
    };
    Tipibot.prototype.keyDown = function (event) {
        switch (event.keyCode) {
            case 37:
                this.moveDirect(this.getPosition().add(new paper.Point(-1, 0)));
                break;
            case 38:
                this.moveDirect(this.getPosition().add(new paper.Point(0, -1)));
                break;
            case 39:
                this.moveDirect(this.getPosition().add(new paper.Point(1, 0)));
                break;
            case 40:
                this.moveDirect(this.getPosition().add(new paper.Point(0, 1)));
                break;
            default:
                break;
        }
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
var Draggable_1 = __webpack_require__(2);
var Settings_1 = __webpack_require__(0);
var Tipibot_1 = __webpack_require__(3);
var Pen = (function (_super) {
    __extends(Pen, _super);
    function Pen(communication, renderer) {
        var _this = _super.call(this, renderer) || this;
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
Pen.RADIUS = 20;
exports.Pen = Pen;
var PaperPen = (function (_super) {
    __extends(PaperPen, _super);
    function PaperPen(communication, renderer) {
        return _super.call(this, communication, renderer) || this;
    }
    PaperPen.prototype.initialize = function (x, y, tipibotWidth, layer) {
        if (layer === void 0) { layer = null; }
        this.circle = paper.Path.Circle(new paper.Point(x, y), Pen.RADIUS);
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
        Tipibot_1.tipibot.moveDirect(point);
        Tipibot_1.tipibot.setPositionSliders(point);
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
    function ThreePen(communication, renderer) {
        return _super.call(this, communication, renderer) || this;
    }
    ThreePen.prototype.initialize = function (x, y, tipibotWidth, camera, scene, lineMat) {
        if (scene === void 0) { scene = null; }
        if (lineMat === void 0) { lineMat = null; }
        var geometry = new THREE.CircleGeometry(Pen.RADIUS, 32);
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
        if (position.getDistance(new paper.Point(this.circle.position.x, this.circle.position.y), true) < Pen.RADIUS * Pen.RADIUS) {
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
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Controller = (function () {
    function Controller(controller) {
        this.controller = controller;
    }
    Controller.prototype.getDomElement = function () {
        return this.controller.domElement;
    };
    Controller.prototype.getParentDomElement = function () {
        return this.getDomElement().parentElement.parentElement;
    };
    Controller.prototype.contains = function (element) {
        return $.contains(this.getParentDomElement(), element);
    };
    Controller.prototype.getProperty = function () {
        return this.controller.property;
    };
    Controller.prototype.getName = function () {
        return this.controller.property;
    };
    Controller.prototype.onChange = function (callback) {
        this.controller.onChange(callback);
        return this;
    };
    Controller.prototype.onFinishChange = function (callback) {
        this.controller.onFinishChange(callback);
        return this;
    };
    Controller.prototype.setValue = function (value) {
        this.controller.setValue(value);
    };
    Controller.prototype.setValueNoCallback = function (value) {
        this.controller.object[this.controller.property] = value;
        this.controller.updateDisplay();
    };
    Controller.prototype.max = function (value) {
        this.controller.max(value);
    };
    Controller.prototype.min = function (value) {
        this.controller.min(value);
    };
    Controller.prototype.updateDisplay = function () {
        this.controller.updateDisplay();
    };
    Controller.prototype.options = function (options) {
        return this.controller.options(options);
    };
    Controller.prototype.changeName = function (name) {
        $(this.controller.domElement.parentElement).find('span.property-name').html(name);
    };
    return Controller;
}());
exports.Controller = Controller;
var GUI = (function () {
    function GUI(folder) {
        if (folder === void 0) { folder = null; }
        this.gui = folder != null ? folder : new dat.GUI();
    }
    GUI.prototype.add = function (object, propertyName, min, max) {
        if (min === void 0) { min = null; }
        if (max === void 0) { max = null; }
        return new Controller(this.gui.add(object, propertyName, min, max));
    };
    GUI.prototype.addButton = function (name, callback) {
        var object = {};
        object[name] = callback;
        return new Controller(this.gui.add(object, name));
    };
    GUI.prototype.addFileSelectorButton = function (name, fileType, callback) {
        var divJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'  accept='" + fileType + "'/>");
        var button = this.addButton(name, function () { return divJ.click(); });
        $(button.getDomElement()).append(divJ);
        divJ.hide();
        divJ.change(callback);
        return button;
    };
    GUI.prototype.addSlider = function (name, value, min, max) {
        var object = {};
        object[name] = value;
        return this.add(object, name, min, max);
    };
    GUI.prototype.addFolder = function (name) {
        return new GUI(this.gui.addFolder(name));
    };
    GUI.prototype.getControllers = function () {
        return this.gui.__controllers;
    };
    return GUI;
}());
exports.GUI = GUI;


/***/ }),
/* 6 */
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
var Settings_1 = __webpack_require__(0);
var Draggable_1 = __webpack_require__(2);
var Communication_1 = __webpack_require__(1);
var Plot = (function (_super) {
    __extends(Plot, _super);
    function Plot(renderer) {
        return _super.call(this, renderer) || this;
    }
    Plot.createCallback = function (f, addValue, parameters) {
        if (addValue === void 0) { addValue = false; }
        if (parameters === void 0) { parameters = []; }
        return function (value) {
            if (Plot.currentPlot != null) {
                if (addValue) {
                    parameters.unshift(value);
                }
                f.apply(Plot.currentPlot, parameters);
            }
        };
    };
    Plot.createGUI = function (gui) {
        Plot.plotFolder = gui.addFolder('Plot');
        Plot.plotFolder.addButton('plot', Plot.createCallback(Plot.prototype.plot));
        Plot.plotFolder.addButton('stop', Plot.createCallback(Plot.prototype.stop));
        Plot.plotFolder.addButton('rotate', Plot.createCallback(Plot.prototype.rotate));
        Plot.plotFolder.addButton('flipX', Plot.createCallback(Plot.prototype.flipX));
        Plot.plotFolder.addButton('flipY', Plot.createCallback(Plot.prototype.flipY));
        Plot.xSlider = Plot.plotFolder.addSlider('x', 0, 0, Settings_1.Settings.tipibot.width).onChange(Plot.createCallback(Plot.prototype.setX, true));
        Plot.ySlider = Plot.plotFolder.addSlider('y', 0, 0, Settings_1.Settings.tipibot.height).onChange(Plot.createCallback(Plot.prototype.setY, true));
    };
    Plot.prototype.plot = function () {
    };
    Plot.prototype.stop = function () {
        Communication_1.communication.sendStop();
    };
    Plot.prototype.rotate = function () {
        this.item.rotate(90);
    };
    Plot.prototype.flipX = function () {
        this.item.scale(-1, 1);
    };
    Plot.prototype.flipY = function () {
        this.item.scale(1, -1);
    };
    Plot.prototype.setX = function (x) {
        this.item.position.x = x;
    };
    Plot.prototype.setY = function (y) {
        this.item.position.y = y;
    };
    return Plot;
}(Draggable_1.Draggable));
Plot.plotFolder = null;
Plot.currentPlot = null;
Plot.xSlider = null;
Plot.ySlider = null;
exports.Plot = Plot;
var SVGPlot = (function (_super) {
    __extends(SVGPlot, _super);
    function SVGPlot(svg, renderer) {
        var _this = _super.call(this, renderer) || this;
        Plot.currentPlot = _this;
        SVGPlot.svgPlot = _this;
        _this.svgItem = svg;
        paper.project.layers[0].addChild(svg);
        _this.flatten(svg, 20);
        _this.item = _this.svgItem;
        return _this;
    }
    SVGPlot.onImageLoad = function (event) {
        var svgPlot = new SVGPlot(paper.project.importSVG(event.target.result), SVGPlot.renderer);
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
        SVGPlot.gui = gui;
        gui.addFileSelectorButton('loadSVG', 'image/svg+xml', SVGPlot.handleFileSelect);
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
    SVGPlot.prototype.drag = function (delta) {
        _super.prototype.drag.call(this, delta);
        Plot.xSlider.setValueNoCallback(this.item.position.x);
        Plot.ySlider.setValueNoCallback(this.item.position.y);
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
var Shapes_1 = __webpack_require__(9);
var Pen_1 = __webpack_require__(4);
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
    Renderer.prototype.getMousePosition = function (event) {
        return new paper.Point(event.clientX, event.clientY);
    };
    Renderer.prototype.getWorldPosition = function (event) {
        return paper.view.viewToProject(this.getMousePosition(event));
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
var PaperRenderer = (function (_super) {
    __extends(PaperRenderer, _super);
    function PaperRenderer() {
        var _this = _super.call(this) || this;
        _this.canvas = document.createElement('canvas');
        _this.canvas.width = window.innerWidth;
        _this.canvas.height = window.innerHeight;
        document.body.appendChild(_this.canvas);
        paper.setup(_this.canvas);
        _this.tipibotLayer = new paper.Layer();
        _this.dragging = false;
        _this.previousPosition = new paper.Point(0, 0);
        return _this;
    }
    PaperRenderer.prototype.centerOnTipibot = function (tipibot) {
        var margin = 100;
        var ratio = Math.max((tipibot.width + margin) / window.innerWidth, (tipibot.height + margin) / window.innerHeight);
        paper.view.zoom = 1 / ratio;
        paper.view.setCenter(new paper.Point(tipibot.width / 2, tipibot.height / 2));
    };
    PaperRenderer.prototype.getDomElement = function () {
        return paper.view.element;
    };
    PaperRenderer.prototype.createRectangle = function (rectangle) {
        return new Shapes_1.PaperRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, this.tipibotLayer);
    };
    PaperRenderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return new Shapes_1.PaperCircle(x, y, radius, this.tipibotLayer);
    };
    PaperRenderer.prototype.createPen = function (x, y, tipibotWidth, communication) {
        var pen = new Pen_1.PaperPen(communication, this);
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
        this.previousPosition = this.getMousePosition(event);
    };
    PaperRenderer.prototype.mouseMove = function (event) {
        if (event.buttons == 4 && this.dragging) {
            var position = this.getMousePosition(event);
            paper.view.translate(position.subtract(this.previousPosition).divide(paper.view.zoom));
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
        if (event.target != this.getDomElement()) {
            return;
        }
        paper.view.zoom = Math.max(0.1, Math.min(5, paper.view.zoom + event.deltaY / 500));
    };
    PaperRenderer.prototype.render = function () {
    };
    return PaperRenderer;
}(Renderer));
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
        var pen = new Pen_1.ThreePen(communication, this);
        pen.initialize(x, y, tipibotWidth, this.camera, this.scene, this.lineMaterial);
        return pen;
    };
    ThreeRenderer.prototype.setCameraCenterTo = function (point) {
        this.camera.position.x = point.x - window.innerWidth / 2;
        this.camera.position.y = point.y - window.innerHeight / 2;
        this.camera.position.z = point.z;
    };
    ThreeRenderer.prototype.getWorldPosition = function (event) {
        var windowCenter = new paper.Point(window.innerWidth / 2, window.innerHeight / 2);
        var windowOrigin = windowCenter.subtract(windowCenter.divide(this.camera.zoom).subtract(this.camera.position));
        var delta = this.getMousePosition(event).divide(this.camera.zoom);
        return windowOrigin.add(delta);
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
        if (event.target != this.getDomElement()) {
            return;
        }
        this.camera.zoom += (event.deltaY / 500);
        this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom));
        this.camera.updateProjectionMatrix();
    };
    ThreeRenderer.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    return ThreeRenderer;
}(Renderer));
exports.ThreeRenderer = ThreeRenderer;


/***/ }),
/* 8 */
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
var Settings_1 = __webpack_require__(0);
var Tipibot_1 = __webpack_require__(3);
var Renderers_1 = __webpack_require__(7);
var Pen_1 = __webpack_require__(4);
var Plot_1 = __webpack_require__(6);
var Communication_1 = __webpack_require__(1);
var Draggable_1 = __webpack_require__(2);
var GUI_1 = __webpack_require__(5);
var communication = null;
var container = null;
var renderer = null;
var gui;
var positionPreview = null;
var drawing = {
    scale: 1,
};
document.addEventListener("DOMContentLoaded", function (event) {
    function initialize() {
        gui = new GUI_1.GUI();
        communication = new Communication_1.Communication(gui);
        Settings_1.settingsManager.createGUI(gui);
        Plot_1.Plot.createGUI(gui);
        Plot_1.SVGPlot.createGUI(gui);
        // gui.add(Settings.tipibot, 'speed', 0, 2000)
        renderer = new Renderers_1.PaperRenderer();
        Plot_1.SVGPlot.renderer = renderer;
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
        if (Tipibot_1.tipibot.settingPosition) {
            var position = renderer.getWorldPosition(event);
            if (positionPreview == null) {
                positionPreview = renderer.createCircle(position.x, position.y, Pen_1.Pen.RADIUS);
            }
            positionPreview.setPosition(position);
            Tipibot_1.tipibot.setPositionSliders(position);
        }
    }
    function mouseUp(event) {
        for (var _i = 0, _a = Draggable_1.Draggable.draggables; _i < _a.length; _i++) {
            var draggable = _a[_i];
            draggable.mouseUp(event);
        }
        renderer.mouseUp(event);
        if (Tipibot_1.tipibot.settingPosition && !Tipibot_1.tipibot.setPositionButton.contains(event.target)) {
            if (positionPreview != null) {
                positionPreview.remove();
                positionPreview = null;
            }
            Tipibot_1.tipibot.setPosition(renderer.getWorldPosition(event));
            Tipibot_1.tipibot.toggleSetPosition(false);
        }
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
/* 9 */
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
var Shape = (function () {
    function Shape() {
    }
    Shape.prototype.setPosition = function (position) {
        this.path.position = position;
    };
    Shape.prototype.remove = function () {
        this.path.remove();
    };
    return Shape;
}());
exports.Shape = Shape;
var Rectangle = (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle() {
        return _super.call(this) || this;
    }
    Rectangle.prototype.update = function (x, y, width, height) {
    };
    Rectangle.prototype.updateRectangle = function (rectangle) {
        this.update(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    };
    return Rectangle;
}(Shape));
exports.Rectangle = Rectangle;
var Circle = (function (_super) {
    __extends(Circle, _super);
    function Circle() {
        return _super.call(this) || this;
    }
    Circle.prototype.update = function (x, y, radius) {
    };
    return Circle;
}(Shape));
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
        _this.scene = scene;
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
    ThreeRectangle.prototype.setPosition = function (position) {
        this.line.position.set(position.x, position.y, 0);
    };
    ThreeRectangle.prototype.remove = function () {
        this.scene.remove(this.line);
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
    ThreeCircle.prototype.setPosition = function (position) {
        this.line.position.set(position.x, position.y, 0);
    };
    ThreeCircle.prototype.remove = function () {
        this.scene.remove(this.line);
    };
    return ThreeCircle;
}(Circle));
exports.ThreeCircle = ThreeCircle;


/***/ })
/******/ ]);