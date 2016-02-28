import  View from './View';
import {FadeOut} from './BasicAnimations';

/**
 * Disallows a user from interacting with anything under this view;
 * while allowing the user to see through to the view(s) under this view.;
 */

export default class InputBlockerView extends View {
    constructor(blockingForView) {
        super();
        this.backgroundColor = 'rgba(0,0,0,0.3)';
        this.blockingForView = blockingForView;
    }

    layoutSubviews() {
        this.frame = this.superview.bounds;
    }

    // Wait to remove it until it fades out

    removeFromSuperview() {
        this.addAnimation(new FadeOut(this))
            .once('complete', () => {
                super.removeFromSuperview();
            });
    }

    // Simply don't call super.x to stop events from being emitted.
    //
    // However, touching the input blocker removes the view for which
    // the input blocker exists.

    touchStart() {
        if (this.blockingForView) {
            this.blockingForView.removeFromSuperview();
        }
    }

    tapped() {}

    touchEnd() {}
}
