import { chromium, devices } from 'playwright';
const OUT = '/tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/ui';
const tag = process.argv[2] || 'click';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
await page.goto('http://localhost:5283/?botDelay=40');
await page.click('[data-home="local"]');
await page.waitForSelector('[data-start]');
await page.click('[data-start]');
await page.waitForSelector('.players');
const info = () => page.evaluate(() => ({ sx: scrollX, sy: scrollY, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, peek: !!document.querySelector('.peek'), hoverNone: matchMedia('(hover: none)').matches, wide: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 5).map(e => e.className && String(e.className.baseVal ?? e.className)) }));
console.log(JSON.stringify(await info()));
for (let i = 0; i < 4; i++) {
  const o = await page.$('[data-option]:not([disabled])');
  if (!o) { await page.waitForTimeout(200); continue; }
  await o.click({ timeout: 2000 }).catch(e => console.log('click fail', e.message.split('\n')[0]));
  await page.waitForTimeout(300);
  console.log(JSON.stringify(await info()));
}
await page.screenshot({ path: `${OUT}/${tag}.png` });
await browser.close();
