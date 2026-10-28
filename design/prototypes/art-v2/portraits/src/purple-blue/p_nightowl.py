# Night Owl: up all night. A hood with owl-ear tufts, big round glasses, dark circles, a moon and stars behind.
from lib import *
ID, NAME, SPHERE = 'purple.nightowl', 'Night Owl', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'HhhhhhhhhhhhhhhH', 1: 'SSSSSSSSSSSSSSst', 2: 'SLLLLSSSSSLLLLst', 3: 'LiwKiLLLLLiwKiLt',
                  4: 'LiKKiLSSSLiKKiLt', 5: 'SLLLLSStSSLLLLst', 6: 'StttSSttSSttttst', 8: ' SSSSSKKKSSSsst ',
                  9: ' SSSSSSSSSSSsst '})
    # the hood: two pointed tufts on top, framing the face down to the shoulders
    at(g, 6, 0, ['43            21', '443          221', '4433        3221', '44333333333333221',
                 '443333333333333221', '4433333333333333221', '443333333333333332211', '4433            3221'])
    at(g, 5, 4, ['4', '44', '44', '443']); at(g, 23, 6, ['', '', '211'])
    for y in range(8, 23): g.c[y][5] = '4'; g.c[y][6] = '4'; g.c[y][7] = '3'; g.c[y][24] = '2'; g.c[y][25] = '1'; g.c[y][26] = '1'
    at(g, 8, 8, ['HhhhhhhhhhhhhhhH'])
    for y in range(20, 23): g.c[y][8] = '3'; g.c[y][23] = '2'
    at(g, 14, 23, ['WW  WW', 'W    W'])  # hood strings
    g.c[25][14] = 'W'; g.c[25][19] = 'W'
    at(g, 1, 9, [' GG', 'GG ', 'GG ', ' GG'])  # crescent moon
    for x, y in [(28, 9), (2, 15), (28, 16), (27, 3)]: g.c[y][x] = 'w'
    return g
