import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def anarchist():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', '1': GREY[0], '2': GREY[1],
           'p': '#c4bdb0', 'P': '#b4ad9f', 'f': '#8e8a84', 'F': '#7c7872', 'r': '#c9443c', 'R': '#a2342e',
           'm': '#e9b3ad', 's': '#d4d8dc', 'S': '#9aa1a8',
           'e': DEEP[0], 'E': DEEP[1], 'H': '#1d1512', 'h': '#3a2a22', 'z': '#55504a', 'n': '#3e4a5e', 'N': '#323c4e'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'f'); c.hl(0, 63, 50, 'F')
    for y in (14, 30):
        c.hl(0, 63, y, 'P')
    for x in (10, 44):
        c.vl(x, 0, 14, 'P'); c.vl(x + 16, 15, 30, 'P')

    def tag(l):
        l.ring(36, 6, 60, 30, 'r'); l.ring(37, 7, 59, 29, 'r')
        l.line(48, 8, 40, 28, 'r'); l.line(49, 8, 41, 28, 'r')
        l.line(48, 8, 56, 28, 'r'); l.line(49, 8, 57, 28, 'r')
        l.line(43, 21, 54, 19, 'r'); l.line(43, 22, 54, 20, 'r')
        l.pts('r', [(41, 31), (41, 32), (57, 31), (57, 33), (40, 29)])   # drips
    bg(c, tag, None)
    DK = {'1': '2', 'e': 'E', 'n': 'N', 's': 'S'}

    def hood(f):
        f.poly([(13, 27), (26, 27), (24, 31), (15, 31)], '2'); f.hl(15, 24, 28, '1'); f.rect(16, 38, 23, 41, '2'); f.hl(16, 23, 38, '1')

    def can(f):
        f.rect(32, 17, 35, 25, 's'); f.vl(35, 17, 25, 'S'); f.rect(33, 15, 34, 16, 'r'); f.hl(32, 35, 19, 'r')
    person(c, DK, 12, 13, ('e', 'E'), 'crop', 'H', 'h', mouth='smirk', brows='stern', brow='H', cloth='1', cdark='2',
           sw=8, ww=7, th=14, pants=('n', 'N'), shoe='z', lh=8, stance=1, front=hood, top=can,
           arms=[([(26, 31), (29, 35), (33, 28)], 3, '1'), ([(12, 31), (10, 37), (12, 42)], 3, '1')],
           hands=[(31, 24, 'grip', False), (10, 42, 'fist', False)])
    for (x, y) in ((37, 14), (39, 16), (37, 17), (40, 13), (38, 11)):
        c.px(x, y, 'm')                                             # mist from the nozzle, no sparks
    return c.rows(), pal


PORTRAIT = ('benders.anarchist', anarchist)
