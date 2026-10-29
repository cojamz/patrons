"""Style 3, bold two-ink print: 32x32. Paper (the card), the sphere colour, one ink, flat skin. Shapes are
separated by paper gaps, never outlines; one sphere-colour stamp behind each figure."""
from lib import C

STYLE = {
    'title': '3  Two-ink print  (32x32: paper, sphere colour, one ink, flat skin; paper gaps, no outlines)',
    'short': '3 Two-ink print',
    'sub': '32x32, stamp / screen print',
}

N = 32
INK = '#2b2330'
MAG = '#c2457f'
RED = '#d9534a'
GREY = '#9ea4a2'
SK = {'pale': '#f2d2bb', 'light': '#e9b88c', 'olive': '#cf9c6c', 'med': '#a3673f', 'deep': '#6d3f27',
      'vdeep': '#4c2b1c'}


def L(fn):
    c = C(N)
    fn(c)
    return c


def kingpin():
    c = C(N)
    c.rect(3, 4, 28, 28, 'z')
    # smoke knocked out of the stamp
    c.pts('.', [(26, 14), (27, 13), (27, 12), (26, 11), (26, 10), (27, 9)])

    def body(l):
        l.poly([(2, 32), (4, 24), (9, 21), (23, 21), (28, 24), (30, 32)], 'k')
        l.poly([(12, 21), (20, 21), (16, 30)], 'p')
        l.rect(15, 22, 16, 28, '1')
    c.paste_gap(keep='z', src=L(body))

    def face(l):
        l.rect(12, 9, 20, 18, 'a'); l.hl(13, 19, 19, 'a'); l.rect(14, 19, 18, 21, 'a')
        l.hl(13, 14, 13, 'k'); l.hl(17, 18, 13, 'k')
        l.hl(14, 16, 17, 'k')
    c.paste_gap(keep='z', src=L(face))

    def cigar(l):
        l.rect(18, 16, 23, 17, 'k'); l.rect(24, 16, 24, 17, 'p')
    c.paste_gap(keep='z', src=L(cigar))

    def hat(l):
        l.hl(10, 14, 2, 'k'); l.hl(17, 21, 2, 'k')
        l.rect(10, 3, 21, 7, 'k'); l.hl(15, 16, 3, 'k')
        l.hl(5, 26, 8, 'k'); l.hl(7, 24, 9, 'k')
        l.hl(10, 21, 6, '1')
    c.paste_gap(keep='z', src=L(hat))
    return c.rows(), {'z': MAG, 'k': INK, '1': MAG, 'a': SK['light'], 'p': '#e9dcc4'}


def mob():
    c = C(N)
    # the stamp here is the pennant, big, behind the crowd
    c.poly([(2, 0), (2, 8), (17, 4)], 'z')
    c.vl(1, 0, 16, 'k')
    c.poly([(2, 3), (2, 5), (9, 4)], '.', only='z')

    LIFT = {'b': 'B', 'e': 'E'}

    def person(x0, y0, w, h, skin, hair, body, smile='open'):
        def f(l):
            l.poly([(x0 - 2, N), (x0 - 2, y0 + h + 3), (x0, y0 + h + 1), (x0 + w - 1, y0 + h + 1), (x0 + w + 1, y0 + h + 3), (x0 + w + 1, N)], body)
            if hair == 'puff':
                l.ell(x0 - 1, y0 - 4, x0 + w, y0 + 3, 'k')
            l.rect(x0, y0 + 1, x0 + w - 1, y0 + h - 1, skin); l.hl(x0 + 1, x0 + w - 2, y0 + h, skin)
            if hair == 'puff':
                l.hl(x0, x0 + w - 1, y0 + 1, 'k')
            if hair == 'cap':
                l.rect(x0, y0 - 1, x0 + w - 1, y0 + 1, 'k'); l.hl(x0 + 1, x0 + w - 2, y0 - 2, 'k')
            elif hair == 'side':
                l.rect(x0, y0 - 1, x0 + w - 1, y0 + 1, 'k'); l.hl(x0 + 1, x0 + w - 2, y0 - 2, 'k')
                l.vl(x0 - 1, y0, y0 + h - 1, 'k'); l.vl(x0 + w, y0, y0 + h - 1, 'k')
            elif hair == 'beanie':
                l.rect(x0, y0 - 1, x0 + w - 1, y0 + 1, '1'); l.hl(x0 + 1, x0 + w - 2, y0 - 2, '1')
                l.hl(x0, x0 + w - 1, y0 + 1, 'k'); l.rect(x0 + w // 2 - 1, y0 - 4, x0 + w // 2, y0 - 3, 'k')
            ey = y0 + h // 2
            if skin in LIFT:                                    # deep skin: one warm feature colour
                l.pts(LIFT[skin], [(x0 + 1, ey + 1), (x0 + w - 2, ey + 1), (x0 + 1 + (w > 7), ey - 1), (x0 + w - 2 - (w > 7), ey - 1)])
            l.px(x0 + 1 + (w > 7), ey, 'k'); l.px(x0 + w - 2 - (w > 7), ey, 'k')
            m = x0 + w // 2 - 1
            l.rect(m, ey + 2, m + 1 + (w % 2), ey + 2 + (h > 7), 'k')
        return f

    c.paste_gap(keep='z', src=L(person(5, 5, 7, 7, 'b', 'puff', 'k')))
    c.paste_gap(keep='z', src=L(person(20, 5, 7, 7, 'c', 'cap', 'k')))
    c.paste_gap(keep='z', src=L(person(1, 15, 7, 8, 'd', 'side', '1')))
    c.paste_gap(keep='z', src=L(person(24, 15, 7, 8, 'e', 'beanie', '1')))

    def centre(l):
        l.poly([(8, N), (8, 25), (11, 23), (20, 23), (23, 25), (23, N)], '1')
        l.rect(11, 13, 20, 21, 'a'); l.hl(12, 19, 22, 'a'); l.hl(12, 19, 12, 'a')
        l.rect(11, 11, 20, 13, 'k'); l.hl(12, 19, 10, 'k'); l.px(11, 14, 'k'); l.px(20, 14, 'k')
        l.pts('k', [(12, 17), (13, 16), (14, 17), (17, 17), (18, 16), (19, 17)])
        l.hl(14, 17, 19, 'k'); l.hl(15, 16, 20, 'k')
        l.rect(11, 23, 20, 24, 'k')                   # solid collar band
    c.paste_gap(keep='z', src=L(centre))
    return c.rows(), {'z': RED, 'k': INK, '1': RED, 'a': SK['light'], 'b': SK['deep'], 'B': '#9a6343', 'E': '#7c4c34', 'c': SK['pale'], 'd': SK['olive'],
                      'e': SK['vdeep']}


def tiebreaker():
    c = C(N)
    c.rect(3, 5, 28, 28, 'z')

    def body(l):
        l.poly([(2, 32), (4, 24), (8, 22), (21, 22), (25, 24), (27, 32)], 'p')
        for x in range(N):
            if x % 4 < 2:
                l.recolor('p', 'k', (x, 0, x, N - 1))
        l.poly([(11, 22), (18, 22), (14.5, 26)], 'k')
    c.paste_gap(keep='z', src=L(body))

    def arm(l):
        l.poly([(22, 31), (23, 18), (27, 18), (28, 31)], 'k')
        l.stamp(22, 11, ['..ss..', '..ss..', '.sssss', '.sssss', '.sssss', '..sss.'])
    c.paste_gap(keep='z', src=L(arm))

    def face(l):
        l.ell(8, 7, 20, 20, 's'); l.rect(12, 19, 16, 22, 's')
        l.rect(7, 12, 7, 14, 's'); l.rect(21, 12, 21, 14, 's')
        l.hl(10, 12, 11, 'k'); l.hl(16, 18, 11, 'k')
        l.hl(10, 12, 10, 'L'); l.hl(16, 18, 10, 'L')       # warm brow highlight
        l.rect(11, 13, 12, 13, 'k'); l.rect(16, 13, 17, 13, 'k')
        l.px(10, 15, 'L'); l.px(18, 15, 'L')               # cheekbones
        l.pts('k', [(12, 17), (13, 18), (14, 18), (15, 18), (16, 17)])
    c.paste_gap(keep='z', src=L(face))

    def coin(l):
        l.ell(22, 0, 27, 5, '1'); l.px(23, 1, 'p')
    c.paste_gap(src=L(coin))
    c.pts('k', [(29, 3), (29, 4), (20, 6), (20, 7)])
    return c.rows(), {'z': GREY, 'k': INK, '1': GREY, 'p': '#f1e9da', 's': SK['vdeep'], 'L': '#7c4c34'}


def launderers():
    c = C(N)
    c.rect(3, 6, 28, 28, 'z')
    c.line(0, 2, 15, 4, 'k'); c.line(16, 4, 31, 2, 'k')

    def note(l):
        l.rect(6, 5, 25, 11, 'p')
        l.hl(6, 25, 5, 'k'); l.hl(6, 25, 11, 'k'); l.vl(6, 5, 11, 'k'); l.vl(25, 5, 11, 'k')
        l.ell(13, 7, 18, 9, 'k')                              # one centre mark (oval)
        l.px(8, 7, 'k'); l.px(8, 9, 'k'); l.px(23, 7, 'k'); l.px(23, 9, 'k')
    c.paste_gap(keep='z', src=L(note))

    def peg(l):
        l.rect(10, 1, 11, 7, '1')
    c.paste_gap(keep='z', src=L(peg))

    def left(l):
        l.poly([(0, 32), (0, 25), (3, 23), (11, 23), (14, 26), (14, 32)], 'k')
        l.rect(2, 13, 10, 21, 'a'); l.hl(3, 9, 22, 'a'); l.rect(5, 22, 8, 24, 'a')
        l.rect(2, 12, 10, 14, 'h'); l.hl(3, 9, 11, 'h'); l.px(2, 15, 'h')
        l.ell(4, 7, 8, 11, 'h')
        l.px(4, 17, 'k'); l.px(8, 17, 'k'); l.hl(5, 7, 19, 'k')
    c.paste_gap(keep='z', src=L(left))

    def right(l):
        l.poly([(17, 32), (17, 26), (20, 24), (29, 24), (32, 26), (32, 32)], 'k')
        l.rect(21, 14, 29, 22, 'b'); l.hl(22, 28, 23, 'b'); l.rect(23, 23, 26, 25, 'b')
        l.rect(21, 12, 29, 14, 'g'); l.hl(22, 28, 11, 'g'); l.px(29, 15, 'g'); l.px(21, 15, 'g'); l.px(29, 16, 'g')
        l.px(23, 18, 'k'); l.px(27, 18, 'k'); l.hl(24, 26, 20, 'k')
    c.paste_gap(keep='z', src=L(right))

    for box in [(12, 15, 16, 19), (16, 21, 18, 23)]:
        b = C(N); b.ell(*box, 'p'); c.paste_gap(src=b, keep='z')
        c.px(box[0] + 1, box[1] + 1, 'z')
    return c.rows(), {'z': GREY, 'k': INK, '1': GREY, 'p': '#f1e9da', 'a': SK['med'], 'b': SK['pale'], 'h': INK, 'g': '#c0602c'}


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
