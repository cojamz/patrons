// Spin during real resource/member flights and scoring, compared with idle. Use an immutable V4_URL.
import { chromium } from 'playwright';
import { mkdirSync,writeFileSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { seedSave } from './lib/seed.mjs';
import { lateSave } from './lib/late-save.mjs';
import { freeCard } from './lib/deal.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { createGame,resume } from '../../src/engine/v4/core.js';
import { quadrant } from '../../src/engine/v4/content/index.js';
const base=process.env.V4_URL;
if(!base)throw new Error('Set V4_URL to an immutable production candidate');
const dir=process.env.V4_PERF_SHOTS||'/tmp/patrons-wheel-contention';mkdirSync(dir,{recursive:true});
function chainSave(){
 const seats=Array.from({length:4},(_,i)=>({name:`P${i+1}`,kind:i?'bot':'human'}));
 let state=createGame({seats,seed:7,quadrants:['silver','gold','red','green']});
 state.queue=[];state.pending=null;state.round=1;state.slots={};state.squats={};state.order=[];state.log=[];
 for(const p of state.players){for(const r of state.resources)p.res[r]=6;p.left=3;}
 for(const def of ['silver.majordomo','silver.toastmaster']){
  const uid=freeCard(state,def);state.shop=state.shop.filter(x=>x!==uid);state.pile=state.pile.filter(x=>x!==uid);
  state.players[0].members.push(uid);state.cards[uid].recruitedRound=0;state.cards[uid].recruitedBy=0;
 }
 state.queue=[{t:'turn',p:0}];state=resume(state);state.build=buildStamp();
 return {state,config:{seats,speed:'steady'},undo:null,savedAt:Date.now()};
}
const browser=await chromium.launch({executablePath:browserPath});
try{
 for(const rate of [1,4])for(const mode of (process.env.V4_MODES||'idle,chain,scoring').split(',')){
  const page=await browser.newPage({viewport:{width:1270,height:700}});
  if(process.env.V4_FILTER_ORIGINAL==='1')await page.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const style=document.createElement('style');style.textContent='.lt .lt-wheel{transition:filter var(--mo-dim) ease!important;opacity:1!important}.lt[data-yours="1"][data-phase="buy"] .lt-wheel,.lt[data-yours="1"][data-phase="pay"] .lt-wheel{filter:brightness(.82) saturate(.85)!important}';document.head.append(style)})});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const save=mode==='scoring'?lateSave(21,3):chainSave();
  await seedSave(page,save);await page.goto(`${base}/?intro=0&speed=steady&botDelay=20`);
  await page.click('[data-home="resume"]');await page.waitForSelector('.lt-wheel .slot');await page.waitForTimeout(800);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  if(mode==='chain'){
   const i=quadrant('silver').actions.findIndex(a=>a.name==='Toast');
   await page.locator(`[data-slot="0-${i}"]`).press('Enter');
   await page.waitForFunction(()=>document.querySelector('.app.game[data-chain]')&&document.querySelector('.piece-flight,.worker-flight,.as-member'),null,{timeout:6000});
  }else if(mode==='scoring'){
   const deadline=Date.now()+60000;
   while(!await page.$('.lt-reckon:not(.waiting)')&&Date.now()<deadline){
    const el=await page.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
    if(el)await el.press('Enter',{timeout:600}).catch(()=>{});await page.waitForTimeout(60);
   }
   await page.waitForSelector('.lt-reckon:not(.waiting)',{timeout:1000});
  }
  // Timeline tracing can be disabled for a final frame-only gate, avoiding profiler overhead.
  const events=[];let traceDone;
  if(process.env.V4_TRACE==='1'){
   cdp.on('Tracing.dataCollected',e=>events.push(...e.value));
   traceDone=new Promise(r=>cdp.once('Tracing.tracingComplete',r));
   await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler',options:'sampling-frequency=1000',transferMode:'ReportEvents'});
  }
  await page.evaluate(()=>{
   const g=document.querySelector('.stage svg g.wheel');const sig=()=>`${g?.getAttribute('transform')}|${g?.ownerSVGElement.parentElement.style.transform}`;
   const w=window.__contention={frames:[],rot:[],longtasks:[],base:sig(),phaseAtStart:document.querySelector('.app.game')?.dataset.phase,filterAtStart:getComputedStyle(document.querySelector('.lt-wheel')).filter,flightsAtStart:document.querySelectorAll('.piece-flight,.worker-flight,.token-flight').length,activeAtStart:document.querySelector('.app.game')?.dataset.chain||document.querySelector('.lt-reckon:not(.waiting)')?.dataset.reckon||'idle'};
   new PerformanceObserver(list=>{if(w.t0)for(const e of list.getEntries())if(e.startTime>=w.t0)w.longtasks.push(e.duration)}).observe({type:'longtask',buffered:true});
   addEventListener('keydown',e=>{if(e.key==='ArrowRight')w.t0=performance.now()},{capture:true,once:true});
   let prior=null;
   const frame=t=>{if(w.t0){if(prior!=null)w.frames.push(t-prior);const s=sig();if(s!==w.base&&(!w.rot.length||w.rot.at(-1).sig!==s))w.rot.push({at:t-w.t0,sig:s});if(t-w.t0>1000)return;}prior=t;requestAnimationFrame(frame)};
   requestAnimationFrame(frame);
  });
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(1200);
  const result=await page.evaluate(()=>{const w=window.__contention;return{start:w.rot[0]?.at,total:w.rot.at(-1)?.at,maxGap:Math.max(...w.frames),frames:w.frames.length,over34:w.frames.filter(x=>x>34).length,longtasks:w.longtasks,activeAtStart:w.activeAtStart,phaseAtStart:w.phaseAtStart,filterAtStart:w.filterAtStart,flightsAtStart:w.flightsAtStart}});
  if(process.env.V4_TRACE==='1'){
   await cdp.send('Tracing.end');await traceDone;
   writeFileSync(`${dir}/${mode}-${rate}x-trace.json`,JSON.stringify({traceEvents:events}));
   const timed=events.filter(e=>e.ph==='X'&&e.dur&&['FunctionCall','Layout','Paint','UpdateLayoutTree','RasterTask','RunTask'].includes(e.name));
   result.work=Object.fromEntries([...new Set(timed.map(e=>e.name))].map(name=>{const rows=timed.filter(e=>e.name===name);return[name,{n:rows.length,maxMs:Math.max(...rows.map(e=>e.dur))/1000,sumMs:rows.reduce((s,e)=>s+e.dur,0)/1000}]}));
   result.longFunctions=timed.filter(e=>e.name==='FunctionCall'&&e.dur>15000).map(e=>({ms:e.dur/1000,name:e.args?.data?.functionName,line:e.args?.data?.lineNumber,url:e.args?.data?.scriptName}));
  }
  console.log(JSON.stringify({mode,rate,...result,errors}));await page.close();
 }
}finally{await browser.close();}
