import  _ from 'lodash';
import View from './View';
import Point from './Point';
import {PointZero} from './magic';
import Animation from './Animation';
import {resetPointerHandling} from './input';

/**
 * A view of a portion of a (potentially larger) content view that moves
 * when the user drags the pointing device (mouse or finger).
 *
 * Add subviews to the content view, not the scroll view itself.
 *
 * Dragging the content view left/up means the user is
 * scrolling to the right/down.
 *
 * When "paging" is enabled, dragging the content view far enough
 * causes the drag to end and the content view is scrolled to the
 * next/previous "page".  A page size is uniform and is equal to
 * the bounds of the scroll view (not the content size).
 *
 * When "auto paging" is enabled, paging is implicitly enabled. With
 * auto paging enabled, jumping to the next/prev page occurs when the
 * user scrolls more than half a page's width (or height).
 *
 * Vertical paging is implicitly enabled when the content size is wider
 * than the scroll view height; similar for horizontal paging.
 *
 * Vertical and horizontal paging can be simultaneously implicitly
 * enabled.
 *
 * Key bindings:
 *
 * - 'ArrowDown': move content down a bit
 * - 'ArrowUp': move content up a bit
 * - 'ArrowLeft': move content left a bit
 * - 'ArrowRight': move content right a bit
 * - 'PageUp': jump to previous page
 * - 'PageDown': jump to next page
 * - 'Home': jump to first page
 * - 'End': jump to last page
 *
 * Note: page-based key bindings do not have to have paging enabled.
 *
 * Events:
 * - pageChanged(newPageX, newPageY)
 */

export default class ScrollView extends View {
    constructor() {
        super();

        this._declerationRate = ScrollView.DecelerationRateSlow;
        this._indicatorColor = '#333';
        this._showIndicators = false;  // only true when dragging/scrolling;

        this._pagingEnabled = false;
        this._autoPagingEnabled = false;
        this._pageNo = new Point();

        this.contentView = new View();
        this.contentView.id = 'contentView';
        this.addSubview(this.contentView);

        this.setupDragging();
    }

    get decelerationRate() {
        return this._declerationRate;
    }

    set decelerationRate(rate) {
        if (_.isFinite(rate)) {
            rate = Math.max(0, Math.min(1, parseInt(rate, 10)));
            this._declerationRate = rate;
            this.needsUpdate = true;
        }
    }

    get indicatorColor() {
        return this._indicatorColor;
    }

    set indicatorColor(color) {
        if (this._indicatorColor !== color) {
            this._indicatorColor = color;
            this.needsDisplay = true;
        }
    }

    /**
     * Scroll indicators are displayed while scrolling is active
     * to give the user an idea of the content size and the current
     * scroll offset(s) therein.
     */

    get showIndicators() {
        return this._showIndicators;
    }

    set showIndicators(onOff) {
        if (this._showIndicators !== onOff) {
            this._showIndicators = onOff;
            this.needsDisplay = true;
        }
    }

    get contentSize() {
        return this.contentView.size;
    }

    set contentSize(size) {
        this.contentView.size.set(size.width, size.height);
        this.needsLayout = true;
    }

    setupDragging() {
        this.velocity = new Point();  // pixels/second
        this.contentView.draggable = true;

        this.contentView.on('dragStarted', (point) => {
            this.resetVelocity();
            this.showIndicators = true;
            this._startDragPoint = point.clone();
        });

        this.contentView.on('dragUpdated', point => {
            this.constrainContentView();
            this.velocity.copy(point).subSelf(this.contentView.lastDragPoint);
            if (this.autoPagingEnabled && this._checkAutoPage(point)) {
                resetPointerHandling();     // cancel drag since we auto-paged
            }
        });

        this.contentView.on('dragEnded', point => {
            if (this.pagingEnabled) {
                if (this.autoPagingEnabled && !this._checkAutoPage(point)) {
                    this.pageNo = this.pageNo;     // snap
                } else {
                    // Start inertia scrolling. When the view stops
                    // the scroll offset is aligned to page boundary.

                    this.needsUpdate = true;
                }
            } else {
                this.needsUpdate = true;    // start inertia scrolling
            }

            this._startDragPoint = null;
        });
    }

    resetVelocity() {
        this.velocity.set(0, 0);
        this.needsUpdate = false;
    }

    update() {
        let rate = this.decelerationRate;
        this.velocity.scaleSelf(rate, rate);

        let originBefore = this.contentView.position.clone();

        this.contentView.position.addSelf(this.velocity);
        this.constrainContentView();

        let originAfter = this.contentView.position.clone();

        if (originBefore.x === originAfter.x &&
            originBefore.y === originAfter.y) {

            if (this.pagingEnabled) {
                this.pageNo = this.determinePageNo();
            }

            this.needsUpdate = false;
            this.showIndicators = false;
        }
    }

    /**
     * If enabled, paging causes the scroll view to stop scrolling
     * on multiples of the scroll view's bounds.
     */

    get pagingEnabled() {
        return this._pagingEnabled;
    }

    set pagingEnabled(onOff) {
        this._pagingEnabled = onOff;
        if (!this._pagingEnabled) {
            this._autoPagingEnabled = false;
        }
    }

    get autoPagingEnabled() {
        return this._autoPagingEnabled;
    }

    set autoPagingEnabled(onOff) {
        if (onOff) {
            this._pagingEnabled = true;
        }

        this._autoPagingEnabled = onOff;
    }

    _checkAutoPage(currentDragPoint) {
        if (!this.pagingEnabled) {
            return false;
        }

        let delta = currentDragPoint.sub(this._startDragPoint),
            h = this.height,
            w = this.width,
            pageNo = this.pageNo;     // 2D

        var didUpdate = false;

        if (this.verticalPagingPossible()) {
            if (delta.y > h/2) {
                pageNo.y--;
                didUpdate = true;
            } else if (delta.y < -h/2) {
                pageNo.y++;
                didUpdate = true;
            }
        }

        if (this.horizontalPagingPossible()) {
            if (delta.x > w/2) {
                pageNo.x--;
                didUpdate = true;
            } else if (delta.x < -w/2) {
                pageNo.x++;
                didUpdate = true;
            }
        }

        if (didUpdate) {
            this.pageNo = pageNo;
        }

        return didUpdate;
    }

    /**
     * The current "page" as a point where x is the horizontal page number
     * and y is the vertical page number, both starting from 0.
     *
     * The size of all pages is the same and is equal to the size of this
     * scroll view's bounds.
     */

    get pageNo() {
        return this._pageNo.clone();
    }

    set pageNo(pageNo) {
        if (_.isFinite(pageNo.x) &&
            _.isFinite(pageNo.y)) {

            let pageX = Math.max(0, Math.min(this.horizontalPageCount - 1, pageNo.x)),
                pageY = Math.max(0, Math.min(this.verticalPageCount - 1, pageNo.y));

            // Useful to snap even if values don't logically change.

            this.scrollTo(this.width * pageX, this.height * pageY);

            if (pageX !== this._pageNo.x ||
                pageY !== this._pageNo.y) {

                this._pageNo.set(pageX, pageY);
                this.emit('pageChanged', pageX, pageY);
            }
        }
    }

    determinePageNo() {
        return new Point(Math.round(Math.abs(this.contentView.left / this.width)),
                         Math.round(Math.abs(this.contentView.top  / this.height)));
    }

    /**
     * Returns the number of pages the current content spans horizontally.
     */

    get horizontalPageCount() {
        return Math.ceil(this.contentSize.width / this.width);
    }

    /**
     * Returns the number of pages the current content spans vertically.
     */

    get verticalPageCount() {
        return Math.ceil(this.contentSize.height / this.height);
    }

    /**
     * Returns true if the content of this scroll view can be paged horizontally.
     */

    horizontalPagingPossible() {
        return this.contentSize.width > this.width;
    }

    /**
     * Returns true if the content of this scroll view can be paged vertically.
     */

    verticalPagingPossible() {
        return this.contentSize.height > this.height;
    }

    /**
     * If either horizontal paging or vertical paging is enabled,
     * jump to the next page (horizontally or vertically).
     *
     * This is a convenience "do what I mean" method.
     */

    gotoNextPage() {
        var pageNo = this.pageNo;

        if (this.verticalPagingPossible()) {
            pageNo.y++;
            this.pageNo = pageNo;
        } else if (this.horizontalPagingPossible()) {
            pageNo.x++;
            this.pageNo = pageNo;
        }
    }

    /**
     * If either horizontal paging or vertical paging is enabled,
     * jump to the previous page (horizontally or vertically).
     *
     * This is a convenience "do what I mean" method.
     */

    gotoPreviousPage() {
        var pageNo = this.pageNo;

        if (this.verticalPagingPossible()) {
            pageNo.y--;
            this.pageNo = pageNo;
        } else if (this.horizontalPagingPossible()) {
            pageNo.x--;
            this.pageNo = pageNo;
        }
    }

    /**
     * Animates the content view so that (x,y) is located at the
     * origin of the scroll view's frame.
     */

    scrollTo(x, y, animated = true) {
        this.resetVelocity();

        if (animated) {
            let originBefore = this.contentView.position.clone();

            this.contentView.position.set(-x, -y);
            this.constrainContentView();

            let originAfter = this.contentView.position.clone();

            this.contentView.position.copy(originBefore);
            this.contentView.userInteractionEnabled = false;

            this.showIndicators = true;

            let name = 'scrollTo';
            this.removeAnimationWithName(name);
            this.addAnimation({
                name,
                target: this.contentView.position,
                endValues: {x:originAfter.x, y:originAfter.y},
                easing: Animation.easing.cubic
            }).on('update', () => {
                this.contentView.position.emit('valueChanged', this.contentView.position);
            }).once('complete', () => {
                this.contentView.userInteractionEnabled = true;
                this.showIndicators = false;
            });
        } else {
            this.contentView.position.set(-x, -y);
            this.constrainContentView();
        }

        return this;
    }

    /**
     * Ensures that the content view sticks to each edge of the scroll view
     * if there is no more content to show beyond each edge.
     *
     * There is no support for iOS-style bouncing as it is dumb.
     */

    constrainContentView() {
        let contentView    = this.contentView;
        contentView.bottom = Math.max(this.height, contentView.bottom);
        contentView.top    = Math.min(0, contentView.top);
        contentView.right  = Math.max(this.width, contentView.right);
        contentView.left   = Math.min(0, contentView.left);
    }

    // Draw scroll indicators. drawBorder is performed after drawing subviews.
    // Thus, anything we draw here is drawn on top of already-drawn subviews.

    postDraw(context) {
        if (this.showIndicators) {
            let indicatorSize = 3,
                scrollHeight = this.height,
                scrollWidth = this.width,
                contentHeight = this.contentView.height,
                contentWidth = this.contentView.width;

            context.fillStyle = this.indicatorColor;

            // Vertical

            let indicatorHeight = Math.round(scrollHeight * scrollHeight / contentHeight),
                indicatorTop = -Math.round(scrollHeight * this.contentView.top / contentHeight);

            if (indicatorTop > 0 &&
                indicatorTop + indicatorHeight < scrollHeight) {
                context.fillRect(this.width - this.borderWidth/2 - indicatorSize,
                    indicatorTop, indicatorSize, indicatorHeight);
            }

            // Horizontal

            let indicatorWidth = Math.round(scrollWidth * scrollWidth / contentWidth),
                indicatorLeft = -Math.round(scrollWidth * this.contentView.left / contentWidth);

            if (indicatorLeft > 0 && indicatorLeft + indicatorWidth < scrollWidth) {
                context.fillRect(indicatorLeft,
                    this.height - this.borderWidth/2 - indicatorSize,
                    indicatorWidth, indicatorSize);
            }
        }

        super.postDraw(context);
    }

    scrollHorizontally(amt=10) {
        this.contentView.left += amt;
        this.constrainContentView();
    }

    scrollVertically(amt=10) {
        this.contentView.top += amt;
        this.constrainContentView();
    }

    /**
     * scroll up = move content up
     */

    scrollUp(amt=10) {
        this.scrollVertically(-Math.abs(amt));
    }

    scrollDown(amt=10) {
        this.scrollVertically(Math.abs(amt));
    }

    scrollLeft(amt=10) {
        this.scrollHorizontally(-Math.abs(amt));
    }

    scrollRight(amt=10) {
        this.scrollHorizontally(Math.abs(amt));
    }

    keyPressed(keyName, ctrl, shift, meta, alt) {
        clearTimeout(this._snapPageTimeout);

        switch (keyName) {
        case 'ArrowDown':
            this.scrollDown();
            break;

        case 'ArrowUp':
            this.scrollUp();
            break;

        case 'ArrowLeft':
            this.scrollLeft();
            break;

        case 'ArrowRight':
            this.scrollRight();
            break;

        case 'PageUp':
            this.gotoPreviousPage();
            break;

        case 'PageDown':
            this.gotoNextPage();
            break;

        case 'Home':
            this.pageNo = PointZero;
            break;

        case 'End':
            this.pageNo = new Point(
                this.horizontalPageCount - 1,
                this.verticalPageCount - 1);
            break;
        }

        // A bit after the user uses the keyboard to scroll,
        // if paging is enabled, snap to the current page.

        if (this.pagingEnabled) {
            clearTimeout(this._snapPageTimeout);
            this._snapPageTimeout = setTimeout(() => {
                this.pageNo = this.pageNo; // snap
            }, 1000);
        }

        super.keyPressed(keyName, ctrl, shift, meta, alt);
    }
}

ScrollView.DecelerationRateFast = 0.9;
ScrollView.DecelerationRateNormal = 0.925;
ScrollView.DecelerationRateSlow = 0.95;
