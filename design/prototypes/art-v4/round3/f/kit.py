"""Shared figure kit for the closer dioramas (round3 f and g): chunky 16-bit RPG people at any size."""
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


def obj(fn, k='k'):
    l = C(N)
    fn(l)
    l.outline(k)
    return l


def head(l, x0, y0, hw, hh, skin, shade, hair=None, hs='short', eyes='glint', mouth='smile', brows=None,
         lit=None, ears=True, nose=False, white='w', ht=None):
    """Rounded head. Returns dict with eye row, mouth row, centre x."""
    x1, y1 = x0 + hw - 1, y0 + hh - 1
    r = 2 if hw >= 13 else 1
    l.rect(x0, y0 + r, x1, y1 - r, skin)
    for i in range(r):
        l.hl(x0 + r - i, x1 - r + i, y0 + i, skin); l.hl(x0 + r - i, x1 - r + i, y1 - i, skin)
    # shade: right column and chin
    l.vl(x1, y0 + r + 1, y1 - r, shade); l.vl(x1 - 1, y1 - r, y1 - 1, shade)
    l.hl(x0 + r + 1, x1 - r, y1, shade)
    ey = y0 + hh // 2
    if ears:
        l.rect(x0 - 1, ey, x0 - 1, ey + 2, skin); l.rect(x1 + 1, ey, x1 + 1, ey + 2, shade)
    ht = ht or max(2, hh // 4)
    if hair:
        if hs in ('short', 'long', 'bun', 'side', 'crop', 'puff'):
            t = 1 if hs == 'crop' else ht
            for i in range(r):
                l.hl(x0 + r - i, x1 - r + i, y0 + i, hair)
            l.rect(x0, y0 + r, x1, y0 + t, hair)
            side = 2 if hs == 'crop' else 3
            l.rect(x0, y0 + t, x0, y0 + t + side - 1, hair); l.rect(x1, y0 + t, x1, y0 + t + side - 1, hair)
            if hs == 'side':
                l.hl(x0 + 1, x0 + hw // 2 - 1, y0 + t + 1, hair); l.hl(x0 + 1, x0 + hw // 3, y0 + t + 2, hair)
            if hs == 'short':
                l.hl(x0 + 1, x0 + 3, y0 + t + 1, hair); l.hl(x1 - 3, x1 - 1, y0 + t + 1, hair)
        if hs == 'long':
            l.rect(x0 - 2, y0 + r + 1, x0, ey + 6, hair); l.rect(x1, y0 + r + 1, x1 + 2, ey + 6, hair)
        if hs == 'bun':
            b = max(3, hw // 3)
            l.ell(x0 + (hw - b - 2) // 2, y0 - b + 1, x0 + (hw - b - 2) // 2 + b + 1, y0 + 1, hair)
        if hs == 'puff':                              # rounded natural hair, wider than the head
            l.ell(x0 - 2, y0 - 3, x1 + 2, y0 + ht + 3, hair)
            l.rect(x0 - 2, y0 + ht, x0, ey + 1, hair); l.rect(x1, y0 + ht, x1 + 2, ey + 1, hair)
            l.ell(x0 + 1, y0 + ht + 1, x1 - 1, y0 + ht + 6, skin, only=hair)
            l.rect(x0 + 1, y0 + ht + 3, x1 - 1, ey + 1, skin)
            l.vl(x1, y0 + ht + 3, ey + 1, shade)
    big = hw >= 16
    ew = 2
    eh = 3 if big else 2
    ex0 = x0 + max(2, hw // 4 - (0 if big else 0))
    ex1 = x1 - max(2, hw // 4) - ew + 1
    if lit:   # stepped forehead plane, then a cheekbone pair out and down
        lw = max(3, hw // 3)
        l.hl(ex0, ex0 + lw - 1, ey - (2 if brows is None else 3), lit)
        l.pts(lit, [(ex0 - 2, ey + eh), (ex0 - 1, ey + eh)])
    for ex in (ex0, ex1):
        if eyes == 'glint':
            l.rect(ex, ey, ex + ew - 1, ey + eh - 1, 'k')
            l.px(ex, ey, white)
        elif eyes == 'dot':
            l.rect(ex, ey, ex + ew - 1, ey + eh - 1, 'k')
        elif eyes == 'shut':
            l.hl(ex, ex + ew - 1, ey + eh - 1, 'k')
    if brows == 'angry':
        l.hl(ex0 - 1, ex0, ey - 2, 'k'); l.px(ex0 + 1, ey - 1, 'k')
        l.hl(ex1 + 1, ex1 + 2, ey - 2, 'k'); l.px(ex1, ey - 1, 'k')
    elif brows == 'stern':
        l.hl(ex0 - 1, ex0 + ew - 1, ey - 2, 'k'); l.hl(ex1, ex1 + ew, ey - 2, 'k')
        l.px(ex0 + ew, ey - 1, 'k'); l.px(ex1 - 1, ey - 1, 'k')
    elif brows == 'up':
        l.hl(ex0 - 1, ex0 + ew - 1, ey - 2, 'k'); l.hl(ex1, ex1 + ew, ey - 2, 'k')
    cx = x0 + hw // 2          # right-of-centre column for even widths
    if nose:
        l.vl(cx, ey + eh, ey + eh, shade); l.px(cx - 1, ey + eh, shade) if hw % 2 == 0 else None
    my = ey + eh + (2 if big else 1)
    mw = max(4, hw // 3)
    m0 = cx - mw // 2
    if mouth == 'smile':
        l.px(m0, my, 'k'); l.hl(m0 + 1, m0 + mw - 2, my + 1, 'k'); l.px(m0 + mw - 1, my, 'k')
    elif mouth == 'grin':        # closed wide smile, two-row curve
        l.px(m0 - 1, my, 'k'); l.hl(m0, m0 + mw - 1, my + 1, 'k'); l.px(m0 + mw, my, 'k')
    elif mouth == 'shout':
        w = mw - 1
        l.rect(m0, my, m0 + w - 1, my + 1, 'k')
        l.hl(m0 + 1, m0 + w - 2, my + 2, 'k')
    elif mouth == 'flat':
        l.hl(m0, m0 + mw - 1, my + 1, 'k')
    elif mouth == 'smirk':
        l.hl(m0, m0 + mw - 1, my + 1, 'k'); l.px(m0 + mw, my, 'k')
    return {'ey': ey, 'my': my, 'cx': cx, 'ex0': ex0, 'ex1': ex1, 'eh': eh}


def body(l, x0, y0, tw, th, lh, skin, top, top2, legs='x', shoes='k', arms=('down', 'down'), aw=3,
         hx0=None, hx1=None, sleeve=None, sleeve2=None):
    """Torso whose top-left is (x0, y0), width tw. hx0/hx1: head span, so raised arms clear it.
    Returns fist top-lefts {'L': (x, y), 'R': (x, y)}."""
    x1 = x0 + tw - 1
    ty, ly = y0, y0 + th
    hands = {}
    sleeve = sleeve or top
    sleeve2 = sleeve2 or top2
    if lh:
        lw = max(3, tw // 3)
        l.rect(x0 + 1, ly, x0 + lw, ly + lh - 1, legs); l.rect(x1 - lw, ly, x1 - 1, ly + lh - 1, legs)
        if shoes:
            l.rect(x0, ly + lh, x0 + lw, ly + lh + 1, shoes); l.rect(x1 - lw, ly + lh, x1, ly + lh + 1, shoes)
    l.rect(x0, ty + 1, x1, ly - 1, top); l.hl(x0 + 1, x1 - 1, ty, top)
    l.rect(x1 - 1, ty + 1, x1, ly - 1, top2)
    hx0 = x0 if hx0 is None else hx0
    hx1 = x1 if hx1 is None else hx1
    for side, pose in zip('LR', arms):
        if pose is None:
            continue
        L = side == 'L'
        ax = x0 - aw if L else x1 + 1
        sl = sleeve if L else sleeve2
        if pose == 'down':
            l.rect(ax, ty + 1, ax + aw - 1, ly - 2, sl)
            l.rect(ax, ly - 1, ax + aw - 1, ly + aw - 2, skin)
            hands[side] = (ax, ly - 1)
        elif pose in ('up', 'mid'):
            ox = min(ax, hx0 - aw - 1) if L else max(ax, hx1 + 2)
            l.rect(min(ax, ox), ty + 1, max(ax, ox) + aw - 1, ty + aw, sl)
            top_y = ty - 7 if pose == 'up' else ty - 2
            l.rect(ox, top_y, ox + aw - 1, ty + aw, sl)
            l.rect(ox, top_y - aw, ox + aw - 1, top_y - 1, skin)
            hands[side] = (ox, top_y - aw)
        elif pose == 'front':
            l.rect(ax, ty + 1, ax + aw - 1, ty + th // 2, sl)
            hx = x0 + 1 if L else x1 - aw
            yy = ty + th // 2
            l.rect(min(ax, hx), yy - 1, max(ax, hx) + aw - 1, yy + 1, sl)
            l.rect(hx, yy + 2, hx + aw - 1, yy + aw + 1, skin)
            hands[side] = (hx, yy + 2)
        elif pose == 'hip':
            ox = ax - 1 if L else ax + 1
            l.rect(ox, ty + 1, ox + aw - 1, ty + th // 2, sl)
            l.rect(ax + (1 if L else -1), ty + th // 2 + 1, ax + aw - 1 + (1 if L else -1), ty + th // 2 + 2, skin)
            hands[side] = (ax, ty + th // 2 + 1)
    return hands


def pitchfork(l, x, ytop, ybot, wood='t', iron='m', pole=2):
    """Three clear tines, 2px apart, curved outer tines."""
    l.rect(x, ytop + 6, x + pole - 1, ybot, wood)
    l.hl(x - 3, x + pole + 2, ytop + 6, iron)
    l.px(x - 3, ytop + 5, iron); l.px(x + pole + 2, ytop + 5, iron)
    l.vl(x - 3, ytop + 1, ytop + 5, iron); l.vl(x + pole + 2, ytop + 1, ytop + 5, iron)
    l.rect(x, ytop, x + pole - 1, ytop + 5, iron)


def torch(l, x, ytop, ybot, wood='t', wrap='n', flame='e', core='y', pole=2, size=1):
    """Wooden torch with a wrapped head and a two-tone flame. ytop = flame tip."""
    fh = 9 + 2 * size
    l.rect(x, ytop + fh + 1, x + pole - 1, ybot, wood)
    l.rect(x - 1, ytop + fh - 1, x + pole, ytop + fh + 1, wrap)
    cx = x + (pole - 1) / 2
    w = 3 + size
    l.poly([(cx - w, ytop + fh - 1), (cx - w + 0.5, ytop + fh * 0.5), (cx - 1, ytop + 2), (cx + 0.5, ytop),
            (cx + 2, ytop + 3), (cx + w - 0.5, ytop + fh * 0.45), (cx + w + 1, ytop + fh - 1)], flame)
    l.ell(int(cx - w / 2), ytop + fh // 2 - 1, int(cx + w / 2 + 0.5), ytop + fh - 1, core)


def cash_brick(l, x0, y0, w=6, h=4, band='w'):
    l.rect(x0, y0, x0 + w - 1, y0 + h - 1, 'n')
    for y in range(y0 + 1, y0 + h, 2):
        l.hl(x0, x0 + w - 1, y, 'N')
    l.vl(x0 + w // 2 - 1, y0, y0 + h - 1, band)


def bill(l, x0, y0, w=9, h=6):
    l.rect(x0, y0, x0 + w - 1, y0 + h - 1, 'n')
    l.ell(x0 + w // 2 - 1, y0 + 1, x0 + w // 2 + 1, y0 + h - 2, 'N')
    l.pts('N', [(x0 + 1, y0 + 1), (x0 + w - 2, y0 + h - 2)])
