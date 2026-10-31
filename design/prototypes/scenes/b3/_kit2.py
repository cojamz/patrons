"""Batch 3 helpers on top of kit.py (not built: name starts with _)."""
import os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, fork_head, bill, HEADS)

PURPLE = ('#8f5ccf', '#6b3fa6')
BLUE = ('#5b97cf', '#3d70a6')
W = '#f4ede1'
MOUTH = '#7a2a2a'


def base(**kw):
    p = {'k': INK, 'w': W, 'r': MOUTH}
    p.update(kw)
    return p


def bg(c, fn, dark=None):
    l = layer(); fn(l)
    if dark:
        edged(l, dark)
    c.paste(l)


def person(c, DK, *, hx, hy, size=14, skin, shade, mouth='smile', brows='soft', brow='k', glint='w', eye='k',
           hs=None, hk=None, hd=None, side='L', cx, sw=7, ww=6, th=13, cloth, slope=2,
           lg=None, arms=(), hands=(), back=None, front=None, face=None, top=None, props=None, post=None, ears=True):
    """One figure, one outline. arms: (pts, w, key). hands: (x, y, kind, flip). lg: legs kwargs."""
    f = layer()
    if back:
        back(f)
    ty = hy + size + 1
    if lg:
        l2 = layer(); legs(l2, cx, ty + th, **lg); f.paste(l2)
    t = layer(); torso(t, cx, ty, sw, ww, th, cloth, DK[cloth], slope, skin, shade); over(f, t, DK)
    if front:
        front(f)
    for pts, w, k in arms:
        a = layer(); thick(a, pts, w, k); over(f, a, DK)
    for (x, y, kind, flip) in hands:
        hl = layer(); hand(hl, x, y, kind, skin, shade, flip); over(f, hl, DK)
    hd_ = layer(); head(hd_, hx, hy, size, skin, shade, mouth=mouth, brows=brows, brow=brow, glint=glint, eye=eye, ears=ears)
    if face:
        face(hd_)
    over(f, hd_, DK)
    if hs:
        hr = layer(); hair(hr, hx, hy, size, hs, hk, hd, side=side); f.paste(hr)
    if top:
        top(f)
    outline_once(f)
    if props:
        p = layer(); props(p); under(f, p)
    if post:
        post(f)
    c.paste(f)
    return f


def held(c, fn, dark=None):
    """A free prop held in front (outlined once, own layer)."""
    l = layer(); fn(l)
    if dark:
        pass
    outline_once(l)
    c.paste(l)


def dome(f, hx, hy, w, k, kd, depth=5, lift=3):
    """Rounded crown over the top `depth` rows of a head w wide; far side in shade."""
    tmp = layer(); tmp.ell(hx - 1, hy - lift, hx + w, hy + 2 * depth + lift - 2, k)
    for y in range(N):
        for x in range(N):
            if tmp.get(x, y) != '.' and y < hy + depth:
                f.px(x, y, kd if x >= hx + w - 3 else k)


def cap(f, hx, hy, w, k, kd, brim='R'):
    dome(f, hx, hy, w, k, kd, depth=5)
    if brim == 'R':
        f.hl(hx + w - 4, hx + w + 4, hy + 4, kd); f.hl(hx + w - 2, hx + w + 3, hy + 5, kd)
    elif brim == 'L':
        f.hl(hx - 5, hx + 3, hy + 4, kd); f.hl(hx - 4, hx + 1, hy + 5, kd)
    else:
        f.hl(hx - 1, hx + w, hy + 4, kd); f.hl(hx + 1, hx + w - 2, hy + 5, kd)


def hardhat(f, hx, hy, w, k, kd):
    dome(f, hx, hy, w, k, kd, depth=5, lift=4)
    f.hl(hx - 3, hx + w + 2, hy + 4, k); f.hl(hx + w - 2, hx + w + 2, hy + 4, kd)
    f.vl(hx + w // 2, hy - 3, hy + 3, kd)


def glasses(h, hx, hy, frame, lens, size=14):
    T = HEADS[size]; ey = hy + T['eye']
    for ex in T['eyes']:
        x = hx + ex
        if lens is None:                    # open frame: ring only, the eye shows through
            for (px, py) in [(x - 1, ey - 1), (x, ey - 1), (x + 1, ey - 1), (x + 2, ey - 1), (x - 1, ey), (x + 2, ey),
                             (x - 1, ey + 1), (x + 2, ey + 1), (x - 1, ey + 2), (x, ey + 2), (x + 1, ey + 2), (x + 2, ey + 2)]:
                h.px(px, py, frame)
        else:
            h.rect(x - 1, ey - 1, x + 2, ey + 2, frame); h.rect(x, ey, x + 1, ey + 1, lens)
    h.hl(hx + T['eyes'][0] + 3, hx + T['eyes'][1] - 2, ey, frame)

