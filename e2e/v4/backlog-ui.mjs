// Focused backlog checks: details choices, payment notes, and readable member-list prices.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath, launchBrowser } from './lib/browser.mjs';
import { seedSave } from './lib/seed.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { createGame, applyMove, quadrant } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
import { takeCard } from './lib/take.mjs';
const base=process.env.V4_URL||'http://localhost:5334',out=process.env.V4_SHOTS||'/tmp/cults-backlog-ui';mkdirSync(out,{recursive:true});
const seats=['You','Bo','Cy','Di'].map(name=>({name,kind:'human'}));
function fixture(kind){
 let s=createGame({seats,seed:53,quadrants:['gold','red','market','echo']});
 s.pending=null;s.round=3;s.slots={};s.squats={};s.queue=[{t:kind==='choice'?'turn':'buy',p:0},{t:'turn',p:0}];s.players.forEach(p=>{p.left=3;p.res=Object.fromEntries(s.resources.map(r=>[r,6]));});
 const deal=(def,to)=>{const u=takeCard(s,def);(to==='shop'?s.shop:s.players[to].members).push(u);return u;};
 deal('gold.thrift',0);deal('gold.prospector',0);deal('red.host',0);deal('red.recruiter',0);
 const target=deal('gold.taxman','shop');while(s.shop.length>8)s.pile.push(s.shop.shift());
 s=resume(s);
 if(kind==='pay'){s=applyMove(s,{player:0,option:`card:${target}`});if(s.pending.kind!=='pay')throw Error('missing payment choice');}
 if(kind==='choice'){const i=quadrant('red').actions.findIndex(a=>a.key==='take');s=applyMove(s,{player:0,option:`slot:1-${i}`});if(s.pending.kind!=='choose')throw Error('missing recruit choice');}
 s.build=buildStamp();return {config:{seats,speed:'quick'},state:s,undo:null,savedAt:Date.now()};
}
const compare=s=>({res:s.players.map(p=>p.res),members:s.players.map(p=>p.members),shop:s.shop});
const browser=await launchBrowser({executablePath:browserPath});
try{for(const[size,opts]of[['desktop',{viewport:{width:1270,height:700}}],['phone',devices['iPhone 13']]])for(const kind of ['choice','pay','hover']){
 const ctx=await browser.newContext(opts),p=await ctx.newPage(),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));const save=fixture(kind);
 await seedSave(p,save);await p.goto(`${base}/?intro=0&speed=quick`);await p.locator('[data-home="resume"]').click();
 const hand=p.locator('[data-handoff]');if(await hand.isVisible())await hand.click();
 await p.locator('.app.game').waitFor();
 const settleCards=()=>p.locator('.pay-card, .popover').evaluateAll(async es=>{await Promise.all(es.flatMap(e=>e.getAnimations({subtree:true})).filter(a=>a.effect?.getComputedTiming().endTime<Infinity).map(a=>a.finished.catch(()=>{})));});
 if(kind==='choice'){
  const toggle=p.getByRole('button',{name:'Show member abilities'});await toggle.scrollIntoViewIfNeeded();if(await toggle.getAttribute('aria-pressed')!=='true')throw Error('choice should initially show abilities');
  const before=await p.locator('.lt-shop .lt-card[data-option]').first().boundingBox();
  await toggle.click();if(await toggle.getAttribute('aria-pressed')!=='false')throw Error('choice details cannot toggle off');await toggle.click();if(await toggle.getAttribute('aria-pressed')!=='true')throw Error('choice details cannot toggle on');
  const after=await p.locator('.lt-shop .lt-card[data-option]').first().boundingBox();if(before.width!==after.width||before.height!==after.height)throw Error('details resized choice card');
 }else if(kind==='pay'){
  const dialog=p.locator('[role="dialog"]').filter({has:p.locator('.pay-card')});await dialog.waitFor();await settleCards();
  const metrics=await dialog.evaluate(e=>{const n=e.querySelector('[data-pay-rules]'),a=e.querySelector('[data-pay-ability]'),rows=e.querySelector('.pay-rows');return {notes:!!n,ability:!!a,above:n&&n.getBoundingClientRect().bottom<=rows.getBoundingClientRect().top+1,ink:a&&getComputedStyle(a).color,w:e.getBoundingClientRect().width};});
  if(!metrics.notes||!metrics.ability||!metrics.above||metrics.ink!=='rgb(43, 32, 24)')throw Error(`payment notes/ability misplaced: ${JSON.stringify(metrics)}`);
  await p.screenshot({path:`${out}/${size}-${kind}.png`});
  const go=p.locator('.pay-go'),id=await go.getAttribute('data-option');const expected=applyMove(save.state,{player:0,option:id});await go.click();
  await p.waitForFunction(want=>{try{const s=JSON.parse(localStorage.getItem('patrons.v4.local')).state;return JSON.stringify({res:s.players.map(p=>p.res),members:s.players.map(p=>p.members),shop:s.shop})===JSON.stringify(want);}catch{return false;}},compare(expected));
 }else{
  await p.locator('.lt-seat.mine .cs-head').click();const list=p.locator('[data-seat-card="0"]');await list.waitFor();await settleCards();
  const rows=await list.locator('.mu-row').evaluateAll(es=>es.map(e=>{const n=e.querySelector('.mu-name').getBoundingClientRect(),c=e.querySelector('.mu-price').getBoundingClientRect();return{name:e.innerText,aligned:c.left>=n.right-1,ability:!!e.querySelector('[data-ability]')};}));
  if(rows.length<4||rows.some(r=>!r.aligned||!r.ability))throw Error(`member rows broken: ${JSON.stringify(rows)}`);
 }
 if(kind!=='pay')await p.screenshot({path:`${out}/${size}-${kind}.png`});
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('page width overflow');
 if(errors.length)throw Error(errors.join(';'));
 console.log(`${size}-${kind}: PASS${kind==='pay'?' (exact payment/resources/members)':''}`);await ctx.close();
}}finally{await browser.close();}
