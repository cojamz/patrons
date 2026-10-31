"""Figure kit for style F (diorama, closer). See STYLE.md for the rules this enforces.

A figure is built on its own layer from hand-shaped parts, separated inside by local dark tones
(never ink), then outlined ONCE as a whole silhouette. Thin held props (poles, tines, cigars)
are laid in after the outline and never outlined. Background props get a dark local-colour edge."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

N = 64
INK = '#2a1e26'

PALE = ('#f3d5c0', '#dcb19a')
LIGHT = ('#ebbd94', '#cf9870')
OLIVE = ('#cf9f70', '#ae7f55')
MED = ('#a8693f', '#86512f')
DEEP = ('#74452a', '#5a331f')
VDEEP = ('#4c2b1b', '#3a1f13')

NB4 = ((1, 0), (-1, 0), (0, 1), (0, -1))


# ------------------------------------------------------------------ layers
def layer():
    return C(N)


def over(l, piece, dark):
    """Lay piece on l. Where piece meets something already drawn, that thing's edge turns to its
    own dark tone (dark: {light key: dark key}) - an internal separation without ink."""
    for y in range(N):
        for x in range(N):
            v = l.get(x, y)
            if v == '.' or piece.get(x, y) != '.':
                continue
            if any(piece.get(x + dx, y + dy) != '.' for dx, dy in NB4) and v in dark:
                l.px(x, y, dark[v])
    l.paste(piece)


def outline_once(l, k='k'):
    l.outline(k)


def under(fig, prop):
    """Thin held prop: shows only where the outlined figure is empty (the hand covers it)."""
    for y in range(N):
        for x in range(N):
            if prop.get(x, y) != '.' and fig.get(x, y) == '.':
                fig.px(x, y, prop.get(x, y))


def edged(l, dark):
    """Background prop: its own boundary pixels become a dark local colour (no ink)."""
    pts = [(x, y) for y in range(N) for x in range(N)
           if l.get(x, y) != '.' and any(l.get(x + dx, y + dy) == '.' for dx, dy in NB4)]
    for x, y in pts:
        l.px(x, y, dark)
    return l


def thick(l, pts, w, k):
    """Polyline w px wide (square brush), for arms."""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        tmp = C(N); tmp.line(x0, y0, x1, y1, '#')
        for y in range(N):
            for x in range(N):
                if tmp.get(x, y) == '#':
                    l.rect(x - (w - 1) // 2, y - (w - 1) // 2, x + w // 2, y + w // 2, k)


# ------------------------------------------------------------------ heads
# One hand-made template per head size. Coordinates are relative to the head's top-left.
HEADS = {
    14: dict(w=14, h=14, inset=[3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3],
             brow=5, eye=7, eyes=(3, 9), nose=[(7, 9)], mouth=10, c=7, ear=7,
             shade=[(13, 7), (13, 8), (13, 9), (13, 10), (12, 11), (11, 12), (10, 12), (7, 13), (8, 13), (9, 13), (10, 13)]),
    16: dict(w=16, h=16, inset=[3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3],
             brow=6, eye=8, eyes=(4, 10), nose=[(8, 10), (8, 11)], mouth=12, c=8, ear=8,
             shade=[(15, 8), (15, 9), (15, 10), (15, 11), (15, 12), (14, 13), (13, 14), (12, 14), (8, 15), (9, 15), (10, 15), (11, 15), (12, 15)]),
}


def head_shape(l, x0, y0, size, k):
    T = HEADS[size]
    for j, ins in enumerate(T['inset']):
        l.hl(x0 + ins, x0 + T['w'] - 1 - ins, y0 + j, k)


def head(l, x0, y0, size, skin, shade, mouth='smile', brows='soft', brow='k', eye='k', glint='w', red='r', ears=True):
    T = HEADS[size]
    w = T['w']
    head_shape(l, x0, y0, size, skin)
    for x, y in T['shade']:
        l.px(x0 + x, y0 + y, shade)
    if ears:
        e = T['ear']
        l.px(x0 - 1, y0 + e, skin); l.px(x0 - 1, y0 + e + 1, shade)
        l.px(x0 + w, y0 + e, shade); l.px(x0 + w, y0 + e + 1, shade)
    ex0, ex1 = T['eyes']
    ey = T['eye']
    for ex in (ex0, ex1):
        l.rect(x0 + ex, y0 + ey, x0 + ex + 1, y0 + ey + 1, eye)
        if glint:
            l.px(x0 + ex, y0 + ey, glint)
    by = T['brow']
    if brows == 'angry':
        l.pts(brow, [(x0 + ex0 - 1, y0 + by - 1), (x0 + ex0, y0 + by - 1), (x0 + ex0 + 1, y0 + by),
                     (x0 + ex1 + 2, y0 + by - 1), (x0 + ex1 + 1, y0 + by - 1), (x0 + ex1, y0 + by)])
    elif brows == 'stern':
        l.hl(x0 + ex0 - 1, x0 + ex0 + 1, y0 + by, brow); l.hl(x0 + ex1, x0 + ex1 + 2, y0 + by, brow)
    elif brows == 'soft':
        l.hl(x0 + ex0, x0 + ex0 + 1, y0 + by, brow); l.hl(x0 + ex1, x0 + ex1 + 1, y0 + by, brow)
    for x, y in T['nose']:
        l.px(x0 + x, y0 + y, shade)
    c, my = x0 + T['c'], y0 + T['mouth']
    if mouth == 'smile':
        l.pts('k', [(c - 2, my), (c + 1, my), (c - 1, my + 1), (c, my + 1)])
    elif mouth == 'grin':
        l.pts('k', [(c - 3, my), (c + 2, my), (c - 2, my + 1), (c - 1, my + 1), (c, my + 1), (c + 1, my + 1)])
    elif mouth == 'flat':
        l.hl(c - 1, c + 1, my + 1, 'k')
    elif mouth == 'smirk':
        l.hl(c - 1, c + 1, my + 1, 'k'); l.px(c + 2, my, 'k')
    elif mouth == 'frown':
        l.pts('k', [(c - 1, my), (c, my), (c - 2, my + 1), (c + 1, my + 1)])
    elif mouth == 'open':          # the one big shout: dark warm red, wider at the top
        l.hl(c - 2, c + 1, my, red); l.hl(c - 1, c, my + 1, red)
    elif mouth == 'o':             # small open
        l.hl(c - 1, c, my, red); l.hl(c - 1, c, my + 1, red)
    return dict(c=c, my=my, ey=y0 + ey, x1=x0 + w - 1, y1=y0 + T['h'] - 1)


# ------------------------------------------------------------------ hair
def hair(l, x0, y0, size, style, k, dark, side='L'):
    T = HEADS[size]
    w = T['w']
    x1 = x0 + w - 1
    ins = T['inset']
    if style in ('short', 'side', 'long', 'bun'):
        l.hl(x0 + 4, x1 - 4, y0 - 1, k)                       # rounded crown sits 1 row proud
        for j in range(4):
            l.hl(x0 + ins[j], x1 - ins[j], y0 + j, k)
        l.pts(k, [(x0, y0 + 4), (x0 + 1, y0 + 4), (x1, y0 + 4), (x1 - 1, y0 + 4), (x0, y0 + 5), (x1, y0 + 5)])
        if style == 'side':                                   # swept fringe
            l.hl(x0 + 2, x0 + 6, y0 + 4, k); l.px(x0 + 2, y0 + 5, k)
        if style == 'short':
            l.pts(k, [(x0 + 5, y0 + 4), (x0 + 6, y0 + 4)])
        if style == 'long':
            l.rect(x0 - 1, y0 + 2, x0, y0 + 11, k); l.rect(x1, y0 + 2, x1 + 1, y0 + 11, k)
            l.px(x0 + 1, y0 + 5, k); l.px(x1 - 1, y0 + 5, k)
            l.rect(x1, y0 + 6, x1 + 1, y0 + 11, dark)
        if style == 'bun':                                    # small bun offset to one side
            bx = x1 - 5 if side == 'R' else x0 + 1
            l.rect(bx, y0 - 4, bx + 3, y0 - 1, k); l.px(bx, y0 - 4, '.'); l.px(bx + 3, y0 - 4, '.')
            l.pts(dark, [(bx + 3, y0 - 2), (bx + 2, y0 - 1)])
        l.pts(dark, [(x1 - 1, y0 + 1), (x1 - 1, y0 + 2), (x1 - 2, y0 + 1), (x1, y0 + 3)])
    elif style == 'crop':                                     # close crop, round crown
        l.hl(x0 + 4, x1 - 4, y0 - 1, k)
        for j in range(3):
            l.hl(x0 + ins[j], x1 - ins[j], y0 + j, k)
        l.pts(k, [(x0 + 1, y0 + 3), (x1 - 1, y0 + 3), (x0, y0 + 4), (x1, y0 + 4)])
        l.pts(dark, [(x1 - 2, y0 + 1), (x1 - 1, y0 + 2), (x1 - 3, y0)])
    elif style == 'afro':                                     # rounded, bumpy rim, natural hairline
        l.ell(x0 - 3, y0 - 6, x1 + 3, y0 + 7, k)
        for bx, by in ((x0 - 1, y0 - 6), (x0 + 5, y0 - 7), (x1 - 4, y0 - 7), (x1 + 2, y0 - 4)):
            l.ell(bx - 1, by, bx + 2, by + 2, k)                 # curl bumps on the rim
        l.pts('.', [(x0 + 2, y0 - 6), (x1 - 1, y0 - 6), (x0 - 3, y0 - 1), (x1 + 3, y0 + 1)])
        head_shape_rows = range(4, T['h'])
        for j in head_shape_rows:                             # face shows below a soft hairline
            l.hl(x0 + ins[j], x1 - ins[j], y0 + j, '#')
        l.pts('#', [(x0 + 4, y0 + 3), (x0 + 5, y0 + 3), (x0 + 6, y0 + 3), (x0 + 7, y0 + 3), (x0 + 8, y0 + 3), (x0 + 9, y0 + 3)])
        l.recolor('#', '.')
        l.pts(dark, [(x1 + 1, y0 + 2), (x1 + 2, y0 + 1), (x1 + 2, y0 + 3), (x1, y0 - 4), (x1 + 1, y0 - 3), (x0 + 3, y0 - 3), (x0 - 1, y0 + 4)])


# ------------------------------------------------------------------ body
def torso(l, cx, ty, sw, ww, h, cloth, dark, slope=2, skin=None, skin_dark=None):
    """Torso with sloping shoulders. cx = centre column, ty = collar row, sw/ww = half widths."""
    l.poly([(cx - 3, ty), (cx + 3, ty), (cx + sw, ty + slope), (cx + sw + 0.5, ty + slope + 2),
            (cx + ww + 1, ty + h), (cx - ww, ty + h), (cx - sw - 0.5, ty + slope + 2), (cx - sw + 1, ty + slope)], cloth)
    # shadow under the far arm, a wedge, not a strip
    l.poly([(cx + sw - 2, ty + slope + 3), (cx + sw + 1, ty + slope + 3), (cx + ww + 1, ty + h), (cx + ww - 2, ty + h)], dark, only=cloth)
    if skin:
        l.rect(cx - 2, ty - 2, cx + 1, ty, skin)
        l.hl(cx - 2, cx + 1, ty - 1, skin_dark)                 # chin shadow on the neck


def legs(l, cx, ly, gap, lw, lh, pants, pdark, shoe, stance=0):
    """Two legs from the hip row ly; stance pushes the feet apart."""
    for s in (-1, 1):
        x0 = cx + (gap // 2 + 1 if s > 0 else -(gap // 2) - lw)
        x0 += s * stance
        l.rect(x0, ly, x0 + lw - 1, ly + lh - 1, pants)
        if s > 0:
            l.rect(x0 + lw - 2, ly + 1, x0 + lw - 1, ly + lh - 2, pdark)
        sx0 = x0 - (1 if s < 0 else 0)
        l.rect(sx0, ly + lh, sx0 + lw, ly + lh + 1, shoe)
    l.rect(cx - gap // 2 - lw, ly, cx + gap // 2 + lw, ly + 1, pants)


HANDS = {
    'grip': ['.ss.', 'ssss', 'sSsS'],            # a pole runs through it, thumb wraps the top
    'fist': ['.ss.', 'ssss', 'SSss', '.sS.'],    # clenched, thumb across
    'flat': ['ssss.', 'sssss', 'sSsSs'],         # resting, finger row over an edge
    'thumb': ['..s.', '..s.', '.ss.', 'ssss', 'sSsS'],   # fist with the thumb up
}


def hand(l, x, y, kind, skin, shade, flip=False):
    rows = HANDS[kind]
    for j, r in enumerate(rows):
        if flip:
            r = r[::-1]
        for i, ch in enumerate(r):
            if ch == 's':
                l.px(x + i, y + j, skin)
            elif ch == 'S':
                l.px(x + i, y + j, shade)


# ------------------------------------------------------------------ props
def pole(l, x, y0, y1, light, dark):
    l.vl(x, y0, y1, light); l.vl(x + 1, y0, y1, dark)


def fork_head(l, x, y, metal):
    """Three tines above a pole whose left column is x. Light metal, no ink, 2px gaps."""
    l.hl(x - 2, x + 3, y + 5, metal)
    l.pts(metal, [(x - 2, y + 4), (x + 3, y + 4)])
    for tx in (x - 3, x + 4):
        l.vl(tx, y + 1, y + 3, metal)
    l.vl(x, y, y + 4, metal); l.vl(x + 1, y, y + 4, metal)


def bill(l, x0, y0, w=8, h=5, band=None):
    """Flat green note, one dark centre mark (and optional paper band)."""
    l.rect(x0, y0, x0 + w - 1, y0 + h - 1, 'n')
    l.rect(x0 + w // 2 - 1, y0 + h // 2 - (1 if h > 4 else 0), x0 + w // 2, y0 + h // 2, 'N')
    if band:
        l.vl(x0 + 1, y0, y0 + h - 1, band)
