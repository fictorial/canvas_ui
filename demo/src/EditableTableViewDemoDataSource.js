import  _ from 'lodash';
import TableViewDataSource from 'canvas_ui/TableViewDataSource';
import TableViewCell from 'canvas_ui/TableViewCell';

export default class EditableTableViewDemoDataSource extends TableViewDataSource {
    constructor() {
        super();

        this.items = _.map(_.range(20), i => {
            return {
                title: `Title # ${i}`,
                subtitle: `Subtitle # ${i}`
            };
        });
    }

    numberOfItems(/*tableView*/) {
        return this.items.length;
    }

    cellForItemAtIndex(tableView, index) {
        let item = this.items[index];

        let cell = new TableViewCell(tableView, index);
        cell.title = item.title;
        cell.subtitle = item.subtitle;
        return cell;
    }

    moveItem(tableView, fromIndex, toIndex) {
        if (fromIndex === toIndex) {
            return;
        }

        this.items.splice(toIndex, 0, this.items.splice(fromIndex, 1)[0]);
    }

    removeItemAtIndex(tableView, index) {
        this.items.splice(index, 1);
    }
}
