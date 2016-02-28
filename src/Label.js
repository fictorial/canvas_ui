import  View from './View';
import {getContext} from './core';
import {lineHeight} from './fonts';
import {transparent} from './magic';

/**
 * A read-only single line of text.
 *
 * Events:
 * - textChanged(entireNewText);
 */

export default class Label extends View {
    constructor(text) {
        super();

        this.backgroundColor = transparent;

        this._text = text || '';
        this._textColor = '#333';
        this._tailTruncation = 'ellipsis';

        this._textAlign = 'left';
        this._textBaseline = 'middle';

        this._textOutlineWidth = null;
        this._textOutlineColor = null;
        this._textOutlineOffset = null;

        this._textShadowBlur = null;
        this._textShadowColor = null;
        this._textShadowOffsetX = null;
        this._textShadowOffsetY = null;

        this.userInteractionEnabled = false;
    }

    set text(text) {
        if (this._text !== text) {
            this._text = text || '';
            this.needsLayout = true;
            this.emit('textChanged', this._text);
        }
    }

    get text() {
        return this._text;
    }

    set tailTruncation(tailTruncation) {
        this._tailTruncation = tailTruncation;
        this.needsLayout = true;
    }

    get tailTruncation() {
        return this._tailTruncation;
    }

    get textAlign() {
        return this._textAlign;
    }

    set textAlign(textAlign) {
        this._textAlign = textAlign;
        this.needsDisplay = true;
    }

    get textBaseline() {
        return this._textBaseline;
    }

    set textBaseline(textBaseline) {
        this._textBaseline = textBaseline;
        this.needsDisplay = true;
    }

    get textColor() {
        return this._textColor;
    }

    set textColor(c) {
        this._textColor = c;
        this.needsDisplay = true;
    }

    get textOutlineWidth() {
        return this._textOutlineWidth;
    }

    set textOutlineWidth(width) {
        if (this._textOutlineWidth !== width) {
            this._textOutlineWidth = width;
            this.needsDisplay = true;
        }
    }

    get textOutlineColor() {
        return this._textOutlineColor;
    }

    set textOutlineColor(color) {
        if (this._textOutlineColor !== color) {
            this._textOutlineColor = color;
            this.needsDisplay = true;
        }
    }

    get textOutlineOffset() {
        return this._textOutlineOffset;
    }

    set textOutlineOffset(offset) {
        this._textOutlineOffset = offset;
        this.needsDisplay = true;
    }

    // text shadow {{{

    get textShadowBlur() {
        return this._textShadowBlur;
    }

    set textShadowBlur(blur) {
        if (this._textShadowBlur !== blur) {
            this._textShadowBlur = blur;
            this.needsDisplay = true;
        }
    }

    get textShadowColor() {
        return this._textShadowColor;
    }

    set textShadowColor(color) {
        if (this._textShadowColor !== color) {
            this._textShadowColor = color;
            this.needsDisplay = true;
        }
    }

    get textShadowOffsetX() {
        return this._textShadowOffsetX;
    }

    set textShadowOffsetX(offset) {
        this._textShadowOffsetX = offset;
        this.needsDisplay = true;
    }

    get textShadowOffsetY() {
        return this._textShadowOffsetY;
    }

    set textShadowOffsetY(offset) {
        this._textShadowOffsetY = offset;
        this.needsDisplay = true;
    }

    // }}}

    /**
     * Makes the content frame of this label tightly fit the text.;
     * Be sure to set insets beforehand.
     */

    sizeToFit() {
        let context = getContext();

        context.save();
        context.font = this.font;

        let textWidth = Math.ceil(context.measureText(this.text).width) + 1,
            insets = this.insets,
            lh = lineHeight(this.font);

        this.size.set(insets.left + textWidth + insets.right,
                      insets.top + lh + insets.bottom);

        context.restore();

        return this;
    }

    textLeft(/*context*/) {
        switch (this.textAlign) {
        case 'left':   return this.contentLeft;
        case 'center': return this.contentCenterX;
        case 'right':  return this.contentRight;
        }
    }

    textTop(/*context*/) {
        switch (this.textBaseline) {
        case 'top':    return this.contentTop;
        case 'middle': return this.contentCenterY;
        case 'bottom': return this.contentBottom;
        }
    }

    draw(context) {
        super.draw(context);

        let x = Math.round(this.textLeft(context)),
            y = Math.round(this.textTop(context));

        context.textAlign = this.textAlign;
        context.textBaseline = this.textBaseline;

        // if requested, tail-truncate if the text doesn't fit in the content frame.

        var text = this.text;
        if (this.tailTruncation === 'ellipsis') {
            var w = Math.ceil(context.measureText(text).width);

            let contentRight = this.contentRight,
                contentLeft  = this.contentLeft;

            var truncatedText = text;

            if (contentLeft + w > this.contentRight) {        // assumes left to right flow
                for (var indexEnd = text.length - 1; indexEnd > 0; --indexEnd) {
                    truncatedText = text.substring(0, indexEnd) + '…';
                    w = context.measureText(truncatedText).width;

                    if (contentLeft + w < contentRight) {
                        text = truncatedText;
                        break;
                    }
                }

                if (truncatedText.length === 2) {
                    text = truncatedText;
                }
            }
        }

        // Always clip to the content frame.

        context.save();

        context.beginPath();
        let cf = this.contentFrame;
        context.rect(cf.origin.x, cf.origin.y, cf.size.width, cf.size.height);
        context.closePath();
        context.clip();

        // Fill in text, maybe shadowed.

        if (View.shadowsEnabled &&
            this.textShadowBlur !== undefined &&
            this.textShadowColor !== undefined) {
            context.shadowBlur = this.textShadowBlur;
            context.shadowColor = this.textShadowColor;
            context.shadowOffsetX = this.textShadowOffsetX || 0;
            context.shadowOffsetY = this.textShadowOffsetY || 0;
        } else {
            context.shadowBlur = 0;
            context.shadowColor = null;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        context.fillStyle = this.textColor;
        context.fillText(text, x, y);

        context.shadowBlur = 0;
        context.shadowColor = null;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;

        // Stroke/outline text atop filled text.
        // Definitely not shadowed.

        if (this.textOutlineWidth && this.textOutlineColor) {
            // No shadows on text outlines/strokes

            context.lineWidth = this.textOutlineWidth;
            context.strokeStyle = this.textOutlineColor;

            if (this.textOutlineOffset) {
                context.strokeText(text, x + this.textOutlineOffset.x, y + this.textOutlineOffset.y);
            } else {
                context.strokeText(text, x, y);
            }
        }

        context.restore();
    }
}
