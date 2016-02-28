import  _ from 'lodash';
import ImageView from './ImageView';

/**
 * An image comprised of sub-images, one of which is drawn
 * when the view is redrawn.
 *
 * The sub-images are named and are laid out using some packing
 * tool like *Texture Packer* and have explicit rectangles specified.
 */

export default class PackedImageView extends ImageView {

    /**
     * `subImageInfo` is an object with keys equal to sub-image
     * filenames and associated values equal to a rect object of
     * the form `{x:number, y:number, w:number, h:number}`
     */

    constructor(image, subImageInfo) {
        super(image);

        if (!_.isPlainObject(subImageInfo)) {
            throw new Error('sub-image info is required');
        }

        this._subImageInfo = subImageInfo;
        this._currentImageName = null;
    }

    get currentImageName() {
        return this._currentImageName;
    }

    set currentImageName(name) {
        if (name &&
            this._currentImageName !== name &&
            _.has(this._subImageInfo, name)) {

            this._currentImageName = name;
            this.needsDisplay = true;
            this.emit('imageChanged');
        }
    }

    get imageWidth() {
        if (this._currentImageName && this._subImageInfo) {
            return this._subImageInfo[this._currentImageName].w;
        }

        return 0;
    }

    get imageHeight() {
        if (this._currentImageName && this._subImageInfo) {
            return this._subImageInfo[this._currentImageName].h;
        }

        return 0;
    }

    sizeToFit() {
        if (!this._currentImageName) {
            return this;
        }

        let rect = this._subImageInfo[this._currentImageName];
        if (!rect) {
            return this;
        }

        this.size.set(rect.w, rect.h);
        return this;
    }

    drawImage(context, image, x, y, w, h) {
        if (!this._currentImageName) {
            return;
        }

        let rect = this._subImageInfo[this._currentImageName];
        if (!rect) {
            return;
        }

        context.drawImage(image, rect.x, rect.y, rect.w, rect.h, x, y, w, h);
    }
}
