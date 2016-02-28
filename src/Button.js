import  Label from './Label';
import Point from './Point';
import {FingerSizePoints} from './magic';

/**
 * Use `onTap` slot for handling.
 */

export default class Button extends Label {
    constructor(text) {
        super(text);

        this.userInteractionEnabled = true;
        this.backgroundColor = '#fff';
        this.textColor = '#555';
        this._highlightedTextColor = '#333';
        this.textBaseline = 'middle';
        this.textAlign = 'center';
        this.insets.setAll(12);
        this.highlightsOnTouch = true;
        this._offsetsOnTouch = true;
    }

    get textColor() {
        return super.textColor;
    }

    set textColor(color) {
        super.textColor = color;
        this._normalTextColor = color;
    }

    get highlightedTextColor() {
        return this._highlightedTextColor;
    }

    set highlightedTextColor(color) {
        this._highlightedTextColor = color;
    }

    get offsetsOnTouch() {
        return this._offsetsOnTouch;
    }

    set offsetsOnTouch(yesNo) {
        this._offsetsOnTouch = yesNo;
        this.needsDisplay = true;
    }

    sizeToFit() {
        super.sizeToFit();
        this.height = Math.max(this.height, FingerSizePoints);
        return this;
    }

    touchStart(localPoint) {
        super.textColor = this.highlightedTextColor;

        if (this.offsetsOnTouch) {
            this.position.addSelf(new Point(0, 2));
        }

        super.touchStart(localPoint);
    }

    touchEnd(localPoint) {
        super.textColor = this._normalTextColor;

        if (this.offsetsOnTouch) {
            this.position.subSelf(new Point(0, 2));
        }

        super.touchEnd(localPoint);
    }

    keyPressed(key) {
        if (key === 'Enter') {
            this.emit('tap');
        }
    }
}
