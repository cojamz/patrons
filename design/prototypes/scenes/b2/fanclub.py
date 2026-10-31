import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def fanclub():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d8cfc0', 'b': '#3d3a5c', 'B': '#46426a', 'y': '#f3d27a', 'Y': '#d9aa45',
           'g': '#9aa1a8', 'G': '#737a82', 'm': '#5a4f78',
           '1': GREEN[0], '2': GREEN[1],
           'd': DEEP[0], 'D': DEEP[1], 'e': '#8c5a3a', 'h': '#33231d', 'a': LIGHT[0], 'A': LIGHT[1],
           'H': '#231816', 'r': '#b0552c', 'R': '#8a3f22', 'o': '#7a2a2a',
           'v': OLIVE[0], 'V': OLIVE[1]}
    c.rect(0, 0, 63, 63, 'b')
    c.rect(0, 30, 63, 63, 'B')
    # stage lights in the dark, small and bright
    for x in (6, 22, 42, 58):
        c.rect(x - 1, 2, x + 1, 3, 'm'); c.hl(x - 1, x + 1, 4, 'y')

    # Fan Club counts as 3 members (Cory, Oct 29): three fans at the rail
    # fan 3 (olive), at the back right: fist up
    person(c, 48, 18, 14, 'v', 'V', '1', '2', th=32, sw=6, ww=6,
           arms=[([(60, 36), (63, 27), (60, 15)], 4, '1')], hands=[(58, 10, 'fist', False)],
           mouth='grin', brows='soft', brow='H', hr=('short', 'H', 'h'))

    # fan 2 (light): clapping, green scarf
    def sc(f, DK):
        f.rect(33, 34, 43, 35, 'W'); f.rect(35, 36, 37, 42, 'W'); f.hl(35, 37, 39, '2')
    person(c, 31, 21, 14, 'a', 'A', '1', '2', th=29, sw=7, ww=6, front=sc,
           arms=[([(32, 39), (29, 33), (31, 24)], 4, '1'), ([(45, 39), (48, 33), (46, 24)], 4, '1')],
           hands=[(29, 20, 'fist', False), (45, 20, 'fist', True)],
           mouth='open', brows='soft', brow='r', hr=('bun', 'r', 'R', 'R'), dk={'W': 'W'})

    # fan 1 (brown, lead): holding a star sign overhead
    def sign(f, DK):
        f.rect(3, 1, 30, 11, 'w'); f.hl(3, 30, 11, 'W'); f.vl(30, 1, 11, 'W')
        f.stamp(13, 2, ['...1...', '...1...', '1111111', '.11111.', '..111..', '.11.11.', '.1...1.'])

    def hd_hair(l):
        hair(l, 10, 19, 14, 'afro', 'h', 'H')
    person(c, 10, 19, 14, 'd', 'D', '1', '2', th=30, sw=8, ww=7,
           arms=[([(11, 37), (1, 26), (5, 14)], 4, '1'), ([(24, 37), (31, 26), (26, 14)], 4, '1')],
           hands=[(4, 10, 'grip', False), (25, 10, 'grip', True)],
           late=sign, mouth='grin', brows='soft', brow='H', hr=hd_hair, dk={'w': 'W', 'W': 'W'})

    def barrier(l):
        l.rect(0, 49, 63, 52, 'g'); l.hl(0, 63, 49, 'W')
        for x in (6, 54):
            l.rect(x, 53, x + 3, 63, 'g')
    bg(c, barrier, 'G')
    return c.rows(), pal


PORTRAIT = ('echo.mirror', fanclub)
