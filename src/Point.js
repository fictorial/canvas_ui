import  _ from 'lodash';
import EventEmitter from 'events';

/**
 * A point in some 2-D coordinate system.
 *
 * Squint and it looks like a 2-D vector (e.g. `addSelf`).
 *
 * Events
 * - valueChanged()
 */

export default class Point extends EventEmitter {
    constructor(x=0, y=0) {
        if (!_.isFinite(x) || !_.isFinite(y)) {
            throw new Error('number required');
        }

        super();

        this._x = x;
        this._y = y;
    }

    didChange() {
        this.emit('valueChanged');
    }

    get x() {
        return this._x;
    }

    set x(x) {
        if (!_.isFinite(x)) {
            throw new Error('number required');
        }

        if (this._x !== x) {
            this._x = x;
            this.didChange();
        }
    }

    get y() {
        return this._y;
    }

    set y(y) {
        if (!_.isFinite(y)) {
            throw new Error('number required');
        }

        if (this._y !== y) {
            this._y = y;
            this.didChange();
        }
    }

    set(x, y) {
        if (!_.isFinite(x) || !_.isFinite(y)) {
            throw new Error('number required');
        }

        var changed = false;

        if (this._x !== x) {
            this._x = x;
            changed = true;
        }

        if (this._y !== y) {
            this._y = y;
            changed = true;
        }

        if (changed) {
            this.didChange();
        }

        return this;
    }

    copy(p) {
        return this.set(p.x, p.y);
    }

    clone() {
        return new Point(this._x, this._y);
    }

    add(point) {
        return new Point(point._x + this._x,
                         point._y + this._y);
    }

    addSelf(point) {
        return this.set(this._x + point._x,
                        this._y + point._y);
    }

    sub(point) {
        return new Point(this._x - point._x,
                         this._y - point._y);
    }

    subSelf(point) {
        return this.set(this._x - point._x,
                        this._y - point._y);
    }

    scale(dx, dy) {
        if (!_.isFinite(dx) || !_.isFinite(dy)) {
            throw new Error('number required');
        }

        return new Point(this._x * dx,
                         this._y * dy);
    }

    scaleSelf(dx, dy) {
        if (!_.isFinite(dx) || !_.isFinite(dy)) {
            throw new Error('number required');
        }

        return this.set(this._x * dx,
                        this._y * dy);
    }

    isNonZero() {
        return this._x * this._x +
               this._y * this._y > 1e-5;
    }

    isZero() {
        return !this.isNonZero();
    }

    toString() {
        return `{${this._x},${this._y}}`;
    }
}
