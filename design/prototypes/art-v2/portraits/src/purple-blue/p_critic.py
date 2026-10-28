# Critic: unimpressed. Beret, half-moon glasses on the nose, one brow arched, pencil mustache, a frown,
# a pencil behind the ear, black turtleneck, and a single gold star (out of five).
from lib import *
ID, NAME, SPHERE = 'market.critic', 'Critic', 'blue'
def draw():
    g = new()
    body(g)
    face(g, rows={1: 'SSttSSSSSSSSSsst', 2: 'SSSSSSSSSSttttst', 3: 'SSwKSSSSSSKKSsst', 4: 'SLLLLSSSSLLLLsst',
                  5: 'SLiiLLLtLLiiLsst', 6: 'SSLLSSttSSLLSsst', 7: 'SSSKKKKKKKSSSsst', 8: ' SSSSSSSSSSSsst ',
                  9: ' SSSSKKKKKSSsst ', 10: '  SSKSSSSKSSst  '})
    at(g, 7, 1, ['        11       ', '   2111111111    ', ' 211111111111111  ', '21111111111111111211', '1111111111111111112',
                 ' 222222222222222', '      hhhhhhhhhhH'])
    at(g, 7, 7, ['h']); at(g, 24, 7, ['H', 'H'])
    at(g, 23, 9, ['', 'Y', 'Y', ' Y', ' t'])  # pencil
    at(g, 25, 10, ['K'])
    at(g, 3, 9, ['  G  ', ' GGG ', 'GGGGG', ' GwG ', 'G   G'])  # one star
    # turtleneck
    at(g, 11, 21, ['1111111111', '111222221111', '1111111111'])
    at(g, 10, 22, ['11', '']); 
    return g
