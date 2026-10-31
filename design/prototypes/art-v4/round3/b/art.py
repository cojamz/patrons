"""Style B, wide diorama: 64x64, camera pulled back. Small chunky full-body figures
(16-bit RPG proportions) standing in a little room or place that fills the frame.
Flat colours, 2-3 tones per material, ink outline on figures and props only."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from lib import C

STYLE = {
    'title': 'B  Wide diorama  (64x64: small full-body figures in a whole little room)',
    'short': 'B Wide diorama',
    'sub': '64x64, tiny game screen',
}

N = 64
INK = '#2a1e26'

PALE = ('#f3d5c0', '#dcb19a')
LIGHT = ('#ebbd94', '#cf9870')
OLIVE = ('#cf9f70', '#ae7f55')
MED = ('#a8693f', '#86512f')
DEEP = ('#74452a', '#5a331f')
VDEEP = ('#4c2b1b', '#3a1f13')


def obj(fn, k='k'):
    l = C(N)
    fn(l)
    l.outline(k)
    return l


def figure(l, x0, y0, skin, shade, hair=None, hs='short', top='1', top2='2', legs='x', shoes='k',
           arms=('down', 'down'), mouth='smile', brows=None, lit=None, eyes='dot', hw=10, hh=9, th=7, lh=4):
    """Chibi full-body figure, front view. (x0, y0) = top-left of the head.
    Returns hand positions {'L': (x, y), 'R': (x, y)} (top-left of each 2x2 fist)."""
    x1 = x0 + hw - 1
    ty = y0 + hh                        # torso top
    ly = ty + th                        # legs top
    sy = ly + lh                        # shoes top
    hands = {}
    # legs + shoes
    l.rect(x0 + 1, ly, x0 + 3, sy - 1, legs); l.rect(x1 - 3, ly, x1 - 1, sy - 1, legs)
    l.rect(x0, sy, x0 + 3, sy + 1, shoes); l.rect(x1 - 3, sy, x1, sy + 1, shoes)
    # torso
    l.rect(x0 + 1, ty, x1 - 1, ly - 1, top)
    l.vl(x1 - 1, ty, ly - 1, top2)
    l.hl(x0 + 1, x1 - 1, ly - 1, top2)
    # arms
    for side, pose in zip('LR', arms):
        ax = x0 - 1 if side == 'L' else x1        # outer sleeve column pair starts here
        sl = top if side == 'L' else top2
        if pose == 'down':
            l.rect(ax, ty + 1, ax + 1, ty + th - 2, sl)
            l.rect(ax, ty + th - 1, ax + 1, ty + th, skin)
            hands[side] = (ax, ty + th - 1)
        elif pose == 'up':                         # raised high, a gap off the head
            ox = ax - 2 if side == 'L' else ax + 2
            l.rect(ax, ty + 1, ax + 1, ty + 2, sl)
            l.rect(ox, ty - 5, ox + 1, ty + 1, sl)
            l.px(ox + (1 if side == 'L' else 0), ty + 1, sl)
            l.rect(ox, ty - 8, ox + 1, ty - 6, skin)
            hands[side] = (ox, ty - 8)
        elif pose == 'mid':                        # raised to shoulder height, elbow bent
            ox = ax - 1 if side == 'L' else ax + 1
            l.rect(ax, ty + 1, ax + 1, ty + 3, sl)
            l.rect(ox, ty - 2, ox + 1, ty + 1, sl)
            l.rect(ox, ty - 4, ox + 1, ty - 3, skin)
            hands[side] = (ox, ty - 4)
        elif pose == 'front':                      # hands at the waist, in front
            l.rect(ax, ty + 1, ax + 1, ty + 3, sl)
            hx = x0 + 1 if side == 'L' else x1 - 2
            l.rect(hx, ty + 3, hx + 1, ty + 4, sl)
            l.rect(hx, ty + 5, hx + 1, ty + 6, skin)
            hands[side] = (hx, ty + 5)
        elif pose == 'hip':
            ox = ax - 1 if side == 'L' else ax + 1
            l.rect(ox, ty + 1, ox + 1, ty + 3, sl)
            l.rect(ax, ty + 4, ax + 1, ty + 4, skin)
            hands[side] = (ax, ty + 4)
    # head
    l.rect(x0, y0 + 1, x1, y0 + hh - 2, skin)
    l.hl(x0 + 1, x1 - 1, y0, skin); l.hl(x0 + 1, x1 - 1, y0 + hh - 1, skin)
    l.vl(x1, y0 + 2, y0 + hh - 2, shade); l.hl(x0 + 2, x1 - 1, y0 + hh - 1, shade)
    # hair
    if hair:
        if hs in ('short', 'long', 'bun', 'side'):
            l.rect(x0, y0 + 1, x1, y0 + 2, hair); l.hl(x0 + 1, x1 - 1, y0, hair)
            l.vl(x0, y0 + 3, y0 + 4, hair); l.vl(x1, y0 + 3, y0 + 4, hair)
            if hs == 'side':
                l.hl(x0 + 1, x0 + 4, y0 + 3, hair)
        if hs == 'crop':
            l.rect(x0, y0 + 1, x1, y0 + 1, hair); l.hl(x0 + 1, x1 - 1, y0, hair)
            l.vl(x0, y0 + 2, y0 + 3, hair); l.vl(x1, y0 + 2, y0 + 3, hair)
        if hs == 'long':
            l.rect(x0 - 1, y0 + 2, x0, y0 + hh, hair); l.rect(x1, y0 + 2, x1 + 1, y0 + hh, hair)
        if hs == 'bun':
            l.rect(x0 + 3, y0 - 3, x1 - 3, y0 - 1, hair)
        if hs == 'curly':
            l.rect(x0 - 1, y0 - 1, x1 + 1, y0 + 2, hair); l.hl(x0, x1, y0 - 2, hair)
            l.vl(x0 - 1, y0 + 3, y0 + 5, hair); l.vl(x1 + 1, y0 + 3, y0 + 5, hair)
            l.vl(x0, y0 + 3, y0 + 3, hair); l.vl(x1, y0 + 3, y0 + 3, hair)
    # face
    ey = y0 + 4
    ex0, ex1 = x0 + 2, x1 - 2
    if lit:                                         # lit forehead / cheekbone plane, top-left
        l.hl(x0 + 2, x0 + 4, y0 + 3, lit)
    if eyes == 'dot':
        l.vl(ex0, ey, ey + 1, 'k'); l.vl(ex1, ey, ey + 1, 'k')
    elif eyes == 'glint':                           # deep faces: dark eye with 1px off-white glint
        l.vl(ex0, ey, ey + 1, 'k'); l.vl(ex1, ey, ey + 1, 'k')
        l.px(ex0, ey, 'w'); l.px(ex1, ey, 'w')
    elif eyes == 'shut':
        l.hl(ex0 - 1, ex0, ey + 1, 'k'); l.hl(ex1, ex1 + 1, ey + 1, 'k')
    if brows == 'angry':
        l.px(ex0 - 1, ey - 1, 'k'); l.px(ex0, ey - 1, 'k'); l.px(ex0 + 1, ey, 'k')
        l.px(ex1 + 1, ey - 1, 'k'); l.px(ex1, ey - 1, 'k'); l.px(ex1 - 1, ey, 'k')
    elif brows == 'stern':
        l.hl(ex0 - 1, ex0 + 1, ey - 1, 'k'); l.hl(ex1 - 1, ex1 + 1, ey - 1, 'k')
    cx = x0 + hw // 2
    if mouth == 'smile':
        l.px(cx - 2, ey + 2, 'k'); l.hl(cx - 1, cx, ey + 3, 'k'); l.px(cx + 1, ey + 2, 'k')
    elif mouth == 'shout':
        l.rect(cx - 1, ey + 2, cx, ey + 3, 'k'); l.hl(cx - 1, cx, ey + 4, 'k')
    elif mouth == 'flat':
        l.hl(cx - 1, cx, ey + 3, 'k')
    elif mouth == 'smirk':
        l.hl(cx - 1, cx + 1, ey + 3, 'k'); l.px(cx + 2, ey + 2, 'k')
    elif mouth == 'frown':
        l.hl(cx - 1, cx, ey + 3, 'k'); l.px(cx - 2, ey + 4, 'k'); l.px(cx + 1, ey + 4, 'k')
    return hands




def cash_brick(l, x0, y0, w=6, h=4):
    l.rect(x0, y0, x0 + w - 1, y0 + h - 1, 'n')
    for y in range(y0 + 1, y0 + h, 2):
        l.hl(x0, x0 + w - 1, y, 'N')
    l.vl(x0 + w // 2 - 1, y0, y0 + h - 1, 'w')


# ---------------------------------------------------------------- Kingpin
def kingpin():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfc6b6',
           'p': '#5e3a55', 'P': '#563450',                 # plum wallpaper
           'o': '#8a5434', 'O': '#6a3d25', 'd': '#a86c44',  # mahogany
           'f': '#7d6a5e', 'F': '#665548',                 # floor boards
           'g': '#8d9296', 'G': '#62676c',                 # steel safe
           'y': '#f2d27a', 'b': '#c9a24a',                 # brass / lamp glow
           'l': '#3f8a5c', 'L': '#2c6a45',                 # green: lamp shade, plant
           'n': '#8fb877', 'N': '#5d8a50',                 # cash
           '1': '#c2457f', '2': '#8f2f5d',                 # magenta suit
           'a': OLIVE[0], 'A': OLIVE[1],
           'h': '#2f2733', 'q': '#2c3558', 'Q': '#41507c'}  # hat, night window

    c.rect(0, 0, 63, 33, 'p')
    for x in range(3, 64, 6):
        c.vl(x, 0, 27, 'P')
    c.rect(0, 28, 63, 33, 'O'); c.hl(0, 63, 28, 'o')      # wainscot
    c.rect(0, 34, 63, 63, 'f')
    for y in (39, 45, 52, 60):
        c.hl(0, 63, y, 'F')
    c.ell(-6, 44, 69, 66, '2')                             # rug
    c.ell(-3, 46, 66, 64, '1', only='2')
    c.ell(0, 48, 63, 62, '2', only='1')

    def window(l):
        l.rect(22, 3, 41, 21, 'o'); l.rect(24, 5, 39, 19, 'q')
        l.ell(33, 7, 37, 11, 'y')                           # full moon
        for x0, x1, top in ((24, 27, 13), (28, 30, 10), (31, 34, 15), (35, 39, 12)):
            l.rect(x0, top, x1, 19, 'Q')
        l.pts('y', [(25, 15), (29, 12), (29, 16), (32, 17), (37, 14), (36, 17)])
        l.hl(22, 41, 21, 'O')
    c.paste(obj(window))

    def safe(l):
        l.rect(2, 12, 18, 14, 'g')
        l.rect(2, 15, 18, 38, 'G'); l.rect(3, 16, 17, 37, 'g')
        l.rect(5, 18, 15, 35, 'G'); l.rect(6, 19, 14, 34, 'g')
        l.ell(7, 22, 12, 27, 'G'); l.ell(8, 23, 11, 26, 'b'); l.vl(9, 23, 24, 'k')
        l.rect(12, 29, 13, 32, 'G')
        l.rect(3, 39, 5, 40, 'G'); l.rect(15, 39, 17, 40, 'G')
    c.paste(obj(safe))

    def plant(l):
        l.poly([(55, 37), (63, 37), (62, 47), (56, 47)], 'O'); l.hl(55, 63, 37, 'o')
        for P in ([(59, 36), (54, 24), (57, 23), (60, 34)], [(60, 36), (63, 20), (65, 22), (62, 36)]):
            l.poly(P, 'l')
        l.poly([(60, 36), (63, 20), (65, 22), (62, 36)], 'L', only='l')
    c.paste(obj(plant))

    def boss(l):
        x0, y0 = 42, 23
        h = figure(l, x0, y0, 'a', 'A', top='1', top2='2', legs='2', shoes='h',
                   arms=('down', 'hip'), mouth='smirk', brows='stern', hw=12, hh=11, th=9, lh=4)
        ty = y0 + 11
        l.poly([(x0 + 3, ty), (x0 + 9, ty), (x0 + 6, ty + 4)], 'w'); l.vl(x0 + 6, ty + 1, ty + 4, 'h')   # shirt V, dark tie
        l.rect(x0 + 1, y0 - 4, x0 + 10, y0, 'h'); l.hl(x0 + 2, x0 + 9, y0 - 5, 'h'); l.rect(x0 + 1, y0 - 1, x0 + 10, y0, '1')
        l.rect(x0 + 4, y0 - 5, x0 + 7, y0 - 4, '2')        # crown dent
        l.hl(x0 - 2, x0 + 13, y0 + 1, 'h')                  # brim
        l.hl(x0, x0 + 11, y0 + 2, 'A')
        l.line(x0 + 2, ty, x0 + 5, ty + 5, '2'); l.line(x0 + 10, ty, x0 + 7, ty + 5, '2')  # lapels
        l.hl(x0 + 8, x0 + 9, ty + 2, 'w')                   # pocket square
        x, y = h['L']
        cash_brick(l, x - 3, y + 1, 6, 4)                    # a wad in his fist
        l.rect(x, y, x + 1, y, 'a')
    c.paste(obj(boss))

    def desk(l):
        l.poly([(6, 38), (38, 38), (41, 43), (3, 43)], 'd')
        l.hl(3, 41, 43, 'o')
        l.rect(4, 44, 40, 56, 'o')
        l.rect(6, 46, 19, 50, 'O'); l.rect(7, 47, 18, 49, 'o')
        l.rect(25, 46, 38, 50, 'O'); l.rect(26, 47, 37, 49, 'o')
        l.hl(11, 13, 48, 'b'); l.hl(30, 32, 48, 'b')
        l.rect(6, 52, 38, 55, 'O')
    c.paste(obj(desk))

    def lamp(l):
        l.rect(7, 38, 14, 39, 'b'); l.vl(10, 33, 37, 'b')
        l.poly([(5, 33), (7, 29), (14, 29), (16, 33)], 'l')
        l.poly([(11, 29), (14, 29), (16, 33), (12, 33)], 'L', only='l')
        l.hl(6, 15, 33, 'y')
    c.paste(obj(lamp))

    def cash(l):
        cash_brick(l, 21, 34, 6, 6)
        cash_brick(l, 28, 36, 6, 4)
    c.paste(obj(cash))
    return c.rows(), pal


# ---------------------------------------------------------------- Mob
def mob():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1',
           's': '#1f2742', 'S': '#2b3658',                 # night sky
           'h': '#3d3245', 'H': '#2b2232',                 # houses
           'y': '#f6d36a', 'e': '#ef7d36',                 # lit windows / flame
           'c': '#5c5560', 'C': '#4a434f',                 # cobbles
           't': '#a8703f', 'm': '#c9cdd1',                 # wood, iron
           '1': '#d9534a', '2': '#a83a35', 'n': '#2a1d18', 'g': '#5f7a52'}
    pal['a'], pal['A'] = PALE; pal['b'], pal['B'] = LIGHT; pal['d'], pal['D'] = OLIVE
    pal['u'], pal['U'] = MED; pal['v'], pal['V'] = VDEEP; pal['L'] = '#6e4632'

    c.rect(0, 0, 63, 63, 's')
    c.ell(46, 3, 53, 10, 'w'); c.ell(48, 2, 55, 9, 's', only='w')
    c.pts('w', [(8, 3), (30, 2), (38, 8), (22, 9), (59, 13)])
    c.poly([(-1, 15), (8, 6), (17, 15)], 'H'); c.rect(0, 15, 15, 46, 'h')
    c.poly([(46, 19), (55, 11), (65, 19)], 'H'); c.rect(48, 19, 63, 46, 'h')
    c.poly([(16, 22), (24, 15), (32, 22)], 'H'); c.rect(18, 22, 30, 40, 'h')
    for (x, y) in ((6, 9), (53, 13), (22, 25)):
        c.rect(x, y, x + 3, y + 4, 'y'); c.hl(x, x + 3, y + 2, 'e')
    c.poly([(-1, 64), (18, 37), (46, 37), (65, 64)], 'c')
    for y in range(39, 64, 3):
        off = 0 if (y // 3) % 2 else 3
        for x in range(off, 64, 6):
            if c.get(x, y) == 'c':
                c.hl(x, x + 3, y, 'C')

    def pitchfork(l, x, ytop, ybot):
        l.vl(x, ytop + 4, ybot, 't')
        l.hl(x - 2, x + 2, ytop + 4, 'm')
        l.vl(x - 2, ytop + 1, ytop + 3, 'm'); l.vl(x, ytop, ytop + 3, 'm'); l.vl(x + 2, ytop + 1, ytop + 3, 'm')

    def torch(l, x, ytop, ybot):
        l.vl(x, ytop + 9, ybot, 't'); l.vl(x + 1, ytop + 9, ybot, 't')
        l.rect(x - 1, ytop + 8, x + 2, ytop + 9, 'n')
        l.poly([(x - 2.5, ytop + 8), (x - 2, ytop + 4), (x, ytop), (x + 1, ytop + 2), (x + 2, ytop + 1),
                (x + 4, ytop + 5), (x + 3.5, ytop + 8)], 'e')
        l.rect(x, ytop + 4, x + 1, ytop + 7, 'y'); l.px(x - 1, ytop + 6, 'y'); l.px(x + 2, ytop + 6, 'y')

    def fist_on(l, h, side, skin, pole_x=None):
        x, y = h[side]
        l.rect(x, y, x + 1, y + 2, skin)

    def back_l(l):
        h = figure(l, 13, 21, 'a', 'A', hair='y', hs='short', top='2', top2='n', legs='n',
                   arms=('up', 'down'), mouth='shout', brows='angry')
        fist_on(l, h, 'L', 'a')
    c.paste(obj(back_l))

    def back_r(l):
        h = figure(l, 44, 21, 'u', 'U', hair='n', hs='curly', top='m', top2='c', legs='n',
                   arms=('down', 'up'), mouth='shout', brows='angry')
        fist_on(l, h, 'R', 'u')
    c.paste(obj(back_r))

    def front_l(l):
        h = figure(l, 5, 30, 'd', 'D', hair='n', hs='long', top='1', top2='2', legs='n',
                   arms=('up', 'down'), mouth='shout', brows='angry')
        x, y = h['L']
        pitchfork(l, x + 1, y - 9, y + 13)
        fist_on(l, h, 'L', 'd')
    c.paste(obj(front_l))

    def front_r(l):
        h = figure(l, 51, 31, 'v', 'V', hair='n', hs='crop', top='2', top2='n', legs='n',
                   arms=('down', 'down'), mouth='flat', eyes='glint', lit='U')
        x, y = h['R']
        pitchfork(l, x + 1, 17, y + 4)
        l.rect(x, y - 1, x + 2, y + 1, 'v'); l.px(x + 1, y - 1, 't')
    c.paste(obj(front_r))

    def lead(l):
        h = figure(l, 27, 29, 'b', 'B', hair='t', hs='short', top='1', top2='2', legs='n',
                   arms=('mid', 'up'), mouth='shout', brows='angry', hw=11, hh=10)
        x, y = h['R']
        torch(l, x, y - 12, y + 7)
        fist_on(l, h, 'R', 'b')
        fist_on(l, h, 'L', 'b')
    c.paste(obj(lead))
    return c.rows(), pal


# ---------------------------------------------------------------- Tiebreaker
def tiebreaker():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfd6d8',
           'b': '#9cc8e0', 'B': '#c4e0ea',
           'g': '#6fa553', 'G': '#5c9145',
           'r': '#c9534a', 'R': '#a63d36',
           'x': '#26262b', 'v': VDEEP[0], 'V': VDEEP[1], 'L': '#6e4632',
           'y': '#f0c548', 'Y': '#c08f22', 'f': '#f0d24a', 'F': '#d9a52e', 'n': '#18110e'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 4, 'B')
    c.rect(0, 14, 63, 19, 'r'); c.rect(0, 18, 63, 19, 'R')
    for x in (4, 22, 40, 58):
        c.rect(x, 15, x + 9, 16, 'w')
    c.rect(0, 20, 63, 63, 'g')
    for y0, hgt in ((25, 3), (34, 4), (45, 5), (57, 6)):
        c.rect(0, y0, 63, y0 + hgt, 'G')
    c.hl(0, 63, 22, 'w')
    c.ring(12, 50, 52, 72, 'w')                                       # centre circle

    net = C(N)
    for y in range(8, 22):
        for x in range(5, 29):
            if (x + y) % 3 == 0 or (x - y) % 3 == 0:
                net.px(x, y, 'W')
    c.paste(net)

    def goal(l):
        l.rect(3, 6, 30, 7, 'w')
        l.rect(3, 6, 4, 22, 'w'); l.rect(29, 6, 30, 22, 'w')
    c.paste(obj(goal))

    def flag(l):
        l.vl(57, 9, 26, 'w')
        l.poly([(58, 9), (58, 15), (64, 12)], 'f')
        l.poly([(58, 12), (58, 15), (64, 12)], 'F', only='f')
    c.paste(obj(flag))

    def ref(l):
        x0, y0, hw, hh, th = 20, 25, 12, 11, 9
        figure(l, x0, y0, 'v', 'V', hair='n', hs='crop', top='w', top2='W', legs='x', shoes='x',
               arms=('down', None), mouth='smile', eyes='glint', lit='L', hw=hw, hh=hh, th=th, lh=5)
        ty = y0 + hh
        # flicking arm: sleeve out to the side, forearm up, thumb up
        l.rect(32, ty + 1, 35, ty + 3, 'w')
        l.rect(36, ty - 4, 37, ty + 3, 'v'); l.vl(37, ty - 4, ty + 3, 'V')
        l.rect(35, ty - 7, 38, ty - 5, 'v'); l.px(38, ty - 8, 'v'); l.vl(38, ty - 7, ty - 5, 'V')
        l.px(35, ty - 7, 'V')
        for x in range(x0 + 2, x0 + hw - 1, 2):
            l.recolor('wW', 'x', (x, ty, x, ty + th - 1))
        l.recolor('wW', 'x', (x0 - 1, ty + 2, x0, ty + 2)); l.recolor('wW', 'x', (33, ty + 1, 33, ty + 3))
        l.rect(x0 + 4, ty, x0 + 7, ty, 'x')
    c.paste(obj(ref))

    def coin(l):
        l.ell(35, 19, 40, 24, 'Y'); l.ell(35, 19, 39, 23, 'y', only='Y')
        l.vl(37, 20, 22, 'Y')
    c.paste(obj(coin))
    return c.rows(), pal


# ---------------------------------------------------------------- Launderers
def launderers():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfc8bb',
           't': '#b9d3cf', 'T': '#a6c4bf',
           'f': '#d8cdb4', 'F': '#c4b79b',
           'g': '#8e9597', 'G': '#6b7274', 'q': '#4a6170', 'Q': '#5e7a8a',
           'n': '#8fb877', 'N': '#5d8a50',
           'u': '#7fb0d8', 'U': '#5a8cb8',
           'o': '#c9a066', 'O': '#9e7840',
           '1': '#a9aeac', '2': '#7d8381',
           'a': LIGHT[0], 'A': LIGHT[1], 'e': DEEP[0], 'E': DEEP[1], 'L': '#96613f',
           'h': '#1f1714', 'r': '#b0552c'}
    c.rect(0, 0, 63, 63, 't')
    for y in range(4, 37, 6):
        c.hl(0, 63, y, 'T')
    for x in range(5, 64, 6):
        c.vl(x, 0, 36, 'T')
    for y in range(37, 64):
        for x in range(64):
            c.px(x, y, 'f' if ((x // 6) + ((y - 37) // 5)) % 2 else 'W')

    c.hl(24, 63, 5, 'G')

    def shirt(l, x0, y0):
        l.rect(x0 + 2, y0, x0 + 8, y0 + 9, 'u'); l.rect(x0, y0, x0 + 1, y0 + 4, 'u'); l.rect(x0 + 9, y0, x0 + 10, y0 + 4, 'u')
        l.vl(x0 + 8, y0 + 1, y0 + 9, 'U'); l.hl(x0 + 4, x0 + 6, y0, 'U')
    c.paste(obj(lambda l: shirt(l, 27, 6)))

    def bill(l, x0, y0):
        l.rect(x0, y0, x0 + 8, y0 + 5, 'n'); l.ell(x0 + 3, y0 + 1, x0 + 5, y0 + 4, 'N')
        l.pts('N', [(x0 + 1, y0 + 1), (x0 + 7, y0 + 4)])
    c.paste(obj(lambda l: bill(l, 41, 6)))
    c.paste(obj(lambda l: bill(l, 53, 6)))
    for x in (29, 35, 43, 55):
        c.paste(obj(lambda l, x=x: l.rect(x, 4, x, 7, 'O')))

    def washer(l, x0):
        l.rect(x0, 14, x0 + 17, 16, 'W')
        l.rect(x0, 17, x0 + 17, 45, 'w'); l.vl(x0 + 17, 17, 45, 'W')
        l.hl(x0, x0 + 17, 20, 'W')
        l.rect(x0 + 2, 18, x0 + 6, 19, 'g'); l.ell(x0 + 13, 18, x0 + 15, 19, 'G')
        l.ell(x0 + 1, 23, x0 + 16, 38, 'g')
        l.ell(x0 + 3, 25, x0 + 14, 36, 'q')
        l.ell(x0 + 9, 25, x0 + 14, 36, 'Q', only='q')
        l.rect(x0 + 4, 29, x0 + 8, 31, 'n'); l.px(x0 + 6, 30, 'N')
        l.rect(x0 + 8, 32, x0 + 12, 34, 'n'); l.px(x0 + 10, 33, 'N')
        l.rect(x0 + 7, 26, x0 + 10, 27, 'n'); l.px(x0 + 8, 26, 'N')
        l.hl(x0, x0 + 17, 43, 'W')
    c.paste(obj(lambda l: washer(l, 1)))

    def person_a(l):
        h = figure(l, 23, 29, 'e', 'E', hair='h', hs='curly', top='1', top2='2', legs='G', shoes='k',
                   arms=('mid', 'down'), mouth='smile', eyes='glint', lit='O')
        x, y = h['L']
        bill(l, x - 6, y - 2)
        l.rect(x, y, x + 1, y + 1, 'e')
    c.paste(obj(person_a))

    def person_b(l):
        figure(l, 45, 27, 'a', 'A', hair='r', hs='bun', top='2', top2='G', legs='q', shoes='k',
               arms=('front', 'front'), mouth='smile')
    c.paste(obj(person_b))

    def basket(l):
        heap = C(N); heap.ell(41, 37, 60, 44, '#')
        for y in range(37, 42):
            for x in range(40, 62):
                if heap.get(x, y) != '#':
                    continue
                bx = (x - 40 + (3 if ((y - 37) // 2) % 2 else 0)) % 5
                l.px(x, y, 'N' if (y - 37) % 2 == 1 or bx == 4 else 'n')
        l.poly([(40, 41), (61, 41), (59, 48), (42, 48)], 'o')
        l.hl(41, 60, 45, 'O')
        l.rect(40, 41, 61, 42, 'O')
        l.rect(42, 40, 44, 42, 'a'); l.rect(57, 40, 59, 42, 'a')
    c.paste(obj(basket))
    return c.rows(), pal


PORTRAITS = [
    ('kingpin', 'Kingpin', kingpin),
    ('mob', 'Mob', mob),
    ('tiebreaker', 'Tiebreaker', tiebreaker),
    ('launderers', 'Launderers', launderers),
]
