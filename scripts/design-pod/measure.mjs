// Design pod: print the boxes of the game screen's regions for a saved state (default: P1 placing in round II).
//   node scripts/design-pod/measure.mjs [--q layout=a] [--size 1270x700]
import { chromium } from 'playwright';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from '../../e2e/v4/lib/stamp.mjs';
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const q = flag('q', ''), [W, H] = flag('size', '1270x700').split('x').map(Number), round = Number(flag('round', 2));
const base = process.env.V4_URL || 'http://127.0.0.1:5410';
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
let s = createGame({ seats: SEATS, seed: 5 }); s.build = buildStamp();
const rand = seededRandom(5);
const ok = st => st.round === round && st.pending && st.pending.player === 0 && st.pending.kind === 'place' && Object.values(st.slots).filter(v => v === 0).length >= 1;
for (let n = 0; n < 6000 && !ok(s); n++) s = applyMove(s, chooseBotMove(s, rand));
const save = { config: { seats: SEATS, speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const url = `${base}/?intro=0${q ? '&' + q : ''}`;
await page.goto(url);
await page.evaluate(async v => { const m = await import('/src/v4/session/record.js'); v.state.build = { ...m.BUILD }; localStorage.clear(); localStorage.setItem('patrons.v4.local', JSON.stringify(v)); localStorage.setItem('patrons.v4.introSeen', '1'); }, save);
await page.goto(url); await page.click('[data-home="resume"]', { timeout: 90000 }); await page.waitForSelector('.lt-shop .card'); await page.waitForTimeout(900);
const r = await page.evaluate(() => {
  const box = sel => [...document.querySelectorAll(sel)].map(e => { const b = e.getBoundingClientRect(); return `${sel} x${Math.round(b.left)} y${Math.round(b.top)} w${Math.round(b.width)} h${Math.round(b.height)}`; });
  return ['.lt > .lt-prompt', '.lt > .lt-wheel', '.lt-wheel .stage', '.wheel-paper .disk', '.lt > .lt-seat', '.lt > .lt-snake', '.lt > .lt-shop', '.lt-shop .lt-card', '.lt-rates .lt-rate', '.lt-deck', '.lt > .lt-since', '.turn-card'].flatMap(box);
});
console.log(r.join('\n'));
await b.close();
