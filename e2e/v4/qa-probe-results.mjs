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
  // heap snapshot: who retains the detached trees?
  await cdp.send('HeapProfiler.enable');
  let chunks = [];
  cdp.on('HeapProfiler.addHeapSnapshotChunk', e => chunks.push(e.chunk));
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false });
  const snap = JSON.parse(chunks.join('')); chunks = null;
  const m = snap.snapshot.meta, NF = m.node_fields.length, EF = m.edge_fields.length;
  const nT = m.node_types[0], eT = m.edge_types[0];
  const iName = m.node_fields.indexOf('name'), iEC = m.node_fields.indexOf('edge_count'), iDet = m.node_fields.indexOf('detachedness'), iType = m.node_fields.indexOf('type');
  const eTypeI = m.edge_fields.indexOf('type'), eNameI = m.edge_fields.indexOf('name_or_index'), eToI = m.edge_fields.indexOf('to_node');
  const N = snap.nodes, E = snap.edges, S = snap.strings, n = N.length / NF;
  const firstEdge = new Uint32Array(n + 1); for (let i = 0, e = 0; i < n; i++) { firstEdge[i] = e; e += N[i * NF + iEC] * EF; } firstEdge[n] = E.length;
  const rev = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) for (let e = firstEdge[i]; e < firstEdge[i + 1]; e += EF) { const t = eT[E[e + eTypeI]]; if (t === 'weak') continue; rev[E[e + eToI] / NF].push([i, e]); }
  const name = i => S[N[i * NF + iName]];
  const ename = e => { const t = eT[E[e + eTypeI]]; const v = E[e + eNameI]; return t === 'element' || t === 'hidden' ? `[${v}]` : S[v]; };
  const targets = []; for (let i = 0; i < n; i++) if (N[i * NF + iDet] === 2 && /^(HTML|SVG)\w*Element$/.test(name(i)) === false && /class="(lt-wheel|lt-shop"|overlay moment|lt-seat lt-seat-0|card lt-card)/.test(name(i))) targets.push(i);
  const fallbackTargets = []; for (let i = 0; i < n && fallbackTargets.length < 5; i++) if (N[i * NF + iDet] === 2 && /SECTION|section/.test(name(i))) fallbackTargets.push(i);
  console.log('targets', targets.slice(0, 8).map(name), 'fallback', fallbackTargets.map(name));
  for (const t of (targets.length ? targets : fallbackTargets).slice(0, 6)) {
    // BFS back to a JS-ish retainer (skip native DOM edges): print the first 12 hops of the shortest path
    const prev = new Map([[t, null]]); const q = [t]; let hit = null;
    while (q.length && !hit) { const x = q.shift(); for (const [from, e] of rev[x]) { if (prev.has(from)) continue; prev.set(from, [x, e]); const nm = name(from); if (nT[N[from * NF + iType]] === 'synthetic' || /^\(GC roots\)|Window \/|^system \/ Context$/.test(nm)) { hit = from; break; } if (prev.size < 400000) q.push(from); } }
    const path = []; let c = hit; while (c != null && prev.get(c)) { const [x, e] = prev.get(c); path.push(`${name(c).slice(0, 40)} -${ename(e)}->`); c = x; }
    console.log('RETAIN', name(t).slice(0, 60), '<=', path.slice(0, 14).join(' '));
  }
}
console.log('round I', JSON.stringify(r1), 'results', JSON.stringify(await cdpNodes()), 'secs', Math.round((Date.now() - t0) / 1000));
console.log(JSON.stringify(r, null, 1));
await browser.close();
