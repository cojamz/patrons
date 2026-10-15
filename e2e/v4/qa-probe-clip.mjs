import { chromium } from 'playwright';
import { answerChoice } from './lib/answer.mjs';
import { TEXT_CLIP } from './lib/textclip.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
await page.goto('http://127.0.0.1:5404/?botDelay=30&intro=0');
await page.click('[data-home="local"]'); await page.waitForSelector('[data-start]'); await page.click('[data-start]');
await page.waitForSelector('.lt-seat[data-pid]');
const t0 = Date.now(); let n = 0;
while (!(await page.$('.results')) && Date.now() - t0 < 300000 && n < 3) {
  const next = await page.$('[data-next-round]'); if (next) { await next.click().catch(() => {}); continue; }
  if (await page.$('.lt[data-yours="1"] .seat-pick.docked')) {
    n++;
    const st = await page.evaluate(() => { const b = document.querySelector('.pick-keys-open'); const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return { cp: s.clipPath, ov: s.overflow, w: r.width, h: r.height, focus: document.activeElement === b, fv: b.matches(':focus-visible'), active: document.activeElement && (document.activeElement.className || document.activeElement.tagName) }; });
    const cut = (await page.evaluate(TEXT_CLIP)).filter(x => /pick-keys/.test(x));
    console.log('pick', n, JSON.stringify(st), JSON.stringify(cut));
    await page.focus('.seat-pick.docked'); await page.keyboard.press('Tab'); await page.waitForTimeout(300);
    const st2 = await page.evaluate(() => { const b = document.querySelector('.pick-keys-open'); const s = getComputedStyle(b); const r = b.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(b); const tr = range.getBoundingClientRect(); return { cp: s.clipPath, ov: s.overflow, w: r.width, x: r.x, textW: tr.width, pos: s.position, maxW: s.maxWidth, minW: s.minWidth, focus: document.activeElement === b, fv: b.matches(':focus-visible'), active: String(document.activeElement && (document.activeElement.className || document.activeElement.tagName)) }; });
    const cut2 = (await page.evaluate(TEXT_CLIP)).filter(x => /pick-keys|Pick from/.test(x));
    console.log('  after Tab', JSON.stringify(st2), JSON.stringify(cut2));
    await page.screenshot({ path: '/tmp/claude-0/-home-user-patrons/5ebe88de-0e49-593c-823a-8e25da0176c7/scratchpad/qa2/tab.png' });
  }
  const did = await answerChoice(page); await page.waitForTimeout(did ? 20 : 40);
}
await browser.close();
