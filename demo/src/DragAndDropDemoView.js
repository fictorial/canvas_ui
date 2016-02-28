import  DragAndDropBaseDemoView from './DragAndDropBaseDemoView';
import DraggableDemoView from './DraggableDemoView';
import DroppableDemoView from './DroppableDemoView';
import Label from 'canvas_ui/Label';
import Animation from 'canvas_ui/Animation';
import {FingerSizePoints} from 'canvas_ui/magic';

/**
 * Accepts dropped view with the same background color as
 * configured acceptable color.
 */

export default class DragAndDropDemoView extends DragAndDropBaseDemoView {
    constructor() {
        super('Drag and Drop');

        this.blueDraggable = new DraggableDemoView('blue');
        this.blueDraggable.id = 'blue-draggable';
        this.addSubview(this.blueDraggable);
        this.blueDraggable.userInteractionEnabled = false;

        this.blueDropbox = new DroppableDemoView('blue');
        this.blueDropbox.id = 'blue-dropbox';
        this.addSubview(this.blueDropbox);

        this.redDropbox = new DroppableDemoView('red');
        this.redDropbox.id = 'red-dropbox';
        this.addSubview(this.redDropbox);

        let redInstructions = 'Drop solid red box on red-bordered box.',
            blueInstructions = 'Drop solid blue box on blue-bordered box.',
            failText = 'Oops!';

        this.infoLabel = new Label(redInstructions);
        this.infoLabel.textAlign = 'center';
        this.infoLabel.textColor = 'red';
        this.addSubview(this.infoLabel);

        this.redDropbox.on('dropReceived', () => {
            this.redDraggable.alignCenter(this.redDropbox)
                .addAnimation({
                    name: 'spin',
                    endValues: {angle: 2 * Math.PI},
                    duration: 1000,
                    easing: Animation.easing.cubic
                });

            this.redDraggable.userInteractionEnabled = false;
            this.blueDraggable.userInteractionEnabled = true;

            this.infoLabel.text = blueInstructions;
            this.infoLabel.textColor = 'blue';
        });

        this.blueDropbox.on('dropReceived', (/*droppedView*/) => {
            this.blueDraggable.alignCenter(this.blueDropbox)
                .addAnimation({
                    name: 'spin',
                    endValues: {angle: 2 * Math.PI},
                    duration: 1000,
                    easing: Animation.easing.cubic
                });

            this.blueDraggable.userInteractionEnabled = false;

            this.infoLabel.text = 'Amazing!';
            this.infoLabel.textColor = '#282';

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.redDraggable.userInteractionEnabled = true;
                this.blueDraggable.userInteractionEnabled = true;

                this.redDraggable.angle = this.blueDraggable.angle = 0;

                this.infoLabel.text = redInstructions;
                this.infoLabel.textColor = 'red';

                this.needsLayout = true;
            }, 4000);
        });

        this.redDraggable.on('dropRejected', () => {
            this.infoLabel.text = failText;
            this.infoLabel.textColor = 'black';

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.infoLabel.text = redInstructions;
                this.infoLabel.textColor = 'red';
            }, 1000);
        });

        this.blueDraggable.on('dropRejected', () => {
            this.infoLabel.text = failText;
            this.infoLabel.textColor = 'black';

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.infoLabel.text = blueInstructions;
                this.infoLabel.textColor = 'blue';
            }, 1000);
        });

        this.bringToFront(this.redDraggable);
        this.bringToFront(this.blueDraggable);
    }

    layoutSubviews() {
        this.redDraggable.size.set(FingerSizePoints, FingerSizePoints);
        this.redDraggable.moveToCenterMiddle();

        this.blueDraggable.size.set(FingerSizePoints, FingerSizePoints);
        this.blueDraggable.moveBelow(this.redDraggable, 20).alignLeft(this.redDraggable);

        let dropboxSize = Math.round(FingerSizePoints * 1.5);

        this.blueDropbox.size.set(dropboxSize, dropboxSize);
        this.blueDropbox.moveToCenterMiddle().left = 20;

        this.redDropbox.size.set(dropboxSize, dropboxSize);
        this.redDropbox.moveToCenterMiddle().right = this.width - 20;

        this.infoLabel.frame.set(0, 0, this.width, 30);
    }

    willBeRemovedFromView() {
        super.willBeRemovedFromView();
        clearTimeout(this.timeout);
    }
}
