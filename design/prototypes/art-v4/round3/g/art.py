"""Style G, diorama closest: 64x64, waist-up. Chunky RPG people fill ~48px of the frame;
the setting sits behind and around the edges with the key props. Flat 2-3 tones, ink outlines."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'f'))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
from lib import C
from kit import (N, INK, PALE, LIGHT, OLIVE, MED, DEEP, VDEEP, obj, head, body,
                 pitchfork, torch, cash_brick, bill)

STYLE = {
    'title': 'G  Diorama, closest  (64x64: waist-up people ~48px, props around the edges)',
    'short': 'G Diorama, closest',
    'sub': '64x64, waist-up in the room',
}


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1',
           'p': '#5e3a55', 'P': '#553350',
           'o': '#8a5434', 'O': '#6a3d25', 'd': '#a86c44',
           'g': '#8d9296', 'G': '#62676c',
           'y': '#f2d27a', 'b': '#c9a24a',
           'l': '#3f8a5c', 'L': '#2c6a45',
           'n': '#8fb877', 'N': '#5d8a50',
           '1': '#c2457f', '2': '#8f2f5d',
           'a': OLIVE[0], 'A': OLIVE[1],
           'h': '#2f2733', 'H': '#463a4c', 'q': '#2c3558', 'Q': '#41507c', 'e': '#ef7d36'}
    c.rect(0, 0, 63, 63, 'p')
    for x in range(2, 64, 6):
        c.vl(x, 0, 63, 'P')

    def window(l):
        l.rect(-1, 2, 14, 24, 'o'); l.rect(0, 4, 12, 22, 'q')
        l.ell(6, 6, 10, 10, 'y')
        for x0, x1, top in ((0, 2, 16), (3, 6, 13), (7, 9, 18), (10, 12, 15)):
            l.rect(x0, top, x1, 22, 'Q')
        l.pts('y', [(1, 18), (4, 15), (5, 19), (8, 20), (11, 17)])
    c.paste(obj(window))

    def safe(l):
        l.rect(49, 10, 64, 12, 'g')
        l.rect(49, 13, 64, 63, 'G'); l.rect(50, 14, 64, 63, 'g')
        l.rect(52, 16, 64, 63, 'G'); l.rect(53, 17, 64, 63, 'g')
        l.ell(54, 22, 62, 30, 'G'); l.ell(55, 23, 61, 29, 'b'); l.vl(58, 23, 25, 'k')
    c.paste(obj(safe))

    def boss(l):
        x0, y0, hw, hh = 22, 15, 20, 18
        tw = 32
        cx = x0 + hw // 2
        tx0 = cx - tw // 2
        ty = y0 + hh - 1
        body(l, tx0, ty, tw, 40, 0, 'a', '1', '2', arms=(None, None))
        l.rect(tx0 + tw - 3, ty + 1, tx0 + tw - 1, 63, '2')
        l.poly([(cx - 6, ty), (cx + 6, ty), (cx, ty + 12)], 'w')
        l.rect(cx - 1, ty + 1, cx, ty + 12, 'h'); l.rect(cx - 2, ty + 1, cx + 1, ty + 2, 'H')
        l.line(cx - 7, ty, cx - 1, ty + 14, '2'); l.line(cx - 8, ty + 1, cx - 2, ty + 15, '2')
        l.line(cx + 6, ty, cx, ty + 14, '2'); l.line(cx + 7, ty + 1, cx + 1, ty + 15, '2')
        l.rect(cx + 8, ty + 6, cx + 11, ty + 7, 'w'); l.px(cx + 9, ty + 5, 'w')     # pocket square
        head(l, x0, y0, hw, hh, 'a', 'A', eyes='glint', mouth='smirk', brows='stern', nose=True)
        l.rect(x0 + 1, y0 - 8, x0 + hw - 2, y0 + 1, 'h'); l.hl(x0 + 2, x0 + hw - 3, y0 - 9, 'h')
        l.rect(x0 + 6, y0 - 9, x0 + hw - 7, y0 - 8, 'H')
        l.rect(x0 + 1, y0 - 2, x0 + hw - 2, y0 + 1, '1')
        l.hl(x0 - 4, x0 + hw + 3, y0 + 2, 'h'); l.hl(x0 - 3, x0 + hw + 2, y0 + 3, 'h')
        l.hl(x0, x0 + hw - 1, y0 + 4, 'A')
        my = y0 + hh // 2 + 3 + 2
        l.rect(cx + 4, my, cx + 11, my + 1, 'O'); l.rect(cx + 12, my, cx + 12, my + 1, 'e')
    c.paste(obj(boss))

    def desk(l):
        l.poly([(0, 51), (63, 51), (63, 58), (0, 58)], 'd')
        l.hl(0, 63, 58, 'o'); l.rect(0, 59, 63, 63, 'o')
        l.hl(20, 24, 61, 'b'); l.hl(40, 44, 61, 'b')
    c.paste(obj(desk))

    def hands(l):
        l.rect(15, 46, 21, 52, '1'); l.rect(16, 52, 21, 55, 'a'); l.hl(16, 21, 55, 'A')
        l.rect(42, 46, 48, 52, '2'); l.rect(42, 52, 47, 55, 'a'); l.hl(42, 47, 55, 'A')
    c.paste(obj(hands))

    def lamp(l):
        l.rect(1, 52, 10, 54, 'b'); l.rect(5, 41, 6, 51, 'b')
        l.poly([(-2, 41), (1, 34), (10, 34), (13, 41)], 'l')
        l.poly([(6, 34), (10, 34), (13, 41), (7, 41)], 'L', only='l')
        l.hl(-1, 12, 41, 'y')
    c.paste(obj(lamp))

    def cash(l):
        cash_brick(l, 50, 44, 9, 8)
        cash_brick(l, 56, 49, 8, 5)
        cash_brick(l, 24, 52, 8, 3)
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
    c.ell(26, 2, 32, 8, 'w'); c.ell(28, 1, 34, 7, 's', only='w')
    c.pts('w', [(14, 3), (50, 4), (20, 9)])
    c.poly([(-1, 20), (8, 11), (17, 20)], 'H'); c.rect(0, 20, 15, 63, 'h')
    c.poly([(47, 22), (56, 13), (65, 22)], 'H'); c.rect(49, 22, 63, 63, 'h')
    for (x, y) in ((6, 15), (54, 17)):
        c.rect(x, y, x + 3, y + 3, 'y'); c.hl(x, x + 3, y + 2, 'e')

    def back(l, x0, skin, shade, hair, hs, top, top2, arms):
        hw, hh, y0 = 13, 13, 14
        h = body(l, x0 + 1, y0 + hh - 1, hw - 2, 30, 0, skin, top, top2, arms=arms, aw=3, hx0=x0, hx1=x0 + hw - 1)
        head(l, x0, y0, hw, hh, skin, shade, hair=hair, hs=hs, mouth='shout', brows='angry')
        return h

    def back_l(l):
        h = back(l, 10, 'a', 'A', 'y', 'side', '2', 'n', (None, 'up'))
        x, y = h['R']; l.rect(x, y, x + 2, y + 2, 'a')
    c.paste(obj(back_l))
    c.paste(obj(lambda l: back(l, 43, 'u', 'U', 'n', 'short', '1', '2', (None, None))))

    def front(l, x0, hw, skin, shade, hair, hs, top, top2, arms, mouth, brows, lit=None):
        hh, y0 = 14, 30
        h = body(l, x0 + 1, y0 + hh - 1, hw - 2, 30, 0, skin, top, top2, arms=arms, aw=3, hx0=x0, hx1=x0 + hw - 1)
        head(l, x0, y0, hw, hh, skin, shade, hair=hair, hs=hs, mouth=mouth, brows=brows, lit=lit)
        return h

    def front_l(l):
        h = front(l, 6, 15, 'd', 'D', 'n', 'long', 'g', 'c', ('up', None), 'shout', 'angry')
        x, y = h['L']
        pitchfork(l, x + 1, y - 20, 63, pole=1)
        l.rect(x, y, x + 2, y + 2, 'd')
    c.paste(obj(front_l))

    def front_r(l):
        h = front(l, 43, 15, 'v', 'V', 'n', 'crop', '2', 'n', (None, 'up'), 'flat', None, lit='U')
        x, y = h['R']
        pitchfork(l, x + 1, y - 20, 63, pole=1)
        l.rect(x, y, x + 2, y + 2, 'v')
    c.paste(obj(front_r))

    def lead(l):
        x0, y0, hw, hh = 24, 28, 16, 16
        ty = y0 + hh - 1
        h = body(l, x0 + 1, ty, hw - 2, 30, 0, 'b', '1', '2', arms=('mid', None), aw=3, hx0=x0, hx1=x0 + hw - 1)
        l.rect(x0 + hw - 1, ty + 1, x0 + hw + 1, ty + 4, '2')
        l.rect(x0 + hw, ty - 8, x0 + hw + 2, ty + 1, '2')
        torch(l, x0 + hw + 1, 0, ty - 9, pole=1, size=2)
        l.rect(x0 + hw, ty - 12, x0 + hw + 2, ty - 9, 'b')
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
           'x': '#26262b', 'v': VDEEP[0], 'V': VDEEP[1], 'L': '#7a4c34',
           'y': '#f0c548', 'Y': '#c08f22', 'f': '#f0d24a', 'F': '#d9a52e'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 2, 'B')
    c.rect(0, 16, 63, 21, 'r'); c.rect(0, 20, 63, 21, 'R')
    for x in (12, 30, 48):
        c.rect(x, 17, x + 9, 18, 'w')
    c.rect(0, 22, 63, 63, 'g')
    for y0, hg in ((27, 4), (39, 5), (53, 6)):
        c.rect(0, y0, 63, y0 + hg, 'G')
    c.hl(0, 63, 24, 'w')
    net = C(N)
    for y in range(6, 24):
        for x in range(0, 17):
            if (x + y) % 3 == 0 or (x - y) % 3 == 0:
                net.px(x, y, 'W')
    c.paste(net)
    c.paste(obj(lambda l: (l.rect(0, 4, 19, 5, 'w'), l.rect(17, 4, 19, 24, 'w'))))

    def flag(l):
        l.vl(58, 4, 28, 'w')
        l.poly([(59, 4), (59, 12), (66, 8)], 'f')
        l.poly([(59, 8), (59, 12), (66, 8)], 'F', only='f')
    c.paste(obj(flag))

    def ref(l):
        x0, y0, hw, hh = 13, 20, 20, 19
        tw = 22
        cx = x0 + hw // 2
        tx0 = cx - tw // 2
        ty = y0 + hh - 1
        body(l, tx0, ty, tw, 40, 0, 'v', 'w', 'W', arms=(None, None))
        for x in range(tx0 + 1, tx0 + tw, 3):
            l.recolor('wW', 'x', (x, ty, x + 1, 63))
        l.poly([(cx - 4, ty), (cx + 4, ty), (cx, ty + 4)], 'x')                 # collar
        l.rect(cx - 3, ty, cx + 2, ty, 'V')
        ex = tx0 + tw
        l.rect(ex, ty + 2, ex + 5, ty + 6, 'w'); l.vl(ex + 1, ty + 2, ty + 6, 'x'); l.vl(ex + 4, ty + 2, ty + 6, 'x')
        l.rect(ex + 5, ty - 9, ex + 8, ty + 6, 'v'); l.vl(ex + 8, ty - 9, ty + 6, 'V')
        l.rect(ex + 4, ty - 15, ex + 10, ty - 10, 'v'); l.vl(ex + 10, ty - 15, ty - 10, 'V')
        l.hl(ex + 5, ex + 8, ty - 12, 'V')                                       # knuckle row
        l.rect(ex + 8, ty - 18, ex + 9, ty - 16, 'v')                            # thumb
        # left arm down the side, sleeve striped
        l.rect(tx0 - 4, ty + 2, tx0 - 1, 63, 'w'); l.vl(tx0 - 3, ty + 2, 63, 'x')
        head(l, x0, y0, hw, hh, 'v', 'V', hair='x', hs='crop', mouth='grin', lit='L', nose=False)
    c.paste(obj(ref))

    def coin(l):
        l.ell(41, 5, 48, 12, 'Y'); l.ell(41, 5, 47, 11, 'y', only='Y')
        l.vl(44, 7, 10, 'Y')
    c.paste(obj(coin))
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfc8bb',
           't': '#b9d3cf', 'T': '#a6c4bf',
           'g': '#8e9597', 'G': '#6b7274', 'q': '#33424d', 'Q': '#4a6170',
           'n': '#8fb877', 'N': '#5d8a50',
           'u': '#7fb0d8', 'U': '#5a8cb8',
           'o': '#c9a066', 'O': '#9e7840',
           '1': '#a9aeac', '2': '#7d8381',
           'a': LIGHT[0], 'A': LIGHT[1], 'e': DEEP[0], 'E': DEEP[1],
           'h': '#1f1714', 'r': '#b0552c'}
    c.rect(0, 0, 63, 63, 't')
    for y in range(6, 64, 8):
        c.hl(0, 63, y, 'T')
    for x in range(7, 64, 8):
        c.vl(x, 0, 63, 'T')
    c.hl(18, 63, 2, 'G')

    def shirt(l, x0, y0):
        l.rect(x0 + 2, y0, x0 + 8, y0 + 8, 'u'); l.rect(x0, y0, x0 + 1, y0 + 3, 'u'); l.rect(x0 + 9, y0, x0 + 10, y0 + 3, 'u')
        l.vl(x0 + 8, y0 + 1, y0 + 8, 'U'); l.hl(x0 + 4, x0 + 6, y0, 'U')
    c.paste(obj(lambda l: shirt(l, 20, 3)))
    c.paste(obj(lambda l: bill(l, 34, 3, 8, 5)))
    c.paste(obj(lambda l: bill(l, 54, 3, 8, 5)))
    for x in (22, 28, 36, 56):
        c.paste(obj(lambda l, x=x: l.rect(x, 1, x, 4, 'O')))

    def washer(l):
        l.rect(-1, 12, 18, 14, 'W')
        l.rect(-1, 15, 18, 63, 'w'); l.vl(18, 15, 63, 'W')
        l.hl(-1, 18, 20, 'W')
        l.rect(1, 16, 6, 18, 'g'); l.ell(13, 16, 15, 18, 'G')
        l.ell(-3, 25, 17, 47, 'g')
        l.ell(-1, 27, 15, 45, 'q')
        l.ell(8, 29, 15, 44, 'Q', only='q')
        bill(l, 1, 38, 7, 4)
    c.paste(obj(washer))

    def person_a(l):
        x0, y0, hw, hh = 23, 19, 17, 17
        tx0 = x0 + 1
        ty = y0 + hh - 1
        body(l, tx0, ty, hw - 2, 40, 0, 'e', '1', '2', arms=(None, 'down'), aw=4)
        l.rect(tx0 - 8, ty + 2, tx0 - 1, ty + 6, '1'); l.hl(tx0 - 8, tx0 - 1, ty + 6, '2')
        head(l, x0, y0, hw, hh, 'e', 'E', hair='h', hs='puff', mouth='smile', lit='O')
    c.paste(obj(person_a))
    c.paste(obj(lambda l: (bill(l, 6, 34, 9, 6), l.rect(12, 36, 15, 40, 'e'), l.hl(12, 15, 37, 'E'))))

    def person_b(l):
        x0, y0, hw, hh = 45, 18, 17, 17
        tx0 = x0 + 1
        ty = y0 + hh - 1
        body(l, tx0, ty, hw - 2, 40, 0, 'a', 'u', 'U', arms=('front', 'front'), aw=4)
        head(l, x0, y0, hw, hh, 'a', 'A', hair='r', hs='bun', mouth='smile')
    c.paste(obj(person_b))

    def basket(l):
        heap = C(N); heap.ell(40, 43, 66, 54, '#')
        for y in range(43, 50):
            for x in range(40, 64):
                if heap.get(x, y) != '#':
                    continue
                bx = (x - 40 + (3 if ((y - 43) // 2) % 2 else 0)) % 5
                l.px(x, y, 'N' if (y - 43) % 2 == 1 or bx == 4 else 'n')
        l.poly([(39, 49), (65, 49), (64, 64), (41, 64)], 'o')
        for y in (53, 57, 61):
            l.hl(40, 63, y, 'O')
        l.rect(39, 49, 63, 50, 'O')
        l.rect(45, 47, 48, 51, 'a'); l.rect(58, 47, 61, 51, 'a')
    c.paste(obj(basket))
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
