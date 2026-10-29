import { browserPath, launchBrowser, cdpOk, DESK } from '../e2e/v4/lib/browser.mjs';
// The wheel spin as a person feels it: on your turn (round I, spaces lit), press → and count the frames the spin
// actually paints. node scripts/v4-spin.mjs <url> [--cpu=4] [--spins=10] [--gpu] (software rendering unless --gpu)
// --size=1512x945 --dpr=2: a 14-inch MacBook's window. Reports per spin: the key's wait to paint (Event Timing), frames painted while it turned and the longest gap.
import { firefox } from 'playwright';

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x === `--${n}` || x.startsWith(`--${n}=`)); if (!a) return d; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : true; };
const url = argv.find(a => !a.startsWith('--'));
const CPU = Number(flag('cpu', 4)), SPINS = Number(flag('spins', 10));
const sleep = ms => new Promise(r => setTimeout(r, ms));
// --firefox: Playwright's Firefox (Cory plays in Firefox on a Mac); no CPU throttle there, the box's own speed
const FF = !!flag('firefox', false) || !cdpOk;
const browser = FF ? await firefox.launch({ firefoxUserPrefs: DESK }) : await launchBrowser({ executablePath: browserPath, args: flag('gpu', false) ? [] : ['--disable-gpu', '--disable-gpu-compositing'] });
const [VW, VH] = String(flag('size', '1270x700')).split('x').map(Number);
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: Number(flag('dpr', 1)) });
await ctx.addInitScript(() => {
  const F = (window.__sp = { keys: [] });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'keydown') F.keys.push(Math.round(e.duration)); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  F.watch = ms => new Promise(done => { const fr = []; const t0 = performance.now(); let last = t0; const tick = t => { fr.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(tick); else done(fr); }; requestAnimationFrame(tick); });
});
await ctx.addInitScript(() => { let a = 20261028; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
// --css="<rules>": add a stylesheet before the spins, to find which paint a spin is paying for
const CSS = flag('css', '');
const page = await ctx.newPage();
const cdp = FF ? null : await ctx.newCDPSession(page);
await page.goto(`${url.replace(/\/$/, '')}/?intro=0&sound=off${flag('q', '')}`);
await page.click('[data-home="local"]');
await page.waitForSelector('[data-start]');
await page.click('[data-start]');
await page.waitForSelector('.app.game');
// to your first placing turn, the table settled
for (let i = 0; i < 400; i++) {
  const g = await page.evaluate(() => { const e = document.querySelector('.app.game'); return e && e.dataset.yours === '1' && e.dataset.phase === 'place' && e.dataset.animating !== 'true' && document.querySelectorAll('.lt-wheel [data-slot][data-option]').length; });
  if (g) break;
  const opt = await page.$('[data-option^="color:"]'); if (opt) { await opt.click().catch(() => {}); }
  await sleep(250);
}
await sleep(1500);
await page.mouse.move(5, 5);
if (CSS) { await page.addStyleTag({ content: String(CSS) }); await sleep(500); }
if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const out = [];
// --every=ms: turn it round and round, a press every ms for the whole --spins, watched as one stretch (a person spinning to look)
const EVERY = Number(flag('every', 0));
if (EVERY) {
  const w = page.evaluate(ms => window.__sp.watch(ms), SPINS * EVERY + 700);
  await sleep(30);
  for (let k = 0; k < SPINS; k++) { await page.keyboard.press(k % 4 < 2 ? 'ArrowRight' : 'ArrowLeft'); await sleep(EVERY); }
  const fr = await w;
  if (flag('frames', false)) { let t = 0; console.log(fr.map(x => { t += x; return x > 34 ? `${Math.round(x)}@${Math.round(t)}` : null; }).filter(Boolean).join(' ')); }
  console.log(`${url} round and round, a press every ${EVERY} ms: ${fr.length} frames in ${Math.round(fr.reduce((a, b) => a + b, 0))} ms, worst gap ${Math.round(Math.max(...fr))} ms, gaps over 50 ms ${fr.filter(x => x > 50).length}`);
  await browser.close();
  process.exit(0);
}
for (let k = 0; k < SPINS; k++) {
  const w = page.evaluate(() => window.__sp.watch(700));
  await sleep(30);
  await page.keyboard.press(k % 2 ? 'ArrowLeft' : 'ArrowRight');
  const fr = await w;
  // frames during the spin's ~300 ms (after the key): the gaps between painted frames
  if (flag("frames", false)) console.log(fr.map(Math.round).join(" "));
  out.push({ frames: fr.length, worst: Math.round(Math.max(...fr)), over50: fr.filter(x => x > 50).length });
  await sleep(500);
}
const keys = await page.evaluate(() => window.__sp.keys);
await browser.close();
const med = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
console.log(`${url} ${FF ? 'firefox' : `chrome cpu ${CPU}x ${flag('gpu', false) ? 'gpu' : 'software'}`}: frames in 700 ms median ${med(out.map(o => o.frames))}, worst gap median ${med(out.map(o => o.worst))} ms, max ${Math.max(...out.map(o => o.worst))} ms; key to paint ${keys.length ? `median ${med(keys)} max ${Math.max(...keys)}` : 'all under 16'} ms`);
console.log(JSON.stringify(out));
