"""Batch 5 helpers on top of kit.py: palettes, one-call standing/behind-desk people."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(HERE))))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, fork_head, bill)

COOL = ('#8f5f3e', '#72482c')    # coolbrown: a true mid-brown between MED and DEEP

FIST5 = ['.sss.', 'sSsSs', 'sssss', 'SSSss', '.sss.']   # knuckle row, then the thumb across


def fist5(l, x, y, skin='s', shade='S', flip=False):
    for j, r in enumerate(FIST5):
        if flip:
            r = r[::-1]
        for i, ch in enumerate(r):
            if ch == 's':
                l.px(x + i, y + j, skin)
            elif ch == 'S':
                l.px(x + i, y + j, shade)


SPHERE = {
    'grey': ('#a9aeac', '#7d8381'),
    'gold': ('#e2b43e', '#b5852a'),
    'silver': ('#c6ccd2', '#949ba4'),
}


def base(skin, sphere, **extra):
    p = {'k': INK, 'w': '#f4ede1', 's': skin[0], 'S': skin[1],
         '1': SPHERE[sphere][0], '2': SPHERE[sphere][1], 'r': '#7a2a2a'}
    p.update(extra)
    return p


def bg(c, fn, dark=None):
    l = layer(); fn(l)
    if dark:
        edged(l, dark)
    c.paste(l)


def person(c, cx, hy, size=14, hs='short', hk='H', hdk='z', mouth='smile', brows='soft', brow=None,
           shirt='1', sdk='2', sw=7, ww=6, th=12, pants='q', pdk='q', shoe='z', lh=9, stance=0, gap=2, lw=4,
           arms=(), hands=(), DK=None, front=None, hat=None, props=None, post=None, top=None, glint='w',
           behind=False, eye='k', side='L', hairfn=None, slope=2):
    """One figure, one outline. arms: [(pts, w, colour)], hands: [(x, y, kind, flip)].
    front(f): drawn on the torso before arms. hat(f): after hair. top(f): drawn over everything before outline.
    props(p): thin held props laid under the hand after the outline. post(f): drawn after outline."""
    DK = dict(DK or {})
    DK.setdefault(shirt, sdk); DK.setdefault('s', 'S'); DK.setdefault(sdk, sdk)
    x0 = cx - size // 2
    ty = hy + size + 1
    f = layer()
    if not behind:
        legs(f, cx, ty + th, gap, lw, lh, pants, pdk, shoe, stance=stance)
    torso(f, cx, ty, sw, ww, th, shirt, sdk, slope=slope, skin='s', skin_dark='S')
    if front:
        front(f)
    for pts, w, k in arms:
        a = layer(); thick(a, pts, w, k); over(f, a, DK)
    for (x, y, kind, flip) in hands:
        h_ = layer(); hand(h_, x, y, kind, 's', 'S', flip); over(f, h_, DK)
    hd = layer(); head(hd, x0, hy, size, 's', 'S', mouth=mouth, brows=brows, brow=brow or hk, glint=glint, eye=eye)
    over(f, hd, DK)
    if hairfn:
        hairfn(f, x0, hy)
    elif hs:
        hr = layer(); hair(hr, x0, hy, size, hs, hk, hdk, side=side); f.paste(hr)
    if hat:
        hat(f)
    if top:
        top(f)
    outline_once(f)
    if props:
        p = layer(); props(p); under(f, p)
    if post:
        post(f)
    c.paste(f)
    return f


def coin(l, x, y, k='y', d='Y', hi='w'):
    l.stamp(x, y, ['.kk.', 'k' + k + k + 'k', 'k' + k + d + 'k', '.kk.'])


def coin_stack(l, x, y, n, k='y', d='Y', w=6):
    """Coins seen side-on, bottom row at y: one flat column, shade on the right, a lit top face."""
    top = y - n * 2 + 1
    l.rect(x, top, x + w - 1, y, k)
    l.rect(x + w - 2, top, x + w - 1, y, d)
    l.hl(x + 1, x + w - 2, top - 1, k)
