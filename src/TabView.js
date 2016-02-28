import  _ from 'lodash';
import View from './View';
import Button from './Button';
import {SystemFontOfSize, BoldSystemFontOfSize} from 'canvas_ui/fonts';

/**
 * A view which shows one of potentially many subviews.
 * Switching between views is achieved by tapping a tab at the top
 * of the view. There's one tab button per tab and each has a
 * textual label.
 */

// TODO - tabs on bottom as option
// TODO - scroll horizontally when many tabs present

export default class TabView extends View {
    constructor() {
        super();

        this.insets.top = 10;
        this.backgroundColor = '#fff';

        this.contentView = new View();
        this.contentView.id = 'tabContentView';
        this.addSubview(this.contentView);

        this._tabs = [];
        this._activeIndex = -1;

        this._tabButtonMargin = 8;
        this._tabButtonCornerRadius = 5;

        this._activeBackgroundColor = '#fff';
        this._activeFont = BoldSystemFontOfSize(14);
        this._activeTextColor = '#000';

        this._inactiveBackgroundColor = '#eee';
        this._inactiveFont = SystemFontOfSize(14);
        this._inactiveTextColor = '#aaa';

        this._separatorColor = '#666';
        this._separatorLineWidth = 1;
    }

    addTab(title, view) {
        let button = new Button(title);
        button.id = `tabButton${this._tabs.length}`;
        button.shadowBlur = 0;
        button.cornerRadius = [this._tabButtonCornerRadius, this._tabButtonCornerRadius, 0, 0];
        button.borderWidth = this._separatorLineWidth;
        button.borderColor = this._separatorColor;
        button.on('tap', () => {
            this.activeIndex = _.findIndex(this._tabs, tab => {
                return tab.button === button;
            });
        });
        this.addSubview(button);

        this.contentView.addSubview(view);
        this.bringToFront(this.contentView);

        this._tabs.push({ title, view, button });

        view.hidden = true;
    }

    removeTabAtIndex(index) {
        this._tabs[index].view.removeFromSuperview();
        this._tabs[index].button.removeFromSuperview();

        if (index === this._activeIndex) {
            this.activeIndex = index + 1;
        }
    }

    get activeIndex() {
        return this._activeIndex;
    }

    set activeIndex(index) {
        if (index < 0 || index >= this._tabs.length) {
            return;
        }

        if (this._activeIndex !== index) {
            // Hide current tab view

            if (this._activeIndex !== -1) {
                this._tabs[this._activeIndex].view.hidden = true;
            }

            this._activeIndex = index;

            // Stylize the tabs

            _.each(this._tabs, (tab, tabIndex) => {
                if (tabIndex === index) {
                    tab.button.font = this._activeFont;
                    tab.button.textColor = this._activeTextColor;
                    tab.button.backgroundColor = this._activeBackgroundColor;
                } else {
                    tab.button.font = this._inactiveFont;
                    tab.button.textColor = this._inactiveTextColor;
                    tab.button.backgroundColor = this._inactiveBackgroundColor;
                }
            });

            // Swap in the tab's view as current

            this._tabs[this._activeIndex].view.hidden = false;

            this.needsLayout = true;

            this.emit('tabChanged');
        }
    }

    get activeBackgroundColor() {
        return this._activeBackgroundColor;
    }

    set activeBackgroundColor(color) {
        if (this._activeBackgroundColor !== color) {
            this._activeBackgroundColor = color;

            _.each(this._tabs, (tab, index) => {
                tab.button.backgroundColor = (index === this._activeIndex) ?
                    color : this._inactiveTextColor;
            });
        }
    }

    get inactiveBackgroundColor() {
        return this._inactiveBackgroundColor;
    }

    set inactiveBackgroundColor(color) {
        if (this._inactiveBackgroundColor !== color) {
            this._inactiveBackgroundColor = color;
            _.each(this._tabs, (tab, index) => {
                tab.button.backgroundColor = (index !== this._activeIndex) ?
                    color : this._activeTextColor;
            });
        }
    }

    get tabButtonMargin() {
        return this._tabButtonMargin;
    }

    set tabButtonMargin(value) {
        value = Math.abs(value);

        if (_.isFinite(value) && this._tabButtonMargin !== value) {
            this._tabButtonMargin = value;
            this.needsLayout = true;
        }
    }

    get tabButtonCornerRadius() {
        return this._tabButtonCornerRadius;
    }

    set tabButtonCornerRadius(value) {
        value = Math.abs(value);

        if (_.isFinite(value) &&
            this._tabButtonCornerRadius !== value) {

            this._tabButtonCornerRadius = value;

            _.each(this._tabs, tab => {
                tab.button.cornerRadius = [value, value, 0, 0];
            });
        }
    }

    get separatorColor() {
        return this._separatorColor;
    }

    set separatorColor(color) {
        if (this._separatorColor !== color) {
            this._separatorColor = color;

            _.each(this._tabs, tab => {
                tab.button.borderColor = color;
            });
        }
    }

    get separatorLineWidth() {
        return this._separatorLineWidth;
    }

    set separatorLineWidth(width) {
        width = Math.abs(width);

        if (_.isFinite(width) &&
            this._separatorLineWidth !== width) {

            this._separatorLineWidth = width;

            _.each(this._tabs, tab => {
                tab.button.borderColor = width;
            });
        }
    }

    get activeFont() {
        return this._activeFont;
    }

    set activeFont(font) {
        if (this._activeFont !== font) {
            this._activeFont = font;

            _.each(this._tabs, (tab, index) => {
                tab.button.font = (index === this._activeIndex) ?
                    font : this._inactiveFont;
            });
        }
    }

    get inactiveFont() {
        return this._inactiveFont;
    }

    set inactiveFont(font) {
        if (this._inactiveFont !== font) {
            this._inactiveFont = font;

            _.each(this._tabs, (tab, index) => {
                tab.button.font = (index !== this._activeIndex) ?
                    font : this._activeFont;
            });
        }
    }

    get activeTextColor() {
        return this._activeTextColor;
    }

    set activeTextColor(color) {
        if (this._activeTextColor !== color) {
            this._activeTextColor = color;

            _.each(this._tabs, (tab, index) => {
                tab.button.textColor = (index === this._activeIndex) ?
                    color : this._inactiveTextColor;
            });
        }
    }

    get inactiveTextColor() {
        return this._inactiveTextColor;
    }

    set inactiveTextColor(color) {
        if (this._inactiveTextColor !== color) {
            this._inactiveTextColor = color;

            _.each(this._tabs, (tab, index) => {
                tab.button.textColor = (index !== this._activeIndex) ?
                    color : this._activeTextColor;
            });
        }
    }

    layoutSubviews() {
        if (this._tabs.length === 0) {
            return;
        }

        // Tabs left to right across the top
        // Active tab's view beneath the tabs

        var x = this.contentLeft + this._tabButtonMargin;
        let y = this.contentTop;

        _.each(this._tabs, tab => {
            tab.button.sizeToFit();
            tab.button.position.set(x, y);
            x += tab.button.width + this._tabButtonMargin;
        });

        let buttonBottom = _.min(_.pluck(this._tabs, 'button.bottom')) - this._separatorLineWidth;
        this.contentView.frame.set(0, buttonBottom, this.width, this.height - buttonBottom);

        _.each(this._tabs, tab => {
            tab.view.frame = this.contentView.bounds;
        });
    }

    postDraw(context) {
        super.postDraw(context);

        if (this._tabs.length === 0 || this._separatorLineWidth === 0) {
            return;
        }

        context.lineWidth = this._separatorLineWidth;
        context.strokeStyle = this._separatorColor;

        // Draw separator between buttons and content

        if (this._activeIndex !== -1) {
            let y = this.contentView.top,
                activeTab = this._tabs[this._activeIndex];

            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(activeTab.button.left, y);
            context.moveTo(activeTab.button.right, y);
            context.lineTo(this.width, y);
            context.closePath();
            context.stroke();
        }
    }
}


