import  _ from 'lodash';
import Animation from './Animation';
import AnimationSequence from './AnimationSequence';
import {PointZero} from './magic';
import {degreesToRadians} from './util';

// Off-the-shelf basic animations.
// Note: these can be composed to run in series or parallel.
// See AnimationParallel and AnimationSequence.

// alpha/transparency {{{

/**
 * An animation that fades its target in over time.
 */

export class FadeIn extends Animation {
    constructor(opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'fadeIn',
            startValues: {hidden:false, alpha:0},
            endValues: {alpha:1}
        }));
    }
}

/**
 * An animation that fades its target out using alpha.
 */

export class FadeOut extends Animation {
    /**
     * Additional options:
     *
     * - `removeOnComplete`: if true, the target will be removed;
     *   from its superview when the fade-out animation completes.;
     *   The default is false.
     *
     * - `hideOnComplete`: if true, the target will be hidden;
     *   when the fade-out animation completes. The default is false.;
     */
    constructor(opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'fadeOut',
            endValues: {alpha:0}
        }));

        if (opts.removeOnComplete) {
            this.once('complete', () => {
                this.target.removeFromSuperview();
            });
        } else if (opts.hideOnComplete) {
            this.once('complete', () => {
                this.target.hidden = true;
            });
        }
    }
}

// }}}
// scale {{{

/**
 * Scales the target view to an absolute scale.
 *
 * NB: scaling occurs around the view's local center point.
 */

export class Scale extends Animation {
    /**
     * Additional options:
     *
     * - `scale`: the target scale for both X and Y (default: 1.0);
     * - `scaleX`: the target scale for X (default: `scale`);
     * - `scaleY`: the target scale for Y (default: `scale`).
     */
    constructor(opts=null) {
        opts = opts || {};

        let defaultScale = _.isFinite(opts.scale) ? opts.scale : 1.0,
            scaleX = _.has(opts, 'scaleX') ? opts.scaleX : defaultScale,
            scaleY = _.has(opts, 'scaleY') ? opts.scaleY : defaultScale;

        super(_.merge(opts, {
            name: 'scaleTo',
            endValues: {x:scaleX, y:scaleY}
        }));
    }
}

/**
 * An animation that pops in its target using scaling.
 */

export class PopIn extends Animation {
    constructor(opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'popIn',
            startValues: {hidden:false, scaleX:0, scaleY:0},
            endValues: {scaleX:1, scaleY:1},
            easing: Animation.easing.backEnd
        }));
    }
}

/**
 * An animation that pops out its target using scaling.
 */

export class PopOut extends Animation {
    /**
     * Additional options:
     *
     * - `removeOnComplete`: if true, the target will be removed;
     *   from its superview when the fade-out animation completes.;
     *   The default is false.
     *
     * - `hideOnComplete`: if true, the target will be hidden;
     *   when the fade-out animation completes. The default is false.;
     */
    constructor(opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'popOut',
            startValues: {scaleX:1, scaleY:1},
            endValues: {scaleX:0, scaleY:0},
            easing: Animation.easing.backStart
        }));

        if (opts.removeOnComplete) {
            this.once('complete', () => {
                this.target.removeFromSuperview();
            });
        } else if (opts.hideOnComplete) {
            this.once('complete', () => {
                this.target.hidden = true;
            });
        }
    }
}

// }}}
// rotation/angle {{{

/**
 * Spins the target view a number of times about its center.
 */

export class Spin extends Animation {
    /**
     * Additional options:
     *
     * - `times`: the number of times to spin the target view.
     *   The default is 1.
     * - `clockwise`: if true, the target view spins
     *   in the clockwise direction.  The default is false.
     */
    constructor(opts=null) {
        opts = opts || {};

        let times = Math.max(1, opts.times || 1),
            clockwise = !!opts.clockwise,
            angle = 2 * Math.PI * times * (clockwise && -1 || 1);

        super(_.merge(opts, {
            name: 'spin',
            endValues: {angle}
        }));
    }
}

/**
 * Rotates the target view to the given angle.
 */

export class Rotate extends Animation {
    /**
     * Additional options:
     *
     * - `radians`: the target angle (default: 0);
     * - `degrees`: the target angle in degrees (default: 0).
     *   Takes precendence over `radians`.
     */
    constructor(opts=null) {
        opts = opts || {};

        let angle = (_.has(opts, 'degrees') ?
            degreesToRadians(opts.degrees) :
            opts.radians) || 0.0;

        super(_.merge(opts, {
            name: 'rotateTo',
            endValues: { angle }
        }));
    }
}

// }}}
// position {{{

/**
 * Moves or translates the target view such that its center is
 * at the given point in the coordinate system of its superview.;
 */

export class CenterTo extends Animation {
    /**
     * Additional options:
     *
     * `point`: location in superview to which the center of the
     * target view will be located when the animation completes.
     */
    constructor(opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'centerTo',
            endValues: {
                centerX: opts.point.x,
                centerY: opts.point.y
            },
            easing: Animation.easing.cubic
        }));
    }
}

/**
 * Moves or translates the target view such that its top left origin
 * is at the given point in the coordinate system of its superview.;
 */

export class MoveTo extends Animation {
    /**
     * Additional options:
     *
     * - `point`
     */
    constructor(opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'moveTo',
            endValues: {
                x: opts.point.x,
                y: opts.point.y
            },
            easing: Animation.easing.cubic
        }));
    }
}

/**
 * Translates the target view by the given delta.
 */

export class Translate extends Animation {
    /**
     * Additional options:
     *
     * - `delta`: a `Point` indicating how much the
     *   target view should be translated by.  The
     *   default is `PointZero`.
     */
    constructor(opts=null) {
        opts = opts || {};

        let delta = opts.delta || PointZero;

        super(_.merge(opts, {
            name: 'translate',
            endValues: function() {
                return {
                    x: this.target.position.x + delta.x,
                    y: this.target.position.y + delta.y
                };
            }
        }));
    }
}

function slideParams(targetView, dir='N') {
    let sv = targetView.superview;

    if (!sv && (dir === 'E' || dir === 'S')) {
        throw new Error('cannot slide in/out detached view');
    }

    switch (dir) {
    case 'N': return { bottom: 0 };
    case 'E': return { left: sv.width };
    case 'S': return { top: sv.height };
    case 'W': return { right: 0 };
    }
}

/**
 * Slides in the target view from outside the bounds of its
 * superview to its position at the time the animation is created.;
 */

export class SlideIn extends Animation {
    /**
     * `fromDirection` can be any of "N", "E", "W", or "S".
     */
    constructor(targetView, fromDirection, targetPoint=null, opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'slideIn',
            target: targetView,
            startValues: function() {
                return slideParams(this.target, fromDirection);
            },
            endValues: function() {
                return this.target.position.clone();
            }
        }));
    }
}

/**
 * Slides in the target view from its position at the time the animation
 * is created to outside the bounds of its superview.;
 */

export class SlideOut extends Animation {
    /**
     * `toDirection` can be any of "N", "E", "W", or "S".
     */
    constructor(targetView, toDirection, opts=null) {
        opts = opts || {};

        super(_.merge(opts, {
            name: 'slideOut',
            endValues: function() {
                return slideParams(this.target, toDirection);
            }
        }));
    }
}

// }}}
// misc {{{

/**
 * Blinks the target view a number of times.
 */

export class Blink extends Animation {
    /**
     * Additional options:
     *
     * `times`: the number of times to blink the target view.
     * The default is 3 times.
     */
    constructor(targetView, opts={times:3}) {
        opts = opts || {};

        let times = Math.max(1, opts.times || 3);

        super(_.merge(opts, {
            name: 'blink',
            target: targetView,
            endValues: {alpha: 0},
            playCount: times * 2,  // forwards is 1 play as is reverse.
            autoReverse: true
        }));
    }
}

/**
 * Flashes border of target view a few times to grab the user's attention.
 */

export class GrabAttention extends Animation {
    /**
     * Additional options:
     *
     * - `borderColor`: the color of the border; default 'red'.
     * - `borderWidth`: the width of the border; default 10.
     */
    constructor(opts=null) {
        opts = _.merge(opts || {}, {
            name: 'grabAttention',
            startValues: { borderColor: 'red' },
            endValues: { borderWidth: 10 },
            playCount: 3,
            autoReverse: true,
            duration: 500
        });

        super(opts);

        this.on('beforeStart', () => {
            this._valuesBefore = {
                borderColor: this.target.borderColor,
                borderWidth: this.target.borderWidth
            };
        });

        this.once('complete', () => {
            _.merge(this.target, this._valuesBefore);
        });
    }
}

/**
 * Shakes the target view as if to say "nope, try again".
 */

export class Shake extends AnimationSequence {
    /**
     * Additional options:
     *
     * - `dx': amount to shake the target view its the
     *   left and right (default: 10).
     * - `playCount`: number of times to shake (default: 5).
     */
    constructor(opts=null) {
        opts = _.merge(opts || {}, {
            name: 'shake it',
            easing: Animation.easing.linear,
            duration: 100
        });

        let playCount = opts.playCount;
        delete opts.playCount;

        let dx = opts.dx || 10;

        super('shake', [
            new Animation(_.merge(opts, {
                endValues: function () {
                    return { left: this.target.left + dx };
                }
            })),
            new Animation(_.merge(opts, {
                endValues: function () {
                    return { left: this.target.left - dx };
                }
            }))
        ]);

        this.playCount = playCount || 5;
    }
}

/**
 * Wobbles the target view like that of the iOS home screen.
 */

export class Wobble extends AnimationSequence {
    /**
     * Additional options:
     *
     * - `deltaRadians`: delta angle in radians.
     * - `deltaDegrees`: delta angle in degrees (default: 10).
     *   Takes precendence over `deltaRadians`.
     * - `playCount`: number of times to wobble (default: Infinity).
     */
    constructor(opts=null) {
        opts = _.merge(opts || {}, {
            name: 'wobble',
            duration: 200
        });

        let playCount = opts.playCount;
        delete opts.playCount;

        let startDelay = opts.startDelay;
        delete opts.startDelay;

        var deltaRadians = _.has(opts, 'deltaDegrees') ?
            degreesToRadians(opts.deltaDegrees) :
            opts.deltaRadians;

        if (_.isEmpty(deltaRadians)) {
            deltaRadians = degreesToRadians(5);
        }

        super('wobble', [
            new Animation(_.merge(opts, {
                endValues: function () {
                    return { angle: this.target.angle - deltaRadians };
                }
            })),
            new Animation(_.merge(opts, {
                endValues: function () {
                    return { angle: this.target.angle + deltaRadians };
                }
            }))
        ]);

        this.autoReverse = true;
        this.playCount = playCount || Infinity;
        this.startDelay = startDelay || 0;
    }
}

/**
 * An animation that resets its target view to a default state:
 *
 * - alpha: 1 (fully opaque);
 * - angle: 0
 * - scale: (1,1);
 * - position: center of superview at time of animation creation;
 * - borderWidth: 0
 * - hidden: false
 */

export class ResetAnimation extends Animation {
    constructor(opts=null) {
        opts = _.merge(opts || {}, {
            name: 'reset',
            startValues: {hidden:false}
        });

        opts.endValues = function () {
            let sc = this.target.superview.center;

            return {
                alpha: 1,
                angle: 0,
                scaleX: 1,
                scaleY: 1,
                centerX: sc.x,
                centerY: sc.y,
                borderWidth: 0
            };
        };

        super(opts);
    }
}

// }}}
