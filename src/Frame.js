import  Point from './Point';
import Size from './Size';

/**
 * A frame is a 2-D rectangular coordinate system with its origin in
 * its top-left corner, X axis extending rightwards, and Y axis extending downwards.
 *
 * Use `setOrigin`, `setSize`, or `set` to alter values as these
 * trigger events that notify listeners that the frame has changed.
 * Failing that, manually trigger the change event via `didChange`
 * when altering the frame's origin and/or size manually.
 */

export default class Frame {
    constructor(origin, size) {
        this.origin = origin || new Point();
        this.size = size || new Size();
    }

    setOrigin(x, y) {
        this.origin.set(x, y);
    }

    setSize(width, height) {
        this.size.set(width, height);
    }

    set(x, y, width, height) {
        this.origin.set(x, y);
        this.size.set(width, height);
        return this;
    }

    copy(otherFrame) {
        this.origin.copy(otherFrame.origin);
        this.size.copy(otherFrame.size);
        return this;
    }

    clone() {
        return new Frame(this.origin.clone(),
                         this.size.clone());
    }

    toString() {
        return `{${this.origin.x},${this.origin.y},${this.size.width},${this.size.height}}`;
    }

    static makeFrame(x, y, width, height) {
        return new Frame(new Point(x, y),
                         new Size(width, height));
    }
}
