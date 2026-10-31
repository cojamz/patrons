"""Option B, bold cartoon: 48x48 Saturday-cartoon look. 2px ink on the silhouette, 1px ink inside,
big heads and big props, flat fills with one cel-shadow tone per material."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from lib import C

STYLE = {
    'title': 'B  Bold cartoon  (48x48: 2px ink outline, big heads and props, one cel shadow)',
    'short': 'B Bold cartoon',
    'sub': '48x48, comic ink',
}

N = 48
INK = '#2a1e26'
W, W2 = '#f6f0e4', '#cfc6b8'
RED, RED2 = '#d9534a', '#a63a34'
MAG, MAG2, MAG3 = '#c2457f', '#8f2f5d', '#d86a9c'
GREY, GREY2 = '#a9aeac', '#7f8584'
GOLD, GOLD2 = '#efc04a', '#b88220'
CASH, CASH2, CASH3 = '#9cc77f', '#5f9150', '#3c6534'

PALE = ('#f3d5c0', '#d9ab92')
LIGHT = ('#ebbd94', '#c9916a')
OLIVE = ('#d1a072', '#a97a50')
MED = ('#a4683f', '#7f4d2d')
DEEP = ('#6e4128', '#52301d')
VDEEP = ('#4a2a1b', '#331c11')


def ring(c, k='k'):
    add = []
    for y in range(c.h):
        for x in range(c.w):
            if c.g[y][x] != '.':
                continue
            if any(c.get(x + dx, y + dy) != '.' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                add.append((x, y))
    for x, y in add:
        c.g[y][x] = k


def lay(fn):
    l = C(N)
    fn(l)
    ring(l)
    return l


def fig(*fns):
    """A figure: each part gets 1px ink, then the whole silhouette gets one more ring = 2px outside."""
    f = C(N)
    for fn in fns:
        f.paste(lay(fn))
    ring(f)
    return f


def pal_skin(pal, key, tone):
    pal[key] = tone[0]
    pal[key.upper()] = tone[1]


def cface(l, cx, ey, mouth='open', w=6, brows=None):
    """Cartoon face: 1x2 eyes, open D smile (dark mouth, tongue, never teeth)."""
    h = w // 2
    l.vl(cx - h, ey, ey + 1, 'k'); l.vl(cx + h - 1, ey, ey + 1, 'k')
    if brows == 'up':
        l.hl(cx - h - 1, cx - h + 1, ey - 2, 'k'); l.hl(cx + h - 2, cx + h, ey - 2, 'k')
    my = ey + 3 + (w >= 8)
    if mouth == 'open':
        l.hl(cx - h, cx + h - 1, my, 'k')
        l.px(cx - h, my + 1, 'k'); l.px(cx + h - 1, my + 1, 'k'); l.hl(cx - h + 1, cx + h - 2, my + 1, 'r')
        l.px(cx - h + 1, my + 2, 'k'); l.px(cx + h - 2, my + 2, 'k'); l.hl(cx - h + 2, cx + h - 3, my + 2, 't')
        l.hl(cx - h + 2, cx + h - 3, my + 3, 'k')
    elif mouth == 'grin':
        l.px(cx - h, my, 'k'); l.px(cx + h - 1, my, 'k'); l.hl(cx - h + 1, cx + h - 2, my + 1, 'k')


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, '1': MAG, '2': MAG2, '3': MAG3, 'g': '#5a4c5c', 'G': '#40354a',
           'c': '#8a5530', 'C': '#5e3820', 'e': '#f07a3a', 'y': GOLD, 'Y': GOLD2, 'm': '#b9adb4', 's': '#2f2733'}
    pal_skin(pal, 'a', LIGHT)

    def body(l):
        l.poly([(1, 48), (3, 39), (9, 35), (39, 35), (45, 39), (47, 48)], '1')
        for x in range(4, 46, 4):
            l.recolor('1', '3', (x, 37, x, 47))                 # pinstripes
        l.poly([(37, 35), (39, 35), (45, 39), (47, 48), (40, 48)], '2', only='13')
        l.poly([(18, 35), (30, 35), (24, 47)], 's')            # dark shirt
        l.rect(23, 36, 25, 46, 'w'); l.vl(25, 36, 46, 'W')      # white tie

    def head(l):
        l.ell(12, 10, 35, 30, 'a'); l.rect(13, 20, 34, 33, 'a'); l.hl(14, 33, 34, 'a'); l.hl(16, 31, 35, 'a')
        l.rect(10, 20, 11, 26, 'a'); l.rect(36, 20, 37, 26, 'a')   # ears
        l.recolor('a', 'A', (31, 15, 37, 35))                     # cel shadow, right edge
        l.hl(13, 34, 14, 'A')                                     # brim shadow
        l.ell(14, 0, 33, 14, 'g')
        l.rect(14, 7, 33, 11, 'g')
        l.rect(14, 9, 33, 11, '1')                                # band
        l.recolor('g', 'G', (29, 1, 33, 11))
        l.rect(5, 12, 42, 13, 'g'); l.rect(34, 12, 42, 13, 'G')
        l.hl(21, 26, 1, 'G')                                      # crease

    c.paste(fig(body, head))
    c.line(17, 35, 23, 47, 'k'); c.line(31, 35, 25, 47, 'k')       # lapels
    # heavy lids: thick flat brows, half-shut eyes
    c.rect(16, 17, 22, 18, 'k'); c.rect(26, 17, 32, 18, 'k')
    c.hl(17, 21, 20, 'k'); c.hl(27, 31, 20, 'k')
    c.hl(18, 20, 21, 'k'); c.hl(28, 30, 21, 'k')
    # big nose with a cel side
    c.rect(22, 21, 26, 26, 'A'); c.rect(22, 21, 24, 25, 'a'); c.hl(21, 27, 26, 'A')
    # smirk, one corner up
    c.hl(18, 25, 30, 'k'); c.px(17, 29, 'k')

    def cigar(l):
        l.rect(25, 28, 39, 31, 'c'); l.hl(25, 39, 31, 'C')
        l.rect(40, 28, 41, 31, 'e')

    def hand(l):  # big hand pinching the cigar, gold ring
        l.rect(29, 32, 38, 40, 'a'); l.hl(30, 37, 41, 'a')
        l.recolor('a', 'A', (36, 32, 38, 41))
        l.rect(30, 25, 32, 32, 'a'); l.rect(34, 25, 36, 32, 'a')
        l.vl(33, 26, 32, 'k')
        l.rect(30, 33, 32, 34, 'y'); l.px(32, 34, 'Y')
    c.paste(lay(hand))
    c.paste(lay(cigar))
    c.pts('m', [(43, 26), (44, 25), (44, 24), (43, 23), (43, 22), (44, 21), (44, 20)])
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, '1': RED, '2': RED2, 'r': '#6b1f24', 't': '#e0707a',
           'h': '#2a1d18', 'y': '#e8c25a', 'n': '#6b4a30', 'o': '#8a4b2a', 'q': '#4a2c22'}
    for key, tone in (('a', OLIVE), ('p', PALE), ('m', MED), ('l', LIGHT), ('d', DEEP)):
        pal_skin(pal, key, tone)

    def head(l, x0, y0, x1, y1, sk):
        l.ell(x0, y0, x1, y1, sk)
        l.ell(x1 - 2, y0 + 1, x1 + 3, y1, sk.upper(), only=sk)

    # back-left: olive, black hair, holds the pennant pole up
    def bl(l):
        l.rect(6, 19, 19, 30, '2')
        head(l, 7, 8, 18, 20, 'a')
        l.ell(7, 5, 18, 10, 'h'); l.rect(7, 8, 7, 12, 'h'); l.rect(18, 8, 18, 11, 'h')
    def pennant(l):
        l.rect(1, 0, 2, 34, 'n')
        l.poly([(3, 0), (3, 9), (20, 4)], '1')
        l.poly([(3, 0), (3, 9), (7, 8), (7, 1)], 'w', only='1')
    # back-right: pale, blonde bunches, fist straight up
    def br(l):
        l.rect(29, 18, 43, 30, '2')
        l.rect(42, 5, 45, 18, '2'); l.ell(41, 0, 46, 6, 'p')
        head(l, 30, 8, 41, 20, 'p')
        l.ell(30, 6, 41, 11, 'y'); l.rect(28, 10, 29, 15, 'y'); l.rect(42, 10, 43, 13, 'y')
    # front-left: deep skin, puffs
    def fl(l):
        l.poly([(-2, 48), (0, 40), (3, 37), (11, 37), (14, 40), (15, 48)], '1')
        head(l, -1, 23, 12, 36, 'd')
        l.ell(-1, 21, 12, 27, 'h'); l.ell(-2, 19, 3, 24, 'h'); l.ell(8, 19, 13, 24, 'h')
    # front-right: medium, bobble hat
    def fr(l):
        l.poly([(33, 48), (34, 38), (37, 35), (45, 35), (48, 37), (49, 48)], '1')
        head(l, 35, 21, 48, 34, 'm')
        l.ell(35, 17, 48, 25, '1'); l.rect(35, 23, 48, 24, 'w'); l.ell(39, 14, 43, 18, 'w')
    # centre: light skin, brown hair, scarf, a step forward and biggest
    def ce(l):
        l.poly([(11, 48), (13, 41), (17, 38), (31, 38), (35, 41), (37, 48)], '1')
        l.poly([(31, 38), (35, 41), (37, 48), (33, 48)], '2', only='1')
        head(l, 15, 17, 32, 38, 'l')
        l.ell(15, 14, 32, 23, 'o'); l.rect(15, 19, 16, 24, 'o'); l.rect(31, 19, 32, 22, 'o')
        for x in range(14, 35):
            l.rect(x, 38, x, 41, 'w' if (x // 3) % 2 else '1')
    c.paste(lay(pennant))
    c.paste(lay(bl)); cface(c, 13, 13, 'open', w=6)
    c.paste(lay(br)); cface(c, 35, 14, 'open', w=6)
    c.paste(lay(fl)); cface(c, 6, 29, 'open', w=6)
    c.paste(lay(lambda l: l.ell(0, 29, 4, 33, 'd')))
    c.paste(lay(fr)); cface(c, 41, 27, 'open', w=6)
    c.paste(lay(ce)); cface(c, 24, 26, 'open', w=8, brows='up')
    ring(c)
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'k': INK, 'w': W, '1': '#ecebe5', '2': '#3a3d42', 's': VDEEP[0], 'S': VDEEP[1], 'L': '#7d4c31',
           'y': GOLD, 'Y': GOLD2, 'v': '#cfd6da', 'V': '#8f9a9f', 'q': '#140d10', 'm': '#8a7f86'}

    def stripes(l, box):
        x0 = box[0]
        for x in range(x0, box[2] + 1):
            if ((x - x0) // 3) % 2 == 1:
                l.recolor('1', '2', (x, box[1], x, box[3]))

    def body(l):
        l.poly([(1, 48), (3, 40), (8, 36), (34, 36), (40, 40), (42, 48)], '1')
        stripes(l, (0, 36, 47, 47))
        l.rect(16, 32, 26, 37, 'S')                      # neck
        l.poly([(14, 36), (28, 36), (21, 42)], 'q')      # collar V
    def arm(l):
        l.rect(36, 33, 46, 44, '1'); stripes(l, (36, 33, 46, 44))   # short sleeve
        l.rect(38, 22, 44, 32, 's'); l.rect(43, 22, 44, 32, 'S')    # forearm
        l.rect(36, 13, 46, 22, 's'); l.rect(44, 13, 46, 22, 'S')    # fist
        l.hl(37, 43, 16, 'S'); l.hl(37, 43, 19, 'S')                # finger creases
        l.rect(37, 9, 39, 12, 's')                                  # thumb up, flicking
    def head(l):
        l.ell(9, 8, 32, 34, 's')
        l.rect(7, 18, 8, 24, 's'); l.rect(33, 18, 34, 24, 's')
        l.ell(28, 9, 35, 34, 'S', only='s')
    def coin(l):
        l.ell(34, 0, 42, 5, 'Y'); l.ell(35, 0, 41, 3, 'y')
    c.paste(fig(body, head))
    c.paste(fig(arm))
    # crown shine, a short clean arc
    c.hl(15, 19, 11, 'L'); c.hl(13, 14, 12, 'L')
    # face: dark eyes (no whites), raised brows looking up at the coin, confident grin
    c.hl(13, 17, 15, 'k'); c.hl(23, 27, 15, 'k')
    c.hl(14, 17, 17, 'L'); c.hl(23, 26, 17, 'L')
    c.rect(14, 18, 16, 21, 'q'); c.rect(24, 18, 26, 21, 'q')
    c.rect(18, 23, 22, 26, 'S'); c.hl(19, 21, 22, 'S')                 # nose
    c.pts('L', [(12, 24), (13, 24), (27, 24), (28, 24)])                # cheek sheen
    c.hl(14, 26, 29, 'q'); c.px(13, 28, 'q'); c.px(27, 28, 'q'); c.hl(16, 24, 30, 'q')
    # whistle on a cord
    c.line(17, 37, 21, 41, 'v')
    c.paste(lay(lambda l: (l.rect(21, 40, 27, 43, 'v'), l.hl(21, 27, 43, 'V'))))
    c.paste(lay(coin))
    c.pts('m', [(33, 4), (33, 5), (46, 2), (46, 3), (34, 8), (45, 7)])   # spin ticks
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, '1': GREY, '2': GREY2, '3': '#cfd2d0',
           'n': CASH, 'N': CASH2, 'D': CASH3, 'u': '#bfe0ea', 'U': '#8fbccb', 't': '#d4d8da', 'T': '#9aa3a8',
           'p': '#caa064', 'P': '#9b7440', 'b': '#c99a5a', 'B': '#956b37', 'h': '#2a1d18', 'g': '#c0612e', 'G': '#8f4220',
           'e': '#e8703a', 'x': '#6a8ab0', 'X': '#4f6d91', 'j': '#5b7fa6'}
    pal_skin(pal, 'a', MED); pal_skin(pal, 'f', PALE)

    # clothesline with a shirt and two bills pegged on it
    c.hl(0, 47, 3, 'k')
    def shirt(l):
        l.poly([(16, 3), (31, 3), (35, 7), (32, 10), (30, 8), (30, 16), (17, 16), (17, 8), (15, 10), (12, 7)], 'x')
        l.recolor('x', 'X', (26, 4, 30, 16))
        l.rect(21, 3, 26, 3, 'X'); l.hl(22, 25, 4, 'X')
    def bill(l, x0):
        l.rect(x0, 3, x0 + 9, 9, 'n'); l.rect(x0 + 3, 4, x0 + 6, 8, 'N'); l.rect(x0 + 4, 5, x0 + 5, 7, 'D')
    c.paste(lay(lambda l: bill(l, 1)))
    c.paste(lay(lambda l: bill(l, 37)))
    c.paste(lay(shirt))
    for x in (5, 41, 18, 28):
        c.paste(lay(lambda l, x=x: (l.rect(x, 1, x + 1, 5, 'p'),)))

    # left launderer: medium skin, headscarf, rolled sleeve leaning on the machine
    def left(l):
        l.poly([(-2, 48), (0, 38), (3, 35), (11, 35), (14, 38), (14, 48)], '1')
        l.rect(4, 31, 9, 35, 'A')
        l.ell(-1, 16, 14, 33, 'a'); l.ell(10, 17, 16, 33, 'A', only='a')
        l.ell(-1, 13, 14, 21, 'j'); l.rect(-1, 19, 14, 20, 'X'); l.ell(-2, 18, 2, 22, 'j')
    def larm(l):
        l.rect(5, 38, 10, 42, '3')                        # rolled cuff
        l.rect(11, 38, 14, 42, 'a'); l.rect(13, 36, 15, 43, 'a'); l.recolor('a', 'A', (11, 42, 15, 43))   # hand on the machine
    def right(l):
        l.poly([(32, 48), (33, 38), (36, 35), (44, 35), (48, 37), (49, 48)], '1')
        l.rect(38, 31, 43, 35, 'F')
        l.ell(33, 17, 48, 33, 'f'); l.ell(45, 18, 50, 33, 'F', only='f')
        l.ell(33, 13, 48, 21, 'g'); l.rect(33, 17, 34, 23, 'g'); l.rect(47, 17, 48, 23, 'g')
        l.recolor('g', 'G', (40, 14, 48, 16))
    def washer(l):
        l.rect(13, 22, 34, 47, 'w'); l.rect(31, 22, 34, 47, 'W')
        l.rect(13, 22, 34, 26, 'T'); l.rect(15, 23, 21, 25, 't')        # control strip
        l.ell(27, 23, 29, 25, 'e')
        l.hl(13, 34, 27, 'k')
        l.ell(14, 29, 33, 46, 'T'); l.ring(14, 29, 33, 46, 'k')
        l.ell(17, 32, 30, 43, 'u'); l.ell(24, 32, 30, 43, 'U', only='u'); l.ring(17, 32, 30, 43, 'k')
        l.hl(18, 22, 30, 't')                                           # rim shine
    c.paste(fig(left))
    c.paste(fig(right))
    c.paste(fig(washer))
    for x0, y0, w, h in ((18, 35, 7, 4), (25, 34, 4, 7), (19, 40, 6, 3)):
        b = C(N)
        b.rect(x0, y0, x0 + w - 1, y0 + h - 1, 'N'); b.rect(x0 + 1, y0 + 1, x0 + w - 2, y0 + h - 2, 'n')
        b.px(x0 + w // 2, y0 + h // 2, 'D')
        c.paste(b)
    c.paste(lay(larm))
    # basket heaped with bills
    def basket(l):
        l.rect(31, 38, 48, 47, 'b')
        for y in (41, 44):
            l.hl(31, 48, y, 'B')
        for x in range(33, 48, 4):
            l.vl(x, 38, 47, 'B')
    heap = [(34, 34), (41, 33), (37, 31), (44, 35), (31, 35)]
    for x0, y0 in heap:
        c.paste(lay(lambda l, x0=x0, y0=y0: (l.rect(x0, y0, x0 + 6, y0 + 3, 'n'), l.rect(x0 + 2, y0 + 1, x0 + 4, y0 + 2, 'N'))))
    c.paste(lay(basket))
    # sleeves and hands on the basket rim
    c.paste(lay(lambda l: (l.rect(30, 36, 32, 42, 'f'), l.recolor('f', 'F', (30, 41, 32, 42)))))
    cface(c, 7, 24, 'grin', w=6)
    cface(c, 40, 24, 'grin', w=6)
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
