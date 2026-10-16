// Cults pixel icons — calibration set (10 of ~220).
// Each icon is 24 rows of 24 characters. Every character is a palette key:
//   .  transparent
//   k  outline / ink line (only for lines INSIDE the shape; the renderer adds the outer outline)
//   d  dark neutral   m  mid neutral   l  light neutral (skin, paper, glints)
//   1  sphere shade   2  sphere color  3  sphere highlight
// Digits are the sphere's own color (dark → light); letters are shared neutrals.
// The sphere color decides 1/2/3, so the same drawing recolors for any sphere.
// Classic script (works from file:// and in node): sets globalThis.CultIcons.
(function (g) {
  const TABLE = '#101817';
  const NEUTRALS = { k: '#0a0f0e', d: '#3c4946', m: '#8e9b96', l: '#ece6d6' };
  // Sphere colors, copied from src/v4/v4.css (--gold, --red, ...).
  const SPHERES = {
    gold: '#e3b23c', red: '#e0645a', magenta: '#d4508f', green: '#5fb37c', silver: '#a3b3c2',
    white: '#eef3f8', purple: '#9a62e6', yellow: '#dcd94e', blue: '#6aa6dc',
  };

  function mix(a, b, t) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // The whole palette for one sphere: 4 neutrals + 3 steps of the sphere color.
  function palette(sphere) {
    const base = SPHERES[sphere] || sphere;
    return { ...NEUTRALS, 1: mix(base, TABLE, 0.48), 2: base, 3: mix(base, '#fff8ec', 0.5) };
  }

  // s skin, h hair or hat, a accent cloth: a member's own colours (src/v4/art/index.js personPalette)
  const KEYS = new Set(['.', 'k', 'd', 'm', 'l', '1', '2', '3', 's', 'h', 'a']);

  // Returns a list of problems (empty when the icon is well-formed).
  function validate(icon) {
    const errs = [];
    if (!Array.isArray(icon.px) || icon.px.length !== 24) errs.push(`${icon.id}: ${icon.px && icon.px.length} rows, want 24`);
    (icon.px || []).forEach((row, y) => {
      if (row.length !== 24) errs.push(`${icon.id} row ${y}: ${row.length} chars, want 24`);
      [...row].forEach((ch, x) => { if (!KEYS.has(ch)) errs.push(`${icon.id} row ${y} col ${x}: unknown key "${ch}"`); });
    });
    const edge = icon.px[0] + icon.px[23] + icon.px.map(r => r[0] + r[23]).join('');
    if (/[^.k]/.test(edge)) errs.push(`${icon.id}: fill touches the border (keep a 1px margin for the outline)`);
    return errs;
  }

  // Grid with the outer outline added: any empty cell beside (not diagonal to) a filled cell becomes k.
  function withOutline(px) {
    const H = px.length, W = px[0].length;
    const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && px[y][x] !== '.' && px[y][x] !== 'k';
    return px.map((row, y) => [...row].map((ch, x) =>
      ch === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'k' : ch).join(''));
  }

  // Crisp SVG: one <rect> per horizontal run of one color. Scales to any size.
  function toSVG(icon, size, opts) {
    const o = Object.assign({ outline: true, title: true }, opts);
    const pal = palette(o.sphere || icon.sphere);
    const px = o.outline ? withOutline(icon.px) : icon.px;
    const rects = [];
    px.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let w = 1;
        while (row[x + w] === ch) w++;
        if (ch !== '.') rects.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"/>`);
        x += w;
      }
    });
    const t = o.title ? `<title>${icon.name}</title>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${icon.name}">${t}${rects.join('')}</svg>`;
  }

  const ICONS = [
    // ---------------- actions: a verb on an object, hands not heads ----------------
    {
      id: 'joint-venture', name: 'Joint Venture', kind: 'action', sphere: 'gold',
      text: '+3 gold, and +1 gold to a player you choose.',
      idea: 'a big coin for you, a small one for them, over a handshake',
      px: [
        '........................',
        '........................',
        '.....3322...............',
        '....332222..............',
        '...32222222.............',
        '...32222222.....332.....',
        '...22222221....32222....',
        '...22222221....22222....',
        '....222211.....22221....',
        '.....2211.......221.....',
        '........................',
        '...........lll..........',
        '..........lllll.........',
        '.3222223lllllllldmmmmmm.',
        '.2222223mmmmlllldmmmmmm.',
        '.2222223lllllllldmmmmmm.',
        '.2222223mmmmlllldmmmmmm.',
        '.2222223lllllllldmmmmmm.',
        '.1111113mmmmlllldmmmmdd.',
        '........lllllll.........',
        '........................',
        '........................',
        '........................',
        '........................',
      ],
    },
    {
      id: 'strike', name: 'Strike', kind: 'action', sphere: 'gold',
      text: 'Double your gold.',
      idea: 'a pickaxe strikes a gold nugget — strike it rich',
      px: [
        '........................',
        '........................',
        '........................',
        '..mml...................',
        '...dmmml................',
        '.....dmmmml.............',
        '.......dmmmml...........',
        '........1ddmmml.........',
        '........1d..dmml........',
        '.......1d.....dml...l...',
        '.......1d....l.dml.lll..',
        '......1d....lll.ml..l...',
        '......1d.....l...m......',
        '.....1d........33322....',
        '.....1d......3l332222...',
        '....1d......3333222221..',
        '....1d.....33332222221..',
        '...1d.....322222222211..',
        '...1d.....322222122211..',
        '..1d......222221222111..',
        '..1d.......22221222111..',
        '............211111111...',
        '........................',
        '........................',
      ],
    },
    {
      id: 'pickpocket', name: 'Pickpocket', kind: 'action', sphere: 'magenta',
      text: 'Take 2 / 3 / 4 resources (by round) from rivals, split as you like.',
      idea: 'a gloved hand dips into a trouser pocket',
      px: [
        '........................',
        '..............111111....',
        '..............111111....',
        '..............333333....',
        '............32222222....',
        '...........322222222....',
        '.........32222222221....',
        '.........2222222211.....',
        '.........22122122.......',
        '.........22122122.......',
        '.mmmmmmmm22122122mm.....',
        '.ddddlldd22122122dd.....',
        '.dddlllmd22122122dd.....',
        '.dddllllllllllllddd.....',
        '.dddmmmmmmmmmmmmddd.....',
        '.dddmmmmmmmmmmmmddd.....',
        '.dddmmmmmmmmmmmmddd.....',
        '.dddmmmmmmmmmmmmddd.....',
        '.ddddmmmmmmmmmmdddd.....',
        '.dddddmmmmmmmmddddd.....',
        '.dddddddmmmmddddddd.....',
        '.dddddddddddddddddd.....',
        '.dddddddddddddddddd.....',
        '........................',
      ],
    },
    {
      id: 'heist', name: 'Heist', kind: 'action', sphere: 'magenta',
      text: 'Take any rival’s member. They recruit any face-up member costing up to the same, free.',
      idea: 'a gloved hand lifts a member off the board like a game piece',
      px: [
        '........................',
        '..............111111....',
        '..............111111....',
        '..............333333....',
        '............322222222...',
        '...........3222222221...',
        '..........32222222211...',
        '..........222222211.....',
        '..........221.21........',
        '........llll.21.........',
        '.......llllll2..........',
        '.......lllllm...........',
        '........lllm............',
        '....lllllllllllm........',
        '...llllllllllllmm.......',
        '.....lllllllllm.........',
        '......llllllmm..........',
        '......llllllmm..........',
        '.....llll..lllm.........',
        '....lllll..llllm........',
        '........................',
        '........................',
        '....kkkkkkkkkkkk........',
        '........................',
      ],
    },
    {
      id: 'echo', name: 'Echo', kind: 'action', sphere: 'green',
      text: 'Copy any outer-ring space taken this round.',
      idea: 'a note and its fainter echo — the same thing, again',
      px: [
        '........................',
        '........................',
        '.......32...............',
        '.......2232.............',
        '.......22322.....1......',
        '.......22.222....11.....',
        '.......22..222...1.1....',
        '.......22...22...1..1...',
        '.......22...22...1..1...',
        '.......22..22....1.1....',
        '.......22.2......1......',
        '.......22........1......',
        '.......22.....1111......',
        '.......22....11111......',
        '.......22....11111......',
        '..3322222.....111.......',
        '.332222222..............',
        '.322222222..............',
        '.222222221..............',
        '..2222221...............',
        '...22111................',
        '........................',
        '........................',
        '........................',
      ],
    },
    {
      id: 'toast', name: 'Toast', kind: 'action', sphere: 'silver',
      text: '+3 silver per round number (3 / 6 / 9), and everyone else +1 silver.',
      idea: 'two goblets clink — everyone at the table gets a little',
      px: [
        '........................',
        '........................',
        '........................',
        '...........ll...........',
        '......l...llll...l......',
        '...........ll...........',
        '....llllllll............',
        '...322222221............',
        '...322222221llllllll....',
        '...322222211322222221...',
        '....3222211.322222221...',
        '.....22211..322222211...',
        '......221....3222211....',
        '......21......22211.....',
        '......21.......221......',
        '.....21.........21......',
        '.....21.........21......',
        '.....21..........21.....',
        '...322221........21.....',
        '..1111111........21.....',
        '...............322221...',
        '...............1111111..',
        '........................',
        '........................',
      ],
    },
    // ---------------- members: a person (head + shoulders) and one prop that breaks the silhouette ----------------
    {
      id: 'banker', name: 'Banker', kind: 'member', sphere: 'gold',
      text: 'At round start, +3 gold.',
      idea: 'bowler hat, gold coat, money bag held out',
      px: [
        '........................',
        '........................',
        '.......dddddd...........',
        '......dmmddddd..........',
        '......dmdddddd..........',
        '......dddddddd..........',
        '....dddddddddddd........',
        '......llllllll..........',
        '......llllllll..........',
        '......lllkllkl..........',
        '......llllllll...llll...',
        '.......llllll.....dd....',
        '........llll.....llll...',
        '....2222llll222kllllll..',
        '...222222ll222kllllllll.',
        '..233222211222klll322ll.',
        '..232222211222kll32222l.',
        '..222222222221kll22222m.',
        '..222222222221kll22221m.',
        '..222222222221klll221mm.',
        '..2222222222211klllmmm..',
        '..22222222222211kmmmm...',
        '..222222222222211k......',
        '........................',
      ],
    },
    {
      id: 'tycoon', name: 'Tycoon', kind: 'member', sphere: 'gold',
      text: 'Game end: +1 follower per 3 gold.',
      idea: 'top hat and moustache beside a tall stack of coins',
      px: [
        '........................',
        '........................',
        '.......dddddd...........',
        '.......dmdddd...........',
        '.......dmdddd...........',
        '.......dddddd...........',
        '.......222222...........',
        '.....dddddddddd.........',
        '......llllllll..........',
        '......lllkllkl..........',
        '......llllllll..........',
        '......lllddddl..........',
        '.......llllll.....3333..',
        '...22222llll2222k233332.',
        '..2222222ll22222k111111.',
        '.233222221122222k322222.',
        '.232222211112222k111111.',
        '.222222211112221k322222.',
        '.222222231132221k111111.',
        '.222222213312221k322222.',
        '.222222211112221k111111.',
        '.222222211112211k322222.',
        '.222222211112211k111111.',
        '........................',
      ],
    },
    {
      id: 'cutpurse', name: 'Cutpurse', kind: 'member', sphere: 'magenta',
      text: 'At round start, take 1 resource from the rival holding the most.',
      idea: 'hooded, masked, dangling a stolen purse',
      px: [
        '........................',
        '........................',
        '.........32.............',
        '........3222............',
        '.......322222...........',
        '......32222222..........',
        '.....322dddd222.........',
        '.....22dlllld22.........',
        '.....221l11l122.........',
        '.....22dlllld22.........',
        '.....22dllkld22.........',
        '......22dlld22..........',
        '.....2222222222.........',
        '....222222222222222ll...',
        '...3222222222221111ll...',
        '..32222122222221...d....',
        '..2222212222222....d....',
        '..222221222222211.llll..',
        '..22222122222221.llllll.',
        '..22222122222221.lllllm.',
        '..2222212222222l.lllllm.',
        '..2222212222222l..lmmm..',
        '..2222212222221l........',
        '........................',
      ],
    },
    {
      id: 'doppelganger', name: 'Doppelganger', kind: 'member', sphere: 'red',
      text: 'When recruited: copies the effect of one of your members.',
      idea: 'holds up a mask of their own face',
      px: [
        '........................',
        '........................',
        '...............llllll...',
        '....dddddd....llllllll..',
        '...dddddddd...llllllll..',
        '...dlllllld...llkllkll..',
        '...llkllkll...llllllll..',
        '...llllllll...lllkklll..',
        '...lllkklll....llllll...',
        '....llllll.......dd.....',
        '.....llll........dd.....',
        '..322llll222....llll....',
        '.32222ll22222222llll....',
        '.222221122222211.dd.....',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '.222222222222211........',
        '........................',
      ],
    },
  ];

  const api = { ICONS, SPHERES, NEUTRALS, palette, validate, withOutline, toSVG };
  g.CultIcons = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
