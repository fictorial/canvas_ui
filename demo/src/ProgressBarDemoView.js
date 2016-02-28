import  DemoView from './DemoView';
import ProgressBar from 'canvas_ui/ProgressBar';

export default class ProgressBarDemoView extends DemoView {
    constructor() {
        super('Progress Bars');

        this.progressBarH = new ProgressBar();
        this.progressBarH.backgroundColor = '#eee';
        this.progressBarH.cornerRadius = 3;
        this.addSubview(this.progressBarH);

        this.progressBarV = new ProgressBar();
        this.progressBarV.horizontal = false;
        this.progressBarV.barColor = '#00f';
        this.progressBarV.backgroundColor = '#eee';
        this.progressBarV.cornerRadius = 3;
        this.addSubview(this.progressBarV);
    }

    wasAddedToView() {
        super.wasAddedToView();

        let self = this;

        this.progressBarH.addAnimation({
            name: 'progress',
            target: {progress: 0},
            endValues: {progress: 1},
            duration: 2000,
            playCount: Infinity,
            autoReverse: true
        }).on('update', function () {
            self.progressBarH.progress = self.progressBarV.progress = this.target.progress;
        });
    }

    layoutSubviews() {
        this.progressBarH.size.set(this.width/2, 8);
        this.progressBarV.size.set(8, this.height/2);

        this.progressBarH.moveInTopLeftCorner({x:20, y:20});
        this.progressBarV.moveInBottomRightCorner({x:-20, y:-20});
    }
}
