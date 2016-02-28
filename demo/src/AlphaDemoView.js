import  DemoView from './DemoView';
import View from 'canvas_ui/View';
import Point from 'canvas_ui/Point';

export default class AlphaDemoView extends DemoView {
    constructor() {
        super('Views can be partially transparent');

        this.redView = new View();
        this.redView.backgroundColor = 'red';
        this.redView.alpha = 0.5;
        this.addSubview(this.redView);

        this.blueView = new View();
        this.blueView.backgroundColor = 'blue';
        this.blueView.alpha = 0.5;
        this.addSubview(this.blueView);
    }

    layoutSubviews() {
        this.redView.size.set(100, 100);
        this.redView.moveToCenterMiddle(new Point(-25, -25));

        this.blueView.size.set(100, 100);
        this.blueView.moveToCenterMiddle(new Point(25, 25));
    }
}
