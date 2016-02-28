import  _ from 'lodash';
import DemoView from './DemoView';
import Button from 'canvas_ui/Button';
import NotificationView from 'canvas_ui/NotificationView';

export default class NotificationDemoView extends DemoView {
    constructor() {
        super('Notifications');

        this.infoButton = new Button('Info');
        this.addSubview(this.infoButton);
        this.infoButton.on('tap', () => {
            let notification = new NotificationView('Something happened.');
            this.rootView.addSubview(notification);
        });

        this.warningButton = new Button('Warning');
        this.addSubview(this.warningButton);
        this.warningButton.on('tap', () => {
            let notification = new NotificationView('Something is about to break.', 'warning');
            this.rootView.addSubview(notification);
        });

        this.errorButton = new Button('Error');
        this.addSubview(this.errorButton);
        this.errorButton.on('tap', () => {
            let notification = new NotificationView('Something broke.', 'error');
            this.rootView.addSubview(notification);
        });
    }

    layoutSubviews() {
        _.each(this.subviews, subview => subview.sizeToFit());
        let maxWidth = _.max(_.pluck(this.subviews, 'width'));
        _.each(this.subviews, subview => { subview.width = maxWidth; });

        this.warningButton
            .moveToCenterMiddle();

        this.infoButton
            .moveAbove(this.warningButton, -20)
            .alignHorizontalCenter(this.warningButton);

        this.errorButton
            .moveBelow(this.warningButton, 20)
            .alignHorizontalCenter(this.warningButton);
    }
}
