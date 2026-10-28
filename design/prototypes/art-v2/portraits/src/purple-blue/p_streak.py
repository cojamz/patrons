# Hot Streak: on fire. A flaming pompadour, a big grin with a gold tooth, a jacket with the collar popped.
from lib import *
ID, NAME, SPHERE = 'purple.streak', 'Hot Streak', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'hSSSSSSSSSSSSssh', 1: 'SttSSSSSSSSttsst', 2: 'SSSSSSSSSSSSSsst',
                  8: ' SSKKKKKKKKSsst ', 9: ' SSKWGWWWWKSsst ', 10: '  SSKKKKKKSSst  '})
    at(g, 6, 0, ['     Y    Y     ', '    YY   Yn  Y  ', '   YnY  YnnYYn  ', '  YnnnYYnxnnnn   ', ' Ynnxnnnnxxnnxn  ',
                 ' nnxxnnnxxxxxxn  ', ' nxxxxxxxRRxxxxn ', 'xxRRRxxxRRRRRxxx ', 'xRRRrRRRRrrRRRrx '])
    at(g, 8, 8, ['hhhhhhhhhhhhhhhH'])
    at(g, 4, 6, [' Y', 'Yn', 'n']); at(g, 25, 4, ['Y', 'nY', 'xn'])
    at(g, 3, 13, [' Y', 'Yn', 'nx']); at(g, 27, 12, ['Y ', 'nY', 'xn'])
    # popped collar, white tee
    at(g, 9, 20, ['44', '443', '4433', ' 4433']); at(g, 21, 20, ['  21', ' 221', '2211', '221'])
    at(g, 13, 23, ['WWWWWW', ' WWWW ', '  WW'])
    return g
