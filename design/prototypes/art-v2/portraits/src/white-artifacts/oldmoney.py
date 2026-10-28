# Old Money: white mutton chops and a bushy mustache, bald crown, a gold monocle on a chain, nose in the air,
# a purple ascot with a pearl pin, a quilted smoking jacket.
from common import *
ID = 'trading.oldmoney'
def draw():
    g = new()
    shoulders(g)
    g.put(22, 27, ['PpP', '222'])
    g.put(9, 21, ['1   ', '21  ', '421 ', '3421', '33421', '334421', '3334421'])
    g.put(19, 21, ['   1', '  12', ' 124', '1243', '12433', '1244333', '12443333'][:7])
    g.put(13, 21, ['PPPPPP', 'PPpPPp', ' PwPp ', ' PPpp ', '  Pp  ', '  pp  '])
    head(g, 8, 4, [
        '    SSSSSSSs    ',
        '  SSSSSSSSSSss  ',
        ' SSSSSSSSSSSSss ',
        ' SSSSSSSSSSSSsst',
        'SSSSSSSSSSSSSsst',
        'SWWWVSSSSSWWWVst',
        'SSSSSSSSSGGGGsst',
        'SKKKSSSSSGwKGsst',
        'SSSSSSSSSGKKGsst',
        'SSSSSSStSGGGGsst',
        'SaaSSSttSSSSaast',
        'SWWWWWWWWWWWWVst',
        'WWWWWWVVWWWWWWVt',
        ' VWSSSKKKSSSWVt ',
        '  SSSSSSSSSSst  ',
        '   sSSSSSSSst   ',
        '    tsssssst    ',
    ])
    g.put(5, 7, [' WW ', 'WWWV', 'WWWV', 'WWVV', ' WWV', 'WWVV', ' WV '])  # white side tufts
    g.put(23, 7, [' VW ', 'WWVV', 'WWVV', 'WVVV', 'WWV ', 'WVVV', ' VV '])
    g.put(20, 14, ['g', 'g', ' g', ' g', ' g', '  g', '  g', '  g', '  G'])  # monocle chain
    return g.rows()
