import  _ from 'lodash';
import DemoView from './DemoView';
import Label from 'canvas_ui/Label';
import TextEditView from 'canvas_ui/TextEditView';
import Button from 'canvas_ui/Button';
import ScrollableTextView from 'canvas_ui/ScrollableTextView';
import KeyboardView from 'canvas_ui/KeyboardView';
import NotificationView from 'canvas_ui/NotificationView';
import AlertView from 'canvas_ui/AlertView';
import {SystemFontOfSize} from 'canvas_ui/fonts';
import {FingerSizePoints} from 'canvas_ui/magic';

export default class TextEditDemoView extends DemoView {
    constructor() {
        super('Edit text and soft keyboard');

        this.lengthLabel = new Label('');
        this.lengthLabel.textColor = '#ddd';
        this.addSubview(this.lengthLabel);

        this.textEdit = new TextEditView();
        this.textEdit.placeholder = 'Your name here';
        this.textEdit.maxLength = 128;
        this.textEdit.on('enter', this.handleSubmit.bind(this));
        this.textEdit.on('textChanged', () => {
            if (this.textEdit.maxLength > 0) {
                this.lengthLabel.text = `${this.textEdit.maxLength - this.textEdit.text.length}`;
                this.needsLayout = true;
            }
        });
        this.addSubview(this.textEdit);

        this.helloButton = new Button('Greet');
        this.addSubview(this.helloButton);
        this.helloButton.on('tap', this.handleSubmit.bind(this));

        this.shortcutsButton = new Button('?');
        this.addSubview(this.shortcutsButton);
        this.shortcutsButton.on('tap', () => {
            this.messageView.hidden = !this.messageView.hidden;
        });

        let shortcuts = _.map(TextEditView.keyBindings, (operation, shortcut) => {
            return `${shortcut}: ${_.snakeCase(operation.name).replace(/_/g, ' ')}`;
        }).join('\n');
        this.messageView = new ScrollableTextView(shortcuts);
        this.messageView.textView.font = SystemFontOfSize(9);
        this.messageView.hidden = true;
        this.addSubview(this.messageView);
    }

    handleSubmit() {
        let kbd = KeyboardView.instance(false);
        if (kbd) {
            kbd.hide(true, this.greet.bind(this));
        } else {
            this.greet();
        }
    }

    greet() {
        let name = this.textEdit.text.trim();
        if (name.length === 0) {
            let notification = new NotificationView('Please enter your name', 'error');
            this.rootView.addSubview(notification);
        } else {
            let alertView = new AlertView('Greetings', `Hello, ${name}!`);
            alertView.on('removedFromSuperview', () => {
                this.textEdit.becomeFirstResponder();
            });
            this.rootView.addSubview(alertView);
        }
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.textEdit.size.set(this.width/2, FingerSizePoints);
        this.textEdit.moveToCenterMiddle().bottom = this.height - 100;

        this.lengthLabel
            .sizeToFit()
            .moveRightOf(this.textEdit, 10)
            .alignVerticalCenter(this.textEdit);

        this.helloButton
            .sizeToFit()
            .moveBelow(this.textEdit, 10)
            .alignLeft(this.textEdit);

        this.shortcutsButton
            .sizeToFit()
            .moveBelow(this.textEdit, 10)
            .moveRightOf(this.helloButton, 10);

        this.messageView.contentSize.set(this.textEdit.width, 0);
        this.messageView.size.set(this.textEdit.width, this.height/2);
        this.messageView.moveAbove(this.textEdit, -20).alignLeft(this.helloButton);
    }
}
