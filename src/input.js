import  Point from './Point';
import ScrollView from './ScrollView';
import View from './View';
import {getCanvas, getRootView} from './core';

// Pointer (mouse, touch)

var trackedView,
    isDragging,
    scrollContentView,
    dropTargetView;

/**
 * Transforms a point in document or page coordinates to canvas coordinates.
 */

function pageToCanvas(x, y) {
    let canvas = getCanvas();
    return new Point(x - canvas.offsetLeft, y - canvas.offsetTop);
}

/**
 * Finds a scroll view that is an ancestor of the given view.
 */

function findScrollViewAncestor(view) {
    var curr = view;

    while (curr) {
        if (curr instanceof ScrollView &&
            curr.userInteractionEnabled) {
            return curr.contentView;
        }

        curr = curr.superview;
    }
}

// Where the pointer (touch, mouse) is on press/down.

var rootPointerDownPoint;

// How touch works in a view with a ScrollView for one of its superviews:
//
// A pointer down event atop a view that's visible and "hit" by the localized
// pointer location becomes the "tracked view".
//
// If the user then drags the pointer (finger, mouse) far enough
// (`startScrollingDistance`) and one of the superviews of the tracked view is
// a `ScrollView`, the touch is canceled, scrolling begins, and the
// `ScrollView`'s `contentView` becomes the tracked view.
//
// If scrolling does not begin within `touchStartDelayForScrolling` milliseconds,
// the tracked view is sent `touchStart`.  However, if the user does move at
// least `startScrollingDistance` even after `touchStartDelayForScrolling`
// milliseconds, the touch is canceled and scrolling does begin.

let startScrollingDistance = 30,          // points
    touchStartDelayForScrolling = 100;    // milliseconds

var scrollStartTimeout;

/**
 * Time at which the most recent pointer-down/up/move event occurred.
 * There is some small delay (say 5ms) for processing these events
 * and sometimes we need the reported time sans this processing lag.
 */

export let latestPointerTiming = { down:0, up:0, move:0 };

/**
 * The user has touched or pressed a mouse button at the given page coordinates.
 *
 * We aggregate touch and mouse as "pointer".
 */

function pointerDown(x, y) {
    latestPointerTiming.down = window.performance.now();

    let rootView = getRootView(),
        rootPoint = rootView.convertSuperviewToLocal(pageToCanvas(x, y)),
        [hitView, hitViewPoint] = rootView.hitTest(rootPoint);

    rootPointerDownPoint = rootPoint;

    if (hitView) {
        trackedView = hitView;

        scrollContentView = findScrollViewAncestor(trackedView);
        if (scrollContentView) {
            scrollContentView.superview.resetVelocity();  // stop inertia scrolling on touch

            clearTimeout(scrollStartTimeout);
            scrollStartTimeout = setTimeout(() => {
                if (trackedView) {
                    let newTrackedView = trackedView.touchStart(hitViewPoint);
                    if (newTrackedView && newTrackedView !== trackedView) {
                        trackedView = newTrackedView;
                    }
                }
            }, touchStartDelayForScrolling);
        } else {
            let newTrackedView = trackedView.touchStart(hitViewPoint);
            if (newTrackedView && newTrackedView !== trackedView) {
                trackedView = newTrackedView;
            }
        }
    } else {
        trackedView = null;
    }

    dropTargetView = null;
}

/**
 * The user has moved a finger or moved the mouse to the given page coordinates.
 */

function pointerMove(x, y) {
    latestPointerTiming.move = window.performance.now();

    if (!trackedView) {
        return;
    }

    let rootView = getRootView(),
        rootPoint = rootView.convertSuperviewToLocal(pageToCanvas(x, y));

    var distanceMovedFromDownPoint = 0;

    if (rootPointerDownPoint) {
        distanceMovedFromDownPoint = Math.sqrt(
            (rootPoint.x - rootPointerDownPoint.x) *
            (rootPoint.x - rootPointerDownPoint.x) +
            (rootPoint.y - rootPointerDownPoint.y) *
            (rootPoint.y - rootPointerDownPoint.y));
    }

    if (!isDragging &&
        scrollContentView &&
        trackedView !== scrollContentView &&
        distanceMovedFromDownPoint > startScrollingDistance) {

        trackedView.touchCancel();
        trackedView = scrollContentView;
        trackedView.draggingStarted(scrollContentView.superview.convertRootToLocal(rootPoint));
        isDragging = true;
        clearTimeout(scrollStartTimeout);
    } else if (!isDragging) {
        if (trackedView.draggable) {
            trackedView.draggingStarted(trackedView.superview.convertRootToLocal(rootPoint));
            isDragging = true;
            clearTimeout(scrollStartTimeout);
        } else {
            trackedView.touchMove(trackedView.convertRootToLocal(rootPoint));
        }
    } else if (isDragging) {
        trackedView.draggingUpdate(trackedView.superview.convertRootToLocal(rootPoint));

        // It's possible that the tracked view canceled dragging.

        if (!trackedView) {
            return;
        }

        // Figure out the view the tracked view is over;
        // disable user interaction on the tracked view so we don't hit it.

        trackedView.userInteractionEnabled = false;
        let [hitView, hitViewPoint] = rootView.hitTest(rootPoint);
        trackedView.userInteractionEnabled = true;

        // If there's a view under the tracked view being dragged around that accepts
        // the tracked view, notify it

        if (hitView) {
            if (dropTargetView !== hitView) {
                // Different drop target; previous drop target will not receive.

                if (dropTargetView) {
                    dropTargetView.willNotReceiveDroppedView(trackedView);
                }

                if (hitView.acceptsDroppedViews &&
                    hitView.acceptsDroppedView(trackedView)) {

                    dropTargetView = hitView;
                    dropTargetView.mightReceiveDroppedView(trackedView, hitViewPoint);
                } else {
                    dropTargetView = null;
                }
            }
        }
    }
}

/**
 * The user has lifted a depressed finger or released a depressed mouse button at
 * the given page coordinates.
 */

function pointerUp(x, y) {
    latestPointerTiming.up = window.performance.now();

    rootPointerDownPoint = undefined;

    if (!trackedView) {
        return;
    }

    let rootView = getRootView(),
        rootPoint = rootView.convertSuperviewToLocal(pageToCanvas(x, y));

    // If dragging we cannot drop the tracked view on itself so
    // disable its user interaction which fails the hit test and passes
    // to whatever view would be hit under it.

    if (isDragging) {
        trackedView.userInteractionEnabled = false;
    }

    let [upView, upViewPoint] = rootView.hitTest(rootPoint);

    if (isDragging) {
        trackedView.userInteractionEnabled = true;
    }

    if (upView) {
        if (isDragging) {
            if (upView !== trackedView && upView.acceptsDroppedViews) {
                if (upView.acceptsDroppedView(trackedView, upViewPoint)) {
                    upView.droppedViewWasReceived(trackedView, upViewPoint);
                    trackedView.wasAcceptedAsDroppedView(upView, upViewPoint);
                } else {
                    trackedView.wasRejectedAsDroppedView(upView, upViewPoint);
                }
            }

            if (trackedView.draggable) {
                trackedView.draggingEnded(trackedView.superview.convertRootToLocal(rootPoint));
            }
        } else if (upView && upView === trackedView) {
            upView.tapped(upViewPoint);
        }

        if (trackedView) {
            //if (scrollStartTimeout) {
            //    clearTimeout(scrollStartTimeout)
            //    trackedView.touchStart(trackedView.convertRootToLocal(rootPoint))
            //}
            trackedView.touchEnd(trackedView.convertRootToLocal(rootPoint));
        }
    }

    resetPointerHandling();
}

export function resetPointerHandling() {
    isDragging = false;
    trackedView = null;
    dropTargetView = null;
}

// Keyboard handling

// Key codes
// Not all of them but the most common.

let keyCodeToName = {
    0x06: 'Help',
    0x2F: 'Help',
    0x08: 'Backspace',
    0x09: 'Tab',
    0x1B: 'Escape',
    0x10: 'Shift',
    0x11: 'Control',
    0x12: 'Alt',
    0x13: 'Pause',
    0x14: 'CapsLock',
    0x0D: 'Enter',
    0x21: 'PageUp',
    0x22: 'PageDown',
    0x23: 'End',
    0x24: 'Home',
    0x25: 'ArrowLeft',
    0x26: 'ArrowUp',
    0x27: 'ArrowRight',
    0x28: 'ArrowDown',
    0x2E: 'Delete',
    0x70: 'F1',
    0x71: 'F2',
    0x72: 'F3',
    0x73: 'F4',
    0x74: 'F5',
    0x75: 'F6',
    0x76: 'F7',
    0x77: 'F8',
    0x78: 'F9',
    0x79: 'F10',
    0x7A: 'F11',
    0x7B: 'F12'
};

var ctrlKey = false,
    shiftKey = false,
    metaKey = false,
    altKey = false;

function keyPressed(key) {
    if (View.firstResponder) {
        View.firstResponder.keyPressed(key, ctrlKey, shiftKey, metaKey, altKey);
    }
}

function handleBrowserKeyboard() {
    // keypress produces character values; keydown/up produces key codes.

    document.body.addEventListener('keypress', e => {
        if (!ctrlKey && !metaKey && !altKey && e.keyCode !== 13) {   // Enter (I suppose here for newline entry)
            keyPressed(String.fromCharCode(e.keyCode));
        }

        if (e.preventDefault) {
            e.preventDefault();
        }

        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
        }
    }, false);

    document.body.addEventListener('keydown', e => {
        let keyCode = 'keyCode' in event ?
            event.keyCode : 'which' in event ?
            event.which : 0;

        if (keyCode !== 0) {
            let keyName = keyCodeToName[keyCode];

            // ctrl/shift only avail in keydown/up not in keypress.

            ctrlKey = e.ctrlKey;
            shiftKey = e.shiftKey;
            metaKey = e.metaKey;
            altKey = e.altKey;

            if (keyName !== undefined) {
                keyPressed(keyName);
            } else if (ctrlKey || metaKey || altKey) {
                keyPressed(String.fromCharCode(keyCode));
            }

            if (keyName === 'Backspace' ||       // browser back
                keyName === 'Tab' ||             // browser focus next
                (metaKey && (keyName === 'ArrowLeft' || keyName === 'ArrowRight'))) {  // browser back/fwd

                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }
    }, false);
}

/**
 * Add listeners for input (touch, mouse) events.
 */

export function addInputListeners() {
    let canvas = getCanvas();

    canvas.addEventListener('mousedown', e => {
        pointerDown(e.pageX, e.pageY);
    }, false);

    canvas.addEventListener('mouseup', e => {
        pointerUp(e.pageX, e.pageY);
    }, false);

    canvas.addEventListener('mousemove', e => {
        pointerMove(e.pageX, e.pageY);
    }, false);

    // We do not support multi-touch

    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            let touch = e.touches[0];
            pointerDown(touch.pageX, touch.pageY);
        }

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Stops touch from being also reported as mouse events
        // in desktop browsers.

        if (e.preventDefault) {
            e.preventDefault();
        }
    }, false);

    canvas.addEventListener('touchend', e => {
        if (e.changedTouches.length === 1) {
            let touch = e.changedTouches[0];
            pointerUp(touch.pageX, touch.pageY);
        }

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }
    }, false);

    canvas.addEventListener('touchmove', e => {
        if (e.changedTouches.length === 1) {
            let touch = e.changedTouches[0];
            pointerMove(touch.pageX, touch.pageY);
        }

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }
    }, false);

    canvas.addEventListener('touchcancel', () => {
        resetPointerHandling();
    });

    if (document.body) {
        handleBrowserKeyboard();
    }
}
