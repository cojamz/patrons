"""Batch 6 helpers on top of kit.py: a person builder, gowns, eye variants, and common palettes."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, HEADS)

SILVER = ('#c3c8cd', '#8e959c')
YELLOW = ('#f1c63e', '#c7951f')
WHITE = '#f4ede1'

SKINS = {'pale': PALE, 'light': LIGHT, 'olive': OLIVE, 'med': MED, 'deep': DEEP, 'vdeep': VDEEP}


def base_pal(**extra):
    p = {'k': INK, 'w': WHITE}
    p.update(extra)
    return p


def bg(c, fn, dark=None):
    l = layer(); fn(l)
    if dark:
        edged(l, dark)
    c.paste(l)


def happy_eyes(l, x0, y0, size, skin, k='k'):
    """Closed, smiling eyes: little arcs instead of the 2x2 eye."""
    T = HEADS[size]
    ey = y0 + T['eye']
    for ex in T['eyes']:
        l.rect(x0 + ex, ey, x0 + ex + 1, ey + 1, skin)
        l.pts(k, [(x0 + ex - 1, ey + 1), (x0 + ex, ey), (x0 + ex + 1, ey), (x0 + ex + 2, ey + 1)])


def round_eyes(l, x0, y0, size, iris, k='k'):
    """Open eyes with a coloured iris: white left column, iris right column, ink under."""
    T = HEADS[size]
    ey = y0 + T['eye']
    for ex in T['eyes']:
        l.px(x0 + ex, ey, 'w'); l.px(x0 + ex + 1, ey, iris)
        l.px(x0 + ex, ey + 1, iris); l.px(x0 + ex + 1, ey + 1, k)


def glasses(l, x0, y0, size, frame):
    T = HEADS[size]
    ey = y0 + T['eye']
    a, b = T['eyes']
    for ex in (a, b):
        l.hl(x0 + ex - 1, x0 + ex + 2, ey - 1, frame)
        l.vl(x0 + ex - 1, ey - 1, ey + 2, frame); l.vl(x0 + ex + 2, ey - 1, ey + 2, frame)
        l.hl(x0 + ex - 1, x0 + ex + 2, ey + 2, frame)
    l.hl(x0 + a + 3, x0 + b - 2, ey, frame)


def skirt(l, cx, top, bottom, wt, wb, cloth, dark):
    l.poly([(cx - wt, top), (cx + wt + 1, top), (cx + wb + 1, bottom + 1), (cx - wb, bottom + 1)], cloth)
    l.poly([(cx + wt - 2, top + 2), (cx + wt + 1, top), (cx + wb + 1, bottom + 1), (cx + wb - 4, bottom + 1)], dark, only=cloth)


def person(c, DK, *, hx, hy, skin, shade, size=14, mouth='smile', brows='soft', brow='k', glint='w', eye='k',
           hs='short', hk='k', hd='k', side='L', cloth, cdark, cx=None, sw=7, ww=6, th=12, slope=2,
           lg=None, arms=(), hands=(), front=None, face=None, top=None, props=None, after=None, back=None):
    """Build one figure on its own layer, outline it once, lay thin props under, paste on c.
    lg = dict(pants, pdark, shoe, lh, gap=2, lw=4, stance=0) or None (cut by the frame / desk / skirt via back)."""
    f = layer()
    if cx is None:
        cx = hx + size // 2
    ty = hy + size + 1
    if back:
        back(f)
    if lg:
        legs(f, cx, ty + th, lg.get('gap', 2), lg.get('lw', 4), lg['lh'], lg['pants'], lg['pdark'], lg['shoe'],
             stance=lg.get('stance', 0))
    torso(f, cx, ty, sw, ww, th, cloth, cdark, slope=slope, skin=skin, skin_dark=shade)
    if front:
        front(f)
    for a in arms:
        pts, w = a[0], a[1]
        k = a[2] if len(a) > 2 else cloth
        al = layer(); thick(al, pts, w, k); over(f, al, DK)
    for h in hands:
        x, y, kind = h[0], h[1], h[2]
        flip = h[3] if len(h) > 3 else False
        hl = layer(); hand(hl, x, y, kind, skin, shade, flip); over(f, hl, DK)
    hdl = layer(); head(hdl, hx, hy, size, skin, shade, mouth=mouth, brows=brows, brow=brow, glint=glint, eye=eye)
    if face:
        face(hdl)
    over(f, hdl, DK)
    if hs:
        hr = layer(); hair(hr, hx, hy, size, hs, hk, hd, side=side); f.paste(hr)
    if top:
        top(f)
    outline_once(f)
    if props:
        p = layer(); props(p); under(f, p)
    if after:
        after(f)
    c.paste(f)
    return f
