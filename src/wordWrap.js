import  _ from 'lodash';
import {getContext} from './core';

let glyphWidths = {},
    whitespace = ' \n\t\r',
    newlines = '\n\r';

/**
 * Returns array of lines of the form `[{start:int, end:int, top:int}]`
 * where `start` and `end` are indices into `text`. Use `text.substring` to
 * pull out the text for each line. The advantage here is that only a subset
 * of the text will be visible and using substring is more advantageous than
 * storing each line explicitly a second time (once in each line object, another
 * in `text`).
 *
 * Assumptions:
 *
 * - `context.font` is expected to be set before calling this.
 *
 * - codepoints in `codepointRange` will use actual glyph widths for the codepoints that
 *   fall in this range; otherwise, this will fallback
 *   to a glyph width equal to that of the letter 'x' (i.e. treated as monospace)
 *   which is more conservative and will provide lower-quality word-wrapping.
 */

export default function wordWrap(text, y, maxWidth, lineHeight, codepointRange = [0,1024]) {
    let context = getContext(),
        defaultGlyphWidth = context.measureText('x').width,
        x = 0,
        letters = text.split(''),
        n = letters.length,
        lines = [],
        start = 0,
        space = 0,
        font = context.font;

    // Cache glyph widths for the given code point range and font.

    if (!_.has(glyphWidths, font)) {
        glyphWidths[font] = {};

        _.each(_.range(codepointRange[0], codepointRange[1]), i => {
            let str = String.fromCharCode(i);
            glyphWidths[font][str] = context.measureText(str).width;
        });
    }

    for (var i = 0; i < n; ++i) {
        let letter = letters[i],
            glyphWidth = glyphWidths[font][letter] || defaultGlyphWidth;

        if (whitespace.indexOf(letter) !== -1) {
            space = i;
        }

        if (newlines.indexOf(letter) !== -1 || x + glyphWidth >= maxWidth) {
            lines.push({start, end:space, top:y});
            x = 0;
            y += lineHeight;
            start = space + 1;
            i = space;
        } else {
            x += glyphWidth;
        }
    }

    if (start < n) {
        lines.push({start, end:n, top:y});
    }

    return lines;
}

