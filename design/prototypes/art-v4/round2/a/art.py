"""Option A: today's portraits, de-AI'd. 48x48 busts like the live set; one ink outline, flat fills, one shadow per material."""
from lib import C

STYLE = {
    'title': "A  Today's portraits, de-AI'd  (48x48: one ink outline, flat fills, one shadow each)",
    'short': "A Today's, de-AI'd",
    'sub': '48x48, live framing',
}

N = 48
INK = '#2a1e26'
W, W2 = '#f2ece0', '#cfc7b8'
RED, RED2 = '#df5f55', '#ad3f3a'
MAG, MAG2 = '#cf4d8e', '#9a3468'
GREY, GREY2 = '#a7aeab', '#7f8784'

# skins: (fill, shadow)
PALE = ('#f4d6c2', '#dcae96')
LIGHT = ('#ebbd94', '#cc946d')
OLIVE = ('#d4a273', '#b07f55')
MED = ('#a96c42', '#86522f')
DEEP = ('#74452a', '#57321e')
VDEEP = ('#563220', '#3f2416')


def layer(fn):
    c = C(N)
    fn(c)
    c.outline('k')
    return c


def put(c, fn):
    c.paste(layer(fn))


def face(l, x0, y0, x1, y1, s, S, shade_w=2):
    """Rounded-rectangle head, one shadow column on the right and a shadow row under the chin."""
    l.rect(x0, y0 + 1, x1, y1 - 2, s)
    l.hl(x0 + 1, x1 - 1, y0, s)
    l.hl(x0 + 1, x1 - 1, y1 - 1, s)
    l.hl(x0 + 2, x1 - 2, y1, s)
    l.rect(x1 - shade_w + 1, y0 + 1, x1, y1 - 2, S)
    l.px(x1 - 1, y1 - 1, S)


def skinpal(pal, key, tone):
    pal[key] = tone[0]; pal[key.upper()] = tone[1]


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': W, '1': MAG, '2': MAG2, 'g': '#3b3440', 'G': '#29232d',
           'h': '#a3a3a6', 'y': '#e2b04a', 'c': '#7a4a2c', 'e': '#ef7a3c', 'm': '#bdb3b6'}
    skinpal(pal, 'a', OLIVE)

    def body(l):
        l.poly([(1, 48), (3, 40), (10, 36), (38, 36), (45, 40), (47, 48)], '1')
        l.poly([(34, 36), (38, 36), (45, 40), (47, 48), (38, 48)], '2', only='1')   # far shoulder in shade
        l.poly([(19, 36), (29, 36), (24, 45)], 'w')                                # shirt
        l.rect(23, 37, 25, 46, 'y'); l.px(24, 47, 'y')                             # gold tie
        l.line(18, 36, 23, 46, '2'); l.line(30, 36, 25, 46, '2')                   # lapels
        l.hl(36, 39, 41, 'w'); l.hl(37, 38, 40, 'w')                                # pocket square
        l.rect(19, 31, 29, 36, 'A')                                                 # neck
    put(c, body)

    def head(l):
        face(l, 13, 12, 35, 33, 'a', 'A', 3)
        l.hl(14, 34, 32, 'a'); l.hl(15, 33, 33, 'A')                                # heavy jaw
        l.rect(12, 20, 12, 25, 'a'); l.rect(36, 20, 36, 25, 'A')                    # ears
        l.rect(14, 13, 34, 14, 'A')                                                 # brim shadow
        l.rect(14, 15, 15, 22, 'h'); l.rect(33, 15, 34, 22, 'h')                    # grey sideburns
        l.hl(18, 22, 18, 'G'); l.hl(26, 30, 18, 'G')                                # heavy brows
        l.hl(19, 21, 20, 'k'); l.hl(27, 29, 20, 'k')                                # narrow eyes
        l.rect(24, 23, 25, 24, 'A')                                                 # nose shade
        l.hl(20, 25, 28, 'k'); l.px(26, 27, 'k')                                    # smirk
    put(c, head)

    def hat(l):
        l.rect(15, 3, 33, 11, 'g'); l.hl(16, 32, 2, 'g')
        l.hl(21, 27, 2, '.'); l.hl(22, 26, 3, 'G')                                  # dented crown
        l.rect(15, 8, 33, 10, '1'); l.rect(30, 8, 33, 10, '2')                      # band
        l.rect(30, 3, 33, 7, 'G')
        l.hl(8, 40, 11, 'g'); l.hl(9, 39, 12, 'g'); l.hl(9, 39, 12, 'G')
    put(c, hat)

    def cigar(l):
        l.rect(26, 27, 34, 28, 'c'); l.rect(35, 27, 35, 28, 'e')
    put(c, cigar)
    c.pts('m', [(37, 24), (38, 23), (38, 22), (37, 21), (37, 20), (38, 19), (38, 18)])
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'k': INK, 'w': W, '1': RED, '2': RED2, 'h': '#231915', 'r': '#8a4a2a',
           'u': '#b8572f', 'n': '#5a3a26', 'y': '#e9c45a'}
    skinpal(pal, 'a', OLIVE); skinpal(pal, 'b', PALE); skinpal(pal, 'c', MED)
    skinpal(pal, 'd', LIGHT); skinpal(pal, 'e', DEEP)

    def eyes_smile(l, cx, ey, gap, wide, open_rows=1):
        l.vl(cx - gap - 1, ey, ey + 1, 'k'); l.vl(cx + gap, ey, ey + 1, 'k')
        my = ey + 4
        l.hl(cx - wide, cx + wide - 1, my, 'k')
        for i in range(1, open_rows + 1):
            l.hl(cx - wide + i, cx + wide - 1 - i, my + i, 'k')

    def bl(l):  # back-left: olive, black hair
        l.rect(7, 19, 19, 30, '2')
        face(l, 8, 8, 18, 19, 'a', 'A')
        l.rect(8, 7, 18, 9, 'h'); l.hl(9, 17, 6, 'h'); l.px(8, 10, 'h'); l.px(18, 10, 'h')
        eyes_smile(l, 13, 12, 2, 2)
    put(c, bl)

    def br(l):  # back-right: pale, auburn hair
        l.rect(28, 18, 41, 30, '2')
        face(l, 29, 7, 39, 18, 'b', 'B')
        l.rect(29, 6, 39, 8, 'u'); l.hl(30, 38, 5, 'u'); l.rect(28, 7, 28, 12, 'u'); l.rect(40, 7, 40, 12, 'u')
        eyes_smile(l, 34, 11, 2, 2)
    put(c, br)

    def pennant(l):
        l.vl(3, 1, 40, 'n')
        l.poly([(4, 1), (19, 4.5), (4, 8)], 'w')
        l.poly([(4, 3), (11, 4.5), (4, 6)], '1')
    put(c, pennant)

    def fl(l):  # front-left: medium skin, long dark hair; hand on the pole
        l.poly([(-1, 48), (0, 38), (3, 35), (14, 35), (17, 38), (18, 48)], '1')
        l.rect(15, 36, 17, 48, '2')
        face(l, 4, 21, 15, 33, 'c', 'C')
        l.rect(4, 20, 15, 22, 'h'); l.hl(5, 14, 19, 'h'); l.vl(3, 21, 33, 'h'); l.vl(16, 21, 31, 'h')
        eyes_smile(l, 10, 25, 2, 2)
    put(c, fl)

    def fr(l):  # front-right: deep skin, red bobble hat
        l.poly([(30, 48), (31, 38), (34, 35), (45, 35), (48, 38), (48, 48)], '1')
        face(l, 34, 21, 45, 33, 'e', 'E')
        l.rect(33, 18, 46, 22, '1'); l.hl(33, 46, 22, 'w'); l.hl(34, 45, 17, '1'); l.hl(36, 43, 16, '1')
        l.rect(38, 13, 41, 15, 'w')
        eyes_smile(l, 40, 26, 2, 2)
    put(c, fr)

    def ce(l):  # centre: light skin, brown hair, scarf; biggest, a step forward
        l.poly([(12, 48), (13, 40), (17, 37), (31, 37), (35, 40), (36, 48)], '1')
        l.rect(32, 38, 36, 48, '2')
        face(l, 15, 17, 32, 35, 'd', 'D')
        l.rect(15, 16, 32, 18, 'r'); l.hl(16, 31, 15, 'r'); l.rect(15, 19, 15, 22, 'r'); l.rect(32, 19, 32, 22, 'r')
        l.rect(21, 19, 23, 19, 'r')                                                 # fringe tuft
        l.vl(19, 23, 25, 'k'); l.vl(20, 23, 25, 'k'); l.vl(27, 23, 25, 'k'); l.vl(28, 23, 25, 'k')
        l.hl(20, 27, 29, 'k'); l.hl(21, 26, 30, 'k'); l.hl(22, 25, 31, 'k')         # big open smile
        for x in range(15, 34):
            l.rect(x, 36, x, 38, 'w' if (x // 3) % 2 else '2')                     # scarf
    put(c, ce)
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'k': INK, 'w': '#ece9e1', 'z': '#2c2c30', 'h': '#9b9b9e', 'H': '#77777b',
           'c': '#b98322', 'y': '#f0c24a', 'm': '#8c8186', 'j': '#120b09', 'l': '#c7c9cc'}
    skinpal(pal, 's', VDEEP)

    def body(l):
        l.poly([(2, 48), (4, 40), (11, 36), (37, 36), (44, 40), (46, 48)], 'w')
        for x in range(0, N):
            if (x // 3) % 2 == 0:
                l.recolor('w', 'z', (x, 36, x, 47))
        l.rect(18, 32, 26, 36, 'S')                                                 # neck
        l.poly([(17, 36), (31, 36), (28, 39), (20, 39)], 'z')                       # black collar
        l.rect(23, 40, 25, 43, 'l'); l.px(24, 44, 'l')                              # whistle
    put(c, body)

    def arm(l):  # raised forearm in a striped sleeve, fist at shoulder height
        l.rect(35, 26, 42, 40, 'w')
        for x in range(35, 43):
            if (x // 3) % 2 == 1:
                l.vl(x, 26, 40, 'z')
        l.stamp(35, 17, [
            '.ss.....',
            '.ss.....',
            '.ss.....',
            '.ssssss.',
            'sSsssssS',
            'sssssssS',
            'sSsssssS',
            'sssssssS',
            '.ssssss.',
        ])                                                                          # fist, thumb up under the coin
    put(c, arm)

    def head(l):
        face(l, 14, 14, 30, 34, 's', 'S', 3)
        l.rect(13, 21, 13, 26, 's'); l.rect(31, 21, 31, 26, 'S')                    # ears
        l.rect(14, 13, 30, 15, 'h'); l.hl(16, 28, 12, 'h'); l.rect(14, 16, 15, 18, 'h'); l.rect(29, 16, 30, 18, 'H'); l.rect(27, 13, 30, 15, 'H')   # short grey hair
        l.rect(18, 22, 19, 23, 'j'); l.rect(24, 22, 25, 23, 'j')                    # dark eyes, no whites
        l.hl(17, 20, 20, 'h'); l.hl(23, 26, 20, 'h')                                # grey brows
        l.rect(21, 25, 22, 26, 'S')                                                 # nose
        l.hl(18, 25, 30, 'j'); l.px(17, 29, 'j'); l.px(26, 29, 'j')                 # smile
    put(c, head)

    def coin(l):
        l.ell(35, 4, 42, 11, 'c'); l.ell(35, 4, 41, 10, 'y', only='c')
        l.vl(38, 6, 8, 'c')
    put(c, coin)
    c.pts('m', [(33, 9), (33, 10), (44, 5), (44, 6), (37, 14), (38, 15)])
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': '#f1ede4', 'W': '#c9c3b6', '1': GREY, '2': GREY2,
           'h': '#231915', 'o': '#d07a3a', 'r': '#7d878b', 'q': '#c9e1e6', 'Q': '#9ec3cb',
           'n': '#9ccb80', 'N': '#4f7a42', 'b': '#d3a663', 'B': '#9a7240', 'p': '#d2a35d', 'l': '#5a4a40',
           'x': '#e46a3c', 't': '#6f9fc4', 'T': '#4f7ea3'}
    skinpal(pal, 'a', MED); skinpal(pal, 'e', PALE)

    def bill(l, x0, y0, x1, y1):
        l.rect(x0, y0, x1, y1, 'n')
        cx = (x0 + x1) // 2
        l.rect(cx, y0 + 1, cx + 1, y1 - 1, 'N')
        l.px(x0 + 1, y0 + 1, 'N'); l.px(x1 - 1, y1 - 1, 'N')

    # clothesline: a blue shirt and a bill, pegged
    c.line(0, 2, 47, 2, 'l')

    def shirt(l):
        l.rect(16, 3, 23, 10, 't'); l.rect(14, 3, 15, 5, 't'); l.rect(24, 3, 25, 5, 't')   # body + short sleeves
        l.rect(22, 4, 23, 10, 'T'); l.rect(24, 4, 25, 5, 'T')
        l.hl(18, 21, 3, 'T')                                                        # collar
    put(c, shirt)
    put(c, lambda l: l.rect(16, 1, 16, 3, 'p'))
    put(c, lambda l: l.rect(23, 1, 23, 3, 'p'))
    put(c, lambda l: (bill(l, 27, 3, 33, 7), l.rect(30, 1, 30, 3, 'p')))

    def left(l):  # stands beside the machine: medium skin, short dark hair, rolled sleeves
        l.poly([(-1, 48), (-1, 26), (2, 23), (12, 23), (15, 26), (15, 48)], '1')
        l.rect(12, 25, 15, 47, '2')
        l.rect(5, 20, 9, 23, 'A')                                                   # neck
        face(l, 1, 8, 12, 21, 'a', 'A')
        l.rect(1, 7, 12, 9, 'h'); l.hl(2, 11, 6, 'h'); l.px(1, 10, 'h'); l.px(12, 10, 'h')
        l.vl(4, 13, 14, 'k'); l.vl(9, 13, 14, 'k'); l.hl(5, 8, 17, 'k'); l.hl(6, 7, 18, 'k')
        l.rect(12, 27, 15, 29, 'w')                                                 # rolled cuff
        l.rect(12, 30, 15, 34, 'a'); l.vl(15, 30, 34, 'A')                          # forearm, hand on the machine
    put(c, left)

    def machine(l):
        l.rect(14, 24, 33, 47, 'w'); l.rect(31, 24, 33, 47, 'W')
        l.hl(14, 33, 28, 'W')                                                       # panel seam
        l.rect(16, 25, 21, 26, 'r')                                                 # soap drawer
        l.rect(28, 25, 29, 26, 'r')                                                 # dial
        l.px(25, 25, 'x'); l.px(25, 26, 'x')                                        # light
        l.ell(15, 30, 31, 46, 'r')                                                  # porthole ring
        l.ell(17, 32, 29, 44, 'q')                                                  # glass
        l.ell(17, 39, 29, 44, 'Q', only='q')                                        # water
    put(c, machine)
    for box in [(19, 34, 23, 37), (23, 39, 27, 42)]:
        t = C(N); bill(t, *box); t.outline('k'); c.paste(t)
    put(c, lambda l: l.rect(14, 30, 16, 33, 'a'))                                  # fingers over the lid edge

    def right(l):  # pale, ginger, rolled sleeves
        l.poly([(33, 48), (34, 34), (37, 31), (45, 31), (48, 34), (48, 48)], '1')
        l.rect(37, 26, 42, 31, 'E')
        face(l, 34, 10, 46, 27, 'e', 'E')
        l.rect(34, 9, 46, 12, 'o'); l.hl(35, 45, 8, 'o'); l.rect(33, 10, 33, 15, 'o'); l.rect(47, 10, 47, 14, 'o')
        l.vl(37, 16, 17, 'k'); l.vl(42, 16, 17, 'k')
        l.hl(38, 41, 22, 'k'); l.hl(39, 40, 23, 'k')
    put(c, right)

    # heap of bills above the basket
    for box in [(36, 31, 43, 35), (40, 33, 47, 37), (34, 34, 41, 38), (41, 36, 47, 39)]:
        t = C(N); bill(t, *box); t.outline('k'); c.paste(t)

    def basket(l):  # wicker: rim band, woven body, side handles
        l.rect(33, 38, 47, 39, 'B')
        l.poly([(34, 40), (48, 40), (48, 48), (35, 48)], 'b')
        for y in range(40, 48):
            for x in range(34, 48):
                if (x + (y // 2) * 2) % 4 == 0:
                    l.px(x, y, 'B') if l.get(x, y) == 'b' else None
        l.hl(34, 47, 43, 'B')
    put(c, basket)
    put(c, lambda l: (l.rect(32, 36, 34, 38, 'e'), l.vl(34, 36, 38, 'E')))      # hand on the rim
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
