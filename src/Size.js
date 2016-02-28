import  _ from 'lodash';
import EventEmitter from 'events';

/**
 * 2-D dimensions (width, height).
 *
 * Events:
 * - valueChanged: when the size was changed.
 */

export default class Size extends EventEmitter {
    constructor(width = 0, height = 0) {
        if (!_.isFinite(width) || !_.isFinite(height)) {
            throw new Error('number required');
        }

        super();

        this._width = width;
        this._height = height;
    }

    didChange() {
        this.emit('valueChanged');
    }

    get width() {
        return this._width;
    }

    set width(w) {
        if (!_.isFinite(w)) {
            throw new Error('number required');
        }

        if (this._width !== w) {
            this._width = w;
            this.didChange();
        }
    }

    get height() {
        return this._height;
    }

    set height(h) {
        if (!_.isFinite(h)) {
            throw new Error('number required');
        }

        if (this._height !== h) {
            this._height = h;
            this.didChange();
        }
    }

    set(width, height) {
        if (!_.isFinite(width) || !_.isFinite(height)) {
            throw new Error('number required');
        }

        var changed = false;

        if (this._width !== width) {
            this._width = width;
            changed = true;
        }

        if (this._height !== height) {
            this._height = height;
            changed = true;
        }

        if (changed) {
            this.didChange();
        }

        return this;
    }

    copy(s) {
        return this.set(s._width, s._height);
    }

    clone() {
        return new Size(this._width, this._height);
    }
}
