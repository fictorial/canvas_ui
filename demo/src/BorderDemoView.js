import  BasicViewDemoView from './BasicViewDemoView';

export default class BorderDemoView extends BasicViewDemoView {
    constructor() {
        super('Borders');
    }

    didBecomeVisible() {
        super.didBecomeVisible();

        this.aView.borderWidth = 1;
        this.aView.borderColor = '#333';

        this.infoLabel.text = 'A view may have a border...';
        this.infoLabel.sizeToFit();

        this.timeout = setTimeout(() => {
            this.infoLabel.text = 'with width and color.';
            this.infoLabel.sizeToFit();

            this.aView.borderWidth = 3;
            this.aView.borderColor = 'red';
        }, 1200);
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
