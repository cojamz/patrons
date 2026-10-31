# Old Money: a silver-haired gentleman of inherited wealth, half-lidded and pleased with himself, a gold-rimmed monocle
# on a chain, a bushy white mustache, a silk cravat with a gold pin and a velvet-lapeled smoking jacket.
from lib import *
def draw():
    g = new()
    body(g, top=22, start=8)
    at(g, 8, 22, ['1111', '22211', ' 2221', '  221', '   21', '    1'])  # velvet lapels
    at(g, 20, 22, ['1111', '11222', '1222 ', '122  ', '12   ', '1    '][::1])
    at(g, 12, 22, ['PPPPPPPP', ' PpPPPp ', '  PpPp  ', '   Gp   ', '   pp   '])  # cravat and pin
    at(g, 15, 25, ['G'])
    head(g, 8, 2, [
        '                ',
        '    LLLLLLLM    ',
        '  LLLLLLLLMMMM  ',
        ' LLLMMLLLLLMMMN ',
        'LLMMLLLLLLLLMMMN',
        'LMMSSSSSSSSSSMMN',
        'LMSSSSSSSSSSSSMN',
    ])
    face(g, y=9, mouth='smirk', rows={0: 'MSSSSSSSSSSSSssN', 1: 'SSSSSSSSSSSSSsst', 2: 'SLLLSSSSSGGGGsst',
                                      3: 'SKKKSSSSGKKKKGst', 4: 'SSwKSSSSGiwKiGst', 5: 'SSSSSSStSGGGGsst',
                                      6: 'SaaLLLttLLLSaast', 7: 'SLLLLLLLLLLLLsst', 8: ' LMMSSSSSSMMsst ', 9: ' SSSSSKKKKSSsst '})
    at(g, 20, 14, ['g', 'g', ' g', ' g', '  g', '  g', '   g', '   g'])  # monocle chain
    return g
