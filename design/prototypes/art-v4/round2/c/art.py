"""Option C, little scenes: 48x48, half-body figures in a tiny setting that names the role.
Flat fills, 2 tones per material, one ink outline around every object, dot eyes."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

STYLE = {
    'title': 'C  Little scenes  (48x48: the setting tells the role; flat, one ink outline)',
    'short': 'C Little scenes',
    'sub': '48x48, figure + setting',
}

N = 48
INK = '#2a1e26'
W, W2 = '#f4ede1', '#d3cbbd'
RED, RED2 = '#d9534a', '#a83a35'
MAG, MAG2 = '#c2457f', '#8f2f5d'
GREY, GREY2 = '#a9aeac', '#7d8381'
CASH, CASH2 = '#8fb877', '#5d8a50'

PALE = ('#f3d5c0', '#d9ab92')
LIGHT = ('#ebbd94', '#cc946d')
OLIVE = ('#d1a072', '#ad7c52')
MED = ('#a4683f', '#83502f')
DEEP = ('#6e4128', '#55301d')
VDEEP = ('#4a2a1b', '#371e13')


def obj(fn):
    l = C(N)
    fn(l)
    l.outline('k')
    return l


def face(l, x0, y0, w, h, skin, shade, mouth='smile'):
    """Rounded-box head with dot eyes. Returns eye row."""
    x1, y1 = x0 + w - 1, y0 + h - 1
    l.rect(x0, y0 + 1, x1, y1 - 1, skin)
    l.hl(x0 + 1, x1 - 1, y0, skin); l.hl(x0 + 1, x1 - 1, y1, skin)
    l.hl(x0 + 1, x1 - 1, y1, shade)
    ey = y0 + h // 2
    l.px(x0 + 2, ey, 'k'); l.px(x1 - 2, ey, 'k')
    cx0, cx1 = x0 + 3, x1 - 3
    if mouth == 'smile':
        l.px(cx0, ey + 2, 'k'); l.hl(cx0 + 1, cx1 - 1, ey + 3, 'k'); l.px(cx1, ey + 2, 'k')
    elif mouth == 'cheer':
        l.hl(cx0, cx1, ey + 2, 'k'); l.hl(cx0 + 1, cx1 - 1, ey + 3, 'k')
    elif mouth == 'flat':
        l.hl(cx0 + 1, cx1 - 1, ey + 3, 'k')
    return ey


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, '1': MAG, '2': MAG2, 'a': OLIVE[0], 'A': OLIVE[1],
           'g': '#3e3542', 'G': '#2f2733', 'o': '#8a5a3c', 'O': '#6a4330', 'v': '#6b3a3f', 'V': '#552c31',
           'l': '#4f8a62', 'L': '#386a4a', 'y': '#f2d27a', 'b': '#c9a24a', 'B': '#9b7a30',
           'n': CASH, 'N': CASH2, 'c': '#7a4a2c', 'e': '#e8703a', 'm': '#b3a8b0'}

    def chair(l):  # tall leather chair back, framing him
        l.rect(9, 10, 38, 39, 'v'); l.hl(10, 37, 9, 'v'); l.hl(11, 36, 8, 'v')
        l.poly([(33, 7), (39, 10), (39, 40), (33, 40)], 'V', only='v')
        for x in (13, 35):
            l.px(x, 12, 'V')
    c.paste(obj(chair))

    def body(l):
        l.poly([(9, 41), (10, 30), (14, 27), (34, 27), (38, 30), (39, 41)], '1')
        l.poly([(32, 27), (38, 30), (39, 41), (33, 41)], '2', only='1')
        l.poly([(19, 27), (29, 27), (24, 35)], 'w')             # shirt V
        l.vl(24, 28, 34, 'g'); l.px(24, 28, 'G')                # dark tie
        l.hl(31, 33, 31, 'w')                                   # pocket square
        l.rect(20, 25, 28, 27, 'A')                             # neck in shade
    c.paste(obj(body))

    def head(l):
        face(l, 18, 13, 13, 13, 'a', 'A', mouth=None)
        l.rect(17, 18, 17, 21, 'a'); l.rect(31, 18, 31, 21, 'a')   # ears
        l.recolor('k', 'a', (18, 13, 30, 25))
        l.hl(19, 29, 14, 'A')                                   # brim shadow
        l.hl(20, 22, 19, 'k'); l.hl(26, 28, 19, 'k')            # narrow eyes
        l.hl(22, 25, 23, 'k'); l.px(26, 22, 'k')                # smirk
        # fedora
        l.rect(18, 5, 30, 12, 'g'); l.hl(19, 29, 4, 'g'); l.hl(22, 26, 5, 'G')
        l.rect(18, 10, 30, 11, '1')                             # magenta band
        l.rect(27, 5, 30, 9, 'G')
        l.hl(13, 35, 12, 'g'); l.hl(13, 35, 13, 'g'); l.hl(31, 35, 13, 'G')
        # cigar
        l.rect(27, 22, 32, 23, 'c'); l.rect(33, 22, 33, 23, 'e')
    c.paste(obj(head))
    c.pts('m', [(35, 21), (36, 20), (36, 19), (35, 18), (35, 17), (36, 16)])

    def desk(l):
        l.rect(0, 38, 47, 40, 'o'); l.hl(0, 47, 40, 'O')
        l.rect(1, 41, 46, 47, 'O')
        l.rect(4, 42, 18, 47, 'o'); l.rect(29, 42, 43, 47, 'o')     # drawer fronts
        l.hl(10, 12, 44, 'b'); l.hl(35, 37, 44, 'b')                # brass pulls
    c.paste(obj(desk))

    def hands(l):
        l.rect(12, 35, 17, 38, '1'); l.rect(31, 35, 36, 38, '2')   # forearms on desk
        l.rect(17, 36, 20, 38, 'a'); l.rect(28, 36, 31, 38, 'a')
        l.hl(17, 20, 38, 'A'); l.hl(28, 31, 38, 'A')
    c.paste(obj(hands))

    def lamp(l):  # banker's lamp, left
        l.rect(1, 36, 9, 37, 'b'); l.hl(1, 9, 37, 'B')
        l.vl(5, 31, 35, 'b')
        l.poly([(0, 31), (2, 26), (9, 26), (11, 31)], 'l')
        l.poly([(6, 26), (9, 26), (11, 31), (7, 31)], 'L', only='l')
        l.hl(1, 10, 31, 'y')
    c.paste(obj(lamp))

    def cash(l):  # stacks of bills, right
        for x0, y0, h in ((37, 29, 9), (42, 33, 5)):
            l.rect(x0, y0, x0 + 5, y0 + h - 1, 'n')
            for y in range(y0 + 1, y0 + h, 2):
                l.hl(x0, x0 + 5, y, 'N')
            l.vl(x0 + 2, y0, y0 + h - 1, 'w')
    c.paste(obj(cash))
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, '1': RED, '2': RED2, 'h': '#1f1714', 'y': '#e2b84d', 'r': '#8a4b2a',
           'n': '#4a2f22', 's': '#c3b7a3', 'S': '#a89a85', 'p': '#f4ede1'}
    tones = {'a': OLIVE, 'b': PALE, 'c': MED, 'd': LIGHT, 'e': DEEP, 'f': VDEEP}
    for key, (f, s) in tones.items():
        pal[key] = f; pal[key.upper()] = s

    def back_fan(l, x0, skin, hair, style):
        l.poly([(x0 - 2, 34), (x0 - 1, 26), (x0 + 1, 24), (x0 + 9, 24), (x0 + 11, 26), (x0 + 12, 34)], '2')
        face(l, x0, 13, 10, 11, skin, skin.upper(), mouth='cheer')
        if style == 'cap':
            l.rect(x0, 12, x0 + 9, 14, hair); l.hl(x0 + 1, x0 + 8, 11, hair)
        elif style == 'bunches':
            l.rect(x0, 12, x0 + 9, 14, hair); l.hl(x0 + 1, x0 + 8, 11, hair)
            l.rect(x0 - 2, 14, x0 - 1, 17, hair); l.rect(x0 + 10, 14, x0 + 11, 17, hair)

    # back row (higher tier)
    def bl(l):  # holds the pennant
        back_fan(l, 7, 'a', 'h', 'cap')
        l.rect(4, 6, 6, 24, '2')                                # raised arm
        l.rect(4, 4, 6, 6, 'a')                                 # fist
    c.paste(obj(bl))

    def pennant(l):
        l.vl(5, 0, 6, 'n')
        l.poly([(6, 0), (6, 8), (22, 3.5)], '1')
        l.hl(8, 10, 3, 'w'); l.hl(8, 10, 4, 'w')
    c.paste(obj(pennant))
    c.paste(obj(lambda l: l.rect(4, 4, 6, 6, 'a')))

    def br(l):
        back_fan(l, 31, 'b', 'y', 'bunches')
        l.rect(42, 10, 44, 24, '2')                             # raised arm
    c.paste(obj(br))

    def pennant2(l):  # second pennant, white with a red stripe, flying left
        l.vl(43, 0, 9, 'n')
        l.poly([(42, 0), (42, 8), (27, 3.5)], 'w')
        l.hl(37, 41, 3, '1'); l.hl(37, 41, 4, '1')
    c.paste(obj(pennant2))
    c.paste(obj(lambda l: l.rect(42, 7, 44, 9, 'b')))

    def tier(l):  # seat backs of the back row, low contrast
        l.rect(0, 30, 47, 33, 's'); l.hl(0, 47, 33, 'S')
    c.paste(obj(tier))

    def front(l, x0, w, skin, hair, style, y0=27):
        l.poly([(x0 - 2, 48), (x0 - 1, y0 + 13), (x0 + 1, y0 + 11), (x0 + w - 2, y0 + 11),
                (x0 + w, y0 + 13), (x0 + w + 1, 48)], '1')
        face(l, x0, y0, w, 11, skin, skin.upper(), mouth='cheer')
        if style == 'long':
            l.rect(x0, y0 - 1, x0 + w - 1, y0 + 1, hair); l.hl(x0 + 1, x0 + w - 2, y0 - 2, hair)
            l.rect(x0 - 1, y0 + 1, x0, y0 + 6, hair); l.rect(x0 + w - 1, y0 + 1, x0 + w, y0 + 6, hair)
        elif style == 'beanie':
            l.rect(x0, y0 - 2, x0 + w - 1, y0 + 1, '1'); l.hl(x0, x0 + w - 1, y0 + 1, 'w')
            l.hl(x0 + 1, x0 + w - 2, y0 - 3, '1'); l.rect(x0 + w // 2 - 1, y0 - 5, x0 + w // 2, y0 - 4, 'w')
        elif style == 'short':
            l.rect(x0, y0 - 1, x0 + w - 1, y0 + 1, hair); l.hl(x0 + 1, x0 + w - 2, y0 - 2, hair)

    c.paste(obj(lambda l: front(l, 1, 10, 'c', 'h', 'long', 29)))
    c.paste(obj(lambda l: front(l, 37, 10, 'f', 'h', 'beanie', 29)))

    def centre(l):
        front(l, 17, 12, 'd', 'r', 'short', 25)
        for x in range(15, 33):                                 # striped scarf
            l.rect(x, 36, x, 38, 'w' if (x // 2) % 2 else '2')
    c.paste(obj(centre))

    def rail(l):  # seat backs in front
        for x0 in (0, 16, 32):
            l.rect(x0 + 1, 44, x0 + 14, 47, 's'); l.hl(x0 + 2, x0 + 13, 43, 's'); l.hl(x0 + 1, x0 + 14, 47, 'S')
    c.paste(obj(rail))
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    sk, sh = '#4f2d1e', '#3a2016'
    pal = {'k': INK, 'w': W, 'W': W2, '1': '#ecebe6', '2': '#33363b', 's': sk, 'S': sh, 'L': '#6f4430',
           'g': '#9dbb7f', 'G': '#88a96c', 'c': '#b88220', 'y': '#efc04a', 'm': '#8a7f86', 'h': '#1c1412',
           'q': '#f4ede1', 'f': '#e2b84d', 'F': '#c4952f'}

    def pitch(l):
        l.rect(0, 36, 47, 47, 'g')
        for y in (40, 41, 44, 45):
            l.hl(0, 47, y, 'G')
    pitch(c)
    c.hl(0, 47, 35, 'k')

    c.hl(0, 47, 38, 'q')                                         # touchline
    def flag(l):  # corner flag
        l.vl(42, 22, 38, 'q')
        l.poly([(43, 22), (43, 29), (48, 25.5)], 'f')
        l.poly([(43, 26), (43, 29), (48, 25.5)], 'F', only='f')
    c.paste(obj(flag))

    def body(l):
        l.poly([(8, 48), (9, 33), (13, 30), (27, 30), (31, 33), (32, 48)], '1')
        for x in range(0, N):
            if (x // 2) % 2 == 0:
                l.recolor('1', '2', (x, 0, x, 47))
        l.poly([(16, 30), (24, 30), (20, 34)], 'h')             # black collar
        l.rect(17, 27, 23, 30, 'S')                             # neck
        # raised right arm (his left on screen side x 30+)
        l.rect(29, 21, 33, 32, '1'); l.vl(29, 21, 32, '2'); l.vl(31, 21, 32, '2'); l.vl(33, 21, 32, '2')
        l.rect(30, 14, 33, 21, 's'); l.vl(33, 14, 21, 'S')
        l.rect(29, 11, 34, 14, 's'); l.rect(29, 10, 30, 10, 's')   # fist, thumb up
        # whistle on cord
    c.paste(obj(body))

    def head(l):
        l.rect(14, 15, 26, 26, 's'); l.hl(15, 25, 14, 's'); l.hl(15, 25, 27, 's')
        l.rect(13, 19, 13, 22, 's'); l.rect(27, 19, 27, 22, 's')   # ears
        l.hl(15, 25, 27, 'S'); l.vl(26, 16, 26, 'S')
        l.rect(14, 13, 26, 16, 'h'); l.hl(15, 25, 12, 'h')        # short hair
        l.hl(16, 18, 18, 'L'); l.hl(22, 24, 18, 'L')            # brow highlight
        l.rect(17, 19, 17, 20, 'h'); l.rect(23, 19, 23, 20, 'h')   # dark eyes
        l.px(18, 23, 'h'); l.hl(19, 21, 24, 'h'); l.px(22, 23, 'h')  # smile
    c.paste(obj(head))

    def coin(l):
        l.ell(29, 1, 35, 7, 'c'); l.ell(29, 1, 34, 6, 'y', only='c')
        l.vl(32, 3, 5, 'c')
    c.paste(obj(coin))
    c.pts('m', [(37, 2), (38, 3), (37, 6), (38, 7), (27, 4), (26, 5)])
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': W, 'W': W2, '1': GREY, '2': GREY2, 'a': LIGHT[0], 'A': LIGHT[1],
           'b': DEEP[0], 'B': DEEP[1], 'h': '#1f1714', 'r': '#b0552c',
           'n': CASH, 'N': CASH2, 'p': '#caa064', 'u': '#cfe0e3', 'U': '#a9c2c7',
           'x': '#7f8a8c', 'q': '#c9a066', 'Q': '#a07a45', 'z': '#c9cdcb'}

    c.hl(0, 47, 2, 'x')                                         # clothesline, straight

    def tee(l, x0):
        l.rect(x0 + 2, 3, x0 + 8, 10, 'w'); l.rect(x0, 3, x0 + 1, 6, 'w'); l.rect(x0 + 9, 3, x0 + 10, 6, 'w')
        l.hl(x0 + 4, x0 + 6, 3, 'W'); l.vl(x0 + 8, 4, 10, 'W')
    c.paste(obj(lambda l: tee(l, 3)))

    def bill(l, x0):
        l.rect(x0, 3, x0 + 8, 8, 'n'); l.rect(x0 + 3, 4, x0 + 5, 7, 'N'); l.pts('N', [(x0 + 1, 4), (x0 + 7, 7)])
    c.paste(obj(lambda l: bill(l, 20)))
    c.paste(obj(lambda l: bill(l, 36)))
    for x in (5, 11, 24, 40):
        c.paste(obj(lambda l, x=x: l.rect(x, 1, x, 4, 'p')))

    def person_a(l):  # between the machine and the basket
        l.poly([(15, 48), (16, 27), (19, 25), (28, 25), (31, 27), (32, 48)], '1')
        l.rect(22, 23, 25, 25, 'A')
        face(l, 19, 13, 10, 10, 'a', 'A')
        l.rect(18, 12, 29, 14, 'r'); l.hl(19, 28, 11, 'r'); l.rect(18, 15, 18, 19, 'r'); l.rect(29, 15, 29, 19, 'r')
        l.pts('r', [(19, 15), (28, 15)])
    c.paste(obj(person_a))

    def washer(l):
        l.rect(0, 16, 17, 47, 'w'); l.vl(17, 16, 47, 'W'); l.vl(16, 17, 47, 'W')
        l.hl(0, 17, 20, 'W')                                    # control strip line
        l.rect(2, 17, 6, 18, 'x')                               # detergent drawer
        l.ell(12, 17, 14, 19, 'x')                              # knob
        l.ell(1, 23, 15, 37, 'x')                               # porthole rim
        l.ell(3, 25, 13, 35, 'u')
        l.ell(9, 25, 13, 35, 'U', only='u')
        # bills tumbling inside
        l.rect(4, 29, 7, 31, 'n'); l.px(5, 30, 'N')
        l.rect(8, 31, 11, 33, 'n'); l.px(10, 32, 'N')
        l.rect(7, 26, 9, 27, 'N')
        l.hl(1, 15, 41, 'W')                                    # kick plate
    c.paste(obj(washer))

    def person_b(l):  # right, holding a basket of bills
        l.poly([(30, 48), (31, 27), (34, 25), (45, 25), (47, 27), (48, 48)], '1')
        l.poly([(44, 25), (47, 27), (48, 48), (45, 48)], '2', only='1')
        l.rect(37, 23, 41, 25, 'B')
        face(l, 34, 13, 11, 10, 'b', 'B')
        l.rect(34, 12, 44, 14, 'h'); l.hl(35, 43, 11, 'h'); l.vl(34, 15, 16, 'h'); l.vl(44, 15, 16, 'h')
    c.paste(obj(person_b))

    def basket(l):
        heap = C(N); heap.ell(23, 28, 46, 42, '#')
        for y in range(28, 37):                                 # bills laid like bricks
            for x in range(22, 48):
                if heap.get(x, y) != '#':
                    continue
                r = (y - 28) // 3; off = 3 if r % 2 else 0
                bx = (x - 22 + off) % 6
                l.px(x, y, 'N' if (y - 28) % 3 == 2 or bx == 5 else ('w' if bx == 2 and (y - 28) % 3 == 0 else 'n'))
        l.poly([(22, 36), (47, 36), (45, 48), (24, 48)], 'q')
        for y in (39, 42, 45):
            l.hl(23, 46, y, 'Q')
        l.rect(22, 36, 47, 37, 'Q')
        # rolled sleeves + forearms gripping the rim
        l.rect(20, 31, 23, 32, 'z'); l.rect(20, 33, 23, 37, 'a'); l.hl(20, 23, 37, 'A')
        l.rect(45, 31, 47, 32, 'z'); l.rect(45, 33, 47, 37, 'b')
    c.paste(obj(basket))
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
