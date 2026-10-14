// Foreman's own eyes: freeze a build and screenshot it, so no UI claim rests on an agent's word.
//   node scripts/v4-peek.mjs freeze <n> [port]   build into .v4-panel/<n> and serve it (stays up; Ctrl-C to stop)
//   node scripts/v4-peek.mjs shots <url> <outDir> [query]
//        plays a full hot-seat game (first legal option each time) and screenshots
//        setup, each round's first moves and results at 1270×700 and iPhone 13 (touch).
import { chromium, devices } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const [cmd, a, b, c] = process.argv.slice(2);

if (cmd === 'freeze') {
  const out = `.v4-panel/${a}`, port = b || 5190;
  const r = spawnSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
  spawn('npx', ['vite', 'preview', '--outDir', out, '--port', String(port), '--strictPort', '--host'], { stdio: 'inherit' });
} else if (cmd === 'shots') {
  const url = a, out = b, query = c || '';
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [tag, ctxOpts] of [['laptop', { viewport: { width: 1270, height: 700 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => m.type() === 'error' && errs.push(m.text()));
    const snap = async n => page.screenshot({ path: `${out}/${tag}-${n}.png` });
    await page.goto(`${url}/?botDelay=40${query ? '&' + query : ''}`);
    await page.click('[data-home="local"]');
    await page.waitForSelector('[data-start]');
    await snap('00-setup');
    await page.click('[data-start]');
    const seen = new Set();
    const t0 = Date.now();
    while (!(await page.$('.results')) && Date.now() - t0 < 240000) {
      const hand = await page.$('[data-handoff]'); if (hand) { await hand.click(); continue; }
      const next = await page.$('[data-next-round]');
      if (next) { const r = await page.$eval('.roundend h2', e => e.textContent).catch(() => 'end'); if (!seen.has(r)) { seen.add(r); await page.waitForTimeout(700); await snap(`r-${r.replace(/\W+/g, '_')}`); } await next.click(); continue; }
      const opts = await page.$$('[data-option]:not([disabled])');
      let opt = null;
      for (const o of opts) if (!/^(back|undo)/.test(await o.getAttribute('data-option'))) { opt = o; break; }
      if (!opt) { await page.waitForTimeout(40); continue; }
      const kind = (await opt.getAttribute('data-option')).split(':')[0];
      const round = await page.$eval('header .round', e => e.textContent).catch(() => '');
      const key = `${kind}@${round.split(' ·')[0]}`;
      if (!seen.has(key)) { seen.add(key); await snap(`m-${String(seen.size).padStart(2, '0')}-${key.replace(/[^a-z0-9@]+/gi, '_')}`); }
      await opt.click({ timeout: 2000 }).catch(() => opt.evaluate(e => e.click()).catch(() => {}));
    }
    await page.waitForTimeout(900);
    await snap('zz-results');
    console.log(`${tag}: ${seen.size} screens, results=${!!(await page.$('.results'))}, errors=${errs.length}${errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''}`);
    await ctx.close();
  }
  await browser.close();
} else {
  console.log('usage: freeze <n> [port] | shots <url> <outDir> [query]');
}
