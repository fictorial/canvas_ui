import  _ from 'lodash';
import View from './View';
import TextEditView from './TextEditView';
import TableView from './TableView';
import TableViewCell from 'canvas_ui/TableViewCell';
import Button from './Button';
import KeyboardView from './KeyboardView';
import {FingerSizePoints} from './magic';
import Point from './Point';

/**
 * A search text input view that filters the results of
 * a table's data source to only show those that match
 * a predicate.
 *
 * The default predicate simply does a case-insensitive search
 * on the title or subtitle of the cells of the target table view.
 *
 * Predicate function should return `{title, subtitle, image}`
 * for a match or `null` for a non-match.
 *
 * Events:
 * - searchBegin: the results table will be shown so here's a good
 *   time to make this view tall enough
 * - searchEnd: the results table will be hidden...
 * - cellSelected(index, cell)
 */

export default class TableSearchView extends View {
    constructor(tableView, searchPredicate) {
        super();

        this._matchingItems = [];
        this._tableView = tableView;

        this.insets.setAll(10);

        this._searchField = new TextEditView();
        this._searchField.id = 'searchField';
        this._searchField.placeholderLabel.text = 'Search';
        this._searchField.on('enter', this._performSearch.bind(this));
        this._searchField.on('textChanged', this._performSearch.bind(this));
        this._searchField.on('didBecomeFirstResponder', () => {
            this._matchingItemsTableView.hidden = false;
            this._cancelButton.hidden = false;
            this.emit('searchBegin');
            this._performSearch();
        });
        this._searchField.on('didResignFirstResponder', () => {
            this._matchingItems = [];
            this._matchingItemsTableView.hidden = true;
            this._cancelButton.hidden = true;
            this._searchField.text = null;

            let kbd = KeyboardView.instance(false);
            if (kbd) {
                kbd.hide();
            }

            this.emit('searchEnd');
        });
        this.addSubview(this._searchField);

        this._cancelButton = new Button('Cancel');
        this._cancelButton.id = 'cancelButton';
        this._cancelButton.hidden = true;
        this._cancelButton.on('tap', () => {
            this._searchField.resignFirstResponder();
        });
        this.addSubview(this._cancelButton);

        this._matchingItemsTableView = new TableView(this, this);
        this._matchingItemsTableView.id = 'matchingItems';
        this._matchingItemsTableView.hidden = true;
        this.addSubview(this._matchingItemsTableView);

        if (_.isFunction(searchPredicate)) {
            this._searchPredicate = searchPredicate;
        } else {
            this._searchPredicate = (searchText, sourceCells) => {
                let textLower = searchText.toLowerCase();
                return _.filter(sourceCells, cell => {
                    if (cell.title.toLowerCase().indexOf(textLower) !== -1 ||
                        cell.subtitle.toLowerCase().indexOf(textLower) !== -1) {
                        return {title: cell.title, subtitle:cell.subtitle};
                    }
                    return null;
                });
            };
        }

        KeyboardView.eventEmitter.on('changedVisibility', (/*keyboardHidden*/) => {
            this.needsLayout = true;
            this.needsDisplay = true;
        });
    }

    get searchPredicate() {
        return this._searchPredicate;
    }

    set searchPredicate(pred) {
        if (_.isFunction(pred)) {
            this._searchPredicate = pred;
            this._performSearch();
        }
    }

    layoutSubviews() {
        super.layoutSubviews();

        let margin = 10;

        this._cancelButton.sizeToFit()
            .position.set(this.contentRight - this._cancelButton.width, this.contentTop);

        if (this._cancelButton.hidden) {
            this._searchField.frame.set(this.contentLeft, this.contentTop,
                this._cancelButton.right - this.contentLeft, FingerSizePoints);
        } else {
            this._searchField.width = this._cancelButton.left - this.contentLeft - margin;
            this._searchField.moveLeftOf(this._cancelButton, -margin)
                .alignTop(this._cancelButton)
                .makeSameHeight(this._cancelButton);
        }

        this._matchingItemsTableView.frame.copy(this._tableView.frame);

        // check if keyboard is visible and reduce height
        let matchingItemsTableBottom = this._matchingItemsTableView.convertLocalToRoot(
            new Point(0, this._matchingItemsTableView.height)).y,
            kbd = KeyboardView.instance(false);

        if (kbd && !kbd.hidden) {
            let delta = matchingItemsTableBottom + margin - kbd.top;
            if (delta > 0) {
                this._matchingItemsTableView.height -= delta;
            }
        }
    }

    _performSearch() {
        let searchText = this._searchField.text.trim(),
            sourceCells = _.filter(this._tableView.contentView.subviews,
                subview => subview instanceof TableViewCell),
            matchingItems = searchText.length ? _.filter(
                this._searchPredicate(searchText, sourceCells) || [],
                result => result !== null) : [];

        if (_.isArray(matchingItems)) {
            this._matchingItems = matchingItems;
            this._matchingItemsTableView.reload();
        }
    }

    // TableViewDataSource

    load(tableView, complete) {
        if (_.isFunction(complete)) {
            complete();
        }
    }

    numberOfItems(/*tableView*/) {
        return this._matchingItems.length;
    }

    cellForItemAtIndex(tableView, index) {
        let matchResult = this._matchingItems[index];
        if (matchResult) {
            let cell = new TableViewCell(tableView, index);
            cell.title = matchResult.title;
            cell.subtitle = matchResult.subtitle;
            cell.highlightsOnTouch = true;
            cell.image = matchResult.image;
            return cell;
        }
    }

    // TableViewDelegate

    didSelectItemAtIndex(tableView, index, cell) {
        this.emit('cellSelected', index, cell);
        this._searchField.resignFirstResponder();
    }

    heightForCellAtIndex(/*tableView, index*/) {
        return 60;
    }
}
