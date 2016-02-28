import  DemoView from './DemoView';
import loremIpsumText from './lorem';
import Button from 'canvas_ui/Button';
import AlertView from 'canvas_ui/AlertView';
import ConfirmView from 'canvas_ui/ConfirmView';

export default class AlertDemoView extends DemoView {
    constructor() {
        super('Alert');

        // Alert

        this.alertButton = new Button('Alert');
        this.alertButton.on('tap', function () {
            this.rootView.addSubview(new AlertView('Alert', 'Hello, World!'));
        });
        this.addSubview(this.alertButton);

        this.longTextAlertButton = new Button('Alert with Long Text');
        this.longTextAlertButton.on('tap', function () {
            this.rootView.addSubview(new AlertView('Alert', loremIpsumText));
        });
        this.addSubview(this.longTextAlertButton);

        // Confirm

        this.confirmButton = new Button('Confirm');
        this.confirmButton.on('tap', function () {
            let confirmView = new ConfirmView('Confirm', 'You sure you want to do that?');

            confirmView.on('canceled', () => {
                confirmView.removeFromSuperview();
            });

            confirmView.on('confirmed', () => {
                // Leave input blocker as we're going to show an alert immediately hereafter.
                confirmView.removeFromSuperview(false);

                // Wait for the confirm modal to animate off.
                confirmView.on('removedFromSuperview', () => {
                    this.rootView.addSubview(new AlertView('Alert', 'OK, let\'s do it!'));
                });
            });

            this.rootView.addSubview(confirmView);
        });

        this.addSubview(this.confirmButton);
    }

    layoutSubviews() {
        this.longTextAlertButton.sizeToFit();

        this.alertButton
            .makeSameSize(this.longTextAlertButton)
            .moveToCenterMiddle();

        this.confirmButton
            .makeSameSize(this.longTextAlertButton)
            .moveBelow(this.alertButton, 20)
            .alignLeft(this.alertButton);

        this.longTextAlertButton
            .moveBelow(this.confirmButton, 20)
            .alignLeft(this.alertButton);
    }
}
