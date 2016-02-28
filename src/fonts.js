import {FingerSizePoints} from './magic';

var systemFontName     = 'HelveticaNeue, sans-serif',
    boldSystemFontName = 'HelveticaNeue-Bold, sans-serif';

export function SystemFontOfSize(pt) {
    return `${pt}pt ${systemFontName}`;
}

export function BoldSystemFontOfSize(pt) {
    return `${pt}pt ${boldSystemFontName}`;
}

export function lineHeight(fontSpec) {
    var match = fontSpec.match(/(\d+)px /);
    if (match)
        return parseInt(match[1], 10) * 2;

    match = fontSpec.match(/(\d+)pt /);
    if (match)
        return Math.round(parseInt(match[1], 10) * 1.7);

    return FingerSizePoints;
}

import {isMobile} from './magic';
let _isMobile = isMobile();

export function _makeFont(size) {
    //return localStorage.BOLD_FONTS === 'true' ? BoldSystemFontOfSize(size) : SystemFontOfSize(size);
    return SystemFontOfSize(size);
}

export function smallFont()  { return _isMobile ? _makeFont(9) : _makeFont(12); }
export function normalFont() { return _isMobile ? _makeFont(11) : _makeFont(17); }
export function largeFont()  { return _isMobile ? _makeFont(13) : _makeFont(19); }
export function hugeFont()   { return _isMobile ? _makeFont(17) : _makeFont(21); }
