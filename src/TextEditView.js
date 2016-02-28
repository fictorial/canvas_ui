import  _ from 'lodash';
import Label from './Label';
import {transparent, FingerSizePoints, isMobile} from './magic';
import Button from './Button';
import {SystemFontOfSize} from './fonts';
import Point from './Point';
import {getContext} from './core';
import * as KeyboardView from './KeyboardView';

/**
 * An editable single line of text.
 *
 * This is of course a bare bones implementation. A real text edit control is extremely
 * involved. Here are but a few of the things not implemented here:
 *
 * - selections
 * - copy and paste
 * - insertion mode
 * - right-to-left layout
 *
 * What is implemented is:
 * - moving the cursor backwards/forwards
 * - inserting text at the cursor position
 * - backwards/forwards deletion
 * - being notified when enter is pressed (i.e. 'act on this info please')
 * - maxLength
 * - secure mode in which dots are shown instead of actual text (i.e. for passwords)
 */

export default class TextEditView extends Label {
    constructor(text) {
        super(text);

        this._cursorPosition = 0;
        this._cursorColor = '#aaa';
        this._cursorOn = false;

        this._maxLength = 0;
        this._secureMode = false;
        this._dotColor = '#333';

        this.backgroundColor = '#fff';
        this.borderWidth = 1;
        this.borderColor = '#aaa';
        this.cornerRadius = 5;
        this.textAlign = 'left';
        this.insets.setAll(10);

        this.userInteractionEnabled = true;  // labels are static
        this.tailTruncation = null;          // don't add ellipsis, just clip to content frame

        this.placeholderLabel = new Label('');
        this.placeholderLabel.id = 'placeholder';
        this.placeholderLabel.textColor = '#aaa';
        this.placeholderLabel.backgroundColor = transparent;
        this.addSubview(this.placeholderLabel);
        this.on('textChanged', this._maybeShowPlaceholder.bind(this));
        this.on('didBecomeFirstResponder', this._maybeShowPlaceholder.bind(this));
        this.on('didResignFirstResponder', this._maybeShowPlaceholder.bind(this));

        this.stylizeAsNormal();
    }

    get placeholder() {
        return this.placeholderLabel.text;
    }

    set placeholder(text) {
        this.placeholderLabel.text = (text || '').trim();
        this._maybeShowPlaceholder();
    }

    _maybeShowPlaceholder() {
        var hasText = (this.text && this.text.length > 0);
        this.placeholderLabel.hidden = hasText;
    }

    get maxLength() {
        return this._maxLength;
    }

    set maxLength(len) {
        len = parseInt(len, 10);

        if (_.isFinite(len) && len >= 0 && this._maxLength !== len) {
            if (len < this._maxLength) {
                this.cursorPosition = Math.min(len, this.cursorPosition);
                this.text = this.text.substr(0, len);
            }

            this._maxLength = len;
            this.needsDisplay = true;
        }
    }

    get cursorPosition() {
        return this._cursorPosition;
    }

    set cursorPosition(pos) {
        let newPos = Math.max(0, Math.min(this.text.length, pos));

        if (newPos !== this._cursorPosition) {
            this._cursorPosition = newPos;
            this.needsDisplay = true;
        }
    }

    get cursorColor() {
        return this._cursorColor;
    }

    set cursorColor(color) {
        if (color !== this._cursorColor) {
            this._cursorColor = color;
            this.needsDisplay = true;
        }
    }

    get secureMode() {
        return this._secureMode;
    }

    set secureMode(onOff) {
        if (this._secureMode != onOff) {
            this.textColor = this.backgroundColor;
            this._secureMode = onOff;
            this.needsDisplay = true;
        }
    }

    get dotColor() {
        return this._dotColor;
    }

    set dotColor(c) {
        this._dotColor = c;
        this.needsDisplay = true;
    }

    showSoftKeyboardButton() {
        let btnSize = FingerSizePoints;
        this.insets.set(10, 10, 10, btnSize - 5);

        this.hideSoftKeyboardButton();

        this.softKeyboardButton = new Button('⌨');
        this.softKeyboardButton.font = SystemFontOfSize(18);
        this.softKeyboardButton.textColor = this.textColor;
        this.softKeyboardButton.backgroundColor = this.backgroundColor;
        this.softKeyboardButton.borderWidth = 0;
        this.softKeyboardButton.shadowBlur = 0;
        this.addSubview(this.softKeyboardButton);
        this.softKeyboardButton.on('tap', this.toggleSoftKeyboard.bind(this));
    }

    hideSoftKeyboardButton() {
        if (this.softKeyboardButton) {
            this.softKeyboardButton.removeFromSuperview();
        }
    }

    toggleSoftKeyboard() {
        let kbd = KeyboardView.instance();
        if (kbd) {
            kbd.toggle();
        }
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.placeholderLabel.frame = this.contentFrame;

        if (this.softKeyboardButton) {
            let btnSize = FingerSizePoints;
            this.softKeyboardButton.frame.set(
                this.contentRight, this.contentCenterY - btnSize/2, btnSize, btnSize);
        }
    }

    stylizeAsFirstResponder() {
        this.borderWidth = 2;
        this.borderColor = this.cursorColor = '#0078fd';
    }

    stylizeAsNormal() {
        this.borderWidth = 1;
        this.borderColor = this.cursorColor = '#888';
    }

    didBecomeFirstResponder() {
        super.didBecomeFirstResponder();
        this.stylizeAsFirstResponder();
        this.blinkCursor();
        this.maybeShowKeyboard();
    }

    blinkCursor() {
        this.stopBlinkingCursor();

        // Blink the cursor. Note that we do not simply this.needsDisplay = true here but draw with the
        // context atop the root view which is a bit a million times more efficient.

        this.blinkInterval = setInterval(() => {
            this._cursorOn = !this._cursorOn;

            if (this.isFirstResponder() && !this.hidden) {
                this.drawCursor(getContext(),
                    this.convertLocalToRoot(new Point(this.cursorX, this.contentTop)));
            }
        }, 500);
    }

    stopBlinkingCursor() {
        clearInterval(this.blinkInterval);
        this._cursorOn = false;
        this.needsDisplay = true;  // Ok since not repeatedly.
    }

    maybeShowKeyboard() {
        if (isMobile()) {
            let kbd = KeyboardView.instance();
            if (kbd) {
                kbd.show();
            }
        } else {
            this.showSoftKeyboardButton();
        }
    }

    willResignFirstResponder(nextFirstResponder) {
        super.willResignFirstResponder();
        this.stylizeAsNormal();
        this.hideSoftKeyboardButton();
        this.stopBlinkingCursor();

        if (!(nextFirstResponder instanceof TextEditView)) {
            let kbd = KeyboardView.instance();
            if (kbd) kbd.hide();
        }
    }

    tapped() {
        super.tapped();

        if (!this.isFirstResponder()) {
            this.becomeFirstResponder();
        } else {
            this.maybeShowKeyboard();
        }
    }

    draw(context) {
        super.draw(context);

        if (!this._secureMode) {
            let textBeforeCursor = this.text.substring(0, this._cursorPosition),
                textBeforeCursorWidth = context.measureText(textBeforeCursor).width;

            this.cursorX = Math.round(this.textLeft(context) + textBeforeCursorWidth);
        } else {
            let dotRadius = this.contentHeight / 4;

            var x = this.textLeft(context) + dotRadius,
                y = this.contentCenterY;

            context.beginPath();
            for (var i = 0, N = this.text.length; i < N; ++i, x += 2 * dotRadius + 2) {
                context.arc(x, y, dotRadius, 0, 2*Math.PI, false);
            }
            context.closePath();

            context.fillStyle = this.dotColor;
            context.fill();

            this.cursorX = Math.round(x - dotRadius);
        }

        if (this._cursorOn) {
            this.drawCursor(context, {x: this.cursorX, y: this.contentTop});
        }
    }

    drawCursor(context, pt) {
        context.beginPath();
        context.moveTo(pt.x, pt.y);
        context.lineTo(pt.x, pt.y + this.contentHeight);
        context.closePath();

        context.strokeStyle = this._cursorOn && this._cursorColor || this.backgroundColor;
        context.lineWidth = 1;
        context.stroke();
    }

    keyPressed(key, ctrlKey, shiftKey, metaKey, altKey) {
        // Non-modifier key = type text into text box

        if (!ctrlKey && !metaKey && !altKey && key.length === 1) {
            let text = this.text,
                cursorPosition = this.cursorPosition,
                maxLength = this._maxLength;

            if (maxLength <= 0 || text.length + 1 <= maxLength) {
                if (cursorPosition === text.length) {
                    this.text = text + key;
                } else {
                    this.text = `${text.slice(0, cursorPosition)}${key}${text.slice(cursorPosition)}`;
                }

                this.cursorPosition = cursorPosition + 1;
            }

            return;
        }

        if (key === 'Shift' ||
            key === 'Meta' ||
            key === 'Control' ||
            key === 'Alt') {

            return;
        }

        let bindingKey =
            (ctrlKey  && 'ctrl+'  || '') +
            (shiftKey && 'shift+' || '') +
            (metaKey  && 'meta+'  || '') +
            (altKey   && 'alt+'   || '') + key;

        if (this._debugMode) {
            this.log('keyPressed', bindingKey);
        }

        let binding = TextEditView.keyBindings[bindingKey];
        if (_.isFunction(binding)) {
            binding.call(this);
        } else {
            super.keyPressed(key, ctrlKey, shiftKey, metaKey, altKey);
        }
    }

    enter() {
        this.emit('enter');
    }

    clear() {
        this.text = '';
        this.cursorPosition = 0;
    }

    moveBack() {
        this.cursorPosition = Math.max(0, this.cursorPosition - 1);
    }

    moveBackWord() {
        let text = this.text;

        var index = Math.max(0, this.cursorPosition - 1);

        while (index >= 0 && text.charAt(index).match(/\s/)) {
            index--;
        }

        while (index >= 0 && !text.charAt(index).match(/\s/)) {
            index--;
        }

        this.cursorPosition = index + 1;
    }

    moveToStart() {
        this.cursorPosition = 0;
    }

    moveForward() {
        this.cursorPosition = Math.min(this.text.length, this.cursorPosition + 1);
    }

    moveForwardWord() {
        let text = this.text;

        for (var index = Math.min(text.length - 1, this.cursorPosition + 1);
             index < text.length; ++index) {

            if (text.charAt(index).match(/\s/)) {
                this.cursorPosition = index;
                return;
            }
        }

        this.cursorPosition = text.length;
    }

    moveToEnd() {
        this.cursorPosition = this.text.length;
    }

    deleteForward() {
        let text = this.text,
            cursorPosition = this.cursorPosition;

        this.text = `${text.slice(0, cursorPosition)}${text.slice(cursorPosition + 1)}`;
    }

    deleteForwardWord() {
        let text = this.text;

        for (var index = Math.min(text.length - 1, this.cursorPosition + 1);
             index < text.length; ++index) {

            if (text.charAt(index).match(/\s/)) {
                this.text = this.text.slice(this.cursorPosition,
                    index - this.cursorPosition);

                return;
            }
        }
    }

    deleteForwardToEnd() {
        this.text = this.text.slice(0, this.cursorPosition);
    }

    deleteBackward() {
        let text = this.text,
            cursorPosition = this.cursorPosition;

        this.text = `${text.slice(0, cursorPosition - 1)}${text.slice(cursorPosition)}`;
        this.cursorPosition = Math.max(0, cursorPosition - 1);
    }

    deleteBackwardToStart() {
        this.text = this.text.slice(this.cursorPosition + 1);
    }

    deleteBackwardWord() {
        let text = this.text;

        for (var index = Math.max(0, this.cursorPosition - 1); index >= 0; --index) {
            if (text.charAt(index).match(/\s/)) {
                this.cursorPosition = index;
                this.text = text.slice(0, index);

                return;
            }
        }
    }

    focusNext() {
        let thisIndex = _.findIndex(this.superview.subviews, subview => subview === this),

            // TODO this should be a recursive search down into subviews of subviews etc
            targetTextEdit = _.find(this.superview.subviews, (subview, index) => {
                return index > thisIndex && subview.canBecomeFirstResponder();
            });

        if (targetTextEdit) {
            targetTextEdit.becomeFirstResponder();
        }
    }

    focusPrevious() {
        let thisIndex = _.findIndex(this.superview.subviews, subview => subview === this),
            targetTextEdit = _.find(this.superview.subviews, (subview, index) => {
                return index < thisIndex && subview.canBecomeFirstResponder();
            });

        if (targetTextEdit) {
            targetTextEdit.becomeFirstResponder();
        }
    }

    textLeft(context) {
        context.save();
        context.font = this.font;

        let textBeforeCursor = this.text.substring(0, this.cursorPosition),
            textBeforeCursorWidth = context.measureText(textBeforeCursor).width;

        context.restore();

        // The cursor should be visible at all times.

        if (this.contentLeft + textBeforeCursorWidth > this.contentRight) {
            return this.contentRight - textBeforeCursorWidth;
        }

        return this.contentLeft;
    }
}

/**
 * Key bindings for TextEditView.
 *
 * Keys in this object use modifiers in the order: ctrl, meta, shift, alt
 * then the name of the key.  E.g. "ctrl+shift+A" not "shift+ctrl+A"
 *
 * The keyname for keys combined with modifiers must be uppercase (e.g. ctrl+A)
 */

TextEditView.keyBindings = {
    // Custom
    'Enter': TextEditView.prototype.enter,
    'Escape': TextEditView.prototype.resignFirstResponder,

    // Common
    'Tab': TextEditView.prototype.focusNext,
    'shift+Tab': TextEditView.prototype.focusPrevious,
    'Backspace': TextEditView.prototype.deleteBackward,
    'Delete': TextEditView.prototype.deleteForward,
    'ArrowLeft': TextEditView.prototype.moveBack,
    'ArrowRight': TextEditView.prototype.moveForward,
    'Home': TextEditView.prototype.moveToStart,
    'End': TextEditView.prototype.moveToEnd,

    // Emacs style
    'ctrl+B': TextEditView.prototype.moveBack,
    'ctrl+F': TextEditView.prototype.moveForward,
    'ctrl+A': TextEditView.prototype.moveToStart,
    'ctrl+E': TextEditView.prototype.moveToEnd,
    'ctrl+D': TextEditView.prototype.deleteForward,
    'ctrl+H': TextEditView.prototype.deleteBackward,
    'ctrl+K': TextEditView.prototype.deleteForwardToEnd,

    // Mac OS X style
    'meta+ArrowLeft': TextEditView.prototype.moveToStart,
    'meta+ArrowRight': TextEditView.prototype.moveToEnd,
    'alt+Backspace': TextEditView.prototype.deleteBackwardWord,
    'meta+Backspace': TextEditView.prototype.deleteBackwardToStart,
    'alt+Delete': TextEditView.prototype.deleteForwardWord,
    'alt+ArrowLeft': TextEditView.prototype.moveBackWord,
    'alt+ArrowRight': TextEditView.prototype.moveForwardWord
};
