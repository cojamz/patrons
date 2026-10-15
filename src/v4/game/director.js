// The director: each move plays as a short chain of animations in cause-and-effect order (Cory, 2026-10-15:
// "whenever somebody does something it should be obvious, and it triggers a chain of animations ... All timed well,
// paced well, and obvious"; "all the cascading effects of an action should be obvious (in addition to the selection
// of that action itself)"). The motion language it follows: design/prototypes/motion/grammar.md.
//
//  1. The selection: your minion stands on the space at once and a trail flies from your column (S1); a rival's minion
//     lifts out of their column and flies to the space, then a read hold (S2). A member used as the move hops.
//  2. The cascade, from the engine's effect stream (engine/v4/effects.js), one cause (one beat) at a time: the source
//     pulses (a space) or hops (a member), then its pieces fly. Payments drop, gains and gifts arc, takes go straight
//     (the victim's stack tugs first), a recruit lifts, takes its coins, flies to the crowd and sends its worth to the
//     count, a follower buy takes its coins, presses and pops, and sends followers. 1–3 of a thing fly as single pieces,
//     4 or more as one bundle with its count. The next beat starts when this one's last piece is two-thirds along
//     (Steady). Every stack and count changes as its pieces leave and land, never before.
//
// planChain is the plan in time (the table's pacing reads its length); playChain puts it on screen with Web Animations
// and timers (no React state). A click or Space skips the rest of a chain to its end (skipChain). Every duration comes
// from src/v4/motion.js at the viewer's speed. A state without an effect stream (an online guest, a catch-up) falls
// back to gains.js, which reads the change of state.
import { MO, flightMs, nextBeatAt, speedScale } from '../motion.js';
import { playerColor } from '../format.js';
import { play } from '../sound.js';
import { gainsBetween } from './gains.js';
import { seatOrder } from './seats.js';
import { stageRect, stageShow, stageRelease, stageClear } from './stage.js';
import { panelText } from './panelText.js';
import { quadrant, defById } from '../../engine/v4/index.js';
import { seatEmoji } from '../format.js';
import { spriteId } from '../art/index.js';
import { motionOK, flyPath, pulse, tug, settle, flyMinionsHome, slideShop, holdStack, bump, track, landAll, expectArrival, clearArrivals, clearFlights, arcFrames, bezier, onScreenBow, relative } from './flight.js';

const CARD_EASE = bezier(0.3, 0.7, 0.2, 1); // a recruited card's flight to its crowd (grammar M7)

// ---------- the plan ----------

const causeKey = c => (c ? `${c.kind}:${c.pid ?? ''}:${c.uid ?? ''}:${c.key ?? ''}:${c.qid ?? ''}:${c.tier ?? ''}` : '');
const TYPICAL = 450; // px between a source and its destination, when the plan is made off screen

/** gains.js moves in the effect stream's words (the fallback when a state carries no stream). */
function fromGains(before, state) {
  const conv = w => {
    switch (w && w.kind) {
      case 'slot': return { kind: 'space', key: w.key };
      case 'total': return { kind: 'count', pid: w.pid };
      case 'card': return { kind: 'shop', uid: w.uid };
      case 'rate': return { kind: 'rate', n: w.n };
      default: return w;
    }
  };
  return gainsBetween(before, state).map((m, i) => {
    const from = conv(m.from), to = conv(m.to);
    const cause = from.kind === 'member' ? { kind: 'member', pid: from.pid, def: from.def } : from.kind === 'space' ? { kind: 'space', key: from.key } : { kind: 'guess', n: i };
    return { n: i, type: m.what === 'fol' ? 'followers' : m.pay ? 'pay' : from.kind === 'stack' ? 'transfer' : 'gain', cause, from, to, what: m.what === 'fol' ? { n: m.n } : { r: m.r, n: m.n } };
  });
}

/** One cause's effects as moves: payments, takes (paired steals, color turns included), gives, gains, cards, followers. */
function movesOf(cause, effects, owner) {
  const pays = [], takes = [], gives = [], gains = [], cards = [], fols = [];
  const used = new Set();
  // a steal that changes color (magenta): a rival's pay and the owner's gain of the same total, under one cause
  for (const p of effects) {
    if (p.type !== 'pay' || p.from.pid === owner || used.has(p)) continue;
    const g = effects.find(e => e.type === 'gain' && !used.has(e) && e.to.pid === owner && e.what.n === p.what.n);
    if (g) { used.add(p); used.add(g); takes.push({ from: p.from, to: g.to, n: p.what.n, r: p.what.r, turn: g.what.r !== p.what.r ? g.what.r : null }); }
  }
  // a payment that reaches a rival (a ransom paid, "the payment arrives as magenta"): the owner's pays and another
  // player's gain of the same total under one cause are a give, straight from the payer's stacks to theirs (grammar M4);
  // otherwise the coins dropped into a space and flew out of it, and the eye lost who paid whom (motion gaps 3)
  const ownPays = effects.filter(e => e.type === 'pay' && !used.has(e) && owner != null && e.from.pid === owner && e.from.kind === 'stack' && !['shop', 'rate'].includes(e.to && e.to.kind));
  if (ownPays.length) {
    const paid = ownPays.reduce((t, e) => t + e.what.n, 0);
    const g = effects.find(e => e.type === 'gain' && !used.has(e) && e.to.kind === 'stack' && e.to.pid !== owner && e.what.n === paid);
    if (g) { used.add(g); for (const p of ownPays) { used.add(p); gives.push({ from: p.from, to: g.to, n: p.what.n, r: p.what.r, turn: g.what.r !== p.what.r ? g.what.r : null }); } }
  }
  for (const e of effects) {
    if (used.has(e)) continue;
    if (e.type === 'pay') pays.push(e);
    else if (e.type === 'transfer') (owner != null && e.to.pid === owner ? takes : gives).push({ from: e.from, to: e.to, n: e.what.n, r: e.what.r });
    else if (e.type === 'gain') gains.push(e);
    else if (e.type === 'recruit' || e.type === 'member-move' || e.type === 'release') cards.push(e);
    else if (e.type === 'followers' && e.what.n) fols.push(e);
  }
  // the owner's own gains first, then the spill to rivals (a fan in the same beat)
  gains.sort((a, b) => (a.to.pid === owner ? 0 : 1) - (b.to.pid === owner ? 0 : 1));
  return { pays, takes, gives, gains, cards, fols };
}

/**
 * What a change of state plays: { atoms: [{ at, op, ... }], total } in ms at the viewer's speed. Pure when `measure`
 * is left out (the table's pacing calls it before anything is on screen); playChain passes the screen's distances.
 */
export function planChain(before, state, { mine = [], measure = null } = {}) {
  const atoms = [];
  if (!before || !state || before === state || before.seed !== state.seed) return { atoms, total: 0, handoff: 0 };
  // a new round after the Reckoning (the table held the scored board, so no move separates the two): the minions walk
  // home to their seats' columns, the closing beat of the round
  // a new round's order: the chairs re-sort as a beat of their own, after what lands on them and before the next player
  // moves (wave 4 #3: the seats re-sorted under the player while the bots' first placements flew)
  // (round I's start only: a later round's new order arrives with the Reckoning, which measures the chairs where they stand)
  const resort = before.round === 0 && state.round === 1 && seatOrder(before).join() !== seatOrder(state).join();
  if (!(state.moves > before.moves)) {
    if (state.round > before.round && before.round >= 1) {
      const d = MO.minionsHome, s = resort ? MO.sortBeat : 0;
      return { atoms: [{ at: 0, op: 'home' }, ...(resort ? [{ at: d, op: 'sort' }] : [])], total: d + s, handoff: d + s };
    }
    return { atoms, total: 0, handoff: 0 };
  }
  const dist = (a, b) => (measure ? measure(a, b) : TYPICAL);
  const fly = (a, b) => flightMs(dist(a, b));
  let t = 0, end = 0;
  const at = (time, op) => { atoms.push({ at: Math.round(time), ...op }); return time; };
  const ends = x => { end = Math.max(end, x); return x; };
  const sameRound = state.round === before.round;
  let pulsed = null; // the space already lit by the selection
  let selectedAt = null; // when a rival's minion landed on it

  // 1. the selection
  const placed = sameRound ? Object.keys(state.slots).filter(k => before.slots[k] === undefined).map(k => [k, state.slots[k]]) : [];
  // a minion joining a taken space (a squat) is a placement too
  if (sameRound && state.squats) for (const k of Object.keys(state.squats)) {
    const was = (before.squats && before.squats[k]) || [];
    for (const pid of state.squats[k]) if (!was.includes(pid)) placed.push([k, pid]);
  }
  for (const [key, pid] of placed) {
    if (mine.includes(pid)) {
      at(0, { op: 'minion', pid, key, own: true, dur: MO.trail });
      at(0, { op: 'pulse', place: { kind: 'space', key }, dur: MO.ownStamp });
      t = ends(MO.trail * 0.6);
    } else {
      at(0, { op: 'minion', pid, key, own: false, dur: MO.minionFly });
      const landed = ends(MO.minionFly);
      selectedAt = landed;
      at(landed + Math.max(0, MO.readHold - MO.pulse), { op: 'pulse', place: { kind: 'space', key }, dur: MO.pulse });
      t = ends(landed + MO.readHold);
    }
    pulsed = key;
  }
  if (!sameRound && before.round >= 1) { at(0, { op: 'home' }); t = ends(MO.minionsHome); }

  // 2. the cascade (a rival's run of follower buys, folded by foldBuys, carries the whole run's effects)
  const fx = Array.isArray(state.effects) && state.moves === before.moves + 1 ? state.effects
    : state.foldedFrom === before.moves && Array.isArray(state.foldedEffects) ? state.foldedEffects : fromGains(before, state);
  const beats = [];
  for (const e of fx) {
    if (!e || !e.cause || e.cause.kind === 'contest') continue; // the Reckoning flies the prizes
    if (['refill', 'shop-out', 'discount'].includes(e.type)) continue; // bookkeeping: the deck deals, the price shows it
    const k = causeKey(e.cause);
    if (!beats.length || beats[beats.length - 1].key !== k) beats.push({ key: k, cause: e.cause, effects: [] });
    beats[beats.length - 1].effects.push(e);
  }
  let hand = 0; // when the last piece is two-thirds along: the same player's next step may show then
  // the action stage (stage.js): a space or member out on the hub gives and takes from there
  const stagedKeys = new Map(); // a staged space's key → its slot: 'card', or 'card2' for the space it copies
  const stagedUids = new Map(); // a staged member's uid → its spot
  const onStage = w => (!w ? w : w.kind === 'space' && stagedKeys.has(w.key) ? { kind: 'stage', slot: stagedKeys.get(w.key) }
    : w.kind === 'member' && w.uid != null && stagedUids.has(w.uid) && w.pid === stagedUids.get(w.uid).pid ? { kind: 'stage', slot: stagedUids.get(w.uid).spot } : w);
  const pieces = (time, from0, to0, n, opt = {}) => {
    const from = onStage(from0), to = onStage(to0);
    // 1–3 single pieces, 60ms apart (Steady); 4 or more one bundle carrying its count
    const d = opt.dur || fly(from, to);
    hand = Math.max(hand, (n >= 4 ? time : time + (n - 1) * MO.pieceStagger) + d * (2 / 3));
    if (n >= 4) { at(time, { op: 'piece', from, to, n, bundle: true, dur: d, ...opt }); at(time + d, { op: 'land', to, by: n, bundle: true, ...opt }); return { last: time, d }; }
    for (let k = 0; k < n; k++) { at(time + k * MO.pieceStagger, { op: 'piece', from, to, n: 1, dur: d, ...opt }); at(time + k * MO.pieceStagger + d, { op: 'land', to, by: 1, ...opt }); }
    return { last: time + (n - 1) * MO.pieceStagger, d };
  };
  const after = r => r.last + nextBeatAt(r.d); // when the next beat may start
  const owner0 = c => (c.kind === 'recruit' || c.kind === 'buy' || c.kind === 'space' || c.kind === 'move' || c.kind === 'release' || c.kind === 'member' || c.kind === 'setup' ? c.pid : null);
  let setup = false;
  // where the mover's move happened (the space taken, the rate bought at, the card recruited): a rival's member that pays
  // out because of it (Tax Collector on your follower buy) sends its gain from there to their pile (the skeptic, w4 #14:
  // "nothing travels from my buy to P4's seat")
  const mover = before.pending ? before.pending.player : null;
  let movePlace = null;
  let lastStart = null; // when the last beat that wasn't a rival's reaction began
  for (const beat of beats) {
    const c = beat.cause, owner = owner0(c);
    const m = movesOf(c, beat.effects, owner);
    let s = t;
    if (!(c.kind === 'member' && mover != null && c.pid !== mover)) lastStart = s;
    if (!movePlace && c.kind !== 'member') {
      const f0 = beat.effects[0] && beat.effects[0].from;
      movePlace = c.kind === 'space' ? { kind: 'space', key: c.key } : c.kind === 'buy' ? { kind: 'rate', tier: c.tier, n: c.get }
        : c.kind === 'recruit' ? { kind: 'shop', index: c.index, uid: c.uid } : f0 && f0.kind === 'space' ? f0 : null;
    }
    // a rival's member that pays out because of the mover's move (Tax Collector on your follower buy) is part of that
    // move's beat: it hops in its seat as the move plays, and what it gets flies from where the move happened, at once
    const reactive = c.kind === 'member' && mover != null && c.pid !== mover && !!movePlace && lastStart != null;
    if (reactive) s = lastStart + MO.lead;
    const fromMove = reactive && c.uid == null ? movePlace : null;
    // the source acts first: it flies out of its place onto the stage (a space as a card at the hub, a member beside
    // it), and gives from there (Cory, 2026-10-15: "a card shows up showing the action, and resources flow to/from that
    // action to players. same with members as they are contributing"). A member already out hops again.
    // (a blind tester, w5: "P4's Auctioneer +1 blue on each rival recruit … nearly invisible, all I saw was a seat
    // number changing"): it steps onto the stage too, in the same beat, and gives from there
    if (c.kind === 'member' && c.uid != null) {
      const was = stagedUids.get(c.uid);
      if (was && was.pid === c.pid) { at(s, { op: 'stage', kind: 'member', place: { kind: 'member', pid: c.pid, uid: c.uid, def: c.def }, spot: was.spot, dur: MO.hop }); s += MO.lead; }
      else {
        const spot = stagedUids.size;
        stagedUids.set(c.uid, { pid: c.pid, spot });
        at(s, { op: 'stage', kind: 'member', place: { kind: 'member', pid: c.pid, uid: c.uid, def: c.def }, spot, dur: MO.stageIn });
        s += reactive ? MO.stageIn * 0.35 : MO.stageIn * 0.5;
      }
    } else if (c.kind === 'space' && !stagedKeys.has(c.key)) {
      // a space just taken: the card leaving it is the read of which space it was, so it leaves as the minion lands;
      // its gains start out as the card settles
      let s0 = s;
      if (c.key !== pulsed) { at(s, { op: 'pulse', place: { kind: 'space', key: c.key }, dur: MO.pulse }); s0 += MO.lead; pulsed = c.key; }
      else if (selectedAt != null) s0 = Math.max(0, selectedAt - MO.minionFly * 0.25);
      // a second space in one move is the one a copy runs (Echo, Encore): it lands on the first card, fanned, "copies"
      const slot = stagedKeys.size ? 'card2' : 'card';
      at(s0, { op: 'stage', kind: 'space', place: { kind: 'space', key: c.key }, pid: c.pid, slot, dur: MO.stageIn });
      s = Math.max(selectedAt != null ? selectedAt : s, s0 + MO.stageIn * 0.6);
      stagedKeys.set(c.key, slot);
    }
    else if (c.kind === 'setup') {
      // a starting pick (wave 3: nobody saw what the bots picked): a rival's coin in the pick row lights (grammar S3, the
      // point at what they chose), and stays lit while its dot flies from it to their seat; your own pick answered your press
      setup = true;
      if (!mine.includes(c.pid)) {
        const g = m.gains[0], d = g ? fly(g.from, g.to) : 0;
        at(s, { op: 'point', place: { kind: 'quadrant', qid: c.qid }, dur: MO.choicePoint + d });
        s += MO.choicePoint;
      }
    }
    let next = s;
    const isRecruit = c.kind === 'recruit' && m.cards.some(e => e.type === 'recruit');
    // a recruit: the card lifts (a rival's holds a beat: which card), the coins drop into it, then it flies to the crowd
    if (isRecruit) {
      const card = m.cards.find(e => e.type === 'recruit');
      const hold = mine.includes(card.to.pid) ? 0 : MO.rivalBuyHold;
      let paid = s + MO.cardLift + hold;
      // the coins fly in while the card is lifted; it leaves when the last one is two-thirds of the way there
      for (const [i, p] of m.pays.entries()) { const r = pieces(s + MO.cardLift + hold + i * MO.fan, p.from, { kind: 'shop', index: c.index, uid: c.uid }, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid }); paid = Math.max(paid, r.last + r.d * (2 / 3)); }
      const d = fly(card.from, card.to);
      hand = Math.max(hand, paid + d * (2 / 3));
      at(s, { op: 'card', uid: card.what.uid, to: card.to.pid, from: card.from, lift: MO.cardLift, wait: paid - s - MO.cardLift, dur: d });
      const landed = ends(paid + d);
      if (card.what.worth > 0) {
        // its worth: follower marks hop from the new chip to the count, which ticks as they land
        const r = pieces(landed, { kind: 'crowd', pid: card.to.pid, uid: card.what.uid }, { kind: 'count', pid: card.to.pid }, card.what.worth, { fol: true, dur: MO.worthHop });
        next = ends(after(r));
        ends(r.last + r.d);
      } else next = landed;
      m.pays.length = 0;
      m.cards.splice(m.cards.indexOf(card), 1);
    }
    // a follower buy: the coins drop into the rate, it presses and pops, the followers fly out
    if (c.kind === 'buy') {
      let paid = s;
      const rate = { kind: 'rate', tier: c.tier, n: c.get };
      for (const [i, p] of m.pays.entries()) { const r = pieces(s + i * MO.fan, p.from, rate, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid }); paid = Math.max(paid, r.last + r.d); }
      at(paid, { op: 'pulse', place: rate, dur: MO.accept, press: true });
      let o = paid + MO.accept;
      for (const f of m.fols) { const r = pieces(o, rate, f.to, f.what.n, { fol: true }); next = Math.max(next, after(r)); ends(r.last + r.d); o += MO.fan; }
      m.pays.length = 0; m.fols.length = 0;
      next = ends(Math.max(next, o));
    }
    // everything else in the beat, in order: what was paid, what was taken, given, gained, the cards, the followers
    let cur = Math.max(s, next === s ? s : next);
    // a release (M8): the member drops to the pile first; its refund leaves when the card is 40% along
    if (c.kind === 'release') {
      for (const card of m.cards.filter(e => e.type === 'release')) {
        // it stops on the stage on its way, big and named, so a release reads as letting go to the pile, never as a
        // theft (panel r1 skeptic)
        const d = fly(card.from, card.to), via = MO.stageIn + Math.round(MO.stageHold / 2);
        at(cur, { op: 'chip', from: card.from, to: card.to, uid: card.what.uid, path: 'drop', dur: via + d, via: 0, hide: true });
        ends(cur + via + d);
        cur += via + d * 0.4;
      }
      m.cards = m.cards.filter(e => e.type !== 'release');
    }
    const phase = list => {
      if (!list.length) return;
      let lastR = null, o = cur;
      for (const g of list) {
        if (g.tug) at(o, { op: 'tug', place: g.from, toward: g.to, dur: MO.tug });
        const r = pieces(o + (g.tug ? MO.tug : 0), g.from, g.to, g.n, g.opt);
        ends(r.last + r.d);
        if (!lastR || r.last + r.d > lastR.last + lastR.d) lastR = r;
        o += MO.fan;
      }
      cur = after(lastR);
    };
    phase(m.pays.map(p => ({ from: p.from, to: p.to.kind === 'bank' && pulsed ? { kind: 'space', key: pulsed } : p.to, n: p.what.n, opt: { pay: true, r: p.what.r, owner: p.from.pid } })));
    phase(m.takes.map(x => ({ from: x.from, to: x.to, n: x.n, tug: true, opt: { take: true, r: x.r, turn: x.turn, owner: x.to.pid } })));
    phase(m.gives.map(x => ({ from: x.from, to: x.to, n: x.n, opt: { r: x.r, turn: x.turn, owner: x.to.pid } })));
    // the owner's gains, then the spill fan, which starts when the owner's are two-thirds along (the same beat)
    const own = m.gains.filter(g => g.to.pid === owner || owner == null), spill = m.gains.filter(g => !(g.to.pid === owner || owner == null));
    const before0 = cur;
    phase(own.map(g => ({ from: fromMove && g.from.kind === 'member' ? fromMove : g.from, to: g.to, n: g.what.n, opt: { r: g.what.r, owner: g.to.pid } })));
    if (spill.length) { cur = own.length ? cur : before0; phase(spill.map(g => ({ from: g.from, to: g.to, n: g.what.n, opt: { r: g.what.r, owner: g.to.pid, light: true } }))); }
    // members changing hands (grammar M10; motion gaps 3: "P3 traded Broker for P4's Retinue" showed no travel): a swap's
    // two members cross at once on mirrored arcs; a member taken (Poach, a ransom let go) is a take, the victim's crowd
    // tugs and it flies straight. Each lands on its own new chip, which shows when it lands.
    const moves = m.cards.filter(e => e.type === 'member-move');
    for (const card of m.cards) {
      if (card.done) continue;
      const to = card.type === 'member-move' || card.type === 'recruit' ? { ...card.to, uid: card.what.uid } : card.to;
      if (card.type === 'member-move') {
        const back = moves.find(o => o !== card && !o.done && o.from.pid === card.to.pid && o.to.pid === card.from.pid);
        // (tester B, w5: "a bot's Even Swap took my Tax Collector and nothing showed it"): a member changing hands
        // stops on the stage on its way, big, so everyone sees who it is before it lands in its new chair
        const via = MO.stageIn + Math.round(MO.stageHold / 2);
        if (back) {
          back.done = true;
          at(cur, { op: 'chip', from: card.from, to, uid: card.what.uid, path: 'arc', dur: via + MO.swap, via: 0, hide: true });
          at(cur, { op: 'chip', from: back.from, to: { ...back.to, uid: back.what.uid }, uid: back.what.uid, path: 'cross', dur: via + MO.swap, via: 1, hide: true });
          ends(cur + via + MO.swap);
          cur += via + nextBeatAt(MO.swap);
          continue;
        }
        at(cur, { op: 'tug', place: { kind: 'crowd', pid: card.from.pid }, toward: { kind: 'crowd', pid: card.to.pid }, dur: MO.tug });
        const d = fly(card.from, card.to);
        at(cur + MO.tug, { op: 'chip', from: card.from, to, uid: card.what.uid, path: 'line', dur: via + d, via: 0, hide: true });
        ends(cur + MO.tug + via + d);
        cur += MO.tug + via + nextBeatAt(d);
        continue;
      }
      const d = fly(card.from, card.to);
      at(cur, { op: 'chip', from: card.from, to, uid: card.what.uid, path: card.type === 'release' ? 'drop' : 'arc', dur: d });
      ends(cur + d);
      cur += nextBeatAt(d);
    }
    phase(m.fols.map(f => (f.what.n > 0 ? { from: f.from.kind === 'bank' && pulsed ? { kind: 'space', key: pulsed } : f.from, to: f.to, n: f.what.n, opt: { fol: true } } : { from: f.from, to: f.to, n: -f.what.n, opt: { fol: true, pay: true } })));
    t = Math.max(t, cur);
  }
  const turnPasses = !!(state.pending && before.pending && state.pending.player !== before.pending.player);
  // starting picks read one at a time: the next pick lights only when this one has landed, and a short rest between two
  // players' picks (the first placements follow the last one)
  if (setup && end) { hand = end; if (turnPasses) end += MO.setupRest; }
  if (resort) { at(end, { op: 'sort' }); end += MO.sortBeat; hand = end; }
  // a chain's cap (grammar §5: 3.0s at Steady; fitted from 2.8s so a run of six rival turns stays inside H2's 13s):
  // a longer plan plays faster to fit, never faster than Quick (half)
  const cap = Math.round(2800 * speedScale());
  if (end > cap) {
    const k = Math.max(0.5, cap / end);
    for (const a of atoms) { a.at = Math.round(a.at * k); if (a.dur) a.dur = Math.round(a.dur * k); if (a.lift) a.lift = Math.round(a.lift * k); if (a.wait) a.wait = Math.round(a.wait * k); }
    end *= k; hand *= k; t *= k;
  }
  return { atoms: atoms.sort((a, b) => a.at - b.at), total: end ? Math.round(end + (turnPasses ? MO.breath : 0)) : 0, handoff: end ? Math.round(Math.max(hand, t)) : 0, turnPasses };
}

// ---------- a rival's run of follower buys, folded ----------
// Wave 3: a rival's round-III run of buys (Spree and 10→10 three times) took about 13s to watch at Steady, "too long to
// watch and too fast to follow". A rival's consecutive follower buys in one turn play as one beat: their coins drop into
// the rate as one handful per color, the rate takes them once, and the followers fly to the count as one bundle that
// rolls once to its total. Members that react to the buys (Tax Collector, Tipster) still play after it, each as itself.

const BUY_STEP = new Set(['buy', 'pay']);
/** The longest the table holds for a rival's next buy to arrive before it folds what has come. */
export const foldWait = () => Math.round(400 * speedScale());
/** prev → next is the actor's buy or pay step that shows nothing but a follower buy and what reacts to it. */
function buyStep(prev, next, actor) {
  if (!prev || !next || !prev.pending || prev.pending.player !== actor || !BUY_STEP.has(prev.pending.kind)) return false;
  if (next.round !== prev.round || next.over || next.moves !== prev.moves + 1 || !Array.isArray(next.effects)) return false;
  return next.effects.every(e => e.cause && (e.cause.kind === 'buy' || e.cause.kind === 'member') && !['recruit', 'release', 'member-move'].includes(e.type));
}
const boughtIn = st => st.effects.some(e => e.cause.kind === 'buy' && e.type === 'followers');

/**
 * Fold a rival's run of follower buys into one step. `prev` is on screen, `next` is about to show, `queue` holds the
 * steps after it. Returns { used, wait }: `used` > 0 means the queue's first `used` steps fold into this one (show
 * queue[used - 1] in place of `next`; it now carries the run's effects as `foldedEffects` from `foldedFrom`). `wait`:
 * the run may go on (the bot is still buying and its next step hasn't arrived): the table may hold a moment for it.
 * `force`: fold what has arrived, without waiting.
 */
export function foldBuys(prev, next, queue, mine = [], force = false) {
  const none = { used: 0, wait: false };
  const actor = prev && prev.pending ? prev.pending.player : null;
  if (actor == null || mine.includes(actor) || prev.round < 1 || !buyStep(prev, next, actor)) return none;
  const run = [next];
  let k = 0;
  while (k < queue.length && buyStep(run[run.length - 1], queue[k], actor)) run.push(queue[k++]);
  const last = run[run.length - 1];
  const open = k === queue.length && last.pending && last.pending.player === actor && BUY_STEP.has(last.pending.kind) && !last.over;
  const buys = run.filter(boughtIn);
  if (open && !force) return { used: 0, wait: true };
  if (buys.length < 2) return none;
  // the run ends at its last buy: what comes after it (a pass, a tier picked and not yet paid) shows on its own
  let end = run.length - 1;
  while (end > 0 && !boughtIn(run[end])) end--;
  const steps = run.slice(0, end + 1);
  const tail = steps[steps.length - 1];
  if (tail.foldedFrom === prev.moves && Array.isArray(tail.foldedEffects)) return { used: end, wait: false };
  // one buy: the coins per stack, summed; the followers per count, summed; through the rate of the biggest buy
  const all = steps.flatMap(st => st.effects);
  const fols = all.filter(e => e.cause.kind === 'buy' && e.type === 'followers');
  const main = fols.reduce((a, b) => (b.what.n > a.what.n ? b : a)).cause;
  const total = fols.reduce((t, e) => t + (e.cause.pid === actor ? e.what.n : 0), 0);
  const cause = { ...main, get: total, folded: buys.length };
  const pays = new Map(), gets = new Map();
  for (const e of all) {
    if (e.cause.kind !== 'buy') continue;
    const into = e.type === 'pay' ? pays : e.type === 'followers' ? gets : null;
    if (!into) continue;
    const key = e.type === 'pay' ? `${e.from.pid}:${e.from.r}` : `${e.to.pid}`;
    const had = into.get(key);
    into.set(key, had ? { ...had, what: { ...had.what, n: had.what.n + e.what.n } } : { ...e, cause, ...(e.type === 'pay' ? { to: { kind: 'rate', tier: main.tier } } : { from: { kind: 'rate', tier: main.tier } }) });
  }
  const merged = [...pays.values(), ...gets.values(), ...all.filter(e => e.cause.kind !== 'buy')].map((e, n) => ({ ...e, n }));
  Object.defineProperty(tail, 'foldedEffects', { value: merged, enumerable: false, configurable: true, writable: true });
  Object.defineProperty(tail, 'foldedFrom', { value: prev.moves, enumerable: false, configurable: true, writable: true });
  return { used: end, wait: false };
}

/**
 * How long the table holds a step on screen before showing the next one (the table's pace, grammar §5): the same
 * player's next step shows at this chain's hand-off (at least `floor` after a rival's visible step); a turn that
 * passes waits for the whole chain and its breath; a rival's step with nothing to show costs nothing when the same
 * bot moves next, and a turn-ending pass holds MO.passHold. `base`: the hold for anything else (your own steps).
 * Pure: useTable paces with it, and src/test/v4/ui/pacing.test.js checks H2/H3 with it over recorded games.
 */
export function holdAfter(plan, { sameNext, rivalStep, floor = 400, base = 0, nextPlaces = false, placing = false }) {
  // a turn that passes to a placement: the next player's minion leaves its column during this chain's closing breath
  // (the departure is the next turn's first, quiet motion, at another seat), so the breath and the departure overlap
  const passes = plan.turnPasses && nextPlaces ? plan.total - MO.breath : plan.total;
  // the floor keeps a rival's visible step on screen before another player's step or the rival's next turn; never
  // between the same player's own sub-steps (a setup pick, the buy after a choice): those flow at their hand-off
  const floored = rivalStep && (!sameNext || nextPlaces) ? floor : 0;
  // a rival's placement hands on at its hand-off (its last piece two-thirds along), even when its turn ends there
  // the turn passing to another player (panel r1: rival turns overlapped your own coins still flying, and each other):
  // this turn plays out whole, closing breath and all, so every turn is its own beat (a gap on top of that broke the
  // longest-wait budget, pacing.test.js)
  if (plan.total && !sameNext) return Math.max(plan.total, floored);
  if (plan.total) return Math.max(sameNext || (placing && rivalStep) ? plan.handoff : passes, floored);
  return rivalStep ? (sameNext ? 0 : MO.passHold) : base;
}
/** The longest a step may hold on screen: the chain's cap plus its breath and the floor (re-timing never goes past it). */
export const holdCap = () => Math.round(2800 * speedScale()) + MO.breath + 400;

// ---------- the screen ----------
// One clock for every chain on the table, run by requestAnimationFrame. It advances by at most two frames' worth per
// frame, so a late frame (a loaded box) stretches the show instead of bunching its pieces; and a piece's landing (its
// count ticking, its stack settling) comes from that piece's own animation finishing, never from a separate timer.

const chain = { queue: [], clock: 0, wall: 0, last: null, raf: 0, flying: 0, holds: new Map(), pending: new Map(), counts: new Set(), root: null };

// A counted steal's picks (Collect Debts, Help Yourself) show as they're made (the skeptic, w4 #22; tester A, w4 #34:
// "P2 still showed 3 silver after '1 left'"): each pick drops the rival's stack at once, though the engine takes them all
// on the last pick; that pick's chain then adopts the held number and doesn't drop the same units twice.
const picked = new Map(); // stack element → { h (its hold), n (units shown as taken), t (safety timer) }
export function notePick(el, n = 1) {
  if (!el || !el.querySelector || !motionOK()) return;
  const b = el.querySelector('b.num');
  if (!b) return;
  let p = picked.get(el);
  if (!p) {
    const shown = Number(b.dataset.hold ?? b.textContent.trim());
    if (!Number.isFinite(shown)) return;
    p = { h: holdStack(el, shown), n: 0, t: 0 };
    picked.set(el, p);
  }
  p.n += n;
  if (p.h) p.h.step(-n);
  bump(el, true);
  clearTimeout(p.t);
  // (a pick that never becomes a take, as one undone, lets go of the number)
  p.t = setTimeout(() => { if (picked.get(el) === p) { if (p.h) p.h.done(true); picked.delete(el); } }, 15000);
}
const skipSubs = new Set();
/** Something that should jump to its end state when a chain is skipped (the table's pacing). */
export const onChainSkip = fn => { skipSubs.add(fn); return () => skipSubs.delete(fn); };
const endSubs = new Set();
/** Called whenever the table's chains have all played out (or were skipped): the summary may show. */
export const onChainEnd = fn => { endSubs.add(fn); return () => endSubs.delete(fn); };
export const chainRunning = () => chain.queue.length > 0 || chain.flying > 0;

function tick(now) {
  chain.raf = 0;
  if (chain.last == null) chain.wall = now - chain.clock;
  const dt = chain.last == null ? 0 : Math.min(34, Math.max(0, now - chain.last));
  chain.last = now;
  chain.clock += dt;
  // a late frame stretches the show rather than bunching it, but never by more than 250ms behind the wall clock
  // (a box that is slow for seconds still plays the chain at about its pace)
  const behind = now - chain.wall - chain.clock;
  if (behind > 250) chain.clock += behind - 250;
  while (chain.queue.length && chain.queue[0].at <= chain.clock) chain.queue.shift().fn(false);
  if (chain.queue.length || chain.flying > 0) chain.raf = requestAnimationFrame(tick);
  else endChain();
}
const run = () => { if (!chain.raf && typeof requestAnimationFrame === 'function') chain.raf = requestAnimationFrame(tick); };
function schedule(at, fn) {
  const item = { at, fn };
  let k = chain.queue.length;
  while (k > 0 && chain.queue[k - 1].at > at) k--;
  chain.queue.splice(k, 0, item);
}
function endChain(now = false) {
  for (const { h } of chain.holds.values()) if (h) h.done(now);
  chain.holds.clear();
  chain.pending.clear();
  clearArrivals(chain.counts);
  chain.counts.clear();
  if (chain.root) delete chain.root.dataset.chain;
  chain.last = null;
  if (now) stageClear(); else stageRelease();
  for (const fn of endSubs) fn();
}
/** Skip the rest of the chain on screen: every step jumps to its end state at once (a click, Space). */
export function skipChain() {
  if (!chainRunning()) return false;
  const q = chain.queue;
  chain.queue = [];
  for (const item of q) item.fn(true);
  landAll();
  clearFlights(0);
  chain.flying = 0;
  chain.epoch = (chain.epoch || 0) + 1; // landings still resolving from the skipped chain change nothing
  if (chain.raf) { cancelAnimationFrame(chain.raf); chain.raf = 0; }
  chain.handoffAt = 0;
  endChain(true);
  for (const fn of skipSubs) fn();
  try { dispatchEvent(new Event('patrons:chain-skip')); } catch { /* no window */ }
  return true;
}

const shown = el => (el && el.getBoundingClientRect().width > 0 ? el : null);
/** Where an effect's source or target is on screen. */
function placeEl(root, w, ctx) {
  if (!root || !w) return null;
  const seat = pid => root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  switch (w.kind) {
    case 'space': return shown(root.querySelector(`[data-slot="${w.key}"] .base`)) || shown(root.querySelector(`[data-slot="${w.key}"]`));
    case 'quadrant': {
      // a starting pick: from the button pressed, while the picker is up; else that quadrant's own spaces
      const q = ctx.state.quadrants.indexOf(w.qid);
      return shown(root.querySelector(`[data-option="color:${w.qid}"]`)) || shown(root.querySelector(`[data-slot^="${q}-"] .base`)) || shown(root.querySelector('.stage .hub-label'));
    }
    case 'stack': { const s = seat(w.pid); return s && shown(s.querySelector(`.cs-stack[data-res="${w.r}"]`)); }
    case 'count': case 'player': { const s = seat(w.pid); return s && (shown(s.querySelector('.cs-total')) || shown(s)); }
    case 'crowd': {
      const s = seat(w.pid);
      if (!s) return null;
      if (w.uid != null) { const m = shown(s.querySelector(`.cs-member[data-uids~="${w.uid}"]`)); if (m) return m; }
      return shown(s.querySelector('.cs-crowd .cs-member:last-of-type')) || shown(s.querySelector('.cs-crowd')) || shown(s);
    }
    case 'member': {
      const s = seat(w.pid);
      if (!s) return null;
      if (w.uid != null) { const m = shown(s.querySelector(`.cs-member[data-uids~="${w.uid}"]`)); if (m) return m; }
      if (w.def) { const m = shown(s.querySelector(`.cs-member[data-member="${w.def}"]`)); if (m) return m; }
      return shown(s.querySelector('.cs-crowd')) || shown(s);
    }
    case 'shop': {
      const sn = ctx.snap && w.uid != null ? ctx.snap.get(w.uid) : null;
      if (sn && sn.rect) return { getBoundingClientRect: () => sn.rect, rectOnly: true };
      return shown(root.querySelector(`.lt-shop .card[data-uid="${w.uid}"]`)) || shown(root.querySelector('.lt-shop'));
    }
    case 'rate': return (w.tier && shown(root.querySelector(`.lt-rate[data-rate="${w.tier}"]`))) || (w.n && shown(root.querySelector(`.lt-rate[aria-label*="+${w.n} follower"]`))) || shown(root.querySelector('.lt-rates'));
    case 'pile': return shown(root.querySelector('.lt-deck')) || shown(root.querySelector('.lt-shop'));
    case 'stage': { const r = stageRect(w.slot); return r ? { getBoundingClientRect: () => r, rectOnly: true } : null; }
    default: return shown(root.querySelector('.stage .hub-label'));
  }
}
const dotHtml = (root, r, pid) => {
  const seat = root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const g = seat && seat.querySelector(`.cs-stack[data-res="${r}"] svg`);
  return g ? g.outerHTML : `<i class="piece-dot" style="background:var(--${r || 'lamp-ink'})"></i>`;
};
const folHtml = (root, pid) => { const g = root.querySelector(`.lt-cult-seat[data-seat="${pid}"] .cs-total svg`) || root.querySelector('.cs-total svg'); return g ? g.outerHTML : '<i class="piece-dot" style="background:var(--cream,#f3e6c8)"></i>'; };
// a whole region (the shop strip, a chair: a fallback target) never hops or pops: its box is the furniture, which never
// moves (hotseat region gate); only the thing inside it does
const region = el => !!(el && el.matches && el.matches('[data-region]'));
const hopEl = (el, ms) => { if (el && el.animate && !el.rectOnly && !region(el)) relative(el, [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-6px) scale(1.08)', offset: 0.4 }, { transform: 'translateY(0) scale(1)' }], { duration: ms, easing: 'cubic-bezier(.3,1.4,.5,1)' }); };
const square = (r, size) => ({ left: r.left + r.width / 2 - size / 2, top: r.top + r.height / 2 - size / 2, width: size, height: size });
const onFinish = (anim, fn) => { if (anim && anim.finished) anim.finished.then(() => fn(), () => fn()); else fn(); };

/**
 * When the shop's new card may be dealt, in ms from this state's commit: after a recruited card has left its slot and
 * the row has slid (grammar B4), so two cards never share a slot. 0 when nothing was bought from the shop.
 */
export function dealAfter(state) {
  const fx = state && Array.isArray(state.effects) ? state.effects : null;
  // a whole fresh row (New Faces): the new cards deal once the old row has dropped away (playChain, grammar B4)
  const outs = fx ? fx.filter(e => e.type === 'shop-out').length : 0;
  if (outs) return Math.round(MO.rowOut + (outs - 1) * MO.rowOutStagger);
  const rec = fx && fx.find(e => e.type === 'recruit' && e.from && e.from.kind === 'shop');
  if (!rec) return 0;
  const paid = fx.filter(e => e.type === 'pay' && e.cause === rec.cause).reduce((t, e) => t + Math.min(3, e.what.n), 0);
  return Math.round(MO.cardLift + Math.max(0, paid - 1) * MO.pieceStagger + flightMs(TYPICAL) * (2 / 3) + MO.shopSlide);
}

/** (kept for callers: a placed minion's slot is read when its chain plays) */
export const noteTable = root => { void root; };

/**
 * Play the chain for a change of state on the table under `root`. `snap` is the shop as it was (snapshotShop),
 * `minionsBefore` the wheel's minions as they were (snapshotMinions), `mine` the viewer's seats. Returns the plan.
 * A chain may start while the last one's tail is still landing (the same player's next step shows at its handoff).
 */
export function playChain(root, before, state, { snap = null, minionsBefore = null, mine = [], chips = null } = {}) {
  if (!root || before === state) return { atoms: [], total: 0, handoff: 0 };
  const ctx = { state, before, snap, chips };
  const chainId = (chain.n = (chain.n || 0) + 1);
  // read everything first; every write waits for the clock's next frame (before it paints): a write here made the
  // next layout effect lay the whole page out again
  const found = new Map(), rects = new Map();
  const where = w => { if (!w) return null; const k = JSON.stringify(w); if (!found.has(k)) found.set(k, placeEl(root, w, ctx)); return found.get(k); };
  const rectOf = e => { if (!rects.has(e)) rects.set(e, e.getBoundingClientRect()); return rects.get(e); };
  const measure = (a, b) => { const A = where(a), B = where(b); if (!A || !B) return TYPICAL; const ra = rectOf(A), rb = rectOf(B); return Math.hypot(rb.left + rb.width / 2 - ra.left - ra.width / 2, rb.top + rb.height / 2 - ra.top - ra.height / 2); };
  const plan = planChain(before, state, { mine, measure });
  if (!plan.atoms.length || !motionOK()) return plan;
  // where each placed minion stood in its column: the slot past the last one still standing there
  for (const a of plan.atoms) {
    if (a.op !== 'minion') continue;
    const left = [...root.querySelectorAll(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions [data-minion]`)];
    const last = left[left.length - 1];
    if (last) { const r = rectOf(last), prev = left.length > 1 ? rectOf(left[left.length - 2]) : null; const dx = prev ? r.left - prev.left : 0, dy = prev ? r.top - prev.top : r.height + 2; a.fromRect = { left: r.left + dx, top: r.top + dy, width: r.width, height: r.height }; }
    else { const c = root.querySelector(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions`); if (c) a.fromRect = rectOf(c); }
    const slot = root.querySelector(`[data-slot="${a.key}"]`);
    a.landed = slot && (slot.querySelector(`.worker[data-seat="${a.pid}"]`) || slot.querySelector('.worker'));
    a.slotEl = slot;
    a.toRect = a.landed ? rectOf(a.landed) : slot ? rectOf(slot.querySelector('.base') || slot) : null;
  }
  const toHold = [];
  for (const a of plan.atoms) {
    if (a.op !== 'piece' || a.fol) continue;
    for (const w of [a.from, a.to]) if (w.kind === 'stack') { const el = where(w); if (el) { toHold.push([el, w]); chain.pending.set(el, (chain.pending.get(el) || 0) + (a.bundle ? 1 : 1)); } }
  }
  // the follower count waits for its first piece to land (Tick listens for it), and counts while the rest do
  // a chain that arrives while another plays (a choice answered mid-chain, a bot's next step) starts at that one's
  // hand-off: the beats already playing finish first (grammar S3, §5)
  const base = chainRunning() ? Math.max(chain.clock, chain.handoffAt || 0) : chain.clock;
  chain.handoffAt = base + (plan.handoff || plan.total);
  // a member arriving in a crowd (a swap, a member taken) shows when its ghost lands, never before it leaves
  for (const a of plan.atoms) {
    if (a.op !== 'chip' || !a.hide) continue;
    const B = where(a.to);
    if (B && !B.rectOnly && B.animate && B.dataset && B.dataset.uids === String(a.uid)) track(B.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: Math.max(0, base - chain.clock) + a.at + a.dur + 30 }));
  }
  const firstLand = new Map();
  for (const a of plan.atoms) if (a.op === 'land' && a.fol && a.to.kind === 'count' && !a.pay) {
    const el = where(a.to);
    if (!el) continue;
    const f = firstLand.get(el) || { at: a.at, last: a.at };
    f.at = Math.min(f.at, a.at); f.last = Math.max(f.last, a.at);
    firstLand.set(el, f);
  }
  const now0 = performance.now();
  for (const [el, f] of firstLand) { expectArrival(el, now0 + f.at, Math.max(0, f.last - f.at)); chain.counts.add(el); }
  const holdOf = (el, pid, r) => {
    if (!el || el.rectOnly) return null;
    if (!chain.holds.has(el)) {
      const pk = picked.get(el);
      if (pk) { clearTimeout(pk.t); picked.delete(el); chain.holds.set(el, { h: pk.h, pre: pk.n }); }
      else { const p = before.players[pid]; chain.holds.set(el, { h: p ? holdStack(el, p.res[r] || 0) : null }); }
    }
    return chain.holds.get(el).h;
  };
  const release = el => { const n = (chain.pending.get(el) || 1) - 1; chain.pending.set(el, n); if (n <= 0) { const x = chain.holds.get(el); if (x && x.h) x.h.done(); chain.holds.delete(el); chain.pending.delete(el); } };
  chain.root = root;
  // now (before this commit paints, after every read above): the chain is on, and every stack it touches holds what
  // it showed before, so no number flashes its new value first
  root.dataset.chain = '1';
  for (const [el, w] of toHold) holdOf(el, w.pid, w.r);
  const epoch = chain.epoch || 0;
  const land = (a, B, skip) => {
    if ((chain.epoch || 0) !== epoch) return; // the chain was skipped: its numbers are already final
    if (a.to.kind === 'stack' && !a.pay && B) {
      const h = holdOf(B, a.to.pid, a.to.r);
      if (h) { if (a.bundle && !skip) h.roll(a.by ?? a.n, MO.roll); else h.step(a.by ?? a.n); }
      if (a.bundle && !skip) setTimeout(() => release(B), MO.roll); else release(B);
    }
    if (a.to.kind === 'count' && B && !B.rectOnly) { try { B.dispatchEvent(new CustomEvent('patrons:land')); } catch { /* old browser */ } }
    // the sound of it (sound.js): a coin for a resource gained, the little voice for followers joining
    if (!skip && !a.pay) { if (a.fol) play('follower', { n: a.by ?? a.n ?? 1 }); else if (a.to.kind === 'stack') play('coin', { n: a.by ?? a.n ?? 1 }); }
    // a big follower buy lands with weight (wave 4 #13): the count lifts and rolls, not only settles
    if (!skip && B && a.fol && a.bundle && !a.pay && a.to.kind === 'count' && (a.by ?? a.n) >= 6 && B.animate && !B.rectOnly) track(B.animate([{ translate: '0 0', scale: '1' }, { translate: '0 -6px', scale: '1.3', offset: 0.3 }, { translate: '0 0', scale: '1' }], { duration: MO.roll + MO.settle, easing: 'cubic-bezier(.3,1.5,.5,1)' }));
    else if (!skip && B) settle(B, MO.settle, a.bundle ? 1.24 : a.light ? 1.1 : a.pay ? 1.06 : 1.18);
  };
  for (const a of plan.atoms) {
    if (a.op === 'land') continue; // a piece lands when its own flight finishes
    schedule(base + a.at, skip => {
      switch (a.op) {
        case 'minion': {
          if (skip || !a.slotEl || !a.toRect) return;
          a.slotEl.classList.add('chosen');
          setTimeout(() => a.slotEl.classList.remove('chosen'), a.dur + MO.pulse);
          const F = a.fromRect || (root.querySelector(`[data-leader="${a.pid}"]`) || a.slotEl).getBoundingClientRect();
          const size = Math.max(16, a.landed ? a.toRect.width : 18);
          const html = a.landed ? a.landed.innerHTML : `<i style="background:${playerColor(a.pid)}"></i>`;
          if (a.own) {
            // yours stands in the door at once (the stamp); the trail from your column fades onto it
            play('place');
            if (a.landed && a.landed.animate) track(a.landed.animate([{ transform: 'scale(1.25)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: MO.ownStamp, easing: 'cubic-bezier(.3,1.5,.5,1)' }));
            flyPath(html, 'worker-flight minion-flight trail', square(F, size), square(a.toRect, size), { path: 'arc', duration: a.dur, fade: true });
          } else {
            chain.flying++;
            const anim = flyPath(html, 'worker-flight minion-flight', square(F, size), square(a.toRect, size), { path: 'arc', duration: a.dur });
            if (a.landed && a.landed.animate) track(a.landed.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: a.dur + 30 }));
            onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); if (a.landed) settle(a.landed, MO.settle); play('place'); });
          }
          return;
        }
        case 'home': if (!skip && minionsBefore) flyMinionsHome(root, minionsBefore); return;
        // the chairs re-sort into the new round's order now (GameScreen lays the column out; a skip sorts them too)
        case 'sort': try { dispatchEvent(new Event('patrons:seat-sort')); } catch { /* no window */ } return;
        case 'pulse': if (!skip) pulse(where(a.place), a.dur, { press: !!a.press }); return;
        case 'point': {
          // a rival's choice (grammar S3): what they chose lights, then its effect leaves it; it stays lit until it lands
          const el = where(a.place);
          if (skip || !el || el.rectOnly || !el.classList) return;
          pulse(el, MO.choicePoint);
          el.classList.add('chain-point');
          const off = () => el.classList.remove('chain-point');
          schedule(base + a.at + a.dur, off); // (a skip runs it at once)
          return;
        }
        case 'hop': if (!skip) hopEl(where(a.place), MO.hop); return;
        case 'stage': if (!skip) stageOut(root, a, ctx, where, chainId, mine); return;
        case 'tug': if (!skip) tug(where(a.place), where(a.toward), a.dur); return;
        case 'card': {
          // the recruited card: a picture of it lifts in its old slot, takes its coins, then flies to its new chip
          const sn = snap && snap.get(a.uid);
          if (skip || !sn || !sn.rect) return;
          const g = document.createElement('div');
          g.className = 'flight card-flight ghost-layer';
          g.dataset.born = String(Date.now());
          g.innerHTML = sn.html;
          Object.assign(g.style, { left: `${sn.rect.left}px`, top: `${sn.rect.top}px`, width: `${sn.rect.width}px`, height: `${sn.rect.height}px` });
          document.body.appendChild(g);
          if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
          const chip = root.querySelector(`.lt-seat[data-pid="${a.to}"] [data-uids~="${a.uid}"]`) || placeEl(root, { kind: 'crowd', pid: a.to }, ctx);
          const B = chip ? chip.getBoundingClientRect() : sn.rect;
          const dx = B.left + B.width / 2 - (sn.rect.left + sn.rect.width / 2), dy = B.top + B.height / 2 - (sn.rect.top + sn.rect.height / 2);
          const total = a.lift + a.wait + a.dur, k1 = a.lift / total, k2 = (a.lift + a.wait) / total;
          const sc = B.width ? Math.max(0.2, Math.min(0.5, B.width / sn.rect.width)) : 0.3;
          chain.flying++;
          // lift, hold while its coins drop in, then a true arc to the chip (grammar M7; sampled, so the path has no
          // corner: the five-keyframe version turned at its top and changed speed there)
          const bow = onScreenBow(sn.rect, B, Math.max(16, Math.min(70, Math.hypot(dx, dy) * 0.18)));
          const anim = track(g.animate([
            { transform: 'translate(0px,0px) scale(1)', offset: 0, easing: 'ease-out' },
            { transform: 'translate(0px,-10px) scale(1.06)', offset: k1 },
            ...arcFrames(dx, dy, bow, { from: k2, s0: 1.06, s1: sc, y0: -10, ease: CARD_EASE }),
          ], { duration: total, fill: 'forwards' }));
          track(g.animate([{ opacity: 1 }, { opacity: 1, offset: k2 + (1 - k2) * 0.6 }, { opacity: 0.2 }], { duration: total, fill: 'forwards' }));
          slideShop(root, snap);
          if (chip && chip.animate) track(chip.animate([{ opacity: 0 }, { opacity: 0, offset: 0.98 }, { opacity: 1 }], { duration: total }));
          onFinish(anim, () => {
            g.remove();
            chain.flying = Math.max(0, chain.flying - 1);
            if (chip && chip.animate && chip.isConnected && !region(chip)) relative(chip, [{ boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }, { boxShadow: '0 0 0 4px rgba(236,230,214,.55), 0 0 14px rgba(236,230,214,.5)', transform: 'scale(1.1)', offset: 0.35 }, { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }], { duration: MO.ring, easing: 'ease-out' });
          });
          return;
        }
        case 'chip': {
          if (skip) return;
          // a member that left its crowd flies from where its chip stood, as itself (its portrait)
          const was = chips && chips.get(a.uid);
          const A = was && a.from.kind === 'crowd' ? { getBoundingClientRect: () => was.rect } : where(a.from), B = where(a.to);
          if (!A || !B) return;
          chain.flying++;
          let pic = was && was.html ? `<span class="piece-member-pic">${was.html}</span>` : '<i class="piece-dot member"></i>';
          const R = a.via != null ? stageRect(a.via) : null;
          if (R) { let nm = ''; try { nm = defById(ctx.state.cards[a.uid].def).name; } catch { /* unnamed */ } if (nm) pic += `<b class="pm-name">${nm.replace(/[<&]/g, '')}</b>`; }
          if (R) {
            // out of its old chair onto the stage, a beat there, then on to its new chair
            const leg1 = Math.round(MO.stageIn), hold = Math.round(MO.stageHold / 2), leg2 = Math.max(120, a.dur - leg1 - hold);
            const big = square(R, 52);
            chain.flying++;
            const one = flyPath(pic, 'piece-flight piece-member staged', square(rectOf(A), 52), big, { path: 'arc', duration: leg1 });
            const g = document.createElement('div');
            g.className = 'piece-flight piece-member staged ghost-layer';
            g.dataset.born = String(Date.now());
            Object.assign(g.style, { left: `${big.left}px`, top: `${big.top}px`, width: `${big.width}px`, height: `${big.height}px`, opacity: '0' });
            g.innerHTML = `<div class="path-inner">${pic}</div>`;
            document.body.appendChild(g);
            const ep = chain.epoch || 0;
            onFinish(one, () => {
              if ((chain.epoch || 0) !== ep) { g.remove(); return; } // skipped: it's already home
              g.style.opacity = '1';
              if (g.animate) track(g.animate([{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.08)', offset: 0.35 }, { transform: 'none' }], { duration: hold, easing: 'cubic-bezier(.3,1.4,.5,1)' }));
              setTimeout(() => {
                g.remove();
                if ((chain.epoch || 0) !== ep) return;
                const two = flyPath(pic, 'piece-flight piece-member staged', big, square(rectOf(B), 52), { path: a.path === 'cross' ? 'cross' : 'arc', duration: leg2, fade: true });
                onFinish(two, () => { chain.flying = Math.max(0, chain.flying - 1); settle(B, MO.settle); });
              }, hold);
            });
            return;
          }
          const anim = flyPath(pic, 'piece-flight piece-member', square(rectOf(A), 28), square(rectOf(B), 28), { path: a.path, duration: a.dur, fade: true });
          onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); settle(B, MO.settle); });
          return;
        }
        case 'piece': {
          const A = where(a.from), B = where(a.to);
          // a piece leaving a stack: its number drops as it goes
          if (a.from.kind === 'stack' && A) {
            const h = holdOf(A, a.from.pid, a.from.r), x = chain.holds.get(A);
            // (units a pick already showed leaving aren't dropped again)
            const k = x && x.pre ? Math.min(x.pre, a.n || 1) : 0;
            if (k) x.pre -= k;
            if (h && (a.n || 1) > k) h.step(-((a.n || 1) - k));
            if (!skip) bump(A, true);
            release(A);
          }
          if (skip || !A || !B) { land(a, B, true); return; }
          const size = a.fol ? 18 : 16;
          const pid = a.to.kind === 'stack' || a.to.kind === 'count' ? a.to.pid : a.from.pid;
          const html = a.fol ? folHtml(root, pid) : dotHtml(root, a.r, a.owner ?? pid);
          chain.flying++;
          // (the places were measured before the commit, or on first use: never a layout read per piece)
          const anim = flyPath(html, `piece-flight piece-${a.fol ? 'fol' : 'res'}${a.pay ? ' pay' : ''}`, square(rectOf(A), size), square(rectOf(B), size),
            { path: a.pay ? 'drop' : a.take ? 'line' : 'arc', duration: a.dur, label: a.bundle ? `+${a.n}` : '', trail: a.bundle ? 2 : 0, trailGap: MO.bundleTrail, turnTo: a.turn ? dotHtml(root, a.turn, pid) : null, fade: true });
          onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); land({ ...a, by: a.n }, B, false); });
          return;
        }
        default:
      }
    });
  }
  // a whole fresh row (New Faces, motion gaps A47: "blanks all 10 cards at once, then refills"): the old row drops away
  // toward the pile, left to right, from where each card stood; the new row deals after it (dealAfter). Bookkeeping: it
  // never holds the chain, and a skip lands it.
  const outs = Array.isArray(state.effects) && state.moves === before.moves + 1 && snap ? state.effects.filter(e => e.type === 'shop-out') : [];
  if (outs.length) {
    const cards = outs.map(e => snap.get(e.what.uid)).filter(sn => sn && sn.rect && sn.html).sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
    cards.forEach((sn, k) => {
      const g = document.createElement('div');
      g.className = 'flight shop-out ghost-layer';
      g.dataset.born = String(Date.now());
      g.innerHTML = sn.html;
      Object.assign(g.style, { left: `${sn.rect.left}px`, top: `${sn.rect.top}px`, width: `${sn.rect.width}px`, height: `${sn.rect.height}px` });
      document.body.appendChild(g);
      const anim = track(g.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(12px)', opacity: 0 }], { duration: MO.rowOut, delay: k * MO.rowOutStagger, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'both' }));
      onFinish(anim, () => g.remove());
    });
  }
  // the stage holds a moment after this chain's own end, then flies home, even when the next chain follows at once
  // (a blind tester, w5: "a recruited Stylist parked over the wheel centre … into the next player's turn")
  if (plan.atoms.some(a => a.op === 'stage')) schedule(base + plan.total, skip => { if (!skip) stageRelease(MO.stageHold, chainId); });
  // what starts at once plays now, before this commit's first paint (the lifted card, the hidden chip, your minion's
  // stamp): never a frame of the end state first
  while (chain.queue.length && chain.queue[0].at <= chain.clock) chain.queue.shift().fn(false);
  run();
  if (typeof window !== 'undefined') { window.__patronsChains = (window.__patronsChains || 0) + 1; window.__patronsChainMs = plan.total; }
  return plan;
}

/** A space or member flies out of its place onto the stage (stage.js; ActionStage.jsx draws it). */
function stageOut(root, a, ctx, where, chainId, mine = []) {
  const st = ctx.state;
  const el = where(a.place);
  const from = el && !el.rectOnly ? el.getBoundingClientRect() : null;
  if (a.kind === 'space') {
    const key = a.place.key;
    const [q, i] = String(key).split('-').map(Number);
    const qid = st.quadrants[q];
    let said = null;
    try { said = panelText(qid, quadrant(qid).actions[i], Math.max(1, st.round)); } catch { return; }
    const pid = a.pid ?? (st.slots && st.slots[key]);
    const p = st.players[pid];
    const slot = a.slot || 'card';
    const at = stageRect(slot);
    if (!at) return;
    const slotEl = root.querySelector(`[data-slot="${key}"]`);
    const who = !p ? '' : mine.length === 1 && mine[0] === pid ? 'You' : p.name;
    stageShow({ id: `space:${key}`, chain: chainId, kind: 'space', key, at, from, homeEl: slotEl, dur: a.dur, color: `var(--${qid})`,
      pc: playerColor(pid), emoji: p ? seatEmoji(st, pid) : null, who: slot === 'card2' ? `${who} copies` : who,
      main: said.main || said.verb || '', second: said.second || '', note: typeof said.note === 'string' ? said.note : '' });
    return;
  }
  const { pid, uid, def } = a.place;
  const card = st.cards && st.cards[uid];
  let d = null;
  try { d = defById(card ? card.def : def); } catch { d = null; }
  if (!d) return;
  const at = stageRect(a.spot);
  if (!at) return;
  let sphere = 'colorless', color = 'var(--colorless)';
  try { if (st.quadrants.includes(d.quadrant)) { sphere = quadrant(d.quadrant).resource; color = `var(--${d.quadrant})`; } } catch { /* colorless */ }
  stageShow({ id: `member:${pid}:${uid}`, chain: chainId, kind: 'member', uid, at, from, homeEl: el && !el.rectOnly ? el : null, dur: a.dur, color, pc: playerColor(pid),
    name: d.name, sprite: [d.id, spriteId(d.name)], sphere });
}

/** Install the skip: a press anywhere, or Space (when it isn't pressing a button), lands the chain on screen. */
export function installChainSkip() {
  if (typeof addEventListener !== 'function') return () => {};
  // a click on a live choice's target (a seat or space to pick, an answer) is an answer, not a skip: the beats playing
  // finish and the answer's chain follows them (grammar S3). A click anywhere else, or Space, skips.
  const down = e => {
    if (!chainRunning()) return;
    const t = e && e.target;
    const app = t && t.closest && t.closest('.app.game');
    if (app && app.dataset.phase === 'choose' && t.closest('[data-option]')) return;
    skipChain();
  };
  const key = e => {
    if (e.key !== ' ' || !chainRunning()) return;
    const t = e.target;
    skipChain();
    if (!(t && t.closest && t.closest('input,textarea,select,button,[role="button"],[contenteditable]'))) e.preventDefault();
  };
  addEventListener('pointerdown', down, true);
  addEventListener('keydown', key, true);
  return () => { removeEventListener('pointerdown', down, true); removeEventListener('keydown', key, true); };
}
