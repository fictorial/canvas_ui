import  DemoView from './DemoView';
import View from 'canvas_ui/View';
import Label from 'canvas_ui/Label';

export default class BasicViewDemoView extends DemoView {
    constructor(title) {
        super(title || 'Views present data visually');

        this.aView = new View();
        this.aView.id = 'Basic View';
        this.aView.backgroundColor = '#ddd';
        this.addSubview(this.aView);

        this.infoLabel = new Label('The default shape is a rectangle.');
        this.infoLabel.id = 'Info Label';
        this.infoLabel.textAlign = 'center';
        this.addSubview(this.infoLabel);
    }

    layoutSubviews() {
        this.aView.size.set(200, 100);
        this.aView.moveToCenterMiddle();

        this.infoLabel.sizeToFit()
                      .alignHorizontalCenter(this.aView)
                      .moveBelow(this.aView, 40);
    }
}

