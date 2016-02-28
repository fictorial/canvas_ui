import  _ from 'lodash';
import View from './View';
import KeyButton from './KeyButton';
import {FingerSizePoints} from './magic';
import * as KeyboardView from './KeyboardView';

/**
 * Long press a key that has alternate letters and it will show a AlternateKeysView
 * which allows the user to select similar but different letters.
 *
 * For instance, long press on 'e' to show an AlternateKeysView with 'è', 'é', 'ê', etc.
 *
 * Unlike iOS, the user must perform a separate tap to select one of the alternate letters.
 * In iOS, the user can long press and then drag over the alternate letter then lift his finger.
 */

export default class AlternateKeysView extends View {
    constructor(alternateLetters) {
        super();

        _.each(alternateLetters, letter => {
            var btn = new KeyButton(letter);
            this.addSubview(btn);
            btn.on('tap', () => this.removeFromSuperview());
        });

        this.insets.setAll(5);
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.height = Math.round(FingerSizePoints + 5*2); // top + bottom margin

        let kbd = KeyboardView.instance();

        this.moveAbove(kbd)
            .makeSameWidth(kbd)
            .alignLeft(kbd);

        this.backgroundColor = kbd.layout.backgroundColor;

        this.superview.needsLayout = false;
    }

    willBeRemovedFromView() {
        super.willBeRemovedFromView();
        this.superview.needsLayout = false;
    }

    layoutSubviews() {
        let margin = 5,
            keyCount = this.subviews.length,
            marginWidth = (keyCount - 1) * margin,
            keyWidth = Math.min(FingerSizePoints, (this.contentWidth - marginWidth) / keyCount),
            totalWidth = keyWidth * keyCount + marginWidth;

        var x = this.contentCenterX - totalWidth/2;

        _.each(this.subviews, subview => {
            subview.frame.set(x, this.contentTop, keyWidth, this.contentHeight);
            x += keyWidth + margin;
        });
    }
}
