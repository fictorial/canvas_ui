import  MessageView from './MessageView';

/**
 * A view that confirms that the user wishes to continue with
 * some action.  Does not auto-remove itself on button taps; that's
 * up to you.
 *
 * Events:
 * - canceled()
 * - confirmed()
 */

export default class ConfirmView extends MessageView {
    constructor(title, message, negativeText = 'No', affirmativeText = 'Yes') {
        super(title, message);

        this.addButtonWithHandler(negativeText, this.emit.bind(this, 'canceled'));
        this.addButtonWithHandler(affirmativeText, this.emit.bind(this, 'confirmed'));
    }
}
