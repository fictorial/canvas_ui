import  _ from 'lodash';
import './shapes';

var _canvas,
    _context,
    _rootView;

/**
 * Init the canvas UI system with a given class representing
 * the root view of the application.
 */

export function initCanvasUI(rootViewClass, canvas) {
    if (canvas) {
        _canvas = canvas;
    } else {
        _canvas = document.createElement('canvas');
        document.body.appendChild(_canvas);
    }

    setTimeout(() => {
        setupCanvas();
        setRootView(new rootViewClass());

        require('./input').addInputListeners();
        queueRunLoopIteration();

        window.addEventListener('resize', handleResize, false);
        window.addEventListener('orientationchange', handleResize, false);
    }, 0);
}

function handleResize() {
    setupCanvas();

    if (_rootView)
        _rootView.resize(window.innerWidth, window.innerHeight);

    queueRunLoopIteration();
}

function setupCanvas() {
    _canvas.setAttribute('id', 'ui-canvas');

    let ratio = window.devicePixelRatio || 1;
    _canvas.width  = window.innerWidth  * ratio;
    _canvas.height = window.innerHeight * ratio;

    _canvas.style.position = 'absolute';
    _canvas.style.top  = 0;
    _canvas.style.left = 0;
    _canvas.style.width = '100%';
    _canvas.style.height = '100%';
    _canvas.style.overflow = 'hidden';
    _canvas.style.zIndex = 1000;

    _context = _canvas.getContext('2d');
    _context.scale(ratio, ratio);
}

export function getCanvas() {
    return _canvas;
}

/**
 * Returns the 2D rendering context for the canvas.
 *
 * Typically the root view will be told to redraw itself,
 * and is given the 2d context for the canvas. However, sometimes
 * views need access to the context outside of a redraw (e.g.
 * text metrics).
 */

export function getContext() {
    return _context;
}

/**
 * Returns the root view. Typically views do not need
 * access to this and should prefer `this._rootView`.;
 */

export function getRootView() {
    return _rootView;
}

export function setRootView(view) {
    if (_rootView)
        _rootView.willBeRemovedFromView();

    _rootView = view;
    _rootView.resize(window.innerWidth, window.innerHeight).wasAddedToView();
}

// Run loop iterations come via requestAnimationFrame.
//
// Views typically will not need to call this directly.;
// Instead, the more intuitive `.needsUpdate`, `.needsLayout`,
// and `.needsDisplay` should be used.

var _runLoopIterationNeeded = false;

export function queueRunLoopIteration() {
    if (!_runLoopIterationNeeded) {
        _runLoopIterationNeeded = true;
        requestAnimationFrame(_iterateRunLoop);
    }
}

// The views that have requested to be manually update()d

let _viewsNeedingUpdate = [];

export function viewNeedsUpdate(view, needsIt) {
    let index = _viewsNeedingUpdate.indexOf(view);
    if (needsIt && index === -1) {
        _viewsNeedingUpdate.push(view);
    } else if (!needsIt && index !== -1) {
        _viewsNeedingUpdate.splice(index, 1);
    }
}

// The views that have been marked as needing their layout recomputed.

let _viewsNeedingLayout = [];

export function viewNeedsLayout(view, needsIt) {
    let index = _viewsNeedingLayout.indexOf(view);
    if (needsIt && index === -1) {
        _viewsNeedingLayout.push(view);
        queueRunLoopIteration();
    } else if (!needsIt && index !== -1) {
        _viewsNeedingLayout.splice(index, 1);
    }
}

/**
 * Run loop iteration
 *
 * Notes:
 *
 * - Redrawing the canvas is not continuous; only when a view needs display
 *   (e.g. has an active animation).
 *
 * - If any view needs display, the root view and all non-hidden child views
 *   are asked to draw themselves.  We don't redraw only "dirty" views as
 *   compositing w/ cached bitmaps etc is too expensive.
 *
 * - Layout is not performed on every update either; only on views that need it.
 */

function _iterateRunLoop(t) {
    _.each(_viewsNeedingUpdate, v => v && v.update(t));

    while (_viewsNeedingLayout.length > 0) {
        _.each(_viewsNeedingLayout, v => v && v.layoutIfNeeded());
    }

    _rootView.redraw(_context);

    _runLoopIterationNeeded = !_.isEmpty(_viewsNeedingUpdate) ||
                              !_.isEmpty(_viewsNeedingLayout);

    if (_runLoopIterationNeeded) {
        requestAnimationFrame(_iterateRunLoop);
    }
}
