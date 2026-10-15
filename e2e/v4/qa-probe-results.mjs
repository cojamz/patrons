import { chromium } from 'playwright';
import { answerChoice } from './lib/answer.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
await page.goto('http://127.0.0.1:5404/?botDelay=30&intro=0');
await page.click('[data-home="local"]'); await page.waitForSelector('[data-start]'); await page.click('[data-start]');
await page.waitForSelector('.lt-seat[data-pid]');
let r1 = null;
const t0 = Date.now();
while (!(await page.$('.results')) && Date.now() - t0 < 600000) {
  const next = await page.$('[data-next-round]');
  if (next) { await next.click().catch(() => {}); continue; }
  if (!r1) { const rd = await page.$eval('.app.game', e => e.dataset.round).catch(() => '0'); if (rd === '1' && await page.$('.lt[data-phase="place"][data-yours="1"]')) r1 = await page.evaluate(() => document.querySelectorAll('*').length); }
  const did = await answerChoice(page); await page.waitForTimeout(did ? 20 : 40);
}
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const count = el => el.querySelectorAll('*').length + 1;
  const parts = {};
  for (const sel of ['.results', '.over-cults', '.over-cults .log', '.over-seat', '[data-hover-layer]', 'header', '.toast', '.flight']) parts[sel] = [...document.querySelectorAll(sel)].reduce((t, e) => t + count(e), 0);
  const kids = [...(document.querySelector('.results')?.children || [])].map(e => [String(e.className || e.tagName).slice(0, 40), count(e)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const top = [...document.querySelector('.app.game').children].map(e => [String(e.className || e.tagName).slice(0, 40), count(e)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const body = [...document.body.children].map(e => [String(e.className || e.id || e.tagName).slice(0, 40), count(e)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const fat = [...document.querySelectorAll('.results *, .over-cults *')].filter(e => e.children.length > 25).map(e => [String(e.className).slice(0, 40), e.children.length, count(e)]).slice(0, 10);
  return { total: document.querySelectorAll('*').length, parts, kids, top, body, fat };
});
console.log('round I nodes', r1, 'secs', Math.round((Date.now() - t0) / 1000));
console.log(JSON.stringify(r, null, 1));
await browser.close();
