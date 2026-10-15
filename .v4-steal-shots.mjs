// scratch: before/after shots of the steal selector (not a gate). node .v4-steal-shots.mjs <tag> [spaces...]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { stealSave } from './e2e/v4/lib/steal-save.mjs';
const tag = process.argv[2] || 'before';
const spaces = process.argv.slice(3).length ? process.argv.slice(3) : ['help', 'redistribute', 'lielow', 'debts'];
const port = 5377, base = `http://127.0.0.1:${port}`;
const server = { kill() {} }; // the dev server runs on its own (scratchpad/vite5377.pid)
let up = false;
for (let k = 0; k < 120 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
const out = '/home/user/patrons/design/eval/rc2-ui';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const phone = process.env.PHONE === '1';
try {
  for (const sp of spaces) {
    const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1270, height: 700 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('pageerror', e.message));
    console.log(sp, 'goto'); await page.goto(`${base}/?intro=0`, { timeout: 90000 });
    await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), stealSave(sp));
    await page.reload({ timeout: 90000 }); console.log(sp, 'reloaded');
    await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
    await page.click('[data-home="resume"]');
    await page.waitForSelector('.prompt.choice', { timeout: 60000 }).catch(async e => { await page.screenshot({ path: '/tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/stuck.png' }); throw e; });
    await page.waitForTimeout(900);
    await page.mouse.move(2, 2);
    const f = `${out}/steal-${sp}-${tag}${phone ? '-phone' : ''}.png`;
    await page.screenshot({ path: f });
    console.log('shot', f);
    if (process.env.HOVER) {
      const dim = await page.$('.cs-stack.pick-off');
      if (dim) { await dim.hover(); await page.waitForTimeout(700); await page.screenshot({ path: `${out}/steal-${sp}-${tag}-dimhover.png` }); console.log('hover shot'); }
    }
    if (process.env.PICK) {
      const lit = await page.$$('.cs-stack.pick-on');
      if (lit.length) { await lit[0].click(); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/steal-${sp}-${tag}-flight.png` }); await page.waitForTimeout(900); await page.screenshot({ path: `${out}/steal-${sp}-${tag}-pick1.png` }); console.log('pick shots'); }
    }
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
