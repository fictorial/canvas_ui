import  _ from 'lodash';

// These shape path routines were originally authored by "MJS 2015".
// See http://xqt2.com/p/MoreCanvasContext.html for more information.

let TwoPi = 2 * Math.PI;

/**
 * Adds a rounded rectangle path to the context.
 *
 * Radius is a number or an array of four numbers
 * [top_left, top_right, lower_right, lower_left] for individual control.
 *
 * The radius is limited by the size of the rectangle, so that if the dimensions
 * are to small, the radius is shrunk.
 */

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    let minWH = Math.min(w/2, h/2);

    if (!_.isArray(r)) {
        r = Math.min(Math.abs(r), minWH);
        r = [r, r, r, r];
    } else {
        for (var i = 0; i<4; ++i) {
            r[i] = Math.min(Math.abs(r[i]), minWH) || 0;
        }
    }

    this.beginPath();

    this.moveTo(Math.round(x + r[0]), Math.round(y));
    this.lineTo(Math.round(x + w - r[1]), Math.round(y));
    this.arc(Math.round(x + w - r[1]), Math.round(y + r[1]), Math.round(r[1]), 0.75 * TwoPi, 0, false);

    this.lineTo(Math.round(x + w), Math.round(y + h - r[2]));
    this.arc(Math.round(x + w - r[2]), Math.round(y + h - r[2]), Math.round(r[2]), 0, 0.25 * TwoPi, false);

    this.lineTo(Math.round(x + r), Math.round(y + h));
    this.arc(Math.round(x + r[3]), Math.round(y + h - r[3]), Math.round(r[3]), 0.25 * TwoPi, 0.5 * TwoPi, false);

    this.lineTo(Math.round(x), Math.round(y + r[0]));
    this.arc(Math.round(x + r[0]), Math.round(y + r[0]), Math.round(r[0]), 0.5 * TwoPi, 0.75 * TwoPi, false);

    this.closePath();
};

/**
 * A regular n-sided shape. It starts and closes a complete path.
 */

CanvasRenderingContext2D.prototype.polygon = function (x, y, r, n=3, angle=0) {
    if (n < 3) {
        throw new Error('invalid number of sides');
    }

    let endAngle = angle + TwoPi,
        angleIncr = TwoPi / n;

    var px = x - r * Math.sin(angle),
        py = y - r * Math.cos(angle);

    this.beginPath();

    this.moveTo(px, py);

    while (angle < endAngle) {
        px = x - r * Math.sin(angle);
        py = y - r * Math.cos(angle);

        this.lineTo(px, py);

        angle += angleIncr;
    }

    this.closePath();
};

/**
 * Adds a path that draws a star.
 * Ratios bigger than 1 will grow the star.
 * A ratio of exactly 1 will mimic a polygon of 2*n sides.
 */

CanvasRenderingContext2D.prototype.star = function (x, y, r, ratio=0.6, n=5, angle=0) {
    let endAngle = angle + TwoPi,
        angleIncr = Math.PI / n;

    var px = x - r * Math.sin(angle),
        py = y - r * Math.cos(angle);

    this.beginPath();

    this.moveTo(px, py);
    angle += angleIncr;

    px = x - ratio * r * Math.sin(angle);
    py = y - ratio * r * Math.cos(angle);
    this.lineTo(px, py);
    angle += angleIncr;

    while (angle < endAngle) {
        px = x - r * Math.sin(angle);
        py = y - r * Math.cos(angle);
        this.lineTo(px, py);
        angle += angleIncr;

        px = x - ratio * r * Math.sin(angle);
        py = y - ratio * r * Math.cos(angle);
        this.lineTo(px, py);
        angle += angleIncr;
    }

    this.closePath();
};

/**
 * Adds a shap which is a set of straight lines between the given points
 * [[x,y]]
 * shape is a list of point ala [[x,y]]
 * This will draw straight lines between them.
 */

CanvasRenderingContext2D.prototype.shape = function (x, y, points, scale=1, angle=0) {
    let sinAngle = Math.sin(angle),
        cosAngle = Math.cos(angle);

    var px = x + scale * (cosAngle * points[0][0] - sinAngle * points[0][1]),
        py = y + scale * (sinAngle * points[0][0] + cosAngle * points[0][1]);

    this.beginPath();

    this.moveTo(px, py);

    for (var i = 1, N = points.length; i < N; ++i) {
        let point = points[i];

        px = x + scale * (cosAngle * point[0] - sinAngle * point[1]);
        py = y + scale * (sinAngle * point[0] + cosAngle * point[1]);

        this.lineTo(px, py);
    }

    this.closePath();
};
