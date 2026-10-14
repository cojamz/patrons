// Option 2's vignettes: one 16×16 pixel scene per action (shown at 2×, 32px), in the house style
// (design/prototypes/pixel-art/style.md): palette keys only (1/2/3 = the sphere's shade/base/highlight; k d m l neutrals;
// o = lamp glow), light from the top-left, the 1px ink outline added by the renderer. Drawn with a tiny painter so
// shapes stay clean. Each scene is the cult act itself: the kickback envelope, the velvet rope, the open door.
(function () {
  function Grid(w = 16, h = 16) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const api = {
      px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c; return api; },
      rect(x, y, rw, rh, c) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) api.px(x + i, y + j, c); return api; },
      frame(x, y, rw, rh, c) { for (let i = 0; i < rw; i++) { api.px(x + i, y, c); api.px(x + i, y + rh - 1, c); } for (let j = 0; j < rh; j++) { api.px(x, y + j, c); api.px(x + rw - 1, y + j, c); } return api; },
      line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) api.px(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), c); return api; },
      /** A lit disc: highlight up-left, shade down-right (cx, cy may be .5). */
      ball(cx, cy, r, lit = true) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
          if (d <= r) g[y][x] = !lit ? '2' : (dx + dy < -r * 0.55 ? '3' : dx + dy > r * 0.75 ? '1' : '2');
        }
        return api;
      },
      disc(cx, cy, r, c) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) g[y][x] = c; return api; },
      ring(cx, cy, r0, r1, c) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d <= r1 && d > r0) g[y][x] = c; } return api; },
      put(x, y, rows) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== ' ') api.px(x + i, y + j, c); })); return api; },
      /** a side-on stack of n coins, width cw, bottom at row y. */
      stack(x, y, n, cw = 5) { for (let k = 0; k < n; k++) { const top = y - 2 * k - 1; api.rect(x, top, cw, 1, '2'); api.px(x, top, '3'); api.px(x + cw - 1, top, '1'); api.rect(x, top + 1, cw, 1, '1'); } return api; },
      rows: () => g.map(r => r.join('')),
    };
    return api;
  }
  const hand = [ // a hand reaching from the right, palm down, fingers left
    '  llll  ',
    'llllllll',
    ' mllllll',
    '  mmllll',
  ];
  const S = {};
  // ---------- Gold: the cult's books ----------
  S['gold.jv'] = Grid().rect(2, 7, 12, 7, 'l').line(2, 7, 7, 11, 'm').line(13, 7, 8, 11, 'm').rect(2, 13, 12, 1, 'm')
    .ball(10.5, 5, 3.2).px(10, 5, 'k').px(11, 5, 'k').rows();
  S['gold.rush'] = Grid().stack(1, 15, 2).stack(6, 15, 4).stack(11, 15, 6).px(14, 2, 'l').px(13, 1, 'l').px(15, 1, 'l').px(14, 0, 'l').rows();
  S['gold.discount'] = Grid().put(1, 1, [
    '   222222222',
    '  2333333333',
    ' 23k22222222',
    '  2222222221',
    '   111111111',
  ]).line(5, 0, 6, 1, 'd').line(4, 9, 11, 15, 'm').line(11, 9, 4, 15, 'm').line(5, 9, 11, 14, 'l').disc(3.5, 14.5, 1.5, 'd').disc(12.5, 14.5, 1.5, 'd').px(7, 12, 'k').rows();
  S['gold.steal'] = Grid().put(1, 5, [
    '   kk',
    '  2kk2',
    '   22',
    '  2332',
    ' 233222',
    '23222222',
    '22222222',
    '22222221',
    ' 222221',
    '  1111',
  ]).line(4, 2, 4, 4, 'd').line(5, 1, 8, 1, 'd').px(9, 2, 'd').line(10, 3, 14, 7, 'd').line(11, 3, 15, 7, 'm').ball(12.5, 12.5, 2.2).ball(9.5, 13.5, 1.8).rows();
  S['gold.windfall'] = Grid().put(1, 9, [
    ' mmmmmmmmmmmm',
    'mllllllllllllm',
    ' mmllllllllmm',
    '   mmmmmmmm',
  ]).ball(5, 7.5, 2.4).ball(10, 7.5, 2.4).ball(7.5, 4.8, 2.4).rows();
  S['gold.strike'] = Grid().stack(1, 14, 5).stack(7, 14, 5).put(11, 9, [
    'lllll',
    'lklll',
    'lllll',
    'lllkl',
    'mmmmm',
  ]).px(13, 2, 'l').px(12, 3, 'l').px(14, 3, 'l').px(13, 4, 'l').rows();
  // ---------- Red: the door and the crowd ----------
  S['red.scout'] = Grid().rect(2, 5, 2, 10, 'm').rect(12, 5, 2, 10, 'm').disc(3, 4.5, 1.6, 'l').disc(13, 4.5, 1.6, 'l')
    .rect(1, 14, 4, 1, 'd').rect(11, 14, 4, 1, 'd')
    .line(4, 6, 6, 9, '2').line(7, 9, 9, 9, '2').line(10, 9, 12, 6, '2').line(4, 7, 6, 10, '1').line(7, 10, 9, 10, '1').line(10, 10, 12, 7, '1').rows();
  S['red.turnout'] = Grid().rect(2, 8, 11, 4, '2').rect(2, 8, 11, 1, '3').rect(2, 11, 11, 1, '1')
    .disc(4.5, 13, 2, 'd').disc(10.5, 13, 2, 'd').px(4, 12, 'm').px(10, 12, 'm')
    .line(12, 1, 12, 8, 'd').put(6, 1, ['222222', ' 22221', '  2221', '   21']).put(3, 5, ['m', 'mm', 'mm']).put(6, 5, ['l', 'll', 'll']).put(9, 5, ['m', 'mm']).rows();
  S['red.hire'] = Grid().rect(5, 1, 9, 14, 'd').rect(6, 2, 7, 13, 'o').rect(6, 13, 7, 2, 'l')
    .put(1, 2, ['3', '32', '322', '322', '322', '32k', '322', '322', '322', '322', '322', '32', '3']).rect(9, 7, 2, 1, 'd').put(8, 8, ['dd', 'dd', 'dd', 'dd', 'd d']).rows();
  S['red.hireup'] = Grid().put(1, 1, [
    '      22',
    '     2332',
    '    233322',
    '   23333222',
    '  2333332222',
    ' 233333322222',
    '22222222222221',
  ]).rect(2, 8, 12, 7, 'l').rect(2, 14, 12, 1, 'm').rect(6, 9, 4, 6, 'd').rect(7, 10, 2, 5, 'o').rect(3, 9, 2, 2, 'd').rect(11, 9, 2, 2, 'd').rows();
  S['red.trade'] = Grid().put(1, 2, [
    '33333',
    '3lll2',
    '3lmll',
    '3mmm2',
    '3mmm2',
    '3lll2',
    '22221',
  ]).put(10, 7, [
    'mmmmm',
    'mlll1',
    'ml2ll',
    'm2221',
    'm2221',
    'mlll1',
    'm1111',
  ]).line(6, 4, 9, 4, 'k').px(8, 3, 'k').px(8, 5, 'k').line(9, 11, 6, 11, 'k').px(7, 10, 'k').px(7, 12, 'k').rows();
  S['red.take'] = Grid().put(0, 9, [
    '22222      22222',
    '2lll2      2lll1',
    '2l2l2      2l2l1',
    '2lll2      2lll1',
    '2lll2      2lll1',
    '22221      21111',
  ]).put(5, 3, [
    '333333',
    '3llll2',
    '3l22l2',
    '3llll2',
    '3llll2',
    '222221',
  ]).px(7, 0, 'l').px(8, 0, 'l').px(6, 1, 'l').px(9, 1, 'l').px(7, 1, 'o').px(8, 1, 'o').rows();
  // ---------- Blue: the market ----------
  S['blue.bargain'] = Grid().put(1, 1, [
    '33l33l33l33l33',
    '22l22l22l22l22',
    ' 2l 2l 2l 2l 2',
  ]).rect(2, 4, 1, 8, 'd').rect(13, 4, 1, 8, 'd').rect(1, 11, 14, 4, 'm').rect(1, 11, 14, 1, 'l')
    .put(5, 6, ['lll', 'l2l', 'lll', 'lll']).ball(10.5, 9, 1.8).rows();
  S['blue.restock'] = Grid().line(13, 1, 7, 9, 'd').line(14, 1, 8, 9, 'm').put(2, 9, [
    '   2222',
    '  233322',
    ' 2323232',
    '23232321',
    '2222221',
    ' 1 1 1',
  ]).put(11, 11, ['lll', 'l2l', 'lll']).put(12, 6, ['ll', 'll']).rows();
  S['blue.showroom'] = Grid().rect(2, 1, 12, 11, 'd').rect(3, 2, 10, 9, 'l').put(5, 3, ['  mm', ' mmmm', ' mmmm', 'mmmmmm', 'mmmmmm']).rect(1, 12, 14, 2, 'm').rect(1, 12, 14, 1, 'l')
    .put(10, 0, [' 3', '322', '3221', ' 21', '  1']).rows();
  S['blue.clearance'] = Grid().put(1, 2, [
    '33333',
    '3lll2',
    '3llm2',
    '3lmm2',
    '3lmm2',
    '3lll2',
    '3lll2',
    '22221',
  ]).put(9, 5, [
    '33333',
    'llll2',
    'mlll2',
    'mmll2',
    'mmll2',
    'llll2',
    'llll2',
    '22221',
  ]).px(7, 6, 'k').px(7, 8, 'k').px(7, 10, 'k').px(8, 7, 'k').px(8, 9, 'k').rows();
  S['blue.pricecheck'] = Grid().put(1, 8, [
    '   222',
    '  23332',
    ' 2k2222',
    '  22221',
    '   111',
  ]).ring(9, 6, 3.2, 4.6, 'm').disc(9, 6, 3.2, 'l').px(8, 4, 'o').px(7, 5, 'o').line(12, 9, 15, 13, 'd').line(12, 10, 14, 13, 'd').rows();
  S['blue.spree'] = Grid().put(4, 1, ['lll', 'l2l', 'lll']).put(9, 0, ['lll', 'lml', 'lll', 'lll']).ball(7, 5.5, 1.8)
    .put(1, 6, [
      '22222222222222',
      ' 2l2l2l2l2l21',
      ' 2l2l2l2l2l21',
      '  2l2l2l2l21',
      '  2222222221',
      '   11111111',
    ]).disc(4, 13.5, 1.4, 'd').disc(11, 13.5, 1.4, 'd').rows();
  // ---------- Green: the choir ----------
  S['green.hum'] = Grid().put(2, 9, [
    '222222222222',
    '233333333332',
    ' 2222222221',
    '  22222221',
    '   111111',
  ]).ring(8, 8.2, 2.6, 3.5, 'l').ring(8, 8.2, 4.6, 5.5, 'l').ring(8, 8.2, 6.6, 7.5, 'l').rect(0, 8, 16, 1, '.').rect(2, 9, 12, 1, '2').put(3, 9, ['3']).rect(6, 14, 4, 1, 'd').rows();
  S['green.chant'] = Grid().put(1, 9, [
    'lllllll lllllll',
    'lmmmmll lmmmmll',
    'llllllllllllll',
    '22222222222222',
    ' 111111111111',
  ]).put(2, 3, ['k', 'k', 'kk', '22']).put(7, 1, ['k', 'k', 'k', 'k', '22', '22']).put(12, 0, ['k ', 'kk', 'k', 'k', 'k', 'k', '22', '22']).rows();
  S['green.echo'] = Grid().put(1, 2, [
    '  mmm',
    ' mmmmm',
    ' mdddm',
    ' mdldm',
    'mmmmmmm',
    'mmmmmmm',
    'mmmmmmm',
    'mmmmmmm',
    'mmmmmmm',
    'mmmmmmm',
  ]).put(8, 3, [
    '  333',
    ' 3   3',
    ' 3 2 3',
    ' 3   3',
    '3     3',
    '3 2 2 3',
    '3     3',
    '3 2 2 3',
    '3     3',
    '3333333',
  ]).rows();
  S['green.encore'] = Grid().rect(0, 0, 16, 2, '1').put(0, 2, [
    '2223       3222',
    '2223       3222',
    '223         322',
    '223         322',
    '23           32',
    '23           32',
    '23           32',
    '3             3',
  ]).put(6, 7, ['ooo', 'ooo', 'oooo', 'ooooo', 'ooooo']).rect(4, 12, 8, 1, 'o').rect(0, 13, 16, 2, 'd').put(7, 7, ['m', 'mm', 'mm']).rows();
  S['green.refrain'] = Grid().ring(8, 8, 3.6, 6.4, '2').ring(8, 8, 5.2, 6.4, '1').rect(7, 0, 3, 5, '.').put(6, 0, ['3', '33', '333', '33', '3']).put(10, 2, ['1', '11', '1']).disc(8, 8, 1.6, 'l').rows();
  S['green.eternity'] = Grid().ring(8, 8.5, 3.4, 6.2, '2').ring(8, 8.5, 3.4, 4.2, '3').ring(8, 8.5, 5.4, 6.2, '1').rect(10, 1, 4, 4, '.')
    .put(9, 1, ['  333', ' 32222', '322k22', ' 222', '  2']).put(12, 6, ['1']).rows();

  window.SCENES = S;
})();
