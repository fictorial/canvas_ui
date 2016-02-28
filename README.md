# Canvas UI

A UI toolkit for the Canvas API inspired by UIKit for iOS.

If you know of Zebkit, this is similar but has "nicer" support for mobile UI
idioms (see below).

## Overview

This is a set of UI elements/controls/widgets/views that together comprise a
"toolkit" for making user interfaces for games or apps.  It relies on just the
Canvas API and thus works in places like HTML5 canvas or in native
implementations of the Canvas API such as Ejecta.

## Why was this created?

Most users that want a UI for Canvas use a DOM element placed atop the canvas.
I had a situation where I wanted to avoid a browser-based environment (due to
performance issues for a game) but had an accelerated canvas API -- namely
Ejecta.  Thus, without a DOM and all that comes with it, I was left to create a
UI toolkit for canvas that worked in or out of a browser environment.

Yes, this is a pretty niche scenario but perhaps this is useful to a few people
anyway.

## Why should I care?

- Follows basic ideas of UIKit from iOS which has been pretty successful
- View system is really easy to understand, use, and extend
- View layout is done in code but is simple and works well at various device
  resolutions given convenience layout helpers like "place this view in corner",
  "place this view above that view", etc.  No interface builder, insane auto-layout
  constraint system, hard-coding magic numbers, etc.
- Redraw is on-demand not continuous (doesn't drain device battery if nothing
  is happening)
- Animations via tweening on any view properties
- Hooks/callbacks/events for most things

## Appropriate Uses

- Canvas based apps/games
- Ejecta based iOS apps/games
- Rapid prototyping

## Probably not so great when...

- Internationalization and localization are required (e.g. right-to-left text)
- Text selection is needed
- Copy and paste is needed
- Multi-line text editing is needed
- A true "native" experience is paramount for a mobile target

## What's in the box?

- Hierarchical view system with clipping, shadows, borders, etc.
- Simple code-based view layout
- Touch, mouse, and keyboard handling
- Single, double, arbitary taps; long press
- Built-in drag and drop to/from any view
- Partial transparency
- Tween-based animations
- Label
- Button
- Image view with various content modes
- Modal views (alert, confirm)
- Scrolling with content view, interia scrolling, indicators
- Progress bar
- Slider
- Notification/toast
- Segment/choices
- Navigation stack
- Table view w/ cells, data source, delegate, header/footer
- Left swipe to delete in table views
- Long press and drag to reorder table view cells
- Table view search/filtering
- Word-wrapping for multiline text display with scrolling
- A custom single-line text input view with basic Emacs and OS X shortcuts (extensible)
- A software or on-screen keyboard ala iOS (QWERTY)
- Paging/carousel

## Using

The code is written in ES2015 and is to be transpiled for browser usage (or
elsewhere like Ejecta) via Babel as most browsers at this time (late 2015) do
not support ES2015 directly.

Build your app by `require`-ing the Canvas UI sources you need. Then transpile
with Babel, bundle all of it together with Browserify, and distribute the ES5
bundle.

## Incremental development workflow

Install Node.js (and with it NPM).

Install dependencies:

    $ cd canvas_ui
    $ npm install

Symlink the Canvas UI src directory (`canvas_ui/canvas_ui`) into `node_modules`
so that any demo or application code can just `require('canvas_ui/xyz')`.

    $ cd node_modules
    $ ln -s ../src canvas_ui

See [this](https://github.com/substack/browserify-handbook#avoiding-)
for more details on this technique.

To automatically transpile to ES5, bundle, and reload the updated code, I use:

- [Babel](https://babeljs.io/)
- [Browserify](http://browserify.org/)
- [Babelify](https://github.com/babel/babelify)
- [budo](https://github.com/mattdesl/budo)
- [garnish](https://github.com/mattdesl/garnish)

Here's how:

    $ npm install budo garnish -g
    $ budo demo/src/demoMain.js:demoBundle.js --live -- -t babelify | garnish

Then open your browser to http://localhost:9966.  Note that the `demo/index.html`
has a `script` tag loading `demoBundle.js`.

Edit any of the demo files or Canvas UI files and save.  They will be
babelified via browserify via budo and the browser will be refreshed.

If you hit an exception and make edits while the exception is stuck in the
dev tools (e.g. "Pause on Caught Exceptions" is checked in Chrome), you will
need to manually refresh the browser post-save.

## Deployment workflow

To build the demo (replace with your own application as needed) for deployment:

    $ browserify -e src/demoMain.js -t babelify -o demoBundle.js
    $ npm install -g uglify-js
    $ uglifyjs demoBundle.js -c -m -o demoBundle.min.js

Then update the `script` tag for `demoBundle.min.js`.

[UglifyJS2](https://github.com/mishoo/UglifyJS2) is used a minifier of the bundled ES5 code.

TODO:

- mangle properties too via UglifyJS2. the concern is that the text edit actions use strings;
  I haven't tried this at all yet.

## Caveats, Known Issues, Things to be done

### Redraw

On redraw, the root view on down is redrawn.  Dirty-rect clearing and redrawing
only what is changed seemed like overkill given that a lot of work would still
need to be done to correctly composite without cached bitmaps of each
already-rendered view.

### Touch

There's no support for multi-touch and gesture recognizers. There is built-in
support for single, double, n-tap; long-press; dragging/panning. What's missing
from say iOS is: pinch, swipe, rotate. Note that there is support for swiping
table view cells that are editable.  This could be generalized.

### To be done

See the `TODO` file.

## Author

Brian Hammond <brian@fictorial.com>

## License

MIT
