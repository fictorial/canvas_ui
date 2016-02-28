import  _ from 'lodash';
import View from './View';
import Button from './Button';
import {transparent, FingerSizePoints} from './magic';
import {lineHeight} from './fonts';

/**
 * Choice between a few items.
 *
 * Events:
 * - selectionChanged(index, text)
 */

export default class SegmentView extends View {
    constructor() {
        super();

        this._selectedIndex = -1;
        this._selectedTextColor = '#fff';

        this._accentColor = '#00f';
        this.borderColor = this._accentColor;
        this.textColor = this._accentColor;

        // NB: selected button background color = this._accentColor
        this._buttons = [];
        this._choices = [];

        this.cornerRadius = 10;
        this.borderWidth = 1;
        this.clipsSubviews = true;
    }

    get choices() {
        return this._choices;
    }

    set choices(choices) {

        // don't envision changing choices on the fly being a real use case;
        // thus, only allow them to be set once

        if (this._choices.length > 0) {
            return;
        }

        this._choices = choices;

        let textColor = this.textColor;

        this._buttons = _.map(choices, (choice, index) => {
            var button = new Button(choice);
            button.id = `Segment Button ${index}`;
            button.borderWidth = 0;
            button.textColor = textColor;
            button.offsetsOnTouch = false;
            button.cornerRadius = 0;
            button.backgroundColor = transparent;
            //button.highlightColor = '#00a';
            button.highlightedTextColor = '#000';
            button._segmentIndex = index;
            button.on('tap', () => {
                this.selectedIndex = button._segmentIndex;
            });
            this.addSubview(button);
            return button;
        });

        this.needsLayout = true;
    }

    get accentColor() {
        return this._accentColor;
    }

    set accentColor(color) {
        if (this._accentColor !== color) {
            this._accentColor = color;
            this.borderColor = this._accentColor;
            this.textColor = this._accentColor;
        }
    }

    get selectedTextColor() {
        return this._selectedTextColor;
    }

    set selectedTextColor(color) {
        if (this._selectedTextColor != color) {
            this._selectedTextColor = color;
            this.needsDisplay = true;
        }
    }

    layoutSubviews() {
        var x = 0;

        _.each(this._buttons, button => {
            button.position.set(x, 0);
            x += button.width;
        });
    }

    get selectedIndex() {
        return this._selectedIndex;
    }

    set selectedIndex(index) {
        if (this._selectedIndex === -1) {
            this._selectedIndex = index;
        } else if (index != this._selectedIndex) {
            this._selectedIndex = index;
            this.emit('selectionChanged', index, this.choices[index]);
        }

        _.each(this._buttons, btn => {
            if (btn._segmentIndex === index) {
                btn.backgroundColor = this._accentColor;
                btn.textColor = this.selectedTextColor;
            } else {
                btn.backgroundColor = transparent;
                btn.textColor = this.textColor;
            }
        });

        this.needsDisplay = true;
    }

    get font() {
        return super.font;
    }

    set font(f) {
        super.font = f;
        _.each(this._buttons, btn => {
            btn.font = f;
        })
    }

    preferredHeight() {
        return Math.max(FingerSizePoints, lineHeight(this.font));
    }

    /**
     * Be sure to `sizeChoicesUniform`, `sizeChoicesUniformWidest`, or `sizeChoicesVarying` first.
     */

    sizeToFit() {
        let width = _.sum(_.pluck(this._buttons, 'width'));
        this.size.set(width, this.preferredHeight());
        return this;
    }

    /**
     * Choice buttons will have varying widths based on their choice text.
     */

    sizeChoicesVarying() {
        _.each(this._buttons, btn => btn.sizeToFit());
        return this;
    }

    /**
     * Choice buttons will have uniform width based on the text of the
     * choice with the widest text.
     */

    sizeChoicesUniformWidest() {
        let maxWidth = _.max(_.map(this._buttons, btn => {
            btn.sizeToFit();
            return btn.width;
        }));

        _.each(this._buttons, btn => {
            btn.width = maxWidth;
        });

        return this;
    }

    /**
     * Each choice's width is the same and is based on the width of the
     * segment view.  You must set the segment view frame width and height
     * first.
     */

    sizeChoicesUniform() {
        let width = Math.round(this.width / this.choices.length),
            height = this.height;

        _.each(this._buttons, btn => {
            btn.size.set(width, height);
        });

        return this;
    }

    draw(context) {
        super.draw(context);

        // Draw vertical separator lines between buttons

        let n = this._buttons.length;
        if (n === 1) {
            return;
        }

        context.beginPath();

        for (var i = 0; i < n - 1; ++i) {
            let btn = this._buttons[i];
            context.moveTo(btn.right, 0);
            context.lineTo(btn.right, btn.bottom);
        }

        context.closePath();

        context.strokeStyle = this._accentColor;
        context.lineWidth = this.borderWidth;
        context.stroke();
    }
}
