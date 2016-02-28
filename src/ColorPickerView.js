import  _ from 'lodash';
import View from './View';
import {getContext} from './core';
import Point from './Point';
import {transparent} from './magic';

/**
 * A color picker.
 *
 * Lets the user touch the view to select a color.
 *
 * FYI, this looks like the "Spectrum" color picker as part of OS X.;
 *
 * Events:
 * - colorPicked("rgb($r, $g, $b)");
 */

export default class ColorPickerView extends View {
    didLayoutSubviews() {
        super.didLayoutSubviews();

        // This works by drawing 2 gradients atop each other, a color one
        // and a partially transparent grayscale one. The user touches the
        // view and we read the color on the drawn canvas at that point.

        this._colorGradient = getContext().createLinearGradient(0, 0, 0, this.height);
        let colors = ['red','orange','yellow','green','cyan','blue','magenta'];
        _.each(colors, (color, index) => {
            this._colorGradient.addColorStop(index  / (colors.length - 1), color);
        });

        this._bwGradient = getContext().createLinearGradient(0, 0, this.width, 0);
        this._bwGradient.addColorStop(0, 'white');
        this._bwGradient.addColorStop(0.15, 'rgba(255,255,255,0)');
        this._bwGradient.addColorStop(0.85, transparent);
        this._bwGradient.addColorStop(1, 'black');

        this.userInteractionEnabled = true;

        this._pickedColor = null;
        this._pickedPoint = null;
        this._showPickedPoint = false;
    }

    draw(context) {
        super.draw(context);

        // Draw color gradient

        context.fillStyle = this._colorGradient;
        context.fillRect(0, 0, this.width, this.height);

        // Overlay with grayscale gradient

        context.fillStyle = this._bwGradient;
        context.fillRect(-1, 0, this.width+1, this.height+1);

        // Draw a little target

        if (this._pickedPoint && this._showPickedPoint) {
            let size = 5,
                targetExtents = 2;

            context.beginPath();
            context.arc(this._pickedPoint.x, this._pickedPoint.y, size, 0, 2*Math.PI, false);
            context.moveTo(this._pickedPoint.x - size - targetExtents, this._pickedPoint.y);
            context.lineTo(this._pickedPoint.x + size + targetExtents, this._pickedPoint.y);
            context.moveTo(this._pickedPoint.x, this._pickedPoint.y - size - targetExtents);
            context.lineTo(this._pickedPoint.x, this._pickedPoint.y + size + targetExtents);
            context.closePath();

            context.strokeStyle = 'rgba(0,0,0,0.5)';
            context.stroke();
        }
    }

    _getColorAtPoint(localPoint) {
        if (!this._pickedPoint) {
            this._pickedPoint = new Point();
        }

        this._pickedPoint.set(
            Math.max(0, Math.min(this.width  - 1, localPoint.x)),
            Math.max(0, Math.min(this.height - 1, localPoint.y)));

        let canvasPoint = this.rootView.convertLocalToSuperview(
            this.convertLocalToRoot(this._pickedPoint)),
            touchedColor = getContext().getImageData(
                window.devicePixelRatio * canvasPoint.x,
                window.devicePixelRatio * canvasPoint.y, 1, 1).data;
        return touchedColor.slice(0, 3);
    }

    _didPickColorAtPoint(localPoint) {
        let rgb = this._getColorAtPoint(localPoint),
            colorSpec = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        this._pickedColor = rgb;
        this.emit('colorPicked', colorSpec);
    }

    get pickedColor() {
        return this._pickedColor;
    }

    touchStart(localPoint) {
        super.touchStart(localPoint);

        this._didPickColorAtPoint(localPoint);

        // Hide since if there's a delay in rendering the picked color
        // might see the target itself!
        this._showPickedPoint = false;
    }

    touchMove(localPoint) {
        super.touchMove(localPoint);

        this._didPickColorAtPoint(localPoint);
        this._showPickedPoint = false;
    }

    touchEnd(localPoint) {
        super.touchEnd(localPoint);
        this._showPickedPoint = true;
    }
}
