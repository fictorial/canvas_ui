import  DemoView from './DemoView';
import SliderDemoView from './SliderDemoView';
import BorderDemoView from './BorderDemoView';
import ScrollableTextDemoView from './ScrollableTextDemoView';
import TabView from 'canvas_ui/TabView';

export default class TabDemoView extends DemoView {
    constructor() {
        super('Tabs');

        this.tabView = new TabView();
        this.addSubview(this.tabView);    // add before adding tabs
        this.tabView.addTab('Sliders', new SliderDemoView());
        this.tabView.addTab('Borders', new BorderDemoView());
        this.tabView.addTab('Word Wrapping', new ScrollableTextDemoView());
        this.tabView.activeIndex = 0;
    }

    layoutSubviews() {
        this.tabView.frame = this.bounds;
    }
}
