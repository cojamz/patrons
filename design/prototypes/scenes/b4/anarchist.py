import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def anarchist():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', '1': GREY[0], '2': GREY[1],
           'p': '#c4bdb0', 'P': '#b4ad9f', 'f': '#8e8a84', 'F': '#7c7872', 'r': '#c9443c', 'R': '#a2342e',
           'm': '#e9b3ad', 's': '#d4d8dc', 'S': '#9aa1a8',
           'e': LIGHT[0], 'E': LIGHT[1], 'H': '#c2457f', 'h': '#8f2f5d', 'x': '#4b4652', 'X': '#3a3640', 'y': '#f0c548', 'z': '#55504a', 'n': '#3e4a5e', 'N': '#323c4e'}
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
    DK = {'1': '2', 'e': 'E', 'n': 'N', 's': 'S', 'x': 'X'}

    def jacket(f):                                   # grey studded jacket, open over a dark tee
        f.poly([(16, 28), (23, 28), (22, 41), (17, 41)], 'x')
        for (x, y) in ((14, 28), (15, 29), (16, 30), (17, 31)):
            f.px(x, y, '2'); f.px(39 - x, y, '2')
        f.pts('w', [(12, 31), (14, 30), (25, 30), (27, 31)])          # shoulder studs
        f.rect(23, 35, 25, 37, 'r'); f.rect(13, 36, 15, 38, 'y')      # patches

    def mohawk(f):                                   # dyed crest on a shaved head
        f.rect(17, 9, 21, 14, 'H'); f.rect(20, 9, 21, 14, 'h')
        for (x, y) in ((17, 8), (19, 7), (21, 8)):
            f.rect(x, y, x + 1, y + 1, 'H')

    def can(f):
        f.rect(32, 17, 35, 25, 's'); f.vl(35, 17, 25, 'S'); f.rect(33, 15, 34, 16, 'r'); f.hl(32, 35, 19, 'r')
    person(c, DK, 12, 13, ('e', 'E'), None, 'H', 'h', mouth='smirk', brows='stern', brow='h', cloth='1', cdark='2',
           sw=8, ww=7, th=14, pants=('n', 'N'), shoe='z', lh=8, stance=1, front=jacket, top=lambda f: (mohawk(f), can(f)),
           arms=[([(26, 31), (29, 35), (33, 28)], 3, '1'), ([(12, 31), (10, 37), (12, 42)], 3, '1')],
           hands=[(31, 24, 'grip', False), (10, 42, 'fist', False)])
    for (x, y) in ((37, 14), (39, 16), (37, 17), (40, 13), (38, 11)):
        c.px(x, y, 'm')                                             # mist from the nozzle, no sparks
    return c.rows(), pal


PORTRAIT = ('benders.anarchist', anarchist)
