import  _ from 'lodash';
import ImageView from './ImageView';
import Size from './Size';

/**
 * An image comprised of sub-images, one of which is drawn
 * when the view is redrawn.
 *
 * Here's an example composite image with 3 columns, 4 rows,
 * and 10 total sub-images.  The number represents the sub-image's
 * "index".  Note that this example has 2 blank/unused;
 * sub-images in its last row.
 *
 *     +---+---+---+
 *     | 0 | 1 | 2 |
 *     +---+---+---+
 *     | 3 | 4 | 5 |
 *     +---+---+---+
 *     | 6 | 7 | 8 |
 *     +---+---+---+
 *     | 9 |   |   |
 *     +---+---+---+
 */

export default class CompositeImageView extends ImageView {

    /**
     * The given image is comprised of same-sized sub-images
     * arranged in a 2-D grid from top-left to bottom-right.
     * The grid has `columns` columns and `rows` rows.  The
     * number of sub-images is by default `rows x columns`
     * but if the last row is not full, specify `subimageCount`
     */

    constructor(image, columns, rows, subimageCount=0) {
        super(image, 'scaleToFill');

        if (!_.isFinite(columns) || columns <= 0 ||
            !_.isFinite(rows)    || rows    <= 0) {
            throw new Error('invalid geometry for composite image');
        }

        this._columns = columns|0;
        this._rows = rows|0;

        if (_.isFinite(subimageCount) &&
            subimageCount > 0 &&
            subimageCount < this._columns * this._rows) {
            this._subimageCount = subimageCount|0;
        } else {
            this._subimageCount = this._columns * this._rows;
        }

        this._index = 0;

        if (image.complete) {
            this._imageLoaded();
        } else {
            this.on('loaded', this._imageLoaded.bind(this));
        }
    }

    _imageLoaded() {
        let image = this._image;


        this._subimageSize = new Size(
            Math.floor(image.width  / this._columns),
            Math.floor(image.height / this._rows));

        this.needsDisplay = true;
    }

    get imageWidth() {
        return this._subimageSize ? this._subimageSize.width : 0;
    }

    get imageHeight() {
        return this._subimageSize ? this._subimageSize.height : 0;
    }

    /**
     * Explicitly get/set the index of the currently displayed sub-image.
     */

    get index() {
        return this._index;
    }

    set index(index) {
        if (_.isFinite(index) &&
            this._index !== index &&
            index >= 0 &&
            index < this._subimageCount) {

            this._index = index;
            this.needsDisplay = true;
        }
    }

    sizeToFit() {
        if (this._subimageSize) {
            this.size.copy(this._subimageSize);
        }
    }

    /**
     * Make the next sub-image current.
     *
     * If `wrapAround` is true then wrap around to the first sub-image
     * if advancing to the next would extend past the last sub-image.
     */

    makeNextCurrent(wrapAround=true) {
        let N = this._subimageCount,
            index = this.index;

        if (index + 1 === N) {
            if (wrapAround) {
                this.index = 0;
                this.needsDisplay = true;
            }
        } else {
            this.index = index + 1;
            this.needsDisplay = true;
        }
    }

    /**
     * Make the previous sub-image current.
     *
     * If `wrapAround` is true then wrap around to the last sub-image
     * if moving to the previous sub-image would extend before the
     * first sub-image.
     */

    makePreviousCurrent(wrapAround=true) {
        let N = this._subimageCount,
            index = this.index;

        if (index - 1 < 0) {
            if (wrapAround) {
                this.index = N - 1;
                this.needsDisplay = true;
            }
        } else {
            this.index = index - 1;
            this.needsDisplay = true;
        }
    }

    // Draw the current sub-image.

    drawImage(context, image, x, y, w, h) {
        let subimageSize = this._subimageSize;
        if (!subimageSize) {
            // Wait for image to load.
            return;
        }

        let index = this.index,
            cols = this._columns,
            subimageRow = Math.floor(index / cols),
            subimageCol = index % cols,
            subimageLeft = Math.round(subimageCol * subimageSize.width),
            subimageTop = Math.round(subimageRow * subimageSize.height);

        context.drawImage(image,
            subimageLeft, subimageTop, subimageSize.width, subimageSize.height,
            x, y, w, h);
    }
}
