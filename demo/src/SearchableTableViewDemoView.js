import  DemoView from './DemoView';
import TableViewBasicDemoDataSource from './TableViewBasicDemoDataSource';
import TableView from 'canvas_ui/TableView';
import TableSearchView from 'canvas_ui/TableSearchView';
import NotificationView from 'canvas_ui/NotificationView';
import {FingerSizePoints} from 'canvas_ui/magic';

export default class SearchableTableViewDemoView extends DemoView {
    constructor() {
        super('Searchable Table');

        this.tableView = new TableView(new TableViewBasicDemoDataSource(), this);
        this.addSubview(this.tableView);

        this.searchView = new TableSearchView(this.tableView);
        this.addSubview(this.searchView);

        this.searchView.backgroundColor = '#ddd';

        this.searchActive = false;

        this.searchView.on('searchBegin', () => {
            this.searchActive = true;
            this.searchView.height = this.height;
        });

        this.shortSearchViewHeight = FingerSizePoints +
            this.searchView.insets.top + this.searchView.insets.bottom;

        this.searchView.on('searchEnd', () => {
            this.searchActive = false;
            this.searchView.height = this.shortSearchViewHeight;
        });

        this.searchView.on('cellSelected', (index, cell) => {
            let notification = new NotificationView(`You selected ${cell.title}`, 'info');
            this.rootView.addSubview(notification);
        });
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.searchView.frame.set(this.contentLeft, this.contentTop, this.contentWidth,
            this.searchActive ? this.height : this.shortSearchViewHeight);

        this.tableView.frame.set(this.contentLeft, this.shortSearchViewHeight,
            this.contentWidth, this.height - this.shortSearchViewHeight);
    }

    heightForCellAtIndex(/*tableView, index*/) {
        return 60;
    }
}
