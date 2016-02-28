import  _ from 'lodash';
import DemoView from './DemoView';
import Button from 'canvas_ui/Button';
import {getContext} from 'canvas_ui/core';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';

let CandyButtonHeight = 100;

export default class CandyButton extends Button {
    constructor(text, color1, color2, textColor = '#fff') {
        super(text);

        let context = getContext();

        let grad = context.createLinearGradient(0, 0, 0, CandyButtonHeight);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        this.backgroundColor = grad;

        this.font = BoldSystemFontOfSize(20);
        this.textColor = textColor;

        this.borderWidth = 4;
        this.borderColor = textColor;

        this.cornerRadius = 20;
    }
}

export default class CandyButtonDemoView extends DemoView {
    constructor() {
        super('Candy Buttons');

        this.playNowButton = new CandyButton('Do it', '#d3ff6d', '#1b9100', '#084f00');
        this.addSubview(this.playNowButton);

        this.challengesButton = new CandyButton('Do it more', '#fec529', '#cd572a', '#46120a');
        this.addSubview(this.challengesButton);
    }

    layoutSubviews() {
        _.each(this.subviews, subview => {
            subview.size.set(Math.max(100, this.superview.width/2),
                             CandyButtonHeight);
        });

        this.playNowButton.moveToCenterMiddle();
        this.playNowButton.top = CandyButtonHeight * 2;

        this.challengesButton
            .moveBelow(this.playNowButton, CandyButtonHeight/2)
            .alignHorizontalCenter(this.playNowButton);
    }
}
