import  DemoView from './DemoView';
import EditableTableViewDemoDataSource from './EditableTableViewDemoDataSource';
import TableView from 'canvas_ui/TableView';
import TextView from 'canvas_ui/TextView';
import Label from 'canvas_ui/Label';
import {SystemFontOfSize} from 'canvas_ui/fonts';

export default class EditableTableViewDemoView extends DemoView {
    constructor() {
        super('Editable Table View');

        this.tableView = new TableView(new EditableTableViewDemoDataSource(), this);
        this.addSubview(this.tableView);

        let headerView = new TextView('Drag to scroll.\nSwipe left to delete.\nLong press to reorder.');
        headerView.backgroundColor = '#eee';
        headerView.insets.setAll(10);
        headerView.font = SystemFontOfSize(9);
        headerView.textColor = '#777';
        headerView.textAlign = 'center';
        headerView.height = 65;
        this.tableView.headerView = headerView;

        let footerView = new Label('I am a footer. Whee!');
        footerView.font = SystemFontOfSize(9);
        footerView.textColor = '#aaa';
        footerView.textAlign = 'center';
        footerView.height = 60;
        this.tableView.footerView = footerView;
    }

    layoutSubviews() {
        this.tableView.frame = this.bounds;
    }

    heightForCellAtIndex(/*tableView, index*/) {
        return 60;
    }

    canMoveItem(/*tableView, fromIndex, toIndex*/) {
        return true;
    }

    canRemoveItem(/*tableView, atIndex*/) {
        return true;
    }

    wasAddedToView() {
        super.wasAddedToView();
        this.tableView.scrollToRow(0);
    }
}
