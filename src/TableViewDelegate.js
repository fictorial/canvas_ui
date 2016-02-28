/**
 * Helps manage a TableView.
 *
 * You don't strictly need to use a subclass of this of course.
 */

export default class TableViewDelegate {

    /**
     * Returns the height of the cell at the given index.
     *
     * By default this is 60.
     */

    heightForCellAtIndex(/*tableView, index*/) {
        return 60;
    }

    /**
     * The user tapped a cell at the given index;
     * semantically, the user selected an item.
     */

    didSelectItemAtIndex(/*tableView, index, cell*/) {
        // this.log(/*'selected item at index', index, cell.title*/);
    }

    /**
     * Is reordering allowed?
     */

    canMoveItem(/*tableView, fromIndex, toIndex*/) {
        return false;
    }

    /**
     * Is item removal allowed?
     */

    canRemoveItem(/*tableView, atIndex*/) {
        return false;
    }
}
