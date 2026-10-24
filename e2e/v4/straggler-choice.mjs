import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './lib/browser.mjs';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { freeCard } from './lib/deal.mjs';
import { createGame, applyMove } from '../../src/engine/v4/index.js';
import { resume } from '../../src/engine/v4/core.js';
const base=(process.env.V4_URL||'http://localhost:5339').replace(/\/$/,'');
const out=`${process.env.V4_SHOTS||'/tmp/cults-straggler'}/straggler`;mkdirSync(out,{recursive:true});
const seats=['You','Bo','Cy','Di'].map(name=>({name,kind:'human'}));
let s=createGame({seats,seed:53,quadrants:['gold','red','thieves','echo']});
const uid=freeCard(s,'benders.straggler');s.shop=s.shop.filter(u=>u!==uid);s.pile=s.pile.filter(u=>u!==uid);
s.players.forEach(p=>{p.members=[];p.res=Object.fromEntries(s.resources.map(r=>[r,0]));p.left=0;});s.players[0].members=[uid];
Object.assign(s,{round:2,slots:{'0-0':0},squats:{},pending:null,queue:[{t:'allPlaced'},{t:'turn',p:0}],log:[]});
delete s.echo;s.players[0].lastSlot={key:'0-0',joined:false};s=resume(s);s.build=buildStamp();
const save={config:{seats,speed:'quick'},state:s,undo:null,savedAt:Date.now()};
const expected=applyMove(s,{player:0,option:'to:0-1'});
if(expected.players[0].res.gold!==4||expected.slots['0-0']!==undefined||expected.slots['0-1']!==0)throw Error('Fixture did not move last minion and perform Golden Years exactly once');
const browser=await chromium.launch({executablePath:browserPath});
try{
// the phone pass runs only with V4_PHONE=1 (phone is out of scope, Cory 2026-10-20)
for(const[tag,opts]of[['desktop',{viewport:{width:1270,height:700}}],...(process.env.V4_PHONE?[['phone',devices['iPhone 13']]]:[])]){
for(const outcome of ['move','stay','escape']){
 const ctx=await browser.newContext(opts),page=await ctx.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await seedSave(page,save);await page.goto(`${base}/?intro=0&speed=quick`);await page.locator('[data-home="resume"]').click();
 const handoff=page.locator('[data-handoff]');if(await handoff.isVisible())await handoff.click();
 await page.locator('.prompt.choice.seat-pick.docked').waitFor();await page.locator('.app.game:not([data-animating])').waitFor();await page.waitForTimeout(450);
 if(await page.locator('.lt-wheel .gift-card[data-gift="move"]').count())throw Error('Move menu still obstructs wheel');
 await page.getByRole('button',{name:'Stay put',exact:true}).waitFor();
 if(outcome!=='move'){
  if(outcome==='escape')await page.keyboard.press('Escape');
  else await page.getByRole('button',{name:'Stay put',exact:true}).click();
  await page.waitForFunction(()=>{const x=JSON.parse(localStorage.getItem('patrons.v4.local')).state;return x.slots['0-0']===0&&x.pending?.kind==='place';});
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('patrons.v4.local')).state);
  if(after.players[0].res.gold!==0||after.cards[uid].usedRound===2)throw Error('Stay put changed reward/used state');
 }else{
  const dest=page.locator('[data-option="to:0-1"]').first();await dest.waitFor();
  if(tag==='phone'){
   await dest.tap();
   const card=page.locator('[data-space-card="0-1"]');await card.waitFor();
   if(!/round II|round III/.test(await card.innerText()))throw Error('Destination card hides effect');
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('patrons.v4.local')).state);
   if(before.slots['0-1']!==undefined||before.players[0].res.gold!==0)throw Error('First tap moved before inspection');
   await page.waitForTimeout(250);
   await page.screenshot({path:`${out}/${tag}-inspect.png`});
   await page.getByRole('button',{name:'Move here',exact:true}).click();
  }else{
   await dest.hover();await page.locator('[data-space-card="0-1"]').waitFor();
   await page.waitForTimeout(250);
   await page.screenshot({path:`${out}/${tag}-inspect.png`});await dest.click();
  }
  await page.waitForFunction(()=>{const x=JSON.parse(localStorage.getItem('patrons.v4.local')).state;return x.slots['0-1']===0&&x.slots['0-0']===undefined&&x.players[0].res.gold===4;});
  await page.locator('.app.game:not([data-animating])').waitFor();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('patrons.v4.local')).state);
  if(after.players[0].lastSlot.key!=='0-1'||after.cards[uid].usedRound!==2)throw Error('Move did not update source/used state');
 }
 if(errors.length)throw Error(errors.join('; '));
 if(await page.evaluate(()=>document.body.scrollWidth>innerWidth+1))throw Error('Horizontal overflow');
 await page.screenshot({path:`${out}/${tag}-${outcome}.png`});console.log(`${tag}-${outcome}: wheel clear; inspected actual action; exact minion/resource/used state.`);await ctx.close();
}}
}finally{await browser.close();}
