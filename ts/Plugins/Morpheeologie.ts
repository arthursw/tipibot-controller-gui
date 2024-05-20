import { GUI, Controller } from "../GUI"
import { Communication } from "../Communication/CommunicationStatic"

export class Morpheeologie {

    centerX = 150
    centerY = 80
    radius = 20
    nDrops = 20.0
    zUp = 100
    zDown = 100
    injectAmount = -1
    speed = 3000
    skipUp = false
    injectWhileMoving = true

    posX = this.centerX
    posY = this.centerY
    posZ = this.zUp
    deltaXY = 0.1
    deltaZ = 0.1
    deltaE = 0.1

    maxDistToCenter = 30
    minZ = 100
    maxZ = 110

    selectedMenuItem = 0
    nMenuItems = 11
    refreshRate = 200
    mgui: GUI = null
    lastStarted = 0

	constructor() {
        // requestAnimationFrame(()=>this.update())
        setTimeout(()=>this.update(), 250)
	}

	createGUI(gui: GUI) {
		this.mgui = gui.addFolder('Morphéeologie')

		this.mgui.add(this, 'radius', 1, 35, 1).name('Radius')
        this.mgui.add(this, 'nDrops', 1, 100, 1).name('N Drops')
        this.mgui.add(this, 'zUp', 0, 150, 1).name('Z up')
        this.mgui.add(this, 'zDown', 0, 150, 1).name('Z down')
        this.mgui.add(this, 'injectAmount', -50, 50, 0.01).name('Inject Amount')
        this.mgui.add(this, 'speed', 100, 8000, 10).name('Speed')
		this.mgui.add(this, 'skipUp').name('Skip Up / Down')
        this.mgui.add(this, 'injectWhileMoving').name('Inject while moving')
        this.mgui.add(this, 'deltaXY', 0, 5, 0.01).name('Delta X/Y')
        this.mgui.add(this, 'deltaZ', 0, 5, 0.01).name('Delta Z')
        this.mgui.add(this, 'deltaE', 0, 5, 0.01).name('Delta E')
        
        // Not editable with the gamepad
        let settings = this.mgui.addFolder('Settings')
        settings.add(this, 'refreshRate', 0, 1000, 100).name('Pad rate')
        settings.add(this, 'maxDistToCenter', 0, 30, 1).name('Max dist to center')
        settings.add(this, 'minZ', 0, 150, 1).name('Min Z')
        settings.add(this, 'maxZ', 0, 150, 1).name('Max Z')

		this.mgui.addButton('Start', (value)=> this.start())
        this.updateMenu()
	}
    
    start() {
        if(Date.now() - this.lastStarted < 10000) {
            console.log('Wait 10 seconds before starting again')
            return
        }
        this.lastStarted = Date.now()

        let commands = ['G90', 'M83']

        commands.push(`G0 X${this.centerX} Y${this.centerY} Z${this.zUp}`);

        commands.push(`G0 F${this.speed.toFixed(2)}`);
        for (let i = 0; i < this.nDrops; i++) {
            let angle = (2 * Math.PI * i) / this.nDrops;
            let x = this.centerX + this.radius * Math.cos(angle);
            let y = this.centerY + this.radius * Math.sin(angle);
            if (this.injectWhileMoving) {
                commands.push(`G0 X${x.toFixed(2)} Y${y.toFixed(2)} E${this.injectAmount}`);
            } else {
                // go to position
                commands.push(`G0 X${x.toFixed(2)} Y${y.toFixed(2)}`);
                if (!this.skipUp) {
                    // down
                    commands.push(`G0 Z${this.zDown}`);
                }
                // inject
                commands.push(`G0 E${this.injectAmount}`);
                if (!this.skipUp) {
                    // up
                    commands.push(`G0 Z${this.zUp}`);
                }
            }
        }
    
        commands.push(`G0 X${this.centerX} Y${this.centerY}`);
        
        for(let command of commands) {
            Communication.interpreter.queue(command, command)
        }
    }

    equals(a:number, b:number, tolerance=0.01) {
        return Math.abs(b-a) < tolerance
    }

    // moveTo(x:number, y:number, z:number) {
    //     this.posX = x
    //     this.posY = y
    //     this.posZ = z
    //     let command = `G0 X${x} Y${x} Z${x}`
    //     Communication.interpreter.queue(command)
    // }

    updateMenu() {
        let controllers = this.mgui.getControllers()
        for(let controller of controllers) {
            controller.getDomElement().parentElement.parentElement.setAttribute('style', '')
        }
        controllers[this.selectedMenuItem].getDomElement().parentElement.parentElement.setAttribute('style', 'background: #4a4a4a;')
    }

    distToCenter(x: number, y: number) {
        let deltaX = x - this.centerX
        let deltaY = y - this.centerY
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    }

    update() {
        const gamepads = navigator.getGamepads()
        if (!gamepads || gamepads.length == 0) {
            // requestAnimationFrame(()=>this.update())
            setTimeout(()=>this.update(), 0)
            return
        }
        
        let activated = false

        const gp = gamepads[0]
        // console.log('gamepad', gp)

        // Arrows
        if(this.equals(gp.axes[0], 0.714)) { // Left
            if(this.distToCenter(this.posX - this.deltaXY, this.posY) < this.maxDistToCenter) {
                this.posX -= this.deltaXY
                Communication.interpreter.queue(`G0 X${this.posX}`)
                activated = true
            }
        }
        if(this.equals(gp.axes[0], -0.428)) { // Right
            if(this.distToCenter(this.posX + this.deltaXY, this.posY) < this.maxDistToCenter) {
                this.posX += this.deltaXY;
                Communication.interpreter.queue(`G0 X${this.posX}`)
                activated = true
            }
        }
        if(this.equals(gp.axes[0], -1)) { // Up
            if(this.distToCenter(this.posX, this.posY - this.deltaXY) < this.maxDistToCenter) {
                this.posY -= this.deltaXY;
                Communication.interpreter.queue(`G0 Y${this.posY}`)
                activated = true
            }
        }
        if(this.equals(gp.axes[0], 0.142)) { // Down
            if(this.distToCenter(this.posX, this.posY + this.deltaXY) < this.maxDistToCenter) {
                this.posY += this.deltaXY;
                Communication.interpreter.queue(`G0 Y${this.posY}`)
                activated = true
            }
        }

        // Move Z
        if(gp.buttons[5].pressed) {
            if(this.posZ + this.deltaZ < this.maxZ) {
                this.posZ += this.deltaZ;
                Communication.interpreter.queue(`G0 Z${this.posZ}`)
                activated = true
            }
        }
        if(gp.buttons[7].pressed) {
            if(this.posZ - this.deltaZ > this.minZ) {
                this.posZ -= this.deltaZ;
                Communication.interpreter.queue(`G0 Z${this.posZ}`)
                activated = true
            }
        }

        // Left Joystick: Menu selection and actions
        let controller = this.mgui.getControllers()[this.selectedMenuItem]
        let c: any = controller.controller
        if(this.equals(gp.axes[1], -1)) { // Left
            if(typeof controller.getValue() == 'boolean') {
                controller.setValue(!controller.getValue())
            } else {
                controller.setValue(controller.getValue() - c.__step * (gp.buttons[3].pressed ? 100 : gp.buttons[2].pressed ? 10 : 1))
            }
            activated = true
        }
        if(this.equals(gp.axes[1], 1)) { // Right
            if(typeof controller.getValue() == 'boolean') {
                controller.setValue(!controller.getValue())
            } else {
                controller.setValue(controller.getValue() + c.__step * (gp.buttons[3].pressed ? 50 : gp.buttons[2].pressed ? 10 : 1))
            }
            activated = true
        }

        if(this.equals(gp.axes[2], -1)) { // Up
            this.selectedMenuItem = Math.max(this.selectedMenuItem-1, 0)
            this.updateMenu()
            activated = true
        }
        if(this.equals(gp.axes[2], 1)) { // Down (z axis is inverted)
            this.selectedMenuItem = Math.min(this.selectedMenuItem+1, this.nMenuItems-1)
            this.updateMenu()
            activated = true
        }
        
        if(gp.buttons[0].pressed) {
            Communication.interpreter.queue(`G0 E${this.deltaE}`)
            activated = true
        }
        if(gp.buttons[1].pressed) {
            Communication.interpreter.queue(`G0 E-${this.deltaE}`)
            activated = true
        }
        
        if(gp.buttons[4].pressed) {
        }
        if(gp.buttons[6].pressed) {
        }

        if(gp.buttons[9].pressed) {
            this.start()
        }

        // Right Joystick
        // gp.axes[3]  // Left: -1, Right: 1


        for(let i=0 ; i<gp.buttons.length ; i++) {
            let button = gp.buttons[i]
            if(button.pressed) {
                console.log(i, button)
            }
        }
        
        // requestAnimationFrame(()=>this.update())
        setTimeout(()=>this.update(), activated ? this.refreshRate : 0)
    }
}