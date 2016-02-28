import  View from './View';
import {SystemFontOfSize} from './fonts';

/**
 * Just draws a grid with major (thicker) and minor lines.
 *
 * Think graph paper.
 */

export default class GridView extends View {
    constructor(minorLineSpacing=10,
                majorLineSpacing=100) {

        super();

        this._minorLineSpacing = minorLineSpacing;
        this._majorLineSpacing = majorLineSpacing;

        this._minorLineColor = '#eee';
        this._majorLineColor = '#aaa';

        this._minorLineWidth = 1;
        this._majorLineWidth = 2;

        this._showMajorLabels = true;
        this._font = SystemFontOfSize(9);
        this._textColor = '#aaa';
    }

    get minorLineSpacing() {
        return this._minorLineSpacing;
    }

    set minorLineSpacing(value) {
        if (this._minorLineSpacing !== value) {
            this._minorLineSpacing = value;
            this.needsDisplay = true;
        }
    }

    get majorLineSpacing() {
        return this._majorLineSpacing;
    }

    set majorLineSpacing(value) {
        if (this._majorLineSpacing !== value) {
            this._majorLineSpacing = value;
            this.needsDisplay = true;
        }
    }

    get minorLineColor() {
        return this._minorLineColor;
    }

    set minorLineColor(value) {
        if (this._minorLineColor !== value) {
            this._minorLineColor = value;
            this.needsDisplay = true;
        }
    }

    get majorLineColor() {
        return this._majorLineColor;
    }

    set majorLineColor(value) {
        if (this._majorLineColor !== value) {
            this._majorLineColor = value;
            this.needsDisplay = true;
        }
    }

    get minorLineWidth() {
        return this._minorLineWidth;
    }

    set minorLineWidth(value) {
        if (this._minorLineWidth !== value) {
            this._minorLineWidth = value;
            this.needsDisplay = true;
        }
    }

    get majorLineWidth() {
        return this._majorLineWidth;
    }

    set majorLineWidth(value) {
        if (this._majorLineWidth !== value) {
            this._majorLineWidth = value;
            this.needsDisplay = true;
        }
    }

    get showMajorLabels() {
        return this._showMajorLabels;
    }

    set showMajorLabels(value) {
        if (this._showMajorLabels !== value) {
            this._showMajorLabels = value;
            this.needsDisplay = true;
        }
    }

    get font() {
        return this._font;
    }

    set font(value) {
        if (this._font !== value) {
            this._font = value;
            this.needsDisplay = true;
        }
    }

    get textColor() {
        return this._textColor;
    }

    set textColor(value) {
        if (this._textColor !== value) {
            this._textColor = value;
            this.needsDisplay = true;
        }
    }

    draw(context) {
        super.draw(context);

        this.drawGrid(context,
                      this.minorLineWidth,
                      this.minorLineSpacing,
                      this.minorLineColor,
                      false);

        this.drawGrid(context,
                      this.majorLineWidth,
                      this.majorLineSpacing,
                      this.majorLineColor,
                      this.showMajorLabels);
    }

    drawGrid(context, lineWidth, spacing, color, showLabels) {
        if (showLabels) {
            context.fillStyle = this.textColor;
        }

        context.beginPath();

        let width = this.width,
            height = this.height,
            cl = this.contentLeft,
            cr = this.contentRight,
            ct = this.contentTop,
            cb = this.contentBottom;

        // Horizontal

        for (var y = 0; y < height; y += spacing) {
            context.moveTo(0, y);
            context.lineTo(width, y);

            if (showLabels && y > 0) {
                context.textBaseline = 'top';
                context.textAlign = 'left';
                context.fillText(y, cl, y+lineWidth);

                context.textAlign = 'right';
                context.fillText(y, cr, y+lineWidth);
            }
        }

        // Vertical

        for (var x = 0; x < width; x += spacing) {
            context.moveTo(x, 0);
            context.lineTo(x, height);

            if (showLabels && x > 0) {
                context.textAlign = 'left';
                context.textBaseline = 'top';
                context.fillText(x, x+lineWidth, ct);

                context.textBaseline = 'bottom';
                context.fillText(x, x+lineWidth, cb);
            }
        }

        context.closePath();

        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke();
    }
}
