# Shopkeeper: the friendly shop owner in front of tidy shelves of jars. Neat mustache, warm smile, a pencil behind the ear, a
# shirt with rolled collar and a canvas apron with a pocket full of price tags.
from lib import *
def draw():
    g = new()
    for sx, w in ((2, 6), (24, 6)):  # tidy shelves of jars on both sides
        for sy, jars in ((11, 'xyz'), (17, 'zxy')):
            for k, c in enumerate(jars):
                at(g, sx + k * 2, sy - 3, ['L', c, c])
            at(g, sx, sy, ['O' * w]); at(g, sx, sy + 1, ['o' * w])
    body(g, top=22, start=8)
    at(g, 12, 22, ['UuuuuuuU', ' UuUUuU ', '  UUUU  '])  # blue work shirt under the apron
    at(g, 9, 24, ['3', '3', '3']); at(g, 22, 24, ['2', '2', '2'])
    at(g, 10, 25, ['4333333333332', '4333333333322', '4333222223322', '43332Gx2y3322', '433322222332 ', '43333333332  ', '4333333332   '])
    head(g, 8, 4, [
        '     HHhhhH     ',
        '   HhhjjhhhhH   ',
        '  HhjjhhhhhhhH  ',
        ' HhjhhhhhhhhhhH ',
        'HhhhhhhhhhhhhhhH',
    ])
    face(g, y=9, mouth='smile', rows={0: 'HSSSSSSSSSSSSssH', 7: 'SSHHHHSSHHHHSsst', 8: ' SSHHHHHHHHSsst ', 9: ' SSSSKKKKKSSsst '})
    at(g, 24, 10, ['  Y', ' YK', 'YY '])  # pencil
    return g
