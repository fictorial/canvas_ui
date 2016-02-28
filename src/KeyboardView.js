import  _ from 'lodash';
import EventEmitter from 'events';
import View from './View';
import Size from './Size';
import {getRootView} from './core';
import KeyboardLayoutQwerty from './KeyboardLayoutQwerty';
import Point from './Point';
import Animation from './Animation';

var _instance;

/**
 * There's only really one keyboard needed.
 *
 * When the user taps a key, the key is sent to the first responder's
 * `keyPressed` method.
 */

export function instance(createOnDemand=true) {
    if (!_instance && createOnDemand) {
        _instance = new KeyboardView();
        getRootView().addSubview(_instance);
    }

    return _instance;
}

/**
 * Events:
 * - changedVisibility(keyboardView, isHidden);
 */

export let eventEmitter = new EventEmitter();

    // ^^ This is at module scope to deal with the case wherein a software keyboard
    // may not have been created and we do not want to create the instance just to
    // add a listener to changes in its visibility state. We could use
    // `instance(false)` -- true.  However, we have no event mechanism to let
    // objects that care about keyboard visibility know that a keyboard was
    // created.  Thus, we decouple such a visibility from the `KeyboardView`.
    // *If* there's ever a `KeyboardView` created, listeners will be notified...

/**
 * A software keyboard.
 *
 * I would recommend that you use the native keyboard on mobile devices where possible
 * as that is what users will expect.  But, this is useful in a number of other cases.;
 */

export class KeyboardView extends View {
    constructor() {
        super();

        this._layout = new KeyboardLayoutQwerty(this);
        this.addSubview(this._layout);
    }

    get size() {
        return new Size(Math.min(this.superview.width, 512), 216);
    }

    wasAddedToView() {
        super.wasAddedToView();

        let size = this.size;
        this.frame.set(this.superview.halfWidth-size.width/2,
                       this.superview.height, size.width, size.height);

        this.hide(false);

        // Since the keyboard is always added to the application or root view,
        // we have to trigger layout on the keyboard when the root view changes.
        // The root view shouldn't have to do this itself.;

        var resizedTimeout,
            wasHidden = null;

        this.superview.frame.size.on('valueChanged', () => {
            if (wasHidden === null) {
                wasHidden = this.hidden;
            }

            this.hide(false);

            clearTimeout(resizedTimeout);

            if (wasHidden === false) {
                resizedTimeout = setTimeout(() => {
                    this.needsLayout = true;
                    this.layoutIfNeeded();
                    this.show(true);
                    wasHidden = null;
                }, 500);
            }
        });
    }

    layoutSubviews() {
        this.left = this.superview.halfWidth - this.halfWidth;

        if (this.hidden) {
            this.hide(false);
        } else {
            this.show(false);
        }

        this._layout.frame = this.bounds;
    }

    /**
     * Hide the keyboard.
     *
     * If `animated` is true, the keyboard is slid down and off the bottom of the
     * superview.;
     *
     * If the keyboard had previously moved the first responder out of the way so
     * as not to be obscured by the visible keyboard, that view's superview is slid;
     * back down as well.
     */

    hide(animated=true, complete=null) {
        if (this.hidden) {
            if (_.isFunction(complete)) {
                complete();
            }

            return;
        }

        let finalKeyboardTop = this.superview.height;

        if (!animated) {
            this.hidden = true;
            eventEmitter.emit('changedVisibility', this, this.hidden);
            this.top = finalKeyboardTop;

            if (_.isFunction(complete)) {
                complete();
            }
        } else {
            this.userInteractionEnabled = false;

            this.addAnimation({
                name: 'hide',
                endValues: { top: finalKeyboardTop },
                easing: Animation.easing.backStart
            }).once('complete', () => {
                this.hidden = true;
                eventEmitter.emit('changedVisibility', this, this.hidden);

                if (_.isFunction(complete)) {
                    complete();
                }
            });
        }

        return this;
    }

    /**
     * Shows the keyboard.
     *
     * If `animated` is true, the keyboard is slid up from the bottom of its superview,
     * else it's moved into move instantly.
     *
     * If there's a first responder, it's superview is slid up (or moved up instantly) as well.;
     */

    show(animated=true, complete=null) {
        if (!this.hidden) {
            if (_.isFunction(complete)) {
                complete();
            }

            return;
        }

        let finalKeyboardTop = this.superview.height - this.height;
        this.hidden = false;

        if (!animated) {
            this.top = finalKeyboardTop;
            eventEmitter.emit('changedVisibility', this, this.hidden);

            if (_.isFunction(complete)) {
                complete();
            }
        } else {
            this.top = this.superview.height;
            this.userInteractionEnabled = false;
            this.addAnimation({
                name: 'show',
                endValues: { top: finalKeyboardTop },
                easing: Animation.easing.backEnd
            }).once('complete', () => {
                this.userInteractionEnabled = true;
                eventEmitter.emit('changedVisibility', this, this.hidden);

                if (_.isFunction(complete)) {
                    complete();
                }
            });
        }

        return this;
    }

    /**
     * Toggle visibility of keyboard.
     */

    toggle(animated=true) {
        if (this.hidden) {
            this.show(animated);
        } else {
            this.hide(animated);
        }
    }

    /**
     * This keyboard view is really a placeholder for the current set of keyboard
     * keys as handled by a `KeyboardLayout` object.
     *
     * The layout may be changed at any time.
     */

    get layout() {
        return this._layout;
    }

    set layout(layout) {
        this._layout = layout;
        this.needsLayout = true;
    }
}

// Keyboard slides up from bottom of root view.
// Slide up the first responder so it is visible.
// When the keyboard is slid back down, slide down the first responder's superview.;

var offsetView, offsetDistance;

function moveFirstResponderForKeyboard() {
    let kbd = _instance;
    if (!kbd) {
        return;
    }

    let firstResponder = View.firstResponder;
    if (!firstResponder) {
        return;
    }

    if (offsetView) {
        offsetView.addAnimation({
            name: 'slideBackDownForKeyboard',
            endValues: { bottom: offsetView.bottom + offsetDistance }
        });
        offsetView = null;
        offsetDistance = 0;
    }

    var margin = 10;
    if (!kbd.hidden) {
        let firstResponderBottomInRoot = firstResponder.convertLocalToRoot(new Point(0, firstResponder.height)).y;
        if (firstResponderBottomInRoot > kbd.top - margin) {
            offsetView = firstResponder.firstNonRootView;
            offsetDistance = firstResponderBottomInRoot - kbd.top + margin;
            offsetView.addAnimation({
                name: 'slideUpForKeyboard',
                endValues: { bottom: offsetView.bottom - offsetDistance }
            });
        }
    } else if (offsetView) {
        offsetView.addAnimation({
            name: 'slideBackDownForKeyboard',
            endValues: { bottom: offsetView.bottom + offsetDistance }
        });
        offsetView = null;
        offsetDistance = 0;
    }
}

eventEmitter.on('changedVisibility', moveFirstResponderForKeyboard);

// When the first responder changes, move it if it is obscured by the keyboard.

View.globalEvents.on('firstResponderDidChange', moveFirstResponderForKeyboard);
