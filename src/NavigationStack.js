import  _ from 'lodash';
import View from './View';
import NavigationContainerView from './NavigationContainerView';

/**
 * A stack of views with push/pop semantics.
 */

export default class NavigationStack extends View {

    /**
     * Push a view which makes it current.
     *
     * The view is wrapped in a NavigationContainerView if the view
     * isn't already an instance of NavigationContainerView.
     *
     * The top-most view (if any) is slid out to the left.
     * The pushed view is slid in from the right.
     */

    push(view) {
        let currentTopView = this.topView;

        var containerView;
        if (view instanceof NavigationContainerView) {
            containerView = view;
        } else {
            containerView = new NavigationContainerView(view);
        }

        this.addSubview(containerView);

        containerView.frame = this.bounds;

        if (currentTopView) {
            this.userInteractionEnabled = false;

            this.slideOutToLeft(currentTopView);

            this.slideInFromRight(containerView, () => {
                this.userInteractionEnabled = true;
            });

            containerView.navigationBar.leftView.text = '← ' + currentTopView.navigationBar.titleLabel.text;
            containerView.navigationBar.leftView.userInteractionEnabled = true;
        } else {
            containerView.navigationBar.leftView.userInteractionEnabled = false;
        }
    }

    /**
     * Pops the top-most view, making the next-top-most view
     * the current view.
     */

    pop() {
        let n = this.subviews.length;

        if (n >= 2) {
            this.userInteractionEnabled = false;

            let currentTopView = this.subviews[n - 1],
                nextTopView = this.subviews[n - 2];

            // Views that slide off are hidden. It's sliding
            // back in so show it again.

            nextTopView.hidden = false;
            this.slideInFromLeft(nextTopView);

            this.bringToFront(currentTopView);
            this.slideOutToRight(currentTopView, () => {
                currentTopView.navigationBar = currentTopView.navigationStack = null;
                currentTopView.removeFromSuperview();

                this.userInteractionEnabled = true;
            });
        }
    }

    _saveShadowState(view) {
        view._clipsSubviewsBefore = view.clipsSubviews;
        view._shadowBlurBefore = view.shadowBlur;
        view._shadowColorBefore = view.shadowColor;

        view.clipsSubviews = false;
        view.shadowBlur = 20;
        view.shadowColor = 'rgba(0,0,0,0.5)';
    }

    _restoreShadowState(view) {
        view.clipsSubviews = view.clipsSubviewsBefore;
        view.shadowBlur = view.shadowBlurBefore;
        view.shadowColor = view.shadowColorBefore;
    }

    // TODO use BasicAnimations for this

    /**
     * Slides the view out to the left with some parallax
     * if there's another view higher in the stack.
     */

    slideOutToLeft(view, complete) {
        let targetX = this.topView ? -view.halfWidth : -view.width;

        view.addAnimation({
            name: 'slideLeft',
            target: view.position,
            endValues: { x: targetX }
        }).once('complete', () => {
            view.hidden = true;
            view.left = 0;

            if (_.isFunction(complete)) {
                complete();
            }
        });
    }

    // TODO use BasicAnimations for this
    /**
     * Slides the view out to the right w/ no parallax effect.
     */
    slideOutToRight(view, complete) {
        this._saveShadowState(view);

        view.addAnimation({
            name: 'slideRight',
            target: view.position,
            endValues: { x: this.width }
        }).once('complete', () => {
            this._restoreShadowState(view);
            view.hidden = true;

            if (_.isFunction(complete)) {
                complete();
            }
        });
    }


    // TODO use BasicAnimations for this
    /**
     * Slides the view in from the right w/ no parallax effect.
     */

    slideInFromRight(view, complete) {
        view.position.set(this.width, 0);
        this._saveShadowState(view);

        view.addAnimation({
            name: 'slideLeft',
            target: view.position,
            endValues: { x: 0 }
        }).once('complete', () => {
            this._restoreShadowState(view);

            if (_.isFunction(complete)) {
                complete();
            }
        });
    }


    // TODO use BasicAnimations for this
    /**
     * Slides in the view from the left, using a parallax
     * effect if there's a view higher in the stack.
     */

    slideInFromLeft(view, complete) {
        let currentTopView = this.topView;

        // The parallax effect: the view slides 1/2 the width
        // of this view while the view higher up slides the full
        // width in the same duration.

        view.right = currentTopView ? this.halfWidth : 0;

        view.addAnimation({
            name: 'slideRight',
            target: view.position,
            endValues: { x: 0 }
        }).once('complete', () => {
            if (_.isFunction(complete)) {
                complete();
            }
        });
    }

    /**
     * Returns the top-most or current view.
     */

    get topView() {
        return _.last(this.subviews);
    }

    /**
     * All container views are of the same dimensions,
     * namely the bounds of this navigation stack.
     */

    layoutSubviews() {
        // If user interaction is disabled, then there's a transition
        // being animated currently and that process is in charge of
        // controlling layout.

        if (this.userInteractionEnabled) {
            _.each(this.subviews, subview => {
                subview.frame = this.bounds;
            });
        }
    }
}
