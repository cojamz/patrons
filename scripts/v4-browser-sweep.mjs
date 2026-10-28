import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Release crash sweep in the built game: full games in a frozen build, one person (this driver) and bots, hunting for
// page errors, console errors and softlocks (the table stops moving with nothing for anyone to answer).
//   node scripts/v4-browser-sweep.mjs <url> <games> [--pages=3] [--seats=4] [--out=design/eval/release-qa/browser]
//        [--max-min=12] [--first=1]
// Game k plays seed 1000+k (Math.random seeded), a table drawn the way the app draws one, at Quick speed with no bot
// delay. The person answers whatever is asked, rotating among the legal answers by the seed, so every game wanders a
// different way through choices, recruits and follower buys. A softlock is 30 s with nothing changing on the table
// and nothing to answer; each one saves a screenshot and the option list.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { answerChoice } from '../e2e/v4/lib/answer.mjs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const STALL = Number(process.env.SWEEP_STALL_S || 30) * 1000;
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const [base, gamesArg] = pos;
if (!base) { console.error('usage: node scripts/v4-browser-sweep.mjs <url> <games> [--pages=3]'); process.exit(2); }
const GAMES = Number(gamesArg || 12), PAGES = Number(flag('pages', 3)), OUT = flag('out', 'design/eval/release-qa/browser');
const MAX_MIN = Number(flag('max-min', 12)), FIRST = Number(flag('first', 1)), SEATS = Number(flag('seats', 4));
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await launchBrowser({ executablePath: browserPath });

async function play(k) {
  const seed = 1000 + k;
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  await ctx.addInitScript(s => {
    let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { localStorage.setItem('patrons.v4.motionSpeed', 'quick'); } catch { /* */ }
  }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${String(e.stack || e.message).split('\n').slice(0, 4).join(' / ')}`));
  const r = { game: k, seed, over: false, rounds: '', turns: 0, minutes: 0, errors, softlock: null };
  const t0 = Date.now();
  try {
    await page.goto(`${base.replace(/\/$/, '')}/?intro=0&sound=off&botDelay=1&speed=quick`);
    await page.click('[data-home="local"]');
    await page.waitForSelector('[data-start]');
    if (SEATS !== 4) {
      const seat = await page.$(`[data-seats="${SEATS}"], [data-players="${SEATS}"]`);
      if (seat) await seat.click();
    }
    await page.click('[data-start]');
    await page.waitForSelector('.app.game', { timeout: 15000 });
    let lastSig = '', still = Date.now(), turn = 0;
    while (Date.now() - t0 < MAX_MIN * 60000) {
      if (await page.$('.results')) { r.over = true; break; }
      const hand = await page.$('[data-handoff]'); if (hand) { await hand.click().catch(() => {}); await hand.dispose(); continue; }
      const next = await page.$('[data-next-round]'); if (next) { await next.click().catch(() => {}); await next.dispose(); continue; }
      const g = await page.evaluate(() => {
        const e = document.querySelector('.app.game');
        if (!e) return null;
        const round = document.querySelector('[data-round]')?.getAttribute('data-round') || '';
        return { yours: e.dataset.yours === '1', phase: e.dataset.phase, round, sig: `${e.dataset.phase}|${e.dataset.yours}|${round}|${document.querySelectorAll('[data-option]').length}|${(document.querySelector('.lt-log, .log')?.textContent || '').length}` };
      }).catch(() => null);
      if (g?.round) r.rounds = g.round;
      if (g && g.sig !== lastSig) { lastSig = g.sig; still = Date.now(); }
      let acted = false;
      if (g?.yours || await page.$('.dialog.pay')) {
        turn++;
        const a = await answerChoice(page, { last: ['pass'], skip: (seed * 7 + turn * 13) % 5, timeout: 800 }).catch(() => null);
        if (!a && g?.phase === 'place') {
          const legal = await page.$$('.lt-wheel [data-slot][data-option]');
          if (legal.length) { await legal[(seed + turn) % legal.length].click({ timeout: 800 }).catch(() => {}); acted = true; }
          for (const h of legal) h.dispose().catch(() => {});
          const confirm = await page.waitForSelector('[data-place]', { timeout: 400 }).catch(() => null);
          if (confirm) { await confirm.click().catch(() => {}); confirm.dispose().catch(() => {}); }
        }
        if (a) { acted = true; r.turns++; still = Date.now(); }
      }
      if (!acted && Date.now() - still > STALL) {
        const opts = await page.$$eval('[data-option]', els => els.map(e => `${e.getAttribute('data-option')}${e.disabled ? '(off)' : ''}`)).catch(() => []);
        r.softlock = { at: r.rounds, phase: g?.phase, yours: g?.yours, options: opts.slice(0, 30) };
        await page.screenshot({ path: `${OUT}/softlock-${seed}.png` }).catch(() => {});
        const save = await page.evaluate(() => localStorage.getItem('patrons.v4.local')).catch(() => null);
        if (save) writeFileSync(`${OUT}/softlock-${seed}.save.json`, save);
        break;
      }
      await sleep(acted ? 120 : 200);
    }
    if (!r.over && !r.softlock) r.softlock = { at: r.rounds, note: `no end in ${MAX_MIN} min` };
    if (r.over) await page.screenshot({ path: `${OUT}/end-${seed}.png` }).catch(() => {});
    if (errors.length) await page.screenshot({ path: `${OUT}/error-${seed}.png` }).catch(() => {});
  } catch (err) {
    r.errors.push(`driver: ${String(err.message).split('\n')[0]}`);
    await page.screenshot({ path: `${OUT}/driver-${seed}.png` }).catch(() => {});
  }
  r.minutes = Math.round((Date.now() - t0) / 6000) / 10;
  await ctx.close().catch(() => {});
  console.log(`game ${k} seed ${seed}: ${r.over ? 'finished' : 'NOT finished'} at round ${r.rounds}, ${r.turns} answers, ${r.minutes} min${r.softlock ? `, SOFTLOCK ${JSON.stringify(r.softlock)}` : ''}${errors.length ? `, ${errors.length} errors: ${errors[0]}` : ''}`);
  return r;
}

const results = [];
let nextGame = FIRST;
await Promise.all(Array.from({ length: PAGES }, async () => {
  while (nextGame < FIRST + GAMES) { const k = nextGame++; results.push(await play(k)); }
}));
await browser.close();
results.sort((a, b) => a.game - b.game);
const bad = results.filter(r => !r.over || r.errors.length || r.softlock);
writeFileSync(`${OUT}/browser-sweep.json`, JSON.stringify({ base, games: results.length, finished: results.filter(r => r.over).length, bad: bad.length, results }, null, 1));
console.log(`${results.length} games, ${results.filter(r => r.over).length} finished, ${bad.length} with a problem`);
process.exit(bad.length ? 1 : 0);
