import  Button from './Button';
import {SystemFontOfSize} from './fonts';

/**
 * A button for the left and right sides of a NavigationBar.
 *
 * This exists for common styling.
 */

export default class NavigationButton extends Button {
    constructor(text) {
        super(text);

        this.shadowBlur = 0;
        this.borderWidth = 0;
        this.textColor = '#0078fd';
        this.backgroundColor = '#fff';
        this.font = SystemFontOfSize(14);
        this.cornerRadius = 0;
        this.offsetsOnTouch = false;
    }
}
