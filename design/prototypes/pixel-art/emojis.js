// Cults minions: 20 pixel emojis. Each player picks one when joining; all their minions are that emoji.
// Each minion is 16 rows of 16 characters (shown at 16, 32 or 64px, so pixels stay square).
// Minions sit visibly smaller than 24×24 members and bigger than 10×10 follower marks.
// Keys:
//   .  transparent
//   k  ink (only for lines INSIDE the shape; the renderer adds the 1px outer outline, so keep the outer row/col empty)
//   w  cream   c  cream shade   s  skin   t  skin shade   o  candle glow   x  soft black   b  blush
//   1..9  this emoji's own colors, from its `pal` list (pal[0] is key 1). Usually triples: shade, base, highlight.
// Letters are shared by every emoji so the set reads as one family; digits are each emoji's natural colors.
// `em` is the same emoji as an 8×8 emblem for the cult leader's medallion (leaders.js). Its four corner
// pixels sit under the medallion ring, so they stay empty; `.` there shows the medallion's dark ground.
// Classic script (works from file:// and in node): sets globalThis.CultMinions.
(function (g) {
  const INK = '#1c1410';
  const SHARED = { k: INK, w: '#f6eedb', c: '#cbbd9c', s: '#f1c49b', t: '#c88b62', o: '#ffd66e', x: '#2e2430', b: '#ee8f8a' };
  // Colour families [shade, base, highlight]: natural, slightly warm, so they sit on walnut and cream paper.
  const F = {
    red: ['#8f2a22', '#d4473a', '#f0866c'],
    coral: ['#93331f', '#d9583a', '#f39a75'],
    orange: ['#a5521b', '#e8892f', '#f7b866'],
    yellow: ['#b48a1f', '#f2c94a', '#fbe596'],
    gold: ['#a8761a', '#e3b23c', '#f8dc86'],
    lime: ['#3a7634', '#6bb24d', '#a8d97b'],
    sage: ['#2f6a3a', '#4f9a55', '#86c47d'],
    jade: ['#245e4c', '#3f9472', '#7cc9a2'],
    mint: ['#5f9370', '#9fcf96', '#d2edc6'],
    teal: ['#226a70', '#3aa0a3', '#8fd3cc'],
    blue: ['#2c5590', '#4f8bd0', '#8db9ea'],
    indigo: ['#2a3160', '#45528e', '#7080bd'],
    purple: ['#553a8e', '#8b66cb', '#b99ce6'],
    pink: ['#a3456f', '#e27aa6', '#f7b9d2'],
    grey: ['#66717a', '#a9b4bb', '#dfe5e8'],
    brown: ['#6a3d1d', '#b06a2e', '#dd9c58'],
    clay: ['#7c3d24', '#bd6a43', '#e09a6e'],
    sky: ['#86aec2', '#cfe6f0'],
  };

  const MINIONS = [
    {
      id: 'santa', name: 'Santa', emoji: '🎅', pal: [...F.red],
      idea: 'red cap flopping to a pom, cream fur trim, big beard',
      px: [
        '................',
        '.....3322.......',
        '....322222......',
        '...32222222.ww..',
        '...222222221www.',
        '..wwwwwwwwwwwcc.',
        '..cwwwwwwwwwc...',
        '...ssksssskst...',
        '...sbssssbsst...',
        '..wwwwwwwwwwww..',
        '..wwwwwkkwwwwc..',
        '..cwwwwwwwwwwc..',
        '...cwwwwwwwwc...',
        '....cwwwwwwc....',
        '......cccc......',
        '................',
      ],
      em: [
        '..3322..',
        '.322221w',
        'wwwwwwww',
        '.skssks.',
        'wwssssww',
        'wwwkkwww',
        '.wwwwww.',
        '..wwww..',
      ],
    },
    {
      id: 'unicorn', name: 'Unicorn', emoji: '🦄', pal: [...F.gold, '#8b66cb', '#e27aa6', '#6fa8dc'],
      idea: 'white horse head, gold horn, a pink-purple-blue mane down the neck',
      px: [
        '................',
        '..3.............',
        '..32....w.......',
        '...32..ww55.....',
        '....2wwwww554...',
        '...wwwwwwww556..',
        '..wwwkwwwww6554.',
        '.wwwwwwwwwwc554.',
        '.wwwwwwwwwwc455.',
        '.wkwwwwwwwwwc54.',
        '..cwwcwwwwwwc56.',
        '...cc.cwwwwwc45.',
        '.......wwwwww55.',
        '.......cwwwwwc4.',
        '........cccccc..',
        '................',
      ],
      em: [
        '.3......',
        '..3.w5..',
        '..wwww54',
        '.wkwww45',
        'wwwwwc54',
        'wkwwwc45',
        '.cc.ww5.',
        '....wc..',
      ],
    },
    {
      id: 'surfer', name: 'Surfer', emoji: '🏄', pal: [...F.yellow, F.teal[0], F.teal[1], '#d9583a', '#f39a75'],
      idea: 'sun-bleached spikes, shades and a grin, board held upright',
      px: [
        '................',
        '...3.3.3.....5..',
        '..3323232...554.',
        '..222222221.5w4.',
        '..2ssssss21.5w4.',
        '..sssssssst.5w4.',
        '..kkkkkkkkt.5w4.',
        '..skksskkst.5w4.',
        '..sssssssst.5w4.',
        '..sskkkksst.5w4.',
        '...ssssstt..5w4.',
        '...6666666..5w4.',
        '..766666667.5w4.',
        '.76666666666.4..',
        '.76666666666....',
        '................',
      ],
      em: [
        '.3.3.5..',
        '3232.54.',
        '2ssss5w4',
        'kkkkk5w4',
        'skksk5w4',
        'sssss5w4',
        'skkks5w4',
        '.sss..4.',
      ],
    },
    {
      id: 'bug', name: 'Bug', emoji: '🐛', pal: [...F.lime, F.yellow[1]],
      idea: 'a fat green caterpillar, round head up, yellow-tipped feelers',
      px: [
        '................',
        '.........4...4..',
        '..........1.1...',
        '.........32221..',
        '........3222221.',
        '........2k22k21.',
        '........2222221.',
        '..33.33.22kk21..',
        '.32232232222211.',
        '.24224224222221.',
        '.22222222222221.',
        '.12111211121111.',
        '..1..1..1..1....',
        '................',
        '................',
        '................',
      ],
      em: [
        '....4.4.',
        '.....1..',
        '...3222.',
        '...2k2k2',
        '3232222.',
        '2422422.',
        '2222221.',
        '.1..1...',
      ],
    },
    {
      id: 'ghost', name: 'Ghost', emoji: '👻', pal: [],
      idea: 'a cream sheet with a wavy hem, two dark eyes and an "oo" mouth',
      px: [
        '................',
        '.....wwwww......',
        '....wwwwwwwc....',
        '...wwwwwwwwwc...',
        '..wwwwwwwwwwwc..',
        '..wwkkwwwkkwwc..',
        '..wwkkwwwkkwwc..',
        '..wbwwwwwwwbwc..',
        '.wwwwwwkkwwwwwc.',
        '.cwwwwwkkwwwwcc.',
        '..wwwwwwwwwwwc..',
        '..wwwwwwwwwwwc..',
        '..wwwwwwwwwwwc..',
        '..wwc.wwwc.wwc..',
        '..wc...wc...c...',
        '................',
      ],
      em: [
        '..wwww..',
        '.wwwwww.',
        'wwkwwkww',
        'wwkwwkww',
        'wwwkkwww',
        'wwwkkwww',
        'wwwwwwww',
        '.w.ww.w.',
      ],
    },
    {
      id: 'alien', name: 'Alien', emoji: '👽', pal: [...F.mint],
      idea: 'a pale green teardrop head with huge slanted black eyes',
      px: [
        '................',
        '.....332221.....',
        '....32222222....',
        '...3222222221...',
        '..322222222221..',
        '..222222222221..',
        '..2kkk2222kkk1..',
        '..2kwkk22kkwk1..',
        '..22kkk22kkk21..',
        '...22kk22kk21...',
        '...2222222221...',
        '....22222221....',
        '.....22kk21.....',
        '......2221......',
        '.......11.......',
        '................',
      ],
      em: [
        '..3222..',
        '.322222.',
        '2kk22kk1',
        '2kkk kk1',
        '.2k22k2.',
        '.222221.',
        '..2kk1..',
        '...21...',
      ],
    },
    {
      id: 'robot', name: 'Robot', emoji: '🤖', pal: [...F.grey, F.red[0], F.red[1], '#7fe0e6'],
      idea: 'a tin box head, red bulb antenna, cyan screen eyes, grille mouth',
      px: [
        '................',
        '.......55.......',
        '.......54.......',
        '.......2........',
        '..333333333332..',
        '..322222222221..',
        '.23xxxxxxxxxx12.',
        '.23x66xxxx66x12.',
        '.23x66xxxx66x12.',
        '.23xxxxxxxxxx12.',
        '..322222222221..',
        '..32k2k2k2k221..',
        '..322222222221..',
        '..111111111111..',
        '................',
        '................',
      ],
      em: [
        '...55...',
        '...22...',
        '33333332',
        '3x6xx6x1',
        '3x6xx6x1',
        '32222221',
        '.2k2k21.',
        '.111111.',
      ],
    },
    {
      id: 'cat', name: 'Cat', emoji: '🐱', pal: [...F.orange, '#ec8a9a'],
      idea: 'a ginger cat face, tabby stripes, cream muzzle, pink nose',
      px: [
        '................',
        '..3..........2..',
        '..33........22..',
        '..343......242..',
        '..322222222221..',
        '.32222121222221.',
        '.22222222222221.',
        '.222k222222k221.',
        '.222k222222k221.',
        '.22wwww44wwww21.',
        '.22wwwkwwkwww21.',
        '.122wwwwwwww211.',
        '..122222222211..',
        '....11111111....',
        '................',
        '................',
      ],
      em: [
        '.3....2.',
        '.34..42.',
        '.322221.',
        '22k22k21',
        '2ww44ww1',
        '2wkwwkw1',
        '.122221.',
        '..1111..',
      ],
    },
    {
      id: 'frog', name: 'Frog', emoji: '🐸', pal: [...F.lime],
      idea: 'a lime frog face, eyes bulging on top, a wide grin, pink cheeks',
      px: [
        '................',
        '................',
        '................',
        '..3322....3322..',
        '.32wwk2..2wwk21.',
        '.32wwk2222wwk21.',
        '.32222222222221.',
        '.22222222222221.',
        '.2b2222222222b1.',
        '.2k2222222222k1.',
        '.22kkkkkkkkkk21.',
        '.22222222222221.',
        '..222222222221..',
        '...1111111111...',
        '................',
        '................',
      ],
      em: [
        '.33..33.',
        '3wk33wk3',
        '2wk22wk2',
        '22222222',
        '2b2222b2',
        '2kkkkkk2',
        '.222222.',
        '..1111..',
      ],
    },
    {
      id: 'octopus', name: 'Octopus', emoji: '🐙', pal: ['#8e3a6c', '#cf6aa0', '#f0a9cb'],
      idea: 'a pink dome head, sleepy-cute eyes, five curling arms',
      px: [
        '................',
        '.....332221.....',
        '....32222222....',
        '...3222222221...',
        '...2222222221...',
        '...22kk22kk21...',
        '...22kk22kk21...',
        '...2b222222b1...',
        '..322222222221..',
        '..222222222221..',
        '.32.22.22.22.21.',
        '.2..2..22..2..1.',
        '.22.2..2...2.21.',
        '..2..2..2.2..2..',
        '................',
        '................',
      ],
      em: [
        '..3222..',
        '.322222.',
        '.2k22k1.',
        '.222221.',
        '32222221',
        '2.2..2.1',
        '2.2..2.1',
        '.2.22.2.',
      ],
    },
    {
      id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', pal: [...F.orange, F.sage[0], F.sage[1]],
      idea: 'a jack-o\'-lantern: ribbed orange, curled stem, a candlelit grin',
      px: [
        '................',
        '................',
        '........45......',
        '.......45.......',
        '...3312322122...',
        '..332122221221..',
        '.32221222212221.',
        '.222o122221o221.',
        '.22ooo2222ooo21.',
        '.222212oo212221.',
        '.22oooooooooo21.',
        '.222oo2oo2oo221.',
        '.12221222212211.',
        '...1111111111...',
        '................',
        '................',
      ],
      em: [
        '....45..',
        '.332231.',
        '32o22o21',
        '2ooo2oo1',
        '22222221',
        '2oooooo1',
        '.2o2o21.',
        '..1111..',
      ],
    },
    {
      id: 'skull', name: 'Skull', emoji: '💀', pal: [],
      idea: 'a cream skull, deep sockets with a candle glint, a row of teeth',
      px: [
        '................',
        '.....wwwwww.....',
        '...wwwwwwwwww...',
        '..wwwwwwwwwwwc..',
        '..wwwwwwwwwwwc..',
        '..wxxxwwwwxxxc..',
        '..wxoxwwwwxoxc..',
        '..wxxxwwwwxxxc..',
        '..cwwwwxxwwwwc..',
        '...cwwwwwwwwc...',
        '....wwwwwwww....',
        '....wwkwwkwc....',
        '....cccccccc....',
        '................',
        '................',
        '................',
      ],
      em: [
        '..wwww..',
        '.wwwwww.',
        'wxxwwxxw',
        'wxowwoxc',
        'wwwxxwwc',
        '.cwwwwc.',
        '.wkwkwc.',
        '..cccc..',
      ],
    },
    {
      id: 'cactus', name: 'Cactus', emoji: '🌵', pal: [...F.sage, ...F.clay, '#f08fb5'],
      idea: 'a saguaro with both arms up, a pink bloom, in a clay pot',
      px: [
        '................',
        '.....33721......',
        '....3222221.....',
        '....3222221.32..',
        '.32.32k2k21.221.',
        '.22.3222221.221.',
        '.22.322k221.221.',
        '.22.32222222221.',
        '.2223222221.....',
        '.1113222221.....',
        '....3222221.....',
        '....3222221.....',
        '...466666664....',
        '....4555554.....',
        '.....44444......',
        '................',
      ],
      em: [
        '...37...',
        '..3221..',
        '3.2k21.3',
        '2.2221.2',
        '2222222.',
        '..2221..',
        '.666664.',
        '..4554..',
      ],
    },
    {
      id: 'pizza', name: 'Pizza', emoji: '🍕', pal: [...F.brown, ...F.yellow, F.red[0], F.red[1]],
      idea: 'a slice, point down: brown crust, gold cheese, three pepperoni',
      px: [
        '................',
        '..333222222221..',
        '.32222222222221.',
        '.11111111111111.',
        '.65555555555554.',
        '..658855555554..',
        '..658755558854..',
        '...6555555874...',
        '....65555554....',
        '....65588554....',
        '.....658754.....',
        '......6554......',
        '......6554......',
        '.......54.......',
        '................',
        '................',
      ],
      em: [
        '.332221.',
        '32222221',
        '11111111',
        '65885554',
        '.655884.',
        '..6554..',
        '...54...',
        '........',
      ],
    },
    {
      id: 'dino', name: 'Dinosaur', emoji: '🦖', pal: [...F.jade],
      idea: 'a T-rex in profile: big jaw, two teeth, tiny arm, heavy tail',
      px: [
        '................',
        '........332221..',
        '.......322k2221.',
        '.......22222222.',
        '.......222kkkkk.',
        '.......2222w2w1.',
        '......222221....',
        '.....32222222...',
        '....3222222122..',
        '..3322222221....',
        '.32222222221....',
        '.1..1222221.....',
        '....22..22......',
        '....22..22......',
        '...111.111......',
        '................',
      ],
      em: [
        '....322.',
        '...2k222',
        '...22kkk',
        '...222w.',
        '..22222.',
        '322222.2',
        '2.2222..',
        '..2..2..',
      ],
    },
    {
      id: 'ninja', name: 'Ninja', emoji: '🥷', pal: [...F.indigo, ...F.red],
      idea: 'a chibi ninja: indigo wrap, eye slit, red headband tails flying',
      px: [
        '................',
        '.....332222.....',
        '....32222222....',
        '...3222222221...',
        '...65555555554..',
        '...322222222155.',
        '...ssksssskst.5.',
        '...2222222221.4.',
        '...2222222221...',
        '...3222222221...',
        '....22222221....',
        '..332222222221..',
        '.32222222222221.',
        '.22222222222221.',
        '.11111111111111.',
        '................',
      ],
      em: [
        '..3222..',
        '.322222.',
        '65555545',
        'sksskst5',
        '2222221.',
        '.222221.',
        '32222221',
        '.111111.',
      ],
    },
    {
      id: 'wizard', name: 'Wizard', emoji: '🧙', pal: [...F.purple, ...F.yellow, '#8d969c', '#c4cbcf', '#eef1f2'],
      idea: 'a tall bent purple hat with a gold star, and a long grey beard',
      px: [
        '................',
        '..........32....',
        '.........322....',
        '........3222....',
        '.......32522....',
        '......3255521...',
        '.....32225221...',
        '.33222222222211.',
        '...ssksssskst...',
        '...9999t99998...',
        '...8999999998...',
        '....89999998....',
        '....89999998....',
        '.....899998.....',
        '......7887......',
        '................',
      ],
      em: [
        '....32..',
        '...352..',
        '..32221.',
        '32222221',
        '.skssks.',
        '.899998.',
        '..8998..',
        '...77...',
      ],
    },
    {
      id: 'crab', name: 'Crab', emoji: '🦀', pal: [...F.coral],
      idea: 'a coral crab, both claws up, eyes on stalks, six legs',
      px: [
        '................',
        '.3.3........3.3.',
        '.2.2........2.2.',
        '.222........222.',
        '..2..wk..kw..2..',
        '..2...2..2...2..',
        '..2.32222221.2..',
        '..232222222212..',
        '.32222222222221.',
        '.22222222222221.',
        '..122222222211..',
        '.2.2.2....2.2.2.',
        '.2..2.2..2.2..2.',
        '................',
        '................',
        '................',
      ],
      em: [
        '.3....3.',
        '22.ww.22',
        '2..kk..2',
        '23222212',
        '22222222',
        '.122221.',
        '2.2..2.2',
        '.2....2.',
      ],
    },
    {
      id: 'mushroom', name: 'Mushroom', emoji: '🍄', pal: [...F.red],
      idea: 'a red toadstool cap with cream spots, a stubby stem with a face',
      px: [
        '................',
        '.....332222.....',
        '...33ww222221...',
        '..32www2222ww1..',
        '.3222w22222www1.',
        '.2ww222222222w1.',
        '.1www22ww222211.',
        '..111111111111..',
        '....wwwwwwwc....',
        '....wkwwwwkc....',
        '....wbwkkwbc....',
        '....wwwwwwwc....',
        '....cwwwwwcc....',
        '.....cccccc.....',
        '................',
        '................',
      ],
      em: [
        '..3222..',
        '.3ww221.',
        '32w22ww2',
        '2222w221',
        '.111111.',
        '..wkwk..',
        '..wwwc..',
        '..cccc..',
      ],
    },
    {
      id: 'bee', name: 'Bee', emoji: '🐝', pal: [...F.yellow, F.sky[0], F.sky[1]],
      idea: 'a round honeybee in profile: two stripes, glassy wings, a stinger',
      px: [
        '................',
        '................',
        '......44...44...',
        '.....4554.4554..',
        '.....4554.4554..',
        '......44...44...',
        '....32xx22xx1...',
        '.32222xx22xx21..',
        '.2k222xx22xx22x.',
        '.22b22xx22xx21..',
        '..1222xx22xx1...',
        '....11xx11xx....',
        '................',
        '................',
        '................',
        '................',
      ],
      em: [
        '..44.44.',
        '.455455.',
        '..44.44.',
        '.32xx2x.',
        '2k2xx2xx',
        '222xx2x.',
        '.12xx1..',
        '........',
      ],
    },
  ];

  const KEYS = new Set(['.', ...Object.keys(SHARED)]);

  function palette(m) {
    const p = { ...SHARED };
    (m.pal || []).forEach((hex, i) => { p[String(i + 1)] = hex; });
    return p;
  }

  // Returns a list of problems (empty when the minion is well-formed).
  function validate(m) {
    const errs = [];
    const id = m.id;
    const pal = m.pal || [];
    if (pal.length > 9) errs.push(`${id}: ${pal.length} own colours, max 9`);
    pal.forEach((h, i) => { if (!/^#[0-9a-f]{6}$/i.test(h)) errs.push(`${id}: pal[${i}] "${h}" is not #rrggbb`); });
    const ok = ch => KEYS.has(ch) || (/[1-9]/.test(ch) && +ch <= pal.length);
    const grid = (rows, n, label) => {
      if (!Array.isArray(rows) || rows.length !== n) { errs.push(`${id} ${label}: ${rows && rows.length} rows, want ${n}`); return false; }
      rows.forEach((row, y) => {
        if (row.length !== n) errs.push(`${id} ${label} row ${y}: ${row.length} chars, want ${n}`);
        [...row].forEach((ch, x) => { if (!ok(ch)) errs.push(`${id} ${label} row ${y} col ${x}: unknown key "${ch}"`); });
      });
      return true;
    };
    if (grid(m.px, 16, 'px')) {
      const edge = m.px[0] + m.px[15] + m.px.map(r => r[0] + r[15]).join('');
      if (/[^.k]/.test(edge)) errs.push(`${id}: fill touches the border (keep a 1px margin for the outline)`);
      const filled = m.px.join('').replace(/[.]/g, '').length;
      if (filled < 70) errs.push(`${id}: only ${filled} filled pixels; too thin to read at 16px`);
      const used = new Set(m.px.join('') + (m.em || []).join(''));
      pal.forEach((_, i) => { if (!used.has(String(i + 1))) errs.push(`${id}: pal[${i}] (key ${i + 1}) is never used`); });
    }
    if (grid(m.em, 8, 'em')) {
      const corners = m.em[0][0] + m.em[0][7] + m.em[7][0] + m.em[7][7];
      if (/[^.]/.test(corners)) errs.push(`${id}: emblem corners must stay empty (the medallion ring covers them)`);
    }
    return errs;
  }
  function validateAll() {
    const errs = MINIONS.flatMap(validate);
    const seen = new Set();
    MINIONS.forEach(m => { if (seen.has(m.id)) errs.push(`duplicate id ${m.id}`); seen.add(m.id); });
    return errs;
  }

  // Grid with the outer outline added: any empty cell beside (not diagonal to) a filled cell becomes k.
  function withOutline(px) {
    const H = px.length, W = px[0].length;
    const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && px[y][x] !== '.' && px[y][x] !== 'k';
    return px.map((row, y) => [...row].map((ch, x) =>
      ch === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'k' : ch).join(''));
  }

  // Rows of keys → crisp <rect> runs (one per horizontal run of one colour). x0/y0 offset into a bigger canvas.
  function rects(px, pal, x0 = 0, y0 = 0) {
    const out = [];
    px.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let w = 1;
        while (row[x + w] === ch) w++;
        if (ch !== '.' && ch !== ' ') out.push(`<rect x="${x + x0}" y="${y + y0}" width="${w}" height="1" fill="${pal[ch]}"/>`);
        x += w;
      }
    });
    return out.join('');
  }

  const byId = id => MINIONS.find(m => m.id === id);

  function toSVG(m, size = 32, opts) {
    if (typeof m === 'string') m = byId(m);
    const o = Object.assign({ outline: true, title: true }, opts);
    const px = o.outline ? withOutline(m.px) : m.px;
    const t = o.title ? `<title>${m.name}</title>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${m.name}">${t}${rects(px, palette(m))}</svg>`;
  }

  const api = { MINIONS, SHARED, FAMILIES: F, INK, palette, validate, validateAll, withOutline, rects, toSVG, byId };
  g.CultMinions = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
