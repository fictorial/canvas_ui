import  DemoView from './DemoView';
import View from 'canvas_ui/View';
import Button from 'canvas_ui/Button';

export default class ScaleDemoView extends DemoView {
    constructor() {
        super('Views can be scaled');

        this.orangeView = new View();
        this.orangeView.backgroundColor = 'orange';
        this.addSubview(this.orangeView);

        this.blueView = new View();
        this.blueView.backgroundColor = 'blue';
        this.blueView.size.set(50, 50);
        this.orangeView.addSubview(this.blueView);

        this.button = new Button('Scale It');
        this.button.insets.setAll(10);
        this.addSubview(this.button);
        this.button.on('tap', () => {
            // blueView will be scaled as well without explicitly doing so
            let newScale = this.orangeView.scale.x === 1 ? 0.5 : 1;
            this.orangeView.scale.set(newScale, newScale);
        });
    }

    layoutSubviews() {
        this.orangeView.size.set(100, 100);
        this.orangeView.moveToCenterMiddle();

        this.blueView.moveToCenterMiddle();

        this.button.sizeToFit()
                   .moveToCenterMiddle()
                   .moveAbove(this.orangeView, -20);
    }
}
