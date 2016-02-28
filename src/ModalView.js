import  _ from 'lodash';
import View from './View';
import InputBlockerView from './InputBlockerView';
import {PopIn, PopOut} from 'canvas_ui/BasicAnimations';

/**
 * A view that must be dealt with by the user when shown.
 *
 * Usually, `ModalView`s are added to the root view.
 */

export default class ModalView extends View {
    constructor() {
        super();

        this.backgroundColor = '#fff';
        this.cornerRadius = 10;
        this.borderWidth = 2;
        this.insets.setAll(10);
    }

    // By default, modal views are centered in their superview.;

    wasAddedToView() {
        super.wasAddedToView();

        this.blockInput();
        this.addAnimation(new PopIn());
        this.becomeFirstResponder();
    }

    // Defers removal of modal until animation completes.;
    // removeInputBlocker is for the case when you wish to show one modal,
    // dismiss/remove it, and show another immediately.  We wouldn't
    // want the input blocker to be removed then; just stay as is.

    removeFromSuperview(removeInputBlocker = true) {
        this.userInteractionEnabled = false;

        if (removeInputBlocker) {
            this.removeInputBlocker();
        }

        this.addAnimation(new PopOut(this))
            .once('complete', () => {
                super.removeFromSuperview();
            });
    }

    // By default, modal views block the user from interacting with its
    // superview, hence the name "modal".
    //
    // Touching the input-blocker removes the modal and the input blocker however.

    blockInput() {
        if (!this.inputBlockerView && !this.inputBlocker()) {
            this.inputBlockerView = new InputBlockerView(this);
            this.superview.addSubview(this.inputBlockerView);
            this.superview.bringToFront(this);
        }
    }

    inputBlocker() {
        return _.find(this.superview.subviews, subview => {
            return subview instanceof InputBlockerView;
        });
    }

    removeInputBlocker() {
        let inputBlocker = this.inputBlocker();
        if (inputBlocker) {
            inputBlocker.removeFromSuperview();
        }
    }

    layoutSubviews() {
        super.layoutSubviews();
        this.moveToCenterMiddle();
    }

    keyPressed(keyName, ctrl, shift, meta, alt) {
        if (keyName === 'Escape' || keyName === 'Enter') {
            this.removeFromSuperview();
        } else {
            super.keyPressed(keyName, ctrl, shift, meta, alt);
        }
    }
}
