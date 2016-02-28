import  _ from 'lodash';
import View from './View';
import wordWrap from './wordWrap';
import {getContext} from './core';
import Point from './Point';
import {transparent} from './magic';

/**
 * A view of word-wrapped, multiline, read-only text.
 *
 * Word-wrapping is affected by:
 * - text
 * - line height
 * - insets
 *
 * Set `.text` and `.lineHeight` to alter each.
 *
 * For scrollable text, see `ScrollableTextView`.
 *
 * Warning: this holds 2 copies of the text, one in original string
 * form and another in computed lines. You may set .text to null after
 * layout is performed (see `didLayoutSubviews`) if you are certain that
 * no further layout will be performed.
 *
 * The word wrapper assumes left-to-right flow and thus right alignment
 * may not look as nice.
 */

export default class TextView extends View {
    constructor(text, lineHeight = 0) {
        if (!_.isString(text)) {
            throw new Error('expected text');
        }

        super();

        this._text = text;
        this._lineHeight = lineHeight;
        this._lines = null;

        this.textColor = '#333';
        this.backgroundColor = transparent;
    }

    layoutSubviews() {
        let context = getContext();

        context.save();
        context.font = this.font;

        if (this._lineHeight <= 0) {
            this._lineHeight = Math.round(context.measureText('M').width * 1.7);
        }

        let maxWidth = this.contentWidth;
        if (maxWidth > 0) {
            this._lines = wordWrap(this.text, this.contentTop, maxWidth, this.lineHeight);
        } else {
            this._lines = [];
        }

        context.restore();
    }

    get text() {
        return this._text;
    }

    set text(text) {
        this._text = text;
        this.needsLayout = true;
    }

    get lineHeight() {
        return this._lineHeight;
    }

    set lineHeight(lineHeight) {
        this._lineHeight = Math.round(Math.max(0, lineHeight));
        this.needsLayout = true;
    }

    draw(context) {
        super.draw(context);

        let lines = this._lines;
        if (_.isEmpty(lines)) {
            return;
        }

        // Render lines that are visible.

        let point = new Point(),
            lineCount =  lines.length,
            lineHeight = this.lineHeight;

        var startIndex = -1,
            endIndex = -1,
            i;

        for (i = 0; i < lineCount; ++i) {
            let line = lines[i];

            point.y = line.top + lineHeight;
            var bottomVisible = this.isPointVisibleToRootView(point);
            if (bottomVisible) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            return;
        }

        for (i = lineCount - 1; i >= startIndex; --i) {
            let line = lines[i];

            point.y = line.top;
            var topVisible = this.isPointVisibleToRootView(point);
            if (topVisible) {
                endIndex = i;
                break;
            }
        }

        context.fillStyle = this.textColor;
        context.textAlign = this.textAlign;
        context.textBaseline = 'top';

        let leftAlign = this.textAlign === undefined || this.textAlign === 'left',
            centerAlign = this.textAlign === 'center',
            x = leftAlign ? this.contentLeft : (centerAlign ? this.contentCenterX : this.contentRight);

        for (i = startIndex; i <= endIndex; ++i) {
            let line = lines[i];
            context.fillText(this._text.substring(line.start, line.end), x, line.top);
        }
    }
}
