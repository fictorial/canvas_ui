import  DragAndDropBaseDemoView from './DragAndDropBaseDemoView';

export default class DragAndDropConstraintDemoView extends DragAndDropBaseDemoView {
    constructor() {
        super('Drag - Horiz. Constraint');

        var topAtDragStart;
        this.redDraggable.on('dragStarted', () => { topAtDragStart = this.redDraggable.top; });
        this.redDraggable.on('dragUpdated', () => { this.redDraggable.top = topAtDragStart; });
    }
}
