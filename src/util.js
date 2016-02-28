import  _ from 'lodash';

export function radiansToDegrees(radians) {
    return radians * 180.0 / Math.PI;
}

export function degreesToRadians(degrees) {
    return degrees * Math.PI / 180.0;
}

export function setPropertyRecursive(view, prop, val) {
    view[prop] = val;

    _.each(view.subviews, subview => setPropertyRecursive(subview, prop, val));
}

export function distanceSquared(a, b) {
    return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
}
