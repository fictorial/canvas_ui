import  Button from './Button';
import Point from './Point';
import {transparent} from './magic';

/**
 * A view for editing a boolean value which may be toggled between isOn/true and off/false.
 *
 * On:
 *
 *     +-----------------------+
 *     | Text          (   ()) |
 *     +-----------------------+
 *
 * Off:
 *
 *     +-----------------------+
 *     | Text          (()   ) |
 *     +-----------------------+
 *
 * Events:
 * - valueChanged(isOn)
 */

export default class ToggleView extends Button {
    constructor(text, isOn=false) {
        super(text);

        this._isOn = !!isOn;
        this._onColor = '#6e6';
        this._offColor = '#e66';

        this.textAlign = 'left';
        this.backgroundColor = transparent;
        this.borderWidth = 0;
        this.cornerRadius = 0;
        this.clipsSubviews = false;  // allow shadow leak
        this.offsetsOnTouch = false;
        this.highlightsOnTouch = false;
        this.highlightedTextColor = '#fff';
    }

    get isOn() {
        return this._isOn;
    }

    set isOn(yesNo) {
        this._isOn = !!yesNo;
        this._needsDisplay = true;
        this.circleCenter = this.circleCenterForState();
    }

    get onColor() {
        return this._onColor;
    }

    set onColor(c) {
        this._onColor = c;
        this.needsDisplay = true;
    }

    get offColor() {
        return this._offColor;
    }

    set offColor(c) {
        this._offColor = c;
        this.needsDisplay = true;
    }

    layoutSubviews() {
        super.layoutSubviews();
        this.circleRadius = Math.round((this.height * 0.95)/2);
        this.circleCenter = this.circleCenterForState();
        return this;
    }

    draw(context) {
        super.draw(context);

        // Draw circle container.
        let r = this.circleRadius;
        context.save();
        context.translate(this.width - r*3, this.halfHeight - r);
        context.beginPath();
        context.roundRect(0, 0, r*3, r*2, r);
        context.fillStyle = this.isOn ? this.onColor : this.offColor;
        context.fill();
        context.restore();

        // Draw isOn/off circle
        context.beginPath();
        context.arc(this.circleCenter.x, this.circleCenter.y, r, 0, 2*Math.PI, false);
        context.fillStyle = this.highlighted && '#eee' || '#fff';
        context.shadowColor = 'rgba(0,0,0,0.5)';
        context.shadowBlur = r/5;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = r/10;
        context.fill();
    }

    circleCenterForState() {
        if (this.isOn) {
            // Align to the right of the container when isOn.
            return new Point(this.width - this.circleRadius, this.center.y);
        }

        // Align to the left when off.
        return new Point(this.width - this.circleRadius*2, this.center.y);
    }

    tapped(localPoint) {
        super.tapped(localPoint);
        this.isOn = !this.isOn;
        this.emit('valueChanged', this.isOn);
    }
}
