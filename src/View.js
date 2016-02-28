import  _ from 'lodash';
import EventEmitter from 'events';
import Frame from './Frame';
import EdgeInsets from './EdgeInsets';
import {SystemFontOfSize} from './fonts';
import Point from './Point';
import {isMobile, PointZero} from './magic';
import {viewNeedsLayout, viewNeedsUpdate, queueRunLoopIteration} from './core';
import Animation from './Animation';
import {distanceSquared} from './util';

/**
 * A view is a graphical representation of some data bound by a 2D rectangle called its "frame".
 *
 * Each view has its own coordinate system with its origin in the top-left of its frame.
 *
 * Views may have many subviews but at most one superview.
 *
 * Views are positioned in the coordinate system of their superview.  The top-most or
 * "root" view has no superview or rather an implicit superview of the canvas on which
 * all of these views are rendered.
 *
 * Each view may have its own scale, angle (radians), and alpha (transparency).
 * Scaling and rotation are performed about the view's center, not it's top-left origin.
 *
 * Views have customizable appearance properties such as background color, shadowing,
 * borders, etc.
 *
 * Views support touch (or mouse-simulated touch) events.
 *
 * Views may be hidden which means they are not rendered nor respond to user interaction.
 * Any subview (or sub-subview, etc.) of a hidden view is implicitly hidden as well.
 *
 * Views support drag and drop (`draggable`, `acceptsDroppedViews`, etc.)
 *
 * View properties can be animated however you'd like. See `addAnimation`.
 *
 * It is possible to manually control a view via `needsUpdate` and `update`.
 *
 * Views may have shadows. If clipping is enabled (`clipsSubviews`), shadows will be clipped away.
 *
 * Typically, a view will add subviews in its constructor then lay them out in
 * `layoutSubviews` using positioning and alignment helper methods such as
 * `alignTop`, `moveToCenterMiddle`, etc.  The `move` methods are named based on
 * horizontal position followed by vertical position where horizontal positions are
 * one of `left`, `center`, or `right` and vertical positions are one of `top`,
 * `middle`, or `bottom`.  Thus, centering in the superview is handled in
 * `moveToCenterMiddle`.
 *
 * Layout is triggered (`layoutSubviews`):
 * - on the superview when a subview is added; and
 * - on the subview when it is added; and
 * - on the superview when a subview is removed; and
 * - on a view whose size has changed; and
 * - on a view whose insets have changed; and
 * - on a view whose font has changed.
 *
 * Layout is not triggered on changes to frame position, scale, alpha, angle, clipping,
 * or appearance with the exception of font.  A redraw is triggered with changes in appearance.
 * Redraws are always done via the run loop (see `needsDisplay`) which allows us to only
 * redraw when views having active animations, require manual updates, need layout, or have
 * changes in appearance. That is, we do not update, layout, animate, and redraw every view
 * every animation frame to reduce energy costs.
 *
 * Layout is triggered on the superview of a view when its `scale` changes and
 * `._superviewNeedsLayoutOnScaling` is true. Sometimes scale changes are temporary and might
 * not need a relayout in the superview; thus, it's an option.
 *
 * Layout is triggered on the superview of a view when its `angle` changes and
 * `._superviewNeedsLayoutOnRotation` is true. Sometimes angle changes are temporary and might
 * not need a relayout in the superview; thus, it's an option.
 *
 * Note that setting a subview's frame inside layoutSubviews would trigger infinite relayout
 * but that's not the case since layout occurs on *changes* to size, etc. not just setting
 * values thereupon.
 *
 * A single view in the hierarchy can become the "first responder" which is the view that has
 * "focus" and receives keyboard events.  Touch/mouse events are always passed to the hit-test
 * view or its first user-interaction-enabled superview.  If a view cannot become first responder,
 * its superviews are checked up to the root view.
 *
 * Events:
 * - changedVisibility(isHidden)
 * - subviewAdded(subview)
 * - subviewRemoved(subview)
 * - removedFromSuperview()
 * - didLayoutSubviews()
 * - tap(localPoint, tapCount)
 * - touchStart(localPoint)
 * - touchMove(localPoint)
 * - touchEnd(localPoint)
 * - touchCancel()
 * - longPressed(localPoint)
 * - dragStarted(superviewPoint)
 * - dragUpdated(superviewPoint)
 * - dragEnded(superviewPoint)
 * - dropAccepted(toOtherView)
 * - dropRejected(byOtherView)
 * - dropMightBeReceived(view, localPoint)
 * - dropWillNotBeReceived(view)
 * - dropReceived(droppedView, localPoint)
 * - didBecomeFirstResponder()
 * - didResignFirstResponder()
 * - keyPressed(key, ctrlKey, shiftKey, metaKey, altKey)
 * - animationAdded(animation)
 * - animationStarted(animation)
 * - animationCompleted(animation)
 */

export default class View extends EventEmitter {
    constructor() {
        super();

        this.id = _.uniqueId(this.constructor.name);

        this.superview = null;
        this.subviews = [];

        // When this view is repositioned, redraw;
        // When this view is resized, relayout.;

        this._frame = new Frame();

        this._frame.origin.on('valueChanged', () => {
            this.needsDisplay = true;
        });

        this._frame.size.on('valueChanged', () => {
            this.needsLayout = true;

            if (this.superview) {
                this.superview.needsLayout = true;
            }
        });

        // Insets are like "padding" if you are familiar with CSS.

        this._insets = new EdgeInsets();
        this._insets.on('valueChanged', () => {
            this.needsLayout = true;
        });

        this.needsLayout = true;
        this._needsDisplay = false;

        this._scale = new Point(1,1);
        this._superviewNeedsLayoutOnScaling = false;
        this._scale.on('valueChanged', () => {
            if (this.superview && this._superviewNeedsLayoutOnScaling) {
                this.superview.needsLayout = true;
            }

            this.needsLayout = true;
        });

        this._alpha = 1.0;
        this._angle = 0.0;
        this._superviewNeedsLayoutOnRotation = false;
        this._drawMode = null;

        this._hidden = false;
        this._userInteractionEnabled = true;
        this._clipsSubviews = true;

        this._backgroundColor = null;   // clears frame to transparent

        this._font = SystemFontOfSize(12);

        this._borderColor = '#333';
        this._borderWidth = 0;
        this._cornerRadius = 0;

        this._highlightsOnTouch = false;
        this._highlightColor = 'rgba(0,0,0,0.2)';
        this._highlighted = false;

        this._shadowColor = null;
        this._shadowBlur = 0;
        this._shadowOffsetX = 0;
        this._shadowOffsetY = 0;

        this._animations = null;

        this._touchCanceled = false;
        this._timeOfLastTap = null;
        this._tapCount = null;

        // As most views are not draggable, the drag-slots
        // are created on demand when enabling dragging.

        this._draggable = false;
        this._acceptsDroppedViews = false;
    }

    get frame() {
        return this._frame;
    }

    set frame(newFrame) {
        this._frame.copy(newFrame);   // triggers layout via slot
    }

    get insets() {
        return this._insets;
    }

    set insets(newInsets) {
        this._insets.copy(newInsets);   // triggers layout via slot
    }

    get font() {
        return this._font;
    }

    set font(font) {
        if (this._font !== font) {
            this._font = font;
            this.needsLayout = true;      // assumes font size changes
        }
    }

    get backgroundColor() {
        return this._backgroundColor;
    }

    set backgroundColor(backgroundColor) {
        if (backgroundColor !== this._backgroundColor) {
            this._backgroundColor = backgroundColor;
            this.needsDisplay = true;
        }
    }

    get borderColor() {
        return this._borderColor;
    }

    /**
     * Set the color of the border.
     *
     * If a color, sets all edge border colors to the given color.
     * This allows arbitrary shape paths.
     *
     * If an array, sets each edge border color in order: top, left, bottom, right.
     * Note that using an array assumes a rectangular shape with a cornerRadius of 0.
     */

    set borderColor(borderColor) {
        var doUpdate = false;

        if (_.isArray(borderColor)) {
            if (borderColor.length === 4 &&
                _.all(borderColor, _.isString) &&
                (!_.isArray(this._borderColor) ||
                 !_.isEqual(borderColor, this._borderColor))) {
                doUpdate = true;
            }
        } else if (this._borderColor !== borderColor) {
            doUpdate = true;
        }

        if (doUpdate) {
            this._borderColor = borderColor;
            this.needsDisplay = true;
        }
    }

    set topBorderColor(topColor) {
        let color = this.borderColor;
        if (_.isArray(color) && color[0] !== topColor) {
            this._borderColor[0] = topColor;
            this.needsDisplay = true;
        } else {
            this.borderColor = [topColor, color, color, color];
        }
    }

    set leftBorderColor(leftColor) {
        let color = this.borderColor;
        if (_.isArray(color) && color[1] !== leftColor) {
            this._borderColor[1] = leftColor;
            this.needsDisplay = true;
        } else {
            this.borderColor = [color, leftColor, color, color];
        }
    }

    set bottomBorderColor(bottomColor) {
        let color = this.borderColor;
        if (_.isArray(color) && color[2] !== bottomColor) {
            this._borderColor[2] = bottomColor;
            this.needsDisplay = true;
        } else {
            this.borderColor = [color, color, bottomColor, color];
        }
    }

    set rightBorderColor(rightColor) {
        let color = this.borderColor;
        if (_.isArray(color) && color[3] !== rightColor) {
            this._borderColor[3] = rightColor;
            this.needsDisplay = true;
        } else {
            this.borderColor = [color, color, color, rightColor];
        }
    }

    get topBorderColor() {
        let color = this.borderColor;
        return _.isArray(color) ? color[0] : color;
    }

    get leftBorderColor() {
        let color = this.borderColor;
        return _.isArray(color) ? color[1] : color;
    }

    get bottomBorderColor() {
        let color = this.borderColor;
        return _.isArray(color) ? color[2] : color;
    }

    get rightBorderColor() {
        let color = this.borderColor;
        return _.isArray(color) ? color[3] : color;
    }

    get borderWidth() {
        return this._borderWidth;
    }

    /**
     * Set the line width of the view's border.
     *
     * If a single value, sets all edge border widths to the given value.
     * This allows arbitrary shape paths.
     *
     * If an array, sets each edge border width in order: top, left, bottom, right.
     * Note that using an array assumes a rectangular shape with a cornerRadius of 0.
     */

    set borderWidth(borderWidth) {
        var doUpdate = false;

        if (_.isArray(borderWidth)) {
            if (borderWidth.length === 4 &&
                _.all(borderWidth, _.isFinite) &&
                (!_.isArray(this._borderWidth) ||
                 !_.isEqual(borderWidth, this._borderWidth))) {
                doUpdate = true;
            }
        } else if (_.isFinite(borderWidth) && this._borderWidth !== borderWidth) {
            doUpdate = true;
        }

        if (doUpdate) {
            this._borderWidth = borderWidth;
            this.needsDisplay = true;
        }
    }

    set topBorderWidth(topWidth) {
        let width = this.borderWidth;
        if (_.isArray(width) && this._borderWidth[0] !== topWidth) {
            this._borderWidth[0] = topWidth;
            this.needsDisplay = true;
        } else {
            this.borderWidth = [topWidth, width, width, width];
        }
    }

    set leftBorderWidth(leftWidth) {
        let width = this.borderWidth;
        if (_.isArray(width) && this._borderWidth[1] !== leftWidth) {
            this._borderWidth[1] = leftWidth;
            this.needsDisplay = true;
        } else {
            this.borderWidth = [width, leftWidth, width, width];
        }
    }

    set bottomBorderWidth(bottomWidth) {
        let width = this.borderWidth;
        if (_.isArray(width) && this._borderWidth[2] !== bottomWidth) {
            this._borderWidth[2] = bottomWidth;
            this.needsDisplay = true;
        } else {
            this.borderWidth = [width, width, bottomWidth, width];
        }
    }

    set rightBorderWidth(rightWidth) {
        let width = this.borderWidth;
        if (_.isArray(width) && this._borderWidth[3] !== rightWidth) {
            this._borderWidth[3] = rightWidth;
            this.needsDisplay = true;
        } else {
            this.borderWidth = [width, width, width, rightWidth];
        }
    }

    get topBorderWidth() {
        let width = this.borderWidth;
        return _.isArray(width) ? width[0] : width;
    }

    get leftBorderWidth() {
        let width = this.borderWidth;
        return _.isArray(width) ? width[1] : width;
    }

    get bottomBorderWidth() {
        let width = this.borderWidth;
        return _.isArray(width) ? width[2] : width;
    }

    get rightBorderWidth() {
        let width = this.borderWidth;
        return _.isArray(width) ? width[3] : width;
    }

    get cornerRadius() {
        return this._cornerRadius;
    }

    /**
     * Corner radius may be a single number which specifies the corner radius for
     * all 4 corners, or it may be a 4-element array of the form:
     *
     *     [top_left, top_right, lower_right, lower_left]
     */

    set cornerRadius(cornerRadius) {
        var doUpdate = false;

        if (_.isArray(cornerRadius)) {
            if (cornerRadius.length === 4 &&
                _.all(cornerRadius, _.isFinite) &&
                (!_.isArray(this._cornerRadius) ||
                 !_.isEqual(cornerRadius, this._cornerRadius))) {
                doUpdate = true;
            }
        } else if (_.isFinite(cornerRadius) && this._cornerRadius !== cornerRadius) {
            doUpdate = true;
        }

        if (doUpdate) {
            this._cornerRadius = cornerRadius;
            this.needsDisplay = true;
        }
    }

    set topLeftCornerRadius(radius) {
        let cornerRadius = this._cornerRadius;
        if (_.isArray(cornerRadius) && this._cornerRadius[0] !== radius) {
            this._cornerRadius[0] = radius;
            this.needsDisplay = true;
        } else {
            this.cornerRadius = [radius, cornerRadius, cornerRadius, cornerRadius];
        }
    }

    set topRightCornerRadius(radius) {
        let cornerRadius = this._cornerRadius;
        if (_.isArray(cornerRadius) && this._cornerRadius[1] !== radius) {
            this._cornerRadius[1] = radius;
            this.needsDisplay = true;
        } else {
            this.cornerRadius = [cornerRadius, radius, cornerRadius, cornerRadius];
        }
    }

    set bottomRightCornerRadius(radius) {
        let cornerRadius = this._cornerRadius;
        if (_.isArray(cornerRadius) && this._cornerRadius[2] !== radius) {
            this._cornerRadius[2] = radius;
            this.needsDisplay = true;
        } else {
            this.cornerRadius = [cornerRadius, cornerRadius, radius, cornerRadius];
        }
    }

    set bottomLeftCornerRadius(radius) {
        let cornerRadius = this._cornerRadius;
        if (_.isArray(cornerRadius) && this._cornerRadius[3] !== radius) {
            this._cornerRadius[3] = radius;
            this.needsDisplay = true;
        } else {
            this.cornerRadius = [cornerRadius, cornerRadius, cornerRadius, radius];
        }
    }

    get topLeftCornerRadius() {
        let cornerRadius = this.cornerRadius;
        return _.isArray(cornerRadius) ? cornerRadius[0] : cornerRadius;
    }

    get topRightCornerRadius() {
        let cornerRadius = this.cornerRadius;
        return _.isArray(cornerRadius) ? cornerRadius[1] : cornerRadius;
    }

    get bottomRightCornerRadius() {
        let cornerRadius = this.cornerRadius;
        return _.isArray(cornerRadius) ? cornerRadius[2] : cornerRadius;
    }

    get bottomLeftCornerRadius() {
        let cornerRadius = this.cornerRadius;
        return _.isArray(cornerRadius) ? cornerRadius[3] : cornerRadius;
    }

    get userInteractionEnabled() {
        return this._userInteractionEnabled;
    }

    set userInteractionEnabled(userInteractionEnabled) {
        if (this._userInteractionEnabled !== userInteractionEnabled) {
            this._userInteractionEnabled = userInteractionEnabled;
            this.needsDisplay = true;
        }
    }

    get hidden() {
        return this._hidden;
    }

    set hidden(hidden) {
        hidden = !!hidden;

        if (this._hidden !== hidden) {
            this._hidden = hidden;

            if (hidden) {
                this.didBecomeHidden();
            } else if (this.allSuperviewsVisible()) {
                this.didBecomeVisible();
            }

            this.needsDisplay = true;
        }
    }

    hide() {
        this.hidden = true;
    }

    show() {
        this.hidden = false;
    }

    /**
     * The superviews might be off-screen but as long as they are all not `.hidden`
     * this returns true.
     */

    allSuperviewsVisible() {
        var curr = this;

        while (curr) {
            if (curr.hidden) {
                return false;
            }

            curr = curr.superview;
        }

        return true;
    }

    /**
     * Called when a view becomes unhidden or is added to a view that is visible.
     *
     * Notifies subviews that themselves are not hidden that they have now become visible.
     */

    didBecomeVisible() {
        _.each(this.subviews, subview => {
            if (!subview.hidden) {
                subview.didBecomeVisible();
            }
        });

        this.emit('changedVisibility', true);
    }

    /**
     * Called when a view will be hidden, either by directly setting `.hidden`
     * on this view or on one of its superviews.
     */

    didBecomeHidden() {
        _.each(this.subviews, subview => subview.didBecomeHidden());

        this.emit('changedVisibility', false);
    }

    /**
     * Returns true if the given local point is visible in the root view
     * of this view.
     */

    isPointVisibleToRootView(localPoint) {
        let [hitView] = this.rootView.hitTest(this.convertLocalToRoot(localPoint));
        return hitView === this;
    }

    /**
     * Returns true if the local point is inside this view.
     *
     * By default this assumes the view's shape is a solid rectangle.
     *
     * Subclasses can override for transparency (holes) or other
     * view shapes (e.g. a circle).
     */

    containsPoint(localPoint) {
        return localPoint.x >= 0 &&
               localPoint.x < this.width &&
               localPoint.y >= 0 &&
               localPoint.y < this.height;
    }

    get highlighted() {
        return this._highlighted;
    }

    set highlighted(highlighted) {
        if (this._highlighted !== highlighted) {
            this._highlighted = highlighted;
            this.needsDisplay = true;
        }
    }

    get highlightColor() {
        return this._highlightColor;
    }

    set highlightColor(highlightColor) {
        if (this._highlightColor !== highlightColor) {
            this._highlightColor = highlightColor;
            this.needsDisplay = true;
        }
    }

    get highlightsOnTouch() {
        return this._highlightsOnTouch;
    }

    set highlightsOnTouch(highlightsOnTouch) {
        if (this._highlightsOnTouch !== highlightsOnTouch) {
            this._highlightsOnTouch = highlightsOnTouch;
            this.needsDisplay = true;
        }
    }

    get clipsSubviews() {
        return this._clipsSubviews;
    }

    set clipsSubviews(clipsSubviews) {
        if (this._clipsSubviews !== clipsSubviews) {
            this._clipsSubviews = clipsSubviews;
            this.needsDisplay = true;
        }
    }

    get shadowColor() {
        return this._shadowColor;
    }

    set shadowColor(shadowColor) {
        if (this._shadowColor !== shadowColor) {
            this._shadowColor = shadowColor;
            this.needsDisplay = true;
        }
    }

    get shadowBlur() {
        return this._shadowBlur;
    }

    set shadowBlur(shadowBlur) {
        if (_.isFinite(shadowBlur) && this._shadowBlur !== shadowBlur) {
            this._shadowBlur = shadowBlur;
            this.needsDisplay = true;
        }
    }

    get shadowOffsetX() {
        return this._shadowOffsetX;
    }

    set shadowOffsetX(shadowOffsetX) {
        if (_.isFinite(shadowOffsetX) && this._shadowOffsetX !== shadowOffsetX) {
            this._shadowOffsetX = shadowOffsetX;
            this.needsDisplay = true;
        }
    }

    get shadowOffsetY() {
        return this._shadowOffsetY;
    }

    set shadowOffsetY(shadowOffsetY) {
        if (_.isFinite(shadowOffsetY) && this._shadowOffsetY !== shadowOffsetY) {
            this._shadowOffsetY = shadowOffsetY;
            this.needsDisplay = true;
        }
    }

    get alpha() {
        return this._alpha;
    }

    set alpha(alpha) {
        alpha = Math.min(1, Math.max(0, alpha));
        if (_.isFinite(alpha) && this._alpha !== alpha) {
            this._alpha = alpha;
            this.needsDisplay = true;
        }
    }

    get drawMode() {
        return this._drawMode;
    }

    set drawMode(drawMode) {
        if (this._drawMode !== drawMode) {
            this._drawMode = drawMode;
            this.needsDisplay = true;
        }
    }

    get angle() {
        return this._angle;
    }

    set angle(angle) {
        if (_.isFinite(angle) && this._angle !== angle) {
            this._angle = angle;
            this.needsDisplay = true;

            if (this.superview && this._superviewNeedsLayoutOnRotation) {
                this.superview.needsLayout = true;
            }
        }
    }

    get superviewNeedsLayoutOnRotation() {
        return this._superviewNeedsLayoutOnRotation;
    }

    set superviewNeedsLayoutOnRotation(yesNo) {
        this._superviewNeedsLayoutOnRotation = yesNo;
    }

    get scale() {
        return this._scale;
    }

    set scale(scale) {
        this._scale.set(scale, scale);
        return this;
    }

    get scaleX() {
        return this._scale.x;
    }

    set scaleX(sx) {
        this._scale.x = sx;
    }

    get scaleY() {
        return this._scale.y;
    }

    set scaleY(sy) {
        this._scale.y = sy;
    }

    get superviewNeedsLayoutOnScaling() {
        return this._superviewNeedsLayoutOnScaling;
    }

    set superviewNeedsLayoutOnScaling(yesNo) {
        this._superviewNeedsLayoutOnScaling = yesNo;
    }

    /**
     * Adds a subview to this view.  The subview will be in front of all
     * other subviews already added to this view.
     */

    addSubview(subview) {
        if (subview.superview) {
            subview.superview.removeSubview(subview);
        }

        subview.superview = this;
        this.subviews.push(subview);

        this.needsLayout = true;
        subview.needsLayout = true;

        subview.wasAddedToView();
        this.emit('subviewAdded', subview);
    }

    /**
     * Removes a subview whose superview is this view.
     */

    removeSubview(subview) {
        let index = this.subviews.indexOf(subview);
        if (index !== -1) {
            this.needsLayout = true;
            subview.willBeRemovedFromView(this);
            this.subviews.splice(index, 1);
            subview.wasRemovedFromView(this);
            this.emit('subviewRemoved', subview);
        }
    }

    /**
     * Removes this view from its superview.
     */

    removeFromSuperview() {
        if (this.superview) {
            this.superview.removeSubview(this);
        }
    }

    /**
     * Called when this view was added as a subview of the given superview.
     */

    wasAddedToView() {
        if (this.allSuperviewsVisible()) {
            this.didBecomeVisible();
        }
    }

    /**
     * Called when this view is about to be removed from its superview.
     */

    willBeRemovedFromView(/*superview*/) {
        _.each(this.subviews, subview => subview.willBeRemovedFromView(this));
        this.removeAllAnimations();
        this.resignFirstResponder();
        this.needsUpdate = false;
        this.needsLayout = false;
    }

    /**
     * Called when this view was removed as a subview of the given superview.
     */

    wasRemovedFromView(/*superview*/) {
        this.superview = null;

        this.emit('removedFromSuperview');

        this.removeAllListeners();
        this.position.removeAllListeners();
        this.size.removeAllListeners();

        _.each(this.subviews, subview => subview.wasRemovedFromView(this));
    }

    /**
     * Returns an array of this view's ancestor views.
     *
     * `[ superview, super-superview, ..., rootView ]`
     */

    ancestorViews() {
        var list = [],
            curr = this.superview;

        while (curr) {
            list.push(curr);
            curr = curr.superview;
        }

        return list;
    }

    /**
     * Returns the top-most, "root", or oldest ancestor view of this view.
     */

    get rootView() {
        var curr = this;

        while (curr.superview) {
            curr = curr.superview;
        }

        return curr;
    }

    /**
     * Returns the top-most view directly parented by the root view of this view.
     */

    get firstNonRootView() {
        var curr = this;

        while (curr.superview && curr.superview.superview) {
            curr = curr.superview;
        }

        return curr;
    }

    /**
     * Returns the first subview that matches the given predicate.
     *
     * If `recursive` is truthy and none of the immediate subviews of this
     * subview match the predicate, the search continues recursively.
     */

    getFirstSubviewByPredicate(pred, recursive = true) {
        var match = _.find(this.subviews, pred);

        if (!match && recursive) {
            _.each(this.subviews, subview => {
                match = subview.getFirstSubviewByPredicate(pred, true);
                if (match) {
                    return false;
                }
            });
        }

        return match;
    }

    /**
     * Finds the first subview with a matching `.id`.
     */

    findSubviewById(id, recursive = true) {
        return this.getFirstSubviewByPredicate(_.matchesProperty('id', id), recursive);
    }

    /**
     * Returns the z-index of this view.
     *
     * The z-index is 0 for the subview furthest to the back, and is
     * incremented by one for each subview in front.
     *
     * Returns -1 if this view has no superview.
     */

    get zIndex() {
        return !this.superview ? -1 : this.superview.indexOf(this);
    }

    /**
     * Makes this view the top-most subview of its superview
     * meaning it is rendered last.
     *
     * Since subviews are rendered from oldest added to
     * most recently added, there's an implicit Z ordering
     * more recent subviews are rendered atop older subviews.
     */

    bringToFront(subview) {
        var index = this.subviews.indexOf(subview);
        if (index !== -1) {
            this.subviews.splice(index, 1);
            this.subviews.push(subview);
        }

        return this;
    }

    /**
     * Makes this view the bottom-most subview of its superview.
     */

    moveToBack(subview) {
        var index = this.subviews.indexOf(subview);
        if (index !== -1) {
            this.subviews.splice(index, 1);
            this.subviews.unshift(subview);
        }

        return this;
    }


    get needsLayout() {
        return this._needsLayout;
    }

    /**
     * Mark the view as needing to be laid out.
     */

    set needsLayout(needsIt = true) {
        if (this._needsLayout !== needsIt) {
            this._needsLayout = needsIt;
            viewNeedsLayout(this, needsIt);
        }
    }

    /**
     * Layout the subviews of this view if it is currently
     * marked as needing layout.
     */

    layoutIfNeeded() {
        if (this._needsLayout) {
            this.layoutSubviews();
            this.needsLayout = false;
            this.didLayoutSubviews();
        }
        return this;
    }

    /**
     * This view is asked to layout its subviews.
     */

    layoutSubviews() {
        _.each(this.subviews, subview => subview.layoutSubviews());
    }

    didLayoutSubviews() {
        this.emit('didLayoutSubviews');
    }

    get needsDisplay() {
        return this._needsDisplay;
    }

    set needsDisplay(needsIt) {
        this._needsDisplay = needsIt;
        if (needsIt) {
            queueRunLoopIteration();
        }
    }

    /**
     * The user touched down inside this view's frame.
     *
     * Events:
     * - touchStart(localPoint)
     */

    touchStart(localPoint) {
        if (!this.userInteractionEnabled) {
            return;
        }

        this._touchCanceled = false;

        if (this.highlightsOnTouch) {
            this.highlighted = true;
        }

        this.emit('touchStart', localPoint);

        this._touchStartPoint = localPoint;

        this._longPressTimeout = setTimeout(this.longPressed.bind(this, localPoint), 700);

        this.needsDisplay = true;
    }

    /**
     * The user touched down inside this view's frame previously
     * and without lifting the finger, has moved the finger inside while
     * still inside this view's frame.
     *
     * This is not called if this view is draggable.
     */

    touchMove(localPoint) {
        if (!this.userInteractionEnabled) {
            return;
        }

        this.emit('touchMove', localPoint);

        this.needsDisplay = true;

        if (this._touchStartPoint && distanceSquared(this._touchStartPoint, localPoint) > 10)
            clearTimeout(this._longPressTimeout);
    }

    /**
     * The user touched down inside this view's frame
     * and then touched up inside this view's frame.
     *
     * Events:
     * - tap(localPoint, tapCount)
     */

    tapped(localPoint) {
        if (this._touchCanceled) {
            return;
        }

        this.needsDisplay = true;

        let now = +new Date();

        if (this._timeOfLastTap === null) {
            this._timeOfLastTap = now;
        }

        if (this._tapCount === null) {
            this._tapCount = 1;
        }

        // Tapping this view again within this many milliseconds;
        // of a previous tap on this view is considered a multi-tap.;

        let multiTapContinueMS = 300;

        // If this is an additional tap within a short timeout;
        // period, note it.

        let dt = now-this._timeOfLastTap;
        if (dt > 0 && dt < multiTapContinueMS) {
            this._tapCount++;
            this._timeOfLastTap = now;
            this.multiTapped(localPoint, this._tapCount);
        }

        // When no subsequent taps arrive on this view,
        // stop counting multi-taps.

        clearTimeout(this._multiTapTimeout);
        this._multiTapTimeout = setTimeout(() => {
            this._timeOfLastTap = null;
            this._tapCount = null;
        }, multiTapContinueMS);

        this.emit('tap', localPoint, this._tapCount);
    }

    /**
     * This view was tapped more than once within a short timeout window.
     * Called each time the view is tapped an additional time beyond the first
     * tap.
     * Note that `tapped` is called (and thus, `onTap` is triggered) for each
     * tap.
     *
     *     Tap #      Calls
     *     ------------------------------------------------------
     *     1          tapped(point)
     *     2          tapped(point), multiTapped(point, 2)
     *     ...        ...
     *     n          tapped(point), multiTapped(point, n)
     */

    multiTapped(/*localPoint, times*/) {
    }

    /**
     * The user touched down inside this view's frame
     * and then touched up inside or outside this view's frame.
     *
     * Always called even if the view was tapped or dragged.
     *
     * Events:
     * - touchEnd(localPoint)
     */

    touchEnd(/*localPoint*/) {
        this.highlighted = false;
        clearTimeout(this._longPressTimeout);
        this.emit('touchEnd');
        this.needsDisplay = true;
    }

    /**
     * This view was touched but the touchEnd will not be forthcoming.
     */

    touchCancel() {
        this.highlighted = false;
        clearTimeout(this._longPressTimeout);
        this._touchCanceled = true;
        this.needsDisplay = true;
        this.emit('touchCancel');
    }

    /**
     * The user touched and kept touching this view for a long time.
     *
     * This is a "long press" gesture.
     *
     * Events:
     * - onLongPressed(localPoint)
     */

    longPressed(localPoint) {
        this._touchCanceled = true;
        this.emit('longPressed', localPoint);
    }

    /**
     * Registers an animation with this view, optionally creating the
     * `Animation` object, and starts the animation.
     *
     * When called as `addAnimation(props, opts)`, an `Animation`
     * is created from `props`.
     *
     * When called as `addAnimation(animationObj)`, the default
     * options are `{doNotStart: false}`.
     *
     * The `Animation` object is returned.  You can add event listeners
     * to it for `update`, `complete`, etc.
     */

    addAnimation(anim, opts) {
        if (_.isPlainObject(anim) && !opts) {
            opts = _.merge({target: this}, anim);
            anim = new Animation(opts);
        } else if (!anim.target) {
            anim.target = this;
        }

        opts = opts || {};

        if (this._animations === null) {
            this._animations = {};
        }

        if (_.isEmpty(anim.name)) {
            throw new Error('anim name must be set');
        }

        if (_.has(this._animations, anim.name)) {
            if (!opts.failIfExists) {
                this._animations[anim.name].stop();
            } else {
                throw new Error(`${this.id} has anim "${anim.name}" already`);
            }
        }

        this._animations[anim.name] = anim;

        anim.once('complete', (/*finished*/) => {
            this.removeAnimationWithName(anim.name);
            this.emit('animationCompleted', anim);
        });

        this.emit('animationAdded', anim);

        if (!opts.doNotStart) {
            anim.start();
            this.emit('animationStarted', anim);
        }

        this.needsDisplay = true;
        return anim;
    }

    /**
     * Removes an animation by name.
     *
     * There is no "pause" of an animation.
     */

    removeAnimationWithName(name) {
        if (_.has(this._animations, name)) {
            let animation = this._animations[name];
            animation.stop();
            delete this._animations[name];
        }

        return this;
    }

    /**
     * Removes all animations registered on this view.
     */

    removeAllAnimations() {
        _.each(this._animations, (anim, name) => this.removeAnimationWithName(name));
        return this;
    }

    hasAnimation(name) {
        return _.has(this._animations, name);
    }

    /**
     * Enable/disable dragging of this view.
     *
     * Events:
     * - onDragStarted: dragging of this view has begun.
     * - onDragUpdated: this view is being dragged.
     * - onDragEnded: this view was dropped on itself.
     * - onDropRejected: this view was dropped but the target view rejected it.
     * - onDropAccepted: this view was dropped on another view.
     */

    get draggable() {
        return this._draggable;
    }

    set draggable(on) {
        this._draggable = on;
    }

    /**
     * Enables dropping of views on this view.
     *
     * This view can still decide whether or not a dragged
     * view may be dropped on it in `acceptsDroppedView`.
     *
     * Events:
     * - onDropReceived: an accepted view was dropped on this view.
     * - onDropMightBeReceived: an accepted view hovers atop this view.
     * - onDropWillNotBeReceived: an accepted view leaves this view's frame.
     */

    get acceptsDroppedViews() {
        return this._acceptsDroppedViews;
    }

    set acceptsDroppedViews(on) {
        this._acceptsDroppedViews = on;
    }

    /**
     * This view has started being dragged.
     */

    draggingStarted(superviewPoint) {
        this.lastDragPoint = superviewPoint;
        this.emit('dragStarted', this.lastDragPoint);
        this.needsDisplay = true;
    }

    /**
     * This view was dragged to a new point in its superview space.
     */

    draggingUpdate(superviewPoint) {
        if (this.lastDragPoint) {
            this.position.addSelf(superviewPoint.sub(this.lastDragPoint));
            this.emit('dragUpdated', superviewPoint);
            this.lastDragPoint.copy(superviewPoint);
            this.needsDisplay = true;
        }
    }

    /**
     * This view was dragged but that is all done with now.
     */

    draggingEnded(superviewPoint) {
        this.emit('dragEnded', superviewPoint);
        this.needsDisplay = true;
    }

    /**
     * A dragged view is about to be dropped on this view.
     * If this view wishes to accept the dragged view, this should
     * return true.
     */

    acceptsDroppedView(/*otherView, localPoint*/) {
        return this.userInteractionEnabled;
    }

    /**
     * This view was dropped on another view.
     * The other view accepted the drop attempt.
     */

    wasAcceptedAsDroppedView(toOtherView/*, otherViewPoint*/) {
        this.emit('dropAccepted', toOtherView);
    }

    /**
     * This view was dropped on another view.
     * The other view rejected the drop attempt.
     */

    wasRejectedAsDroppedView(byOtherView/*, otherViewPoint*/) {
        this.emit('dropRejected', byOtherView);
    }

    /**
     * This view accepts the given view as a dropped view
     * but the view has not yet been dropped.
     *
     * This would be a good time to show an animation
     * if desired (e.g. scale up to show this view is ready
     * or similar).
     */

    mightReceiveDroppedView(view, localPoint) {
        this.emit('dropMightBeReceived', view, localPoint);
    }

    /**
     * This view accepts the given view as a dropped view
     * but the view was dragged outside this view's frame
     * and thus won't be dropped (at least immediately; the
     * view can be dragged back into this view's frame of course
     * during the same operation).
     *
     * This would be a good time to play an animation if desired
     * (e.g. scale back to normal scale).
     */

    willNotReceiveDroppedView(view) {
        this.emit('dropWillNotBeReceived', view);
    }

    /**
     * A dragged view was accepted by this view and is being dropped
     * on this view.
     */

    droppedViewWasReceived(droppedView, localPoint) {
        this.emit('dropReceived', droppedView, localPoint);
    }

    /**
     * The view is asked to draw itself into this given context.
     */

    redraw(context) {
        if (this.hidden) {
            return;
        }

        // While we layout in the update loop, it is possible for a
        // layout to be required during drawing of other views.;

        this.layoutIfNeeded();

        context.save();

        // Origin is the top-left corner of the view's frame.

        let pos = this.position;
        context.translate(pos.x, pos.y);

        // Scaling and rotation are performed about the view's center.

        let scale = this.scale,
            angle = this.angle;

        if (scale.x !== 1 || scale.y !== 1 || angle !== 0) {
            let cx = this.halfWidth,
                cy = this.halfHeight;

            context.translate(cx, cy);

            if (scale.x !== 1 || scale.y !== 1) {
                context.scale(scale.x, scale.y);
            }

            if (angle !== 0) {
                context.rotate(angle);
            }

            context.translate(-cx, -cy);
        }

        this.addShapePath(context);

        let clips = this.clipsSubviews;

        if (clips) {
            context.save();
            context.clip();
        }

        // Set font after save() so that subviews inherit the font
        // if they don't override it

        let font = this.font;
        if (font) {
            context.font = font;
        }

        // Alpha of this view is a multiplier of superview alpha.;
        // e.g. 0.5 means 50% transparent **relative to superview alpha**;

        context.globalAlpha *= this.alpha;

        let drawMode = this.drawMode;
        if (drawMode) {
            context.globalCompositeOperation = drawMode;
        } else {
            context.globalCompositeOperation = 'source-over';
        }

        this.draw(context);

        this.subviews.forEach(subview => subview.redraw(context));

        if (clips) {
            context.restore();
        }

        context.shadowColor   = null;
        context.shadowBlur    = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;

        // Draw the border atop the subviews, and after any clipping
        // else we'd only see the portion of the border on the inside of the shape.

        if (this.borderColor && this.borderWidth) {
            // Note that the current path is not a part of the saved state so we
            // must re-add the view's shape before we can draw it's border.
            // https://html.spec.whatwg.org/multipage/scripting.html#the-canvas-state

            if (!_.isArray(this.borderColor) && !_.isArray(this.borderWidth))
                this.addShapePath(context);

            // If these properties are arrays, we have to draw the border's
            // sides independently.  Thus, don't use a custom shape and an array
            // for borderWidth/Color; just use the default rectangular shape.

            this.drawBorder(context);
        }

        this.postDraw(context);

        context.restore();
    }

    /**
     * Add the shape of this view to the rendering context.
     *
     * By default the shape of a view is a rounded rectange if the view's
     * `cornerRadius` is greater than 0 or a rectangle if the `cornerRadius`
     * equals 0.
     */

    addShapePath(context) {
        let cr = this.cornerRadius;

        if (_.isArray(cr) || cr > 0) {
            context.roundRect(0, 0, this.width, this.height, cr);
        } else {
            context.beginPath();
            context.rect(0, 0, this.width, this.height);
            context.closePath();
        }
    }

    /**
     * The view is asked to draw itself.
     */

    draw(context) {
        context.shadowColor   = null;
        context.shadowBlur    = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;

        let bg = this.backgroundColor;
        if (bg) {
            context.fillStyle = bg;

            if (View.shadowsEnabled && this.shadowColor) {
                context.shadowColor   = this._shadowColor;
                context.shadowBlur    = this._shadowBlur;
                context.shadowOffsetX = this._shadowOffsetX;
                context.shadowOffsetY = this._shadowOffsetY;
            }

            context.fill();
        } else {
            context.clearRect(0, 0, this.width, this.height);
        }
    }

    /**
     * The view is asked to draw its border if any.
     *
     * Note that clipping is disabled at this point.
     */

    drawBorder(context) {
        var width = this.borderWidth,
            color = this.borderColor;

        // Expand both to arrays if either are arrays.
        // [top, left, bottom, right]

        let widthIsArray = _.isArray(width),
            colorIsArray = _.isArray(color);

        var expanded;

        if (widthIsArray && !colorIsArray) {
            expanded = [color, color, color, color];
            color = expanded;
            colorIsArray = true;
        } else if (!widthIsArray && colorIsArray) {
            expanded = [width, width, width, width];
            width = expanded;
            widthIsArray = true;
        }

        if (widthIsArray) {
            // TODO take cornerRadius into account.

            let topBorderWidth    = width[0],
                leftBorderWidth   = width[1],
                bottomBorderWidth = width[2],
                rightBorderWidth  = width[3];

            let top    =               topBorderWidth    / 2,
                left   =               leftBorderWidth   / 2,
                bottom = this.height - bottomBorderWidth / 2,
                right  = this.width  - rightBorderWidth  / 2;

            if (topBorderWidth > 0) {
                context.beginPath();
                context.moveTo(left, top);
                context.lineTo(right, top);
                context.lineWidth = width[0];
                context.strokeStyle = color[0];
                context.stroke();
            }

            if (leftBorderWidth > 0) {
                context.beginPath();
                context.moveTo(left, top);
                context.lineTo(left, bottom);
                context.lineWidth = width[1];
                context.strokeStyle = color[1];
                context.stroke();
            }

            if (bottomBorderWidth > 0) {
                context.beginPath();
                context.moveTo(left, bottom);
                context.lineTo(right, bottom);
                context.lineWidth = width[2];
                context.strokeStyle = color[2];
                context.stroke();
            }

            if (rightBorderWidth > 0) {
                context.beginPath();
                context.moveTo(right, top);
                context.lineTo(right, bottom);
                context.lineWidth = width[3];
                context.strokeStyle = color[3];
                context.stroke();
            }
        } else {
            context.lineWidth = width;
            context.strokeStyle = color;
            context.stroke();
        }
    }

    /**
     * Called after all drawing on this view and its subviews is done.
     */

    postDraw(context) {
        if (this._debugMode || this.highlighted) {
            this.addShapePath(context);
        }

        if (this.highlighted) {
            context.fillStyle = this.highlightColor;
            context.fill();
        }

        if (this._debugMode) {
            this.drawDebugOverlays(context);
        }
    }

    drawDebugOverlays(context) {
        if (this.superview) {
            context.globalAlpha = 0.7;

            this.drawDebugBorder(context);
            //this.drawDebugCenterIndicators(context);
            this.drawDebugContentFrame(context);
            this.drawDebugToString(context);

            context.globalAlpha = 1;
        }
    }

    drawDebugBorder(context) {
        context.strokeStyle = 'orange';
        context.lineWidth = 1;
        context.setLineDash([2]);
        context.stroke();
    }

    drawDebugCenterIndicators(context) {
        context.strokeStyle = '#f00';
        context.beginPath();
        context.moveTo(this.center.x, 0);
        context.lineTo(this.center.x, this.height);
        context.moveTo(0, this.center.y);
        context.lineTo(this.width, this.center.y);
        context.closePath();
        context.stroke();
    }

    drawDebugContentFrame(context) {
        let contentFrame = this.contentFrame;
        context.strokeStyle = '#00f';
        context.beginPath();
        context.rect(contentFrame.origin.x, contentFrame.origin.y,
                     contentFrame.size.width, contentFrame.size.height);
        context.closePath();
        context.stroke();
    }

    drawDebugToString(context) {
        let text = this.toString();
        context.font = SystemFontOfSize(7);
        context.beginPath();
        context.rect(0, 0, context.measureText(text).width, 15);
        context.closePath();
        context.fillStyle = '#ff0';
        context.fill();

        context.fillStyle = '#000';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(text, 0, 0);
    }

    /**
     * Returns the deepest hit view or subview of this view
     * that contains the point `point` which is in the coordinate
     * system of this view.
     *
     * Returns `[hitView, hitViewLocalPoint]`.
     *
     * `hitView` will be null if the point is not inside this view
     * nor any of its subviews.
     */

    hitTest(point) {
        if (this.hidden || !this.userInteractionEnabled) {
            return [null, null];
        }

        if (point.x < 0 ||
            point.x > this.width ||
            point.y < 0 ||
            point.y > this.height) {

            return [null, null];
        }

        for (var n = this.subviews.length, i = n - 1; i >= 0; --i) {
            let subview = this.subviews[i],
                subviewPoint = subview.convertSuperviewToLocal(point),
                [subviewViewHit, subviewViewHitPoint] = subview.hitTest(subviewPoint);

            if (subviewViewHit) {
                return [subviewViewHit, subviewViewHitPoint];
            }
        }

        return [this, point];
    }

    /**
     * Returns a point in this view's superview coordinate system
     * tranformed to this view's coordinate system.
     */

    convertSuperviewToLocal(superviewPoint) {
        return superviewPoint.sub(this._frame.origin);
    }

    /**
     * Returns a point in this view's coordinate system
     * tranformed to this view's superview coordinate system.
     */

    convertLocalToSuperview(localPoint) {
        return localPoint.add(this._frame.origin);
    }

    /**
     * Returns a point in this view's root view coordinate system
     * tranformed to this view's coordinate system.
     */

    convertRootToLocal(point) {
        var ancestors = this.ancestorViews(),
            p = point.clone();

        // point in root view space so skip the transformation on that one.
        // [ superview, super-superview, ..., rootView ];

        for (var n = ancestors.length, i = n - 2; i >= 0; --i) {
            p = ancestors[i].convertSuperviewToLocal(p);
        }

        // this view is not one of its ancestors.;

        return this.convertSuperviewToLocal(p);
    }

    /**
     * Returns a point in this view's view coordinate system
     * tranformed to this view's root view coordinate system.
     */

    convertLocalToRoot(point) {
        var curr = this,
            p = point.clone();

        while (curr.superview) {
            p = curr.convertLocalToSuperview(p);
            curr = curr.superview;
        }

        return p;
    }

    /**
     * Converts a point in the coordinate system of an arbitrary view to that of
     * the local view, even if the other view has a different immediate superview
     * than the local view.
     */

    convertOtherToLocal(view, pointInView) {
        return this.convertRootToLocal(view.convertLocalToRoot(pointInView));
    }

    /**
     * Converts a point in the coordinate system of an arbitrary view to that of
     * this view's superview.
     */

    convertOtherToSuperview(view, pointInView) {
        if (view.superview === this.superview) {
            return view.convertLocalToSuperview(pointInView);
        }

        return this.convertLocalToSuperview(this.convertOtherToLocal(view, pointInView));
    }

    /**
     * Converts a point in the local coordinate system to that of
     * the another view, even if the other view has a different immediate superview
     * than the local view.
     */

    convertLocalToOther(localPoint, view) {
        return view.convertRootToLocal(this.convertLocalToRoot(localPoint));
    }

    /**
     * Returns the top-left corner of this view's frame.
     */

    get position() {
        return this._frame.origin;
    }

    /**
     * Updates the top-left corner of this view's frame
     * to the given point in superview coordinates.
     */

    set position(point) {
        this._frame.origin.copy(point);
    }

    /**
     * Returns the size of this view's frame.
     */

    get size() {
        return this._frame.size;
    }

    /**
     * Updates this view's size.
     */

    set size(size) {
        this._frame.size.copy(size);
    }

    /**
     * Updates this view's size.
     */

    resize(w, h) {
        this._frame.size.set(w, h);
        return this;
    }

    /**
     * Returns this view's frame in local coordinates.
     */

    get bounds() {
        return Frame.makeFrame(0, 0, this.width, this.height);
    }

    /**
     * Returns the top edge coordinate of this view's frame.
     */

    get top() {
        return this.position.y;
    }

    /**
     * Updates the top edge coordinate of this view's frame.
     *
     * `top` is a value in this view's superview coordinate system.
     */

    set top(top) {
        this._frame.origin.y = Math.round(top);
    }

    setTop(top) {
        this.top = top;
        return this;
    }

    /**
     * Returns the top edge coordinate of this view's frame.
     */

    get bottom() {
        return this.position.y + this.height;
    }

    /**
     * Updates the bottom edge coordinate of this view's frame.
     *
     * `bottom` is a value in this view's superview coordinate system.
     */

    set bottom(bottom) {
        this._frame.origin.y = bottom - this.height;
    }

    setBottom(bottom) {
        this.bottom = bottom;
        return this;
    }

    /**
     * Returns the top edge coordinate of this view's frame.
     */

    get left() {
        return this.position.x;
    }

    /**
     * Updates the left edge coordinate of this view's frame.
     *
     * `left` is a value in this view's superview coordinate system.
     */

    set left(left) {
        this._frame.origin.x = Math.round(left);
    }

    setLeft(left) {
        this.left = left;
        return this;
    }

    /**
     * Returns the top edge coordinate of this view's frame.
     */

    get right() {
        return this.position.x + this.width;
    }

    /**
     * Updates the right edge coordinate of this view's frame.
     *
     * `right` is a value in this view's superview coordinate system.
     */

    set right(right) {
        this._frame.origin.x = Math.round(right - this.width);
    }

    setRight(right) {
        this.right = right;
        return this;
    }

    /**
     * Returns the width of this view's frame.
     */

    get width() {
        return this._frame.size.width;
    }

    /**
     * Grows or shrinks this view's frame have the given width.
     */

    set width(width) {
        this._frame.size.set(Math.round(width), this.height);
    }

    setWidth(width) {
        this.width = width;
        return this;
    }

    /**
     * Returns half the width of this view's frame.
     */

    get halfWidth() {
        return Math.round(this._frame.size.width/2);
    }

    /**
     * Returns the width of this view's frame.
     */

    get height() {
        return this._frame.size.height;
    }

    /**
     * Grows or shrinks this view's frame have the given height.
     */

    set height(height) {
        this._frame.size.set(this.width, Math.round(height));
    }

    setHeight(height) {
        this.height = height;
        return this;
    }

    /**
     * Returns half the height of this view's frame.
     */

    get halfHeight() {
        return Math.round(this._frame.size.height/2);
    }

    /**
     * Update this view's rectangle to enclose all of its subviews
     */

    encloseSubviews() {
        var minX =  Infinity,
            minY =  Infinity,
            maxX = -Infinity,
            maxY = -Infinity;

        _.each(this.subviews, subview => {
            minX = Math.min(minX, subview.left);
            minY = Math.min(minY, subview.top);
            maxX = Math.max(maxX, subview.right);
            maxY = Math.max(maxY, subview.bottom);
        });

        this.position = this.convertLocalToSuperview(new Point(minX, minY));

        this._frame.size.set(maxX - minX, maxY - minY);
    }

    /**
     * Move this view to be above the given view with optional offset.
     */

    moveAbove(view, offset = 0) {
        this.bottom = Math.round(view.top + offset);
        return this;
    }

    /**
     * Move this view to be below the given view with optional offset.
     */

    moveBelow(view, offset = 0) {
        this.top = Math.round(view.bottom + offset);
        return this;
    }

    /**
     * Move this view to the left of the given view with optional offset.
     */

    moveLeftOf(view, offset = 0) {
        this.right = Math.round(view.left + offset);
        return this;
    }

    /**
     * Move this view to the right of the given view with optional offset.
     */

    moveRightOf(view, offset = 0) {
        this.left = Math.round(view.right + offset);
        return this;
    }

    moveToLeftTop(offset = PointZero) {
        if (this.superview) {
            this.left = Math.round(this.superview.contentLeft + offset.x);
            this.top = Math.round(this.superview.contentTop + offset.y);
        }
        return this;
    }

    moveToCenterTop(offset = PointZero) {
        if (this.superview) {
            this.centerX = Math.round(this.superview.contentCenterX + offset.x);
            this.top = Math.round(this.superview.contentTop + offset.y);
        }
        return this;
    }

    moveToRightTop(offset = PointZero) {
        if (this.superview) {
            this.top = Math.round(this.superview.contentTop + offset.y);
            this.right = Math.round(this.superview.contentRight + offset.x);
        }
        return this;
    }

    moveToLeftMiddle(offset = PointZero) {
        if (this.superview) {
            this.left = Math.round(this.superview.contentLeft + offset.x);
            this.centerY = Math.round(this.superview.contentCenterY + offset.y);
        }
        return this;
    }

    moveToCenterMiddle(offset = PointZero) {
        if (this.superview) {
            this.center = this.superview.center.add(offset);
        }
        return this;
    }

    moveToRightMiddle(offset = PointZero) {
        if (this.superview) {
            this.right = Math.round(this.superview.contentRight + offset.x);
            this.centerY = Math.round(this.superview.contentCenterY + offset.y);
        }
        return this;
    }

    moveToLeftBottom(offset = PointZero) {
        if (this.superview) {
            this.bottom = Math.round(this.superview.contentBottom + offset.y);
            this.left = Math.round(this.superview.contentLeft + offset.x);
        }
        return this;
    }

    moveToCenterBottom(offset = PointZero) {
        if (this.superview) {
            this.bottom = Math.round(this.superview.contentBottom + offset.y);
            this.centerX = Math.round(this.superview.contentCenterX + offset.x);
        }
        return this;
    }

    moveToRightBottom(offset = PointZero) {
        if (this.superview) {
            this.bottom = Math.round(this.superview.contentBottom + offset.y);
            this.right = Math.round(this.superview.contentRight + offset.x);
        }
        return this;
    }

    /**
     * Sets the left edge of this view's frame to that of the given view, plus
     * an optional offset.
     *
     * Assumes that `view` has the same superview as this view.
     */

    alignLeft(view, offset = 0) {
        this.left = Math.round(view.left + offset);
        return this;
    }

    /**
     * Sets the right edge of this view's frame to that of the given view, plus
     * an optional offset.
     *
     * Assumes that `view` has the same superview as this view.
     */

    alignRight(view, offset = 0) {
        this.right = Math.round(view.right + offset);
        return this;
    }

    /**
     * Sets the top edge of this view's frame to that of the given view, plus
     * an optional offset.
     *
     * Assumes that `view` has the same superview as this view.
     */

    alignTop(view, offset = 0) {
        this.top = Math.round(view.top + offset);
        return this;
    }

    /**
     * Sets the bottom edge of this view's frame to that of the given view, plus
     * an optional offset.
     *
     * Assumes that `view` has the same superview as this view.
     */

    alignBottom(view, offset = 0) {
        this.bottom = Math.round(view.bottom + offset);
        return this;
    }

    /**
     * Sets the vertical center coordinate of this view's frame to that of the
     * given view, plus an optional offset.
     */

    alignVerticalCenter(view, offset = 0) {
        this.top = Math.round(this.convertOtherToSuperview(view, view.center).y - this.halfHeight + offset);
        return this;
    }

    /**
     * Sets the horizontal center coordinate of this view's frame to that of the
     * given view, plus an optional offset.
     */

    alignHorizontalCenter(view, offset = 0) {
        this.left = Math.round(this.convertOtherToSuperview(view, view.center).x - this.halfWidth + offset);
        return this;
    }

    /**
     * Sets the horizontal and vertical center of this view's frame to that of the
     * given view, plus an optional offset.
     */

    alignCenter(view, offset = PointZero) {
        this.alignHorizontalCenter(view, offset.x);
        return this.alignVerticalCenter(view, offset.y);
    }

    /**
     * Sets this view's frame to that of the given view, plus an optional offset.
     */

    align(view, offset = PointZero) {
        this._frame.copy(view.frame);

        if (offset !== PointZero) {
            this._frame.origin.addSelf(offset);
        }

        return this;
    }

    /**
     * Sets the width of this view's frame to that of the given view,
     * plus an optional offset.
     */

    makeSameWidth(view, offset = 0) {
        this.width = Math.round(view.width + offset);
        return this;
    }

    /**
     * Sets the height of this view's frame to that of the given view,
     * plus an optional offset.
     */

    makeSameHeight(view, offset = 0) {
        this.height = Math.round(view.height + offset);
        return this;
    }

    /**
     * Sets the width and height of this view's frame to that of the given view,
     * plus an optional offset.
     */

    makeSameSize(view) {
        this.makeSameWidth(view);
        this.makeSameHeight(view);
        return this;
    }

    /**
     * From this view's current position, update the width of this view's frame
     * to fill the space to its right to the right edge of the superview's content frame,
     * less an optional margin.
     *
     * This does not take into account other sibling views that might be "in the way".
     */

    fillWidth(margin = 0) {
        this.width = this.superview.contentRight - margin - this.left;
        return this;
    }

    /**
     * From this view's current position, update the height of this view's frame
     * to fill the space below to the bottom edge of the superview's content frame,
     * less an optional margin.
     *
     * This does not take into account other sibling views that might be "in the way".
     */

    fillHeight(margin = 0) {
        this.height = this.superview.contentBottom - margin - this.top;
        return this;
    }

    /**
     * Fill both width and height.
     */

    fillBoth(margin = 0) {
        return this.fillWidth(margin).fillHeight(margin);
    }

    /**
     * Returns the point in the center of this view in local coordinates.
     */

    get center() {
        return new Point(this.halfWidth, this.halfHeight);
    }

    /**
     * Position the view such that it is centered about the given
     * point in this view's superview coordinate system.
     */

    set center(point) {
        this.left = Math.round(point.x - this.halfWidth);
        this.top  = Math.round(point.y - this.halfHeight);
        return this;
    }

    get centerX() {
        return this.left + this.halfWidth;
    }

    get centerY() {
        return this.top + this.halfHeight;
    }

    set centerX(x) {
        this.left = Math.round(x - this.halfWidth);
        return this;
    }

    set centerY(y) {
        this.top = Math.round(y - this.halfHeight);
        return this;
    }

    /**
     * Returns the point in the center of this view in superview coordinates.
     */

    get centerInSuperview() {
        return this.convertLocalToSuperview(this.center);
    }

    /**
     * A view's "content frame" is the frame inset from the view's frame
     * by the view's edge insets.
     */

    get contentTop() {
        return this.insets.top;
    }

    get contentBottom() {
        return this.size.height - this.insets.bottom;
    }

    get contentLeft() {
        return this.insets.left;
    }

    get contentRight() {
        return this.size.width - this.insets.right;
    }

    get contentWidth() {
        let insets = this.insets;
        return Math.max(0, this.size.width - insets.right - insets.left);
    }

    get contentHeight() {
        let insets = this.insets;
        return Math.max(0, this.size.height - insets.bottom - insets.top);
    }

    set contentWidth(w) {
        this.width = this.insets.left + w + this.insets.right;
    }

    set contentHeight(h) {
        this.height = this.insets.top + h + this.insets.bottom;
    }

    get contentFrame() {
        return Frame.makeFrame(this.contentLeft, this.contentTop,
                               this.contentWidth, this.contentHeight);
    }

    /**
     * Returns the point located at the center of this view's content frame.
     */

    get contentCenter() {
        return new Point(this.contentCenterX, this.contentCenterY);
    }

    get contentCenterX() {
        return this.contentLeft + this.contentWidth/2;
    }

    get contentCenterY() {
        return this.contentTop + this.contentHeight/2;
    }

    /**
     * Sizes the content frame to tightly fit the view's content.
     */

    sizeToFit() {
    }

    /**
     * You may request that this view's `update` method be called
     * once a frame by setting `needsUpdate` to `true`.
     * When done, be sure to set `needsUpdate` to `false`.
     */

    get needsUpdate() {
        return this._needsUpdate;
    }

    set needsUpdate(needsIt) {
        this._needsUpdate = needsIt;
        viewNeedsUpdate(this, needsIt);
    }

    /**
     * Update the internal state of the view.
     *
     * For subclasses to override.
     */

    update() {}

    toString() {
        let className = this.constructor.name,
            id = this.id !== undefined && `#${this.id}` || '',
            frameDesc = this._frame.toString(),
            flags = [];

        if (this._needsLayout) {
            flags.push('layout');
        }

        if (this._needsUpdate) {
            flags.push('update');
        }

        if (this._clipsSubviews) {
            flags.push('clips');
        }

        if (this._hidden) {
            flags.push('hidden');
        }

        if (!this._userInteractionEnabled) {
            flags.push('disabled');
        }

        return `<${className}${id}@${frameDesc}[${flags.join(',')}]>`;
    }

    dumpHierarchy(indent = '') {
        console.log(indent + this.toString());

        let subviewIndent = indent + '    ';

        for (var i = 0, n = this.subviews.length; i < n; ++i) {
            this.subviews[i].dumpHierarchy(subviewIndent);
        }
    }

    /**
     * This view and all its ancestors must have user interaction enabled
     * for this view to potentially become the first responder.
     */

    canBecomeFirstResponder() {
        var curr = this;

        while (curr) {
            if (!curr.userInteractionEnabled) {
                return false;
            }

            curr = curr.superview;
        }

        return true;
    }

    /**
     * This view is to become the first responder if possible.
     */

    becomeFirstResponder() {
        if (this.isFirstResponder()) {
            return true;
        }

        if (!this.canBecomeFirstResponder()) {
            return false;
        }

        let firstResponderBefore = View.firstResponder;
        if (firstResponderBefore) {
            firstResponderBefore.willResignFirstResponder(this);
        }

        this.willBecomeFirstResponder();
        View.firstResponder = this;
        this.didBecomeFirstResponder();

        if (firstResponderBefore) {
            firstResponderBefore.didResignFirstResponder();
        }

        View.globalEvents.emit('firstResponderDidChange', firstResponderBefore, this);

        return true;
    }

    /**
     * This view will no longer be the first responder.
     * Its superview will be instead.
     * Note that if a first responder is removed from its superview,
     * if auto-resigns first responder status (see willBeRemovedFromView).
     */

    resignFirstResponder() {
        if (this.isFirstResponder()) {
            let nextResponder = this.nextResponder();
            if (nextResponder) {
                nextResponder.becomeFirstResponder();
            } else {
                this.willResignFirstResponder();
                View.firstResponder = null;
                this.didResignFirstResponder();
            }
        }
    }

    isFirstResponder() {
        return View.firstResponder === this;
    }

    willBecomeFirstResponder() {
    }

    didBecomeFirstResponder() {
        this.emit('didBecomeFirstResponder');
    }

    willResignFirstResponder(nextFirstResponder) {
    }

    didResignFirstResponder() {
        this.emit('didResignFirstResponder');
    }

    /**
     * We only support a default responder chain that bubbles up
     * to this view's superview.
     *
     * Subclasses can override this if needed.
     */

    nextResponder() {
        return this.superview;
    }

    /**
     * A key was pressed on some keyboard while this view or a descendent was first responder.
     *
     * `key` is a length-1 string for a character to be inserted at the current position.
     * Otherwise, `key` is expected to be a key name like:
     * 'Help', 'Backspace', 'Tab', 'Escape', 'Shift', 'Control', 'Alt',
     * 'Pause', 'CapsLock', 'Enter', 'PageUp', 'PageDown', 'End', 'Home',
     * 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Delete', 'F1', 'F2',
     * 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
     */

    keyPressed(key, ctrlKey, shiftKey, metaKey, altKey) {
        this.emit('keyPressed', key, ctrlKey, shiftKey, metaKey, altKey);

        if (this.superview) {
            this.superview.keyPressed(key, ctrlKey, shiftKey, metaKey, altKey);
        }
    }

    log(...args) {
        console.log(this.id, '@', new Date(), '|', ...args);
    }
}

/**
 * Events:
 * - firstResponderDidChange(oldFirstResponder, newFirstResponder)
 */

View.globalEvents = new EventEmitter();

View.shadowsEnabled = true; //!isMobile();
