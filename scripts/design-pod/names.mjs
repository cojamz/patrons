import { browserPath } from '../../e2e/v4/lib/browser.mjs';
// Design pod: the widest member name, as the shop card draws it, against the card's name box.
//   node scripts/design-pod/names.mjs [--size 1270x700]
import { chromium } from 'playwright';
import { allQuadrantIds, quadrant } from '../../src/engine/v4/index.js';
const argv = process.argv.slice(2);
const i = argv.indexOf('--size'); const [W, H] = (i >= 0 ? argv[i + 1] : '1270x700').split('x').map(Number);
const base = process.env.V4_URL || 'http://127.0.0.1:5410';
const names = [...new Set(allQuadrantIds().flatMap(q => (quadrant(q).members || []).map(c => c.name)))];
const b = await chromium.launch({ executablePath: browserPath });
const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
await page.goto(`${base}/?intro=0`); await page.waitForSelector('[data-home]', { timeout: 90000 });
const r = await page.evaluate(names => {
  // a probe styled exactly as a shop card's name (the rules live in lamp-b.css)
  const card = document.createElement('div'); card.className = 'card lt-card paper'; card.style.cssText = 'position:absolute;left:-9999px;width:auto';
  const nm = document.createElement('span'); nm.className = 'nm'; nm.style.cssText = 'white-space:nowrap;display:inline-block;height:auto';
  const wrap = document.createElement('div'); wrap.className = 'lt'; wrap.appendChild(card); card.appendChild(nm); document.body.appendChild(wrap);
  const out = names.flatMap(n => n.split(' ').map(w => { nm.textContent = w; return [w, nm.getBoundingClientRect().width]; }));
  const s = getComputedStyle(nm); wrap.remove();
  return { font: `${s.fontSize} ${s.fontWeight} ls ${s.letterSpacing}`, widest: out.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w, x]) => `${w} ${x.toFixed(1)}`) };
}, names);
console.log(r.font); console.log(r.widest.join('\n'));
await b.close();
