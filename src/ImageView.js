import  _ from 'lodash';
import View from './View';

/**
 * A view of an raster image.
 *
 * If `image` is actually a string, it is considered a URL from
 * which the image is loaded.
 *
 * Set `.scalingMode` to one of `"scaleToFill"`, `"scaleAspectFit"`, or
 * `"scaleAspectFill"`.
 *
 * The image is always drawn with its center at the view's content center.
 *
 * `"scaleToFill"` means the image is drawn to fit the content frame of the image view,
 * scaling/stretching as needed.
 *
 * `"scaleAspectFit"` means the image is drawn to fit the content frame of the image view,
 * scaling as needed but preserving aspect ratio and never extending beyond the content
 * frame.
 *
 * `"scaleAspectFill"` means the image is drawn to fit the content frame of the image view,
 * scaling as needed but preserving aspect ratio and allow the image to extend beyond the content
 * frame.
 */

export default class ImageView extends View {
    constructor(image, scalingMode = 'scaleAspectFit') {
        super();

        this.image = image;
        this._scalingMode = scalingMode;

        this.userInteractionEnabled = false;
    }

    get image() {
        return this._image;
    }

    set image(image) {
        let imageDidLoad = () => {
            this.emit('loaded');

            if (this.superview) {
                this.superview.needsLayout = true;
            }

            this.needsDisplay = true;
        };

        if (!image) {
            this._image = null;
            imageDidLoad();
            return;
        }

        if (_.isString(image)) {
            let url = image;
            image = new Image();
            image.src = url;
        }

        this._image = image;

        if (this._image.complete) {
            process.nextTick(imageDidLoad);
        } else {
            this._image.addEventListener('load', imageDidLoad, false);
        }
    }

    get scalingMode() {
        return this._scalingMode;
    }

    set scalingMode(scalingMode) {
        this._scalingMode = scalingMode;

        this.needsDisplay = true;
    }

    sizeToFit() {
        this.size.set(this._image.width, this._image.height);
        return this;
    }

    get imageWidth() {
        return this._image ? this._image.width : 0;
    }

    get imageHeight() {
        return this._image ? this._image.height : 0;
    }

    draw(context) {
        let image = this._image;

        if (!image || !image.complete) {
            return;
        }

        let wImage = this.imageWidth,
            hImage = this.imageHeight,
            rImage = wImage / hImage,
            wView  = this.contentWidth,
            hView  = this.contentHeight,
            rView  = wView / hView;

        var x, y, w, h;

        switch (this._scalingMode) {
        case 'scaleToFill':
            x = this.contentLeft;
            y = this.contentTop;
            w = wView;
            h = hView;
            break;

        case 'scaleAspectFit':    // AKA contain
            if (rImage <= rView) {
                w = hView * rImage;
                h = hView;
            } else {
                w = wView;
                h = wView / rImage;
            }
            x = this.halfWidth  - w/2;
            y = this.halfHeight - h/2;
            break;

        case 'scaleAspectFill':   // AKA cover
            if (rImage <= rView) {
                w = wView;
                h = wView / rImage;
            } else {
                w = hView * rImage;
                h = hView;
            }
            x = this.halfWidth  - w/2;
            y = this.halfHeight - h/2;
            break;

        case 'center':
            w = wImage;
            h = hImage;
            break;
        }

        if (this.shadowColor) {
            context.shadowColor   = this.shadowColor;
            context.shadowBlur    = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        this.drawImage(context, this._image, x, y, w, h);
    }

    drawImage(context, image, x, y, width, height) {
        context.drawImage(image, x, y, width, height);
    }
}
