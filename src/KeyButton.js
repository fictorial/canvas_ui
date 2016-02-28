import  View from './View';
import Button from './Button';
import {SystemFontOfSize} from './fonts';

/**
 * A button that acts as a keyboard button.
 *
 * Sends `keyPressed` to the first responder on tap.
 */

export default class KeyButton extends Button {
    constructor(letter, proxyKeyPressed=true) {
        super(letter);

        this.id = `Key ${letter}`;
        this.backgroundColor = '#555';
        this.textColor = '#ddd';
        this.font = SystemFontOfSize(14);
        this.insets.setAll(5);
        this.borderWidth = 0;

        if (proxyKeyPressed) {
            this.on('tap', () => {
                if (View.firstResponder) {
                    View.firstResponder.keyPressed(this.text);
                }
            });
        }
    }
}
