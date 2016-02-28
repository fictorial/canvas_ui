import  _ from 'lodash';
import AnimationSequence from './AnimationSequence';

/**
 * A composite animation that runs multiple Animations concurrently.
 *
 * Events:
 *
 * - `complete`: emitted when all composed animations;
 *   have completed; thus, they don't have to have the same;
 *   durations.
 */

export default class AnimationParallel extends AnimationSequence {
    start() {
        var complete = 0;

        _.each(this._animations, a => {
            a.once('complete', () => {
                if (++complete === this._animations.length) {
                    this.emit('complete');
                }
            });

            a.start();
        });

        return this;
    }
}
