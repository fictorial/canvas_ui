import  _ from 'lodash';
import ScrollView from './ScrollView';
import ActivityIndicatorView from './ActivityIndicatorView';
import Button from './Button';
import TableViewCell from './TableViewCell';
import {FadeOut} from './BasicAnimations';

/**
 * Displays a vertically scrollable list of cells which are views
 * that display a single "item" in the list.
 *
 * ## Data Source
 *
 * The source of items to display is a "data source".  See `TableViewDataSource`
 * for details.
 *
 * ## Delegate
 *
 * A table view may have a *delegate* which is consulted for various actions
 * (e.g. "can the user move this item from here to there?").  See `TableViewDelegate`
 * for details.
 *
 * ## Editing
 *
 * There is no separate edit mode for a table view. Items may be edited based on
 * what the delegate allows. Editing operations include reordering a single cell
 * and deleting/removing a single cell.
 *
 * ### Reordering/Moves
 *
 * Reordering a cell occurs when the user long-presses a cell, drags it to
 * another location, and the delegate allows the reordering/move.  Dragging a
 * table view cell to the top or the bottom of the table view causes the table
 * content to auto scroll by half the table view's height.
 *
 * ### Deletion/Removal
 *
 * Deletion/removal of a cell occurs when the user swipes left
 * on a cell to show a previously hidden delete button and then taps the delete
 * button. Scrolling more than a trivial amount vertically hides a delete
 * button (if any).
 *
 * ## Headers/Footers/Sections
 *
 * There is only one implicit section supported. The table view supports
 * an arbitrary header and footer view.
 *
 * ## Unsupported Features vis a vis iOS
 *
 * - sections
 * - pull to refresh
 * - partial reloads; full reloads only
 * - queue of reusable cells; we expect the data source to create TableViewCell objects
 *   on reload. When the content view is scrolled, those cells that are not inside the
 *   TableView's frame are .hidden while those that become visible are unhidden and laid out.
 *
 * ## Events
 *
 * - dataSourceLoadingStateChanged(isLoading)
 */

export default class TableView extends ScrollView {
    constructor(dataSource, delegate) {
        super();

        this._dataSource = dataSource;
        this._delegate = delegate;

        this._headerView = null;
        this._footerView = null;

        // Displayed while loading from data source.

        this._activityIndicator = new ActivityIndicatorView();
        this._activityIndicator.id = 'loadingIndicator';
        this._activityIndicator.backgroundColor = '#fff';
        this._activityIndicator.lineColor = '#aaa';
        this._activityIndicator.lineWidth = 2;
        this._activityIndicator.hidden = true;
        this.addSubview(this._activityIndicator);

        this._isLoading = false;
        this.reload();

        this._setupSwipeLeftToRemove();

        this.contentView.position.on('valueChanged', () => {
            _.each(this.contentView.subviews, subview => {
                if (subview instanceof TableViewCell) {
                    this._updateCellVisibility(subview);
                }
            });
        });
    }

    get dataSource() {
        return this._dataSource;
    }

    set dataSource(dataSource) {
        this._dataSource = dataSource;
        this.reload();
    }

    get delegate() {
        return this._delegate;
    }

    set delegate(delegate) {
        this._delegate = delegate;
        this.reload();
    }

    /**
     * Reload items from the data source.
     */

    reload(animated=true, complete=null) {
        let dataSource = this.dataSource,
            delegate = this.delegate;

        if (!dataSource || !delegate || this._isLoading) {
            return;
        }

        let cells = _.filter(this.contentView.subviews, subview => subview instanceof TableViewCell);
        _.each(cells, cell => cell.removeFromSuperview());

        this._isLoading = true;
        this.emit('dataSourceLoadingStateChanged', this._isLoading);

        this._activityIndicator.hidden = false;
        this._activityIndicator.animating = true;
        this.needsLayout = true;

        this.contentView.hidden = true;

        dataSource.load(this, () => {
            this._isLoading = false;
            this.emit('dataSourceLoadingStateChanged', this._isLoading);

            let n = dataSource.numberOfItems(this);

            var totalHeight = 0;

            for (var i = 0; i < n; ++i) {
                let cell = dataSource.cellForItemAtIndex(this, i);
                cell._index = i;
                cell._itemCount = n;
                this.contentView.addSubview(cell);

                let cellHeight = delegate.heightForCellAtIndex(i);
                cell.height = cellHeight;
                totalHeight += cellHeight;
            }

            this.contentView.height = totalHeight;
            this.needsLayout = true;

            this.contentView.hidden = false;

            this.scrollToRow(0, animated);

            if (_.isFunction(complete)) {
                complete();
            }
        });
    }

    // Layout the cells inside the content view.
    // Content views are just regular views.

    layoutSubviews() {
        let contentView = this.contentView;
        contentView.width = this.width;

        super.layoutSubviews();

        if (this._activityIndicator) {
            if (this._isLoading) {
                this._activityIndicator.size.set(30, 30);
                this._activityIndicator.moveToCenterMiddle();
                return;
            }

            this._activityIndicator.hidden = true;
        }

        let contentTop = contentView.contentTop,
            contentLeft = contentView.contentLeft,
            contentWidth = contentView.contentWidth,
            headerView = this._headerView,
            footerView = this._footerView,
            tableHeight = this.height;

        var y = contentTop;

        if (headerView) {
            headerView.frame.set(contentLeft, contentTop, contentWidth, headerView.height);
            y = headerView.bottom;
        }

        // NB: cells are in same order as data source items

        _.each(contentView.subviews, (cell/*, index*/) => {
            if (cell instanceof TableViewCell) {
                cell.frame.set(contentLeft, y, contentWidth, cell.height);  // triggers layout
                this._updateCellVisibility(cell, tableHeight);
                y += cell.height;
            }
        });

        if (footerView) {
            footerView.frame.set(contentLeft, y, contentWidth, footerView.height);
            y = footerView.bottom;
        }

        contentView.height = y;
    }

    _setupSwipeLeftToRemove() {
        var cellLeftStart,
            dragStartPoint,
            swipeCell;

        this.contentView.on('dragStarted', (tableViewPoint) => {
            let contentViewPoint = this.contentView.convertSuperviewToLocal(tableViewPoint),
                [overCell/*, overCellPoint*/] = this.contentView.hitTest(contentViewPoint);

            // TODO this wouldn't be too difficult to alter to support
            //      and arbitrary view served up by the table cell itself
            //      for multiple actions

            if (overCell &&
                overCell instanceof TableViewCell &&
                this._delegate &&
                _.isFunction(this._delegate.canRemoveItem) &&
                this._delegate.canRemoveItem(this, overCell._index)) {

                if (swipeCell) {
                    swipeCell.left = 0;
                }

                swipeCell = overCell;
                cellLeftStart = swipeCell.left;
                dragStartPoint = tableViewPoint.clone();

                let deleteButton = new Button('Delete');
                deleteButton.id = 'delete';
                deleteButton.backgroundColor = 'red';
                deleteButton.textColor = 'white';
                deleteButton.borderWidth = 0;
                deleteButton.cornerRadius = 0;
                deleteButton.shadowBlur = 0;
                deleteButton.offsetsOnTouch = false;
                deleteButton.sizeToFit();
                deleteButton.frame.set(swipeCell.right - deleteButton.width,
                    swipeCell.top, deleteButton.width, swipeCell.height);
                this.contentView.addSubview(deleteButton);
                this.contentView.moveToBack(deleteButton);
                deleteButton.on('tap', () => {
                    if (this._delegate &&
                        _.isFunction(this._delegate.canRemoveItem) &&
                        this._delegate.canRemoveItem(this, swipeCell._index)) {

                        this._dataSource.removeItemAtIndex(this, swipeCell._index);

                        deleteButton.removeFromSuperview();

                        swipeCell.left = 0;

                        swipeCell.showsSeparatorLine = false;
                        swipeCell.addAnimation(new FadeOut(swipeCell))
                            .once('complete', () => {
                                swipeCell.removeFromSuperview();
                                this.needsLayout = true;
                                this.needsDisplay = true;
                                //this.reload();
                            });
                    }
                });

                if (this.deleteButton) {
                    this.deleteButton.removeFromSuperview();
                }
                this.deleteButton = deleteButton;
            } else {
                swipeCell = null;
                dragStartPoint = null;
            }
        });

        this.contentView.on('dragUpdated', (tableViewPoint) => {
            let contentViewPoint = this.contentView.convertSuperviewToLocal(tableViewPoint);

            if (dragStartPoint) {
                var distanceDraggedHorizontally = tableViewPoint.x - dragStartPoint.x,
                    distanceDraggedVertically   = tableViewPoint.y - dragStartPoint.y;

                if (Math.abs(distanceDraggedVertically) > 30) {
                    if (swipeCell) {
                        swipeCell.left = 0;
                    }

                    if (this.deleteButton) {
                        this.deleteButton.removeFromSuperview();
                    }
                } else {
                    let [overCell/*, overCellPoint*/] = this.contentView.hitTest(contentViewPoint);

                    if (overCell && overCell === swipeCell) {
                        overCell.left = cellLeftStart + distanceDraggedHorizontally;
                        overCell.left = Math.max(-this.deleteButton.width, Math.min(0, overCell.left));
                    }
                }
            }
        });

        this.contentView.on('dragEnded', (/*tableViewPoint*/) => {
            if (swipeCell && swipeCell.left < 0 && this.deleteButton) {
                swipeCell.addAnimation({
                    name: 'showDeleteButtonFully',
                    target: swipeCell,
                    endValues: {left: -this.deleteButton.width},
                    duration: 200
                });
            }
        });
    }

    get headerView() {
        return this._headerView;
    }

    set headerView(view) {
        if (this._headerView) {
            this._headerView.removeFromSuperview();
        }

        this._headerView = view;
        this.contentView.addSubview(view);
    }

    get footerView() {
        return this._footerView;
    }

    set footerView(view) {
        if (this._footerView) {
            this._footerView.removeFromSuperview();
        }

        this._footerView = view;
        this.contentView.addSubview(view);
    }

    // Hide cells in the content view that are not within the frame of the table view.
    // Hidden views are not rendered and are ignored during layout as well as during
    // input handling. Thus, this is an optimization.

    _updateCellVisibility(cell, tableHeight) {
        tableHeight = tableHeight || this.height;

        // Cells are "in" the content view of this table view.
        // We need to know about the cell's top/bottom in the coordinate
        // system of the table view.

        let cellTop       = this.contentView.convertLocalToOther(cell.position, this).y,
            cellHeight    = cell.size._height,
            cellBottom    = cellTop + cellHeight,
            topVisible    = cellTop    >= 0 && cellTop    < tableHeight,
            bottomVisible = cellBottom >= 0 && cellBottom < tableHeight;

        cell.hidden = !topVisible && !bottomVisible;
    }

    scrollToRow(index, animated=true) {
        this.layoutIfNeeded();

        _.each(this.contentView.subviews, subview => {
            if (subview instanceof TableViewCell &&
                subview._index === index) {

                this.scrollTo(subview.left, subview.top, animated);
                return false;
            }
        });
    }
}
