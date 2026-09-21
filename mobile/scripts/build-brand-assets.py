#!/usr/bin/env python3
"""
Build the KEPT app icon, adaptive icons, favicon and splash artwork.

    python3 scripts/build-brand-assets.py

Writes editable SVG sources to assets/brand/ and rasterises them into
assets/images/. Requires `rsvg-convert` (brew install librsvg).

No type is baked into any asset. The splash is the mark alone: Expo renders it
around 220pt wide, where a wordmark would be too small to read, and Android 12+
often substitutes the app icon anyway. It also keeps a single splash image
working on both the cream and the ink background.

THE MARK
--------
A pinky promise, large, with a small kiwi ring floating just above the interlock.
The artwork is assets/brand/promise.svg.

The ring sits exactly where the artwork's three sparkle marks were, and those
sparkles are dropped — the ring IS the spark. Keeping both put two competing
accents in the same small area. This is why `glyph()` takes a `sparks` flag and
the mark passes False: the source file is left untouched.

Set WITH_PROMISE = False to fall back to the plain closed band — a single thick
kiwi circle, no glyph. Both are kept reachable because the choice between them is
a brand call, not a technical one.

Notes, all of them learned by getting it wrong first:

  * The lockup is centred on its own bounding box, NOT on the glyph. The ring
    extends above the artwork, so centring the glyph alone leaves the whole mark
    sitting about 2% low — visible once it is inside a circular launcher mask.

  * The whole lockup is painted by ONE gradient, via a mask over a full-canvas
    rect. Filling each shape with url(#lit) instead gives every path its own
    gradient box, so the ring and the hands each restart the ramp and the light
    does not agree between them.

  * The SPLASH uses a darker ramp than the icon. It has no ink field behind it
    and one image must sit on cream in light mode and ink in dark; the icon
    ramp's light end has almost no contrast against cream. An earlier cream glyph
    was invisible there entirely — the splash rendered as an empty ring.

  * The line art is dilated by stroking each filled path in its own fill colour.
    The artwork is fills rather than strokes, so weight cannot be added any other
    way, and it needs weight to survive at launcher sizes.
"""

import io
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "assets", "brand")
IMAGES = os.path.join(ROOT, "assets", "images")

WITH_PROMISE = True

INK = "#0B0F0A"
CREAM = "#FBFBF4"
KIWI_LIGHT = "#C3F45E"  # top left, where the light comes from
KIWI_SHADE = "#7FC117"  # bottom right

CANVAS = 1024
C = CANVAS / 2

# --- the promise artwork, in its own viewBox units -------------------------
PROMISE_VIEWBOX = (332.0, 225.0)
# Ink extent of the HANDS path alone, measured with getBBox() rather than eyeballed.
# The sparkles are not drawn, so they must not be in this box: an earlier estimate
# of y=30 (the sparkle top) padded ~18 units of phantom space above the hands and
# threw the whole lockup off centre.
PROMISE_BBOX = (13.87, 48.05, 322.61, 191.02)

# --- the lockup, as fractions of the canvas -------------------------------
# Ring on top, gap, hands below; the stack is centred as a whole.
GLYPH_WIDTH = 0.840  # of the artwork's full viewBox width
RING_DIAMETER = 0.260
RING_GAP = 0.036
RING_BAND = 0.17  # of the ring's own diameter
GLYPH_BOLD = 9.0  # canvas px of dilation at full size

# The plain band, used when WITH_PROMISE is False.
BAND_OUTER = 0.383
BAND_WIDTH = 0.148

# Android's adaptive icon guarantees only the inner 66% of the foreground is
# visible. The furthest ink from centre is the hand tips — widest horizontally and
# pushed below centre by the ring stacked above them — so they, not the ring, set
# the limit. 0.72 keeps them inside the safe circle with margin.
SAFE_SCALE = 0.72
BAND_SAFE_SCALE = 0.30 / BAND_OUTER

# Darker at both ends, for anything sitting on cream. The `lit` ramp's light end is
# almost invisible there. The splash needed this first — it has no ink field to sit on —
# and the icon needs it for the same reason now that it is cream rather than ink.
CREAM_LIGHT = "#9BDB33"
CREAM_SHADE = "#5F9410"


def gradient(name, light, shade):
    return (
        '<linearGradient id="%s" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>'
        % (name, light, shade)
    )


def painted(white_body, grad_id):
    """Paint a whole lockup with ONE gradient.

    Filling each shape with url(#lit) would give every path its own gradient box,
    so the ring and the hands would each restart the ramp and the light would not
    agree between them. Masking a single full-canvas rect instead means one light
    falls across the entire mark.
    """
    return '<mask id="mark">%s</mask>\n<rect width="%d" height="%d" fill="url(#%s)" mask="url(#mark)"/>' % (
        white_body,
        CANVAS,
        CANVAS,
        grad_id,
    )


def promise_paths():
    source = os.path.join(BRAND, "promise.svg")
    if not os.path.exists(source):
        sys.exit("assets/brand/promise.svg is missing — it is the source artwork for the mark")
    paths = re.findall(r'\sd="([^"]+)"', io.open(source, encoding="utf-8").read())
    if len(paths) < 2:
        sys.exit("promise.svg: expected the hands path plus sparkle paths")
    return paths[0], paths[1:]  # hands, sparkles


def circle(cx, cy, outer, width, stroke):
    return '<circle cx="%.2f" cy="%.2f" r="%.2f" stroke="%s" stroke-width="%.2f" fill="none"/>' % (
        cx,
        cy,
        outer - width / 2,
        stroke,
        width,
    )


def glyph(width_px, cx, cy, colour, bold, hands, sparkles, sparks=False):
    """Place the artwork so the centre of its ink bbox lands on (cx, cy)."""
    src_w = PROMISE_VIEWBOX[0]
    s = width_px / src_w
    bx = (PROMISE_BBOX[0] + PROMISE_BBOX[2]) / 2.0
    by = (PROMISE_BBOX[1] + PROMISE_BBOX[3]) / 2.0
    tx = cx - bx * s
    ty = cy - by * s
    # stroke-width is in the glyph's own units, so divide by the scale.
    weight = ' stroke="%s" stroke-width="%.3f" stroke-linejoin="round" stroke-linecap="round"' % (colour, bold / s)
    ds = [hands] + (sparkles if sparks else [])
    body = "".join('<path d="%s" fill="%s"%s/>' % (d, colour, weight) for d in ds)
    return '<g transform="translate(%.2f %.2f) scale(%.5f)">%s</g>' % (tx, ty, s, body), s


def mark(scale=1.0, colour="#FFFFFF", art=None):
    """The full lockup at `scale`, where 1.0 fills the icon canvas.

    Drawn in a single flat colour — pass #FFFFFF and hand the result to
    `painted()` to carry the brand gradient across the whole mark.
    """
    if not WITH_PROMISE:
        return circle(C, C, CANVAS * BAND_OUTER * scale, CANVAS * BAND_WIDTH * scale, colour)

    hands, sparkles = art
    glyph_w = CANVAS * GLYPH_WIDTH * scale
    s = glyph_w / PROMISE_VIEWBOX[0]
    hands_h = (PROMISE_BBOX[3] - PROMISE_BBOX[1]) * s
    ring_d = CANVAS * RING_DIAMETER * scale
    gap = CANVAS * RING_GAP * scale

    # Centre the LOCKUP, not the glyph. The ring is a stacked element above the
    # artwork, so centring the hands alone leaves the whole mark sitting low.
    lockup_h = ring_d + gap + hands_h
    top = C - lockup_h / 2.0
    ring_cy = top + ring_d / 2.0
    hands_cy = top + ring_d + gap + hands_h / 2.0

    body, _ = glyph(glyph_w, C, hands_cy, colour, GLYPH_BOLD * scale, hands, sparkles)
    return body + "\n" + circle(C, ring_cy, ring_d / 2.0, ring_d * RING_BAND, colour)


def document(body, background=None, defs="", size=CANVAS):
    field = '<rect width="%d" height="%d" fill="%s"/>' % (size, size, background) if background else ""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">\n'
        "<defs>%s</defs>\n%s\n%s\n</svg>" % (size, size, size, size, defs, field, body)
    )


def sources():
    art = promise_paths() if WITH_PROMISE else None
    safe = SAFE_SCALE if WITH_PROMISE else BAND_SAFE_SCALE

    ink_grad = gradient("lit", KIWI_LIGHT, KIWI_SHADE)
    cream_grad = gradient("oncream", CREAM_LIGHT, CREAM_SHADE)

    return {
        # The icon is cream, like the app itself: light-first is the brand, and an ink
        # tile read as a different product sitting next to a cream splash.
        "icon": document(painted(mark(art=art), "oncream"), CREAM, cream_grad),
        "icon-foreground": document(painted(mark(safe, art=art), "oncream"), None, cream_grad),
        # The launcher tints this layer flat, so the gradient would be thrown away
        # — it has to be one solid colour.
        "icon-monochrome": document(mark(safe, art=art)),
        # The bare mark keeps the brighter ramp: it is the one that goes on ink.
        "mark": document(painted(mark(art=art), "lit"), None, ink_grad),
        "splash": document(painted(mark(0.88, art=art), "oncream"), None, cream_grad),
        "icon-background": document("", CREAM),
    }


# source name → (output file, pixel size)
OUTPUTS = [
    ("icon", "icon.png", 1024),
    ("icon", "favicon.png", 48),
    ("icon-background", "android-icon-background.png", 512),
    ("icon-foreground", "android-icon-foreground.png", 512),
    ("icon-monochrome", "android-icon-monochrome.png", 432),
    ("splash", "splash-icon.png", 1024),
]


def rasteriser():
    """rsvg-convert where it exists, otherwise the bundled resvg script.

    librsvg is a system package with no usable Windows build, which left the assets
    impossible to regenerate on a Windows machine. `npm install` brings resvg with it,
    so the Node path needs nothing extra installed by hand.
    """
    if shutil.which("rsvg-convert"):
        return lambda source, out, size: [
            "rsvg-convert", "-w", str(size), "-h", str(size), source, "-o", out
        ]

    node = shutil.which("node")
    script = os.path.join(ROOT, "scripts", "rasterise.mjs")
    if node and os.path.exists(script):
        return lambda source, out, size: [node, script, source, out, str(size)]

    sys.exit(
        "No rasteriser. Either install librsvg (brew install librsvg) or run "
        "`npm install` in mobile/ so that resvg is available to scripts/rasterise.mjs."
    )


def main():
    command = rasteriser()

    os.makedirs(BRAND, exist_ok=True)
    for name, svg in sources().items():
        io.open(os.path.join(BRAND, name + ".svg"), "w", encoding="utf-8").write(svg)

    for name, out, size in OUTPUTS:
        subprocess.run(
            command(os.path.join(BRAND, name + ".svg"), os.path.join(IMAGES, out), size),
            check=True,
        )
        print("  %-32s %dpx" % (out, size))


if __name__ == "__main__":
    main()
