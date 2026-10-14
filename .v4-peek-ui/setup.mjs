import { chromium, devices } from 'playwright';
const OUT = '/tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/ui';
const tag = process.argv[2] || 'setup';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
await page.goto('http://localhost:5283/');
await page.tap('[data-home="local"]');
const st = await page.waitForSelector('[data-start]'); await st.scrollIntoViewIfNeeded(); await st.tap();
await page.waitForSelector('.players'); await page.waitForTimeout(800);
const info = () => page.evaluate(() => { const c = document.querySelector('.prompt.choice'); const b = c && c.getBoundingClientRect(); const toks = [...document.querySelectorAll('.prompt.choice [data-option]')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom)]; }); return { vw: innerWidth, vh: innerHeight, sx: scrollX, sy: scrollY, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sheet: b && [b.top, b.bottom, b.height, getComputedStyle(c).position], toks, peek: !!document.querySelector('.peek') }; });
console.log(JSON.stringify(await info()));
await page.screenshot({ path: `${OUT}/${tag}-1.png` });
const t = await page.$('.prompt.choice [data-option]'); if (t) { await t.tap(); await page.waitForTimeout(600); }
console.log(JSON.stringify(await info()));
await page.screenshot({ path: `${OUT}/${tag}-2.png` });
await browser.close();
