import  DemoView from './DemoView';
import Button from 'canvas_ui/Button';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';

export default class ButtonDemoView extends DemoView {
    constructor() {
        super('A Button');

        var prevText = 'Press Me';
        this.button = new Button(prevText);
        this.button.insets.setAll(10);
        this.addSubview(this.button);
        this.button.on('tap', function () {
            this.text = 'Thanks!';
            this.sizeToFit();

            var prevFont = this.font;
            this.font = BoldSystemFontOfSize(14);

            setTimeout(() => {
                this.font = prevFont;
                this.text = prevText;
                this.sizeToFit();
            }, 1500);
        });
    }

    layoutSubviews() {
        this.button.sizeToFit().moveToCenterMiddle();
    }
}
