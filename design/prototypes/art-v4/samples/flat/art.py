"""Style 1, flat cutout: 32x32, flat fills, one shadow per material, one ink outline around every figure."""
from lib import C

STYLE = {
    'title': '1  Flat cutout  (32x32: flat fills, one ink outline, one shadow per material)',
    'short': '1 Flat cutout',
    'sub': '32x32, ink outline',
}

INK = '#2a1e26'
W = '#f4ede1'
RED, RED2 = '#d9534a', '#a83a35'
MAG, MAG2 = '#c2457f', '#8f2f5d'
GREY, GREY2 = '#a9aeac', '#7d8381'

# skins: (fill, shadow)
PALE = ('#f3d5c0', '#d9ab92')
LIGHT = ('#ebbd94', '#cc946d')
OLIVE = ('#d1a072', '#ad7c52')
MED = ('#a4683f', '#83502f')
DEEP = ('#6e4128', '#55301d')
VDEEP = ('#4a2a1b', '#371e13')


def layer(fn):
    c = C(32)
    fn(c)
    c.outline('k')
    return c


def kingpin():
    c = C(32)

    def body(l):
        l.poly([(3, 32), (5, 23), (9, 21), (23, 21), (27, 23), (29, 32)], '1')
        l.poly([(22, 21), (27, 23), (29, 32), (23, 32)], '2', only='1')
        l.poly([(12, 21), (20, 21), (16, 29)], 'g')          # dark shirt
        l.vl(16, 22, 27, 'w'); l.vl(15, 22, 26, 'w')        # white tie
        l.hl(24, 25, 25, 'w')                               # pocket square
        l.rect(13, 18, 18, 21, 'A')                         # neck in shadow
    c.paste(layer(body))

    def head(l):
        l.rect(11, 10, 20, 18, 'a'); l.hl(12, 19, 19, 'a')
        l.rect(10, 13, 10, 15, 'a')                         # ear
        l.rect(11, 10, 20, 11, 'A')                         # brim shadow
        l.hl(13, 14, 13, 'k'); l.hl(17, 18, 13, 'k')        # narrow eyes
        l.hl(14, 16, 17, 'k'); l.px(17, 16, 'k')            # smirk
        l.rect(18, 16, 23, 17, 'c'); l.rect(24, 16, 24, 17, 'e')   # cigar + ember
        # fedora
        l.hl(11, 14, 3, 'g'); l.hl(17, 20, 3, 'g')
        l.rect(10, 4, 21, 8, 'g'); l.hl(15, 16, 4, 'G')
        l.rect(10, 7, 21, 7, '1')                           # band
        l.rect(19, 4, 21, 6, 'G'); l.px(21, 8, 'G')
        l.hl(6, 25, 9, 'g'); l.hl(22, 25, 9, 'G')
    c.paste(layer(head))
    # smoke, no outline
    c.pts('m', [(26, 14), (27, 13), (27, 12), (26, 11), (26, 10), (27, 9)])
    return c.rows(), {'k': INK, 'w': W, '1': MAG, '2': MAG2, 'a': OLIVE[0], 'A': OLIVE[1],
                      'g': '#3e3542', 'G': '#2f2733', 'c': '#7a4a2c', 'e': '#e8703a', 'm': '#b3a8b0'}


def _small_head(l, x0, y0, w, h, skin, shade, hair, eyes='dot', mouth=True, hairstyle='cap'):
    x1, y1 = x0 + w - 1, y0 + h - 1
    l.rect(x0, y0 + 1, x1, y1 - 1, skin); l.hl(x0 + 1, x1 - 1, y0, skin); l.hl(x0 + 1, x1 - 1, y1, skin)
    l.hl(x0 + 1, x1 - 1, y1, shade)
    if hairstyle == 'cap':
        l.hl(x0, x1, y0 + 1, hair); l.hl(x0 + 1, x1 - 1, y0, hair); l.hl(x0 + 1, x1 - 1, y0 - 1, hair)
    elif hairstyle == 'afro':
        l.ell(x0 - 1, y0 - 3, x1 + 1, y0 + 3, hair)
    elif hairstyle == 'long':
        l.hl(x0 + 1, x1 - 1, y0 - 1, hair); l.rect(x0, y0, x1, y0 + 1, hair)
        l.vl(x0 - 1, y0 + 1, y1, hair); l.vl(x1 + 1, y0 + 1, y1, hair); l.vl(x0, y0 + 2, y1 - 1, hair)
    ey = y0 + h // 2
    cx = x0 + w // 2
    if eyes == 'dot':
        l.px(cx - 2, ey, 'k'); l.px(cx + 1 + (w % 2 == 1), ey, 'k')
    if mouth:
        l.hl(cx - 1, cx + (w % 2 == 1), ey + 2, 'k')


def mob():
    c = C(32)
    pal = {'k': INK, 'w': W, '1': RED, '2': RED2}
    tones = {'a': OLIVE, 'b': PALE, 'c': MED, 'd': LIGHT, 'e': DEEP}
    for key, (f, s) in tones.items():
        pal[key] = f; pal[key.upper()] = s
    pal.update({'h': '#1f1714', 'y': '#e2b84d', 'r': '#8a4b2a', 'n': '#4a2f22'})

    def face(l, x0, y0, w, h, skin, open_mouth=True):
        l.rect(x0, y0 + 1, x0 + w - 1, y0 + h - 2, skin); l.hl(x0 + 1, x0 + w - 2, y0, skin); l.hl(x0 + 1, x0 + w - 2, y0 + h - 1, skin)
        ey = y0 + h // 2 - 1
        l.px(x0 + 2, ey, 'k'); l.px(x0 + w - 3, ey, 'k')
        # open smile: a wide top row, narrower under it (a D on its side, never an O)
        l.hl(x0 + 2, x0 + w - 3, ey + 2, 'k')
        if open_mouth and h >= 7:
            l.hl(x0 + 3, x0 + w - 4, ey + 3, 'k')

    # back-left: olive skin, black hair
    def bl(l):
        l.rect(4, 11, 13, 20, '2')
        face(l, 5, 4, 7, 8, 'a')
        l.hl(5, 11, 4, 'h'); l.hl(6, 10, 3, 'h'); l.px(5, 5, 'h'); l.px(11, 5, 'h')
    c.paste(layer(bl))

    # back-right: pale, blond bunches
    def br(l):
        l.rect(17, 11, 26, 20, '2')
        face(l, 18, 4, 7, 8, 'b')
        l.hl(18, 24, 4, 'y'); l.hl(19, 23, 3, 'y'); l.rect(17, 5, 17, 7, 'y'); l.rect(25, 5, 25, 7, 'y')
        l.rect(16, 7, 16, 8, 'y'); l.rect(26, 7, 26, 8, 'y')
    c.paste(layer(br))

    # front-left: medium skin, long dark hair
    def fl(l):
        l.poly([(-1, 32), (0, 23), (2, 21), (8, 21), (10, 23), (11, 32)], '1')
        face(l, 1, 13, 8, 8, 'c')
        l.hl(1, 8, 13, 'h'); l.hl(2, 7, 12, 'h'); l.vl(0, 14, 21, 'h'); l.vl(9, 14, 20, 'h'); l.px(1, 14, 'h'); l.px(8, 14, 'h')
    c.paste(layer(fl))

    # front-right: very deep, bobble hat, holds the pennant up
    def fr(l):
        l.poly([(21, 32), (22, 23), (24, 21), (29, 21), (31, 23), (32, 32)], '1')
        l.rect(29, 8, 30, 21, '1')                          # raised arm
        l.rect(29, 6, 30, 7, 'e')                           # hand
        l.vl(31, 0, 9, 'n')                                 # pole
        l.poly([(24, 0), (31, 0), (31, 7)], '1')            # pennant
        face(l, 22, 13, 7, 8, 'e')
        l.rect(22, 11, 28, 13, '1'); l.hl(22, 28, 13, 'w'); l.hl(23, 27, 10, '1'); l.rect(24, 8, 25, 9, 'w')
    c.paste(layer(fr))

    # centre: light skin, brown hair, scarf; biggest and a step forward
    def ce(l):
        l.poly([(9, 32), (10, 24), (12, 22), (19, 22), (21, 24), (22, 32)], '1')
        l.rect(11, 11, 19, 20, 'd'); l.hl(12, 18, 21, 'd'); l.hl(12, 18, 10, 'd')
        l.hl(12, 18, 21, 'D')
        l.rect(11, 10, 19, 11, 'r'); l.hl(12, 18, 9, 'r'); l.px(11, 12, 'r'); l.px(19, 12, 'r'); l.px(16, 12, 'r')
        l.pts('k', [(12, 15), (13, 14), (14, 15), (16, 15), (17, 14), (18, 15)])
        l.hl(14, 16, 17, 'k'); l.px(15, 18, 'k')
        for x in range(11, 20):
            l.rect(x, 22, x, 23, 'w' if (x // 2) % 2 else '2')
    c.paste(layer(ce))
    return c.rows(), pal


def tiebreaker():
    c = C(32)
    sk, sh = VDEEP

    def body(l):
        l.poly([(3, 32), (5, 24), (9, 22), (22, 22), (26, 24), (28, 32)], '1')
        for x in range(0, 32):
            if (x // 2) % 2 == 0:
                l.recolor('1', '2', (x, 0, x, 31))
        l.rect(13, 18, 17, 22, 'S')
        l.poly([(11, 22), (19, 22), (15, 26)], 'g')       # black collar
        l.rect(23, 16, 26, 25, '1'); l.vl(23, 16, 25, '2'); l.vl(25, 16, 25, '2')   # raised forearm
        l.stamp(22, 10, [
            '..ss..',
            '..ss..',
            '.sssss',
            '.sSSSs',
            '.sssss',
            '..sss.',
        ])
    c.paste(layer(body))

    def head(l):
        l.ell(10, 7, 20, 19, 's')
        l.rect(9, 12, 9, 14, 's'); l.rect(21, 12, 21, 14, 's')
        l.ell(18, 9, 22, 18, 'S', only='s')
        l.px(12, 12, 'k'); l.px(16, 12, 'k')                # same 1px eyes as everyone
        l.pts('L', [(12, 10), (16, 10), (11, 13), (17, 13)])  # warm highlights: brow, cheekbones
        l.pts('k', [(12, 16), (13, 17), (14, 17), (15, 17), (16, 16)])
    c.paste(layer(head))

    def coin(l):
        l.ell(21, 2, 26, 6, 'c'); l.ell(21, 2, 25, 6, 'y', only='c')
        l.vl(23, 3, 5, 'c')
    c.paste(layer(coin))
    c.pts('m', [(27, 1), (28, 2), (28, 3), (19, 4), (19, 5)])
    return c.rows(), {'k': INK, 'w': W, '1': '#e6e4dd', '2': '#3d4045', 'g': '#24222a', 's': sk, 'S': sh,
                      'c': '#b88220', 'y': '#efc04a', 'm': '#8a7f86', 'L': '#93593a'}


def launderers():
    c = C(32)

    def line(l):
        l.line(0, 2, 15, 3, 'k'); l.line(16, 3, 31, 2, 'k')
    line(c)

    def note(l):
        l.rect(10, 4, 21, 10, 'n'); l.ell(14, 5, 17, 9, 'N'); l.rect(15, 6, 16, 8, 'D')
        l.px(11, 5, 'N'); l.px(20, 9, 'N')
    c.paste(layer(note))

    def peg(l):
        l.rect(15, 1, 16, 6, 'p'); l.hl(15, 16, 3, 'P')
    c.paste(layer(peg))

    def left(l):
        l.poly([(-1, 32), (0, 24), (4, 22), (11, 22), (14, 25), (14, 32)], '1')
        l.rect(4, 19, 8, 22, 'A')
        l.rect(2, 12, 10, 19, 'a'); l.hl(3, 9, 20, 'a'); l.hl(3, 9, 11, 'a')
        l.hl(3, 9, 20, 'A')
        l.rect(2, 10, 10, 13, 'h'); l.hl(3, 9, 9, 'h'); l.px(2, 14, 'h')
        l.ell(4, 5, 8, 9, 'h')                                    # bun
        l.px(5, 15, 'k'); l.px(8, 15, 'k'); l.hl(6, 7, 17, 'k')
    c.paste(layer(left))

    def right(l):
        l.poly([(18, 32), (18, 25), (21, 23), (28, 23), (31, 25), (32, 32)], '2')
        l.rect(23, 20, 27, 23, 'B')
        l.rect(21, 13, 29, 20, 'b'); l.hl(22, 28, 21, 'b'); l.hl(22, 28, 12, 'b')
        l.hl(22, 28, 21, 'B')
        l.rect(21, 11, 29, 13, 'g'); l.hl(22, 28, 10, 'g'); l.px(29, 14, 'g'); l.px(21, 14, 'g')
        l.pts('g', [(23, 9), (26, 9)])
        l.px(23, 16, 'k'); l.px(26, 16, 'k'); l.hl(24, 25, 18, 'k')
    c.paste(layer(right))

    for box in [(13, 20, 17, 24), (14, 15, 16, 17), (17, 26, 19, 28), (26, 4, 29, 7)]:
        b = C(32); b.ell(*box, 'u'); b.px(box[0] + 1, box[1] + 1, 'f'); b.outline('k'); c.paste(b)
    return c.rows(), {'k': INK, 'w': W, '1': GREY, '2': '#8a908f', 'a': MED[0], 'A': MED[1],
                      'b': PALE[0], 'B': PALE[1], 'h': '#1f1714', 'g': '#c0612e', 'n': '#8fb877', 'N': '#5d8a50', 'D': '#36572f',
                      'p': '#caa064', 'P': '#9b7440', 't': '#c4ccd0', 'T': '#98a2a8', 'f': '#f7f6f0', 'u': '#d6ebef'}


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
