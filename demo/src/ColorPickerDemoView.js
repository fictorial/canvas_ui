import  DemoView from './DemoView';
import ColorPickerView from 'canvas_ui/ColorPickerView';
import View from 'canvas_ui/View';

export default class ColorPickerDemoView extends DemoView {
    constructor() {
        super('Color Picker');

        this.coloredView = new View();
        this.addSubview(this.coloredView);

        this.colorPicker = new ColorPickerView();
        this.addSubview(this.colorPicker);
        this.colorPicker.on('colorPicked', (color) => {
            this.coloredView.backgroundColor = color;
        });
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.colorPicker.size.set(this.halfWidth, this.halfWidth);
        this.colorPicker.moveToCenterMiddle();

        this.coloredView.size.set(50, 50);
        this.coloredView.alignHorizontalCenter(this.colorPicker).moveAbove(this.colorPicker, -20);
    }
}
