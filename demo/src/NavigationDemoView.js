import  DemoView from './DemoView';
import NavigationDemoLabelView from './NavigationDemoLabelView';
import NavigationStack from 'canvas_ui/NavigationStack';

export default class NavigationDemoView extends DemoView {
    constructor() {
        super('Navigation Demo');

        this.stack = new NavigationStack();
        this.addSubview(this.stack);

        this.stack.push(new NavigationDemoLabelView('View 1'));
    }

    layoutSubviews() {
        this.stack.frame = this.bounds;
    }
}
