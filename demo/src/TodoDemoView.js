import  _ from 'lodash';
import DemoView from './DemoView';
import TableView from 'canvas_ui/TableView';
import TableViewCell from 'canvas_ui/TableViewCell';
import Button from 'canvas_ui/Button';
import {FingerSizePoints} from 'canvas_ui/magic';
import TextEditView from 'canvas_ui/TextEditView';
import KeyboardView from 'canvas_ui/KeyboardView';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';

class TextEditInTableViewCell extends TextEditView {
    stylizeAsNormal() {
        this.borderWidth = 0;
        this.insets.setAll(0);
    }
}

class TodoTableViewCell extends TableViewCell {
    constructor(tableView, index) {
        super(tableView, index);

        this._titleLabel.hidden = true;
        this._subtitleLabel.hidden = true;

        this.textEdit = new TextEditInTableViewCell();
        this.textEdit.userInteractionEnabled = false;
        this.textEdit.on('textChanged', () => {
            this.emit('itemUpdated', this._index, this.textEdit.text);
        });
        this.textEdit.on('enter', () => {
            this.textEdit.resignFirstResponder();
            this.emit('itemEditCompleted', this._index);
        });
        this.textEdit.on('didBecomeFirstResponder', () => {
            this._accessoryView.hidden = true;
        });
        this.textEdit.on('didResignFirstResponder', () => {
            this.textEdit.userInteractionEnabled = false;
            KeyboardView.instance().hide();
            if (this.textEdit.text.trim().length === 0) {
                this.emit('itemCompleted', this._index);
            } else {
                this._accessoryView.hidden = false;
                this.emit('itemEditCompleted', this._index);
            }
        });
        this.addSubview(this.textEdit);

        this._accessoryView.removeFromSuperview();
        this._accessoryView = new Button('✓');
        this._accessoryView.font = BoldSystemFontOfSize(22);
        this._accessoryView.borderWidth = 0;
        this._accessoryView.backgroundColor = 'red';
        this._accessoryView.textColor = 'white';
        this._accessoryView.id = 'accessory';
        this._accessoryView.size.set(FingerSizePoints, FingerSizePoints);
        this.addSubview(this._accessoryView);
        this._accessoryView.on('tap', () => {
            this.emit('itemCompleted', this._index);
        });
    }

    layoutSubviews() {
        super.layoutSubviews();
        this._accessoryView.size.set(FingerSizePoints, FingerSizePoints);
        this.textEdit.frame = this._titleLabel.frame;
    }
}

export default class TodoDemoView extends DemoView {
    constructor() {
        super('To Do List');

        this.items = ['Get eggs', 'Wash the car', 'Take trash out'];
        this.loadItems();

        this.tableView = new TableView(this, this);
        this.addSubview(this.tableView);
        this.tableView.on('tap', () => {
            // Take focus away from an item being edited.
            this.tableView.becomeFirstResponder();
        });

        this.tableView.on('keyPressed', (key) => {
            if (key === 'Enter') {
                this.addNewItem();
            }
        });

        let addButton = new Button('+ Add Item');
        addButton.textColor = '#333';
        addButton.cornerRadius = 0;
        addButton.borderWidth = 0;
        addButton.on('tap', this.addNewItem.bind(this));
        this.tableView.headerView = addButton;
    }

    wasAddedToView() {
        super.wasAddedToView();
        this.tableView.becomeFirstResponder();
    }

    loadItems() {
        if (localStorage) {
            try {
                if (localStorage.todoItems) {
                    this.items = JSON.parse(localStorage.todoItems);
                }
            } catch (e) {
                console.error('stored todo items are invalid:', e);
            }
        }
    }

    saveItems() {
        if (localStorage) {
            localStorage.todoItems = JSON.stringify(this.items);
        }
    }

    addNewItem() {
        this.items.push('');
        this.saveItems();
        this.tableView.reload(false, () => {
            let textEdit = _.last(this.tableView.contentView.subviews).textEdit;
            textEdit.userInteractionEnabled = true;
            textEdit.becomeFirstResponder();
            textEdit.moveToEnd();
        });
    }

    layoutSubviews() {
        super.layoutSubviews();
        this.tableView.headerView.height = FingerSizePoints;
        this.tableView.frame = this.bounds;
    }

    // Table view data source

    load(tableView, complete) {
        complete();
    }

    numberOfItems(/*tableView*/) {
        return this.items.length;
    }

    cellForItemAtIndex(tableView, index) {
        let item = this.items[index];

        let cell = new TodoTableViewCell(tableView, index);
        cell.textEdit.text = item;

        cell.on('itemUpdated', (index, item) => {
            this.items[index] = item;
            this.saveItems();
        });

        cell.on('itemCompleted', (index) => {
            this.removeItemAtIndex(tableView, index);
            tableView.reload(false);
        });

        cell.on('itemEditCompleted', (/*index*/) => {
            this.addNewItem();
        });

        return cell;
    }

    moveItem(tableView, fromIndex, toIndex) {
        if (fromIndex === toIndex) {
            return;
        }

        this.items.splice(toIndex, 0, this.items.splice(fromIndex, 1)[0]);
        this.saveItems();
    }

    removeItemAtIndex(tableView, index) {
        this.items.splice(index, 1);
        this.saveItems();
    }

    // Table view delegate

    heightForCellAtIndex(/*tableView, index*/) {
        return Math.round(FingerSizePoints * 1.5);
    }

    didSelectItemAtIndex(tableView, index, cell) {
        cell.textEdit.userInteractionEnabled = true;
        cell.textEdit.becomeFirstResponder();
        cell.textEdit.moveToEnd();
    }

    canMoveItem(/*tableView, fromIndex, toIndex*/) {
        return true;
    }

    canRemoveItem(/*tableView, atIndex*/) {
        return true;
    }
}
