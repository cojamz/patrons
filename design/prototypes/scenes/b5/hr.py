import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


# HR counts as 4 members (Cory, Oct 29), and the one-person picture read as a doctor:
# four people behind one office desk, an org chart on the wall, an "HR" sign on the desk.
def hr():
    c = C(N)
    pal = base(COOL, 'grey', p='#c9d2cf', o='#a0784e', O='#7e5a36', m='#f4ede1', M='#a69f90',
               a=PALE[0], A=PALE[1], b=LIGHT[0], B=LIGHT[1], d=DEEP[0], D=DEEP[1],
               H='#2a1c17', e='#b8612f', u='#4f86c6',
               n='#3c4560', N='#2e3549', c='#b5835a', C='#93663f', y='#e3c27a')
    c.rect(0, 0, 63, 63, 'p')

    def chart(l):                                   # the org chart: one box, a line down, three boxes
        l.rect(25, 2, 38, 6, 'm')
        l.vl(31, 7, 8, 'M'); l.vl(32, 7, 8, 'M'); l.hl(14, 49, 9, 'M')
        for x in (14, 31, 48):
            l.vl(x, 9, 10, 'M'); l.vl(x + 1, 9, 10, 'M')
            l.rect(x - 4, 11, x + 5, 14, 'm')
    bg(c, chart, 'M')
    c.hl(28, 35, 4, 'M')
    for x in (14, 31, 48):
        c.hl(x - 2, x + 3, 12, 'M')

    def staff(cx, hy, skin, hs, hk, hdk, mouth, brows, shirt, sdk, arms, hands, front=None, top=None):
        t = C(N)
        person(t, cx, hy, hs=hs, hk=hk, hdk=hdk, mouth=mouth, brows=brows, shirt=shirt, sdk=sdk, sw=6, ww=6, th=18,
               behind=True, arms=arms, hands=hands, front=front, top=top,
               DK={'u': 'N', 'w': 'M', 'y': 'C', 'n': 'N', 'c': 'C', '1': '2'})
        k = {'s': skin[0], 'S': skin[1]}            # skin is a pair of palette keys
        for row in t.g:
            for i, ch in enumerate(row):
                row[i] = k.get(ch, ch)
        c.paste(t)

    def ty_(hy):
        return hy + 15                              # collar row

    def shirt_tie(cx, hy):                          # an open jacket over a white shirt and a tie
        y = ty_(hy)
        return lambda f: (f.poly([(cx - 2, y), (cx + 1, y), (cx + 1, y + 9), (cx - 2, y + 9)], 'w'),
                          f.vl(cx - 1, y + 1, y + 9, 'u'), f.vl(cx, y + 1, y + 9, 'u'), f.px(cx, y + 4, 'N'))

    def badge(cx, hy, blouse=None):                 # a lanyard and an ID card at mid-chest
        y = ty_(hy)
        def f_(f):
            if blouse:
                f.pts('w', [(cx - 2, y), (cx - 1, y + 1), (cx, y + 1), (cx + 1, y)])
            f.pts('u', [(cx - 3, y + 1), (cx - 3, y + 2), (cx - 2, y + 3), (cx + 2, y + 1), (cx + 2, y + 2), (cx + 1, y + 3)])
            f.vl(cx - 1, y + 4, y + 4, 'u'); f.vl(cx, y + 4, y + 4, 'u')
            f.rect(cx - 2, y + 5, cx + 1, y + 7, 'w'); f.hl(cx - 1, cx, y + 6, 'N')
        return f_

    def folder(f):                                  # the lead holds a manila folder
        p = layer(); p.rect(35, 39, 45, 47, 'y'); p.hl(35, 45, 39, 'C'); p.rect(41, 37, 45, 38, 'y')
        p.hl(37, 43, 42, 'C'); p.hl(37, 41, 44, 'C')
        over(f, p, {'y': 'C'})
        h_ = layer(); hand(h_, 34, 44, 'grip', 's', 'S'); over(f, h_, {'n': 'N', '1': '2'})

    # back to front, left to right; heights and clothes vary so it isn't a row of clones
    staff(9, 20, 'aA', 'side', 'e', 'O', 'smile', 'soft', 'c', 'C',
          [([(4, 40), (3, 46), (6, 49)], 4, 'c')], [(5, 48, 'flat', False)], front=badge(9, 20, blouse=True))
    staff(55, 19, 'dD', 'short', 'H', 'O', 'smile', 'soft', '1', '2',
          [([(60, 39), (61, 45), (58, 49)], 4, '1')], [(56, 48, 'flat', True)], front=shirt_tie(55, 19))
    staff(24, 17, 'sS', 'bun', 'H', 'O', 'grin', 'soft', '1', '2',
          [([(19, 37), (18, 44), (21, 49)], 4, '1')], [(19, 48, 'flat', False)], front=badge(24, 17, blouse=True))
    staff(40, 18, 'bB', 'crop', 'O', 'H', 'smile', 'soft', 'n', 'N',
          [([(34, 38), (32, 43), (35, 45)], 4, 'n')], [], front=shirt_tie(40, 18), top=folder)

    def desk(l):                                    # the desk front, a name sign, papers and a mug
        l.rect(0, 50, 63, 63, 'o'); l.hl(0, 63, 50, 'O'); l.hl(0, 63, 51, 'O')
        l.rect(24, 54, 39, 62, 'O'); l.rect(25, 55, 38, 61, 'm')
        l.rect(8, 44, 17, 49, 'O'); l.rect(9, 45, 16, 47, 'm'); l.hl(9, 16, 46, 'M')   # an in-tray
        l.rect(48, 45, 51, 49, 'u'); l.hl(48, 51, 45, 'N'); l.pts('N', [(52, 46), (53, 46), (53, 47), (52, 48)])
    bg(c, desk, None)
    # "HR" on the sign, 4x5 letters
    c.stamp(27, 56, ['k..k.kkk.', 'k..k.k..k', 'kkkk.kkk.', 'k..k.k.k.', 'k..k.k..k'])
    return c.rows(), pal


PORTRAIT = ('benders.hr', hr)
