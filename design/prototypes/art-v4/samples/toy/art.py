"""Style 2, chunky toy: 24x24, big round heads on little bell bodies, flat colour, one dark outline, no shading."""
from lib import C

STYLE = {
    'title': '2  Chunky toy  (24x24: big heads, little bodies, flat colour, one outline, no shading)',
    'short': '2 Chunky toy',
    'sub': '24x24, game pieces',
}

N = 24
INK = '#2b2026'
W = '#fbf5ea'
RED = '#de5148'
MAG = '#c8467f'
SKIN = {
    'pale': '#f6d4bd', 'light': '#eebb8e', 'olive': '#cf9a68', 'med': '#a46640',
    'deep': '#704028', 'vdeep': '#4b2b1c',
}


def layer(fn):
    c = C(N)
    fn(c)
    c.outline('k')
    return c


def bell(l, x0, y0, x1, k):
    """A little game-piece body from y0 to the bottom edge."""
    l.poly([(x0 + 2, y0), (x1 - 1, y0), (x1 + 1, y0 + 3), (x1 + 1, N), (x0, N), (x0, y0 + 3)], k)


def kingpin():
    c = C(N)

    def fig(l):
        bell(l, 4, 17, 19, '1')
        l.poly([(10, 17), (14, 17), (12, 21)], 'w')
        l.ell(6, 6, 17, 17, 'a')
        l.rect(5, 10, 5, 12, 'a'); l.rect(18, 10, 18, 12, 'a')
        # fedora: pinched crown, magenta band, wide brim
        l.hl(8, 10, 1, 'g'); l.hl(13, 15, 1, 'g')
        l.rect(7, 2, 16, 5, 'g'); l.hl(7, 16, 4, '1')
        l.hl(3, 20, 6, 'g'); l.hl(5, 18, 7, 'g')
        # eyes under the brim, moustache, cigar
        l.hl(9, 10, 10, 'k'); l.hl(13, 14, 10, 'k')
        l.hl(10, 13, 14, 'k')                                   # mouth line
        l.hl(14, 18, 14, 'c'); l.hl(14, 18, 15, 'c'); l.rect(19, 14, 19, 15, 'e')   # cigar from the corner
    c.paste(layer(fig))
    c.pts('m', [(21, 12), (20, 11), (21, 10)])
    return c.rows(), {'k': INK, 'w': W, '1': MAG, 'a': SKIN['olive'], 'g': '#3f3542', 'h': '#2f2226',
                      'c': '#7b4a2b', 'e': '#ef7a3c', 'm': '#a99ea6'}


def mob():
    c = C(N)

    def person(x0, y0, d, skin, hair, body, hat=None, mouth='o'):
        def f(l):
            bell(l, x0 - 1, y0 + d - 1, x0 + d, body)
            l.ell(x0, y0, x0 + d - 1, y0 + d - 1, skin)
            if hair == 'top':
                pass
            elif hair:
                l.ell(x0, y0, x0 + d - 1, y0 + d - 1, hair[0])
                l.ell(x0, y0 + 2, x0 + d - 1, y0 + d + 1, skin, only=hair[0])
                l.rect(x0, y0 + d - 1, x0 + d - 1, y0 + d - 1, skin, ) if False else None
            if hat == 'bobble':
                l.rect(x0, y0, x0 + d - 1, y0 + 1, '1'); l.hl(x0, x0 + d - 1, y0 + 2, 'w')
                l.px(x0 + d // 2, y0 - 1, 'w')
            ey = y0 + d // 2
            l.px(x0 + 1 + (d > 6), ey, 'k'); l.px(x0 + d - 2 - (d > 6), ey, 'k')
            l.px(x0 + 1 + (d > 6), ey + 1, 'k') if False else None
            m0 = x0 + (d - 2) // 2
            l.rect(m0, ey + 2, m0 + 1, ey + 2 + (d > 5), 'k')
        return f

    c.paste(layer(person(4, 3, 6, 'b', ('h',), '2')))
    c.paste(layer(person(14, 3, 6, 'c', ('y',), '2')))
    c.paste(layer(person(0, 10, 7, 'd', ('h',), '1')))
    c.paste(layer(person(17, 10, 7, 'e', None, '1', hat='bobble')))

    def pennant(l):
        l.vl(22, 0, 6, 'n'); l.rect(21, 5, 22, 6, 'e')
        l.poly([(18, 0), (22, 0), (22, 4)], '1')
    c.paste(layer(pennant))
    # centre, a step forward
    def ce(l):
        bell(l, 7, 17, 16, '1')
        l.hl(8, 15, 17, 'w')
        l.ell(8, 8, 15, 16, 'a')
        l.ell(8, 8, 15, 16, 'r'); l.ell(8, 10, 15, 18, 'a', only='r')
        l.pts('k', [(9, 12), (10, 11), (11, 12), (12, 12), (13, 11), (14, 12)]) if False else None
        l.pts('k', [(9, 12), (10, 11), (11, 12), (12, 12), (13, 11), (14, 12)])
        l.hl(10, 13, 14, 'k'); l.hl(11, 12, 15, 'k')
    c.paste(layer(ce))
    return c.rows(), {'k': INK, 'w': W, '1': RED, '2': '#b23d37', 'a': SKIN['light'], 'b': '#5a3423',
                      'c': SKIN['pale'], 'd': SKIN['med'], 'e': SKIN['deep'], 'h': '#221816', 'y': '#e7bd4f',
                      'r': '#9a5530', 'n': '#4b3024'}


def tiebreaker():
    c = C(N)

    def fig(l):
        bell(l, 3, 16, 16, '1')
        for x in range(N):
            if x % 3 == 0:
                l.recolor('1', '2', (x, 0, x, N - 1))
        l.poly([(8, 16), (12, 16), (10, 19)], 'g')
        # raised arm, thumb up
        l.poly([(15, 17), (18, 12), (21, 12), (20, 19), (16, 19)], '1'); l.vl(19, 12, 18, '2'); l.vl(17, 14, 18, '2')
        l.stamp(17, 7, ['..aa.', '..aa.', 'aaaaa', 'aaaaa', '.aaa.'])
    c.paste(layer(fig))

    def head(l):
        l.ell(3, 5, 14, 16, 'a')
        l.rect(2, 10, 2, 11, 'a'); l.rect(15, 10, 15, 11, 'a')
        l.vl(6, 9, 10, 'k'); l.vl(11, 9, 10, 'k')
        l.pts('L', [(6, 7), (11, 7), (5, 11), (12, 11)])     # brow and cheek highlights
        l.pts('k', [(7, 13), (8, 14), (9, 14), (10, 13)])
    c.paste(layer(head))

    def coin(l):
        l.ell(17, 0, 21, 4, 'y'); l.vl(19, 1, 3, 'o')
    c.paste(layer(coin))
    return c.rows(), {'k': INK, 'w': W, '1': '#ecebe5', '2': '#3b3e44', 'g': '#24222a', 'a': '#573222', 'L': '#85543a',
                      'y': '#f1c34a', 'o': '#b9831f'}


def launderers():
    c = C(N)
    c.line(0, 1, 11, 2, 'k'); c.line(12, 2, 23, 1, 'k')

    def note(l):
        l.rect(6, 4, 17, 8, 'n'); l.rect(11, 6, 12, 7, 'N'); l.px(7, 5, 'N'); l.px(16, 7, 'N')
    c.paste(layer(note))

    def peg(l):
        l.rect(11, 1, 12, 4, 'p')
    c.paste(layer(peg))

    def left(l):
        bell(l, 0, 19, 10, '1')
        l.ell(-1, 6, 11, 16, 'h')                               # round puff of hair
        l.ell(0, 10, 10, 19, 'a')
        l.hl(2, 8, 10, 'h')
        l.vl(3, 14, 15, 'k'); l.vl(7, 14, 15, 'k'); l.hl(4, 6, 17, 'k')
    c.paste(layer(left))

    def right(l):
        bell(l, 13, 19, 23, '2')
        l.ell(13, 9, 23, 19, 'b')
        l.ell(13, 9, 23, 19, 'g'); l.ell(13, 11, 23, 21, 'b', only='g')
        l.px(13, 13, 'g'); l.px(23, 13, 'g')
        l.vl(16, 14, 15, 'k'); l.vl(20, 14, 15, 'k'); l.hl(17, 19, 17, 'k')
    c.paste(layer(right))
    for box in [(10, 17, 12, 19), (11, 12, 14, 15), (19, 4, 21, 6)]:
        b = C(N); b.ell(*box, 'u'); b.outline('k'); c.paste(b)
    return c.rows(), {'k': INK, 'w': W, '1': '#a7acaa', '2': '#8b9190', 'a': SKIN['med'], 'b': SKIN['pale'],
                      'h': '#211715', 'g': '#c4622e', 'n': '#8fbb75', 'N': '#5c8a4e', 'p': '#c99d5f',
                      'u': '#d6ecf0'}


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
