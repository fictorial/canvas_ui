import  _ from 'lodash';
import TableViewCell from './TableViewCell';

/**
 * Provider of data for a TableView.
 *
 * You don't strictly need to use a subclass of this of course.
 */

export default class TableViewDataSource {

    /**
     * Load items. When done, calls `complete`.
     */

    load(tableView, complete) {
        if (_.isFunction(complete)) {
            complete();
        }
    }

    /**
     * Returns the number of items in the collection.
     */

    numberOfItems(/*tableView*/) {
        return 0;
    }

    /**
     * Creates, configures, and returns a table view cell with data for the
     * item at the given index.
     */

    cellForItemAtIndex(tableView, index) {
        let cell = new TableViewCell(tableView, index);
        cell.title = 'No data';
        cell.subtitle = 'No data';
        cell.image = null;
        cell.accessoryType = TableViewCell.AccessoryTypeNone;
        return cell;
    }

    /**
     * Move the item at `fromIndex` to `toIndex`, shifting all items
     * at and after `toIndex` back by 1.
     *
     * Optional; if not found on data source, item reordering is disabled.
     */

    moveItem(/*tableView, fromIndex, toIndex*/) {
    }

    /**
     * Remove the item at `index`
     *
     * Optional; if not found on data source, item removal is disabled.
     */

    removeItemAtIndex(/*tableView, index*/) {
    }
}
