import  _ from 'lodash';
import View from './View';
import NavigationBar from './NavigationBar';
import {FingerSizePoints} from './magic';

/**
 * Wraps a view (the "contained view") with a navigation bar.
 *
 * Each view pushed to a NavigationStack is wrapped in an instance
 * of NavigationContainerView and thus each view has its own associated
 * NavigationBar.
 *
 * If the contained view has a method `wasAddedToNavigationStack`, it
 * is called when this container view is added to a NavigationStack.
 */

export default class NavigationContainerView extends View {
    constructor(containedView) {
        super();

        // Needed so shadows are rendered.
        // Shadows are displayed during transitions (at least).

        this.backgroundColor = '#fff';

        this.navigationBar = new NavigationBar();
        this.addSubview(this.navigationBar);

        this.containedView = containedView;
        this.containedView.navigationBar = this.navigationBar;
        this.addSubview(this.containedView);

        // nav bar added after to be on top of contained view
        // so that shadow is displayed atop contained view.

        this.bringToFront(this.navigationBar);
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.containedView.navigationStack = this.superview;

        if (_.isFunction(this.containedView.wasAddedToNavigationStack)) {
            this.containedView.wasAddedToNavigationStack();
        }

        let containerNo = this.superview.subviews.length - 1;
        this.id = `NavigationContainerView${containerNo}`;
    }

    layoutSubviews() {
        let barHeight = FingerSizePoints;
        this.navigationBar.frame.set(0, 0, this.width, barHeight);
        this.containedView.frame.set(0, barHeight, this.width, this.height - barHeight);
    }
}
