# Raiders (counts as 1): one raider. Horned iron helmet, fierce eyes, a big braided beard with gold rings, a gold-tooth
# grin, a fur collar over the tunic, and a sack of stolen loot slung over his shoulder with coins spilling out.
from lib import *
def draw():
    g = new()
    sticker(g, 21, 13, ['   OOO ', '  OoOOO', ' OOOOOOo', 'OOOOoOOo', 'OGOOOOoo', 'GGgOOooo', 'GgOoooo ', ' gG oo  '])  # loot sack
    body(g, top=22, start=8)
    at(g, 3, 21, ['  OOOOoOOoOOoOOOoOOoOOoOO  ', ' OoOOoOOoOOOoOOoOoOOoOOoOo ', ' o oo o oo o oo o o oo o o '])
    head(g, 3, 0, [
        'W                      W',
        'WV                    WV',
        'WWV     LLLLMN       WWV',
        ' WWV  LLLLMMMMMN    WWV ',
        '  WWVLLMLMMMMMMMNNVWWV  ',
        '   VVLLMMMLMMMMMMNNVV   ',
        '     LLMMMMLMMMMMNNN    ',
        '     NNNNNNNNNNNNNNN    ',
        '     MNMMNMMNMMNMMNM    ',
    ])
    face(g, y=9, mouth='gold', rows={0: 'NNNNNNNNNNNNNNNN', 1: 'SSSSSSSSSSSSSsst', 2: 'SKKKSSSSSSKKKsst',
                                     6: 'SaahhhttthhhaasH', 7: 'hhhhhhhhhhhhhhhH',
                                     8: 'hhhKwwGwwwKhhhhH', 9: 'hhhhKKKKKKhhhhhH', 10: ' hhhhhhhhhhhhhH ',
                                     11: '  hhHhhhhHhhH   ', 12: '   hhH  hhH    '})
    at(g, 11, 22, ['hhH', 'GGg', 'hhH', 'hH ']); at(g, 16, 22, ['hhH', 'GGg', 'hhH', 'hH '])  # beard braids, gold rings
    return g
