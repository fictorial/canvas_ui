import  DemoView from './DemoView';
import Label from 'canvas_ui/Label';

export default class TailTruncationDemoView extends DemoView {
    constructor() {
        super('Label Tail Truncation');

        this.label = new Label('Ellipsis added when text extends past insets.');
        this.label.insets.setAll(10);
        this.label.id = 'truncatedLabel';
        this.addSubview(this.label);
        this.label._debugMode = true;
    }

    layoutSubviews() {
        this.label.sizeToFit();
        this.label.width = Math.min(this.width - 40, this.label.width);
        this.label.moveToCenterMiddle();
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.label.addAnimation({
            name: 'insets',
            target: this.label.insets,
            endValues: {right: 50},
            duration: 1500,
            autoReverse: true,
            playCount: Infinity
        });
    }
}
