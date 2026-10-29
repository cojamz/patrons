// Chart a v4-balance-report.mjs --json file: lift per color, artifact and member. Usage: node scripts/v4-balance-chart.mjs <report.json> <out.png> "<title>"
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const [, , inp, outp, title] = process.argv;
const r = JSON.parse(readFileSync(inp, 'utf8'));
const se = (p, n) => Math.sqrt(Math.max(p * (1 - p), 0.05) / n);
const fromObj = o => Object.entries(o).map(([k, v]) => ({ k, lift: (v.w - v.e) / v.n, err: se(v.w / v.n, v.n), n: v.n })).sort((a, b) => b.lift - a.lift);
const NAMES = { trading: 'White', red: 'Red', echo: 'Green', thieves: 'Magenta', market: 'Blue', purple: 'Purple', benders: 'Guest' };
const nm = k => k.replace(/\((\w+)\)$/, (_, c) => `(${NAMES[c] || c})`);
const colors = fromObj(r.colors).map(x => ({ ...x, k: NAMES[x.k] || x.k }));
const arts = fromObj(r.artifacts).map(x => ({ ...x, k: nm(x.k) }));
const mt = r.memberTable.map(m => ({ k: nm(m.k), lift: m.lift, err: m.err, n: m.n }));
const mem = [...mt.slice(0, 8), null, ...mt.slice(-8)];
const bar = x => { if (!x) return '<div class="gap">…</div>'; const s = 300, w = Math.abs(x.lift) * s * 2.5, e = x.err * s * 2.5;
  const strong = Math.abs(x.lift) > 2 * x.err;
  return `<div class="row"><div class="lab">${x.k}</div><div class="track"><div class="mid"></div>
  <div class="b ${x.lift >= 0 ? 'pos' : 'neg'} ${strong ? '' : 'faint'}" style="${x.lift >= 0 ? 'left:50%' : `right:50%`};width:${w}px"></div>
  <div class="err" style="left:calc(50% + ${Math.max(-150, x.lift * s * 2.5 - e)}px);width:${Math.min(2 * e, 150 - Math.max(-150, x.lift * s * 2.5 - e))}px"></div></div>
  <div class="num">${x.lift >= 0 ? '+' : ''}${Math.round(x.lift * 100)}</div><div class="n">${x.n}</div></div>`; };
const sec = (h, list) => `<h2>${h}</h2>${list.map(bar).join('')}`;
const html = `<html><style>body{font:14px system-ui;background:#1b1712;color:#eee;padding:16px 24px;width:1000px}
h1{font-size:19px;margin:0 0 4px}p{margin:0 0 10px;color:#bbb}h2{font-size:15px;margin:14px 0 4px;color:#f2c879}
.cols{display:flex;gap:40px}.col{flex:1}.row{display:flex;align-items:center;height:20px}.lab{width:190px;text-align:right;padding-right:8px;white-space:nowrap}
.track{position:relative;width:300px;height:14px}.mid{position:absolute;left:50%;top:-3px;bottom:-3px;border-left:1px solid #777}
.b{position:absolute;top:2px;height:10px}.pos{background:#6fbf73}.neg{background:#e0675e}.faint{opacity:.4}
.err{position:absolute;top:6px;height:2px;background:#ddd8}.num{width:36px;text-align:right}.n{width:40px;text-align:right;color:#888;font-size:12px}.gap{padding-left:200px;color:#777}</style>
<h1>${title}</h1><p>Win share above or below what that seat's member count predicts, in points (25 = a whole extra fair share at 4 players). Faded bars are within noise. Grey number: seats.</p>
<div class="cols"><div class="col">${sec('Main color (3+ members of it)', colors)}${sec('Artifacts', arts)}</div><div class="col">${sec('Members, strongest and weakest', mem)}</div></div></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch()); const pg = await b.newPage({ viewport: { width: 1050, height: 600 } });
await pg.setContent(html); await pg.screenshot({ path: outp, fullPage: true }); await b.close();
