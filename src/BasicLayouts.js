import  _ from 'lodash';
import Frame from './Frame';
import Point from './Point';
import Size from './Size';

/**
 * Lays out the given subviews of a the given view
 * with a top-to-bottom left-to-right natural flow.
 *
 * By "natural" we mean to say that each subview is asked
 * to `sizeToFit` to determine its frame size before
 * determining its position.
 *
 * `opts` is an object containing:
 * - `hMargin`: horizontal margin between views of the same "line"
 * - `vMargin`: vertical margin between lines
 *
 * Notes:
 *
 * - subviews are laid out within the content rect of the view.
 * - the tallest subview per line determines the height of that line.
 * - all subviews on the same line have their _tops_ aligned.
 */

export function layoutNaturalFlow(view, subviews, opts={hMargin:10, vMargin:10}) {
    let hMargin = _.isFinite(opts.hMargin) ? opts.hMargin : 10,
        vMargin = _.isFinite(opts.vMargin) ? opts.vMargin : 10,
        contentLeft = view.contentLeft,
        contentRight = view.contentRight;

    var x = contentLeft,
        y = view.contentTop,
        maxHeightCurrentLine = 0;

    _.each(subviews, subview => {
        subview.sizeToFit();   // hence "natural"
        maxHeightCurrentLine = Math.max(maxHeightCurrentLine, subview.height);

        subview.position.set(x, y);
        if (subview.right + hMargin >= contentRight) {
            // Doesn't fit, flow to next "line"

            x = contentLeft;
            y += maxHeightCurrentLine + vMargin;
            subview.position.set(x, y);
            maxHeightCurrentLine = 0;
        }

        x += subview.width + hMargin;
    });
}

/**
 * Lays out subviews as a centered vertical stack inside view.
 * Each subview is asked to size itself first.
 *
 * opts:
 *
 * - `vMargin`: vertical space between each subview. default: 10.
 * - `minWidth`: min allowed width of each subview. default: 0.
 * - `maxWidth`: max allowed width of each subview. default: 0.
 * - `equalWidths`: if true, all subviews take on width of widest subview. default false.
 * - `gravity`: 'top', 'bottom', or 'middle'. Where to vertically move the
 *   stack of subviews relative to the given (super)view. default: 'middle'.
 */

export function layoutAsVerticalStack(view, subviews, opts) {
    opts = opts || {};

    let vMargin = _.isFinite(opts.vMargin) ? opts.vMargin : 10,
        maxWidth = opts.maxWidth || 0,
        minWidth = opts.minWidth || 0,
        equalWidths = !!opts.equalWidths;

    var y = 0,
        widestWidth = 0;

    _.each(subviews, sv => {
        sv.sizeToFit();
        if (sv.width > widestWidth) widestWidth = sv.width;
        y += sv.marginTop || 0;
        sv.top = y;
        y += sv.height + (sv.marginBottom || vMargin);
    });

    if (maxWidth > 0)
        widestWidth = Math.min(maxWidth, widestWidth);

    let gravity = opts.gravity || 'middle',
        cx = view.halfWidth,
        stackHeight = y;

    var topOffset;
    switch (gravity) {
    case 'top':
        topOffset = view.contentTop;
        break;

    case 'middle':
        topOffset = view.contentTop + (view.contentHeight - stackHeight) / 2;
        break;

    case 'bottom':
        topOffset = view.contentTop + view.contentBottom - stackHeight;
        break;
    }

    _.each(subviews, subview => {
        subview.top += topOffset;
        if (equalWidths) subview.width = widestWidth;
        if (minWidth > 0) subview.width = Math.max(subview.width, minWidth);
        subview.centerX = cx;
    });
}

/**
 * Layout subviews in a row-major top-left-to-bottom-right grid with fixed size cells.
 *
 * Cell size is determined from the number of columns requested, the current size
 * of the given container view, and the number of subviews.
 *
 * To be clear, all subviews will have the same size frame.
 *
 * options:
 * - `columns`: number of columns; defaults to 1.
 */

export function layoutAsGrid(view, subviews, opts) {
    let columns = opts.columns || 1,
        cellWidth = view.contentWidth / columns,
        rows = Math.ceil(subviews.length / columns),
        cellHeight = view.contentHeight / rows,
        cellFrame = new Frame(new Point(view.contentLeft, view.contentTop), new Size(cellWidth, cellHeight));

    _.each(subviews, (subview, index) => {
        subview.frame.copy(cellFrame);
        if (index % columns === 0) {
            cellFrame.origin.set(0, cellFrame.origin.y + cellHeight);
        } else {
            cellFrame.origin.x += cellWidth;
        }
    });
}

/**
 * Layout the given subviews in the center of a grid of cells.
 *
 * Each subview is asked to size itself and is moved in the center
 * of each cell.
 *
 * options:
 * - `columns`: number of columns; defaults to 1.
 */

export function layoutCenteredGrid(view, subviews, opts) {
    let columns = opts.columns || 1,
        cellWidth = view.contentWidth / columns,
        rows = Math.ceil(subviews.length / columns),
        cellHeight = view.contentHeight / rows,
        startCenterX = view.contentLeft + cellWidth/2,
        center = new Point(startCenterX, view.contentTop + cellHeight/2),
        noSizeToFit = !!opts.noSizeToFit;

    _.each(subviews, (subview, index) => {
        if (!noSizeToFit) {
            subview.sizeToFit();
        }

        subview.center = center;

        if ((index+1) % columns  === 0) {
            center.x = startCenterX;
            center.y += cellHeight;
        } else {
            center.x += cellWidth;
        }
    });
}

