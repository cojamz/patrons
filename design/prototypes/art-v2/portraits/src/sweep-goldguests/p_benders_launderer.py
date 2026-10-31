# Launderers: the original Launderer (Cory's favorite: red dotted headscarf, smile, apron), pixel-for-pixel, on the
# left, and a second launderer of equal weight on the right: blue dotted kerchief knotted at the side, apron,
# the striped towel over her shoulder. Soap bubbles in the table's colors.
import json
from lib import *
REF = json.load(open("/home/user/patrons/design/prototypes/art-v2/portraits/reference.json"))[0]['px']

def draw():
    g = new()
    # --- the second launderer, on the right, eyes level with his ---
    torso(g, cx=24, top=22, half0=5, step=3, maxhalf=9, x0=16)
    P(g, 20, 24, ['W', 'WWWWWWV', 'WWWWWWV', 'WWWWWVV', 'WWWWWWV', 'WWWVWVV', 'WWWWWVV', 'WWWWVVV'])  # apron
    P(g, 20, 22, ['W', 'W']); P(g, 26, 22, ['V', 'V', 'V'])
    P(g, 27, 20, ['  WW', ' WWWW', 'WWWWW', 'UUUUU', 'WWWWW', 'WWWWV', 'UUUUV', 'WWWWV', 'WWWVV', 'UUUVV', 'WWVVV', 'WWVVV'])  # towel
    neck(g, 21, 22, 4)
    face(g, 17, 9, 12, 14, ear_row=6)
    P(g, 16, 5, """
     UUUUU
   UUiUUUUUu
  UUUUUUiUUuu
 UUiUUUUUUUUuu
 UUUUUiUUUUiUu
 uUUUUUUUUUUuu
 HhhhhhhhhhhhH
 Hh          H
""")
    P(g, 28, 10, ['uU', 'Uu', ' u'])            # the kerchief's knot, like his
    P(g, 16, 13, ['H', 'H']); P(g, 29, 13, ['H'])
    eyes(g, 20, 15, 5, 'open', brow='t')
    P(g, 22, 17, ['tt'])
    P(g, 19, 18, ['aa']); P(g, 26, 18, ['aa'])
    P(g, 21, 19, ['K   K', ' KKK '])
    # --- the original Launderer, unchanged, on the left ---
    dx, dy = -5, 3
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
    for y in range(24, N): at(g, 17, y, '1')         # his far shoulder edge against her
    bub5 = lambda o: [f' {o*3} ', f'{o}wii{o}', f'{o}iii{o}', f'{o}iii{o}', f' {o*3} ']
    bub3 = lambda o: [f' {o*2} ', f'{o}wi{o}', f'{o}ii{o}', f' {o*2} ']
    P(g, 3, 1, bub5('x')); P(g, 22, 0, bub5('y')); P(g, 9, 0, bub3('z')); P(g, 28, 3, bub3('n'))
    return g
