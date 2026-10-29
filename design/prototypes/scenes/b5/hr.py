import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def hr():
    c = C(N)
    pal = base(DEEP, 'grey', p='#c3cfd0', P='#b3c0c1', f='#8f9a9c', F='#7f8a8c', g='#9aa1a6', G='#767d83',
               o='#a0784e', O='#7e5a36', m='#f4ede1', M='#c9c4b8', l='#5f9a52', L='#46783e', a='#c76f4a',
               H='#160f0c', z='#2e2420', q='#3b3f48', y='#f0c548', u='#4f86c6')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def cabinet(l):                                 # filing cabinet
        l.rect(3, 18, 18, 52, 'g')
        for y in (19, 30, 41):
            l.rect(4, y + 1, 17, y + 9, 'g'); l.hl(4, 17, y + 10, 'G'); l.rect(9, y + 4, 12, y + 5, 'G')
    bg(c, cabinet, 'G')

    def poster(l):                                  # a heart poster
        l.rect(22, 4, 36, 15, 'M'); l.rect(23, 5, 35, 14, 'm'); l.stamp(26, 7, ['.aa.aa.', 'aaaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'])
    bg(c, poster, None)

    def plant(l):
        l.rect(51, 44, 59, 52, 'a')
        for (x, y) in ((49, 34), (55, 30), (58, 37), (52, 39)):
            l.ell(x, y, x + 5, y + 7, 'l')
    bg(c, plant, 'L')

    cx = 36
    DK = {'1': '2', 'o': 'O', 'm': 'M', 'q': 'q'}

    def front(f):                                   # dark top under an open grey cardigan, lanyard
        f.rect(cx - 2, 33, cx + 1, 46, 'q')
        f.pts('u', [(cx - 3, 33), (cx - 3, 34), (cx + 2, 33), (cx + 2, 34), (cx - 2, 35), (cx + 1, 35)])

    def clip(f):                                    # clipboard held to the chest
        p = layer(); p.rect(cx - 3, 37, cx + 7, 49, 'o'); p.rect(cx - 2, 39, cx + 6, 48, 'm')
        p.rect(cx + 1, 36, cx + 3, 38, 'g')
        for y in (41, 43, 45):
            p.hl(cx - 1, cx + 4 - (y == 45) * 2, y, 'M')
        over(f, p, DK)
        h_ = layer(); hand(h_, cx - 5, 43, 'grip', 's', 'S'); over(f, h_, DK)

    person(c, cx, 17, hs='long', hk='H', hdk='z', mouth='smile', brows='soft',
           shirt='1', sdk='2', sw=7, ww=7, th=14, pants='q', pdk='q', shoe='z', lh=6, front=front, DK=DK,
           arms=[([(cx - 6, 36), (cx - 8, 41), (cx - 4, 44)], 4, '1'),
                 ([(cx + 6, 36), (cx + 8, 42), (cx + 7, 47)], 4, '1')],
           hands=[(cx + 5, 47, 'fist', True)], top=clip)
    return c.rows(), pal


PORTRAIT = ('benders.hr', hr)
