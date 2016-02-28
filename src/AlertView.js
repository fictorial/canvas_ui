import  MessageView from './MessageView';

/**
 * A modal view that shows a title, a message, and an OK button
 * which dismisses the view when tapped.
 */

export default class AlertView extends MessageView {
    constructor(title, message, dismissText='OK') {
        super(title, message);
        this.addButtonWithHandler(dismissText, this.removeFromSuperview.bind(this));
    }
}
