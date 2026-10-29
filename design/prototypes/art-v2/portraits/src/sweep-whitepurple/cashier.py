# Cashier: a green eyeshade visor, slicked hair, round spectacles, a pencil behind the ear, a bow tie and sleeve garters;
# stacks of gold coins at the till beside him, ready to cash it all out.
from lib import *
def coins(g, x, y, n):
    for k in range(n): at(g, x, y - k, ['gGGGg' if k % 2 else 'GGGGg'])
    at(g, x, y - n, [' GwG '])
def draw():
    g = new()
    coins(g, 2, 21, 5); coins(g, 25, 21, 3); coins(g, 3, 14, 2)
    body(g, top=22, start=8)
    at(g, 13, 22, ['WWWWWW', ' WWWW ']); at(g, 12, 22, ['RRr', 'rRR'][:2]); at(g, 12, 22, ['Rr    rR', 'RRr  rRR', 'Rr    rR'])  # bow tie
    at(g, 15, 22, ['RR', 'rr'])
    for x in range(1, 31):  # sleeve garters
        for y in (27,):
            if g.c[y][x] in '1234' and (x < 6 or x > 25): g.c[y][x] = 'E' if x < 6 else 'e'
    at(g, 16, 25, ['g', 'G', 'g'])  # vest buttons
    g.c[29][16] = 'G'
    head(g, 8, 3, [
        '                ',
        '    HHhhhhhH    ',
        '  HhjjjjhhhhhH  ',
        'EEEEEEEEEEEEEEee',
        'eEEEEEEEEEEEEEee',
        ' eeeeeeeeeeeeee ',
    ])
    face(g, y=9, mouth='smile', rows={0: 'HSSSSSSSSSSSSssH', 2: 'SLLLLSSSSLLLLsst', 3: 'LSwKSLLLLSwKSLst', 4: 'LSKKSLSSLSKKSLst', 5: 'SLLLLSStSLLLLsst'})
    at(g, 24, 8, ['  Y', ' YK', 'YY ', 'n  '])  # pencil behind the ear
    return g
