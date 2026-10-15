// A sampled JS CPU profile of bot turns (use an unminified build: vite build --minify false), summed per function:
// where the main thread's script time goes while the table plays chains.
//   node design/eval/morning-fixes/motion/prof.mjs <url> [speed=steady] [secs=15]
import { chromium } from 'playwright';

const [base, speed = 'steady', secs = '15'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1270, height: 700 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.addInitScript(() => { let s = 7; Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
await p.goto(`${base}/?intro=0&speed=${speed}`);
await p.click('[data-home="local"]'); await p.click('[data-start]'); await p.waitForSelector('.lt-seat[data-pid]');
const act = async () => {
  const mine = await p.$('.app.game[data-yours="1"]'); if (!mine) return;
  const ph = await mine.getAttribute('data-phase');
  let el = ph === 'buy' ? await p.$('[data-option="pass"]:not([disabled])') : ph === 'place' ? await p.$('.slot.can .base') : null;
  if (!el) el = await p.$('.prompt [data-option]:not([disabled]), [data-option^="color:"]:not([disabled]), .dialog [data-option]:not([disabled])');
  if (el) await el.click({ timeout: 1000 }).catch(() => {});
};
const t0 = Date.now();
while (Date.now() - t0 < 30000) { if (await p.$('.app.game[data-round="1"][data-bot="1"]')) break; await act(); await p.waitForTimeout(150); }
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
const t1 = Date.now();
while (Date.now() - t1 < Number(secs) * 1000) { await act(); await p.waitForTimeout(150); }
const { profile } = await cdp.send('Profiler.stop');
await b.close();
const nodes = new Map(profile.nodes.map(n => [n.id, n]));
const dt = {};
profile.samples.forEach((id, i) => { dt[id] = (dt[id] || 0) + (profile.timeDeltas[i] || 0) / 1000; });
const key = n => `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber + 1}`;
const tot = n => { let s = dt[n.id] || 0; for (const c of n.children || []) s += tot(nodes.get(c)); n.tot = s; return s; };
const root = nodes.get(profile.nodes[0].id);
tot(root);
const self = {}, total = {};
for (const n of profile.nodes) { const k = key(n); self[k] = (self[k] || 0) + (dt[n.id] || 0); }
const walk = (n, seen) => { const k = key(n); if (!seen.has(k)) total[k] = (total[k] || 0) + n.tot; const s2 = new Set(seen); s2.add(k); for (const c of n.children || []) walk(nodes.get(c), s2); };
walk(root, new Set());
const top = (o, n) => Object.entries(o).sort((a, c) => c[1] - a[1]).slice(0, n).map(([k, v]) => `${v.toFixed(0).padStart(6)}ms ${k}`).join('\n');
console.log(`SELF\n${top(self, 25)}\nTOTAL\n${top(total, 70)}`);
