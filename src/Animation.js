import  _ from 'lodash';
import EventEmitter from 'events';

// Docs {{{
/**
 * An animation changes a number of properties on a target object
 * over time using easing and interpolation.
 *
 * ## Usage:
 *
 *     new Animation({
 *       name: string,          // name for the animation
 *       target: object,        // object whose properties will be animated
 *       startValues: object,   // {$prop: $value} (optional)
 *       endValues: object,     // {$prop: $value}
 *       duration: number,      // default 400 ms
 *       startDelay: number,    // default 0
 *       endDelay: number,      // default 0
 *       easing: function,      // default Animation.easing.linear
 *       playCount: number,     // default 1; >= 0; Infinity OK
 *       autoReverse: boolean,  // default false
 *     });
 *
 * ## Parameters:
 *
 * `name` is a string naming the animation (e.g. "fadeOut").
 *
 * `target` is the object whose properties are to be animated.
 *
 * `startValues` are the initial or start values of the target to be applied
 * before the animation begins.  By default, the values of the animated
 * properties with keys of `endValues` are copied out of `target` before the
 * animation begins.
 *
 * `endValues` are the final or end values for the corresponding properties
 * of `target` after the animation plays in the forward direction one time.
 *
 * `startDelay` is the amount of time (ms) to wait before target property values
 * are animated.
 *
 * `duration` is the duration over which target properties are animated; this does;
 * not include `startDelay` nor `endDelay`.
 *
 * `endDelay` is the amount of time (ms) to wait after target property values
 * are animated before continuing with additional plays.
 *
 * `easing` is an easing function (see `Animation.easing`);
 *
 * `playCount` is the number of times the animation should be repeated.  The default is 1.
 *
 * `autoReverse` is a boolean indicating whether or not the animated properties
 * are swapped between start and end values when playing the animation additional
 * times (`playCount > 0`).  On even-numbered plays, the target values are animated from
 * `startValues` to `endValues`. On odd-numbered plays, the target values are animated
 * from `endValues` to `startValues`.
 *
 * ## Notes:
 *
 * The animations are driven `requestAnimationFrame`.  You do **not** need to
 * call `Animation._update` or `Animation._updateAll` yourself.
 *
 * `playTime` is the current time within the scope of a single "play" of the animation,
 * regardless of whether it is in the forward or reverse direction and includes the `startDelay`
 * and `outDelay`.
 *
 * `animTime` is the current time within the scope of a single "play" of the animation,
 * regardless of whether it is in the forward or reverse direction and does not include the
 * `startDelay` and `outDelay`.  When the current real time is within `startDelay` and `outDelay`,
 * `animTime` is `-1`. Thus, `animTime` takes on values from the range `[0, duration)`.
 *
 * `elapsedTime` is the time since the animation started, regardless of the play number.
 *
 * ## Events:
 *
 * `update`: emitted when values of animated properties are updated on the target object
 *
 * `complete(finished)`: emitted when when the animation plays to completion
 * and is passed true if the animation ran to completion or false if it was
 * stopped prematurely.
 *
 * `playStart`: emitted when a new play has started.;
 *
 * `playEnd`: emitted when a play of the animation has ended.
 *
 * ## Example Timelines
 *
 * Note: total running time (T) = playCount * (startDelay + duration + endDelay)
 *
 * Simple one-timer:
 *
 *     real time    =====================================================================================>
 *     playCount    1
 *     playNumber   0........................................0
 *     elapsedTime  0........................................T
 *     animTime     -1..........-1 0....duration -1.........-1
 *     playTime     0...startDelay 0....duration 0....endDelay
 *     target       startValues......................endValues
 *
 * With autoReverse disabled:
 *
 *     real time    =====================================================================================>
 *     playCount    2
 *     autoReverse  false
 *     playNumber   0........................................0  1........................................1
 *     elapsedTime  0....................................................................................T
 *     animTime     -1..........-1 0....duration -1.........-1  -1..........-1 0....duration -1.........-1
 *     playTime     0...startDelay 0....duration 0....endDelay  0...startDelay 0....duration 0....endDelay
 *     isReversed   false................................false  false................................false
 *     target       startValues......................endValues  startValues......................endValues
 *
 * With autoReverse enabled:
 *
 *     real time    =====================================================================================>
 *     playCount    2
 *     autoReverse  true
 *     playNumber   0........................................0  1........................................1
 *     elapsedTime  0....................................................................................T
 *     animTime     -1..........-1 0....duration -1.........-1  -1..........-1 0....duration -1.........-1
 *     playTime     0...startDelay 0....duration 0....endDelay  0...startDelay 0....duration 0....endDelay
 *     isReversed   false................................false  true..................................true
 *     target       startValues......................endValues  endValues......................startValues
 */
// }}}

export default class Animation extends EventEmitter {
    // constructor {{{

    constructor(opts) {
        super();

        if (!_.isObject(opts)) {
            throw new Error('object expected');
        }

        this._target = opts.target;

        this.easing = opts.easing || Animation.easing.linear;

        if (_.isFunction(opts.endValues)) {
            this._endValues = opts.endValues;
        } else if (_.isObject(opts.endValues)) {
            this._endValues = _.clone(opts.endValues);
            this._animatedPropertyNames = _.keys(this._endValues);
        } else {
            throw new Error('endValues required');
        }

        if (_.isFunction(opts.startValues)) {
            this._startValues = opts.startValues;
        } else if (_.isObject(opts.startValues)) {
            this._startValues = _.clone(opts.startValues);
        }

        this._startDelay = Math.max(parseInt(opts.startDelay, 10) || 0, 0);
        this._endDelay = Math.max(parseInt(opts.reverseDelay, 10) || 0, 0);
        this._duration = parseInt(opts.duration, 10);
        if (isNaN(this._duration) || this._duration < 0) {
            this._duration = 400;
        }

        this._playCount = opts.playCount === Infinity ?
            Infinity : Math.max(parseInt(opts.playCount, 10) || 1, 1);

        this._autoReverse = this._playCount > 1 &&
            opts.autoReverse !== undefined && !!opts.autoReverse;
        this._explicitReverse = !!opts.reverse;

        this._name = opts.name;

        // Don't wait until `start` before creating the properties

        this._isStopped = false;
        this._startTime = -1;
        this._stopTime = -1;
        this._elapsedTime = -1;
        this._animTime = -1;
        this._playTime = -1;
        this._playStartTime = -1;
        this._playNumber = 0;
    }

    // }}}
    // start {{{

    start() {
        if (!_.isObject(this.target)) {
            throw new Error('target required');
        }

        if (this._startTime !== undefined) {
            this.stop();
        }

        this._loadEndValues();
        this._loadStartValues();

        this._copyStartValues();

        this._isStopped = false;
        this._startTime = -1;
        this._stopTime = -1;
        this._elapsedTime = -1;
        this._animTime = -1;
        this._playTime = -1;
        this._playStartTime = -1;
        this._playNumber = 0;

        Animation._all.push(this);
        requestAnimationFrame(Animation._updateAll);

        return this;
    }

    _loadEndValues() {
        if (_.isFunction(this._endValues)) {
            this._endValues = this._endValues.call(this);
            if (!_.isObject(this._endValues)) {
                throw new Error('object required for endValues');
            }
            this._animatedPropertyNames = _.keys(this._endValues);
        }
    }

    _loadStartValues() {
        if (_.isFunction(this._startValues)) {
            this._startValues = this._startValues.call(this);
            if (!_.isObject(this._startValues)) {
                throw new Error('object required for startValues');
            }
        }
    }

    _copyStartValues() {
        // Collect start values from current values in

        var vals = {};

        _.each(this._animatedPropertyNames, p => {
            vals[p] = this._target[p];
        });

        // If we are given start values, those take precedence
        // over current values on the target.

        if (_.isObject(this._startValues)) {
            vals = _.merge(vals, this._startValues);
        }

        _.merge(this._target, this._startValues);

        this._startValues = vals;
    }

    // }}}
    // stop {{{

    /**
     * Stop the animation.
     *
     * If you have a more accurate stop time than "right now"
     * (i.e. when `stop()` is called), provide it in `stopTime`.
     * The animation will be updated once more using the stop
     * time as the current time for easing animated properties.
     *
     * The expected format for `stopTime` is DOMHighResTimeStamp
     * as returned by `window.performance.now`.
     *
     * The animation may be restarted with a subsequent call
     * to `start()`.
     */

    stop(stopTime=null) {
        this._isStopped = true;
        this._stopTime = stopTime === null ? window.performance.now() : stopTime;
    }

    // }}}
    // reverse {{{

    /**
     * Play the animation in reverse which always animates from
     * end values to start values.  Forces a playCount of 1.
     */

    reverse(yesNo=true) {
        this._explicitReverse = yesNo;

        if (yesNo) {
            this._playCount = 1;
        }
    }

    // }}}
    // update/stop active animations {{{

    static _updateAll(currentTime) {
        let completed = _.remove(Animation._all, anim => anim._update(currentTime));
        _.each(completed, c => c.emit('complete', !c._isStopped));

        let n = Animation._all.length;
        if (n > 0) {
            requestAnimationFrame(Animation._updateAll);
        }
        return n;
    }

    // }}}
    // update {{{

    // Returns true if the animation has completed.

    _update(currentTime) {
        if (this._isStopped) {
            // Let the update occur but at the stop time
            // which might be a frame behind (say 1000/60 = ~17 ms)
            // or more due to input -> animation processing lag.

            if (this._stopTime !== -1) {
                currentTime = this._stopTime;
            }
        }

        if (this._startTime === -1) {
            this._startTime = currentTime;
            this._playStartTime = currentTime;
            this.emit('playStart');
        }

        this._elapsedTime = currentTime - this._startTime;
        this._playTime = currentTime - this._playStartTime;

        if ((this._startDelay > 0 &&
             this._playTime < this._startDelay) ||
            (this._endDelay > 0 &&
             this._playTime > this._startDelay + this._duration)) {

            this._animTime = -1;
            this.emit('update');
            return false;
        }

        this._animTime = currentTime - this._playStartTime - this._startDelay;

        var effectiveStartValues,
            effectiveEndValues;

        if (this._explicitReverse ||
            (this._autoReverse && (this._playNumber & 1))) {
            effectiveStartValues = this._endValues;
            effectiveEndValues = this._startValues;
        } else {
            effectiveStartValues = this._startValues;
            effectiveEndValues = this._endValues;
        }

        _.each(this._animatedPropertyNames, p => {
            this._target[p] = this._easing(this._animTime,
                effectiveStartValues[p],
                effectiveEndValues[p] - effectiveStartValues[p],
                this._duration);
        });

        this.emit('update');

        if (this._isStopped) {
            this.emit('stopped');
            return true;
        }

        if (this._playTime >= this.playDuration) {
            this.emit('playEnd');

            if (this._playCount > 1 &&
                ++this._playNumber < this._playCount) {

                this._playTime = 0;
                this._animTime = -1;
                this._playStartTime = currentTime;
                this.emit('playStart');

                return false;
            }

            _.merge(this._target, effectiveEndValues);
            return true;
        }

        return false;
    }

    // }}}
    // getters {{{

    /**
     * The name of the animation
     */

    get name() {
        return this._name;
    }

    /**
     * The target object being animated.
     */

    get target() {
        return this._target;
    }

    set target(t) {
        this._target = t;
    }

    /**
     * Play count
     */

    get playCount() {
        return this._playCount;
    }

    set playCount(n) {
        this._playCount = n;
    }

    /**
     * The easing function in use.
     */

    get easing() {
        return this._easing;
    }

    set easing(fn) {
        if (!_.isFunction(fn)) {
            throw new Error('function required for easing');
        }

        this._easing = fn;
    }

    /**
     * The wall clock time when the animation started.
     */

    get startTime() {
        return this._startTime;
    }

    /**
     * The wall clock time when the current play started.
     */

    get playStartTime() {
        return this._playStartTime;
    }

    /**
     * The elapsed time since the current play of the animation started.
     * Includes the start and end delays.
     *
     * Returns a value within range [0, duration)
     */

    get playTime() {
        return this._playTime;
    }

    /**
     * The elapsed time since the current play of the animation started.
     * Does not include the start or end delays.
     *
     * Returns:
     * - -1 when in the start or end delays.
     * - Otherwise, a value within range [0, duration)
     */

    get animTime() {
        return this._animTime;
    }

    /**
     * Returns the total time the animation will play for across all
     * plays and including their start and end delays.
     */

    get totalElapsedTime() {
        return this._playCount * this.playDuration;
    }

    /**
     * Returns the elapsed time in range [0,1] since the animation
     * started.
     */

    get elapsedTimeUnit() {
        return this._elapsedTime / this.totalElapsedTime;
    }

    /**
     * Returns the elapsed time since the animation started in ms.
     */

    get elapsedTime() {
        return this._elapsedTime;
    }

    /**
     * Returns the delay duration (ms) before each play of the animation begins.
     */

    get startDelay() {
        return this._startDelay;
    }

    /**
     * Returns the delay duration (ms) after each play of the animation ends
     * and before the next play begins (assuming `playNumber < playCount`)
     */

    get endDelay() {
        return this._endDelay;
    }

    /**
     * Returns the duration in ms over which target properties are animated.
     */

    get animDuration() {
        return this._duration;
    }

    /**
     * Returns the duration in ms of each play of the animation.
     */

    get playDuration() {
        return this._playDuration = this._startDelay +
            this._duration + this._endDelay;
    }

    /**
     * Returns the current play number in range [0, playCount)
     */

    get playNumber() {
        return this._playNumber;
    }

    /**
     * Returns the total number of plays that will be played.
     */

    get playCount() {
        return this._playCount;
    }

    /**
     * Returns true if start and end values are swapped after each
     * play of the animation.
     */

    get autoReverses() {
        return this._autoReverse;
    }

    /**
     * True if animating from end to start values due to `autoReverse`.
     */

    get isReversed() {
        return this._autoReverse && (this._playNumber & 1);
    }

    /**
     * True if stopped.
     */

    get isStopped() {
        return this._isStopped;
    }

    // }}}
}

// Active animations {{{

// Active animations; on stop, the animation is removed.

Animation._all = [];

// }}}
// Easing Functions {{{

// Thanks to Robert Penner for these equations.
// Parameters:
//   t: current time
//   b: start value
//   c: change in value (delta)
//   d: duration for change

// More traditional naming conventions for "Start" and "End" are "In" and "Out"
// respectively.  I found these confusing initially as "In" to me meant "coming
// back in" but it really meant "on the way in"... "Start" and "End" are
// unambiguous.  Furthermore, given that we have "bounceStart" and "bounceEnd",
// "bounce" seems pretty obvious that it means "bounce at start and end".
// Naming things is difficult.

Animation.easing = {
    // linear {{{

    linear: (t, b, c, d) => {
        return c*t/d + b;
    },

    // }}}
    // quad {{{

    quadStart: (t, b, c, d) => {
        t /= d;

        return c*t*t + b;
    },

    quadEnd: (t, b, c, d) => {
        t /= d;

        return -c * t*(t-2) + b;
    },

    quad: (t, b, c, d) => {
        t /= d/2;

        if (t < 1) {
            return c/2*t*t + b;
        }

        t--;

        return -c/2 * (t*(t-2) - 1) + b;
    },

    // }}}
    // cubic {{{

    cubicStart: (t, b, c, d) => {
        t /= d;

        return c*t*t*t + b;
    },

    cubicEnd: (t, b, c, d) => {
        t /= d;

        t--;

        return c*(t*t*t + 1) + b;
    },

    cubic: (t, b, c, d) => {
        t /= d/2;

        if (t < 1) {
            return c/2*t*t*t + b;
        }

        t -= 2;

        return c/2*(t*t*t + 2) + b;
    },

    // }}}
    // quartic {{{

    quartStart: (t, b, c, d) => {
        t /= d;

        return c*t*t*t*t + b;
    },

    quartEnd: (t, b, c, d) => {
        t /= d;

        t--;

        return -c * (t*t*t*t - 1) + b;
    },

    quart: (t, b, c, d) => {
        t /= d/2;

        if (t < 1) {
            return c/2*t*t*t*t + b;
        }

        t -= 2;

        return -c/2 * (t*t*t*t - 2) + b;
    },

    // }}}
    // quintic {{{

    quintStart: (t, b, c, d) => {
        t /= d;

        return c*t*t*t*t*t + b;
    },

    quintEnd: (t, b, c, d) => {
        t /= d;

        t--;

        return c*(t*t*t*t*t + 1) + b;
    },

    quint: (t, b, c, d) => {
        t /= d/2;

        if (t < 1) {
            return c/2*t*t*t*t*t + b;
        }

        t -= 2;

        return c/2*(t*t*t*t*t + 2) + b;
    },

    // }}}
    // sine {{{

    sineStart: (t, b, c, d) => {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
    },

    sineEnd: (t, b, c, d) => {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
    },

    sine: (t, b, c, d) => {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    },

    // }}}
    // exponential {{{

    exponentialStart: (t, b, c, d) => {
        return c * Math.pow(2, 10 * (t/d - 1)) + b;
    },

    exponentialEnd: (t, b, c, d) => {
        return c * (-Math.pow(2, -10 * t/d) + 1) + b;
    },

    exponential: (t, b, c, d) => {
        t /= d/2;

        if (t < 1) {
            return c/2 * Math.pow(2, 10 * (t - 1)) + b;
        }

        t--;

        return c/2 * (-Math.pow(2, -10 * t) + 2) + b;
    },

    // }}}
    // circular {{{

    circularStart: (t, b, c, d) => {
        t /= d;

        return -c * (Math.sqrt(1 - t*t) - 1) + b;
    },

    circularEnd: (t, b, c, d) => {
        t /= d;

        t--;

        return c * Math.sqrt(1 - t*t) + b;
    },

    circular: (t, b, c, d) => {
        t /= d/2;

        if (t < 1) {
            return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        }

        t -= 2;

        return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
    },

    // }}}
    // elastic {{{

    elasticStart: (t, b, c, d) => {
        var s=1.70158,
            p=0,
            a=c;

        if (t==0) {
            return b;
        }

        if ((t/=d)==1) {
            return b+c;
        }

        if (!p) {
            p=d*.3;
        }

        if (a < Math.abs(c)) {
            a=c;
            s=p/4;
        } else {
            s = p/(2*Math.PI) * Math.asin(c/a);
        }

        return -(a*Math.pow(2,10*(t-=1)) *
                 Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
    },

    elasticEnd: (t, b, c, d) => {
        var s=1.70158,
            p=0,
            a=c;

        if (t==0) {
            return b;
        }

        if ((t/=d)==1) {
            return b+c;
        }

        if (!p) {
            p=d*.3;
        }

        if (a < Math.abs(c)) {
            a=c;
            s=p/4;
        } else {
            s = p/(2*Math.PI) * Math.asin(c/a);
        }

        return a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p) + c + b;
    },

    elastic: (t, b, c, d) => {
        var s=1.70158,
            p=0,
            a=c;

        if (t==0) {
            return b;
        }

        if ((t/=d/2)==2) {
            return b+c;
        }

        if (!p) {
            p=d*(.3*1.5);
        }

        if (a < Math.abs(c)) {
            a=c;
            s=p/4;
        } else {
            s=p/(2*Math.PI) * Math.asin (c/a);
        }

        if (t < 1) {
            return -.5*(a*Math.pow(2,10*(t-=1)) *
                Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
        }

        return a*Math.pow(2,-10*(t-=1)) *
            Math.sin((t*d-s)*(2*Math.PI)/p)*.5 + c + b;
    },

    // }}}
    // back {{{

    backStart: (t, b, c, d, s) => {
        if (s == undefined) {
            s = 1.70158;
        }

        return c*(t/=d)*t*((s+1)*t - s) + b;
    },

    backEnd: (t, b, c, d, s) => {
        if (s == undefined) {
            s = 1.70158;
        }

        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    },

    back: (t, b, c, d, s) => {
        if (s == undefined) {
            s = 1.70158;
        }

        if ((t/=d/2) < 1) {
            return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        }

        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
    },

    // }}}
    // bounce {{{

    bounceStart: (t, b, c, d) => {
        return c - Animation.easing.bounceEnd(d-t, 0, c, d) + b;
    },

    bounceEnd: (t, b, c, d) => {
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        }

        if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
        }

        if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
        }

        return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
    },

    bounce: (t, b, c, d) => {
        if (t < d/2) {
            return Animation.easing.bounceStart(t*2, 0, c, d) * .5 + b;
        }
        return Animation.easing.bounceEnd(t*2-d, 0, c, d) * .5 + c*.5 + b;
    }

    // }}}
};

// }}}
