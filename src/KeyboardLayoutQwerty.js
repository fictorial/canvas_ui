import  _ from 'lodash';
import KeyboardLayout from './KeyboardLayout';
import ModifierKeyButton from './ModifierKeyButton';
import KeyButton from './KeyButton';
import AlternateKeysView from './AlternateKeysView';
import ToggleKeyButton from './ToggleKeyButton';
import View from './View';
import {SystemFontOfSize} from './fonts';

let qwertyAlternates = {
    'e': { lower: 'èéêëēėę', upper: 'ÈÉÊËĒĖĘ' },
    'y': { lower: 'ÿ', upper: 'Ÿ' },
    'u': { lower: 'ūúùüû', upper: 'ŪÚÙÜÛ' },
    'i': { lower: 'ìįīíïî',  upper: 'ÌĮĪÍÏÎ' },
    'o': { lower: 'õōøœóòöô', upper: 'ÕŌØŒÓÒÖÔ' },
    'a': { lower: 'áàâäæãåā', upper: 'ÁÀÂÄӔÃÅĀ' },
    's': { lower: 'ßśš', upper: 'ŚŠ' },
    'l': { lower: 'ł', upper: 'Ł' },
    'z': { lower: 'žźż', upper: 'ŽŹŻ' },
    'c': { lower: 'çćč', upper: 'ÇĆČ' },
    'n': { lower: 'ńñ', upper: 'ŃÑ' },
    '0': { lower: '°' },   // no shift since symbols
    '-': { lower: '–—·' },
    '/': { lower: '\\' },
    '$': { lower: '₱¥€¢₤₩' },
    '&': { lower: '§' },
    '"': { lower: '«»„“”' },
    '.': { lower: '…' },
    '?': { lower: '¿' },
    '!': { lower: '¡' },
    '\'': { lower: '‵‘’' },
    '%': { lower: '‰' }
};

/**
 * A keyboard layout that follows the US keyboard for iOS.
 *
 * - Does not support special modes like numbers, email, etc.
 * - Does not support spell check, autocorrect, autocapitalization, double-space for entering
 *   a full-stop/period, shortcuts, and so on.
 *
 * The goal here is not to create a perfect replica of the iOS keyboard but rather get a good
 * enough experience for games.
 */

export default class KeyboardLayoutQwerty extends KeyboardLayout {
    constructor(keyboard) {
        super(keyboard);

        this.backspaceKey = new ModifierKeyButton('⌫');
        this.addSubview(this.backspaceKey);
        this.backspaceKey.on('tap', () => {
            if (View.firstResponder) {
                View.firstResponder.keyPressed('Backspace');
            }
        });

        this.returnKey = new KeyButton('Done', false);
        this.addSubview(this.returnKey);
        this.returnKey.backgroundColor = '#0078fd';
        this.returnKey.textColor = '#ddd';
        this.returnKey.on('tap', () => {
            if (View.firstResponder) {
                View.firstResponder.keyPressed('Enter');
            }
        });

        this.spaceKey = new KeyButton('space', false);
        this.addSubview(this.spaceKey);
        this.spaceKey.on('tap', () => {
            if (View.firstResponder) {
                View.firstResponder.keyPressed(' ');
            }
        });

        this.majorModeKey = new ModifierKeyButton('');
        this.addSubview(this.majorModeKey);
        this.majorModeKey.on('tap', () => {
            this.majorMode = this.majorMode !== 'letters' ?
                'letters' : 'numbersAndSymbols';
        });

        this.spaceKey.font = this.returnKey.font = SystemFontOfSize(12);
        this.majorModeKey.font = SystemFontOfSize(10);
        this.backspaceKey.font = SystemFontOfSize(14);

        this.majorMode = 'letters';
        this.keyMargin = 5;

        this._keyboard = keyboard;
    }

    get majorMode() {
        return this._majorMode;
    }

    set majorMode(mode) {
        this._majorMode = mode;

        if (this.shiftKey) {
            this.shiftKey.removeFromSuperview();
        }

        if (this.minorModeKey) {
            this.minorModeKey.removeFromSuperview();
        }

        var lettersPerRow;

        switch (mode) {
        case 'letters':
            lettersPerRow = [
                'qwertyuiop'.split(''),
                'asdfghjkl'.split(''),
                'zxcvbnm'.split('')
            ];

            this.majorModeKey.text = '123';
            this._addShiftKey();
            break;

        case 'numbersAndSymbols':
            lettersPerRow = [
                '1234567890'.split(''),
                '-/:;()$&@\''.split(''),
                '.,?!\''.split('')
            ];

            this.majorModeKey.text = 'ABC';
            this._addMinorModeKey();
            this.minorModeKey.text = '#+=';
            break;

        case 'extendedSymbols':
            lettersPerRow = [
                '[]{}#%^*+='.split(''),
                '_\|~<>€₤¥·'.split(''),
                '.,?!\''.split('')
            ];

            this.majorModeKey.text = 'ABC';
            this._addMinorModeKey();
            this.minorModeKey.text = '123';
            break;
        }

        if (this.rows) {
            _.each(this.rows, row => {
                _.each(row, btn => btn.removeFromSuperview());
            });
        }

        let afterLetterKeyTap = () => {
            if (this.shiftKey) {
                this.shiftKey.selected = false;
            }

            this._removeAlternatesView();
        };

        this.rows = _.map(lettersPerRow, letters => {
            return _.map(letters, letter => {
                var btn = new KeyButton(letter);
                this.addSubview(btn);

                btn.on('tap', afterLetterKeyTap);

                var alternates = qwertyAlternates[letter];
                if (alternates) {
                    btn.altLower = alternates.lower;
                    btn.altUpper = alternates.upper;

                    btn.on('longPressed', () => {
                        let shiftSelected = this.shiftKey && this.shiftKey.selected,
                            alts = (shiftSelected && btn.altUpper || btn.altLower).split('');

                        this._removeAlternatesView();

                        this.rootView.addSubview(new AlternateKeysView(alts));
                    });
                }

                return btn;
            });
        });

        this.needsLayout = true;
    }

    _removeAlternatesView() {
        // Only one of these active at any time...

        _.each(this._keyboard.superview.subviews, subview => {
            if (subview !== this &&
                subview instanceof AlternateKeysView) {
                subview.removeFromSuperview();
            }
        });
    }

    _addShiftKey() {
        this.shiftKey = new ToggleKeyButton('⬆︎','⬆︎');     // meh look at unicode tables; odd
        this.addSubview(this.shiftKey);
        this.shiftKey.on('selectedChanged', (isSelected) => {
            _.each(this.rows, row => {
                _.each(row, btn => {
                    if (isSelected) {
                        btn.text = btn.text.toUpperCase();
                    } else {
                        btn.text = btn.text.toLowerCase();
                    }
                });
            });
        });
    }

    _addMinorModeKey() {
        this.minorModeKey = new KeyButton('#+=');
        this.minorModeKey.font = SystemFontOfSize(12);
        this.addSubview(this.minorModeKey);
        this.minorModeKey.on('tap', () => {
            this.majorMode = this.majorMode === 'extendedSymbols' ?
                'numbersAndSymbols' : 'extendedSymbols';
        });
    }

    layoutSubviews() {
        let rowCount = this.rows.length + 1,
            marginsBetweenRows = this.keyMargin * (rowCount - 1),
            rowHeight = (this.contentHeight - marginsBetweenRows) / rowCount;

        let keyWidth = Math.round(_.min(_.map(this.rows, row => {
            let totalMarginSize = (row.length - 1) * this.keyMargin;
            return (this.contentWidth - totalMarginSize) / row.length;
        })));

        var rowTop = this.contentTop;

        _.each(this.rows, row => {
            let totalMarginSize = (row.length - 1) * this.keyMargin,
                rowWidth = keyWidth * row.length + totalMarginSize;

            var keyLeft = this.contentCenterX - rowWidth/2;

            _.each(row, btn => {
                btn.frame.set(keyLeft, rowTop, keyWidth, rowHeight);
                keyLeft += keyWidth + this.keyMargin;
            });

            rowTop += rowHeight + this.keyMargin;
        });

        let lettersLastRowTop = _.last(this.rows)[0].top,
            lastRowTop = lettersLastRowTop + rowHeight + this.keyMargin,
            modKeyWidth = Math.round(keyWidth * 1.5);

        this.backspaceKey.frame.set(this.contentRight - modKeyWidth,
            lettersLastRowTop, modKeyWidth, rowHeight);

        let returnKeyWidth = modKeyWidth + this.keyMargin + keyWidth;

        this.returnKey.frame.set(this.contentRight - returnKeyWidth,
            lastRowTop, returnKeyWidth, rowHeight);

        this.majorModeKey.frame.set(this.contentLeft, lastRowTop,
            modKeyWidth, rowHeight);

        if (this.shiftKey) {
            this.shiftKey.frame.set(this.contentLeft, lettersLastRowTop,
                modKeyWidth, rowHeight);
        }

        if (this.minorModeKey) {
            this.minorModeKey.frame.set(this.contentLeft, lettersLastRowTop,
                modKeyWidth, rowHeight);
        }

        this.spaceKey.frame.set(this.majorModeKey.right + this.keyMargin,
            lastRowTop,
            this.returnKey.left - this.majorModeKey.right - this.keyMargin * 2,
            rowHeight);
    }
}
