import { chromium } from 'playwright';
import { answerChoice } from './lib/answer.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
const cdpNodes = async () => { await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value])); const live = await page.evaluate(() => { let t = 0; const w = document.createTreeWalker(document, NodeFilter.SHOW_ALL); while (w.nextNode()) t++; return t; }); return { cdp: m.Nodes, live, listeners: m.JSEventListeners }; };
await page.goto('http://127.0.0.1:5404/?botDelay=30&intro=0');
await page.click('[data-home="local"]'); await page.waitForSelector('[data-start]'); await page.click('[data-start]');
await page.waitForSelector('.lt-seat[data-pid]');
let r1 = null;
const t0 = Date.now();
while (!(await page.$('.results')) && Date.now() - t0 < 600000) {
  const next = await page.$('[data-next-round]');
  if (next) { await next.click().catch(() => {}); continue; }
  if (!r1) { const rd = await page.$eval('.app.game', e => e.dataset.round).catch(() => '0'); if (rd === '1' && await page.$('.lt[data-phase="place"][data-yours="1"]')) r1 = await cdpNodes(); }
  const did = await answerChoice(page, { prefer: [/^(card|pay):/, /^tier:/], last: [/^pass$/], domFallback: true }); await page.waitForTimeout(did ? 20 : 40);
}
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const count = el => el.querySelectorAll('*').length + 1;
  const parts = {};
  for (const sel of ['.results', '.over-cults', '.over-cults .log', '.over-seat', '[data-hover-layer]', 'header', '.toast', '.flight']) parts[sel] = [...document.querySelectorAll(sel)].reduce((t, e) => t + count(e), 0);
  const kids = [...(document.querySelector('.results')?.children || [])].map(e => [String(e.className || e.tagName).slice(0, 40), count(e)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const top = [...document.querySelector('.app.game').children].map(e => [String(e.className || e.tagName).slice(0, 40), count(e)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const body = [...document.body.children].map(e => [String(e.className || e.id || e.tagName).slice(0, 40), count(e)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const bySel = {}; for (const e of document.querySelectorAll('.app.game *')) { const k = e.tagName === 'rect' ? 'rect' : e.tagName.toLowerCase(); bySel[k] = (bySel[k] || 0) + 1; }
  const svgs = [...document.querySelectorAll('.app.game svg')].map(s => [String(s.getAttribute('class') || s.parentElement.className).slice(0, 30), s.querySelectorAll('*').length]);
  const svgBy = {}; for (const [k, n] of svgs) { svgBy[k] = svgBy[k] || [0, 0]; svgBy[k][0]++; svgBy[k][1] += n; }
  const resultsSvg = [...document.querySelectorAll('.results svg')].length;
  const fat = [...document.querySelectorAll('.results *, .over-cults *')].filter(e => e.children.length > 25).map(e => [String(e.className).slice(0, 40), e.children.length, count(e)]).slice(0, 10);
  return { total: document.querySelectorAll('*').length, parts, kids, top, body, fat, bySel, svgBy: Object.entries(svgBy).sort((a, b) => b[1][1] - a[1][1]).slice(0, 10), resultsSvg };
});
{
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  const proto = await cdp.send('Runtime.evaluate', { expression: 'Node.prototype' });
  const q = await cdp.send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  const st = await cdp.send('Runtime.callFunctionOn', { objectId: q.objects.objectId, returnByValue: true, functionDeclaration: `function () {
    const det = this.filter(n => { try { return !n.isConnected; } catch { return false; } });
    const roots = new Map();
    for (const n of det) { let r = n; while (r.parentNode) r = r.parentNode; roots.set(r, (roots.get(r) || 0) + 1); }
    const desc = r => r.nodeType === 1 ? r.tagName + '.' + String(r.className && r.className.baseVal != null ? r.className.baseVal : r.className).slice(0, 50) + (r.dataset && Object.keys(r.dataset).length ? '[' + Object.keys(r.dataset).slice(0,3).join(',') + ']' : '') : r.nodeName;
    const byKind = {}; for (const [r, k] of roots) { const d = desc(r); byKind[d] = byKind[d] || [0, 0]; byKind[d][0]++; byKind[d][1] += k; }
    return { all: this.length, detached: det.length, roots: roots.size, top: Object.entries(byKind).sort((a, b) => b[1][1] - a[1][1]).slice(0, 25) };
  }` });
  console.log('DETACHED', JSON.stringify(st.result.value || st.exceptionDetails || st).slice(0, 3000));
}
console.log('round I', JSON.stringify(r1), 'results', JSON.stringify(await cdpNodes()), 'secs', Math.round((Date.now() - t0) / 1000));
console.log(JSON.stringify(r, null, 1));
await browser.close();
