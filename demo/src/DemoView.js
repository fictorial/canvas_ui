import  View from 'canvas_ui/View';

export default class DemoView extends View {
    constructor(title) {
        super();

        this.title = title;
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.frame = this.superview.contentFrame;
    }
}
