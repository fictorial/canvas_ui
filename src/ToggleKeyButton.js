import  ModifierKeyButton from './ModifierKeyButton';

/**
 * A keyboard key that can be toggled between
 * selected and unselected states by tapping it.
 *
 * Events:
 * - selectedChanged(isSelected)
 */

export default class ToggleKeyButton extends ModifierKeyButton {
    constructor(deselectedText, selectedText) {
        super(deselectedText);

        this.deselectedText = deselectedText;
        this.selectedText = selectedText;
    }

    tapped() {
        this.selected = !this.selected;
        super.tapped();
    }

    get selected() {
        return this._selected;
    }

    set selected(selected) {
        if (selected) {
            this.invertColors();
            this.text = this.selectedText;
        } else {
            this.restoreColors();
            this.text = this.deselectedText;
        }

        if (this._selected != selected) {
            this._selected = selected;
            this.emit('selectedChanged', selected);
        }
    }
}

