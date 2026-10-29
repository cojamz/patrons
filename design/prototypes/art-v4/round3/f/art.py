"""Style F, diorama closer: 64x64, camera pulled in from B. Chunky RPG people about 36-40px tall
fill half the frame; the room or place still wraps them. Flat 2-3 tones, ink outline on figures and props."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, obj, head, body,
                 pitchfork, torch, cash_brick, bill)

STYLE = {
    'title': 'F  Diorama, closer  (64x64: people ~38px, the room still around them)',
    'short': 'F Diorama, closer',
    'sub': '64x64, people half the frame',
}


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1',
           'p': '#5e3a55', 'P': '#553350',                 # plum wallpaper
           'o': '#8a5434', 'O': '#6a3d25', 'd': '#a86c44',  # mahogany
           'g': '#8d9296', 'G': '#62676c',                 # steel safe
           'y': '#f2d27a', 'b': '#c9a24a',                 # glow / brass
           'l': '#3f8a5c', 'L': '#2c6a45',                 # lamp shade
           'n': '#8fb877', 'N': '#5d8a50',                 # cash
           '1': '#c2457f', '2': '#8f2f5d',  # magenta suit
           'a': OLIVE[0], 'A': OLIVE[1],
           'h': '#2f2733', 'H': '#463a4c', 'q': '#2c3558', 'Q': '#41507c', 'e': '#ef7d36'}

    c.rect(0, 0, 63, 40, 'p')
    for x in range(2, 64, 6):
        c.vl(x, 0, 33, 'P')
    c.rect(0, 34, 63, 40, 'O'); c.hl(0, 63, 34, 'o')
    c.rect(0, 41, 63, 63, 'O')

    def window(l):
        l.rect(1, 4, 18, 24, 'o'); l.rect(3, 6, 16, 22, 'q')
        l.ell(11, 8, 15, 12, 'y')
        for x0, x1, top in ((3, 5, 16), (6, 9, 13), (10, 12, 18), (13, 16, 15)):
            l.rect(x0, top, x1, 22, 'Q')
        l.pts('y', [(4, 18), (7, 15), (8, 19), (11, 20), (14, 17)])
    c.paste(obj(window))

    def safe(l):
        l.rect(45, 13, 62, 15, 'g')
        l.rect(45, 16, 62, 44, 'G'); l.rect(46, 17, 61, 43, 'g')
        l.rect(48, 19, 59, 41, 'G'); l.rect(49, 20, 58, 40, 'g')
        l.ell(50, 23, 56, 29, 'G'); l.ell(51, 24, 55, 28, 'b'); l.vl(53, 24, 25, 'k')
        l.rect(56, 32, 57, 37, 'G')
    c.paste(obj(safe))

    def boss(l):
        x0, y0, hw, hh = 24, 11, 16, 15
        tw = 22
        tx0 = x0 + hw // 2 - tw // 2
        body(l, tx0, y0 + hh - 1, tw, 18, 0, 'a', '1', '2', arms=('down', 'down'), aw=4)
        ty = y0 + hh - 1
        cx = x0 + hw // 2
        l.poly([(cx - 4, ty), (cx + 4, ty), (cx, ty + 8)], 'w')            # shirt
        l.rect(cx - 1, ty + 1, cx, ty + 7, 'h'); l.hl(cx - 1, cx, ty + 1, 'H')  # tie
        l.line(cx - 5, ty, cx - 1, ty + 9, '2'); l.line(cx + 4, ty, cx, ty + 9, '2')  # lapels
        l.hl(cx + 5, cx + 7, ty + 4, 'w')                                  # pocket square
        head(l, x0, y0, hw, hh, 'a', 'A', eyes='glint', mouth='smirk', brows='stern', ears=True)
        # fedora: crown, magenta band, wide brim
        l.rect(x0 + 1, y0 - 6, x0 + hw - 2, y0 + 1, 'h'); l.hl(x0 + 2, x0 + hw - 3, y0 - 7, 'h')
        l.rect(x0 + 5, y0 - 7, x0 + hw - 6, y0 - 6, 'H')
        l.rect(x0 + 1, y0 - 1, x0 + hw - 2, y0 + 1, '1')
        l.hl(x0 - 3, x0 + hw + 2, y0 + 2, 'h'); l.hl(x0 - 2, x0 + hw + 1, y0 + 3, 'h')
        l.hl(x0, x0 + hw - 1, y0 + 4, 'A')
        # cigar from the mouth corner
        my = y0 + hh // 2 + 3
        l.rect(cx + 4, my, cx + 9, my + 1, 'O'); l.rect(cx + 10, my, cx + 10, my + 1, 'e')
    c.paste(obj(boss))

    def desk(l):
        l.poly([(4, 40), (59, 40), (63, 47), (0, 47)], 'd')
        l.hl(0, 63, 47, 'o')
        l.rect(1, 48, 62, 63, 'o')
        l.rect(4, 51, 25, 58, 'O'); l.rect(5, 52, 24, 57, 'o')
        l.rect(38, 51, 59, 58, 'O'); l.rect(39, 52, 58, 57, 'o')
        l.hl(13, 16, 54, 'b'); l.hl(47, 50, 54, 'b')
    c.paste(obj(desk))

    def hands(l):
        l.rect(18, 40, 22, 43, '1'); l.rect(19, 43, 22, 45, 'a'); l.hl(19, 22, 45, 'A')
        l.rect(41, 40, 45, 43, '2'); l.rect(41, 43, 44, 45, 'a'); l.hl(41, 44, 45, 'A')
    c.paste(obj(hands))

    def lamp(l):
        l.rect(4, 42, 13, 43, 'b'); l.rect(8, 35, 9, 41, 'b')
        l.poly([(1, 35), (4, 29), (13, 29), (16, 35)], 'l')
        l.poly([(9, 29), (13, 29), (16, 35), (10, 35)], 'L', only='l')
        l.hl(2, 15, 35, 'y')
    c.paste(obj(lamp))

    def cash(l):
        cash_brick(l, 47, 37, 8, 7)
        cash_brick(l, 55, 40, 7, 4)
    c.paste(obj(cash))
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1',
           's': '#1f2742', 'h': '#3d3245', 'H': '#2b2232',
           'y': '#f6d36a', 'e': '#ef7d36',
           't': '#a8703f', 'm': '#d3d7db', 'n': '#2a1d18', 'c': '#5c5560',
           '1': '#d9534a', '2': '#a83a35', 'g': '#c9c2b6'}
    pal['a'], pal['A'] = PALE; pal['b'], pal['B'] = LIGHT; pal['d'], pal['D'] = OLIVE
    pal['u'], pal['U'] = MED; pal['v'], pal['V'] = VDEEP

    c.rect(0, 0, 63, 63, 's')
    c.ell(51, 2, 58, 9, 'w'); c.ell(53, 1, 60, 8, 's', only='w')
    c.pts('w', [(4, 3), (24, 2), (44, 6), (33, 8)])
    c.poly([(-1, 22), (9, 12), (19, 22)], 'H'); c.rect(0, 22, 17, 63, 'h')
    c.poly([(44, 24), (54, 14), (65, 24)], 'H'); c.rect(46, 24, 63, 63, 'h')
    c.poly([(17, 27), (26, 19), (35, 27)], 'H'); c.rect(19, 27, 33, 63, 'h')
    for (x, y) in ((7, 16), (24, 23), (52, 18)):
        c.rect(x, y, x + 3, y + 3, 'y'); c.hl(x, x + 3, y + 2, 'e')
    c.rect(0, 52, 63, 63, 'c')

    def back_l(l):
        x0, y0, hw, hh = 14, 13, 12, 12
        hd = body(l, x0 + 1, y0 + hh - 1, 10, 12, 0, 'a', '2', 'n', arms=('up', 'down'), aw=3, hx0=x0, hx1=x0 + hw - 1)
        head(l, x0, y0, hw, hh, 'a', 'A', hair='y', hs='side', mouth='shout', brows='angry')
    c.paste(obj(back_l))

    def back_r(l):
        x0, y0, hw, hh = 39, 13, 12, 12
        body(l, x0 + 1, y0 + hh - 1, 10, 12, 0, 'u', '1', '2', arms=('down', 'up'), aw=3, hx0=x0, hx1=x0 + hw - 1)
        head(l, x0, y0, hw, hh, 'u', 'U', hair='n', hs='puff', mouth='shout', brows='angry')
    c.paste(obj(back_r))

    def front(l, x0, skin, shade, hair, hs, top, top2, arms, mouth, brows, lit=None, hw=13):
        hh = 13
        tx0 = x0 + 1
        hands = body(l, tx0, 26 + hh - 1, hw - 2, 11, 7, skin, top, top2, legs='n', shoes='k',
                     arms=arms, aw=3, hx0=x0, hx1=x0 + hw - 1)
        head(l, x0, 26, hw, hh, skin, shade, hair=hair, hs=hs, mouth=mouth, brows=brows, lit=lit)
        return hands

    def front_l(l):
        h = front(l, 7, 'd', 'D', 'n', 'long', 'g', 'c', ('up', 'down'), 'shout', 'angry')
        x, y = h['L']
        pitchfork(l, x + 1, y - 17, y + 16, pole=1)
        l.rect(x, y, x + 2, y + 2, 'd')
    c.paste(obj(front_l))

    def front_r(l):
        h = front(l, 45, 'v', 'V', 'n', 'crop', '2', 'n', ('down', 'up'), 'flat', None, lit='U')
        x, y = h['R']
        pitchfork(l, x + 1, y - 17, y + 16, pole=1)
        l.rect(x, y, x + 2, y + 2, 'v')
    c.paste(obj(front_r))

    def lead(l):
        x0, y0, hw, hh = 24, 25, 14, 14
        h = body(l, x0 + 1, y0 + hh - 1, hw - 2, 12, 8, 'b', '1', '2', legs='n', arms=('mid', None), aw=3,
                 hx0=x0, hx1=x0 + hw - 1)
        ty = y0 + hh - 1
        # right arm up and in, holding the torch above his head's corner
        l.rect(x0 + hw - 1, ty + 1, x0 + hw + 1, ty + 4, '2')
        l.rect(x0 + hw, ty - 6, x0 + hw + 2, ty + 1, '2')
        torch(l, x0 + hw + 1, 4, ty - 7, pole=1, size=1)
        l.rect(x0 + hw, ty - 10, x0 + hw + 2, ty - 7, 'b')
        head(l, x0, y0, hw, hh, 'b', 'B', hair='t', hs='short', mouth='shout', brows='angry')
        x, y = h['L']
        l.rect(x, y, x + 2, y + 2, 'b')
    c.paste(obj(lead))
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfd6d8',
           'b': '#9cc8e0', 'B': '#c4e0ea',
           'g': '#6fa553', 'G': '#5c9145',
           'r': '#c9534a', 'R': '#a63d36',
           'x': '#26262b', 'X': '#4a4a52', 'v': VDEEP[0], 'V': VDEEP[1], 'L': '#7a4c34',
           'y': '#f0c548', 'Y': '#c08f22', 'f': '#f0d24a', 'F': '#d9a52e'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 3, 'B')
    c.rect(0, 12, 63, 17, 'r'); c.rect(0, 16, 63, 17, 'R')
    for x in (3, 21, 39, 57):
        c.rect(x, 13, x + 9, 14, 'w')
    c.rect(0, 18, 63, 63, 'g')
    for y0, hg in ((23, 3), (32, 4), (43, 5), (56, 7)):
        c.rect(0, y0, 63, y0 + hg, 'G')
    c.hl(0, 63, 20, 'w')
    c.ring(-4, 52, 68, 80, 'w')

    net = C(N)
    for y in range(5, 20):
        for x in range(2, 23):
            if (x + y) % 3 == 0 or (x - y) % 3 == 0:
                net.px(x, y, 'W')
    c.paste(net)
    c.paste(obj(lambda l: (l.rect(0, 3, 24, 4, 'w'), l.rect(0, 3, 1, 20, 'w'), l.rect(23, 3, 24, 20, 'w'))))

    def flag(l):
        l.vl(58, 6, 24, 'w')
        l.poly([(59, 6), (59, 13), (65, 9.5)], 'f')
        l.poly([(59, 10), (59, 13), (65, 9.5)], 'F', only='f')
    c.paste(obj(flag))

    def ref(l):
        x0, y0, hw, hh = 19, 21, 15, 15
        tw, th = 13, 11
        tx0 = x0 + 1
        ty = y0 + hh - 1
        ly = ty + th
        # shorts, knees, socks, boots: each its own value
        l.rect(tx0, ly, tx0 + tw - 1, ly + 3, 'x'); l.vl(tx0 + tw // 2, ly + 2, ly + 3, 'k')
        for lx in (tx0 + 1, tx0 + tw - 5):
            l.rect(lx, ly + 4, lx + 3, ly + 5, 'v')
            l.rect(lx, ly + 6, lx + 3, ly + 8, 'X')
            l.hl(lx, lx + 3, ly + 6, 'W')
            l.rect(lx - (1 if lx == tx0 + 1 else 0), ly + 9, lx + 3 + (0 if lx == tx0 + 1 else 1), ly + 10, 'x')
        body(l, tx0, ty, tw, th, 0, 'v', 'w', 'W', arms=('down', None), aw=3)
        for x in range(tx0 + 1, tx0 + tw, 2):
            l.recolor('wW', 'x', (x, ty, x, ly - 1))
        l.recolor('wW', 'x', (tx0 - 2, ty + 2, tx0 - 1, ty + 2)); l.recolor('wW', 'x', (tx0 - 2, ty + 5, tx0 - 1, ty + 5))
        l.rect(tx0 + 4, ty, tx0 + 8, ty, 'x')
        # flicking arm: sleeve out, forearm up, fist with thumb up
        ex = tx0 + tw
        l.rect(ex, ty + 1, ex + 3, ty + 4, 'w'); l.vl(ex + 1, ty + 1, ty + 4, 'x'); l.vl(ex + 3, ty + 1, ty + 4, 'x')
        l.rect(ex + 4, ty - 6, ex + 6, ty + 4, 'v'); l.vl(ex + 6, ty - 6, ty + 4, 'V')
        l.rect(ex + 3, ty - 10, ex + 7, ty - 7, 'v'); l.vl(ex + 7, ty - 10, ty - 7, 'V')
        l.rect(ex + 6, ty - 12, ex + 7, ty - 11, 'v')                 # thumb
        head(l, x0, y0, hw, hh, 'v', 'V', hair='x', hs='crop', mouth='grin', lit='L')
        # warm lit cheekbones frame the smile
    c.paste(obj(ref))

    def coin(l):
        l.ell(37, 14, 43, 20, 'Y'); l.ell(37, 14, 42, 19, 'y', only='Y')
        l.vl(40, 16, 18, 'Y')
    c.paste(obj(coin))
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfc8bb',
           't': '#b9d3cf', 'T': '#a6c4bf', 'f': '#d8cdb4',
           'g': '#8e9597', 'G': '#6b7274', 'q': '#33424d', 'Q': '#4a6170',
           'n': '#8fb877', 'N': '#5d8a50',
           'u': '#7fb0d8', 'U': '#5a8cb8',
           'o': '#c9a066', 'O': '#9e7840',
           '1': '#a9aeac', '2': '#7d8381',
           'a': LIGHT[0], 'A': LIGHT[1], 'e': DEEP[0], 'E': DEEP[1],
           'h': '#1f1714', 'r': '#b0552c'}
    c.rect(0, 0, 63, 63, 't')
    for y in range(5, 46, 7):
        c.hl(0, 63, y, 'T')
    for x in range(6, 64, 7):
        c.vl(x, 0, 45, 'T')
    for y in range(46, 64):
        for x in range(64):
            c.px(x, y, 'f' if ((x // 7) + ((y - 46) // 5)) % 2 else 'W')

    c.hl(22, 63, 3, 'G')

    def shirt(l, x0, y0):
        l.rect(x0 + 2, y0, x0 + 8, y0 + 9, 'u'); l.rect(x0, y0, x0 + 1, y0 + 4, 'u'); l.rect(x0 + 9, y0, x0 + 10, y0 + 4, 'u')
        l.vl(x0 + 8, y0 + 1, y0 + 9, 'U'); l.hl(x0 + 4, x0 + 6, y0, 'U')
    c.paste(obj(lambda l: shirt(l, 25, 4)))
    c.paste(obj(lambda l: bill(l, 40, 4)))
    c.paste(obj(lambda l: bill(l, 53, 4)))
    for x in (27, 33, 42, 55):
        c.paste(obj(lambda l, x=x: l.rect(x, 2, x, 5, 'O')))

    def washer(l):
        l.rect(0, 14, 20, 16, 'W')
        l.rect(0, 17, 20, 52, 'w'); l.vl(20, 17, 52, 'W')
        l.hl(0, 20, 21, 'W')
        l.rect(2, 18, 7, 20, 'g'); l.ell(15, 18, 17, 20, 'G')
        l.ell(1, 25, 19, 43, 'g')                                       # rim
        l.ell(3, 27, 17, 41, 'q')                                       # open drum, dark
        l.ell(10, 29, 17, 40, 'Q', only='q')
        bill(l, 5, 35, 7, 4); bill(l, 9, 31, 6, 4)                      # bills already inside
        l.hl(0, 20, 50, 'W')
    c.paste(obj(washer))

    def door(l):  # open porthole door swung to the left edge
        l.ell(-6, 26, 1, 42, 'g'); l.ell(-4, 28, 0, 40, 'Q', only='g')
    c.paste(obj(door))

    def person_a(l):
        x0, y0, hw, hh = 25, 19, 13, 13
        tx0 = x0 + 1
        ty = y0 + hh - 1
        h = body(l, tx0, ty, 11, 11, 7, 'e', '1', '2', legs='G', shoes='k', arms=(None, 'down'), aw=3)
        # left arm straight out to the drum, hand pushing a bill in
        l.rect(tx0 - 7, ty + 1, tx0 - 1, ty + 3, '1')
        l.rect(tx0 - 10, ty + 1, tx0 - 8, ty + 3, 'e')
        head(l, x0, y0, hw, hh, 'e', 'E', hair='h', hs='puff', mouth='smile', lit='O')
    c.paste(obj(person_a))
    c.paste(obj(lambda l: (bill(l, 10, 29, 8, 5), l.rect(15, 31, 17, 33, 'e'))))

    def person_b(l):
        x0, y0, hw, hh = 46, 18, 13, 13
        tx0 = x0 + 1
        ty = y0 + hh - 1
        body(l, tx0, ty, 11, 11, 8, 'a', 'u', 'U', legs='q', shoes='k', arms=('front', 'front'), aw=3)
        head(l, x0, y0, hw, hh, 'a', 'A', hair='r', hs='bun', mouth='smile')
    c.paste(obj(person_b))

    def basket(l):
        heap = C(N); heap.ell(41, 33, 63, 42, '#')
        for y in range(33, 40):
            for x in range(40, 64):
                if heap.get(x, y) != '#':
                    continue
                bx = (x - 40 + (3 if ((y - 33) // 2) % 2 else 0)) % 5
                l.px(x, y, 'N' if (y - 33) % 2 == 1 or bx == 4 else 'n')
        l.poly([(40, 38), (64, 38), (62, 49), (42, 49)], 'o')
        for y in (42, 46):
            l.hl(41, 62, y, 'O')
        l.rect(40, 38, 63, 39, 'O')
        l.rect(44, 37, 46, 40, 'a'); l.rect(57, 37, 59, 40, 'a')
    c.paste(obj(basket))
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
