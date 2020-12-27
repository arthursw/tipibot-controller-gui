import 'simple-keyboard/build/css/index.css';
import Keyboard from 'simple-keyboard';

export class VirtualKeyboard {
    keyboard: Keyboard

    constructor() {

        this.hideKeyboard()

        this.keyboard = new Keyboard({
            onChange: input => this.onChange(input),
            onKeyPress: button => this.onKeyPress(button)
        })

        this.addFocusListenerWhenCreatingInputs()
    }

    showKeyboard() {
        $('.simple-keyboard').show()
    }

    hideKeyboard() {
        $('.simple-keyboard').hide()
    }

    addFocusListenerWhenCreatingInputs() {

        // Select the node that will be observed for mutations
        const body = document.getElementById('body')

        // Options for the observer (which mutations to observe)
        const config = { attributes: false, childList: true, subtree: false }

        // Callback function to execute when mutations are observed
        const callback = function (mutationsList: MutationRecord[], observer: MutationObserver) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    console.log('A child node has been added or removed.')
                    for(const node of mutation.addedNodes) {
                        if(node.nodeName.toLowerCase() == 'input') {
                            node.addEventListener('focus', ()=> this.showKeyboard())
                            node.addEventListener('blur', ()=> this.hideKeyboard())
                        }
                    }
                }
            }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback)

        // Start observing the target node for configured mutations
        observer.observe(body, config)
    }

    onChange(input: any) {
        let activeElement: any = document.activeElement
        if ((activeElement as any).value != null && document.activeElement.tagName.toLowerCase() == 'input') {
            activeElement.value = input
        }
        console.log("Input changed", input)
    }

    onKeyPress(button: any) {
        console.log("Button pressed", button)
    }
}