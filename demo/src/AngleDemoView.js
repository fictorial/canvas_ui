import  DemoView from './DemoView';
import View from 'canvas_ui/View';
import Button from 'canvas_ui/Button';

export default class AngleDemoView extends DemoView {
    constructor() {
        super('Views can rotate about their center');

        this.orangeView = new View();
        this.orangeView.backgroundColor = 'orange';
        this.addSubview(this.orangeView);

        this.button = new Button('Rotate a bit');
        this.button.on('tap', () => {
            this.orangeView.angle = Math.PI / 8;
        });
        this.button.insets.setAll(10);
        this.addSubview(this.button);
    }

    layoutSubviews() {
        this.orangeView.size.set(100, 100);
        this.orangeView.moveToCenterMiddle();

        this.button.sizeToFit()
                   .moveToCenterMiddle()
                   .moveAbove(this.orangeView, -20);
    }
}
