// A sphere's members as a lineup, today's drawings above the redraw, at 24px (a chair) and 48px (the stage), on the
// table. node design/prototypes/pixel-art/lineup.mjs <sphere> [out.png]   (reads redraw-<sphere>.js beside this file)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';
import S from '../../../src/v4/art/icons/index.js';
import { palette, personPalette, withOutline, markPerson } from '../../../src/v4/art/index.js';

const [sphere, out = `/tmp/lineup-${sphere}.png`] = process.argv.slice(2);
const here = new URL('.', import.meta.url).pathname;
const box = { globalThis: {} }; box.globalThis = box;
const f = `${here}redraw-${sphere}.js`;
if (existsSync(f)) vm.runInNewContext(readFileSync(f, 'utf8'), box);
const re = new Map(((box.CultRedraw || {})[sphere] || []).map(r => [r.id, r.px]));
const ib = { globalThis: {} }; ib.globalThis = ib;
vm.runInNewContext(readFileSync(`${here}icons.js`, 'utf8'), ib);
for (const [id, px] of re) for (const e of ib.CultIcons.validate({ id, px })) console.log(`INVALID ${e}`);
const svg = (id, px, size) => {
  const pal = { ...palette(sphere), ...personPalette(id) };
  let r = '';
  withOutline((markPerson(px))).forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>`; }));
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" shape-rendering="crispEdges">${r}</svg>`;
};
const ms = S.filter(i => i.kind === 'member' && i.sphere === sphere);
const row = (lab, get) => `<div class="lab">${lab}</div><div class="row">${ms.map(i => `<div class="c">${svg(i.id, get(i), 48)}<br>${svg(i.id, get(i), 24)}<div class="n">${i.name}</div></div>`).join('')}</div>`;
const html = `<html><body style="margin:0;background:#1d1611;color:#cbb894;font:12px sans-serif;padding:12px">
<style>.row{display:flex;flex-wrap:wrap;gap:8px}.c{width:64px;text-align:center}.n{font-size:9px;white-space:nowrap;overflow:hidden}.lab{margin:8px 0 4px}</style>
${row(`${sphere}: today`, i => i.px)}${row(`${sphere}: redraw (${re.size} of ${ms.length} redrawn)`, i => re.get(i.id) || i.px)}</body></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1270, height: 400 } })).newPage();
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
console.log(out);
