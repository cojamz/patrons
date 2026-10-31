"""Batch 2 helpers on top of kit.py: one call builds a whole outlined figure."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, fork_head, bill, HEADS, head_shape)

GREEN = ('#5da35f', '#3f7c48')
MAGENTA = ('#c2457f', '#8f2f5d')
PURPLE = ('#8a5cb8', '#644090')
WHITE = '#f4ede1'


def bg(c, fn, dark=None):
    l = layer(); fn(l)
    if dark:
        edged(l, dark)
    c.paste(l)


def person(c, x0, y0, size, sk, SK, shirt, SH, *, cx=None, sw=7, ww=6, th=12, neck=True,
           lg=None, arms=(), hands=(), mouth='smile', brows='soft', brow='k', eye='k', glint='w',
           hr=None, hat=None, back=None, front=None, late=None, under_=None, post=None, dk=None,
           face=None, ears=True):
    """lg = dict(pants, pdark, shoe, lh, lw=4, gap=2, stance=0) or None.
    arms: (pts, w, key). hands: (x, y, kind, flip). hr: (style, k, dark[, side]) or callable(layer)."""
    T = HEADS[size]
    if cx is None:
        cx = x0 + T['w'] // 2
    ty = y0 + T['h'] + 1
    DK = {shirt: SH, sk: SK, SH: SH}
    if dk:
        DK.update(dk)
    f = layer()
    if back:
        back(f)
    if lg:
        legs(f, cx, ty + th, lg.get('gap', 2), lg.get('lw', 4), lg['lh'], lg['pants'], lg['pdark'], lg['shoe'],
             stance=lg.get('stance', 0))
    t = layer()
    torso(t, cx, ty, sw, ww, th, shirt, SH, skin=sk if neck else None, skin_dark=SK if neck else None)
    over(f, t, DK)
    if front:
        front(f, DK)
    for pts, w, k in arms:
        a = layer(); thick(a, pts, w, k); over(f, a, DK)
    for (x, y, kind, flip) in hands:
        hl = layer(); hand(hl, x, y, kind, sk, SK, flip); over(f, hl, DK)
    hd = layer(); head(hd, x0, y0, size, sk, SK, mouth=mouth, brows=brows, brow=brow, eye=eye, glint=glint, ears=ears)
    if face:
        face(hd)
    over(f, hd, DK)
    if hr:
        h = layer()
        if callable(hr):
            hr(h)
        else:
            hair(h, x0, y0, size, *hr)
        f.paste(h)
    if hat:
        hat(f)
    if late:
        late(f, DK)
    outline_once(f)
    if under_:
        p = layer(); under_(p); under(f, p)
    if post:
        post(f)
    c.paste(f)
    return f


def closed_eyes(l, x0, y0, size, k='k'):
    """Happy closed arcs in place of the 2x2 eyes (call in face=, the head is already drawn)."""
    T = HEADS[size]
    ey = y0 + T['eye']
    for ex in T['eyes']:
        x = x0 + ex
        sk = l.get(x, ey - 1)
        l.rect(x, ey, x + 1, ey + 1, sk)
        l.pts(k, [(x - 1, ey + 1), (x, ey), (x + 1, ey), (x + 2, ey + 1)])


def glasses(l, x0, y0, size, frame, lens, glint='w'):
    T = HEADS[size]
    ey = y0 + T['eye']
    e0, e1 = T['eyes']
    for ex in (e0, e1):
        x = x0 + ex
        l.rect(x - 1, ey - 1, x + 2, ey + 1, lens)
        l.px(x - 1 + 0, ey - 1, glint)
    l.hl(x0 + e0 + 3, x0 + e1 - 2, ey - 1, frame)
    l.px(x0 + e0 - 2, ey - 1, frame); l.px(x0 + e1 + 3, ey - 1, frame)


def freckles(l, x0, y0, size, k):
    T = HEADS[size]
    ey = y0 + T['eye']
    e0, e1 = T['eyes']
    l.pts(k, [(x0 + e0, ey + 3), (x0 + e1 + 1, ey + 3)])


def cap(f, x0, y0, size, k, K, bill_dir=1):
    """Baseball cap over the crown; brim to the right (bill_dir=1) or left."""
    w = HEADS[size]['w']
    x1 = x0 + w - 1
    f.hl(x0 + 4, x1 - 4, y0 - 2, k)
    f.hl(x0 + 2, x1 - 2, y0 - 1, k)
    f.hl(x0 + 1, x1 - 1, y0, k)
    f.rect(x0, y0 + 1, x1, y0 + 3, k)
    f.hl(x0, x1, y0 + 3, K)
    if bill_dir > 0:
        f.hl(x1 - 3, x1 + 4, y0 + 4, K); f.hl(x1 - 2, x1 + 5, y0 + 3, K)
    else:
        f.hl(x0 - 4, x0 + 3, y0 + 4, K); f.hl(x0 - 5, x0 + 2, y0 + 3, K)
