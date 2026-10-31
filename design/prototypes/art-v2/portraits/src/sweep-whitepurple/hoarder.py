# Hoarder: keeps everything. Wild frizzy hair with a pencil and a spoon stuck in it, wide eyes, a toothy crooked
# grin, a lumpy cardigan with stuffed pockets; the doorway packed with boxes, jars and bundles on both sides.
from lib import *
def draw():
    g = new()
    # piles to the arch: boxes, jars, newspapers, a lamp, coins, a teddy
    at(g, 4, 5, [' OO ', 'OOOo', 'Oooo'])
    at(g, 2, 8, [' Lz ', 'LzzM', 'LzzM', 'MMMN'])
    at(g, 2, 12, ['OOOOOo', 'OoKKOo', 'OOOOoo', 'oooooo'])
    at(g, 2, 16, ['WWWWV', 'WKKKV', 'WWWWV', 'WKKVV', 'WWWWV'])
    at(g, 2, 21, ['xxyyzz'])
    at(g, 23, 4, ['  RR ', ' RRrr', '  N  ', '  N  ', ' NNN '])  # an old lamp
    at(g, 25, 9, ['OO OO', 'OOOOo', 'OoOOo', ' OOo '])  # a teddy
    at(g, 25, 13, [' LyM', 'LyyM', 'LyyM', 'MMMN'])
    at(g, 24, 17, ['OOOOOo', 'OoGGOo', 'OOOOoo', 'GGGGGg', 'gGgGgg'])
    body(g, top=22, start=8)
    at(g, 12, 22, ['2      2', ' 2    2 ', '  2222  ']); at(g, 15, 25, ['L', ' ', 'L', ' ', 'L'])
    at(g, 4, 26, ['222222', '2W2xx2', '2WWx22', '222222'])  # stuffed pocket
    at(g, 22, 26, ['222222', '2Gg2y2', '2gGy22', '222222'])
    head(g, 5, 1, [
        '   h j  hj h  h H   ',
        ' h hjhjhhjhhjhhHh H ',
        'h hjjhhjhhhhhhhhhH h',
        ' hjjhhhhhhhhhhhhhhH ',
        'hjhhhhhhhhhhhhhhhhHH',
        'hhhhhhhhhhhhhhhhhhhH',
        'jhhHhhhhhhhhhhhhhhHH',
        'hhh hhhhhhhhhhhhh hH',
    ])
    face(g, y=9, mouth='grin', rows={0: 'hSSSSSSSSSSSSssh', 2: 'SttSSSSSSSttSsst', 3: 'SKwKSSSSSKwKSsst', 4: 'SKKKSSSSSKKKSsst',
                                     8: ' SSSKwwKwwwKsst ', 9: ' SSSSKKKKKKSsst '})
    at(g, 6, 0, ['Y', 'Y', 'Kn'][:3]); at(g, 21, 0, [' L', 'LL', 'M '])  # pencil and spoon in the hair
    return g
