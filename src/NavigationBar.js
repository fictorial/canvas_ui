import  View from './View';
import Label from './Label';
import {BoldSystemFontOfSize} from './fonts';
import NavigationButton from './NavigationButton';

/**
 * Shows a view on left, middle, and right.
 *
 * The left view is typically a back button and is by default a NavigationButton that
 * shows the title of the view one lower in the navigation stack.
 *
 * The middle view is typically a title label containing the title of the current contained view.
 *
 * The right view is typically an accessory button of some kind and is a blank button
 * by default.
 */

export default class NavigationBar extends View {
    constructor() {
        super();

        this.leftView = new NavigationButton();   // text set elsewhere
        this.leftView.textAlign = 'left';
        this.addSubview(this.leftView);

        this.titleLabel = new Label();
        this.titleLabel.font = BoldSystemFontOfSize(parseInt(this.leftView.font, 10));
        this.titleLabel.textAlign = 'center';
        this.addSubview(this.titleLabel);

        this.rightView = new NavigationButton();
        this.rightView.textAlign = 'right';
        this.addSubview(this.rightView);

        this.borderWidth = 1;
        this.borderColor = '#ddd';
    }

    layoutSubviews() {
        this.titleLabel.sizeToFit();
        this.titleLabel.width = Math.min(Math.round(this.width * 0.6), this.titleLabel.width);

        this.leftView.top = this.titleLabel.top = this.rightView.top = 0;
        this.leftView.height = this.titleLabel.height = this.rightView.height = this.height;
        this.leftView.width = this.rightView.width = (this.width - this.titleLabel.width) / 2;
        this.leftView.left = 0;

        this.titleLabel.moveRightOf(this.leftView);
        this.rightView.moveRightOf(this.titleLabel);
    }

    get title() {
        return this.titleLabel.text;
    }

    set title(title) {
        this.titleLabel.text = title;
    }
}
