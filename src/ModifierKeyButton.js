import  KeyButton from './KeyButton';

export default class ModifierKeyButton extends KeyButton {
    constructor(letter) {
        super(letter, false);
    }

    restoreColors() {
        this.backgroundColor = '#444';
        this.textColor = '#ddd';
    }

    invertColors() {
        this.backgroundColor = '#ddd';
        this.textColor = '#444';
    }
}
