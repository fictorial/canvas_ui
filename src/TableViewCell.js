import  _ from 'lodash';
import View from './View';
import ImageView from './ImageView';
import Label from './Label';
import {PointZero} from './magic';
import Point from './Point';
import {SystemFontOfSize} from './fonts';

/**
 * A view of a single item of a collection.
 *
 * By default, such a cell has:
 * - an image
 * - a title label
 * - a subtitle label
 * - an accessory view
 *
 * Note that table view cells don't have a content and background view.
 * Essentially just an implicit content view.
 */

export default class TableViewCell extends View {
    constructor(tableView, index) {
        super();

        this._tableView = tableView;
        this._index = index;
        this._itemCount = 0;

        this._showsSeparatorLine = true;
        this._separatorLineColor = '#cac9ce';

        this._imageView = new ImageView();
        this._imageView.id = 'image';
        this.addSubview(this._imageView);

        this._titleLabel = new Label();
        this._titleLabel.id = 'title';
        this._titleLabel.font = SystemFontOfSize(14);
        this._titleLabel.textColor = '#333';
        this.addSubview(this._titleLabel);

        this._subtitleLabel = new Label();
        this._subtitleLabel.id = 'subtitle';
        this._subtitleLabel.font = SystemFontOfSize(10);
        this._subtitleLabel.textColor = '#aaa';
        this.addSubview(this._subtitleLabel);

        this._accessoryView = new Label();
        this._accessoryView.id = 'accessory';
        this.addSubview(this._accessoryView);

        this.insets.left = this.insets.right = 20;
        this.insets.top = this.insets.bottom = 10;

        this.userInteractionEnabled = true;
        this.highlightsOnTouch = true;
    }

    tapped(localPoint) {
        super.tapped(localPoint);

        let delegate = this._tableView.delegate;
        if (_.isFunction(delegate.didSelectItemAtIndex)) {
            delegate.didSelectItemAtIndex(this._tableView, this._index, this);
        }
    }

    longPressed(localPoint) {
        let delegate = this._tableView.delegate;

        // Can we reorder this cell at all?

        if (!_.isFunction(delegate.canMoveItem) ||
            !delegate.canMoveItem(this._tableView, this._index, this._index)) {
            return;
        }

        super.longPressed(localPoint);

        this.shadowBlur = 10;
        this.shadowOffsetY = 2;
        this.shadowColor = 'rgba(0,0,0,0.5)';
        this.clipsSubviews = false;
        this.backgroundColor = '#fff';

        this.draggable = true;
        this.highlighted = false;
        this.borderWidth = 1;
        this.borderColor = '#aaa';

        this._showsSeparatorLine = false;

        // Center the dragged table view cell about the touch point
        // in root space

        let rootPoint = this.convertLocalToRoot(PointZero);
        this.rootView.addSubview(this);

        this.position.copy(rootPoint);
        rootPoint = this.convertLocalToRoot(localPoint);

        this.addAnimation({
            name: 'moveIntoPlace',
            target: this.position,
            endValues: {
                x: rootPoint.x - this.halfWidth,
                y: rootPoint.y - this.halfHeight },
            duration: 200
        });

        this.addAnimation({
            name: 'scaleDownForVisibility',
            target: this.scale,
            endValues: {x: 0.7, y:0.7},
            duration: 200
        });

        var insertionIndicatorView = new View();
        insertionIndicatorView.backgroundColor = 'red';
        insertionIndicatorView.width = this._tableView.contentWidth;
        insertionIndicatorView.height = 4;
        insertionIndicatorView.userInteractionEnabled = false;
        insertionIndicatorView.id = 'cell insertion indicator';
        insertionIndicatorView.hidden = true;
        this._tableView.addSubview(insertionIndicatorView);

        var targetIndex = -1,
            lastAutoScrollAt;

        this.on('dragUpdated', (atPoint) => {

            // atPoint is in the space of this view's superview.

            // Figure out which cell the dragged cell is over
            // and show a red line where it /would/ be inserted if dropped.
            //
            // Re: targetIndex... Recall that this view being dragged around
            // is now in root view space and thus leaves a hole in the span
            // of indices of remaining cell views.

            let dragPointInTableContentView = this.superview.convertLocalToOther(atPoint,
                this._tableView.contentView);

            let [overCell, overCellPoint] = this._tableView.contentView.hitTest(
                dragPointInTableContentView);

            if (overCell && overCell instanceof TableViewCell) {
                insertionIndicatorView.hidden = false;

                // Where the indicator should be located in table content view space.

                var indicatorY;

                if (overCellPoint.y > overCell.halfHeight) {
                    indicatorY = overCell.bottom;

                    targetIndex = overCell._index < this._index ?
                        overCell._index + 1 : overCell._index;
                } else {
                    indicatorY = overCell.top;

                    targetIndex = overCell._index > this._index ?
                        overCell._index - 1 : overCell._index;
                }

                insertionIndicatorView.top =
                    this._tableView.contentView.convertLocalToSuperview(new Point(0, indicatorY)).y -
                    insertionIndicatorView.halfHeight;     // center it
            }

            // Auto-scroll the table if the user drags this table view cell near
            // the top or bottom of the table view.

            // NB: user must move pointer for repeat auto-scrollings.
            // In iOS, if the user leaves the pointer near the top/bottom, the auto-scroll
            // gets faster and doesn't require the user to move the pointer.

            let dragPointInTableView = this.superview.convertLocalToOther(atPoint, this._tableView),
                autoScrollRegionHeight = Math.round(this._tableView.height * 0.10),
                timeNow = +new Date(),
                timeSinceLastAutoScroll = timeNow - lastAutoScrollAt,
                autoScrollAtMostEvery = 500,
                autoScrollAmount = this._tableView.halfHeight;

            if (dragPointInTableView.y <= autoScrollRegionHeight) {
                if (!lastAutoScrollAt || timeSinceLastAutoScroll > autoScrollAtMostEvery) {
                    this._tableView.scrollDown(autoScrollAmount);
                    lastAutoScrollAt = timeNow;
                }
            } else if (dragPointInTableView.y >= this._tableView.height - autoScrollRegionHeight) {
                if (!lastAutoScrollAt || timeSinceLastAutoScroll > autoScrollAtMostEvery) {
                    this._tableView.scrollUp(autoScrollAmount);
                    lastAutoScrollAt = timeNow;
                }
            }
        });

        this.on('dragEnded', () => {
            insertionIndicatorView.removeFromSuperview();

            if (_.isFunction(delegate.canMoveItem) &&
                delegate.canMoveItem(this._tableView, this._index, targetIndex)) {

                let dataSource = this._tableView.dataSource;
                if (_.isFunction(dataSource.moveItem)) {
                    this._tableView.dataSource.moveItem(this._tableView, this._index, targetIndex);
                }
            }

            this.removeFromSuperview();
            this._tableView.reload(false);

            targetIndex = -1;
        });
    }

    /**
     * Various layout configurations based on presence of item data.
     *
     * A
     *   ┏━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━┓
     *   ┃          ┃ ┃                              ┃ ┃          ┃
     *   ┃          ┃ ┃  title                       ┃ ┃          ┃
     *   ┃   image  ┃ ┃                              ┃ ┃  access- ┃
     *   ┃          ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃    ory   ┃
     *   ┃          ┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┃          ┃
     *   ┃          ┃ ┃  subtitle                    ┃ ┃          ┃
     *   ┗━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━┛
     *
     * B
     *   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━┓
     *   ┃                                           ┃ ┃          ┃
     *   ┃  title                                    ┃ ┃          ┃
     *   ┃                                           ┃ ┃  access- ┃
     *   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃    ory   ┃
     *   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┃          ┃
     *   ┃  subtitle                                 ┃ ┃          ┃
     *   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━┛
     *
     * C
     *   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     *   ┃                                                        ┃
     *   ┃  title                                                 ┃
     *   ┃                                                        ┃
     *   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     *   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     *   ┃  subtitle                                              ┃
     *   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     *
     * D
     *   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
     *   ┃                                                        ┃
     *   ┃                                                        ┃
     *   ┃  title                                                 ┃
     *   ┃                                                        ┃
     *   ┃                                                        ┃
     *   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     */

    layoutSubviews() {
        let hMargin = this.insets.left;    // consistency, that's all.

        var labelLeft;

        if (this._imageView.image) {// && this._imageView.image.complete) {
            let imageSize = this.contentHeight;
            this._imageView.frame.set(this.contentLeft, this.contentTop, imageSize, imageSize);
            labelLeft = this._imageView.right + hMargin;
        } else {
            labelLeft = hMargin;
        }

        var labelRight = this.contentRight;

        if (this._accessoryView) {
            if (!this._accessoryView.hidden) {
                if (this._accessoryView.constructor.name === 'Label') {
                    this._accessoryView.sizeToFit().frame.set(
                        this.contentRight - this._accessoryView.width,
                        this.contentTop,
                        this._accessoryView.width,
                        this.contentHeight);
                } else {
                    let accessoryViewHeight = Math.min(this.contentHeight,
                                                       this._accessoryView.height);

                    this._accessoryView.frame.set(
                        this.contentRight - this._accessoryView.width,
                        this.contentCenterY - accessoryViewHeight/2,
                        this._accessoryView.width,
                        accessoryViewHeight);
                }

                labelRight = this._accessoryView.left - hMargin;
            }
        }

        var titleHeight,
            subtitleHeight;

        let labelWidth = labelRight - labelLeft;

        if (!this._subtitleLabel.hidden && !!this._subtitleLabel.text) {
            titleHeight    = Math.round(this.contentHeight * 0.7);
            subtitleHeight = Math.round(this.contentHeight * 0.3);

            this._subtitleLabel.frame.set(labelLeft,
                this.contentTop + titleHeight, labelWidth, subtitleHeight);
        } else {
            titleHeight = this.contentHeight;
        }

        this._titleLabel.frame.set(labelLeft, this.contentTop,
            labelWidth, titleHeight);
    }

    get image() {
        return this._imageView.image;
    }

    set image(image) {
        this._imageView.image = image;
        //this._imageView.hidden = !!image
        this.needsLayout = true;
    }

    get title() {
        return this._titleLabel.text;
    }

    set title(title) {
        this._titleLabel.text = title;
    }

    get subtitle() {
        return this._subtitleLabel.text;
    }

    set subtitle(subtitle) {
        this._subtitleLabel.text = subtitle;
        this.needsLayout = true;
    }

    get accessoryType() {
        if (this._accessoryView instanceof Label) {
            return this._accessoryView.text;
        }

        return null;
    }

    set accessoryType(type) {
        if (this._accessoryView instanceof Label && _.isString(type)) {
            this._accessoryView.text = type;
            this.needsLayout = true;
        }
    }

    postDraw(context) {
        if (this._showsSeparatorLine) {
            let titleLeft = this._titleLabel.left,
                lineY = this.height - 1;

            context.beginPath();
            context.moveTo(titleLeft, lineY);
            context.lineTo(this.width, lineY);
            context.closePath();

            context.lineWidth = 1;
            context.strokeStyle = this._separatorLineColor;
            context.stroke();
        }

        super.postDraw(context);
    }
}

TableViewCell.AccessoryTypeNone = '';
TableViewCell.AccessoryTypeCheck = '✓';
TableViewCell.AccessoryTypeDisclosureIndicator = '▶';
