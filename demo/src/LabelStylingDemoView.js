import  DemoView from './DemoView';
import Label from 'canvas_ui/Label';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';
import {getContext} from 'canvas_ui/core';
import {PopIn} from 'canvas_ui/BasicAnimations';

export default class LabelStylingDemoView extends DemoView {
    constructor() {
        super('Label Styling');

        this.label = new Label('COLORS!');
        this.label.textAlign = 'center';
        this.label.textOutlineColor = 'white';
        this.label.textOutlineWidth = 2;
        this.addSubview(this.label);
    }

    layoutSubviews() {
        super.layoutSubviews();

        var label = this.label;

        this.label.font = BoldSystemFontOfSize(Math.round(this.height / 15));
        this.label.sizeToFit().moveToCenterMiddle();

        let grad = getContext().createLinearGradient(0, 0, label.contentWidth, label.contentHeight);
        grad.addColorStop(0, 'red');
        grad.addColorStop(0.2, 'orange');
        grad.addColorStop(0.4, 'yellow');
        grad.addColorStop(0.6, 'green');
        grad.addColorStop(0.8, 'blue');
        grad.addColorStop(1, 'purple');
        label.textColor = grad;
    }

    wasAddedToView() {
        super.wasAddedToView();

        // artifacts during popIn with shadows enabled so add them afterwards

        this.label.addAnimation(new PopIn(this.label))
            .once('complete', () => {
                this.label.shadowColor = 'rgba(128,0,0,0.5)';
                this.label.backgroundColor = '#fff';
                this.label.addAnimation({
                    name: 'shadow',
                    endValues: {shadowBlur: 10, shadowOffsetY: 6}
                });
            });
    }
}
