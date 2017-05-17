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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Connect to arduino-create-agent
// https://github.com/arduino/arduino-create-agent
Object.defineProperty(exports, "__esModule", { value: true });
var Communication = (function () {
    function Communication(gui) {
        Communication.communication = this;
        this.commandSent = '';
        this.serialPort = '';
        this.socket = null;
        this.gui = gui;
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
    Communication.prototype.initializeSerailConnectionPorts = function (event) {
        var _this = this;
        var portNames = ['Disconnected', 'Refresh'];
        for (var _i = 0, _a = event.data; _i < _a.length; _i++) {
            var listItem = _a[_i];
            if (listItem.hasOwnProperty('Network') && !listItem.Network && listItem.hasOwnProperty('Ports')) {
                for (var _b = 0, _c = listItem.Ports; _b < _c.length; _b++) {
                    var portName = _c[_b];
                    portNames.push(portName);
                }
            }
        }
        var controller = this.gui.add({ 'port': 'Disconnected' }, 'port', portNames);
        controller.onChange(function (value) {
            if (value == 'Disconnected') {
                _this.commandSent = 'close';
                _this.socket.send('close ' + _this.serialPort);
            }
            if (value != 'Refresh') {
                _this.commandSent = 'list';
                _this.socket.send(_this.commandSent);
            }
            else {
                _this.commandSent = 'open';
                _this.serialPort = value;
                _this.socket.send('open ' + value + ' 115200');
            }
        });
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
            _this.commandSent = 'list';
            // this.socket.emit('command', 'log on')	
            _this.socket.emit('command', 'list');
        });
        // window.ws = this.socket
        this.socket.on('message', function (event) {
            console.log(event);
            if (this.commandSent == 'list') {
                this.initializeSerailConnectionPorts(event);
            }
            else if (this.commandSent == 'open') {
                this.checkSerialConnection(event);
            }
            else if (this.commandSent == 'close') {
                this.checkSerialConnection(event);
            }
            else if (this.commandSent == 'sent') {
                console.log('send response');
            }
        });
        return;
    };
    Communication.prototype.send = function (data) {
        if (this.socket == null) {
            return;
        }
        this.commandSent = 'sent';
        this.socket.emit('command', 'send ' + this.serialPort + ' ' + data);
    };
    Communication.prototype.sendSetPosition = function (point) {
        this.send('G92 X' + point.x + ' Y' + point.y + '\n');
    };
    Communication.prototype.sendMoveDirect = function (point) {
        this.send('G0 X' + point.x + ' Y' + point.y + '\n');
    };
    Communication.prototype.sendMoveLinear = function (point) {
        this.send('G1 X' + point.x + ' Y' + point.y + '\n');
    };
    Communication.prototype.sendSpeed = function (speed) {
        this.send('G0 F' + speed + '\n');
    };
    Communication.prototype.sendMachineSpecs = function (machineWidth, stepsPerRev, mmPerRev) {
        this.send('M4 X' + machineWidth + ' S' + stepsPerRev + ' P' + mmPerRev + '\n');
    };
    Communication.prototype.sendPause = function (delay) {
        this.send('G4 P' + delay + '\n');
    };
    Communication.prototype.sendMotorOff = function () {
        this.send('M84\n');
    };
    Communication.prototype.sendPenLift = function (servoTempo, servoValue) {
        this.send('G4 P' + servoTempo + '\n');
        this.send('M340 P3 S' + servoValue + '\n');
        this.send('G4 P0\n');
    };
    Communication.prototype.sendPenUp = function (servoUpTempo, servoUpValue) {
        this.sendPenLift(servoUpTempo, servoUpValue);
    };
    Communication.prototype.sendPenDown = function (servoDownTempo, servoDownValue) {
        this.sendPenLift(servoDownTempo, servoDownValue);
    };
    return Communication;
}());
Communication.communication = null;
exports.Communication = Communication;


/***/ }),
/* 1 */
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
var Shapes_1 = __webpack_require__(4);
var Pen_1 = __webpack_require__(3);
var Renderer = (function () {
    function Renderer() {
    }
    Renderer.prototype.centerOnMachine = function (machine) {
    };
    Renderer.prototype.getDomElement = function () {
        return null;
    };
    Renderer.prototype.createRectangle = function (x, y, width, height) {
        return null;
    };
    Renderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return null;
    };
    Renderer.prototype.createPen = function (x, y, machineWidth, communication) {
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
        this.machineLayer = new paper.Layer();
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
    }
    PaperRenderer.prototype.centerOnMachine = function (machine) {
        var margin = 100;
        var ratio = Math.max((machine.width + margin) / window.innerWidth, (machine.height + margin) / window.innerHeight);
        paper.view.zoom = 1 / ratio;
        console.log(paper.view.zoom);
        paper.view.setCenter(new paper.Point(machine.width / 2, machine.height / 2));
    };
    PaperRenderer.prototype.getDomElement = function () {
        return null;
    };
    PaperRenderer.prototype.createRectangle = function (x, y, width, height) {
        return new Shapes_1.PaperRectangle(x, y, width, height, this.machineLayer);
    };
    PaperRenderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return new Shapes_1.PaperCircle(x, y, radius, this.machineLayer);
    };
    PaperRenderer.prototype.createPen = function (x, y, machineWidth, communication) {
        var pen = new Pen_1.PaperPen(communication);
        pen.initialize(x, y, machineWidth, this.machineLayer);
        return pen;
    };
    PaperRenderer.prototype.createDrawingLayer = function () {
        this.drawingLayer = new paper.Layer();
        this.drawingLayer.moveBelow(this.machineLayer);
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
        paper.view.zoom = Math.max(0.25, Math.min(5, paper.view.zoom + event.deltaY / 500));
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
    ThreeRenderer.prototype.centerOnMachine = function (machine) {
        this.setCameraCenterTo(new THREE.Vector3(machine.width / 2, machine.height / 2, 0));
        var margin = 100;
        var ratio = Math.max((machine.width + margin) / window.innerWidth, (machine.height + margin) / window.innerHeight);
        this.camera.zoom = 1 / ratio;
        this.camera.updateProjectionMatrix();
    };
    ThreeRenderer.prototype.getDomElement = function () {
        return this.renderer.domElement;
    };
    ThreeRenderer.prototype.createRectangle = function (x, y, width, height) {
        return new Shapes_1.ThreeRectangle(x, y, width, height, this.scene, this.lineMaterial);
    };
    ThreeRenderer.prototype.createCircle = function (x, y, radius, nSegments) {
        if (nSegments === void 0) { nSegments = 12; }
        return new Shapes_1.ThreeCircle(x, y, radius, nSegments, this.scene, this.lineMaterial);
    };
    ThreeRenderer.prototype.createPen = function (x, y, machineWidth, communication) {
        var pen = new Pen_1.ThreePen(communication);
        pen.initialize(x, y, machineWidth, this.camera, this.scene, this.lineMaterial);
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
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/// <reference path="../node_modules/@types/three/index.d.ts"/>
/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/paper/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
// import Stats = require("../node_modules/three/examples/js/libs/stats.min.js")
// import { Stats } from "../node_modules/three/examples/js/libs/stats.min.js"
// import { THREE } from "../node_modules/three/build/three"
var Settings_1 = __webpack_require__(7);
var Renderers_1 = __webpack_require__(1);
var Plot_1 = __webpack_require__(5);
var Communication_1 = __webpack_require__(0);
var Draggable_1 = __webpack_require__(6);
var communication = null;
var container = null;
var pen;
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
        gui.add(Settings_1.Settings.machine, 'speed', 0, 2000);
        communication = new Communication_1.Communication(gui);
        renderer = new Renderers_1.PaperRenderer();
        var machineRectangle = renderer.createRectangle(0, 0, Settings_1.Settings.machine.width, Settings_1.Settings.machine.height);
        var paperRectangle = renderer.createRectangle(Settings_1.Settings.drawArea.x, Settings_1.Settings.drawArea.y, Settings_1.Settings.drawArea.width, Settings_1.Settings.drawArea.height);
        var motorLeft = renderer.createCircle(0, 0, 50, 24);
        var motorRight = renderer.createCircle(Settings_1.Settings.machine.width, 0, 50, 24);
        renderer.centerOnMachine(Settings_1.Settings.machine);
        // Pen
        pen = renderer.createPen(Settings_1.Settings.machine.homeX, Settings_1.Settings.machine.homeY, Settings_1.Settings.machine.width, communication);
        Plot_1.SVGPlot.pen = pen.item;
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
/* 3 */
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
var Draggable_1 = __webpack_require__(6);
var RADIUS = 20;
var Pen = (function (_super) {
    __extends(Pen, _super);
    function Pen(communication) {
        var _this = _super.call(this, null) || this;
        _this.communication = communication;
        return _this;
    }
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
    PaperPen.prototype.initialize = function (x, y, machineWidth, layer) {
        var _this = this;
        if (layer === void 0) { layer = null; }
        this.circle = paper.Path.Circle(new paper.Point(x, y), RADIUS);
        this.circle.strokeWidth = 1;
        this.circle.strokeColor = 'black';
        this.circle.fillColor = 'black';
        this.circle.onMouseDrag = function (event) {
            _this.circle.position = _this.circle.position.add(event.delta);
        };
        this.item = this.circle;
        this.lines = new paper.Path();
        this.lines.add(new paper.Point(0, 0));
        this.lines.add(new paper.Point(x, y));
        this.lines.add(new paper.Point(machineWidth, 0));
        this.lines.strokeWidth = 1;
        this.lines.strokeColor = 'black';
        this.dragging = false;
        this.previousPosition = new paper.Point(0, 0);
        if (layer) {
            layer.addChild(this.circle);
            layer.addChild(this.lines);
        }
    };
    PaperPen.prototype.drag = function (delta) {
        this.lines.segments[1].point = this.circle.position.clone();
    };
    return PaperPen;
}(Pen));
exports.PaperPen = PaperPen;
var ThreePen = (function (_super) {
    __extends(ThreePen, _super);
    function ThreePen(communication) {
        return _super.call(this, communication) || this;
    }
    ThreePen.prototype.initialize = function (x, y, machineWidth, camera, scene, lineMat) {
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
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0), new THREE.Vector3(machineWidth, 0, 0));
        this.lines = new THREE.Line(lineGeometry, lineMaterial);
        this.camera = camera;
        if (scene) {
            scene.add(this.lines);
            scene.add(this.circle);
        }
    };
    ThreePen.prototype.pointToVector = function (point) {
        return new THREE.Vector3(point.x, point.y, 0);
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
            var delta = this.pointToVector(position.subtract(this.previousPosition));
            this.circle.position.add(delta);
            this.lines.geometry.vertices[1].copy(this.circle.position);
            this.lines.geometry.verticesNeedUpdate = true;
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
var Rectangle = (function () {
    function Rectangle() {
    }
    return Rectangle;
}());
exports.Rectangle = Rectangle;
var Circle = (function () {
    function Circle() {
    }
    return Circle;
}());
exports.Circle = Circle;
var PaperRectangle = (function () {
    function PaperRectangle(x, y, width, height, layer) {
        if (layer === void 0) { layer = null; }
        var position = new paper.Point(x, y);
        var size = new paper.Size(width, height);
        this.path = paper.Path.Rectangle(position, size);
        this.path.strokeWidth = 1;
        this.path.strokeColor = 'black';
        if (layer) {
            layer.addChild(this.path);
        }
    }
    return PaperRectangle;
}());
exports.PaperRectangle = PaperRectangle;
var PaperCircle = (function () {
    function PaperCircle(x, y, radius, layer) {
        if (layer === void 0) { layer = null; }
        var position = new paper.Point(x, y);
        this.path = paper.Path.Circle(position, radius);
        this.path.strokeWidth = 1;
        this.path.strokeColor = 'black';
        if (layer) {
            layer.addChild(this.path);
        }
    }
    return PaperCircle;
}());
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
    return ThreeRectangle;
}(Rectangle));
exports.ThreeRectangle = ThreeRectangle;
var ThreeCircle = (function (_super) {
    __extends(ThreeCircle, _super);
    function ThreeCircle(x, y, radius, nSegments, scene, material) {
        if (nSegments === void 0) { nSegments = 12; }
        if (material === void 0) { material = null; }
        var _this = _super.call(this) || this;
        var geometry = new THREE.Geometry();
        var mat = material != null ? material : new THREE.LineBasicMaterial({ color: 0xffffff });
        _this.line = new THREE.Line(geometry, mat);
        var angleStep = 2 * Math.PI / nSegments;
        for (var i = 0; i <= nSegments; i++) {
            geometry.vertices.push(new THREE.Vector3(x + radius * Math.cos(i * angleStep), y + radius * Math.sin(i * angleStep)));
        }
        scene.add(_this.line);
        return _this;
    }
    return ThreeCircle;
}(Circle));
exports.ThreeCircle = ThreeCircle;


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
var Draggable_1 = __webpack_require__(6);
var Communication_1 = __webpack_require__(0);
var Plot = (function (_super) {
    __extends(Plot, _super);
    function Plot() {
        return _super.call(this) || this;
    }
    Plot.createGUI = function (gui) {
        gui.add({ plot: function () { console.log('plot'); } }, 'plot');
    };
    Plot.prototype.plot = function () {
    };
    return Plot;
}(Draggable_1.Draggable));
exports.Plot = Plot;
var SVGPlot = (function (_super) {
    __extends(SVGPlot, _super);
    function SVGPlot(svg) {
        var _this = _super.call(this) || this;
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
        var loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'/>");
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
        if (hitResult != null && hitResult.item == SVGPlot.pen) {
            return;
        }
        _super.prototype.mouseDown.call(this, event);
    };
    SVGPlot.prototype.plot = function () {
        this.plotItem(this.svgItem);
    };
    SVGPlot.prototype.plotItem = function (item) {
        if (item.className == 'Path' || item.className == 'CompoundPath') {
            var path = item;
            for (var _i = 0, _a = path.segments; _i < _a.length; _i++) {
                var segment = _a[_i];
                if (segment == path.firstSegment) {
                    if (!Communication_1.Communication.communication.currentPosition.equals(segment.point)) {
                        Communication_1.Communication.communication.sendMoveDirect(segment.point);
                    }
                    Communication_1.Communication.communication.sendPenDown(1450, 540);
                }
                else {
                    Communication_1.Communication.communication.sendMoveLinear(segment.point);
                    if (segment == path.lastSegment) {
                        Communication_1.Communication.communication.sendPenUp(1450, 540);
                    }
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
    return SVGPlot;
}(Plot));
SVGPlot.pen = null;
SVGPlot.svgPlot = null;
SVGPlot.scale = 1;
exports.SVGPlot = SVGPlot;


/***/ }),
/* 6 */
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var machineHeight = 2020;
var machineWidth = 1780;
var paperHeight = 1220;
var paperWidth = 1780;
var homeX = 0;
var homeY = 388;
exports.Settings = {
    machine: {
        width: machineWidth,
        height: machineHeight,
        homeX: machineWidth / 2,
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
    SettingsManager.createGUI = function (gui) {
        var loadDivJ = $("<input data-name='file-selector' type='file' class='form-control' name='file[]'/>");
        var loadController = gui.add({ loadSettings: function () { loadDivJ.click(); } }, 'loadSettings');
        $(loadController.domElement).append(loadDivJ);
        loadDivJ.hide();
        loadDivJ.change(SettingsManager.handleFileSelect);
    };
    SettingsManager.save = function () {
        var json = JSON.stringify(exports.Settings);
        var blob = new Blob([json], { type: "application/json" });
        saveAs(blob, "settings.json");
        localStorage.setItem('settings', json);
    };
    SettingsManager.onJsonLoad = function (event) {
        exports.Settings = JSON.parse(event.target.result);
    };
    SettingsManager.handleFileSelect = function (event) {
        var files = event.dataTransfer != null ? event.dataTransfer.files : event.target.files;
        for (var i = 0; i < files.length; i++) {
            var file = files.item(i);
            var reader = new FileReader();
            reader.onload = this.onJsonLoad;
            reader.readAsText(file);
        }
    };
    SettingsManager.loadLocalStorage = function () {
        exports.Settings = JSON.parse(localStorage.getItem('settings'));
    };
    return SettingsManager;
}());
exports.SettingsManager = SettingsManager;


/***/ })
/******/ ]);