import  _ from 'lodash';
import DemoView from './DemoView';
import {getContext} from 'canvas_ui/core';
import {PointZero} from 'canvas_ui/magic';
import {transparent, FingerSizePoints} from 'canvas_ui/magic';
import Button from 'canvas_ui/Button';
import Slider from 'canvas_ui/Slider';
import Point from 'canvas_ui/Point';
import {layoutNaturalFlow} from 'canvas_ui/BasicLayouts';

// TODO could use the color picker in a popup I suppose. Doesn't matter much.

/**
 * A very simple painting canvas.
 */

export default class PaintDemoView extends DemoView {
    constructor() {
        super('Paint Demo');

        let colors = [
            [64,64,64],
            [192,192,192],
            [255,255,255],
            [0,0,0],
            [255,0,0],
            [255,200,0],
            [255,255,0],
            [0,255,0],
            [0,0,255],
            [128,0,255],
            [128,0,0],
            [128,100,0],
            [128,128,0],
            [0,128,0],
            [0,0,128],
            [64,0,128]
        ];

        this._colorWells = _.map(colors, (color, index) => {
            let btn = new Button();
            btn.size.set(FingerSizePoints, FingerSizePoints);
            btn.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
            btn._brushColor = color;
            btn.cornerRadius = 0;
            btn.offsetsOnTouch = false;
            btn.borderColor = 'black';
            btn.on('tap', this.selectColorWellAtIndex.bind(this, index));
            this.addSubview(btn);
            return btn;
        });

        this.selectColorWellAtIndex(0);

        this._brushSizeSlider = new Slider({
            horizontal: false,
            value: FingerSizePoints,
            minValue: 1,
            maxValue: FingerSizePoints * 3,
            step: 1
        });
        this.addSubview(this._brushSizeSlider);
        this._brushSizeSlider.backgroundColor = transparent;

        this.clearButton = new Button('Clear');
        this.addSubview(this.clearButton);
        this.clearButton.on('tap', () => {
            this.needsLayout = true;
        });
    }

    selectColorWellAtIndex(selectedIndex) {
        _.each(this._colorWells, (btn, index) => {
            if (selectedIndex === index) {
                this._brushColor = btn._brushColor;
                btn.borderWidth = 4;
                btn.superview.bringToFront(btn);
            } else {
                btn.borderWidth = 0;
            }
        });
    }

    layoutSubviews() {
        super.layoutSubviews();

        // Retina displays, etc.
        let ratio = window.devicePixelRatio || 1;

        this._imageData = getContext().createImageData(
            this.width  * ratio,
            this.height * ratio);

        layoutNaturalFlow(this, this._colorWells, {hMargin:0, vMargin:0});

        this.clearButton.sizeToFit().moveInBottomLeftCorner(new Point(10, -10));

        this._brushSizeSlider.size.set(FingerSizePoints, FingerSizePoints * 5);
        this._brushSizeSlider.moveInBottomRightCorner(new Point(-10, 0));
    }

    touchStart(localPoint) {
        super.touchStart(localPoint);
        this.paintAt(localPoint);
    }

    touchMove(localPoint) {
        super.touchMove(localPoint);
        this.paintAt(localPoint);
    }

    paintAt(localPoint) {
        let ratio = window.devicePixelRatio || 1;
        if (ratio !== 1) {
            localPoint.scaleSelf(ratio, ratio);
        }

        // Just a simple circular "brush"

        let brushSize = this._brushSizeSlider.value,
            halfBrushSize = brushSize/2,
            rr = halfBrushSize * halfBrushSize,   // brush radius squared
            brushColor = this._brushColor,
            data = this._imageData.data,
            dataWidth = this._imageData.width,
            dataHeight = this._imageData.height,
            dataRowLength = this._imageData.width * 4; // RGBA

        for (var y = Math.max(0, Math.round(localPoint.y - halfBrushSize));
                 y < Math.min(dataHeight-1, Math.round(localPoint.y + halfBrushSize));
               ++y) {

            let dy = (y - localPoint.y) * (y - localPoint.y),
                dataRowStart = y * dataRowLength;

            for (var x = Math.max(0, Math.round(localPoint.x - halfBrushSize));
                     x < Math.min(dataWidth-1, Math.round(localPoint.x + halfBrushSize));
                   ++x) {

                let dx = (x - localPoint.x) * (x - localPoint.x);

                if (dx + dy <= rr) {
                    let dataIndex = dataRowStart + x * 4;
                    data[dataIndex+0] = brushColor[0];
                    data[dataIndex+1] = brushColor[1];
                    data[dataIndex+2] = brushColor[2];
                    data[dataIndex+3] = 255;
                }
            }
        }
    }

    draw(context) {
        super.draw(context);

        let ratio = window.devicePixelRatio || 1;
        var originInRoot = this.convertLocalToRoot(PointZero);
        originInRoot.scaleSelf(ratio, ratio);

        let fn = context.webkitPutImageDataHD || context.putImageDataHD || context.putImageData;
        fn.call(context, this._imageData, Math.round(originInRoot.x), Math.round(originInRoot.y));
    }
}
