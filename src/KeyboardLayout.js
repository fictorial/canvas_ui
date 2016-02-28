import  View from './View';

/**
 * An arrangement of keyboard key buttons.
 */

export default class KeyboardLayout extends View {
    constructor(keyboard) {
        super();

        this.keyboard = keyboard;
        this.backgroundColor = '#222';
        this.insets.setAll(10);
    }
}
