import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import { Settings } from './Settings'
import { tipibot } from './Tipibot'

const nameToSpeed: any = {
    "{x0.25}": 0.25,
    "{x1}": 1,
    "{x5}": 5,
    "{x25}": 25,
}
export class VirtualKeyboard {
    keyboard: Keyboard
    keyboardArrows: Keyboard
    initialValue: any = null
    activeController: any = null
    enableArrows = false
    enableArrowsController: any = null

    constructor() {

        this.hideKeyboard()
        
        let commonKeyboardOptions = {
            onKeyPress: (button: any) => this.onKeyPress(button),
            theme: "simple-keyboard hg-theme-default hg-layout-default",
            physicalKeyboardHighlight: true,
            syncInstanceInputs: true,
            mergeDisplay: true,
            debug: true
        };

        this.keyboard = new Keyboard({ ...commonKeyboardOptions,
            onChange: (input: any) => this.onChange(input),
        })

        // this.addFocusListenerWhenCreatingInputs()
        $('#keyboard .close-button').click(() => this.endInput())

        this.keyboardArrows = new Keyboard(".simple-keyboard-arrows", {
            ...commonKeyboardOptions,
            layout: {
                default: ["{arrowup}", "{arrowleft} {arrowdown} {arrowright}", "{x0.25} {x1} {x5} {x25}"]
            },
            display: {
                "{x0.25}": "x0.25",
                "{x1}": "x1",
                "{x5}": "x5",
                "{x25}": "x25",
            }
        });

        if(!this.enableArrows) {
            $('.simple-keyboard-arrows').hide()
        }
    }

    createGUI(gui: any) {
        this.enableArrowsController = gui.add(this, 'enableArrows').name('Touch Move').onFinishChange((value: boolean)=> {
            this.toggleArrows(value)
        })
        if(!Settings.enableTouchKeyboard) {
            this.enableArrowsController.hide()
        }
    }

    toggleArrows(activate:boolean) {
        if(activate) {
            if(this.activeController) {
                this.endInput()
            }
            this.showKeyboard()
            $('#keyboard .characters').hide()
            $('.simple-keyboard-arrows').show()
        } else {
            this.hideKeyboard()
            $('.simple-keyboard-arrows').hide()
        }
    }

    showKeyboard() {
        if (Settings.enableTouchKeyboard) {
            $('#keyboard').show()
            $('#keyboard .characters').show()
        }
    }

    hideKeyboard() {
        $('#keyboard').hide()
    }

    onInputFocus(controller: any) {
        if (!Settings.enableTouchKeyboard) {
            return
        }
        this.activeController = controller
        this.initialValue = controller.getValue()
        this.keyboard.setInput('' + controller.getValue())
        $('#keyboard .input').val(controller.getValue())
        this.showKeyboard()
    }

    onInputBlur() {
        if (!Settings.enableTouchKeyboard) {
            return
        }
        this.endInput()
    }

    // addFocusListenerWhenCreatingInputs() {

    //     // Select the node that will be observed for mutations
    //     const body = document.getElementsByTagName('body')[0]

    //     // Options for the observer (which mutations to observe)
    //     const config = { attributes: false, childList: true, subtree: true }

    //     // Callback function to execute when mutations are observed
    //     const callback = function (mutationsList: MutationRecord[], observer: MutationObserver) {
    //         for (const mutation of mutationsList) {
    //             if (mutation.type === 'childList') {
    //                 for(const node of mutation.addedNodes) {
    //                     if(node.nodeName.toLowerCase() == 'input') {
    //                         $(node).on('focus', ()=> {
    //                             this.activeController = node.parentElement
    //                             this.showKeyboard()
    //                         })
    //                         // node.addEventListener('focus', ()=> this.showKeyboard())
    //                         node.addEventListener('blur', ()=> {
    //                             this.activeController = null
    //                             this.hideKeyboard()
    //                         })
    //                     }
    //                 }
    //             }
    //         }
    //     };

    //     // Create an observer instance linked to the callback function
    //     const observer = new MutationObserver(callback)

    //     // Start observing the target node for configured mutations
    //     observer.observe(body, config)
    // }

    onChange(input: any) {
        if (!Settings.enableTouchKeyboard) {
            return
        }
        if (this.activeController != null) {
            // let value = input
            let valueParsed = isNaN(this.activeController.getValue()) ? input : parseFloat(input)
            this.activeController.setValueNoCallback(valueParsed)
            $('#keyboard .input').val(input)
        }
    }

    endInput() {
        if (!Settings.enableTouchKeyboard) {
            return
        }
        if(this.activeController != null) {
            let input = this.keyboard.getInput()
            let value = isNaN(this.activeController.getValue()) ? input : parseFloat(input)
            this.activeController.setValue(value)
            if(this.activeController.controller.__onFinishChange) {
                this.activeController.controller.__onFinishChange(value)
            }
            $('#keyboard .input').val(value)
            this.activeController = null
        }
        this.hideKeyboard()
    }

    onKeyPress(button: any) {
        if (button == '{enter}') {
            this.endInput()
        }
        if (button === "{shift}" || button === "{lock}") {
            this.handleShift()
        }
        for(let btn of ['{x0.25}', '{x1}', '{x5}', '{x25}']) {
            if(button == btn) {
                let jButton = $('.hg-button[data-skbtn="'+btn+'"]')
                let isPressed = jButton.hasClass('pressed')
                $('.hg-button').removeClass('pressed')
                if(!isPressed) {
                    jButton.addClass('pressed')
                }
            }
        }
        let speedName: string = $('.hg-button.pressed').attr('data-skbtn')
		let amount: number = speedName != null ? nameToSpeed[speedName] : 1
		switch (button) {
			case '{arrowleft}': 			// left arrow
				tipibot.moveDirect(tipibot.getPosition().add(new paper.Point(-amount, 0)))
				break;
			case '{arrowup}':   			// up arrow
				tipibot.moveDirect(tipibot.getPosition().add(new paper.Point(0, -amount)))
				break;
			case '{arrowright}': 			// right arrow
				tipibot.moveDirect(tipibot.getPosition().add(new paper.Point(amount, 0)))
				break;
			case '{arrowdown}': 			// down arrow
				tipibot.moveDirect(tipibot.getPosition().add(new paper.Point(0, amount)))
				break;
			
			default:
				break;
		}
    }

    handleShift() {
        let currentLayout = this.keyboard.options.layoutName;
        let shiftToggle = currentLayout === "default" ? "shift" : "default";

        this.keyboard.setOptions({
            layoutName: shiftToggle
        })
    }
}

export var keyboard: VirtualKeyboard = null

export function initializeKeyboard() {
    keyboard = new VirtualKeyboard()
    return keyboard
}