import  _ from 'lodash';
import DemoView from './DemoView';
import Label from 'canvas_ui/Label';

export default class LabelAlignmentDemoView extends DemoView {
    constructor() {
        super('Label Text Alignment');

        this.labelTL = new Label('Top Left');
        this.labelTL.textAlign = 'left';
        this.labelTL.textBaseline = 'top';
        this.addSubview(this.labelTL);

        this.labelTC = new Label('Top Center');
        this.labelTC.textAlign = 'center';
        this.labelTC.textBaseline = 'top';
        this.addSubview(this.labelTC);

        this.labelTR = new Label('Top Right');
        this.labelTR.textAlign = 'right';
        this.labelTR.textBaseline = 'top';
        this.addSubview(this.labelTR);

        this.labelMR = new Label('Middle Right');
        this.labelMR.textAlign = 'right';
        this.labelMR.textBaseline = 'middle';
        this.addSubview(this.labelMR);

        this.labelBR = new Label('Bottom Right');
        this.labelBR.textAlign = 'right';
        this.labelBR.textBaseline = 'bottom';
        this.addSubview(this.labelBR);

        this.labelBC = new Label('Bottom Center');
        this.labelBC.textAlign = 'center';
        this.labelBC.textBaseline = 'bottom';
        this.addSubview(this.labelBC);

        this.labelBL = new Label('Bottom Left');
        this.labelBL.textAlign = 'left';
        this.labelBL.textBaseline = 'bottom';
        this.addSubview(this.labelBL);

        this.labelML = new Label('Middle Left');
        this.labelML.textAlign = 'left';
        this.labelML.textBaseline = 'middle';
        this.addSubview(this.labelML);

        _.each(this.subviews, lbl => {
            lbl.borderWidth = 1;
            lbl.borderColor = '#f00';
            lbl.insets.setAll(5);
        });
    }

    layoutSubviews() {
        let labelW = this.width / 4,
            labelH = this.height / 4;

        _.each(this.subviews, lbl => {
            lbl.size.set(labelW, labelH);
        });

        let margin = 10;

        this.labelTL.moveInTopLeftCorner({x:margin, y:margin});
        this.labelTR.moveInTopRightCorner({x:-margin, y:margin});
        this.labelBR.moveInBottomRightCorner({x:-margin, y:-margin});
        this.labelBL.moveInBottomLeftCorner({x:margin, y:-margin});

        this.labelTC.moveToCenterMiddle().alignTop(this.labelTL);
        this.labelBC.moveToCenterMiddle().alignBottom(this.labelBL);
        this.labelML.moveToCenterMiddle().alignLeft(this.labelBL);
        this.labelMR.moveToCenterMiddle().alignRight(this.labelBR);
    }
}
