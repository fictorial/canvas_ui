import  TableViewCell from 'canvas_ui/TableViewCell';
import TableViewDataSource from 'canvas_ui/TableViewDataSource';

export default class TableViewBasicDemoDataSource extends TableViewDataSource {
    constructor() {
        super();

        this.cellImage = new Image();
        this.cellImage.src = 'assets/smiley.png';
    }

    numberOfItems(/*tableView*/) {
        return 40;
    }

    cellForItemAtIndex(tableView, index) {
        let cell = new TableViewCell(tableView, index);
        cell.title = `Title # ${index}`;
        cell.subtitle = `Subtitle # ${index}`;
        cell.image = this.cellImage;
        return cell;
    }
}
