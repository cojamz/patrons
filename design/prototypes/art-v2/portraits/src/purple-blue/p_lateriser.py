# Late Riser: still in bed. A long striped nightcap flopping over to one side with a pompom, bed-head, heavy lids,
# a big yawn, piped pajamas, and a "z" or two.
from lib import *
ID, NAME, SPHERE = 'purple.lateriser', 'Late Riser', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'hSSSSSSSSSSSSssh', 2: 'SSSSSSSSSSSSSsst', 3: 'SSttSSSSSSttSsst', 4: 'SStKSSSSSStKSsst',
                  5: 'SSssSSStSSssSsst',
                  8: ' SSSSSKKSSSSsst ', 9: ' SSSSKrrKSSSsst ', 10: '  SSSKrrKSSSst  ', 11: '   sSSKKSSSst   '})
    # the cap: a dome over the head, its cone flopping over to the right and down past the ear
    at(g, 8, 3, ['   44333333333  ', ' 443W333W333W32 ', '43W333W333W33322', '4W333W333W333W22'])
    at(g, 18, 2, ['3333322', '  3W33222', '     W3222', '       2221', '        221', '        W21', '         21'])
    at(g, 7, 7, ['WWWWWWWWWWWWWWWWVV', 'VWWWWWWWWWWWWWWVVV'])
    at(g, 25, 9, [' 21', 'WWW', 'WWWV', 'WWVV', ' VV'])  # pompom
    at(g, 5, 9, ['hhh', ' hhh', 'hh']); at(g, 24, 9, ['H'])  # bed-head tufts
    at(g, 2, 3, ['WWWW', '  W ', ' W  ', 'WWWW']); at(g, 7, 1, ['WWW', ' W ', 'WWW'])  # zz
    at(g, 11, 22, ['WW', ' WW', '  WW']); at(g, 19, 22, ['VV', 'VV', 'V'])
    for y in (26, 29): g.c[y][16] = 'W'
    for y in range(25, 32): g.c[y][5] = 'W'; g.c[y][26] = 'V'
    return g
