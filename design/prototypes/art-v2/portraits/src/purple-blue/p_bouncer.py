# Bouncer: big, bald, shades, an earpiece coil, a square jaw and a flat mouth, a tight tee with a staff tag.
from lib import *
ID, NAME, SPHERE = 'purple.bouncer', 'Bouncer', 'purple'
def draw():
    g = new()
    body(g, start=10, grow=3)
    face(g, rows={0: 'SSSSSSSSSSSSSsss', 2: 'SttttSSSSttttsst', 3: 'DDDDDDDDDDDDDDDt', 4: 'DLLDDDDNDLLDDDDt',
                  5: 'SDDDDSStSDDDDDst', 6: 'SSSSSSttSSSSSsst', 8: 'SSSSKKKKKKSSsst ', 9: 'SSSSSSSSSSSSsst ',
                  10: ' SSSSSSSSSSSst  ', 11: ' sSSSSSSSSSsst  ', 12: '  tssssssssst   '}, neck=False)
    at(g, 8, 3, ['   SSSSSSSSSS   ', ' SSwwSSSSSSSSss ', 'SSwSSSSSSSSSSsss', 'SSSSSSSSSSSSSsst', 'SSSSSSSSSSSSSsst',
                 'SSSSSSSSSSSSSsst'])
    at(g, 7, 12, ['D', 'D']); at(g, 24, 12, ['D', 'D'])
    at(g, 12, 22, ['ssssssss', ' tttttt '])
    at(g, 24, 13, ['K', 'K', 'K', ' K', ' K', 'K', ' K', '  K'])  # earpiece coil
    at(g, 13, 23, ['3', '13']); at(g, 18, 23, ['3', '31'])
    at(g, 18, 26, ['WWWWW', 'WKKKW', 'WWWWW'])  # staff tag
    return g
