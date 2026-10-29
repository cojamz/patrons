# Launderers: the original Launderer (Cory's favorite: red dotted headscarf, smile, apron) in front on the left,
# pixel-for-pixel, and a second launderer beside him: blue dotted kerchief with a bow on top, a clothespin,
# apron, the striped towel over her shoulder. Soap bubbles in the table's colors.
import json
from lib import *
REF = json.load(open("/home/user/patrons/design/prototypes/art-v2/portraits/reference.json"))[0]['px']

def draw():
    g = new()
    # --- the second launderer, behind on the right ---
    torso(g, cx=24, top=21, half0=4, step=3, maxhalf=8, x0=17)
    P(g, 21, 22, ['W', 'W', 'WWWWWV', 'WWWWWV', 'WWWWWV', 'WWWWVV', 'WWWWWV', 'WWWVVV', 'WWWWVV', 'WWWVVV'])  # apron
    P(g, 26, 22, ['V', 'V'])
    P(g, 27, 20, ['  WW', ' WWWW', 'WWWWW', 'UUUUU', 'WWWWW', 'WWWWV', 'UUUUV', 'WWWWV', 'WWWVV', 'UUUVV', 'WWVVV', 'WWVVV'])  # towel
    neck(g, 22, 20, 4)
    face(g, 19, 8, 10, 13, ear_row=6)
    P(g, 18, 5, """
     UuU
   UUUuUUU
  UUiUUUUUUu
 UUUUUUiUUUUu
 UUiUUUUUUiUu
 uUUUUUUUUUuu
 HhhhhhhhhhhH
 Hh        hH
""")
    P(g, 28, 9, ['Uu', ' uU', ' u'])   # the kerchief's knot, like his
    P(g, 18, 12, ['H']); P(g, 29, 12, ['H'])
    P(g, 20, 5, ['O', 'O', 'o'])   # clothespin in the kerchief
    eyes(g, 21, 14, 4, 'open', brow='t')
    P(g, 24, 16, ['t'])
    P(g, 20, 17, ['a      a'][:1]); P(g, 27, 17, ['a'])
    P(g, 22, 17, ['K  K', ' KK '])
    # --- the original Launderer, in front, moved down-left ---
    dx, dy = -4, 3
    def bubble_cell(x, y):
        return (24 <= x <= 29 and y <= 5) or (2 <= x <= 6 and 7 <= y <= 17) or (26 <= x and 8 <= y <= 12)
    for y in range(N):
        for x in range(N):
            ch = REF[y][x]
            if ch in '.bc' or bubble_cell(x, y): continue
            if y >= 20 and x >= 22: continue          # his towel goes to the second launderer
            if 6 <= y <= 8 and x >= 24: continue      # the scarf knot would sit on her face
            X, Y = x + dx, y + dy
            if 0 <= X < N and 0 <= Y < N: g.c[Y][X] = ch
    for y in range(23, N): at(g, 18, y, '1')         # his far shoulder edge against her
    # soap bubbles in the table's colors
    bub5 = lambda o: [f' {o*3} ', f'{o}wii{o}', f'{o}iii{o}', f'{o}iii{o}', f' {o*3} ']
    bub3 = lambda o: [f' {o*2} ', f'{o}wi{o}', f'{o}ii{o}', f' {o*2} ']
    P(g, 2, 2, bub5('x')); P(g, 23, 0, bub5('y')); P(g, 1, 9, bub3('z')); P(g, 28, 2, bub3('n'))
    return g
