"""Style F, diorama closer: 64x64. Chunky RPG people ~38px tall fill half the frame; the room or place
still wraps them. Rules in STYLE.md: one outline per figure, hand-shaped parts, two tones per material,
quiet two-value backgrounds."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, layer, over, outline_once, under, edged,
                 thick, head, hair, torso, legs, hand, pole, fork_head, bill)

STYLE = {
    'title': 'F  Diorama, closer  (64x64: people ~38px, the room still around them)',
    'short': 'F Diorama, closer',
    'sub': '64x64, people half the frame',
}


def bg(c, fn, dark):
    l = layer(); fn(l); edged(l, dark) if dark else None; c.paste(l)


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1',
           'p': '#5a3a52', 'P': '#4e3248',                 # wall, wainscot (close values)
           'o': '#8a5434', 'O': '#6a3d25', 'd': '#a2683f',  # desk
           'g': '#8d9296', 'G': '#6b7075',                 # safe
           'y': '#f2d27a', 'b': '#c9a24a',
           'l': '#3f8a5c', 'L': '#2c6a45',
           'n': '#8fb877', 'N': '#5d8a50',
           '1': '#c2457f', '2': '#8f2f5d',
           'a': OLIVE[0], 'A': OLIVE[1],
           'h': '#2f2733', 'H': '#4a3d50', 'q': '#33405f', 'Q': '#46557d'}
    c.rect(0, 0, 63, 63, 'p')
    c.rect(0, 34, 63, 63, 'P')

    def window(l):
        l.rect(2, 4, 17, 22, 'P'); l.rect(4, 6, 15, 20, 'q')
        l.ell(11, 8, 14, 11, 'y')
        l.rect(5, 15, 7, 20, 'Q'); l.rect(9, 13, 11, 20, 'Q'); l.rect(13, 16, 15, 20, 'Q')
        l.pts('y', [(6, 17), (10, 15)])
    bg(c, window, None)

    def safe(l):
        l.rect(48, 14, 62, 40, 'g')
        l.rect(50, 17, 60, 38, 'G'); l.rect(51, 18, 59, 37, 'g')
        l.ell(52, 21, 57, 26, 'b'); l.vl(54, 21, 22, 'G')
        l.rect(57, 29, 58, 33, 'G')
    bg(c, safe, 'G')

    def desk(l):
        l.rect(0, 41, 63, 46, 'd')
        l.rect(0, 47, 63, 63, 'o')
        l.rect(4, 50, 24, 57, 'O'); l.rect(5, 51, 23, 56, 'o')
        l.rect(39, 50, 59, 57, 'O'); l.rect(40, 51, 58, 56, 'o')
        l.hl(12, 16, 53, 'b'); l.hl(47, 51, 53, 'b')
        l.hl(0, 63, 47, 'O')
    bg(c, desk, None)

    def lamp(l):
        l.rect(5, 39, 12, 41, 'b'); l.rect(8, 33, 9, 38, 'b')
        l.poly([(2, 33), (5, 27), (12, 27), (15, 33)], 'l')
        l.hl(3, 14, 33, 'y')
    bg(c, lamp, None)
    c.poly([(9, 27), (12, 27), (15, 33), (11, 33)], 'L', only='l')

    # ---- the boss: one figure, one outline
    f = layer()
    cx = 32
    t = layer()
    torso(t, cx, 29, 12, 12, 12, '1', '2', slope=2, skin='a', skin_dark='A')
    f.paste(t)
    shirt = layer()
    shirt.poly([(cx - 4.5, 29), (cx + 4.5, 29), (cx, 38)], 'w')
    shirt.rect(cx - 1, 30, cx, 38, 'h'); shirt.rect(cx - 1, 30, cx, 31, 'H')
    f.paste(shirt)
    for (x, y) in ((27, 29), (27, 30), (28, 31), (28, 32), (29, 33), (29, 34), (30, 35), (30, 36)):
        f.px(x, y, '2'); f.px(63 - x, y, '2')                       # lapels, clean 1:2 runs
    f.hl(37, 39, 33, 'w'); f.px(38, 32, 'w')                         # pocket square
    arms = layer()
    thick(arms, [(21, 32), (19, 37), (21, 43)], 5, '1')
    thick(arms, [(43, 32), (45, 37), (43, 43)], 5, '1')
    arms.poly([(44, 34), (47, 36), (46, 45), (44, 45)], '2', only='1')     # far arm in shade
    arms.hl(18, 23, 44, 'w'); arms.hl(41, 46, 44, 'w')               # shirt cuffs
    over(f, arms, {'1': '2'})
    hand(f, 18, 45, 'flat', 'a', 'A')
    hand(f, 41, 45, 'flat', 'a', 'A', flip=True)
    hd = layer()
    head(hd, 24, 12, 16, 'a', 'A', mouth='smirk', brows='stern')
    over(f, hd, {'a': 'A', 'w': 'w'})
    # fedora: tapered crown with a dent, magenta band, drooping brim
    hat = layer()
    hat.hl(27, 30, 4, 'h'); hat.hl(33, 36, 4, 'h'); hat.hl(27, 36, 5, 'h')
    hat.rect(26, 6, 37, 9, 'h'); hat.rect(25, 10, 38, 12, 'h')
    hat.rect(25, 10, 38, 12, '1'); hat.rect(36, 10, 38, 12, '2')
    hat.rect(27, 5, 29, 8, 'H')
    hat.hl(21, 42, 13, 'h'); hat.hl(20, 43, 14, 'h')
    f.paste(hat)
    f.recolor('a', 'A', (25, 15, 38, 15)); f.recolor('a', 'A', (25, 16, 27, 16)); f.recolor('a', 'A', (36, 16, 38, 16))
    outline_once(f)
    # cigar: rooted at the mouth corner, one row, angled down, ash tip
    f.pts('O', [(35, 24), (36, 24), (37, 24), (38, 25), (39, 25), (40, 25)])
    f.px(41, 25, 'g')
    c.paste(f)

    def cash(l):
        l.rect(47, 38, 54, 45, 'n'); l.rect(50, 38, 51, 45, 'w')
        l.rect(55, 41, 61, 45, 'n'); l.rect(57, 41, 58, 45, 'w')
    bg(c, cash, 'N')
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'k': INK, 's': '#2a3252', 'h': '#20263f', 'y': '#f3cf6a', 'e': '#ef7d36', 'r': '#7a2a2a',
           't': '#a8703f', 'T': '#6e4528', 'm': '#d3d7db', '1': '#d9534a', '2': '#a83a35',
           'H': '#3a2a22', 'f': '#614434', 'n': '#3b3446'}
    pal['a'], pal['A'] = PALE; pal['b'], pal['B'] = LIGHT; pal['d'], pal['D'] = OLIVE
    pal['u'], pal['U'] = MED; pal['v'], pal['V'] = VDEEP
    DK = {'1': '2', '2': 'n', 'a': 'A', 'b': 'B', 'd': 'D', 'u': 'U', 'v': 'V', 'n': 'n', 'm': 'm'}

    c.rect(0, 0, 63, 63, 's')
    c.poly([(-1, 22), (8, 13), (17, 22)], 'h'); c.rect(0, 22, 15, 63, 'h')
    c.poly([(46, 20), (55, 11), (65, 20)], 'h'); c.rect(48, 20, 63, 63, 'h')
    c.rect(0, 56, 63, 63, 'h')
    c.rect(4, 27, 6, 29, 'y'); c.rect(52, 24, 54, 26, 'y')
    c.ell(25, 3, 29, 7, 'y'); c.ell(26, 2, 30, 6, 's', only='y')

    def person(x0, y0, skin, shade, hs, hk, hd, mouth, brows, shirt, cx, sw, ww, th, arms, hands,
               lh=6, glint='m', props=None, front=None, stance=0):
        f = layer()
        legs(f, cx, y0 + 15 + th, 2, 4, lh, 'n', 'n', 'T', stance=stance)
        torso(f, cx, y0 + 15, sw, ww, th, shirt, DK[shirt], skin=skin, skin_dark=shade)
        if front:
            front(f)
        for pts, w in arms:
            a = layer(); thick(a, pts, w, shirt); over(f, a, DK)
        for (x, y, kind, flip) in hands:
            hl = layer(); hand(hl, x, y, kind, skin, shade, flip); over(f, hl, DK)
        hd_ = layer(); head(hd_, x0, y0, 14, skin, shade, mouth=mouth, brows=brows, glint=glint)
        over(f, hd_, DK)
        hr = layer(); hair(hr, x0, y0, 14, hs, hk, hd); f.paste(hr)
        outline_once(f)
        if props:
            p = layer(); props(p); under(f, p)
        c.paste(f)

    # back row
    person(13, 15, 'a', 'A', 'side', 'y', 't', 'o', 'angry', '2', 20, 6, 6, 14,
           arms=[([(15, 32), (9, 30), (9, 21)], 3)], hands=[(7, 17, 'fist', False)], lh=0)
    person(44, 14, 'u', 'U', 'afro', 'f', 'H', 'frown', 'angry', '1', 51, 7, 6, 14, arms=[], hands=[], lh=0)

    def fork_l(p):
        pole(p, 4, 14, 58, 't', 'T'); fork_head(p, 4, 8, 'm')
    person(8, 27, 'd', 'D', 'long', 'H', 'n', 'frown', 'angry', '1', 15, 6, 5, 12,
           arms=[([(10, 44), (5, 41), (5, 37)], 4)], hands=[(3, 34, 'grip', False)], props=fork_l)

    def fork_r(p):
        pole(p, 58, 8, 61, 't', 'T'); fork_head(p, 58, 2, 'm')
    person(43, 28, 'v', 'V', 'crop', 'H', 'n', 'flat', 'soft', '2', 50, 8, 7, 12,
           arms=[([(57, 45), (60, 49), (59, 51)], 4)], hands=[(57, 51, 'grip', False)], props=fork_r, stance=1)

    def torch_r(p):
        pole(p, 41, 22, 40, 't', 'T')

    def torch_head(f):
        f.rect(40, 19, 43, 22, 'm'); f.hl(40, 43, 21, 'T')            # rag wrap, its own tone
        f.poly([(37.5, 19), (38, 14), (40, 10), (41.5, 7), (43, 11), (45, 13), (46, 19)], 'e')
        f.ell(39, 13, 44, 19, 'y')
    person(25, 26, 'b', 'B', 'short', 't', 'T', 'open', 'angry', '1', 32, 7, 6, 13,
           arms=[([(25, 43), (23, 48), (24, 52)], 3), ([(39, 43), (43, 41), (42, 36)], 3)],
           hands=[(22, 52, 'fist', False), (40, 33, 'grip', False)], props=torch_r, front=torch_head)
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#c9d4d6',
           'b': '#b2d4e2', 'g': '#78ac5b', 'G': '#6da151',
           'x': '#26262b', 'X': '#5a5a63', 'v': VDEEP[0], 'V': VDEEP[1], 'H': '#160f0c',
           'y': '#f0c548', 'Y': '#c08f22', 'F': '#efcf48', 'z': '#433733'}
    c.rect(0, 0, 63, 63, 'b')
    c.rect(0, 24, 63, 63, 'g')
    for y0 in (30, 44, 58):
        c.rect(0, y0, 63, y0 + 6, 'G')

    def goal(l):
        for x in range(7, 21, 4):
            l.vl(x, 8, 24, 'W')
        l.hl(3, 21, 16, 'W')
        l.rect(2, 6, 23, 7, 'w'); l.rect(2, 6, 3, 25, 'w'); l.rect(22, 6, 23, 25, 'w')
        l.vl(3, 8, 25, 'W'); l.vl(23, 8, 25, 'W'); l.hl(4, 23, 7, 'W')
    bg(c, goal, None)
    c.vl(57, 8, 27, 'w')
    c.poly([(58, 8), (58, 14), (63, 11)], 'F')

    f = layer()
    cx = 26
    DK = {'w': 'W', 'x': 'x', 'v': 'V'}
    # lower body: shorts, knees, socks, shoes, each its own value
    for lx in (20, 28):
        f.rect(lx, 48, lx + 5, 51, 'x')
        f.rect(lx + 1, 52, lx + 4, 53, 'v'); f.px(lx + 4, 53, 'V')
        f.rect(lx + 1, 54, lx + 4, 56, 'X')
        f.rect(lx + (0 if lx == 20 else 1), 57, lx + (4 if lx == 20 else 5), 58, 'z')
    f.rect(21, 48, 32, 49, 'x')
    t = layer()
    torso(t, cx, 35, 8, 7, 13, 'w', 'W', skin='v', skin_dark='V')
    for x in range(18, 36):
        if ((x - 18) // 2) % 2 == 0:
            t.recolor('wW', 'x', (x, 35, x, 48))
    t.poly([(cx - 3.5, 35), (cx + 3.5, 35), (cx, 39)], 'x')
    f.paste(t)
    a = layer()
    thick(a, [(34, 38), (37, 38)], 4, 'w'); a.recolor('w', 'x', (36, 36, 37, 40))
    thick(a, [(38, 38), (40, 37), (40, 31)], 3, 'v'); a.vl(41, 31, 38, 'V')
    over(f, a, DK)
    a2 = layer()
    thick(a2, [(18, 38), (16, 41)], 4, 'w'); a2.recolor('w', 'x', (15, 36, 16, 42))
    thick(a2, [(16, 42), (16, 46)], 3, 'v')
    over(f, a2, DK)
    hl = layer(); hand(hl, 38, 25, 'thumb', 'v', 'V'); over(f, hl, DK)
    hl = layer(); hand(hl, 14, 46, 'fist', 'v', 'V'); over(f, hl, DK)
    hd = layer(); head(hd, 18, 18, 16, 'v', 'V', mouth='grin', brows='soft', brow='H'); over(f, hd, DK)
    hr = layer(); hair(hr, 18, 18, 16, 'crop', 'H', 'x'); f.paste(hr)
    outline_once(f)
    c.paste(f)

    coin = layer()
    coin.stamp(37, 16, ['.yyyy.', 'ywyyyY', 'yyyyyY', 'yyyyyY', 'yyyyYY', '.YYYY.'])
    outline_once(coin)
    c.paste(coin)
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 't': '#c4d7d3', 'f': '#b6cac5',
           'i': '#e8eff1', 'I': '#b7c4c9', 'g': '#8e9597', 'G': '#6b7274', 'q': '#33424d',
           'n': '#8fb877', 'N': '#5d8a50', 'u': '#7fb0d8', 'U': '#5a8cb8',
           'o': '#c9a066', 'O': '#9e7840', '1': '#a9aeac', '2': '#7d8381',
           'a': LIGHT[0], 'A': LIGHT[1], 'e': DEEP[0], 'E': DEEP[1],
           'H': '#47322a', 'z': '#2f221c', 'r': '#b0552c'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 50, 63, 63, 'f')

    def line(l):
        l.hl(22, 63, 4, 'G')
    bg(c, line, None)

    def shirt(l):
        l.rect(27, 5, 33, 14, 'u'); l.rect(25, 5, 26, 9, 'u'); l.rect(34, 5, 35, 9, 'u')
        l.hl(29, 31, 5, 'U')
    bg(c, shirt, 'U')
    for bx in (40, 51):
        bg(c, lambda l, bx=bx: bill(l, bx, 5, 8, 6), 'N')
    for px_ in (27, 33, 41, 46, 52, 57):
        c.pts('o', [(px_, 3), (px_, 4), (px_, 5)]); c.pts('O', [(px_ + 1, 3), (px_ + 1, 4)])

    def washer(l):
        l.rect(0, 14, 20, 58, 'i')
        l.rect(17, 14, 20, 58, 'I'); l.rect(0, 14, 20, 16, 'I')
        l.rect(2, 18, 6, 19, 'g'); l.ell(14, 17, 16, 19, 'g')
        l.ell(1, 24, 19, 43, 'g'); l.ell(4, 27, 16, 40, 'q')
        bill(l, 5, 35, 6, 3); bill(l, 9, 37, 6, 3)
    bg(c, washer, 'I')

    DK = {'1': '2', 'u': 'U', 'e': 'E', 'a': 'A', 'n': 'N', 'o': 'O', 'G': 'G', 'q': 'q'}
    # launderer A: feeding a bill into the drum
    f = layer()
    legs(f, 32, 47, 2, 4, 8, 'G', 'G', 'q')
    torso(f, 32, 35, 7, 6, 12, '1', '2', skin='e', skin_dark='E')
    b = layer(); bill(b, 9, 35, 9, 5); over(f, b, DK)
    a = layer(); thick(a, [(26, 37), (22, 43), (19, 38)], 3, '1'); over(f, a, DK)
    a = layer(); thick(a, [(38, 37), (40, 42), (39, 45)], 3, '1'); over(f, a, DK)
    hl = layer(); hand(hl, 16, 35, 'fist', 'e', 'E'); over(f, hl, DK)
    hl = layer(); hand(hl, 38, 46, 'fist', 'e', 'E'); over(f, hl, DK)
    hd = layer(); head(hd, 25, 20, 14, 'e', 'E', mouth='smile', brows='soft', brow='z'); over(f, hd, DK)
    hr = layer(); hair(hr, 25, 20, 14, 'afro', 'H', 'z'); f.paste(hr)
    outline_once(f)
    c.paste(f)

    # launderer B: carrying a basket of bills
    f = layer()
    legs(f, 54, 46, 2, 4, 8, 'q', 'q', 'G')
    torso(f, 54, 34, 7, 6, 12, 'u', 'U', skin='a', skin_dark='A')
    a = layer(); thick(a, [(48, 36), (46, 41), (47, 44)], 3, 'u'); over(f, a, DK)
    a = layer(); thick(a, [(60, 36), (62, 41), (61, 44)], 3, 'u'); over(f, a, DK)
    bk = layer()
    for (bx, by) in ((45, 41), (51, 40), (56, 41), (48, 43), (54, 43)):
        p = layer(); bill(p, bx, by, 7, 4, band='w'); over(bk, p, {'n': 'N', 'w': 'N'})
    bk.poly([(43, 45), (64, 45), (62, 55), (45, 55)], 'o')
    for x in range(45, 63, 3):
        bk.vl(x, 47, 54, 'O')
    bk.hl(43, 63, 45, 'O'); bk.hl(44, 63, 46, 'O')
    over(f, bk, DK)
    hl = layer(); hand(hl, 45, 43, 'grip', 'a', 'A'); over(f, hl, DK)
    hl = layer(); hand(hl, 59, 43, 'grip', 'a', 'A', flip=True); over(f, hl, DK)
    hd = layer(); head(hd, 47, 19, 14, 'a', 'A', mouth='smile', brows='soft', brow='e'); over(f, hd, DK)
    hr = layer(); hair(hr, 47, 19, 14, 'bun', 'r', 'e', side='R'); f.paste(hr)
    outline_once(f)
    c.paste(f)
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
