import { GUI, Controller } from "../GUI"
import { Communication } from "../Communication/CommunicationStatic"

export class Morpheeologie {

    homeX = 150
    homeY = 80
    homeZ = 100

    radius = 20
    nDrops = 20.0
    zUp = 100
    zDown = 100
    injectAmount = -1
    speed = 3000
    injectSpeed = 3000
    skipUp = false
    injectWhileMoving = true

    posX = this.homeX
    posY = this.homeY
    posZ = this.zUp
    deltaXY = 3
    deltaZ = 1
    deltaE = 0.1

    maxDistToCenter = 30
    minZ = 100
    maxZ = 110

    selectedMenuItem = 0
    nMenuItems = 12
    refreshRate = 200
    mgui: GUI = null
    lastStarted = 0

    homed = false

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
        this.mgui.add(this, 'injectSpeed', 100, 8000, 10).name('Injection speed')
		this.mgui.add(this, 'skipUp').name('Skip Up / Down')
        this.mgui.add(this, 'injectWhileMoving').name('Inject while moving')
        this.mgui.add(this, 'deltaXY', 0, 20, 0.01).name('Delta X/Y')
        this.mgui.add(this, 'deltaZ', 0, 20, 0.01).name('Delta Z')
        this.mgui.add(this, 'deltaE', 0, 20, 0.01).name('Delta E')
        
        this.mgui.addButton('Home XY', ()=> {
            Communication.interpreter.queue(`G90\n`) // Set XYZ axis to absolute
            Communication.interpreter.queue(`M83\n`) // Set E to relative
            Communication.interpreter.queue(`G28 X Y\n`)
            Communication.interpreter.queue(`G0 X${this.homeX} Y${this.homeY} F${this.speed}\n`)
            this.homed = true
        })
        this.mgui.addButton('Home Z', ()=> {
            Communication.interpreter.queue(`G28 Z\n`)
            Communication.interpreter.queue(`G0 Z${this.homeZ} F${this.speed}\n`)
        })
		this.mgui.addButton('Start', ()=> this.start())
		this.mgui.addButton('Drop', ()=> this.drop(this.posX, this.posY))

        // Not editable with the gamepad
        let settings = this.mgui.addFolder('Settings')
        settings.add(this, 'refreshRate', 0, 1000, 100).name('Pad rate')
        settings.add(this, 'maxDistToCenter', 0, 30, 1).name('Max dist to center')
        settings.add(this, 'minZ', 0, 150, 1).name('Min Z')
        settings.add(this, 'maxZ', 0, 150, 1).name('Max Z')

        settings.add(this, 'homeX', 0, 300, 1).name('Home X')
        settings.add(this, 'homeY', 0, 200, 1).name('Home Y')
        settings.add(this, 'homeZ', 0, 150, 1).name('Home Z')

        this.updateMenu()
	}
    
    drop(x: number, y: number) {
        if(!this.homed) {
            console.log('Home the machine before moving it!')
            return
        }
        let commands = []
        if (this.injectWhileMoving) {
            commands.push(`G0 X${x.toFixed(2)} Y${y.toFixed(2)} E${this.injectAmount} F${this.speed.toFixed(2)}\n`);
        } else {
            // go to position
            commands.push(`G0 X${x.toFixed(2)} Y${y.toFixed(2)} F${this.speed.toFixed(2)}\n`);
            if (!this.skipUp) {
                // down
                commands.push(`G0 Z${this.zDown} F${this.speed.toFixed(2)}\n`);
            }
            // inject
            commands.push(`G0 E${this.injectAmount} F${this.injectSpeed.toFixed(2)}\n`);
            if (!this.skipUp) {
                // up
                commands.push(`G0 Z${this.zUp} F${this.speed.toFixed(2)}\n`);
            }
        }
        this.posX = x
        this.posY = y
        return commands
    }

    start() {
        if(Date.now() - this.lastStarted < 10000) {
            console.log('Wait 10 seconds before starting again')
            return
        }
        if(!this.homed) {
            console.log('Home the machine before moving it!')
            return
        }
        this.lastStarted = Date.now()

        let commands = []

        commands.push(`G0 X${this.homeX} Y${this.homeY} Z${this.zUp}\n`);

        commands.push(`G0 F${this.speed.toFixed(2)}\n`);
        for (let i = 0; i < this.nDrops; i++) {
            let angle = (2 * Math.PI * i) / this.nDrops;
            let x = this.homeX + this.radius * Math.cos(angle);
            let y = this.homeY + this.radius * Math.sin(angle);
            commands = commands.concat(this.drop(x, y))
        }
    
        commands.push(`G0 X${this.homeX} Y${this.homeY} F${this.speed.toFixed(2)}\n`);
        
        this.posX = this.homeX
        this.posY = this.homeY

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
        let deltaX = x - this.homeX
        let deltaY = y - this.homeY
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    }

    queue(command: string) {
        if(!this.homed) {
            console.log('Home the machine before moving it!')
            return
        }
        Communication.interpreter.queue(command)
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
                this.queue(`G0 X${this.posX}\n F${this.speed}`)
                activated = true
            }
        }
        if(this.equals(gp.axes[0], -0.428)) { // Right
            if(this.distToCenter(this.posX + this.deltaXY, this.posY) < this.maxDistToCenter) {
                this.posX += this.deltaXY;
                this.queue(`G0 X${this.posX} F${this.speed}\n`)
                activated = true
            }
        }
        if(this.equals(gp.axes[0], -1)) { // Up
            if(this.distToCenter(this.posX, this.posY - this.deltaXY) < this.maxDistToCenter) {
                this.posY -= this.deltaXY;
                this.queue(`G0 Y${this.posY} F${this.speed}\n`)
                activated = true
            }
        }
        if(this.equals(gp.axes[0], 0.142)) { // Down
            if(this.distToCenter(this.posX, this.posY + this.deltaXY) < this.maxDistToCenter) {
                this.posY += this.deltaXY;
                this.queue(`G0 Y${this.posY} F${this.speed}\n`)
                activated = true
            }
        }

        // Move Z
        if(gp.buttons[5].pressed) {
            if(this.posZ + this.deltaZ < this.maxZ) {
                this.posZ += this.deltaZ;
                this.queue(`G0 Z${this.posZ} F${this.speed}\n`)
                activated = true
            }
        }
        if(gp.buttons[7].pressed) {
            if(this.posZ - this.deltaZ > this.minZ) {
                this.posZ -= this.deltaZ;
                this.queue(`G0 Z${this.posZ} F${this.speed}\n`)
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
            Communication.interpreter.queue(`G0 E${this.deltaE} F${this.injectSpeed}\n`)
            activated = true
        }
        if(gp.buttons[1].pressed) {
            Communication.interpreter.queue(`G0 E-${this.deltaE} F${this.injectSpeed}\n`)
            activated = true
        }
        
        if(gp.buttons[4].pressed) {
        }
        if(gp.buttons[6].pressed) {
        }

        if(gp.buttons[9].pressed) {
            this.start()
            activated = true
        }

        if(gp.buttons[8].pressed) {
            this.drop(this.posX, this.posY)
            activated = true
        }

        // Right Joystick
        if(this.equals(gp.axes[3], -1)) { // Left
            if(this.distToCenter(this.posX - this.deltaXY, this.posY) < this.maxDistToCenter) {
                this.posX -= this.deltaXY
                this.drop(this.posX, this.posY)
                activated = true
            }
        }
        if(this.equals(gp.axes[3], 1)) { // Right
            if(this.distToCenter(this.posX + this.deltaXY, this.posY) < this.maxDistToCenter) {
                this.posX += this.deltaXY
                this.drop(this.posX, this.posY)
                activated = true
            }
        }

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