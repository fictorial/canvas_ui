import  _ from 'lodash';
import View from './View';
import ProgressBar from './ProgressBar';
import SliderThumb from './SliderThumb';
import Frame from './Frame';

/**
 * A view of a editable value limited to a numeric range (min, max).
 *
 * Horizontal: min to max is left-to-right.
 * Vertical: min to max is bottom-to-top.
 *
 * The value is altered by dragging the slider "thumb".  If `.step` is set, values are
 * quantized to increments of `.step`.
 *
 * Events:
 * - valueChanged(newValue)
 */

export default class Slider extends View {
    constructor({horizontal, value, minValue, maxValue, step}) {
        super();

        minValue = minValue || 0;
        maxValue = maxValue || 100;
        value = value || 0;
        horizontal = !!horizontal;
        step = step || 1;

        this._minValue = Math.min(minValue, maxValue);
        this._maxValue = Math.max(maxValue, minValue);
        this._step = Math.max(0, step);

        this.clipsSubviews = false;

        this.progressBar = new ProgressBar();
        this.progressBar.horizontal = horizontal;
        this.progressBar.barColor = '#aaa';
        this.progressBar.backgroundColor = '#eee';
        this.addSubview(this.progressBar);

        this.thumb = new SliderThumb();
        this.thumb.backgroundColor = '#fff';
        this.addSubview(this.thumb);

        this.thumb.draggable = true;
        this.thumb.on('dragUpdated', function (point) {
            let slider = this.superview,
                progressBar = slider.progressBar;

            var value;
            if (slider.horizontal) {
                value = (point.x - progressBar.left) / progressBar.width;
            } else {
                value = (progressBar.bottom - point.y) / progressBar.height;
            }

            slider.normalizedValue = value;
        });

        this.value = Math.max(this._minValue, Math.min(value, this._maxValue));
    }

    get horizontal() {
        return this.progressBar.horizontal;
    }

    get thumbSize() {
        return this.horizontal ? this.height : this.width;
    }

    layoutSubviews() {
        let thumbSize = this.thumbSize;

        var progressBarInsetMajorAxis = Math.round(thumbSize/2),
            progressBarInsetMinorAxis = Math.round(thumbSize/4),
            progressBarRect;

        if (this.horizontal) {
            progressBarRect = Frame.makeFrame(
                progressBarInsetMajorAxis,
                progressBarInsetMinorAxis,
                this.width - progressBarInsetMajorAxis*2,
                this.height - progressBarInsetMinorAxis*2);
        } else {
            progressBarRect = Frame.makeFrame(
                progressBarInsetMinorAxis,
                progressBarInsetMajorAxis,
                this.width - progressBarInsetMinorAxis*2,
                this.height - progressBarInsetMajorAxis*2);
        }

        this.progressBar.frame = progressBarRect;

        this.thumb.size.set(thumbSize, thumbSize);

        if (_.isFinite(this._value)) {
            this.value = this._value;   // moves thumb into correct move.
        }
    }

    get normalizedValue() {
        return (this._value    - this._minValue) /
               (this._maxValue - this._minValue);
    }

    set normalizedValue(value) {
        this.value = this._minValue +
            Math.max(0, Math.min(1, value)) *
            (this._maxValue - this._minValue);
    }

    get value() {
        return this._value;
    }

    set value(value) {
        let previousValue = this._value;

        value = this._step * Math.floor(
            Math.max(this._minValue, Math.min(this._maxValue, value)) / this._step);
        this._value = value;

        let nv = this.normalizedValue;
        this.progressBar.progress = nv;

        if (this.horizontal) {
            this.thumb.position.set(Math.round(this.progressBar.left +
                this.progressBar.width * nv - this.thumb.halfWidth), 0);
        } else {
            this.thumb.position.set(0, Math.round(this.progressBar.top +
                this.progressBar.height - this.progressBar.height * nv -
                this.thumb.halfHeight));
        }

        if (value !== previousValue) {
            this.emit('valueChanged', value);
        }

        this.needsDisplay = true;
    }

    toString() {
        return super.toString().replace('Slider',
            `Slider.${this.horizontal ? 'horizontal' : 'vertical'}`);
    }
}
