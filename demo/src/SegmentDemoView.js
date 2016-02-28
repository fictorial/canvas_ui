import  DemoView from './DemoView';
import View from 'canvas_ui/View';
import SegmentView from 'canvas_ui/SegmentView';
import Button from 'canvas_ui/Button';
import Point from 'canvas_ui/Point';
import Label from 'canvas_ui/Label';
import {FingerSizePoints} from 'canvas_ui/magic';
import Animation from 'canvas_ui/Animation';

export default class SegmentDemoView extends DemoView {
    constructor() {
        super('Segment/Choices');

        this.aView = new View();
        this.aView.borderWidth = 1;
        this.addSubview(this.aView);

        this.segmentView = new SegmentView();
        this.segmentView.textColor = '#00f';
        this.segmentView.borderWidth = 2;
        this.segmentView.cornerRadius = 10;
        this.segmentView.backgroundColor = '#fff';
        this.segmentView.choices = ['White', 'Black', 'Red', 'Green', 'Blue', 'Cyan'];
        this.segmentView.selectedIndex = 0;
        this.segmentView.on('selectionChanged', (index, text) => {
            this.segmentView.userInteractionEnabled = false;

            this.aView.backgroundColor = text.toLowerCase();

            this.aView.addAnimation({
                name: 'attention',
                target: this.aView,
                endValues: { angle: Math.PI/8 },
                startDelay: 100,
                autoReverse: true,
                playCount: 2,
                easing: Animation.easing.backEnd
            }).once('complete', () => {
                this.segmentView.userInteractionEnabled = true;
            });
        });
        this.addSubview(this.segmentView);

        this.choiceSizeMethod = 'uniform';

        this.uniformButton = new Button('Uniform');
        this.addSubview(this.uniformButton);
        this.uniformButton.on('tap', () => {
            this.choiceSizeMethod = 'uniform';
            this.needsLayout = true;
        });

        this.uniformWidestButton = new Button('Uniform Widest');
        this.addSubview(this.uniformWidestButton);
        this.uniformWidestButton.on('tap', () => {
            this.choiceSizeMethod = 'uniformWidest';
            this.needsLayout = true;
        });

        this.varyingButton = new Button('Varying');
        this.addSubview(this.varyingButton);
        this.varyingButton.on('tap', () => {
            this.choiceSizeMethod = 'varying';
            this.needsLayout = true;
        });

        this.infoLabel = new Label();
        this.addSubview(this.infoLabel);
    }

    layoutSubviews() {
        // Try resizing the container view (or test in a browser and resize its window)
        // to shrink the segment view and see what happens to the text of each choice.

        switch (this.choiceSizeMethod) {
        case 'uniform':
            this.segmentView.size.set(Math.max(100, this.width - 100), FingerSizePoints);
            this.segmentView.sizeChoicesUniform();

            this.infoLabel.text = 'Choice width = segment width / N. Try resizing window...';
            break;

        case 'uniformWidest':
            this.segmentView.sizeChoicesUniformWidest().sizeToFit();
            this.infoLabel.text = 'Choice width = width of widest choice';
            break;

        case 'varying':
            this.segmentView.sizeChoicesVarying().sizeToFit();
            this.infoLabel.text = 'Choice width = own width';
            break;
        }

        this.segmentView.moveToCenterMiddle();

        this.uniformButton
            .sizeToFit()
            .moveInBottomLeftCorner(new Point(10, -10));

        this.uniformWidestButton
            .sizeToFit()
            .moveRightOf(this.uniformButton, 10)
            .alignTop(this.uniformButton);

        this.varyingButton
            .sizeToFit()
            .moveRightOf(this.uniformWidestButton, 10)
            .alignTop(this.uniformButton);

        this.infoLabel
            .sizeToFit()
            .moveAbove(this.uniformButton, -10)
            .alignLeft(this.uniformButton);

        this.infoLabel.width = Math.min(this.contentWidth,
                                        this.infoLabel.width);

        this.aView.size.set(FingerSizePoints, FingerSizePoints);

        this.aView
            .moveBelow(this.segmentView, FingerSizePoints)
            .alignHorizontalCenter(this.segmentView);
    }
}
