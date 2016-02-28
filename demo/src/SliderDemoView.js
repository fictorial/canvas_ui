import  DemoView from './DemoView';
import Slider from 'canvas_ui/Slider';
import {FingerSizePoints} from 'canvas_ui/magic';

export default class SliderDemoView extends DemoView {
    constructor() {
        super('Sliders');

        this.slider = new Slider({
            horizontal: true,
            value: 50,
            minValue: 0,
            maxValue: 100
        });
        this.addSubview(this.slider);

        this.sliderV = new Slider({
            horizontal: false,
            value: 25,
            minValue: 0,
            maxValue: 100
        });
        this.addSubview(this.sliderV);
    }

    layoutSubviews() {
        this.slider.size.set(200, FingerSizePoints);
        this.sliderV.size.set(FingerSizePoints, 200);

        this.slider.moveToCenterMiddle();
        this.sliderV.moveToCenterMiddle().moveRightOf(this.slider, 20);
    }
}
