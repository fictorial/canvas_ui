import  View from './View';

/**
 * The draggable part of a slider which is positioned to show the
 * slider's current value.
 */

export default class SliderThumb extends View {
    constructor() {
        super();

        this.shadowColor = 'rgba(0,0,0,0.5)';
        this.shadowBlur = 3;
        this.shadowOffsetY = 2;
        this.clipsSubviews = false;   // to see shadow
    }

    /**
     * Renders the thumb as a circle.
     */

    addShapePath(context) {
        let hw = this.halfWidth,
            hh = this.halfHeight;

        context.beginPath();
        context.arc(hw, hh, hw, 0, 2*Math.PI, false);
        context.closePath();
    }
}
