import  _ from 'lodash';
import EventEmitter from 'events';

/**
 * Padding along each edge of a rectangle.
 *
 * Events:
 * - valueChanged();
 */

export default class EdgeInsets extends EventEmitter {
    constructor(top=0, left=0, bottom=0, right=0) {
        if (!_.isFinite(top) ||
            !_.isFinite(left) ||
            !_.isFinite(bottom) ||
            !_.isFinite(right)) {
            throw new Error('number required');
        }

        super();

        this._top    = Math.abs(top);
        this._left   = Math.abs(left);
        this._bottom = Math.abs(bottom);
        this._right  = Math.abs(right);
    }

    get top()    { return this._top;    }
    get left()   { return this._left;   }
    get bottom() { return this._bottom; }
    get right()  { return this._right;  }

    set top(t) {
        if (!_.isFinite(t)) {
            throw new Error('number required');
        }

        t = Math.abs(t);

        if (this._top !== t) {
            this._top = t;
            this.didChange();
        }
    }

    set left(l) {
        if (!_.isFinite(l)) {
            throw new Error('number required');
        }

        l = Math.abs(l);

        if (this._left !== l) {
            this._left = l;
            this.didChange();
        }
    }

    set bottom(b) {
        if (!_.isFinite(b)) {
            throw new Error('number required');
        }

        b = Math.abs(b);

        if (this._bottom !== b) {
            this._bottom = b;
            this.didChange();
        }
    }

    set right(r) {
        if (!_.isFinite(r)) {
            throw new Error('number required');
        }

        r = Math.abs(r);

        if (this._right !== r) {
            this._right = r;
            this.didChange();
        }
    }

    didChange() {
        this.emit('valueChanged');
    }

    setAll(v) {
        if (!_.isFinite(v)) {
            throw new Error('number required');
        }

        let value = Math.max(0, v);

        return this.set(value, value, value, value);
    }

    setHorizontal(l, r) {
        this.left = l;
        this.right = (r !== undefined) ? r : l;
        return this;
    }

    setVertical(t, b) {
        this.top = t;
        this.bottom = (b !== undefined) ? b : t;
        return this;
    }

    set(t, l, b, r) {
        if (!_.isFinite(t) ||
            !_.isFinite(l) ||
            !_.isFinite(b) ||
            !_.isFinite(r)) {
            throw new Error('number required');
        }

        var changed = false;

        t = Math.abs(t);
        if (this._top !== t) {
            this._top = t;
            changed = true;
        }

        l = Math.abs(l);
        if (this._left !== l) {
            this._left = l;
            changed = true;
        }

        b = Math.abs(b);
        if (this._bottom !== b) {
            this._bottom = b;
            changed = true;
        }

        r = Math.abs(r);
        if (this._right !== r) {
            this._right = r;
            changed = true;
        }

        if (changed) {
            this.didChange();
        }

        return this;
    }
}
