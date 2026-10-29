import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def impressionist():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d8cfc0', 'b': '#4f5a62', 'B': '#58646c', 'f': '#8a5a34', 'F': '#74482a',
           'l': '#a87446', 'y': '#f3d27a', 'q': '#5e6a72',
           '1': GREEN[0], '2': GREEN[1], 'm': MAGENTA[0], 'M': MAGENTA[1], 'a': LIGHT[0], 'A': LIGHT[1],
           'r': '#c0602f', 'R': '#93451f', 'x': '#2f3a40', 'X': '#46525a', 'z': '#3a2a22', 'g': '#9aa1a8', 'G': '#6d7378'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 50, 63, 63, 'f'); c.hl(0, 63, 50, 'l')
    c.ell(18, 50, 58, 60, 'l')                                          # spotlight pool on the boards
    c.poly([(30, 0), (42, 0), (58, 50), (18, 50)], 'B')                 # the beam, a close value
    c.rect(34, 0, 38, 2, 'G'); c.hl(34, 38, 3, 'y')

    def poster(l):
        l.rect(3, 6, 21, 32, 'w'); l.rect(4, 7, 20, 31, 'W')
        P = layer()
        # the original act in flat tones, no face: hat, head, body, arm up on its left, hand on hip
        P.rect(9, 9, 13, 11, 'x'); P.hl(8, 14, 12, 'x')
        P.ell(9, 13, 13, 17, 'q')
        P.poly([(8, 18), (14, 18), (15, 26), (7, 26)], 'x')
        P.line(14, 19, 17, 15, 'x'); P.line(15, 19, 18, 15, 'x'); P.line(17, 15, 18, 10, 'x'); P.line(18, 15, 19, 10, 'x')
        P.line(8, 19, 6, 22, 'x'); P.line(6, 22, 8, 24, 'x')
        P.rect(8, 27, 9, 30, 'x'); P.rect(12, 27, 13, 30, 'x')
        l.paste(P)
        l.pts('M', [(12, 7), (12, 6)])                                  # pin
    bg(c, poster)

    def mic(p):
        pole(p, 21, 32, 52, 'g', 'G')
        p.rect(18, 53, 25, 54, 'G')

    def mic_head(f):
        f.rect(20, 28, 23, 31, 'X'); f.pts('g', [(21, 29)])

    def tophat(f):
        # magenta top hat, tipped to the right
        f.hl(27, 42, 12, 'm'); f.hl(29, 46, 11, 'm'); f.hl(27, 42, 12, 'M')
        f.rect(32, 5, 40, 10, 'm'); f.rect(33, 2, 41, 5, 'm')
        f.hl(32, 40, 9, 'M'); f.hl(32, 40, 10, 'M'); f.vl(40, 3, 8, 'M'); f.vl(41, 2, 5, 'M')

    def tache(l):
        c_, my = 37, 13 + 10
        l.pts('H' if False else 'R', [(c_ - 3, my), (c_ - 2, my), (c_ - 1, my), (c_ + 1, my), (c_ + 2, my), (c_ + 3, my), (c_ - 4, my + 1), (c_ + 4, my + 1)])
    person(c, 30, 13, 14, 'a', 'A', '1', '2', th=14, sw=7, ww=7,
           lg=dict(pants='x', pdark='X', shoe='z', lh=9, stance=1),
           arms=[([(43, 31), (48, 26), (49, 18)], 3, '1'), ([(31, 31), (26, 35), (29, 39)], 3, '1')],
           hands=[(47, 15, 'fist', False), (28, 38, 'fist', False)],
           mouth='flat', brows='soft', brow='R', hr=('short', 'r', 'R'), hat=tophat,
           face=tache, under_=mic, post=mic_head, dk={'m': 'M'})
    return c.rows(), pal


PORTRAIT = ('echo.tuningfork', impressionist)
