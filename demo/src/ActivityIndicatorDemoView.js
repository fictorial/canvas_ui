import  DemoView from './DemoView';
import ActivityIndicatorView from 'canvas_ui/ActivityIndicatorView';
import Frame from 'canvas_ui/Frame';

export default class ActivityIndicatorDemoView extends DemoView {
    constructor() {
        super('Activity Indicators');

        this.lightActivityIndicator = new ActivityIndicatorView();
        this.lightActivityIndicator.backgroundColor = '#fff';
        this.lightActivityIndicator.lineColor = '#000';
        this.lightActivityIndicator.lineWidth = 2;
        this.addSubview(this.lightActivityIndicator);

        this.darkActivityIndicator = new ActivityIndicatorView();
        this.darkActivityIndicator.backgroundColor = '#000';
        this.darkActivityIndicator.lineColor = '#fff';
        this.darkActivityIndicator.lineWidth = 2;
        this.addSubview(this.darkActivityIndicator);
    }

    layoutSubviews() {
        let ActivityIndicatorSize = 40;

        this.lightActivityIndicator.frame = Frame.makeFrame(0, 0, ActivityIndicatorSize, ActivityIndicatorSize);
        this.lightActivityIndicator.moveToCenterMiddle();

        this.darkActivityIndicator
            .makeSameSize(this.lightActivityIndicator)
            .moveBelow(this.lightActivityIndicator, 10)
            .alignLeft(this.lightActivityIndicator)
            .insets.setAll(Math.round(this.darkActivityIndicator.contentWidth * 0.2));
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.lightActivityIndicator.animating = true;
        this.darkActivityIndicator.animating = true;
    }
}
