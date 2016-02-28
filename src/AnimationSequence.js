import  _ from 'lodash';
import EventEmitter from 'events';

/**
 * A sequence of animations. The first animation is played.
 * When it completes, the next animation in the sequence is played.
 * This repeats until the last animation in the sequence is played.
 * Then the 'complete' event is emitted.;
 *
 * Note that such a sequence can be played in reverse.
 * Before calling `start`, call `reverse`.
 *
 * ## Events
 *
 * - `complete`: the end of the sequence has been reached.
 * - `repeat(playNo)`: the end of the sequence has been reached
 *   but it will start over (as per `playCount`).
 */

export default class AnimationSequence extends EventEmitter {
    constructor(name, animations) {
        super();

        if (!_.isString(name) && _.isArray(name)) {
            this._animations = name;
            this._name = _.uniqueId(this.constructor.name);
        } else {
            this._name = name;
            this._animations = animations || [];
        }

        this._playCount = 0;
        this._plays = 0;
    }

    get playCount() {
        return this._playCount;
    }

    set playCount(n) {
        this._playCount = n;
    }

    get plays() {
        return this._plays;
    }

    get target() {
        let anim = _.first(this._animations);
        return anim ? anim.target : null;
    }

    set target(t) {
        _.each(this._animations, a => {a.target = t;});
    }

    get name() {
        return this._name;
    }

    push(anim) {
        this._animations.push(anim);
        return this;
    }

    start() {
        if (this.startDelay > 0) {
            setTimeout(this._playAnimationAtIndex.bind(this,0), this.startDelay);
        } else {
            this._playAnimationAtIndex(0);
        }
    }

    _playAnimationAtIndex(index) {
        if (index >= this._animations.length) {
            if (++this._plays >= this._playCount) {
                this.emit('complete');
            } else {
                this.emit('repeat', this._plays);
                if (this.autoReverse) {
                    this.reverse();
                }
                this._playAnimationAtIndex(0);
            }
        } else {
            let anim = this._animations[index];
            anim.once('complete', this._playAnimationAtIndex.bind(this,index+1));
            anim.start();
        }
    }

    stop() {
        _.each(this._animations, a => a.stop());
        return this;
    }

    reverse() {
        this._animations.reverse();
        _.each(this._animations, anim => anim.reverse());
        return this;
    }
}
