"""Batch 1 helpers on top of kit.py: one call per person, plus palette and background helpers."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, fork_head, bill, HEADS)

RED = ('#d9534a', '#a83a35')
GREEN = ('#5fa05a', '#3f7a42')
CREAM = '#f4ede1'


def bg(c, fn, dark=None):
    l = layer(); fn(l)
    if dark:
        edged(l, dark)
    c.paste(l)


def base_pal(**kw):
    p = {'k': INK, 'w': CREAM, 'r': '#8a2f2f'}
    p.update(kw)
    return p


def person(c, *, hx, hy, size=14, skin, shade, hs='short', hk='H', hd='z', side='L',
           mouth='smile', brows='soft', brow=None, glint='w',
           shirt, sdark, cx, ty=None, sw=7, ww=6, th=12, slope=2,
           arms=(), hands=(), lg=None, front=None, top=None, props=None, after=None, DK=None, layer_out=False):
    """lg: dict(pants, pdark, shoe, lh, gap=2, lw=4, stance=0) or None (cut by a desk / frame).
    arms: [(pts, w, cloth)]; hands: [(x, y, kind, flip)].
    front(f): draws on the body before arms; top(f): after hair (hats, glasses);
    props(p): thin held things laid under the outline; after(f): drawn after outline (no ink)."""
    DK = dict(DK or {})
    DK.setdefault(shirt, sdark); DK.setdefault(skin, shade)
    f = layer()
    if ty is None:
        ty = hy + size + 1
    if lg:
        legs(f, cx, ty + th, lg.get('gap', 2), lg.get('lw', 4), lg['lh'], lg['pants'], lg['pdark'], lg['shoe'],
             stance=lg.get('stance', 0))
    torso(f, cx, ty, sw, ww, th, shirt, sdark, slope=slope, skin=skin, skin_dark=shade)
    if front:
        front(f)
    for a in arms:
        pts, w = a[0], a[1]
        cl = a[2] if len(a) > 2 else shirt
        al = layer(); thick(al, pts, w, cl); over(f, al, DK)
    for (x, y, kind, flip) in hands:
        hl = layer(); hand(hl, x, y, kind, skin, shade, flip); over(f, hl, DK)
    hdl = layer()
    head(hdl, hx, hy, size, skin, shade, mouth=mouth, brows=brows, brow=brow or hk, glint=glint)
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
    if layer_out:
        return f
    c.paste(f)
    return f


def outlined(c, fn):
    """A held prop or object that should carry ink (outlined on its own)."""
    l = layer(); fn(l); outline_once(l); c.paste(l)
