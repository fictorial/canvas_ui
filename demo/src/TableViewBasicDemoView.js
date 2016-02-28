import  DemoView from './DemoView';
import TableViewBasicDemoDataSource from './TableViewBasicDemoDataSource';
import TableView from 'canvas_ui/TableView';
import TableViewCell from 'canvas_ui/TableViewCell';

export default class TableViewBasicDemoView extends DemoView {
    constructor() {
        super('Table View');

        this.tableView = new TableView(new TableViewBasicDemoDataSource(), this);
        this.addSubview(this.tableView);
    }

    layoutSubviews() {
        this.tableView.frame = this.bounds;
    }

    heightForCellAtIndex(/*tableView, index*/) {
        return 80;
    }

    didSelectItemAtIndex(tableView, index, cell) {
        cell.accessoryType = cell.accessoryType === TableViewCell.AccessoryTypeCheck ?
            TableViewCell.AccessoryTypeNone :
            TableViewCell.AccessoryTypeCheck;
    }
}
