import  _ from 'lodash';
import View from './View';

/**
 * A view which shows an animated set of lines to indicate
 * to the user that "something is happening, please wait".
 *
 * Initially is not animated; set `animating` to true when
 * ready to animate.
 */

export default class ActivityIndicatorView extends View {
    constructor() {
        super();

        this.userInteractionEnabled = false;

        this._lineCount = 360 / 24;
        this._lineColor = '#333';
        this._lineLengthPercent = 0.5;
        this._lineWidth = 2;
        this._startAngle = 0;
        this._animating = false;
    }

    get lineCount() {
        return this._lineCount;
    }

    set lineCount(n) {
        if (_.isFinite(n) && n > 0 && n !== this._lineCount) {
            this._lineCount = n;
            this.needsDisplay = true;
        }
    }

    get lineColor() {
        return this._lineColor;
    }

    set lineColor(color) {
        if (_.isString(color) && this._lineColor !== color) {
            this._lineColor = color;
            this.needsDisplay = true;
        }
    }

    get lineLengthPercent() {
        return this._lineLengthPercent;
    }

    set lineLengthPercent(p) {
        if (_.isFinite(p)) {
            p = Math.max(0, Math.min(1, p));
            this._lineLengthPercent = p;
            this.needsDisplay = true;
        }
    }

    get lineWidth() {
        return this._lineWidth;
    }

    set lineWidth(width) {
        if (_.isFinite(width) && width > 0 && this._lineWidth !== width) {
            this._lineWidth = width;
            this.needsDisplay = true;
        }
    }

    get animating() {
        return this._animating;
    }

    set animating(onOff) {
        this._animating = onOff;

        if (onOff) {
            this.addAnimation({
                name: 'startAngle',
                endValues: {startAngle: -2 * Math.PI},
                duration: 1200,
                playCount: Infinity
            });
        }
    }

    get hidden() {
        return super.hidden;
    }

    set hidden(hidden) {
        super.hidden = hidden;
        if (hidden) {
            this.animating = false;
        }
    }

    get startAngle() {
        return this._startAngle;
    }

    set startAngle(a) {
        this._startAngle = a;
        this.needsDisplay = true;
    }

    draw(context) {
        super.draw(context);

        let center = this.center,
            r = Math.min(this.contentWidth, this.contentHeight)/2,
            angleStep = 2 * Math.PI / this.lineCount,
            len = Math.min(1, Math.max(0, this.lineLengthPercent));

        context.beginPath();

        for (var i = 0, angle = this.startAngle;
             i < this.lineCount;
             angle += angleStep, ++i) {

            let s = Math.sin(angle),
                c = Math.cos(angle);

            context.moveTo(center.x + c * r * len,
                           center.y - s * r * len);

            context.lineTo(center.x + c * r,
                           center.y - s * r);
        }

        context.closePath();
        context.lineWidth = Math.max(1, this.lineWidth);
        context.strokeStyle = this.lineColor;
        context.stroke();
    }
}
