import Point from './Point';
import Size from './Size';
import Frame from './Frame';
import EdgeInsets from './EdgeInsets';

/**
 * The size of a finger in points as per Apple a while back.
 * Obviously an approximation; the idea is to avoid tiny hit targets.
 */

export let PointZero = new Point();
export let SizeZero = new Size();
export let RectZero = Frame.makeFrame(0, 0, 0, 0);
export let EdgeInsetsZero = new EdgeInsets();

export function isMobile() {
    return !!navigator.userAgent.match(/iPad|iPhone|Android/i);
}

// Looks OK either way really.
export let FingerSizePoints = isMobile() ? 50 : 60;

export let StandardMargin = isMobile() ? 12 : 20;
export let SectionMargin  = isMobile() ? 30 : 20;

