"""Option D, prop first: 48x48. The role's object is the hero, big and centred; the person is drawn simply around it.
Flat colour, no outline: shapes are separated by value. Two tones per material."""
from lib import C

STYLE = {
    'title': 'D  Prop first  (48x48: the object is the hero, flat colour, no outline)',
    'short': 'D Prop first',
    'sub': '48x48, prop is the hero',
}

EYE = '#1d1418'
W = '#f6f1e6'
RED, RED2 = '#d6463e', '#a3302c'
MAG, MAG2 = '#c2457f', '#8c2c5b'
GREY, GREY2 = '#9ea4a6', '#747b7e'

PALE = ('#f3d3bd', '#d8a98f')
LIGHT = ('#e9b88e', '#c98f68')
OLIVE = ('#cf9c6c', '#a9784d')
MED = ('#a1653c', '#7f4c2c')
DEEP = ('#6c3f27', '#52301d')
VDEEP = ('#4a2a1b', '#331c11')

GOLD, GOLD2, GOLD3 = '#f0c24c', '#c58f22', '#fbe08a'


def kingpin():
    c = C(48)
    # suit shoulders
    c.poly([(2, 48), (4, 39), (10, 35), (38, 35), (44, 39), (46, 48)], '1')
    c.poly([(34, 35), (38, 35), (44, 39), (46, 48), (37, 48)], '2')
    # shirt V and tie
    c.poly([(18, 35), (30, 35), (24, 46)], 'w')
    c.poly([(22, 36), (26, 36), (25, 46), (23, 46)], 'g')
    # lapels (darker magenta)
    c.poly([(16, 35), (19, 35), (24, 47), (21, 48)], '2')
    c.poly([(29, 35), (32, 35), (27, 48), (24, 47)], '2')
    # neck in shadow
    c.rect(20, 31, 28, 35, 'A')
    # face: lower half lit, upper half under the brim in shadow; jowl shade on the right
    c.ell(16, 16, 32, 34, 'a')
    c.rect(15, 21, 15, 25, 'a'); c.rect(33, 21, 33, 25, 'a')        # ears
    c.ell(28, 16, 34, 34, 'A', only='a')
    for y in range(16, 25):
        for x in range(14, 35):
            if c.get(x, y) == 'a':
                c.px(x, y, 'A')
    # eyes: two hard slits in the shadow
    c.hl(19, 21, 22, 'k'); c.hl(26, 28, 22, 'k')
    # mouth: flat line, cigar out to the right
    c.hl(21, 25, 29, 'k')
    c.rect(25, 28, 37, 30, 'c'); c.hl(25, 37, 30, 'C')
    c.rect(38, 28, 39, 30, 'e'); c.px(39, 28, 'E')
    # smoke, straight puffs going up
    c.pts('m', [(41, 25), (42, 24), (42, 23), (41, 22), (41, 21), (42, 20), (43, 19)])
    # fedora: huge
    c.ell(13, 2, 35, 14, 'h')
    c.rect(13, 8, 35, 15, 'h')
    c.rect(21, 2, 27, 4, 'H')            # pinch crease
    c.rect(13, 11, 35, 13, 'b')          # band
    for y in range(2, 16):
        for x in range(30, 36):
            if c.get(x, y) == 'h':
                c.px(x, y, 'H')
            elif c.get(x, y) == 'b':
                c.px(x, y, 'B')
    # brim: wide, flat
    c.ell(2, 13, 46, 19, 'H')
    c.hl(5, 43, 14, 'h'); c.hl(8, 40, 13, 'h')
    # a stack of cash at lower left, his hand resting flat on top, ring on one finger
    c.rect(3, 41, 15, 47, 'n')
    for y in (42, 44, 46):
        c.hl(3, 15, y, 'N')
    c.rect(8, 41, 10, 47, 'x')                               # paper band
    c.stamp(4, 37, [
        '...a.a.a.aaa',
        '..aaaaaaaaaa',
        'aaaaaaaaaaaa',
        'AAyAAAAAAAAA',
    ])
    c.px(6, 39, 'y'); c.px(6, 38, 'Z')
    c.rect(16, 38, 17, 40, 'w')                               # cuff
    return c.rows(), {'k': EYE, 'w': W, '1': MAG, '2': MAG2, 'a': OLIVE[0], 'A': OLIVE[1],
                      'h': '#3b3140', 'H': '#2a2230', 'b': MAG, 'B': MAG2,
                      'c': '#7c4b2b', 'C': '#5c3520', 'e': '#ee7a3c', 'E': '#ffd27a', 'm': '#bcb0b8',
                      'g': '#2a2230', 'y': GOLD, 'Y': GOLD2, 'Z': GOLD3, 'x': '#e8e2d2', 'n': '#7fb35d', 'N': '#4f8a3e'}


def _face(c, x0, y0, w, h, skin, shade, hair, style='cap', mouth='open'):
    x1, y1 = x0 + w - 1, y0 + h - 1
    c.rect(x0, y0 + 1, x1, y1 - 1, skin); c.hl(x0 + 1, x1 - 1, y0, skin); c.hl(x0 + 1, x1 - 1, y1, skin)
    c.hl(x0 + 1, x1 - 1, y1, shade)
    if style == 'cap':
        c.hl(x0, x1, y0, hair); c.hl(x0 + 1, x1 - 1, y0 - 1, hair)
    elif style == 'afro':
        c.ell(x0 - 1, y0 - 3, x1 + 1, y0 + 2, hair)
    elif style == 'long':
        c.hl(x0 + 1, x1 - 1, y0 - 1, hair); c.hl(x0, x1, y0, hair)
        c.vl(x0 - 1, y0, y1, hair); c.vl(x1 + 1, y0, y1, hair)
    elif style == 'bun':
        c.hl(x0, x1, y0, hair); c.hl(x0 + 1, x1 - 1, y0 - 1, hair)
        c.rect(x0 + w // 2 - 1, y0 - 3, x0 + w // 2 + 1, y0 - 2, hair)
    ey = y0 + h // 2 - 1
    c.px(x0 + 2, ey, 'k'); c.px(x1 - 2, ey, 'k')
    c.hl(x0 + 2, x1 - 2, ey + 2, 'k')
    if mouth == 'open':
        c.hl(x0 + 3, x1 - 3, ey + 3, 'k')


def _head(c, x0, y0, w, h, skin, shade):
    x1, y1 = x0 + w - 1, y0 + h - 1
    c.rect(x0, y0 + 1, x1, y1 - 1, skin); c.hl(x0 + 1, x1 - 1, y0, skin); c.hl(x0 + 1, x1 - 1, y1, shade)


def mob():
    c = C(48)
    pal = {'k': EYE, 'w': W, '1': RED, '2': RED2, 'p': '#7b4a2a',
           'h': '#231914', 'y': '#e4bb4f', 'r': '#8a4b2a', 'q': '#5a1c1e', 't': '#e0787a', 'z': '#e79a8a'}
    tones = {'a': OLIVE, 'b': PALE, 'c': MED, 'd': LIGHT, 'e': DEEP}
    for key, (f, s) in tones.items():
        pal[key] = f; pal[key.upper()] = s
    # pennant: huge, flying right from a pole the left fan holds up; one plain white stripe
    c.vl(4, 0, 24, 'p')
    c.poly([(5, 0), (47, 9), (5, 18)], '1')
    c.poly([(5, 14), (47, 9), (5, 18)], '2')
    c.poly([(5, 0), (8, 1), (8, 17), (5, 18)], 'w')      # white hoist band
    c.poly([(11, 7), (36, 9), (11, 11)], 'w')            # white stripe
    # back row bodies
    c.rect(12, 30, 21, 40, '2'); c.rect(27, 30, 36, 40, '2')
    # back-left: deep skin, afro, dot eyes, small open smile
    c.ell(12, 18, 21, 25, 'h')
    _head(c, 13, 22, 8, 8, 'e', 'E')
    c.px(15, 24, 'k'); c.px(18, 24, 'k')
    c.hl(15, 18, 26, 'q'); c.hl(16, 17, 27, 't')
    # back-right: pale, long blond hair, happy shut eyes, closed smile with corners up
    _head(c, 28, 22, 8, 8, 'b', 'B')
    c.hl(29, 34, 21, 'y'); c.hl(28, 35, 22, 'y'); c.vl(27, 22, 30, 'y'); c.vl(36, 22, 30, 'y')
    c.px(30, 24, 'k'); c.px(33, 24, 'k')
    c.pts('q', [(30, 26), (31, 27), (32, 27), (33, 26)])
    c.pts('z', [(29, 26), (34, 26)])
    c.pts('y', [(28, 23), (29, 23)])
    # raised arms of the back pair, open waving hands
    for ax, sk in ((22, 'e'), (38, 'b')):
        c.rect(ax, 20, ax + 1, 28, '2')
        c.stamp(ax - 2, 15, [
            '.s.s.s',
            '.sssss',
            'ssssss',
            '.ssss.',
            '..sss.',
        ], {'s': sk})
    # front row bodies and necks
    for x0, tone in ((2, 'a'), (18, 'd'), (34, 'c')):
        c.poly([(x0 - 2, 48), (x0 - 1, 40), (x0 + 2, 38), (x0 + 10, 38), (x0 + 13, 40), (x0 + 14, 48)], '1')
        c.rect(x0 + 3, 36, x0 + 8, 38, tone.upper())
        _head(c, x0 + 1, 28, 10, 10, tone, tone.upper())
    # front-left: olive, short black hair, dot eyes with brows, wide open smile
    c.hl(3, 12, 28, 'h'); c.hl(4, 11, 27, 'h'); c.px(3, 29, 'h'); c.px(12, 29, 'h')
    c.px(5, 32, 'k'); c.px(10, 32, 'k')
    c.hl(5, 10, 34, 'q'); c.hl(6, 9, 35, 'q'); c.hl(7, 8, 35, 't')
    # centre: light, brown hair with a fringe, shut happy eyes, big open laugh, blush
    c.hl(19, 28, 28, 'r'); c.hl(20, 27, 27, 'r'); c.rect(19, 29, 21, 29, 'r'); c.px(19, 30, 'r')
    c.rect(21, 31, 21, 32, 'k'); c.rect(26, 31, 26, 32, 'k')
    c.hl(21, 26, 34, 'q'); c.px(21, 34, 'd'); c.px(26, 34, 'd'); c.hl(21, 26, 35, 'q'); c.hl(22, 25, 35, 't'); c.hl(22, 25, 36, 'q')
    c.pts('d', [(21, 36), (26, 36)])
    # front-right: medium skin, bun, round eyes, grin with corners up
    c.hl(35, 44, 28, 'h'); c.hl(36, 43, 27, 'h'); c.rect(38, 24, 41, 26, 'h'); c.vl(44, 29, 31, 'h')
    c.rect(37, 31, 37, 32, 'k'); c.rect(42, 31, 42, 32, 'k')
    c.pts('q', [(37, 34), (38, 35), (39, 35), (40, 35), (41, 35), (42, 34)])
    c.hl(39, 40, 36, 't')
    # left fan's arm up to the pole
    c.rect(1, 26, 3, 40, '2'); c.rect(2, 21, 6, 25, 'a'); c.hl(2, 6, 25, 'A'); c.px(6, 21, '.')
    # centre fan's scarf
    for x in range(19, 30):
        c.rect(x, 39, x, 40, 'w' if (x // 2) % 2 else '2')
    return c.rows(), pal


def tiebreaker():
    c = C(48)
    sk, sh = VDEEP
    # ref shirt, stripes
    c.poly([(1, 48), (3, 40), (8, 37), (26, 37), (30, 40), (31, 48)], '1')
    c.rect(32, 27, 39, 48, '1')                                # raised forearm, upright
    for x in range(48):
        if (x // 3) % 2 == 0:
            c.recolor('1', '2', (x, 0, x, 47))
    c.rect(13, 33, 19, 37, 'S')
    c.poly([(9, 37), (23, 37), (16, 45)], 'g')                 # collar
    c.line(13, 37, 15, 40, 'n'); c.line(19, 37, 17, 40, 'n')   # cord
    c.rect(14, 41, 18, 43, 'm'); c.hl(14, 18, 43, 'M'); c.px(18, 41, 'M'); c.px(16, 42, 'M')   # whistle
    # head
    c.ell(6, 17, 26, 36, 's')
    c.rect(5, 25, 5, 29, 's'); c.rect(27, 25, 27, 29, 's')
    c.ell(21, 18, 28, 35, 'S', only='s')
    for y in range(17, 22):
        for x in range(4, 29):
            if c.get(x, y) in 'sS':
                c.px(x, y, 'g')                                  # close-cropped hair
    c.hl(10, 13, 23, 'L'); c.hl(18, 21, 23, 'L')               # brow light
    c.rect(11, 25, 12, 26, 'k'); c.rect(19, 25, 20, 26, 'k')     # eyes
        # whistle in the mouth corner, lanyard to the collar
    c.px(12, 30, 'k'); c.hl(13, 18, 31, 'k'); c.px(19, 30, 'k')     # calm smile
    # fist under the coin, thumb flicking up
    c.stamp(30, 18, [
        '.ss.......',
        '.ss.......',
        '.sss......',
        'sssssssss.',
        'sssSsssSsS',
        'ssssssssss',
        'sssSsssSsS',
        'ssssssssss',
        'SSSSSSSSSS',
    ])
    # coin, big, mid-flip
    c.ell(24, 2, 39, 14, 'Y')
    c.ell(25, 3, 37, 13, 'y', only='Y')
    c.ell(28, 5, 34, 11, 'Y', only='y'); c.ell(29, 6, 33, 10, 'y', only='Y')
    c.ell(26, 4, 29, 6, 'Z', only='y')
    # motion ticks
    c.pts('t', [(21, 5), (20, 6), (42, 10), (43, 11), (21, 11), (42, 4)])
    return c.rows(), {'k': '#120b08', 'w': W, '1': '#ecebe5', '2': '#2f3236', 'g': '#1c1716', 's': sk, 'S': sh,
                      'L': '#6a4029', 'y': GOLD, 'Y': GOLD2, 'Z': GOLD3, 'm': '#d7dcdf', 'M': '#9aa3a8',
                      'n': '#8a8f93', 't': '#a89a86'}


def _bill(c, x, y):
    c.rect(x, y, x + 7, y + 3, 'n')
    c.rect(x + 3, y + 1, x + 4, y + 2, 'N')
    c.hl(x, x + 7, y + 3, 'N')


def launderers():
    c = C(48)
    # people first: their heads tuck behind the machine's sides
    # left: medium skin, bun
    c.poly([(-1, 48), (0, 30), (4, 27), (14, 27), (14, 48)], '1')
    c.rect(3, 13, 14, 24, 'a'); c.hl(4, 13, 25, 'A'); c.hl(4, 13, 12, 'a')
    c.rect(2, 11, 14, 14, 'h'); c.hl(3, 13, 10, 'h'); c.ell(4, 6, 8, 10, 'h'); c.px(2, 15, 'h')
    c.px(5, 18, 'k'); c.px(9, 18, 'k'); c.hl(6, 8, 21, 'k')
    c.rect(5, 25, 9, 27, 'A')
    # right: pale, ginger
    c.poly([(34, 48), (34, 27), (43, 27), (47, 30), (48, 48)], '2')
    c.rect(33, 14, 44, 25, 'b'); c.hl(34, 43, 26, 'B'); c.hl(34, 43, 13, 'b')
    c.rect(33, 12, 45, 15, 'r'); c.hl(34, 44, 11, 'r'); c.px(45, 16, 'r'); c.pts('r', [(38, 10), (41, 10)])
    c.vl(44, 16, 25, 'B'); c.px(38, 19, 'k'); c.px(42, 19, 'k'); c.hl(39, 41, 22, 'k')
    c.rect(38, 26, 42, 27, 'B')
    # machine
    c.rect(12, 3, 35, 40, 'u')
    c.rect(33, 3, 35, 40, 'U'); c.hl(12, 35, 40, 'U')
    c.rect(12, 3, 35, 8, 'v'); c.rect(33, 3, 35, 8, 'V')      # control strip
    c.rect(14, 5, 19, 6, 'V')                                 # soap drawer
    c.ell(27, 4, 30, 7, 'V'); c.px(28, 5, 'u')                 # dial
    # porthole
    c.ell(13, 11, 33, 31, 'V')
    c.ell(15, 13, 31, 29, 'o')
    c.ell(16, 14, 30, 28, 'O', only='o')
    # bills tumbling
    for (x, y) in ((17, 19), (23, 15), (23, 23), (16, 24)):
        _bill(c, x, y)
    c.pts('Q', [(19, 16), (20, 15)])   # glass glint
    # basket of bills in front, held by both at the ends
    c.poly([(7, 37), (41, 37), (39, 48), (9, 48)], 'x')
    for y in (40, 43, 46):
        c.hl(7, 41, y, 'X')
    for x in range(11, 39, 4):
        c.vl(x, 38, 47, 'X')
    c.rect(6, 36, 42, 37, 'X')
    # heap of bills
    for (x, y) in ((10, 33), (31, 33), (15, 31), (26, 31), (20, 30), (8, 35), (33, 35), (17, 34), (24, 34)):
        _bill(c, x, y)
    # rolled sleeves, forearms down to the basket ends
    c.rect(0, 29, 4, 30, 'w'); c.rect(1, 31, 4, 37, 'a'); c.vl(4, 31, 37, 'A')
    c.rect(3, 37, 8, 41, 'a'); c.hl(4, 7, 39, 'A'); c.hl(3, 8, 41, 'A')
    c.rect(43, 29, 47, 30, 'w'); c.rect(43, 31, 46, 37, 'b'); c.vl(46, 31, 37, 'B')
    c.rect(40, 37, 45, 41, 'b'); c.hl(41, 44, 39, 'B'); c.hl(40, 45, 41, 'B')
    return c.rows(), {'k': EYE, 'w': '#cfd3d3', '1': GREY, '2': GREY2, 'a': MED[0], 'A': MED[1],
                      'b': PALE[0], 'B': PALE[1], 'h': '#231914', 'r': '#c0612e',
                      'u': '#cbd5da', 'U': '#a3b1b8', 'v': '#8c9aa2', 'V': '#66747c',
                      'o': '#2f4650', 'O': '#3d5a66', 'Q': '#9cc0cc',
                      'n': '#8fc46a', 'N': '#4f8a3e', 'x': '#c79a5a', 'X': '#9a7038'}


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
