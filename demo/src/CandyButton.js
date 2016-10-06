import  _ from 'lodash';
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
