import  View from 'canvas_ui/View';
import Label from 'canvas_ui/Label';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';

export default class DemoPageView extends View {
    constructor(text, backgroundColor) {
        super();

        this.label = new Label(text);
        this.label.backgroundColor = backgroundColor;
        this.label.font = BoldSystemFontOfSize(20);
        this.addSubview(this.label);

        this.backgroundColor = backgroundColor;
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.label.sizeToFit().moveToCenterMiddle();
    }
}
