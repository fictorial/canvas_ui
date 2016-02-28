import  View from 'canvas_ui/View';
import {Scale} from 'canvas_ui/BasicAnimations';

export default class DroppableDemoView extends View {
    constructor(acceptsColor) {
        super();

        this._acceptsColor = acceptsColor;

        this.backgroundColor = '#fff';
        this.borderColor = acceptsColor;
        this.borderWidth = 2;

        // This view may accept some dropped view;
        // see acceptsDroppedView.

        this.acceptsDroppedViews = true;
    }

    acceptsDroppedView(otherView/*, localPoint*/) {
        return otherView.backgroundColor === this._acceptsColor;
    }

    mightReceiveDroppedView(view, atPoint) {
        this.addAnimation(new Scale(this, {scale:1.2}));
        super.mightReceiveDroppedView(view, atPoint);
    }

    willNotReceiveDroppedView(view) {
        this.addAnimation(new Scale(this, {scale:1.0}));
        super.willNotReceiveDroppedView(view);
    }

    droppedViewWasReceived(/*droppedView, localPoint*/) {
        this.addAnimation(new Scale(this, {scale:1.0}));
        super.droppedViewWasReceived();
    }
}
