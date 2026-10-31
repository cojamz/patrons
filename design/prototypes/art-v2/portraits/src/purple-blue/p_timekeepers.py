# Timekeepers: two hooded cult elders side by side, each with an hourglass pendant.
from lib import *
ID, NAME, SPHERE = 'purple.timekeepers', 'Timekeepers', 'purple'
def hooded(g, x, y, beard):
    at(g, x, y, ['    4333    ', '   433332   ', '  43333322  ', ' 4333333221 ', ' 43SSSSSS21 ', '433SSSSSSs21',
                 '43SttSSttss1', '43SwKSSwKst1', '43SKKSStKKst1'[:12], '43SSSStSSst1', '43SSSSSSsst1', '43sSKKKKst21',
                 '432tssssst21', '4332     221'])
    if beard:
        at(g, x + 3, y + 10, ['MMMMMM', 'MMMMMN', ' MMMN ', '  MN  '])
def draw():
    g = new()
    body(g, start=10)
    hooded(g, 3, 6, True)
    hooded(g, 17, 5, False)
    at(g, 3, 19, ['4333333333221', '43333333332211'])
    at(g, 17, 18, ['4333333333221', '43333333332211'])
    for gx, gy in ((8, 24), (22, 23)):  # hourglass pendants on a chain
        at(g, gx - 1, gy - 2, ['g  g', ' gg '])
        at(g, gx, gy, ['GG', 'Yw', 'gg', 'YY', 'GG'])
    return g
