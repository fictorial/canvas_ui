import  View from 'canvas_ui/View';

export default class DraggableDemoView extends View {
    constructor(color) {
        super();

        this.backgroundColor = color;
        this.draggable = true;
    }
}
