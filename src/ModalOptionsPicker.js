import _ from 'lodash';

import ModalView from './ModalView';
import TableView from './TableView';
import TableViewCell from './TableViewCell';
import {FingerSizePoints} from './magic';
import {setPropertyRecursive} from './util';
import {BoldSystemFontOfSize} from './fonts';
import Label from './Label';

/**
 * Displays a list of options in a table view inside a modal view.
 * User picks one by selecting one of the rows of the table and the
 * modal view closes itself after emitting a `itemSelected` event.
 */

export default class ModalOptionsPicker extends ModalView {
    /**
     * options = [{name, value}]
     */
    constructor(title, options, selectedIndex) {
        super();

        this.insets.setAll(10);

        this.options = options;
        this.selectedIndex = selectedIndex;

        this.titleLabel = new Label(title);
        this.titleLabel.textAlign = 'center';
        this.titleLabel.font = BoldSystemFontOfSize(14);
        this.titleLabel.textColor = '#333';
        this.addSubview(this.titleLabel);

        this.tableView = new TableView(this, this);
        this.addSubview(this.tableView);
    }

    load(tableView, complete) {
        if (_.isFunction(complete)) {
            complete();
        }
    }

    wasAddedToView() {
        super.wasAddedToView();

        this.size.set(Math.min(this.superview.width * 0.6, 720),
                      Math.min(this.superview.height * 0.8,
                               this.options.length * FingerSizePoints + 20) +
                                   this.insets.top + this.insets.bottom);

    }

    layoutSubviews() {
        super.layoutSubviews();

        this.titleLabel.sizeToFit().frame.set(this.contentLeft,
                                              this.contentTop,
                                              this.contentWidth,
                                              this.titleLabel.height);

        this.tableView.frame.set(this.contentLeft,
                                 this.titleLabel.bottom,
                                 this.contentWidth,
                                 this.contentHeight - this.titleLabel.bottom);

        setPropertyRecursive(this, 'backgroundColor', '#fff');
    }

    numberOfItems() {
        return this.options.length;
    }

    heightForCellAtIndex(/*tableView, index*/) {
        return FingerSizePoints;
    }

    cellForItemAtIndex(tableView, index) {
        let cell = new TableViewCell(tableView, index);
        cell.title = this.options[index].name;
        cell.insets.setAll(0);
        setPropertyRecursive(cell, 'backgroundColor', '#fff');
        cell.accessoryType = index === this.selectedIndex ?
            TableViewCell.AccessoryTypeCheck :
            TableViewCell.AccessoryTypeNone;
        return cell;
    }

    didSelectItemAtIndex(tableView, index/*, cell*/) {
        this.selectedIndex = index;
        this.tableView.reload();
        setTimeout(() => {
            this.emit('itemSelected', index, this.options[index].value);
            this.removeFromSuperview();
        }, 400);
    }
}
