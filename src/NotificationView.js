import  _ from 'lodash';
import Label from './Label';
import {BoldSystemFontOfSize} from './fonts';
import {FadeIn, FadeOut} from './BasicAnimations';

/**
 * A view that shows a brief message before removing itself.
 * Can also be tapped to dismiss.
 * Auto-dismisses an existing notification view on the same superview if found.
 */

export default class NotificationView extends Label {
    constructor(message, type='info', dismissAfter=2000) {
        super(message);

        this.type = type;
        this.dismissAfter = dismissAfter;

        this.insets.setAll(20);  // "big"
        this.textColor = '#fff';
        this.font = BoldSystemFontOfSize(11);
        this.cornerRadius = 10;

        this.stylizeForType();

        this.userInteractionEnabled = true;
        this.on('tap', () => this.removeFromSuperview());
    }

    stylizeForType() {
        switch (this.type) {
        case 'error':
            this.backgroundColor = 'red';
            break;
        case 'warning':
            this.backgroundColor = 'orange';
            break;
        default:
            this.backgroundColor = '#333';
            break;
        }

        this.clipsSubviews = false;
        this.shadowBlur = 10;
        this.shadowColor = 'rgba(0,0,0,0.7)';
        this.shadowOffsetY = 10;
    }

    removeExistingNotificationViews() {
        _.each(_.filter(this.superview.subviews, subview => {
            return subview instanceof NotificationView && subview !== this;
        }), notification => notification.removeFromSuperview());
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.removeExistingNotificationViews();

        this.sizeToFit();

        let slideDistance = 20;

        this.left = this.superview.halfWidth - this.halfWidth;
        this.top = Math.round(this.superview.height * 0.4) + slideDistance;

        this.addAnimation({
            name: 'slideUp',
            target: this.position,
            endValues: {y: this.top - slideDistance}
        });

        this.addAnimation(new FadeIn(this));

        this.timeout = setTimeout(() => {
            this.removeFromSuperview();
        }, this.dismissAfter);
    }

    // Defers removal of notification until animation completes.

    removeFromSuperview() {
        this.userInteractionEnabled = false;

        clearTimeout(this.timeout);

        this.addAnimation(new FadeOut(this));

        let slideDistance = 20,
            targetY = Math.round(this.superview.height * 0.4) + slideDistance;

        this.addAnimation({
            name: 'slideDown',
            target: this.position,
            endValues: {y: targetY}
        }).once('complete', () => {
            super.removeFromSuperview();
        });
    }
}
