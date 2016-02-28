import  DemoView from './DemoView';
import View from 'canvas_ui/View';
import Label from 'canvas_ui/Label';
import Button from 'canvas_ui/Button';
import Point from 'canvas_ui/Point';
import {FingerSizePoints} from 'canvas_ui/magic';

export default class HitTestDemoView extends DemoView {
    constructor() {
        super('Hit Testing and Hiding');

        this.outerView = new View();
        this.outerView.backgroundColor = '#78aafd';
        this.outerView.userInteractionEnabled = true;
        this.outerView.on('tap', () => {
            this.infoLabel.text = 'Tapped outer view';
            this.selectedView = this.outerView;
        });
        this.addSubview(this.outerView);

        this._selectedView = null;

        this.innerView = new View();
        this.innerView.backgroundColor = '#0078fd';
        this.outerView.addSubview(this.innerView);
        this.innerView.userInteractionEnabled = true;
        this.innerView.on('tap', () => {
            this.infoLabel.text = 'Tapped inner view 1';
            this.selectedView = this.innerView;
        });

        this.innerView2 = new View();
        this.innerView2.backgroundColor = '#78fd00';
        this.outerView.addSubview(this.innerView2);
        this.innerView2.userInteractionEnabled = true;
        this.innerView2.on('tap', () => {
            this.infoLabel.text = 'Tapped inner view 2';
            this.selectedView = this.innerView2;
        });

        this.infoLabel = new Label();
        this.addSubview(this.infoLabel);

        this.hideSelectedButton = new Button('Toggle Hidden State');
        this.addSubview(this.hideSelectedButton);
        this.hideSelectedButton.hidden = true;
        this.hideSelectedButton.on('tap', () => {
            this._selectedView.hidden = !this._selectedView.hidden;
        });

        this.resetButton = new Button('Reset');
        this.addSubview(this.resetButton);
        this.resetButton.on('tap', () => {
            this.outerView.hidden = this.innerView.hidden = this.innerView2.hidden = false;
            this.infoLabel.text = null;
            this.selectedView = null;
            this.hideSelectedButton.hidden = true;
            this.resetButton.hidden = true;
        });
        this.resetButton.hidden = true;
    }

    get selectedView() {
        return this._selectedView;
    }

    set selectedView(selectedView) {
        if (this._selectedView) {
            this._selectedView.borderWidth = 0;
        }

        this._selectedView = selectedView;

        if (this._selectedView) {
            this._selectedView.borderWidth = 1;
            this.hideSelectedButton.hidden = false;
            this.resetButton.hidden = false;
        }
    }

    layoutSubviews() {
        this.outerView.frame.set(20, 20, this.width/2, this.height/4);

        this.innerView.size.set(100, 100);
        this.innerView.moveInTopLeftCorner(new Point(20, 20));

        this.innerView2.size.set(100, 100);
        this.innerView2.moveBelow(this.innerView, -40)
            .alignHorizontalCenter(this.innerView, 50);

        this.infoLabel.moveBelow(this.outerView)
            .alignLeft(this.outerView).
            makeSameWidth(this.outerView);
        this.infoLabel.height = FingerSizePoints;

        this.hideSelectedButton.sizeToFit()
            .moveBelow(this.infoLabel)
            .alignLeft(this.infoLabel);

        this.resetButton.sizeToFit()
            .moveBelow(this.hideSelectedButton, 10)
            .alignLeft(this.infoLabel);
    }
}
