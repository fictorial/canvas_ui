import  DemoView from './DemoView';
import ImageView from 'canvas_ui/ImageView';
import Button from 'canvas_ui/Button';

export default class ImageStretchDemoView extends DemoView {
    constructor(scalingMode = 'scaleToFill', title = 'Images: Scale to Fill') {
        super(title);

        this.imageView = new ImageView('assets/smiley.png');
        this.imageView.scalingMode = scalingMode;
        this.imageView.backgroundColor = '#fff';
        this.imageView.borderWidth = 2;
        this.imageView.size.set(100, 100);
        this.addSubview(this.imageView);

        this.button = new Button('Stretch Image');
        this.addSubview(this.button);
        this.button.on('tap', () => {
            this.userInteractionEnabled = false;

            this.addAnimation({
                name: 'stretch',
                target: this.imageView.size,
                endValues: {width: 200, height:400},
                duration: 2000,
                playCount: 2,
                autoReverse: true
            }).once('complete', () => {
                this.userInteractionEnabled = true;
            });
        });
    }

    layoutSubviews() {
        this.imageView.moveToCenterMiddle();

        this.button.sizeToFit()
                   .moveAbove(this.imageView, -10)
                   .alignHorizontalCenter(this.imageView);
    }
}
