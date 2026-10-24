// Isolated wheel compositor audit: real frame gaps and browser paint/layout work, at 1x and 4x CPU.
import { chromium } from 'playwright';
import { browserPath } from './lib/browser.mjs';
import { seedSave } from './lib/seed.mjs';
import { mkdirSync } from 'node:fs';
import { lateSave } from './lib/late-save.mjs';
import { HOVER_DELAY_MS } from '../../src/v4/game/hoverDelay.js';
import { richSave } from './lib/rich-save.mjs';
const browser = await chromium.launch({ executablePath: browserPath });
try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await seedSave(page, richSave());
  await page.goto(`${process.env.V4_URL || 'http://localhost:5317'}/?intro=0`);
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.slot.can .base');
  await page.waitForTimeout(1500);
  if (process.env.V4_PERF_SHOTS) { mkdirSync(process.env.V4_PERF_SHOTS,{recursive:true}); await page.screenshot({path:`${process.env.V4_PERF_SHOTS}/wheel-current.png`}); }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  for (const rate of [1,4]) {
    await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    const runs=[];
    for (let i=0;i<4;i++) {
      await page.evaluate(() => {
        window.__perf={frames:[], t0:performance.now(), mutations:0};
        const p=window.__perf;
        const observer=new MutationObserver(ms=>p.mutations+=ms.filter(m=>m.attributeName==='transform').length);
        observer.observe(document.querySelector('.stage'),{attributes:true,subtree:true});
        p.observer=observer;
        let prior=performance.now();
        const frame=t=>{p.frames.push(t-prior);prior=t;if(t-p.t0<650)requestAnimationFrame(frame)};
        requestAnimationFrame(frame);
      });
      const before=(await cdp.send('Performance.getMetrics')).metrics;
      await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');
      await page.waitForTimeout(750);
      const after=(await cdp.send('Performance.getMetrics')).metrics;
      const result=await page.evaluate(()=>{const p=window.__perf;p.observer.disconnect();return{frames:p.frames.length,maxGap:Math.max(...p.frames),over33:p.frames.filter(x=>x>34).length,svgMutations:p.mutations}});
      for (const name of ['LayoutCount','RecalcStyleCount','TaskDuration']) result[name]=after.find(m=>m.name===name).value-before.find(m=>m.name===name).value;
      runs.push(result);
    }
    console.log(JSON.stringify({kind:'spin',rate,runs}));
    const hoverRuns=[];
    for (let n=0;n<3;n++) {
      await page.mouse.move(1400,880);
      await page.waitForTimeout(500);
      const target=await page.locator('.lt-card[data-uid]').first().boundingBox();
      if (!target) break;
      await page.evaluate(delay=>{
        window.__hoverPerf={t0:performance.now(),frames:[],delay};
        const p=window.__hoverPerf;let prior=p.t0;
        const tick=t=>{p.frames.push(t-prior);prior=t;
          const el=[...document.querySelectorAll('[data-hover-layer][data-open="1"], .peek, .popover:not([data-hover-layer]):not([data-prep])')].find(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>-1000&&getComputedStyle(el).visibility!=='hidden'});
          if(el&&!p.open)p.open=t-p.t0;
          if(t-p.t0<1000)requestAnimationFrame(tick);
        };requestAnimationFrame(tick);
      },HOVER_DELAY_MS);
      await page.mouse.move(target.x+target.width/2,target.y+target.height/2);
      await page.waitForTimeout(1100);
      hoverRuns.push(await page.evaluate(()=>{const p=window.__hoverPerf;return{openMs:p.open,afterDelayMs:p.open-p.delay,maxGap:Math.max(...p.frames),over33:p.frames.filter(x=>x>34).length}}));
    }
    console.log(JSON.stringify({kind:'hover',rate,runs:hoverRuns}));
  }
  await page.close();
  for (const rate of [1,4]) {
    const roundPage=await browser.newPage({viewport:{width:1440,height:900}});
    const session=await roundPage.context().newCDPSession(roundPage);
    await session.send('Emulation.setCPUThrottlingRate',{rate});
    await roundPage.addInitScript(()=>{
      window.__roundPerf={frames:[],summaryFrames:[],longtasks:[],seen:false};const p=window.__roundPerf;let prior=null;
      new PerformanceObserver(list=>{for(const e of list.getEntries())if(p.active||p.summary)p.longtasks.push({duration:e.duration,phase:p.summary?'summary':'scoring'})}).observe({type:'longtask',buffered:true});
      const tick=t=>{p.active=!!document.querySelector('.lt-reckon:not(.waiting)');p.summary=!!document.querySelector('.roundend');
        if(p.active||p.summary){if(prior!=null)(p.summary?p.summaryFrames:p.frames).push(t-prior);p.seen=true;prior=t;}else prior=null;
        requestAnimationFrame(tick);
      };requestAnimationFrame(tick);
    });
    await seedSave(roundPage,lateSave(21,3));
    await roundPage.goto(`${process.env.V4_URL || 'http://localhost:5317'}/?intro=0&botDelay=20&speed=steady`);
    await roundPage.click('[data-home="resume"]');
    await roundPage.waitForSelector('.lt-wheel .slot');
    const started=Date.now();
    while(!await roundPage.$('.lt-reckon')&&Date.now()-started<60000){
      const el=await roundPage.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
      if(el)await el.click({timeout:800}).catch(()=>{});
      await roundPage.waitForTimeout(80);
    }
    await roundPage.waitForSelector('.roundend',{timeout:60000});
    await roundPage.waitForTimeout(800); // include the summary card's entrance, not just the scoring sequence
    console.log(JSON.stringify({kind:'round-end',rate,...await roundPage.evaluate(()=>{const p=window.__roundPerf;const sorted=[...p.frames].sort((a,b)=>a-b);return{frames:sorted.length,p95:sorted[Math.floor(sorted.length*.95)],maxGap:Math.max(...sorted),over33:sorted.filter(x=>x>34).length,summary:{frames:p.summaryFrames.length,maxGap:Math.max(...p.summaryFrames),over33:p.summaryFrames.filter(x=>x>34).length},longtasks:p.longtasks}})}));
    if(process.env.V4_PERF_SHOTS)await roundPage.screenshot({path:`${process.env.V4_PERF_SHOTS}/round-end-${rate}x.png`});
    await roundPage.close();
  }
} finally { await browser.close(); }
