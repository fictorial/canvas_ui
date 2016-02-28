import  _ from 'lodash';
import DemoView from './DemoView';
import Animation from 'canvas_ui/Animation';
import AnimationSequence from 'canvas_ui/AnimationSequence';
import AnimationParallel from 'canvas_ui/AnimationParallel';
import View from 'canvas_ui/View';
import Button from 'canvas_ui/Button';
import Label from 'canvas_ui/Label';
import ProgressBar from 'canvas_ui/ProgressBar';
import {ResetAnimation, FadeIn, FadeOut, Blink, Spin, PopIn, Scale} from 'canvas_ui/BasicAnimations';
import {layoutNaturalFlow} from 'canvas_ui/BasicLayouts';
import {SystemFontOfSize} from 'canvas_ui/fonts';
import Point from 'canvas_ui/Point';

export default class AnimationDemoView extends DemoView {
    constructor() {
        super('Properties can be animated');

        this.insets.setAll(10);

        this.addTargetView();

        this.buttons = _.map([
            { text: 'Fall', onTap: this.fallDownAndBounce.bind(this) },
            { text: 'Fade Out', onTap: this.fadeOut.bind(this) },
            { text: 'Fade In', onTap: this.fadeIn.bind(this) },
            { text: 'Blink', onTap: this.blink.bind(this) },
            { text: 'Pop In', onTap: this.popIn.bind(this) },
            { text: 'Spin', onTap: this.spin.bind(this) },
            { text: 'Borders', onTap: this.borderGrowShrink.bind(this) },
            { text: 'Parallel: Fade In + Spin', onTap: this.fadeInAndSpinSimultaneously.bind(this) },
            { text: 'Sequence', onTap: this.runSequenceA.bind(this) }
        ], def => {
            let b = new Button(def.text);
            b.on('tap', def.onTap);
            this.addSubview(b);
            return b;
        });

        this.progressBar = new ProgressBar();
        this.addSubview(this.progressBar);

        this.eventLabel = new Label();
        this.eventLabel.backgroundColor = null;
        this.eventLabel.textColor = '#aaa';
        this.eventLabel.font = SystemFontOfSize(12);
        this.addSubview(this.eventLabel);

        this.targetView.on('animationAdded', anim => {
            this.eventLabel.text = `Animation "${anim.name}" added`;
        });
        this.targetView.on('animationStarted', anim => {
            this.eventLabel.text = `Animation "${anim.name}" started`;
        });
        this.targetView.on('animationCompleted', anim => {
            this.eventLabel.text = `Animation "${anim.name}" completed`;
        });
    }

    addTargetView() {
        this.targetView = new View();
        this.targetView.backgroundColor = 'red';
        this.addSubview(this.targetView);
    }

    layoutSubviews() {
        this.targetView.size.set(100, 100);
        this.targetView.moveToCenterMiddle();

        layoutNaturalFlow(this, this.buttons);

        this.progressBar.size.set(this.width, 2);
        this.progressBar.moveInTopLeftCorner();

        this.eventLabel.width = this.width - 20;
        this.eventLabel.height = 20;
        this.eventLabel.moveInBottomLeftCorner(new Point(10, -10));
    }

    fadeOut() {
        this.runAnimation(new FadeOut());
    }

    fadeIn() {
        this.runAnimation(new FadeIn({duration: 1000}));
    }

    fallDownAndBounce() {
        this.runAnimation(new Animation({
            name: 'fallDownAndBounce',
            target: this.targetView,
            endValues: {bottom: this.height - 100},
            easing: Animation.easing.bounceEnd,
            duration: 1000
        }));
    }

    blink() {
        this.runAnimation(new Blink());
    }

    popIn() {
        this.runAnimation(new PopIn());
    }

    spin() {
        this.runAnimation(new Spin({
            duration: 2000,
            easing: Animation.easing.cubic
        }));
    }

    fadeInAndSpinSimultaneously() {
        this.spin();
        this.addAnimation(new FadeIn(this, {duration:2000}));
    }

    borderGrowShrink() {
        this.runAnimation(new Animation({
            name: 'borderGrowShrink',
            target: this.targetView,
            startValues: {borderWidth: 0, borderColor: 'orange'},
            endValues: {borderWidth: 8},
            autoReverse: true,
            playCount: 3,  // leave it non-zero to show reset functionality
            duration: 500
        }));
    }

    runSequenceA() {
        let anim = opts => {
            return new Animation(_.merge({
                target: this.targetView,
                easing: Animation.easing.cubic
            }, opts));
        };

        this.runAnimation(new AnimationSequence('sample sequence', [
            anim({endValues: {left: 0, top: 0}}),
            anim({endValues: {right: this.width, bottom: this.height}}),
            anim({endValues: {right: this.width, top: 0}}),
            anim({endValues: {left: 0, bottom: this.height}}),
            new AnimationParallel('backToCenter', [
                anim({
                    endValues: {
                        centerX: this.contentCenterX,
                        centerY: this.contentCenterY
                    },
                    duration: 1200
                }),
                new Spin({startDelay:600, duration:600})
            ]),
            new Scale({scale:0.8, duration:200}),

            // like PopIn but from current scale not 0
            new Scale({
                scale: 1.0,
                easing: Animation.easing.backEnd
            })
        ]));
    }

    runAnimation(anim) {
        this.hideButtons(true);

        var self = this;
        clearTimeout(this.resetTimeout);

        this.targetView.addAnimation(anim)
            .on('update', function () {
                self.progressBar.progress = this.elapsedTimeUnit;
                self.progressBar.barColor = this.animTime === -1 ? 'orange' : 'green';
            })
            .once('complete', () => {
                this.progressBar.progress = 0;
                setTimeout(() => {
                    this.targetView.addAnimation(new ResetAnimation())
                        .once('complete', () => {
                            this.hideButtons(false);
                            setTimeout(() => {this.eventLabel.text = '';}, 500);
                        });
                }, 500);
            });

        return anim;
    }

    hideButtons(yesNo) {
        _.each(this.buttons, b => {b.hidden = yesNo;});
    }
}
