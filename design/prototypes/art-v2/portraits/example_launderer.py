# Direction 2, round three (Cory, Oct 28: "he doesn't look like a launderer"): someone who does the washing.
# Headscarf, apron, a striped towel over the shoulder, soap bubbles in the table's colors around him.
from pix import *
import math
N = 32
g = G(N)
for y in range(1, N):
    hw = 14 if y >= 15 else int(round(math.sqrt(max(0, 14.4 ** 2 - (15 - y) ** 2))))
    if hw > 1: g.put(16 - hw, y, ['c' + 'b' * (2 * hw - 2) + 'c'])
cx = 16
for y in range(22, N):  # shoulders: a work shirt in the member's color
    half = min(15, 7 + (y - 22) * 3)
    for x in range(cx - half, cx + half):
        k = x - (cx - half); w = 2 * half
        g.c[y][x] = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 4 else '3'))
g.put(14, 22, ['ssss', ' tt '])
g.put(10, 22, ['W', 'W', 'W']); g.put(21, 22, ['V', 'V', 'V'])  # apron straps
g.put(10, 25, ['WWWWWWWWWWWV', 'WWWWWWWWWWWV', 'WWWWWWWWWWVV', 'WWWWVVVWWWVV', 'WWWWWWWWWWVV', 'WWWWWWWWWWVV', 'WWWWWWWWWVVV'])
g.put(23, 21, ['  TT ', ' TTTTT', 'TTTTTT', 'BBBBBB', 'TTTTTT', 'TTTTTU', 'BBBBBU', 'TTTTTU', 'TTTTUU', 'BBBBUU', 'TTTUUU'])
g.put(8, 3, ['    RRRRRRRR    ', '  RRqqqqRRRRRR  ', ' RqqqRRRRRRRRrR ', 'RqqRRRRRRRRRRrrR', 'RRRRRRRRRRRRRrrr', 'rRRRRRRRRRRRRrrr', 'HSSSSSSSSSSSSssH', 'SSSSSSSSSSSSSsst', 'SSttSSSSSSttSsst', 'SSwKSSSSSSwKSsst', 'SSKKSSSSSSKKSsst', 'SSSSSSStSSSSSsst', 'SaaSSSttSSSSaast', 'SSSSSSSSSSSSSsst', ' SSSSKSSSSKSsst ', ' SSSSSKKKKSSsst ', '  SSSSSSSSSSst  ', '   sSSSSSSSst   ', '    tsssssst    '])
g.put(7, 12, ['s', 's', 't']); g.put(24, 12, ['t', 't', 't'])
g.put(24, 6, ['Rr', ' rR', ' r'])  # the headscarf's knot
bub5 = lambda o: [f' {o*3} ', f'{o}wee{o}', f'{o}eee{o}', f'{o}eee{o}', f' {o*3} ']
bub3 = lambda o: [f' {o*2} ', f'{o}we{o}', f'{o}ee{o}', f' {o*2} ']
g.put(2, 7, bub5('X')); g.put(25, 1, bub5('Y')); g.put(3, 14, bub3('Z')); g.put(27, 9, bub3('Q'))
for (x, y) in [(14, 4), (11, 6), (17, 6), (20, 4), (14, 8), (21, 8), (9, 8)]: g.c[y][x] = 'W'  # the headscarf's dots
open('b3_launderer.txt', 'w').write('\n'.join(g.rows()))
