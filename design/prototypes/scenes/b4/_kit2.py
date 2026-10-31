"""Batch 4 helpers: one-call person builder on top of kit.py (kit itself untouched)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(HERE))))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, bill, HEADS)

BLUE = ('#4f82c4', '#36609c')
WHITE = ('#f4efe4', '#cbc3b4')
GREY = ('#a9aeac', '#7d8381')


def bg(c, fn, dark=None):
    l = layer(); fn(l)
    if dark:
        edged(l, dark)
    c.paste(l)


def person(c, DK, hx, hy, skin, hs=None, hk='H', hd='z', size=14, mouth='smile', brows='soft', brow=None,
           glint='w', cloth='1', cdark='2', sw=7, ww=6, th=13, slope=2, pants=('n', 'n'), shoe='z', lh=8,
           lw=4, gap=2, stance=0, arms=(), hands=(), front=None, top=None, props=None, post=None,
           cx=None, side='L', nolegs=False, eye='k'):
    """skin = (light key, shade key). arms = [(pts, w, key)]. hands = [(x, y, kind, flip)].
    front(f): drawn after the torso, before arms. top(f): after head and hair (hats, glasses).
    props(p): thin held props laid under after the outline. post(f): after the outline."""
    s, S = skin
    f = layer()
    if cx is None:
        cx = hx + size // 2
    ty = hy + size + 1
    if not nolegs:
        legs(f, cx, ty + th, gap, lw, lh, pants[0], pants[1], shoe, stance=stance)
    t = layer()
    torso(t, cx, ty, sw, ww, th, cloth, cdark, slope=slope, skin=s, skin_dark=S)
    over(f, t, DK)
    if front:
        fr = layer(); front(fr); over(f, fr, DK)
    for pts, w, k in arms:
        a = layer(); thick(a, pts, w, k); over(f, a, DK)
    for (x, y, kind, flip) in hands:
        hl = layer()
        if isinstance(kind, list):
            hand2(hl, x, y, kind, s, S, flip)
        else:
            hand(hl, x, y, kind, s, S, flip)
        over(f, hl, DK)
    hd_ = layer()
    head(hd_, hx, hy, size, s, S, mouth=mouth, brows=brows, brow=brow or hk, glint=glint, eye=eye)
    over(f, hd_, DK)
    if hs:
        hr = layer(); hair(hr, hx, hy, size, hs, hk, hd, side=side); f.paste(hr)
    if top:
        tp = layer(); top(tp); over(f, tp, DK)
    outline_once(f)
    if props:
        p = layer(); props(p); under(f, p)
    if post:
        post(f)
    c.paste(f)
    return f


POINT = ['.ss...', 'ssssss', 'sSss..', '.SS...']   # index finger out to the right
WAVE = ['s.s.s', 'sssss', 'sssss', '.sSs.']         # open palm up, fingers spread


def hand2(l, x, y, rows, skin, shade, flip=False):
    for j, r in enumerate(rows):
        if flip:
            r = r[::-1]
        for i, ch in enumerate(r):
            if ch == 's':
                l.px(x + i, y + j, skin)
            elif ch == 'S':
                l.px(x + i, y + j, shade)
