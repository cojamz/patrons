import { describe, it, expect } from 'vitest';
import { createGame, applyMove, resume, contestTable, SHOP_SIZE, DEFAULT_RULES } from '../../../engine/v4/core.js';
import { defById } from '../../../engine/v4/content/index.js';
import { sceneQ } from './cards-helpers.js';
import { take, move } from './helpers.js';
const Q=['gold','red','yellow','green'];
describe('October17 explicit rules',()=>{
 it('drafts one resource per player in reverse first-turn order without replacement',()=>{
  let s=createGame({seats:[{},{},{}],quadrants:['red','green','blue'],seed:19});
  const order=[...s.firstOrder];
  expect(s.pending.player).toBe(order[2]);
  expect(s.pending.options).toHaveLength(3);
  const first=s.pending.options[0];s=applyMove(s,{player:s.pending.player,option:first.id});
  expect(s.pending.player).toBe(order[1]);expect(s.pending.options).toHaveLength(2);
  expect(s.pending.options.some(o=>o.id===first.id)).toBe(false);
  s=applyMove(s,{player:s.pending.player,option:s.pending.options[0].id});
  expect(s.pending.kind).toBe('place');expect(s.pending.player).toBe(order[0]);
  expect(s.players.map(p=>Object.values(p.res).reduce((a,b)=>a+b,0))).toEqual([1,1,1]);
  expect(s.resources.map(r=>s.players.reduce((n,p)=>n+p.res[r],0))).toEqual([1,1,1]);
  const before=s.players.map(p=>({...p.res}));s.pending=null;s.queue=[{t:'round',r:2}];s=resume(s);
  expect(s.pending.kind).toBe('place');expect(s.players.map(p=>p.res)).toEqual(before);
 });
 it('gives every tied leader half the round prize, including three-way ties',()=>{
  for(const round of [1,2,3]){
   const s=sceneQ({quadrants:Q,n:3,round,res:[{gold:5},{gold:5},{gold:5}],queue:[{t:'endRound'}]});
   const c=contestTable(s).find(c=>c.qid==='gold');
   expect(c.winners).toHaveLength(3);expect(c.prize).toBe(round);
   expect(s.players.map(p=>p.contest)).toEqual([round,round,round]);
   expect(s.contests[0].results.find(c=>c.qid==='gold').prize).toBe(round);
  }
 });
 it('keeps the full award for a sole leader',()=>{
  const s=sceneQ({quadrants:Q,round:2,res:[{gold:5},{gold:3}],queue:[{t:'endRound'}]});
  expect(s.players.map(p=>p.contest)).toEqual([4,0]);
 });
 it('refreshes the complete market between rounds without losing cards',()=>{
  let s=sceneQ({quadrants:Q,queue:[{t:'turn',p:0}]});
  const old=[...s.shop],next=s.pile.slice(0,SHOP_SIZE),all=[...s.shop,...s.pile].sort((a,b)=>a-b);
  s.pending=null;s.queue=[{t:'round',r:2}];s=resume(s);
  expect(s.shop).toEqual(next);expect(s.pile.slice(-old.length)).toEqual(old);
  expect([...s.shop,...s.pile].sort((a,b)=>a-b)).toEqual(all);
 });
 it('removes Release from normal games and makes Night Owl worth2followers',()=>{
  expect(DEFAULT_RULES.release).toBe(false);expect(defById('purple.nightowl').f).toBe(2);
  const s=sceneQ({quadrants:Q,members:[['red.twins']],res:[{gold:1}],queue:[{t:'buy',p:0}]});
  expect(s.pending.options.some(o=>o.kind==='release')).toBe(false);
 });
 it('Peddler includes yellow; Weaver triggers on a5follower buy',()=>{
  const p=sceneQ({quadrants:Q,members:[['yellow.peddler']],queue:[{t:'round',r:2}]});
  expect(p.players[0].res).toEqual({gold:1,red:1,yellow:1,green:1});
  let s=sceneQ({quadrants:Q,members:[['yellow.weaver']],res:[{gold:10}],queue:[{t:'buy',p:0}]});
  s=move(s,'tier:mid');expect(s.players[0].res).toEqual({gold:6,red:1,yellow:1,green:1});
 });
 it('Rising Tide gives each rival2 before calculating half the richest pile',()=>{
  const s=take(sceneQ({quadrants:['silver','red','yellow','green'],round:2,res:[{},{silver:3}]}),'silver.tide');
  expect(s.players.map(p=>p.res.silver)).toEqual([3,5]);
 });
 it('Show Off logs the gain, including converted gains',()=>{
  for(const converted of [false,true]){
   let s=sceneQ({quadrants:['market','gold','red','yellow'],round:2,members:[converted?['gold.tycoon','gold.midas']:['gold.tycoon']]});
   if(converted){const uid=s.players[0].members.find(u=>s.cards[u].def==='gold.midas');s.cards[uid].on=true;}
   const k=Math.floor(Math.max(...s.players[0].members.map(u=>{const d=defById(s.cards[u].def);return d.s+d.w}))/2);
   s=take(s,'market.pricecheck');expect(s.log).toContain(`P1's Show Off: +${k} ${converted?'gold':'blue'}.`);
  }
 });

});
