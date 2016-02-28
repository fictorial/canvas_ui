import  _ from 'lodash';
import ModalView from './ModalView';
import Button from './Button';
import Label from './Label';
import ScrollableTextView from './ScrollableTextView';
import Size from './Size';
import {FingerSizePoints} from './magic';
import {SystemFontOfSize, BoldSystemFontOfSize} from './fonts';

/**
 * A modal view that shows a scrollable textual message, a title,
 * and an optional set of buttons.
 *
 *     +-----------------------------------+
 *     |             [title]               |
 *     |            [message]              |
 *     | [button 1][button 2]...[button N] |
 *     +-----------------------------------+
 */

export default class MessageView extends ModalView {
    constructor(title, message) {
        super();

        this.title = title || '';
        this.message = message || '';
        this.buttons = [];

        this.titleLabel = new Label(this.title);
        this.titleLabel.font = BoldSystemFontOfSize(14);
        this.titleLabel.textAlign = 'center';
        this.addSubview(this.titleLabel);

        this.messageView = new ScrollableTextView(this.message);
        this.messageView.textView.insets.setAll(10);
        this.messageView.textView.textAlign = 'center';
        this.messageView.textView.font = SystemFontOfSize(14);
        this.addSubview(this.messageView);
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.titleLabel.frame = this.contentFrame;
        this.titleLabel.height = 30;

        this.messageView.contentSize = new Size(this.contentWidth, 0);
        this.messageView.frame = this.contentFrame;
        this.messageView.top = this.titleLabel.bottom;

        let buttonMargin = this.contentLeft,     // reasonable;
            buttonWidth = this.contentWidth / this.buttons.length -
                buttonMargin/2 * (this.buttons.length - 1),
            buttonHeight = FingerSizePoints,
            buttonTop = this.contentBottom - buttonHeight,
            buttonX = this.contentLeft;

        _.each(this.buttons, button => {
            button.frame.set(buttonX, buttonTop, buttonWidth, buttonHeight);
            buttonX += buttonWidth + buttonMargin;

            button.cornerRadius = 8;
            button.textAlign = 'center';
            button.borderWidth = 1;
            button.borderColor = '#aaa';
            button.textColor = '#555';
        });

        this.messageView.height = buttonTop - this.messageView.top;
    }

    /**
     * Adds a button which given text and tap handler function.
     * Buttons added later are positioned right of buttons added earlier.
     * Returns the added button if customizations are needed.
     */

    addButtonWithHandler(text, handler) {
        let button = new Button(text);
        button.on('tap', handler);
        this.addSubview(button);
        this.buttons.push(button);
        return button;
    }
}
