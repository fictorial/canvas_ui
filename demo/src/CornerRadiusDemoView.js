import  BasicViewDemoView from './BasicViewDemoView';

export default class CornerRadiusDemoView extends BasicViewDemoView {
    constructor() {
        super('Corner Radius');

        this.aView.cornerRadius = 10;
        this.aView.borderWidth = 2;

        this.infoLabel.text = 'A view may have rounded corners';
        this.infoLabel.sizeToFit();
    }

    didBecomeVisible() {
        super.didBecomeVisible();

        this.timeout = setTimeout(() => {
            this.aView.cornerRadius = [ 0, 20, 0, 20 ];    // TL, TR, BR, BL;
        }, 2000);
    }

    didBecomeHidden() {
        super.didBecomeHidden();
        clearTimeout(this.timeout);
    }

    willBeRemovedFromView() {
        super.willBeRemovedFromView();
        clearTimeout(this.timeout);
    }
}
