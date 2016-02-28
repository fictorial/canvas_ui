import  DemoView from './DemoView';
import Label from 'canvas_ui/Label';
import TextEditView from 'canvas_ui/TextEditView';
import Button from 'canvas_ui/Button';
import NotificationView from 'canvas_ui/NotificationView';
import ActivityIndicatorView from 'canvas_ui/ActivityIndicatorView';
import MessageView from 'canvas_ui/MessageView';
import {FingerSizePoints} from 'canvas_ui/magic';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';
import View from 'canvas_ui/View';
import KeyboardView from 'canvas_ui/KeyboardView';
import {setPropertyRecursive} from 'canvas_ui/util';

export default class RegistrationDemoView extends DemoView {
    constructor() {
        super('User Registration Demo');

        this.usernameLabel = new Label('Username');
        this.addSubview(this.usernameLabel);

        this.passwordLabel = new Label('Password');
        this.addSubview(this.passwordLabel);

        this.usernameView = new TextEditView();
        this.usernameView.maxLength = 32;
        this.addSubview(this.usernameView);
        this.usernameView.on('enter', () => {
            this.passwordView.becomeFirstResponder();
        });

        this.passwordView = new TextEditView();
        this.passwordView.maxLength = 32;
        this.passwordView.secureMode = true;
        this.addSubview(this.passwordView);
        this.passwordView.on('enter', this.handleSubmit.bind(this));

        this.submitButton = new Button('Sign Up');
        this.addSubview(this.submitButton);
        this.submitButton.on('tap', () => this.handleSubmit());

        this.usernameLabel.font = this.passwordLabel.font = BoldSystemFontOfSize(14);
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.passwordView.size.set(this.superview.width/2, FingerSizePoints);
        this.passwordView.moveToCenterMiddle();

        this.passwordLabel
            .makeSameSize(this.passwordView)
            .moveAbove(this.passwordView)
            .alignLeft(this.passwordView);

        this.usernameView
            .makeSameSize(this.passwordView)
            .moveAbove(this.passwordLabel)
            .alignLeft(this.passwordView);

        this.usernameLabel
            .makeSameSize(this.passwordView)
            .moveAbove(this.usernameView)
            .alignLeft(this.passwordView);

        this.submitButton
            .sizeToFit()
            .moveBelow(this.passwordView, 20)
            .alignLeft(this.passwordView);
    }

    handleSubmit() {
        let username = this.usernameView.text.trim();
        if (username.length < 3 || username.length > 32) {
            let notification = new NotificationView('Please enter a valid username of 3-32 characters.', 'error');
            this.rootView.addSubview(notification);
            this.usernameView.becomeFirstResponder();
            return;
        }

        let password = this.passwordView.text.trim();
        if (password.length < 3 || password.length > 32) {
            let notification = new NotificationView('Please enter a valid password of 3-32 characters', 'error');
            this.rootView.addSubview(notification);
            this.passwordView.becomeFirstResponder();
            return;
        }

        if (View.firstResponder) {
            View.firstResponder.resignFirstResponder();

            let kbd = KeyboardView.instance(false);
            if (kbd) {
                kbd.hide();
            }
        }

        this.signupWith(username, password);
    }

    signupWith(/*username, password*/) {
        let messageView = new MessageView();

        let activityIndicatorView = new ActivityIndicatorView();
        activityIndicatorView.lineColor = '#ddd';
        messageView.addSubview(activityIndicatorView);
        messageView.on('didLayoutSubviews', () => {
            let size = Math.round(messageView.width / 8);
            activityIndicatorView.size.set(size, size);
            activityIndicatorView.moveToCenterMiddle().animating = true;
        });

        setPropertyRecursive(messageView, 'backgroundColor', '#444');
        setPropertyRecursive(messageView, 'borderWidth', 0);
        setPropertyRecursive(messageView, 'textColor', '#ddd');

        this.rootView.addSubview(messageView);

        setTimeout(() => {
            messageView.removeFromSuperview();

            setTimeout(() => {
                let notification = new NotificationView('Username taken.', 'error');
                this.rootView.addSubview(notification);

                this.usernameView.becomeFirstResponder();
            }, 500);
        }, 2000);
    }
}
