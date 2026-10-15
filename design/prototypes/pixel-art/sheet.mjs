// Every sphere's members as the game draws them, one row a sphere, at 48px (the stage) and 24px (a chair).
// node design/prototypes/pixel-art/sheet.mjs [out.png]
import { chromium } from 'playwright';
import S from '../../../src/v4/art/icons/index.js';
import { palette, personPalette, withOutline, markPerson } from '../../../src/v4/art/index.js';
const [out = '/tmp/members-sheet.png'] = process.argv.slice(2);
const svg = (i, size) => {
  const pal = { ...palette(i.sphere), ...personPalette(i.id) };
  let r = '';
  withOutline((markPerson(i.px))).forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>`; }));
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" shape-rendering="crispEdges">${r}</svg>`;
};
const spheres = [...new Set(S.filter(i => i.kind === 'member').map(i => i.sphere))];
const html = `<html><body style="margin:0;background:#1d1611;color:#cbb894;font:11px sans-serif;padding:12px">
<style>.row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.c{width:56px;text-align:center}.n{font-size:9px;white-space:nowrap;overflow:hidden}</style>
${spheres.map(s => `<div>${s}</div><div class="row">${S.filter(i => i.kind === 'member' && i.sphere === s && !/ (Recruit|Hand|Helper|Regular|Devotee|Elder|Pillar|Patron)$/.test(i.name)).map(i => `<div class="c">${svg(i, 48)}<br>${svg(i, 24)}<div class="n">${i.name}</div></div>`).join('')}</div>`).join('')}</body></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 1270, height: 400 } })).newPage();
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close();
console.log(out);
