import  _ from 'lodash';

import ScrollView from './ScrollView';
import TextView from './TextView';
import Size from './Size';

/**
 * A text view inside a scroll view.
 */

export default class ScrollableTextView extends ScrollView {
    constructor(text) {
        super();

        this.textView = new TextView(text);
        this.contentView.addSubview(this.textView);

        this.textView.on('didLayoutSubviews', () => {
            let lastLine = _.last(this.textView._lines);
            if (lastLine) {
                let textHeight = lastLine.top + this.textView.lineHeight + this.textView.insets.bottom;
                this.contentSize = new Size(this.contentSize.width, textHeight);
                this.textView.frame = this.contentView.bounds;
            }
        });
    }

    layoutSubviews() {
        this.textView.frame = this.contentView.bounds;
        this.textView.layoutIfNeeded();
    }
}
