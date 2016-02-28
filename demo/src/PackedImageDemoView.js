import  _ from 'lodash';
import DemoView from './DemoView';
import PackedImageView from 'canvas_ui/PackedImageView';
import ImageView from 'canvas_ui/ImageView';
import Label from 'canvas_ui/Label';
import Point from 'canvas_ui/Point';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';
import {PopIn} from 'canvas_ui/BasicAnimations';
import {transparent} from 'canvas_ui/magic';

/**
 * A demo of a "packed image" which is an image that consists
 * of sub-images defined by rectangular bounds.
 *
 * One might use a tool like "Texture Packer" to create such
 * a packed image. The idea is that it's better for performance
 * than multiple separate images since only one image would need
 * to be downloaded/loaded and fewer context switches is less
 * overhead during rendering.
 *
 * We do not support rotation of sub-image frames in the packed
 * image at this time.
 */

export default class PackedImageDemoView extends DemoView {
    constructor() {
        super('Packed Image');

        let subImageInfo = {
            apple: {x:2,y:2,w:574,h:542},
            banana: {x:176,y:546,w:362,h:349},
            cherry: {x:540,y:546,w:381,h:324},
            lemon: {x:578,y:2,w:275,h:210},
            pineapple: {x:2,y:546,w:172,h:373}
        };

        this.imageView = new PackedImageView('assets/fruit.png', subImageInfo);
        this.addSubview(this.imageView);

        this.infoLabel = new Label();
        this.infoLabel.font = BoldSystemFontOfSize(30);
        this.infoLabel.backgroundColor = transparent;
        this.infoLabel.textColor = 'orange';
        this.infoLabel.drawMode = 'xor';
        this.addSubview(this.infoLabel);
        this.imageView.on('imageChanged', () => {
            this.infoLabel.text = this.imageView.currentImageName;
            this.needsLayout = true;
            this.infoLabel.addAnimation(new PopIn(this.infoLabel));
        });

        // Tap current sub-image to advance to next image.

        this.imageView.currentImageName = 'apple';
        let index = 0;
        this.imageView.on('tap', () => {
            let imageNames = _.keys(subImageInfo).sort();
            index = (index + 1) % imageNames.length;
            this.imageView.currentImageName = imageNames[index];
        });

        this.wholeImageView = new ImageView('assets/fruit.png', 'scaleAspectFit');
        this.addSubview(this.wholeImageView);
        this.wholeImageView.borderWidth = 1;
        this.wholeImageView.borderColor = 'rgba(0,0,0,0.2)';
    }

    layoutSubviews() {
        super.layoutSubviews();

        let imageSize = Math.min(this.halfWidth, this.halfHeight);
        this.imageView.size.set(imageSize, imageSize);
        this.imageView.moveToCenterMiddle();

        this.infoLabel.sizeToFit().moveToCenterMiddle();

        this.wholeImageView.size.set(Math.max(100, this.width / 4),
                                     Math.max(100, this.height / 10));
        this.wholeImageView.moveInBottomLeftCorner(new Point(20, -20));
    }
}
