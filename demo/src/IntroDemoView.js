import  DemoView from './DemoView';
import Label from 'canvas_ui/Label';
import {FingerSizePoints} from 'canvas_ui/magic';

export default class IntroDemoView extends DemoView {
    constructor() {
        super('Welcome');

        this.label = new Label('A UI toolkit for the canvas API');
        this.label.textAlign = 'center';
        this.addSubview(this.label);
    }

    layoutSubviews() {
        // or just .sizeToFit but this shows truncation on window resize

        this.label.size.set(this.width - 40, FingerSizePoints);
        this.label.moveToCenterMiddle();
    }
}
