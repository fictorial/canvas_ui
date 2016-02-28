import  DemoView from './DemoView';
import DraggableDemoView from './DraggableDemoView';

/**
 * Drag red square wherever.
 */

export default class DragAndDropBaseDemoView extends DemoView {
    constructor(title) {
        super(title || 'Draggable');

        this.redDraggable = new DraggableDemoView('red');
        this.redDraggable.id = 'red-draggable';
        this.addSubview(this.redDraggable);
    }

    layoutSubviews() {
        this.redDraggable.size.set(100, 100);
        this.redDraggable.moveToCenterMiddle();
        this.redDraggable.needsLayout = false;
        this.needsLayout = false;
    }
}
