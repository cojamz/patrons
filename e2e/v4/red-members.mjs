// Focused real interactions: new Red recruits, rival movement, unified follower purchase.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { createGame, applyMove, quadrant } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
import { takeCard } from './lib/take.mjs';
const base=(process.env.V4_URL||'http://localhost:5325').replace(/\/$/,'');
const out=`${process.env.V4_SHOTS||'/tmp/cults-red-members'}/red-members`;mkdirSync(out,{recursive:true});
const seats=['You','Bo','Cy','Di'].map(name=>({name,kind:'human'}));
const quads=['gold','red','thieves','echo'];
const action=k=>`slot:1-${quadrant('red').actions.findIndex(a=>a.key===k)}`;
const cmp=s=>({players:s.players.map(p=>({members:p.members,res:p.res,bonus:p.bonus})),shop:s.shop,cards:s.cards});
function scenario(name){
 let s=createGame({seats,seed:53,quadrants:quads});
 Object.assign(s,{round:3,queue:[{t:'turn',p:0},{t:'turn',p:0}],pending:null,slots:{},squats:{},order:[0,0],log:[]});delete s.echo;
 s.pile=[...s.shop,...s.pile];s.shop=[];
 s.players.forEach(p=>{p.res=Object.fromEntries(s.resources.map(r=>[r,0]));p.left=5;});
 const deal=(def,who)=>{const u=takeCard(s,def);(who==='shop'?s.shop:s.players[who].members).push(u);return u;};
 const initial=[],picks=[];let pair;
 if(name==='panel'){
  deal('red.recruitbonus',0);deal('red.recruiter',0);const host=deal('gold.merchant',0); // 6, so Promote (up to 2 more) reaches Mentor's 8
  const panel=deal('red.panel','shop'),mentor=deal('red.mentor','shop');
  for(const d of ['red.volunteer','red.twins','red.loyalists','red.mob','red.movementpenalty','red.patriarch'])deal(d,'shop');
  initial.push(action('take'),`card:${panel}`,'promote');pair=`trade:${host}:${mentor}`;picks.push(pair);
 }else{
  for(const d of ['red.panel','red.twins','red.host','red.mentor','red.recruitbonus','red.loyalists','red.mob','red.movementpenalty'])deal(d,'shop');
  s.players[0].res=Object.fromEntries(s.resources.map(r=>[r,r==='red'?12:0]));s.queue=[{t:'buy',p:0},{t:'endTurn',p:0},{t:'turn',p:0}];
  initial.push('tier:mid');
 }
 s=resume(s);s.build=buildStamp();
 const save={config:{seats,speed:'quick'},state:s,undo:null,savedAt:Date.now()};
 let expected=s;
 for(const id of [...initial,...picks]){
  if(!expected.pending?.options.some(o=>o.id===id))throw Error(`${name}: missing ${id}: ${expected.pending?.options.map(o=>o.id)}`);
  expected=applyMove(expected,{player:expected.pending.player,option:id});
 }
 // The UI confirms a single legal payment plan automatically; the raw engine publishes that pay step first.
 if(name==='followers'&&expected.pending?.kind==='pay'){
  const pays=expected.pending.options.filter(o=>o.id.startsWith('pay:'));
  if(pays.length!==1)throw Error('Follower fixture must have exactly one payment plan');
  expected=applyMove(expected,{player:expected.pending.player,option:pays[0].id});
 }
 return{save,initial,pair,expected};
}
if(process.argv.includes('--fixtures-only')){for(const n of ['panel','followers']){scenario(n);console.log(`${n}: fixture resolves`);}process.exit(0);}
const browser=await chromium.launch({executablePath:browserPath});let page,tag;
try{
 for(const [size,opts]of[['desktop',{viewport:{width:1270,height:700}}],['phone',devices['iPhone 13']]])for(const name of ['panel','followers']){ // (penalty went with Even Swap, the space that moved a rival's member: round I rework, Cory Oct 27)
  tag=`${size}-${name}`;const ctx=await browser.newContext(opts);page=await ctx.newPage();page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__newRedFlights=[];addEventListener('DOMContentLoaded',()=>new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&n.classList.contains('ghost-layer'))window.__newRedFlights.push(n.className);}).observe(document.body,{childList:true,subtree:true}));});
  const t=scenario(name);await seedSave(page,t.save);await page.goto(`${base}/?intro=0&speed=quick`);await page.locator('[data-home="resume"]').click();
  if(await page.locator('[data-handoff]').isVisible())await page.locator('[data-handoff]').click();
  const press=async id=>{await page.locator('.app.game:not([data-animating])').waitFor();if(size==='phone')await page.waitForTimeout(450);const el=page.locator(`[data-option=${JSON.stringify(id)}]:not([disabled]):not([aria-disabled="true"])`).first();await el.waitFor();if(size==='phone')await el.tap();else await el.click();const confirm=page.getByRole('button',{name:'Place here',exact:true});if(await confirm.isVisible())await confirm.click();if(size==='phone'&&id.startsWith('card:')){const recruit=page.getByRole('button',{name:'Recruit',exact:true});await recruit.waitFor();await recruit.click();}};
  if(name==='followers'){
   const offers=page.locator('.lt-cards .lt-rate.lt-card');if(await offers.count()!==3)throw Error(`${tag}: follower cards not unified`);
   const footer=offers.nth(1).locator('.ft .lt-cost');if(await footer.getAttribute('aria-label')!=='5 any')throw Error(`${tag}: follower cost missing`);
  }
  for(const id of t.initial)await press(id);
  if(t.pair){const a=t.pair.split(':')[1];await page.locator(`.gift-card .gc-row[data-row="1"] [data-uid="${a}"]:not([disabled])`).click();await page.screenshot({path:`${out}/${tag}-choice.png`});await press(t.pair);}
  await page.waitForFunction(want=>{try{return JSON.stringify((s=>({players:s.players.map(p=>({members:p.members,res:p.res,bonus:p.bonus})),shop:s.shop,cards:s.cards}))(JSON.parse(localStorage.getItem('patrons.v4.local')).state))===JSON.stringify(want);}catch{return false;}},cmp(t.expected));
  await page.locator(`.app.game[data-phase="${t.expected.pending.kind}"]:not([data-animating])`).waitFor({timeout:18000});
  await page.screenshot({path:`${out}/${tag}-settled.png`});
  const flights=await page.evaluate(()=>window.__newRedFlights);
  if(!flights.length)throw Error(`${tag}: no visible motion created`);
  if(await page.evaluate(()=>document.body.scrollWidth>innerWidth+1))throw Error(`${tag}: page overflow`);
  if(errors.length)throw Error(errors.join('; '));
  console.log(`${tag}: exact members/resources/scores/shop; restored ${t.expected.pending.kind}; ${flights.length} motion pieces; no overflow/errors.`);
  await ctx.close();
 }
}catch(e){if(page&&!page.isClosed()){await page.screenshot({path:`${out}/${tag}-failure.png`});console.error((await page.locator('body').innerText()).slice(-1800));}throw e;}finally{await browser.close();}
