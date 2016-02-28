import  View from './View';

/**
 * A view which shows progress of some long-running action.
 * Set `horizontal` to `false` for a vertically-oriented progress bar.
 * Horizontal progress runs left-to-right while vertical progress runs bottom-to-top.
 * `progress` is in the range of [0-1].
 * Set `.barColor` to control appearance (default: red).
 */

export default class ProgressBar extends View {
    constructor(progress=0, horizontal=true, barColor='#f00') {
        super();

        this.progress = progress;
        this._horizontal = horizontal;
        this._barColor = barColor;

        this.userInteractionEnabled = false;
    }

    get horizontal() {
        return this._horizontal;
    }

    set horizontal(yesNo) {
        this._horizontal = yesNo;
        this.needsDisplay = true;
    }

    get barColor() {
        return this._barColor;
    }

    set barColor(color){
        if (this._barColor !== color) {
            this._barColor = color;
            this.needsDisplay = true;
        }
    }

    get progress() {
        return this._progress;
    }

    set progress(p) {
        this._progress = Math.max(0, Math.min(1, p));
        this.needsDisplay = true;
    }

    draw(context) {
        super.draw(context);

        let width = this.width,
            height = this.height;

        if (this.horizontal) {
            if (this.cornerRadius > 0) {
                context.roundRect(0, 0, this.progress * width, height, this.cornerRadius);
            } else {
                context.beginPath();
                context.rect(0, 0, this.progress * width, height);
                context.closePath();
            }
        } else {   // vertical
            if (this.cornerRadius > 0) {
                context.save();
                context.translate(0, height - this.progress * height);
                context.roundRect(0, 0, width, this.progress * height, this.cornerRadius);
                context.restore();
            } else {
                context.beginPath();
                context.rect(0, height - this.progress * height, width, this.progress * height);
                context.closePath();
            }
        }

        context.fillStyle = this.barColor;
        context.fill();
    }

    toString() {
        return super.toString() + (this.horizontal ? 'H' : 'V');
    }
}
