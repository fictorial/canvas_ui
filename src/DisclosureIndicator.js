import View from './View';
import {FingerSizePoints} from './magic';

/**
 * A view that indicates that its superview will reveal
 * or disclose a detail view with more options, whatever that
 * may mean given the context.
 */

export default class DisclosureIndicator extends View {
    constructor() {
        super();
        this.backgroundColor = 'white';
        this.userInteractionEnabled = false;
        this.borderColor = 'rgba(0,0,0,0.25)';
        this.borderWidth = 1;
    }

    addShapePath(context) {
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(this.width - 1, this.halfHeight);
        context.lineTo(0, this.height - 1);
        context.closePath();
        return this;
    }

    sizeToFit() {
        this.size.set(FingerSizePoints/4, FingerSizePoints/4);
        return this;
    }
}
