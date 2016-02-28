import  DemoView from './DemoView';
import DemoPageView from './DemoPageView';
import ScrollView from 'canvas_ui/ScrollView';

export default class PagingDemoView extends DemoView {
    constructor(title) {
        super(title);

        this.scrollView = new ScrollView();
        this.scrollView.pagingEnabled = true;
        this.scrollView.autoPagingEnabled = true;
        this.addSubview(this.scrollView);

        this.scrollView.contentView.addSubview(new DemoPageView('Page 1', 'red'));
        this.scrollView.contentView.addSubview(new DemoPageView('Page 2', 'blue'));
        this.scrollView.contentView.addSubview(new DemoPageView('Page 3', 'green'));
    }

    layoutSubviews() {
        super.layoutSubviews();
        this.scrollView.frame = this.bounds;
        this.layoutPages();
    }

    wasAddedToView() {
        super.wasAddedToView();
        this.scrollView.becomeFirstResponder();
    }

    layoutPages() {
        // Override me.
    }
}
