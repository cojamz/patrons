// Focused actual opening draft/order UI and Retinue acquisition; no full-game sim.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath, launchBrowser } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, applyMove } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
const base=process.env.V4_URL||'http://localhost:5335',out=process.env.V4_SHOTS||'/tmp/cults-draft-retinue';mkdirSync(out,{recursive:true});
const names=['Alexandria','Christopher','Maximilian','Jean-Baptiste'];
const wrap=s=>{s.build=buildStamp();return {config:{seats:s.players.map(p=>({name:p.name,kind:'human'})),speed:'quick'},state:s,undo:null,savedAt:Date.now()};};
const draft=n=>createGame({seats:names.slice(0,n).map(name=>({name,kind:'human'})),quadrants:['silver','yellow','thieves','echo'].slice(0,n),seed:53});
const browser=await launchBrowser({executablePath:browserPath});
try{for(const[size,opts]of[['desktop',{viewport:{width:1270,height:700}}],['phone',devices['iPhone 13']]]){
 for(const n of size==='desktop'?[2,3,4]:[4]){
  const ctx=await browser.newContext(opts),p=await ctx.newPage(),s=draft(n);p.setDefaultTimeout(10000);
  await seedSave(p,wrap(s));await p.goto(`${base}/?intro=0&speed=quick`);await p.locator('[data-home="resume"]').click();const hand=p.locator('[data-handoff]');if(await hand.isVisible())await hand.click();
  await p.locator('[data-setup-order]').waitFor();
  const ids=kind=>p.locator(`[data-order="${kind}"] .setup-order-step`).evaluateAll(es=>es.map(e=>Number(e.dataset.pid)));
  if(JSON.stringify(await ids('draft'))!==JSON.stringify(s.queue.filter(t=>t.t==='setupPick').map(t=>t.p)))throw Error('draft order differs from engine');
  if(JSON.stringify(await ids('place'))!==JSON.stringify(s.firstOrder))throw Error('placement snake differs from engine');
  const bounds=await p.locator('[data-setup-order]').evaluate(e=>({right:e.getBoundingClientRect().right,first:e.querySelector('[data-current]')?.getAttribute('title'),rows:[...e.querySelectorAll('[data-order]')].map(r=>({w:r.clientWidth,scroll:r.scrollWidth}))}));
  if(!bounds.first||bounds.rows.some(r=>r.scroll>r.w+1)||bounds.right>opts.viewport?.width+1)throw Error(`order cue clipped ${JSON.stringify(bounds)}`);
  await p.screenshot({path:`${out}/${size}-draft-${n}.png`});
  const id=s.pending.options[0].id,expected=applyMove(s,{player:s.pending.player,option:id});await p.locator(`[data-option=${JSON.stringify(id)}]:visible`).first().click();
  await p.waitForFunction(want=>{try{return JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves===want;}catch{return false;}},expected.moves);
  if(expected.pending.kind==='setup')await p.waitForFunction(want=>[...document.querySelectorAll('[data-order="draft"] .setup-order-step')].map(e=>Number(e.dataset.pid)).join(',')===want,expected.queue.filter(t=>t.t==='setupPick').map(t=>t.p).join(','));
  else await p.locator('[data-setup-order]').waitFor({state:'hidden'});
  if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('page overflow');
  console.log(`${size}-draft-${n}: engine reverse draft/snake match, responsive names; real pick advances cue.`);await ctx.close();
 }
 const ctx=await browser.newContext(opts),p=await ctx.newPage();p.setDefaultTimeout(10000);let s=draft(4);s.pending=null;s.round=1;s.current=0;s.queue=[{t:'buy',p:0},{t:'turn',p:0}];
 s.players.forEach(x=>{x.res=Object.fromEntries(s.resources.map(r=>[r,0]));x.left=3;});s.players[0].res.silver=3;
 const u=[...s.shop,...s.pile].find(u=>s.cards[u].def==='silver.retinue');s.pile=s.pile.filter(x=>x!==u);s.shop=s.shop.filter(x=>x!==u);s.shop.push(u);while(s.shop.length>8)s.pile.push(s.shop.shift());s=resume(s);
 let expected=applyMove(s,{player:0,option:`card:${u}`});if(expected.pending?.kind==='pay'){const ways=expected.pending.options.filter(o=>o.id.startsWith('pay:'));if(ways.length!==1)throw Error('Retinue fixture needs unique pay');expected=applyMove(expected,{player:0,option:ways[0].id});}
 await seedSave(p,wrap(s));await p.goto(`${base}/?intro=0&speed=quick`);await p.locator('[data-home="resume"]').click();const hand=p.locator('[data-handoff]');if(await hand.isVisible())await hand.click();
 await p.locator('.app.game:not([data-animating])').waitFor();await p.waitForTimeout(450); // intentional post-handoff input guard
 const card=p.locator(`.lt-shop [data-uid="${u}"]`);await card.scrollIntoViewIfNeeded();if(await card.locator('[data-worth]').getAttribute('data-worth')!=='3')throw Error('shop worth wrong');
 if(size==='phone'){await card.tap();await p.getByRole('button',{name:'Recruit',exact:true}).click();}else await card.click();
 await p.waitForFunction(uid=>!!document.querySelector('.pay-go')||JSON.parse(localStorage.getItem('patrons.v4.local')).state.players[0].members.includes(uid),u);
 const pay=p.locator('.pay-go');if(await pay.isVisible())await pay.click();
 const cmp=st=>st.players.map(x=>({members:x.members,res:x.res,bonus:x.bonus}));
 await p.waitForFunction(want=>{try{return JSON.stringify(JSON.parse(localStorage.getItem('patrons.v4.local')).state.players.map(x=>({members:x.members,res:x.res,bonus:x.bonus})))===JSON.stringify(want);}catch{return false;}},cmp(expected)).catch(async err=>{await p.screenshot({path:`${out}/${size}-retinue-failure.png`});console.error('Retinue actual',await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('patrons.v4.local')).state;return {moves:s.moves,pending:s.pending,players:s.players.map(x=>({members:x.members,res:x.res,bonus:x.bonus}))}}),'expected',cmp(expected));throw err;});
 await p.locator('.app.game:not([data-animating])').waitFor();
 const palette=await p.locator('.app.game').evaluate(e=>getComputedStyle(e).getPropertyValue('--yellow').trim());if(palette!=='#ead844')throw Error(`yellow palette stale ${palette}`);
 if((await p.locator('.lt-seat.mine .cs-member-count').textContent()).replace(/\s+/g,'')!=='3members')throw Error('Retinue UI member weight wrong');
 await p.screenshot({path:`${out}/${size}-retinue-yellow.png`});console.log(`${size}-retinue: actual purchase gives3 people, exact resources/gifts, yellow theme matches.`);await ctx.close();
}}finally{await browser.close();}
