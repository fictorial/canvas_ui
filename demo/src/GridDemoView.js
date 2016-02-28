import  DemoView from './DemoView';
import GridView from 'canvas_ui/GridView';
import ScrollView from 'canvas_ui/ScrollView';
import Button from 'canvas_ui/Button';
import Size from 'canvas_ui/Size';
import Point from 'canvas_ui/Point';

/**
 * Shows how scrollTo works
 */

export default class GridDemoView extends DemoView {
    constructor() {
        super('Scrolling');

        this.scrollView = new ScrollView();
        this.scrollView.backgroundColor = '#fee';
        this.scrollView.borderWidth = 1;
        this.scrollView.contentView.backgroundColor = '#def';
        this.scrollView.contentView.borderWidth = 1;
        this.scrollView.contentView.borderColor = 'rgba(0,0,255,0.5)';
        this.addSubview(this.scrollView);

        this.gridView = new GridView();
        this.gridView.backgroundColor = '#fff';
        this.scrollView.contentView.addSubview(this.gridView);

        this.scrollTop = new Button('Scroll to Top Left');
        this.addSubview(this.scrollTop);

        this.scrollBottom = new Button('Scroll to Bottom Right');
        this.addSubview(this.scrollBottom);

        this.scrollMiddle = new Button('Scroll to Center');
        this.addSubview(this.scrollMiddle);

        this.scrollTop.on('tap', () => this.scrollView.scrollTo(0, 0));

        this.scrollMiddle.on('tap', () => {
            this.scrollView.scrollTo(
                this.scrollView.contentSize.width/2 - this.scrollView.halfWidth,
                this.scrollView.contentSize.height/2 - this.scrollView.halfHeight);
        });

        this.scrollBottom.on('tap', () => {
            this.scrollView.scrollTo(
                this.scrollView.contentSize.width,
                this.scrollView.contentSize.height);
        });

        this.testButton = new Button('Change Grid Color');
        this.scrollView.contentView.addSubview(this.testButton);
        this.testButton.backgroundColor = 'orange';
        this.testButton.textColor = 'white';
        var colors = ['#f44', '#fa4', '#880', '#4a4', '#44f', '#f4a'],
            colorIndex = 0;
        this.testButton.on('tap', () => {
            this.gridView.majorLineColor = colors[colorIndex++ % colors.length];
            this.gridView.minorLineColor = colors[colorIndex++ % colors.length];
        });
    }

    layoutSubviews() {
        this.gridView.frame = this.contentFrame;

        this.scrollView.frame = this.bounds;
        this.scrollView.contentSize = new Size(this.width * 2, this.height * 2);

        this.gridView.frame = this.scrollView.contentView.bounds;

        this.scrollTop.sizeToFit().moveInTopLeftCorner(new Point(10, 10));
        this.scrollMiddle.sizeToFit().moveRightOf(this.scrollTop, 10).alignTop(this.scrollTop);
        this.scrollBottom.sizeToFit().moveRightOf(this.scrollMiddle, 10).alignTop(this.scrollTop);

        this.testButton.sizeToFit().moveToCenterMiddle();
    }
}
