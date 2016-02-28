import  DemoView from './DemoView';
import loremIpsumText from './lorem';
import ScrollableTextView from 'canvas_ui/ScrollableTextView';
import SegmentView from 'canvas_ui/SegmentView';
import Label from 'canvas_ui/Label';
import Size from 'canvas_ui/Size';
import {SystemFontOfSize} from 'canvas_ui/fonts';

export default class ScrollableTextDemoView extends DemoView {
    constructor() {
        super('Grab Scrolling and Word Wrapping');

        this.textView = new ScrollableTextView(loremIpsumText);
        this.textView.id = 'lorem';
        this.textView.font = SystemFontOfSize(14);
        this.textView.textView.lineHeight = Math.round(parseInt(this.textView.font, 10) * 1.8);
        this.textView.textView.insets.setAll(20);
        this.textView.borderColor = '#eee';
        this.textView.borderWidth = 1;
        this.addSubview(this.textView);

        this.alignmentView = new SegmentView();
        this.alignmentView.id = 'Alignment Choices';
        this.alignmentView.choices = ['Left', 'Center', 'Right'];
        this.alignmentView.selectedIndex = 0;
        this.alignmentView.on('selectionChanged', (index, text) => {
            this.textView.textView.textAlign = text.toLowerCase();
        });
        this.addSubview(this.alignmentView);

        this.instructionsLabel = new Label('Grab and drag text to scroll');
        this.instructionsLabel.id = 'Instructions';
        this.instructionsLabel.font = SystemFontOfSize(9);
        this.instructionsLabel.textColor = '#bbb';
        this.addSubview(this.instructionsLabel);
    }

    layoutSubviews() {
        this.textView.contentSize = new Size(this.contentWidth/2, 0);
        this.textView.size.set(this.contentWidth / 2, this.contentHeight / 2);
        this.textView.moveToCenterMiddle();

        this.alignmentView
            .sizeChoicesUniformWidest()
            .sizeToFit()
            .moveAbove(this.textView, -20)
            .alignHorizontalCenter(this.textView);

        this.instructionsLabel
            .sizeToFit()
            .moveBelow(this.textView, 10)
            .alignHorizontalCenter(this.textView);
    }
}
