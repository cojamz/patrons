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
//     4 or more as one bundle with its count. Each named cause finishes its payout before the next enters; short flights keep the chain snappy. Every stack and count changes as its pieces leave and land, never before.
//
// planChain is the plan in time (the table's pacing reads its length); playChain puts it on screen with Web Animations
// and timers (no React state). A click or Space skips the rest of a chain to its end (skipChain). Every duration comes
// from src/v4/motion.js at the viewer's speed. A state without an effect stream (an online guest, a catch-up) falls
// back to gains.js, which reads the change of state.
import { MO, RIVAL, SPEEDS, flightMs, nextBeatAt, speedScale, streamGap, slowed } from '../motion.js';
import { playerColor, roman } from '../format.js';
import { play } from '../sound.js';
import { gainsBetween } from './gains.js';
import { seatOrder } from './seats.js';
import { stageRect, hubRect, stageShow, stageRelease, stageClear, stageBusy, subscribeStage, stageItems, stagePlace, spaceRect, bubbleRect, stageLeave, HUB_MEMBER } from './stage.js';
import { panelText } from './panelText.js';
import { quadrant, defById } from '../../engine/v4/index.js';
import { seatEmoji } from '../format.js';
import { spriteId } from '../art/index.js';
import { motionOK, flyPath, pulse, tug, settle, flyMinionsHome, slideShop, holdStack, bump, track, landAll, expectArrival, clearArrivals, clearFlights, aim, safetyNet, arcFrames, bezier, onScreenBow, relative, motionPending, onMotionChange } from './flight.js';

const CARD_EASE = bezier(0.4, 0.1, 0.6, 1); // a recruited card's flight to its crowd (grammar M7); no long creep at the end (Cory, 22:48)

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
  // Closing a scoring summary reveals a new-round state at the same move number.
  // Its delta is income only; never reuse that state's full closing-turn effect stream.
  const deltaState = state.round > before.round && state.moves === before.moves
    ? { ...state, moves: before.moves + 1 } : state;
  const out = gainsBetween(before, deltaState).map((m, i) => {
    const from = conv(m.from), to = conv(m.to);
    const cause = from.kind === 'member' ? { kind: 'member', pid: from.pid, def: from.def } : from.kind === 'space' ? { kind: 'space', key: from.key } : { kind: 'guess', n: i };
    return { n: i, type: m.what === 'fol' ? 'followers' : m.pay ? 'pay' : from.kind === 'stack' ? 'transfer' : 'gain', cause, from, to, what: m.what === 'fol' ? { n: m.n } : { r: m.r, n: m.n } };
  });
  return [...membersBetween(before, state, out.length), ...out];
}
/** Members that changed hands between two states, as the engine's stream tells them (effects.js), for a step whose
 *  stream is missing (several moves at once): a member never changes chairs unseen. */
function membersBetween(before, state, n0) {
  const out = [];
  if (!before.players || !state.players) return out;
  const cause = { kind: 'guess', n: n0 };
  const was = new Map(), now = new Map();
  before.players.forEach((p, pid) => p.members.forEach(u => was.set(u, pid)));
  state.players.forEach((p, pid) => p.members.forEach(u => now.set(u, pid)));
  for (const [u, pid] of now) {
    const b = was.get(u);
    if (b === pid) continue;
    const i = (before.shop || []).indexOf(u);
    if (b != null) out.push({ type: 'member-move', cause, from: { kind: 'crowd', pid: b }, to: { kind: 'crowd', pid }, what: { uid: u } });
    else out.push({ type: 'recruit', cause, from: i >= 0 ? { kind: 'shop', index: i, uid: u } : { kind: 'pile' }, to: { kind: 'crowd', pid }, what: { uid: u } });
  }
  for (const [u, pid] of was) {
    if (now.has(u)) continue;
    const i = (state.shop || []).indexOf(u);
    out.push({ type: 'release', cause, from: { kind: 'crowd', pid }, to: i >= 0 ? { kind: 'shop', index: i, uid: u } : { kind: 'pile' }, what: { uid: u } });
  }
  return out;
}

/** One cause's effects as moves: payments, takes (paired steals, color turns included), gives, gains, cards, followers. */
function movesOf(cause, effects, owner) {
  const pays = [], takes = [], gives = [], gains = [], cards = [], fols = [];
  const used = new Set();
  // A color-changing steal may aggregate several rival piles into one magenta gain.
  // Work on local quantities: each unit travels once, directly from its victim to the thief.
  effects = effects.map(e => ({ ...e, what: { ...e.what } }));
  for (const p of effects) {
    if (p.type !== 'pay' || p.from.pid === owner || used.has(p)) continue;
    // Match the stolen color first: an action’s inherent Magenta gain is separate from its theft.
    const matching = effects.filter(g => g.type === 'gain' && !used.has(g) && g.to.pid === owner)
      .sort((a, b) => Number(b.what.r === p.what.r) - Number(a.what.r === p.what.r));
    for (const g of matching) {
      const n = Math.min(p.what.n, g.what.n);
      if (!n) continue;
      takes.push({ from: p.from, to: g.to, n, r: p.what.r, turn: g.what.r !== p.what.r ? g.what.r : null });
      p.what.n -= n; g.what.n -= n;
      if (!g.what.n) used.add(g);
      if (!p.what.n) { used.add(p); break; }
    }
  }
  // Ransom payments keep each paid color and travel directly to the recipient.
  const ownPays = effects.filter(e => e.type === 'pay' && !used.has(e) && owner != null && e.from.pid === owner && e.from.kind === 'stack' && !['shop', 'rate'].includes(e.to && e.to.kind));
  for (const p of ownPays) {
    const matching = effects.filter(g => g.type === 'gain' && !used.has(g) && g.to.kind === 'stack' && g.to.pid !== owner)
      .sort((a, b) => Number(b.what.r === p.what.r) - Number(a.what.r === p.what.r));
    for (const g of matching) {
      const n = Math.min(p.what.n, g.what.n);
      if (!n) continue;
      gives.push({ from: p.from, to: g.to, n, r: p.what.r, turn: g.what.r !== p.what.r ? g.what.r : null });
      p.what.n -= n; g.what.n -= n;
      if (!g.what.n) used.add(g);
      if (!p.what.n) { used.add(p); break; }
    }
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

/** How long the wheel's minions take to fly home at a new round (all at once, a stagger apart; flight.js). */
function homeMs(before) {
  const n = Object.keys(before.slots || {}).length + Object.values(before.squats || {}).reduce((k, l) => k + l.length, 0);
  return n ? MO.minionsHome + (n - 1) * MO.minionsHomeStagger : 0;
}
/** A new round's own effects: the closing move's stream past the scored board's (the board carries the stream up to
 *  its scoring, format.js scoringSnapshot), from the round's start on. Null when they can't be told apart. */
function roundSegment(before, state) {
  if (!Array.isArray(state.effects) || !Array.isArray(before.effects) || before.effects.length > state.effects.length) return null;
  const seg = state.effects.slice(before.effects.length);
  return seg.length && seg[0].cause && seg[0].cause.kind === 'round' ? seg : null;
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
  const roundAdvance = state.round > before.round && before.round >= 1 && state.moves === before.moves;
  if (!(state.moves > before.moves) && !roundAdvance) return { atoms, total: 0, handoff: 0 };
  const dist = (a, b) => (measure ? measure(a, b) : TYPICAL);
  // Shorter travel replaces overlapping named causes, preserving the overall turn budget.
  const fly = (a, b) => Math.round(flightMs(dist(a, b)) * 0.65);
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
  // a new round opens as separate beats (Cory's A5 remainder): the minions home, then each seat's round-start income,
  // then the members that do something else at round start (steals, set-asides), then the shop's fresh row
  const homeAt = roundAdvance ? homeMs(before) : 0;
  if (!sameRound && before.round >= 1) { at(0, { op: 'home' }); t = ends(roundAdvance ? homeAt : MO.minionsHome); }

  // 2. the cascade (a rival's run of follower buys, folded by foldBuys, carries the whole run's effects)
  let fx = Array.isArray(state.effects) && state.moves === before.moves + 1 ? state.effects
    : state.foldedFrom === before.moves && Array.isArray(state.foldedEffects) ? state.foldedEffects
      : roundAdvance && roundSegment(before, state) || fromGains(before, state);
  // a new round's round-start income plays as its own beat (below), before the hooks
  const income = roundAdvance ? fx.filter(e => e && e.cause && e.cause.kind === 'member' && e.type === 'gain' && e.to && e.to.kind === 'stack' && e.to.pid === e.cause.pid) : [];
  if (income.length) fx = fx.filter(e => !income.includes(e));
  const beats = [];
  for (const e of fx) {
    if (!e || !e.cause || ['contest', 'final'].includes(e.cause.kind)) continue; // the Reckoning flies prizes and end-game member bonuses
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
    : w.kind === 'member' && w.uid != null && stagedUids.has(w.uid) && w.pid === stagedUids.get(w.uid).pid ? { kind: 'stage', slot: stagedUids.get(w.uid).spot, uid: w.uid } : w);
  const pieces = (time, from0, to0, n, opt = {}) => {
    // Resources live at their matching wheel rim; members still give from their own portrait.
    const rim = { kind: 'rim', r: opt.r };
    const from = opt.r && ['space', 'bank'].includes(from0.kind) ? rim : onStage(from0);
    const to = opt.r && opt.pay ? rim : onStage(to0);
    // 1–3 single pieces, 60ms apart (Steady); 4 or more one bundle carrying its count
    // (Cory, 2026-10-18: "steals: make what's being stolen clear at once") a take of 2 or more leaves as one handful
    const bundle = n >= 4 || (opt.take && n >= 2);
    // a bundle of resources is a stream: every coin flies, the last one `tail` behind the first (Cory: "12 coins animate
    // as 12, any count"); its count rolls as they land. Followers keep their bundle. A stream's coins travel quicker by
    // its tail (a rush of coins, never under 0.6 of the flight), so its last coin lands when the old single bundle did
    // and the turn's pace stays where it was (pacing.test.js)
    const tail = bundle && !opt.fol ? Math.round((n - 1) * streamGap(n)) : 0;
    const d = opt.dur || Math.max(Math.round(fly(from, to) * 0.6), fly(from, to) - tail);
    hand = Math.max(hand, (bundle ? time + tail : time + (n - 1) * MO.pieceStagger) + d * (2 / 3));
    if (bundle) { at(time, { op: 'piece', from, to, n, bundle: true, dur: d, ...(tail ? { stream: tail } : {}), ...opt }); at(time + d, { op: 'land', to, by: n, bundle: true, ...(tail ? { stream: tail } : {}), ...opt }); return { last: time + tail, d }; }
    for (let k = 0; k < n; k++) { at(time + k * MO.pieceStagger, { op: 'piece', from, to, n: 1, dur: d, ...opt }); at(time + k * MO.pieceStagger + d, { op: 'land', to, by: 1, ...opt }); }
    return { last: time + (n - 1) * MO.pieceStagger, d };
  };
  const after = r => r.last + nextBeatAt(r.d); // when the next beat may start
  if (income.length) {
    // the beat starts as the last minion is two-thirds of the way home
    const t0 = Math.max(0, homeAt - MO.minionsHome / 3);
    const seats = seatOrder(state).filter((id, i, a) => a.indexOf(id) === i);
    let k = 0;
    for (const pid of seats) {
      const mine0 = income.filter(e => e.cause.pid === pid);
      if (!mine0.length) continue;
      const st = t0 + k++ * MO.incomeSeat;
      const byMember = new Map();
      for (const e of mine0) { const key = e.cause.uid ?? e.cause.def; if (!byMember.has(key)) byMember.set(key, []); byMember.get(key).push(e); }
      for (const list of byMember.values()) {
        const c = list[0].cause, src = { kind: 'member', pid, uid: c.uid, def: c.def };
        at(st, { op: 'hop', place: src });
        // one group per color, net of every gain this member made (a +2 and a +1 of gold fly as one +3)
        const net = new Map();
        for (const e of list) net.set(e.what.r, (net.get(e.what.r) || 0) + e.what.n);
        let o = st + MO.lead;
        for (const [r, n] of net) {
          if (!n) continue;
          const r0 = pieces(o, src, { kind: 'stack', pid, r }, n, { r, owner: pid });
          ends(r0.last + r0.d);
          o += MO.fan;
        }
      }
    }
    // the next beat (round-start hooks, then the shop) waits for the income to land: each its own beat
    t = Math.max(t, end);
  }
  // what a member's beat did, in plain words with the real numbers, for its caption on the stage (Cory, 22:48: "a member
  // will fly out and something will happen, but its not clear why without hover"): "you +1 gold", "+2 blue from P3"
  const who = id => (mine.length === 1 && mine[0] === id ? 'you' : state.players[id] ? state.players[id].name : '');
  const did = (m, pid) => {
    const out = [];
    const sum = (list, key) => { const g = new Map(); for (const e of list) { const k = `${key(e)}|${e.r ?? e.what.r}`; g.set(k, (g.get(k) || 0) + (e.n ?? e.what.n)); } for (const [k, n] of g) if (!n) g.delete(k); return g; };
    for (const [k, n] of sum(m.gains, e => e.to.pid)) { const [to, r] = k.split('|'); out.push(`${Number(to) === pid ? '' : `${who(Number(to))} `}+${n} ${r}`); }
    for (const [k, n] of sum(m.takes, e => e.from.pid)) { const [from, r] = k.split('|'); out.push(`+${n} ${r} from ${who(Number(from))}`); }
    for (const [k, n] of sum(m.gives, e => e.to.pid)) { const [to, r] = k.split('|'); out.push(`${who(Number(to))} +${n} ${r}`); }
    for (const [k, n] of sum(m.pays, e => e.from.pid)) { const [, r] = k.split('|'); out.push(`paid ${n} ${r}`); }
    const f = m.fols.reduce((t, e) => t + (e.to && e.to.pid === pid ? e.what.n : 0), 0);
    if (f) out.push(`${f > 0 ? '+' : '−'}${Math.abs(f)} follower${Math.abs(f) === 1 ? '' : 's'}`);
    const lead = who(pid);
    return out.length ? `${lead === 'you' ? 'You' : lead}: ${out.join(', ')}` : '';
  };
  const owner0 = c => (c.kind === 'recruit' || c.kind === 'buy' || c.kind === 'space' || c.kind === 'move' || c.kind === 'release' || c.kind === 'member' || c.kind === 'setup' ? c.pid : null);
  let setup = false;
  // where the mover's move happened (the space taken, the rate bought at, the card recruited): a rival's member that pays
  // out because of it (Tax Collector on your follower buy) sends its gain from there to their pile (the skeptic, w4 #14:
  // "nothing travels from my buy to P4's seat")
  const mover = before.pending ? before.pending.player : null;
  // a rival's step in a round plays at RIVAL (motion.js), its beats overlapping; `keep` holds the spans of its recruit
  // beats, which keep their full timing
  const rival = mover != null && !mine.includes(mover) && sameRound && before.round >= 1;
  const keep = [];
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
    // Reactions follow the triggering payout: rewinding to lastStart put two named causes on top of one another.
    const fromMove = reactive && c.uid == null ? movePlace : null;
    // the source acts first: it flies out of its place onto the stage (a space as a card at the hub, a member beside
    // it), and gives from there (Cory, 2026-10-15: "a card shows up showing the action, and resources flow to/from that
    // action to players. same with members as they are contributing"). A member already out hops again.
    // (a blind tester, w5: "P4's Auctioneer +1 blue on each rival recruit … nearly invisible, all I saw was a seat
    // number changing"): it steps onto the stage too, in the same beat, and gives from there
    if (c.kind === 'member' && c.uid != null) {
      const was = stagedUids.get(c.uid);
      if (was && was.pid === c.pid) { at(s, { op: 'stage', kind: 'member', place: { kind: 'member', pid: c.pid, uid: c.uid, def: c.def }, spot: was.spot, dur: MO.hop, got: did(m, c.pid) }); s += MO.lead; }
      else {
        const spot = stagedUids.size;
        stagedUids.set(c.uid, { pid: c.pid, spot });
        at(s, { op: 'stage', kind: 'member', place: { kind: 'member', pid: c.pid, uid: c.uid, def: c.def }, spot, dur: MO.stageIn, got: did(m, c.pid) });
        s += MO.stageIn;
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
      // The card stays lifted until its payment has landed on the wheel.
      const into = card.from.kind === 'pile' ? card.from : { kind: 'shop', index: c.index, uid: c.uid };
      for (const [i, p] of m.pays.entries()) { const r = pieces(s + MO.cardLift + hold + i * MO.fan, p.from, into, p.what.n, { pay: true, r: p.what.r, owner: p.from.pid }); paid = Math.max(paid, r.last + r.d); }
      // (Cory, 2026-10-18) the recruit flies to the middle, shows what it does, then goes to its buyer: it leaves its
      // slot as it lifts, its coins drop meanwhile, it holds at the hub a beat to be read, then flies to the crowd
      const hubW = { kind: 'stage', slot: 'hub' };
      const toHub = fly(card.from, hubW), fromHub = fly(hubW, card.to);
      const atHub = s + MO.cardLift + hold + toHub;
      const leave = Math.max(atHub + MO.recruitShow, paid);
      hand = Math.max(hand, leave + fromHub * (2 / 3));
      at(s, { op: 'card', uid: card.what.uid, to: card.to.pid, from: card.from, lift: MO.cardLift + hold, toHub, show: leave - atHub, fromHub });
      const landed = ends(leave + fromHub);
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
    // a recruit keeps full time on a rival's step; a follower buy plays at the rival's pace too (Cory, Oct 28) but
    // still lands in full before anything else moves
    const kept = isRecruit || c.kind === 'buy';
    if (rival && isRecruit) keep.push([s, Math.max(next, end)]);
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
        if (g.tug) at(o, { op: 'tug', place: g.from, toward: g.to, dur: MO.tug, n: g.n, r: g.opt && g.opt.r, owner: g.from.pid });
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
    // an extra minion (Cory, 2026-10-29): a spare one leaves the pool (or a rival's row) and lands in its new seat's row
    const spare = beat.effects.filter(e => e.type === 'minion');
    if (spare.length) {
      let o = cur, lastR = null;
      for (const e of spare) {
        const d = fly(e.from, e.to);
        for (let k = 0; k < e.what.n; k++) at(o + k * MO.pieceStagger, { op: 'spare', from: e.from, pid: e.to.pid, k, n: e.what.n, dur: d });
        const r = { last: o + (e.what.n - 1) * MO.pieceStagger, d };
        ends(r.last + r.d);
        if (!lastR || r.last + r.d > lastR.last + lastR.d) lastR = r;
        o += MO.fan;
      }
      cur = after(lastR);
    }
    // members changing hands (grammar M10; motion gaps 3: "P3 traded Broker for P4's Retinue" showed no travel): a swap's
    // two members cross at once on mirrored arcs; a member taken (Poach, a ransom let go) is a take, the victim's crowd
    // tugs and it flies straight. Each lands on its own new chip, which shows when it lands.
    const moves = m.cards.filter(e => e.type === 'member-move');
    const moved = new Set(); // planning must never mutate the engine's effect stream
    for (const card of m.cards) {
      if (moved.has(card)) continue;
      const to = card.type === 'member-move' || card.type === 'recruit' ? { ...card.to, uid: card.what.uid } : card.to;
      if (card.type === 'member-move') {
        const back = moves.find(o => o !== card && !moved.has(o) && o.from.pid === card.to.pid && o.to.pid === card.from.pid);
        // (tester B, w5: "a bot's Even Swap took my Tax Collector and nothing showed it"): a member changing hands
        // stops on the stage on its way, big, so everyone sees who it is before it lands in its new chair
        const via = MO.stageIn + Math.round(MO.stageHold / 2);
        if (back) {
          moved.add(back);
          at(cur, { op: 'chip', from: card.from, to, uid: card.what.uid, path: 'arc', dur: via + MO.swap, via: 0, swap: true, hide: true });
          at(cur, { op: 'chip', from: back.from, to: { ...back.to, uid: back.what.uid }, uid: back.what.uid, path: 'cross', dur: via + MO.swap, via: 1, swap: true, hide: true });
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
      // a swap with the shop (Promote, Demote, Even Swap): the member leaving for the shop and the one coming off it
      // cross at once, each on its own arc; the card going back shows in the shop when it lands (the animation audit:
      // it was dealt off the deck before it left its cult, and the two moved one after the other)
      const isShop = w => w && w.kind === 'shop';
      const partner = card.type === 'release' && isShop(card.to) ? m.cards.find(o => o !== card && !moved.has(o) && o.type === 'recruit' && isShop(o.from))
        : card.type === 'recruit' && isShop(card.from) ? m.cards.find(o => o !== card && !moved.has(o) && o.type === 'release' && isShop(o.to)) : null;
      if (partner) {
        moved.add(partner);
        const [out, inn] = card.type === 'release' ? [card, partner] : [partner, card];
        const dOut = fly(out.from, out.to), dIn = fly(inn.from, inn.to);
        at(cur, { op: 'chip', from: out.from, to: out.to, uid: out.what.uid, path: 'arc', dur: dOut, hide: true });
        at(cur, { op: 'chip', from: inn.from, to: { ...inn.to, uid: inn.what.uid }, uid: inn.what.uid, path: 'cross', dur: dIn, hide: true });
        ends(cur + Math.max(dOut, dIn));
        cur += nextBeatAt(Math.max(dOut, dIn));
        continue;
      }
      const d = fly(card.from, card.to);
      at(cur, { op: 'chip', from: card.from, to, uid: card.what.uid, path: card.type === 'release' ? 'drop' : 'arc', dur: d, hide: card.type === 'recruit' || (card.type === 'release' && isShop(card.to)) });
      ends(cur + d);
      cur += nextBeatAt(d);
    }
    phase(m.fols.map(f => (f.what.n > 0 ? { from: f.from.kind === 'bank' && pulsed ? { kind: 'space', key: pulsed } : f.from, to: f.to, n: f.what.n, opt: { fol: true } } : { from: f.from, to: f.to, n: -f.what.n, opt: { fol: true, pay: true } })));
    // Each named cause gets a clear landing before the next source enters. Color fans within a cause stay together.
    // A rival's beats overlap instead: the next starts at this one's hand-off (its last piece two-thirds along, grammar
    // §5), except after a recruit or a follower buy, which lands in full before anything else moves.
    t = rival && !kept ? Math.max(t, cur) : Math.max(t, cur, end);
  }
  const turnPasses = !!(state.pending && before.pending && state.pending.player !== before.pending.player);
  // starting picks read one at a time: the next pick lights only when this one has landed, and a short rest between two
  // players' picks (the first placements follow the last one)
  if (setup && end) { hand = end; if (turnPasses) end += MO.setupRest; }
  if (resort) { at(end, { op: 'sort' }); end += MO.sortBeat; hand = end; }
  // the round's fresh shop is the round start's last beat: the old row goes to the deck once everything else has landed
  // (or, with nothing else, as the minions come home), and the new row deals after it (useDeal; playChain delays it)
  const outs = roundAdvance ? shopOuts(before, state).length : 0;
  if (outs) {
    const refillAt = t;
    at(refillAt, { op: 'refill', n: outs });
    end = Math.max(end, refillAt + rowOutMs(outs) + shuffleInMs(joinedNow(before, state)) + MO.deal + (outs - 1) * MO.dealStagger);
    hand = end;
  }
  // a rival's step: its timeline runs at RIVAL outside its recruit beats (rivalClock), and its closing
  // breath too when it has neither
  const pace = rival && end ? (keep.length ? 1 : RIVAL) : 1;
  if (rival && end) {
    const W = rivalClock(keep);
    for (const a of atoms) {
      const t0 = a.at, w0 = W(t0);
      if (a.op === 'card') { let x = t0; for (const f of ['lift', 'toHub', 'show', 'fromHub']) { const y = x + a[f]; a[f] = W(y) - W(x); x = y; } }
      if (a.dur) a.dur = W(t0 + a.dur) - w0;
      if (a.stream) a.stream = W(t0 + a.stream) - w0;
      a.at = w0;
    }
    end = W(end); hand = W(hand); t = W(t);
  }
  // Dense chains tighten proportionally, preserving cause order within the existing turn-wait budget.
  // a longer plan plays faster to fit, never faster than Quick (half)
  const cap = Math.round(2400 * speedScale());
  // a step in a round also fits the table's hold cap (stepHoldCap, less a margin for its landing): past it the rest of
  // the chain lands at once and its last pieces never fly (Cory, Oct 28: "often seems like half the animation is
  // skipped"; at Relaxed a third of rivals' steps ran past it). It plays faster to fit instead, never faster than Steady
  const fit = state.round >= 1 && state.round === before.round ? stepHoldCap(chainBehind) - FIT_MARGIN : Infinity;
  const room = Math.min(cap, fit);
  // (a new round's opening isn't a turn: its beats keep their own pace, outside the turn's cap)
  if (end > room && !roundAdvance) {
    const k = Math.max(room < cap ? Math.min(0.5, SPEEDS.steady / speedScale()) : 0.5, room / end);
    for (const a of atoms) { a.at = Math.round(a.at * k); if (a.dur) a.dur = Math.round(a.dur * k); if (a.lift) a.lift = Math.round(a.lift * k); if (a.wait) a.wait = Math.round(a.wait * k); for (const f of ['toHub', 'show', 'fromHub']) if (a[f]) a[f] = Math.round(a[f] * k); }
    end *= k; hand *= k; t *= k;
  }
  return { atoms: atoms.sort((a, b) => a.at - b.at), total: end ? Math.round(end + (turnPasses ? MO.breath * pace : 0)) : 0, handoff: end ? Math.round(Math.max(hand, t)) : 0, turnPasses, pace };
}

// the table is behind (3+ steps waiting, useTable): the hold cap halves, and a step's show fits the shorter one
let chainBehind = false;
export const noteBehind = b => { chainBehind = !!b; };
const FIT_MARGIN = 600;

/** A rival step's clock: time runs at RIVAL, except inside the kept spans (a recruit's beat), where it
 *  runs at full speed. Maps a time on the plan to its time on screen (whole ms, never out of order). */
function rivalClock(keep) {
  const spans = [];
  for (const [a, b] of [...keep].sort((x, y) => x[0] - y[0])) {
    if (!(b > a)) continue;
    const last = spans[spans.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b); else spans.push([a, b]);
  }
  return x => {
    let kept = 0;
    for (const [a, b] of spans) { if (x <= a) break; kept += Math.min(x, b) - a; }
    return Math.round(RIVAL * x + (1 - RIVAL) * kept);
  };
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
  // (a rival's quick step holds its floor at its own pace, RIVAL; a recruit holds the full floor)
  const floored = rivalStep && (!sameNext || nextPlaces) ? Math.round(floor * (plan.pace ?? 1)) : 0;
  // a rival's placement hands on at its hand-off (its last piece two-thirds along), even when its turn ends there
  // the turn passing to another player (panel r1: rival turns overlapped your own coins still flying, and each other):
  // this turn's pieces all land before the next player's turn begins, so every turn is its own beat; only the closing
  // breath overlaps the next minion's quiet departure (the wait budget, pacing.test.js H2, has no room for more)
  if (plan.total && !sameNext) return Math.max(passes, floored);
  if (plan.total) return Math.max(sameNext || (placing && rivalStep) ? plan.handoff : passes, floored);
  return rivalStep ? (sameNext ? 0 : MO.passHold) : base;
}
/** The longest a step may hold on screen: the chain's cap plus its breath and the floor (re-timing never goes past it). */
export const holdCap = () => Math.round(2400 * speedScale()) + MO.breath + 400;
/** The longest a step in a round may hold the table before the rest of its chain lands at once: Steady's cap even at
 *  Relaxed, and half that while the table is `behind` (3+ steps waiting). A late-game recruit that sets off 4–6
 *  members one by one held 7–9s at Relaxed, and the table fell minutes behind the game (Mike, Oct 26: "locking up"). */
export const stepHoldCap = (behind = false) => Math.round((2400 * Math.min(speedScale(), SPEEDS.steady) + 400) * (behind ? 0.5 : 1));

// ---------- the screen ----------
// One clock for every chain on the table, woken by a timer when its next step is due (tick, below). A late wake (a
// loaded box) stretches the show instead of bunching its pieces; and a piece's landing (its
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
// the chain's last piece has landed (its settles, count rolls and the stage's way home may still be playing): your next
// choices can light now (Cory, 2026-10-25: "your next choices light up as the last piece lands, not after the bounce")
const landSubs = new Set();
export const onChainLanded = fn => { landSubs.add(fn); return () => landSubs.delete(fn); };
/** How much of the chain's queue is still to play, on its own clock (0 when only landings and the settle are left). */
export const chainLeft = () => (chain.queue.length ? Math.max(0, chain.queue[chain.queue.length - 1].at - chain.clock) : 0);
export const chainRunning = () => chain.queue.length > 0 || chain.flying > 0 || !!chain.draining;
/** For a stuck-table report (gates): where the chain stands. */
export const chainState = () => ({ queue: chain.queue.length, flying: chain.flying, draining: !!chain.draining, motion: motionPending(), stage: stageBusy(), items: stageItems().map(it => ({ id: it.id, kind: it.kind, recruit: !!it.recruit, leaving: !!it.leaving, lingering: !!it.lingering, chain: it.chain, out: it.out })), clock: Math.round(chain.clock || 0) });

// The chain's clock wakes only when a step is due (a timer), never every frame (smooth pass, 2026-10-28): a frame loop
// running through the whole show made the browser do a full main-thread frame ~140 times per click (style, layers,
// commit), though every piece in flight is a compositor animation that needs none. Flights in the air are polled
// at 100 ms only once nothing else is queued.
function tick() {
  chain.raf = 0;
  const now = performance.now();
  if (chain.last == null) chain.wall = now - chain.clock;
  // a late wake stretches the show rather than bunching it (one frame's worth past the step that was due)
  const dt = chain.last == null ? 0 : Math.min(Math.max(0, now - chain.last), (chain.due || 0) + 34);
  chain.last = now;
  chain.clock += dt;
  // a late frame stretches the show rather than bunching it, but never by more than 250ms behind the wall clock
  // (a box that is slow for seconds still plays the chain at about its pace)
  const behind = now - chain.wall - chain.clock;
  if (behind > 250) chain.clock += behind - 250;
  while (chain.queue.length && chain.queue[0].at <= chain.clock) chain.queue.shift().fn(false);
  if (chain.queue.length) { arm(chain.queue[0].at - chain.clock); return; }
  if (chain.flying > 0) { arm(100); return; }
  endChain();
}
function arm(ms) {
  clearTimeout(chain.raf);
  chain.due = Math.max(0, ms);
  chain.raf = setTimeout(tick, chain.due);
}
const run = () => { if (!chain.raf && typeof requestAnimationFrame === 'function') arm(0); };
function schedule(at, fn) {
  const item = { at, fn };
  let k = chain.queue.length;
  while (k > 0 && chain.queue[k - 1].at > at) k--;
  chain.queue.splice(k, 0, item);
  // a step due sooner than the wake already set moves the wake up
  if (chain.raf && k === 0) arm(at - chain.clock - (chain.last == null ? 0 : performance.now() - chain.last));
}
const cancelDrain = () => {
  if (chain.drainCleanup) chain.drainCleanup();
  chain.drainCleanup = null;
  chain.drainToken = null;
  chain.draining = false;
};
function finishChain(now = false) {
  cancelDrain();
  for (const { h } of chain.holds.values()) if (h) h.done(now);
  chain.holds.clear();
  chain.pending.clear();
  clearArrivals(chain.counts);
  chain.counts.clear();
  if (chain.root) delete chain.root.dataset.chain;
  chain.last = null;
  for (const fn of endSubs) fn();
}
function endChain(now = false) {
  if (now) { stageClear(); finishChain(true); return; }
  if (chain.draining) return;
  chain.draining = true;
  const token = chain.drainToken = {};
  for (const { h } of chain.holds.values()) if (h) h.done();
  // The final landing starts its settle/count; the stage then returns home. Those actual completions,
  // not the nominal plan length, release the next action. Ambient CSS animation is never tracked here.
  stageRelease();
  let scheduled = false, landed = false;
  const check = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (chain.drainToken !== token || chain.queue.length || chain.flying > 0) return;
      if (!landed) { landed = true; for (const fn of landSubs) fn(); }
      if (!motionPending() && !stageBusy()) finishChain();
    });
  };
  const offMotion = onMotionChange(check), offStage = subscribeStage(check);
  chain.drainCleanup = () => { offMotion(); offStage(); };
  check();
}
/** Skip the rest of the chain on screen: every step jumps to its end state at once (a click, Space). */
export function skipChain() {
  if (!chainRunning()) return false;
  const q = chain.queue;
  chain.queue = [];
  for (const item of q) item.fn(true);
  clearRewind();
  landAll();
  clearFlights(0);
  chain.flying = 0;
  chain.epoch = (chain.epoch || 0) + 1; // landings still resolving from the skipped chain change nothing
  if (chain.raf) { clearTimeout(chain.raf); chain.raf = 0; }
  chain.handoffAt = 0;
  endChain(true);
  for (const fn of skipSubs) fn();
  // (detail.queued: beats that never played, for e2e/v4/landing.mjs; 0 when only the landing's settle was left)
  try { dispatchEvent(new CustomEvent('patrons:chain-skip', { detail: { queued: q.length } })); } catch { /* no window */ }
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
    // the spare minions (MinionPool.jsx), and a seat's row of minions still to place
    case 'pool': return shown(root.querySelector('.lt-pool .pool-men')) || shown(root.querySelector('.lt-pool'));
    case 'minions': { const s = seat(w.pid); return s && (shown(s.querySelector('.cs-minions')) || shown(s)); }
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
    case 'rim': {
      const rim = shown(root.querySelector(`.rim[data-rim-res="${w.r}"]`));
      if (!rim) return shown(root.querySelector('.lt-wheel'));
      // The middle of the outer arc, transformed with the wheel (not the quadrant's bounding-box centre).
      if (rim.getTotalLength && rim.getPointAtLength && rim.getScreenCTM) {
        return { rectOnly: true, getBoundingClientRect: () => {
          const p = rim.getPointAtLength(rim.getTotalLength() / 4), m = rim.getScreenCTM();
          if (!m) return rim.getBoundingClientRect();
          const x = m.a * p.x + m.c * p.y + m.e, y = m.b * p.x + m.d * p.y + m.f;
          return { left: x - 8, top: y - 8, width: 16, height: 16, right: x + 8, bottom: y + 8 };
        } };
      }
      return rim;
    }
    case 'rate': return (w.tier && shown(root.querySelector(`.lt-rate[data-rate="${w.tier}"]`))) || (w.n && shown(root.querySelector(`.lt-rate[aria-label*="+${w.n} follower"]`))) || shown(root.querySelector('.lt-rates'));
    case 'pile': return shown(root.querySelector('.lt-deck')) || shown(root.querySelector('.lt-shop'));
    case 'stage': {
      // Member gains leave the portrait itself, including while its caption card is still landing.
      if (w.uid != null) {
        const portrait = shown(document.querySelector(`.action-stage [data-stage-uid="${w.uid}"] .as-fig`));
        if (portrait) return portrait;
      }
      const r = stageRect(w.slot);
      return r ? { getBoundingClientRect: () => r, rectOnly: true } : null;
    }
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
/** How a bundle flies: resources as a stream of every coin (the piece's `stream`: the last coin this far behind the
 *  first), followers as one mark with its fading echo. `k` scales the stream (the rewind plays at half time). */
const bundleTrail = (a, k = 1) => (!a.bundle ? { trail: 0 } : a.stream && a.n > 1 ? { trail: a.n - 1, trailGap: (a.stream * k) / (a.n - 1), full: true } : { trail: 2, trailGap: MO.bundleTrail });
const square = (r, size) => ({ left: r.left + r.width / 2 - size / 2, top: r.top + r.height / 2 - size / 2, width: size, height: size });
const onFinish = (anim, fn) => {
  const epoch = chain.epoch || 0;
  const done = () => { if ((chain.epoch || 0) === epoch) fn(); };
  if (anim && anim.finished) anim.finished.then(done, done); else done();
};

/**
 * When the shop's new card may be dealt, in ms from this state's commit: after a recruited card has left its slot and
 * the row has slid (grammar B4), so two cards never share a slot. 0 when nothing was bought from the shop.
 */
export function dealAfter(state) {
  const fx = state && Array.isArray(state.effects) ? state.effects : null;
  // a whole fresh row (New Faces): the new cards deal once the old row has gone to the deck (playChain, grammar B4)
  const outs = fx ? fx.filter(e => e.type === 'shop-out').length : 0;
  if (outs) return rowOutMs(outs);
  const rec = fx && fx.find(e => e.type === 'recruit' && e.from && e.from.kind === 'shop');
  if (!rec) return 0;
  const paid = fx.filter(e => e.type === 'pay' && e.cause === rec.cause).reduce((t, e) => t + Math.min(3, e.what.n), 0);
  return Math.round(MO.cardLift + Math.max(0, paid - 1) * MO.pieceStagger + flightMs(TYPICAL) * (2 / 3) + MO.shopSlide);
}

/**
 * The shop cards leaving the row for the bottom of the deck in this step, oldest row order: a sweep (New Faces, an
 * effect each) or a new round's fresh row (Cory, 2026-10-20: "the member shop should refresh each round, and you should
 * see it happen"; the round's start shares the closing move's number, so it's read off the two rows).
 */
export function shopOuts(before, state) {
  if (!before || !state || before === state || !Array.isArray(before.shop) || !Array.isArray(state.shop)) return [];
  if (state.moves === before.moves + 1 && Array.isArray(state.effects)) return state.effects.filter(e => e.type === 'shop-out').map(e => e.what.uid);
  if (state.round > before.round && before.round >= 1 && state.moves === before.moves) return before.shop.filter(u => !state.shop.includes(u));
  return [];
}
/** How long n cards take to leave the row for the deck before the new ones may deal (each starts a stagger after the
 *  last; the deal begins as the last is halfway there, so the deck is never still between the two). */
/** The members a new round shuffled into the deck (core.js startRound: state.joined), or 0. */
export const joinedNow = (before, state) => (state && before && state.round > before.round && state.joined && state.joined.round === state.round ? state.joined.uids.length : 0);
const SHUFFLE_BACKS = 5; // at most this many card backs fly in; the tag says how many joined
// quicker than a deal: it's a beat in the round change, not a wait (Cory: "we don't want to gunk up between rounds")
const shuffleBeats = () => ({ fly: Math.round(MO.deal * 0.75), gap: Math.round(MO.dealStagger * 0.8), riffle: Math.round(MO.shopSlide * 0.8) });
/** How long the shuffle-in plays: the backs fly in to the deck, then it riffles (Cory, 2026-10-25). */
export function shuffleInMs(n) { if (!(n > 0)) return 0; const b = shuffleBeats(); return b.fly + (Math.min(n, SHUFFLE_BACKS) - 1) * b.gap + b.riffle; }
/**
 * Round II and III members join the deck (Cory, 2026-10-25: "animation for the deck getting shuffled into the member
 * deck … only happens twice a game, so it's meaningful", without gunking up the round change): after the old row has
 * gone to the deck, a small stack of card backs flies from the wheel's hub into the deck, the deck riffles, and
 * "+N round II" rises over it. Bookkeeping like the row: never holds the chain; a skip lands it.
 */
function shuffleIn(root, n, round, delay) {
  if (!n || typeof document === 'undefined') return;
  const deck = root.querySelector('[data-deck]');
  const back = deck && (deck.querySelector('.back') || deck);
  const pile = deck && (deck.querySelector('.pile') || deck);
  if (!back) return;
  const D = back.getBoundingClientRect();
  if (!D.width) return;
  const hub = hubRect ? hubRect() : null;
  const from = hub && hub.width ? { x: hub.left + hub.width / 2, y: hub.top + hub.height / 2 } : { x: D.left + D.width / 2, y: D.top - 120 };
  const { fly, gap, riffle } = shuffleBeats(), k = Math.min(n, SHUFFLE_BACKS);
  for (let i = 0; i < k; i++) {
    const g = back.cloneNode(true);
    g.className = 'flight deck-join ghost-layer';
    g.setAttribute('aria-hidden', 'true');
    for (const x of g.querySelectorAll('.n')) x.remove(); // a card back, not the count
    g.dataset.born = String(Date.now());
    Object.assign(g.style, { left: `${D.left}px`, top: `${D.top}px`, width: `${D.width}px`, height: `${D.height}px` });
    document.body.appendChild(g);
    const dx = from.x - (D.left + D.width / 2), dy = from.y - (D.top + D.height / 2), tilt = (i % 2 ? 1 : -1) * (4 + i * 2);
    const anim = track(g.animate([
      { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.7) rotate(${tilt * 2}deg)`, opacity: 0 },
      { transform: `translate(${(dx * 0.6).toFixed(1)}px,${(dy * 0.6).toFixed(1)}px) scale(.85) rotate(${tilt}deg)`, opacity: 1, offset: 0.3 },
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0.92 },
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 0 },
    ], { duration: fly, delay: delay + i * gap, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' }));
    onFinish(anim, () => g.remove());
  }
  const landed = delay + fly + (k - 1) * gap;
  // the deck riffles as they're shuffled in: a quick left-right split and back
  if (pile && pile.animate) track(pile.animate([
    { transform: 'translateX(0) rotate(0deg)' }, { transform: 'translateX(-4px) rotate(-5deg)', offset: 0.25 },
    { transform: 'translateX(4px) rotate(5deg)', offset: 0.55 }, { transform: 'translateX(0) rotate(0deg)' },
  ], { duration: riffle, delay: landed, easing: 'ease-in-out' }));
  const tag = document.createElement('b');
  tag.className = 'deck-join-tag ghost-layer';
  tag.dataset.born = String(Date.now());
  tag.textContent = `+${n} round ${roman(round)}`;
  Object.assign(tag.style, { left: `${Math.round(D.left + D.width / 2)}px`, top: `${Math.round(D.top - 4)}px` });
  document.body.appendChild(tag);
  const life = riffle + slowed(900);
  const t = track(tag.animate([
    { transform: 'translate(-50%,-30%)', opacity: 0 }, { transform: 'translate(-50%,-100%)', opacity: 1, offset: 0.15 },
    { transform: 'translate(-50%,-100%)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-140%)', opacity: 0 },
  ], { duration: life, delay: landed - Math.round(fly / 3), fill: 'both', easing: 'ease-out' }));
  onFinish(t, () => tag.remove());
  if (typeof window !== 'undefined') window.__patronsShuffles = (window.__patronsShuffles || 0) + 1;
}

export function rowOutMs(n) { return n > 0 ? Math.round(MO.shopSlide / 2 + (n - 1) * MO.rowOutStagger) : 0; }

// the new row's deal animations at a new round (MemberDeck.jsx useDeal notes them; playChain times them)
const roundDeals = [];
/** useDeal's deal of a new round's row: `anim` (the picture flying off the deck), `hide` (the real card waiting). */
export function noteRoundDeal(anim, hide) { if (anim && hide && anim.effect && hide.effect) roundDeals.push({ anim, hide }); }

// ---------- undo (H24): the move's motion, backwards ----------
// Undo restores the state at once (session/local.js); what moved plays back the way it came, at twice the speed: pieces
// fly back to where they came from, your minion returns to its column, a bought card to its slot. Nothing counts, rings
// or sounds again (the numbers are already the restored ones), and it never holds the table: no chain runs.
const REWIND = 0.5;
const rewind = { timers: [], anims: [] };
/** Whether going from `before` to `state` takes a step back (an undo): the same round, fewer moves. */
export const isUndo = (before, state) => !!before && !!state && before.round === state.round && typeof before.moves === 'number' && state.moves < before.moves;
function clearRewind() {
  rewind.timers.forEach(clearTimeout);
  rewind.timers = [];
  const a = rewind.anims;
  rewind.anims = [];
  for (const x of a) { try { x.finish(); } catch { /* gone */ } }
}
/** The rewind of a move's plan (`fwd`, as planChain made it from the restored state to the undone one): its pieces,
 *  minions and bought cards, each reversed in time and direction, at REWIND of the time. Pure. */
export function rewindPlan(fwd) {
  const T = fwd.total || 0, atoms = [];
  const back = (at, d) => Math.round(Math.max(0, T - at - d) * REWIND);
  for (const a of fwd.atoms || []) {
    if (a.op === 'piece') {
      const d = a.dur || 0;
      atoms.push({ op: 'piece', at: back(a.at + (a.stream || 0), d), dur: Math.max(1, Math.round(d * REWIND)), from: a.to, to: a.from, n: a.n, r: a.r, owner: a.owner, fol: !!a.fol, bundle: !!a.bundle, ...(a.stream ? { stream: a.stream } : {}) });
    } else if (a.op === 'minion') {
      atoms.push({ op: 'minion', at: back(a.at, a.dur || 0), dur: Math.max(1, Math.round((a.dur || 0) * REWIND)), pid: a.pid, key: a.key });
    } else if (a.op === 'card') {
      const whole = (a.lift || 0) + (a.toHub || 0) + (a.show || 0) + (a.fromHub || 0);
      const d = Math.round(((a.toHub || 0) + (a.fromHub || 0)) * REWIND);
      atoms.push({ op: 'card', at: back(a.at, whole), dur: Math.max(1, d), uid: a.uid, pid: a.to });
    }
  }
  atoms.sort((x, y) => x.at - y.at);
  const total = atoms.reduce((m, a) => Math.max(m, a.at + a.dur), 0);
  return { atoms, total, handoff: 0, rewind: true };
}
function playRewind(root, before, state, mine) {
  // undone during the move's own motion: that motion lands at once (silently), and the rewind starts from its end
  if (chainRunning()) skipChain();
  clearRewind();
  const ctx = { state, before, snap: null, chips: null };
  const where = w => (w && w.kind !== 'stage' ? placeEl(root, w, ctx) : null);
  const measure = (a, b) => { const A = where(a), B = where(b); if (!A || !B) return TYPICAL; const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect(); return Math.hypot(rb.left + rb.width / 2 - ra.left - ra.width / 2, rb.top + rb.height / 2 - ra.top - ra.height / 2); };
  const plan = rewindPlan(planChain(state, before, { mine, measure }));
  if (!plan.atoms.length || !motionOK()) return plan;
  const keep = x => { if (x) rewind.anims.push(x); return x; }; // (flyPath tracks its own; the rest are tracked here)
  const hideUntil = (el, ms) => { if (el && el.animate) keep(track(el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: ms + 30 }))); };
  const run = a => {
    switch (a.op) {
      case 'piece': {
        const A = where(a.from), B = where(a.to);
        if (!A || !B) return;
        const size = a.fol ? 18 : 16;
        const pid = a.from.kind === 'stack' || a.from.kind === 'count' ? a.from.pid : a.to.pid;
        const html = a.fol ? folHtml(root, pid) : dotHtml(root, a.r, a.owner ?? pid);
        keep(flyPath(html, `piece-flight piece-${a.fol ? 'fol' : 'res'} rewind`, square(A.getBoundingClientRect(), size), square(B.getBoundingClientRect(), size), { path: 'arc', duration: a.dur, ...bundleTrail(a, REWIND), fade: true }));
        return;
      }
      case 'minion': {
        const slot = root.querySelector(`[data-slot="${a.key}"]`);
        const col = [...root.querySelectorAll(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions [data-minion]`)];
        const home = col[col.length - 1] || root.querySelector(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions`);
        if (!slot || !home) return;
        const F = (slot.querySelector('.base') || slot).getBoundingClientRect(), H = home.getBoundingClientRect();
        const size = Math.max(16, H.width || 18);
        const html = col.length ? home.innerHTML : `<i style="background:${playerColor(a.pid)}"></i>`;
        if (col.length) hideUntil(home, a.dur);
        keep(flyPath(html, 'worker-flight minion-flight rewind', square(F, size), square(H, size), { path: 'arc', duration: a.dur }));
        return;
      }
      case 'card': {
        const card = root.querySelector(`.lt-shop .card[data-uid="${a.uid}"], .shop .card[data-uid="${a.uid}"]`);
        const crowd = placeEl(root, { kind: 'crowd', pid: a.pid }, ctx);
        if (!card || !crowd || !card.animate) return;
        const C = card.getBoundingClientRect(), W = crowd.getBoundingClientRect();
        if (!C.width) return;
        const g = document.createElement('div');
        g.className = 'flight card-flight ghost-layer rewind';
        g.dataset.born = String(Date.now());
        g.innerHTML = card.outerHTML;
        Object.assign(g.style, { left: `${C.left}px`, top: `${C.top}px`, width: `${C.width}px`, height: `${C.height}px` });
        document.body.appendChild(g);
        const dx = W.left + W.width / 2 - (C.left + C.width / 2), dy = W.top + W.height / 2 - (C.top + C.height / 2);
        const bow = onScreenBow(W, C, Math.max(16, Math.min(70, Math.hypot(dx, dy) * 0.18)));
        // from the buyer's crowd (small) back into its slot (full size): the forward flight, run backwards
        const frames = arcFrames(-dx, -dy, bow, { s0: 0.3, s1: 1, ease: CARD_EASE }).map(f => ({ ...f, transform: f.transform.replace(/translate\(([-\d.]+)px,([-\d.]+)px\)/, (m, x, y) => `translate(${(dx + Number(x)).toFixed(1)}px,${(dy + Number(y)).toFixed(1)}px)`) }));
        const anim = keep(track(g.animate(frames, { duration: a.dur, fill: 'forwards' })));
        keep(track(g.animate([{ opacity: 0.5 }, { opacity: 1, offset: 0.4 }, { opacity: 1 }], { duration: a.dur, fill: 'forwards' })));
        const done = () => g.remove();
        anim.addEventListener('finish', done);
        anim.addEventListener('cancel', done);
        safetyNet(anim, a.dur, 500, done);
        hideUntil(card, a.dur);
        return;
      }
      default:
    }
  };
  for (const a of plan.atoms) {
    // a card going back hides its slot from the start, so the row never shows it twice
    if (a.op === 'card' && a.at > 0) { const card = root.querySelector(`.lt-shop .card[data-uid="${a.uid}"], .shop .card[data-uid="${a.uid}"]`); hideUntil(card, a.at); }
    if (a.at <= 0) run(a); else rewind.timers.push(setTimeout(() => run(a), a.at));
  }
  return plan;
}

/** (kept for callers: a placed minion's slot is read when its chain plays) */
export const noteTable = root => { void root; };

/**
 * Play the chain for a change of state on the table under `root`. `snap` is the shop as it was (snapshotShop),
 * `minionsBefore` the wheel's minions as they were (snapshotMinions), `mine` the viewer's seats. Returns the plan.
 * A chain may start while the last one's tail is still landing (the same player's next step shows at its handoff).
 */
export function playChain(root, before, state, { snap = null, minionsBefore = null, homeFlownAt = null, mine = [], chips = null } = {}) {
  // the new row's deal, noted by useDeal in this same commit (it lays out first): this chain says when it starts
  const deals = roundDeals.splice(0);
  if (!root || before === state) return { atoms: [], total: 0, handoff: 0 };
  // an undo (H24): the table is already back; the move's own motion plays backwards over it, quickly, effects not again
  if (isUndo(before, state)) return playRewind(root, before, state, mine);
  clearRewind();
  const ctx = { state, before, snap, chips };
  if (chain.draining) cancelDrain(); // an externally delivered step adopts any explicit motion still finishing
  const chainId = (chain.n = (chain.n || 0) + 1);
  // read everything first; every write waits for the clock's next frame (before it paints): a write here made the
  // next layout effect lay the whole page out again
  const found = new Map(), rects = new Map();
  const where = w => { if (!w) return null; if (w.kind === 'stage') return placeEl(root, w, ctx); const k = JSON.stringify(w); if (!found.has(k)) found.set(k, placeEl(root, w, ctx)); return found.get(k); };
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
    // a recruit's new chip, too: a beat before it (Walk-In's red) must not show the member already home
    if (a.op === 'card') {
      const C = where({ kind: 'crowd', pid: a.to, uid: a.uid });
      if (C && !C.rectOnly && C.animate && C.dataset && (C.dataset.uids || '').split(' ').includes(String(a.uid))) track(C.animate([{ opacity: 0 }, { opacity: 0, offset: 0.98 }, { opacity: 1 }], { duration: Math.max(0, base - chain.clock) + a.at + a.lift + a.toHub + a.show + a.fromHub }));
      continue;
    }
    if (a.op !== 'chip' || !a.hide) continue;
    const B = where(a.to);
    // a member going back to the shop: its card there waits, unseen, until the member lands on it
    if (a.to.kind === 'shop' && B && !B.rectOnly && B.animate && B.dataset && B.dataset.uid === String(a.uid)) { track(B.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: Math.max(0, base - chain.clock) + a.at + a.dur + 30 })); continue; }
    if (B && !B.rectOnly && B.animate && B.dataset && B.dataset.uids === String(a.uid)) track(B.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: Math.max(0, base - chain.clock) + a.at + a.dur + 30 }));
  }
  // an extra minion (planChain's spare): its new minion in the seat's row waits, unseen, for the spare one to land, and
  // the pool keeps standing the spare ones until each leaves (MinionPool already shows the new count)
  const pool = root.querySelector('.lt-pool .pool-men'), poolSrc = root.querySelector('.lt-pool .pool-src');
  for (const a of plan.atoms) {
    if (a.op !== 'spare') continue;
    const row = [...root.querySelectorAll(`.lt-cult-seat[data-seat="${a.pid}"] .cs-minions .cs-min:not(.placed)`)];
    a.el = row[row.length - a.n + a.k] || null;
    a.toEl = a.el || where({ kind: 'minions', pid: a.pid });
    a.fromEl = where(a.from);
    if (a.el && a.el.animate) track(a.el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: Math.max(0, base - chain.clock) + a.at + a.dur + 30 }));
    if (a.from.kind === 'pool' && pool && poolSrc) {
      const i = document.createElement('i');
      i.className = 'pool-min held';
      i.setAttribute('aria-hidden', 'true');
      i.innerHTML = poolSrc.innerHTML;
      pool.appendChild(i);
      a.held = i;
    }
  }
  // every place a beat will use, found now with the other reads (a lookup at beat time laid the page out mid-chain);
  // a turn's chain (no round end: no re-sort, no going home, no fresh row) leaves seats and piles standing, so their
  // rects are read now too. Stage items and the shop move: those stay live.
  const still = !plan.atoms.some(a => a.op === 'sort' || a.op === 'home' || a.op === 'refill');
  const pre = new Map();
  for (const a of plan.atoms) {
    if (!['pulse', 'point', 'hop', 'tug', 'piece', 'chip', 'stage'].includes(a.op)) continue;
    for (const w of [a.from, a.to, a.place, a.toward]) if (w && typeof w === 'object' && w.kind) where(w);
    if (!still) continue;
    if (a.op === 'tug' && a.n && a.r) { const el = where(a.place); if (el && !el.rectOnly) pre.set(a, { tag: rectOf(el) }); }
    if (a.op === 'stage' && a.kind !== 'space' && a.place) {
      const el = where(a.place), seatEl = root.querySelector(`.lt-cult-seat[data-seat="${a.place.pid}"]`);
      pre.set(a, { from: el && !el.rectOnly ? rectOf(el) : null, seat: seatEl ? rectOf(seatEl) : null });
    }
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
      // (a stream's count rolls while its coins land: over the stream, at least the usual roll)
      const rollMs = Math.max(MO.roll, a.stream || 0);
      if (h) { if (a.bundle && !skip) h.roll(a.by ?? a.n, rollMs); else h.step(a.by ?? a.n); }
      if (a.bundle && !skip) setTimeout(() => release(B), rollMs); else release(B);
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
        case 'spare': {
          const held = a.held;
          const F = held && held.isConnected ? held.getBoundingClientRect() : (a.fromEl ? a.fromEl.getBoundingClientRect() : null);
          if (held) held.remove();
          if (skip || !F || !a.toEl) return;
          const T = a.toEl.getBoundingClientRect(), size = Math.max(16, a.el ? T.width : 18);
          const src = a.from.kind === 'pool' ? root.querySelector('.lt-pool .pool-src') : null;
          const html = src ? src.innerHTML : a.el ? a.el.innerHTML : '';
          if (!html) return;
          chain.flying++;
          const anim = flyPath(html, 'worker-flight minion-flight spare-flight', square(F, size), square(T, size), { path: 'arc', duration: a.dur });
          onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); if (a.el) settle(a.el, MO.settle); play('place'); });
          return;
        }
        // (homeFlownAt: they already left when the round card's button was pressed; only their seats' columns wait here)
        case 'home': if (!skip && minionsBefore) flyMinionsHome(root, minionsBefore, { flownAt: homeFlownAt }); return;
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
        case 'stage': if (!skip) stageOut(root, a, ctx, where, chainId, mine, pre.get(a)); return;
        case 'tug': {
          if (skip) return;
          const el = where(a.place), toward = where(a.toward);
          // (the pile's rect is read before the tug writes: measured up front, or here first)
          const tagR = a.n && a.r && el && !el.rectOnly ? (pre.get(a) || {}).tag || el.getBoundingClientRect() : null;
          tug(el, toward, a.dur);
          // what's taken says so on the victim's pile the moment it's taken: "−2 ●", gone as the handful lands
          if (tagR) takeTag(el, a.n, dotHtml(root, a.r, a.owner), tagR);
          return;
        }
        case 'card': {
          // the recruited card (Cory, 2026-10-18): a picture of it lifts in its old slot with the bought ring, then
          // flies to the hub, where it opens as the member's card (who, what it does) and is read; then it flies on to
          // its new chip in the buyer's crowd, which lands with its ring and sound
          // a member taken off the top of the deck (Red's round I space) was never face up: its card back leaves the deck
          const sn = (snap && snap.get(a.uid)) || (a.from && a.from.kind === 'pile' ? deckSnap(root) : null);
          if (skip || !sn || !sn.rect) return;
          // (the reads first: the chip and the hub, then the ghost goes in)
          const chip = root.querySelector(`.lt-seat[data-pid="${a.to}"] [data-uids~="${a.uid}"]`) || placeEl(root, { kind: 'crowd', pid: a.to }, ctx);
          const hub = hubRect(HUB_MEMBER) || sn.rect;
          const g = document.createElement('div');
          g.className = 'flight card-flight ghost-layer';
          g.dataset.born = String(Date.now());
          g.innerHTML = sn.html;
          Object.assign(g.style, { left: `${sn.rect.left}px`, top: `${sn.rect.top}px`, width: `${sn.rect.width}px`, height: `${sn.rect.height}px`, borderRadius: 'var(--corner, 8px)' });
          document.body.appendChild(g);
          if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
          const dx = hub.left + hub.width / 2 - (sn.rect.left + sn.rect.width / 2), dy = hub.top + hub.height / 2 - (sn.rect.top + sn.rect.height / 2);
          const total = a.lift + a.toHub, k1 = a.lift / total;
          chain.flying++;
          // lift, then a true arc to the hub, fading as the member's card opens out of it there
          const bow = onScreenBow(sn.rect, hub, Math.max(16, Math.min(70, Math.hypot(dx, dy) * 0.18)));
          const path = [
            { transform: 'translate(0px,0px) scale(1)', offset: 0, easing: 'ease-out' },
            { transform: 'translate(0px,-10px) scale(1.06)', offset: k1 },
            ...arcFrames(dx, dy, bow, { from: k1, s0: 1.06, s1: 1.2, y0: -10, ease: CARD_EASE }),
          ];
          const anim = track(g.animate(path, { duration: total, fill: 'forwards' }));
          track(g.animate([{ opacity: 1 }, { opacity: 1, offset: k1 + (1 - k1) * 0.55 }, { opacity: 0 }], { duration: total, fill: 'forwards' }));
          // the bought card says so before it leaves (H13): a warm ring comes up as it lifts and lets go as it flies. The
          // ring is its own empty box riding the same path: a shadow animated on the card itself repainted the whole
          // card (its words, its portrait) every frame of the lift. The ring's shadow is drawn once; only its opacity moves
          const ring = document.createElement('div');
          ring.className = 'flight card-ring ghost-layer';
          ring.dataset.born = g.dataset.born;
          Object.assign(ring.style, { left: g.style.left, top: g.style.top, width: g.style.width, height: g.style.height, borderRadius: 'var(--corner, 8px)',
            boxShadow: '0 0 0 3px rgba(255,222,160,.9), 0 0 18px 3px rgba(255,200,120,.55)', opacity: '0' });
          g.before(ring);
          track(ring.animate(path, { duration: total, fill: 'forwards' }));
          onFinish(anim, () => ring.remove());
          track(ring.animate([
            { opacity: 0, offset: 0 },
            { opacity: 1, offset: k1 },
            { opacity: 0, offset: Math.min(0.99, k1 + (1 - k1) * 0.4) },
            { opacity: 0, offset: 1 },
          ], { duration: total, fill: 'forwards' }));
          slideShop(root, snap);
          const id = `recruit:${a.uid}`;
          const ep = chain.epoch || 0;
          // the member's card opens at the hub as the picture arrives
          schedule(base + a.at + a.lift + Math.round(a.toHub * 0.45), sk => {
            if (sk || (chain.epoch || 0) !== ep) return;
            const look = memberLook(ctx.state, a.uid);
            if (!look) return;
            stageShow({ id, chain: chainId, kind: 'member', recruit: true, uid: a.uid, pid: a.to, who: mine.length === 1 && mine[0] === a.to ? 'You' : (ctx.state.players[a.to] || {}).name, size: HUB_MEMBER, at: hub, from: g.getBoundingClientRect(), homeEl: chip && !chip.rectOnly ? chip : null, dur: Math.round(a.toHub * 0.55), ...look, got: '',
              onHome: () => { play('member'); if (chip && chip.animate && chip.isConnected && !region(chip)) relative(chip, [{ boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }, { boxShadow: '0 0 0 4px rgba(236,230,214,.55), 0 0 14px rgba(236,230,214,.5)', transform: 'scale(1.1)', offset: 0.35 }, { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' }], { duration: MO.ring, easing: 'ease-out' }); } });
          });
          // read, then on to the buyer
          schedule(base + a.at + total + a.show, sk => { if (!sk) stageLeave(id, a.fromHub); });
          onFinish(anim, () => { g.remove(); chain.flying = Math.max(0, chain.flying - 1); });
          return;
        }
        case 'chip': {
          if (skip) return;
          // a member that left its crowd flies from where its chip stood, as itself (its portrait)
          const was = chips && chips.get(a.uid);
          const A = was && a.from.kind === 'crowd' ? { getBoundingClientRect: () => was.rect } : where(a.from), B = where(a.to);
          if (!A || !B) return;
          chain.flying++;
          // a member coming off the shop (a swap with the shop, a free recruit) flies as its portrait from the card it was
          // (the animation audit: it flew as a blank square)
          const fig = was && was.html ? was.html : a.from.kind === 'shop' ? shopFig(ctx.snap, a.uid) : '';
          let pic = fig ? `<span class="piece-member-pic">${fig}</span>` : '<i class="piece-dot member"></i>';
          const hub = a.via != null ? stageRect('hub') : null;
          // Both members meet side by side at the actual hub, then cross to their new seats.
          const R = hub ? { ...hub, left: hub.left + hub.width / 2 - 26 + (a.swap ? (a.via === 1 ? 34 : -34) : 0), top: hub.top + hub.height / 2 - 26, width: 52, height: 52 } : null;
          if (R) { let nm = ''; try { nm = defById(ctx.state.cards[a.uid].def).name; } catch { /* unnamed */ } if (nm) pic += `<b class="pm-name">${nm.replace(/[<&]/g, '')}</b>`; }
          if (R) {
            // out of its old chair onto the stage, a beat there, then on to its new chair
            const leg1 = Math.round(MO.stageIn), hold = Math.round(MO.stageHold / 2), leg2 = Math.max(120, a.dur - leg1 - hold);
            const big = square(R, 52);
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
                const two = aim(flyPath(pic, 'piece-flight piece-member staged', big, square(rectOf(B), 52), { path: a.path === 'cross' ? 'cross' : 'arc', duration: leg2, fade: true }), B);
                onFinish(two, () => { chain.flying = Math.max(0, chain.flying - 1); settle(B, MO.settle); });
              }, hold);
            });
            return;
          }
          const anim = aim(flyPath(pic, 'piece-flight piece-member', square(rectOf(A), 28), square(rectOf(B), 28), { path: a.path, duration: a.dur, fade: true }), B);
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
          const anim = aim(flyPath(html, `piece-flight piece-${a.fol ? 'fol' : 'res'}${a.pay ? ' pay' : ''}`, square(rectOf(A), size), square(rectOf(B), size),
            { path: a.pay ? 'drop' : a.take ? 'line' : 'arc', duration: a.dur, label: a.bundle ? `+${a.n}` : '', ...bundleTrail(a), turnTo: a.turn ? dotHtml(root, a.turn, pid) : null, fade: true }), B);
          onFinish(anim, () => { chain.flying = Math.max(0, chain.flying - 1); land({ ...a, by: a.n }, B, false); });
          return;
        }
        default:
      }
    });
  }
  // a whole fresh row (New Faces, motion gaps A47: "blanks all 10 cards at once, then refills"; a new round's refresh,
  // Cory 2026-10-20): the old row goes to the bottom of the deck, left to right, each card from where it stood,
  // shrinking into the deck as it arrives; the new row deals off the top after it (dealAfter, useDeal). Bookkeeping: it
  // never holds the chain, and a skip lands it.
  const outs = snap ? shopOuts(before, state) : [];
  // a new round's fresh row is its own last beat (planChain's refill): the old row leaves then, and the new deals after
  const refill = plan.atoms.find(a => a.op === 'refill');
  const refillOff = refill ? Math.max(0, base + refill.at - chain.clock) : 0;
  const joinN = refill ? joinedNow(before, state) : 0, joinMs = shuffleInMs(joinN);
  if (joinN) shuffleIn(root, joinN, state.round, refillOff + rowOutMs(outs.length));
  for (const d of deals) {
    try {
      if (refillOff || joinMs) {
        d.anim.effect.updateTiming({ delay: (d.anim.effect.getTiming().delay || 0) + refillOff + joinMs });
        d.hide.effect.updateTiming({ duration: Number(d.hide.effect.getTiming().duration) + refillOff + joinMs });
      }
      track(d.anim); track(d.hide); // a skip deals them at once
    } catch { /* gone */ }
  }
  if (outs.length) {
    const deckEl = root.querySelector('[data-deck] .back') || root.querySelector('[data-deck]');
    const D = deckEl ? deckEl.getBoundingClientRect() : null;
    const cards = outs.map(u => snap.get(u)).filter(sn => sn && sn.rect && sn.html).sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
    cards.forEach((sn, k) => {
      const g = document.createElement('div');
      g.className = 'flight shop-out ghost-layer';
      g.dataset.born = String(Date.now());
      g.innerHTML = sn.html;
      Object.assign(g.style, { left: `${sn.rect.left}px`, top: `${sn.rect.top}px`, width: `${sn.rect.width}px`, height: `${sn.rect.height}px` });
      document.body.appendChild(g);
      const delay = refillOff + k * MO.rowOutStagger;
      const frames = D && D.width
        ? (() => {
          const dx = D.left + D.width / 2 - (sn.rect.left + sn.rect.width / 2), dy = D.top + D.height / 2 - (sn.rect.top + sn.rect.height / 2);
          const sc = Math.max(0.2, Math.min(1, D.width / sn.rect.width));
          return [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${(dx * 0.85).toFixed(1)}px,${(dy * 0.85).toFixed(1)}px) scale(${(sc * 1.1).toFixed(3)})`, opacity: 1, offset: 0.8 },
            { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`, opacity: 0 }];
        })()
        : [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(12px)', opacity: 0 }];
      const anim = track(g.animate(frames, { duration: D && D.width ? MO.shopSlide : MO.rowOut, delay, easing: 'cubic-bezier(.45,0,.4,1)', fill: 'both' }));
      onFinish(anim, () => g.remove());
    });
  }
  // the stage holds a moment after this chain's own end, then flies home, even when the next chain follows at once
  // (a blind tester, w5: "a recruited Stylist parked over the wheel centre … into the next player's turn")
  if (plan.atoms.some(a => a.op === 'stage')) schedule(base + plan.total, skip => { if (!skip) stageRelease(MO.stageHold, chainId); });
  // what each seat's follower count just did stays readable beside it for a while (panel r3: "P2 went 16→38 and only
  // the strip said why"): "+22" under the count, never over it, gone before long
  const fdelta = new Map();
  for (const a of plan.atoms) if (a.op === 'land' && a.fol && a.to.kind === 'count') fdelta.set(a.to.pid, (fdelta.get(a.to.pid) || 0) + (a.pay ? -a.by : a.by));
  for (const a of plan.atoms) if (a.op === 'land' && a.fol && a.pay && a.to.kind !== 'count' && a.from && a.from.kind === 'count') fdelta.set(a.from.pid, (fdelta.get(a.from.pid) || 0) - a.by);
  if ([...fdelta.values()].some(Boolean)) schedule(base + plan.total, () => {
    // every count read, then every delta written (one layout, not one per seat)
    const at = [];
    for (const [pid, n] of fdelta) if (n) { const el = where({ kind: 'count', pid }); if (el && !el.rectOnly) at.push([el, n, el.getBoundingClientRect()]); }
    for (const [el, n, r] of at) linger(el, n, r);
  });
  // what starts at once plays now, before this commit's first paint (the lifted card, the hidden chip, your minion's
  // stamp): never a frame of the end state first
  while (chain.queue.length && chain.queue[0].at <= chain.clock) chain.queue.shift().fn(false);
  run();
  if (typeof window !== 'undefined') { window.__patronsChains = (window.__patronsChains || 0) + 1; window.__patronsChainMs = plan.total; }
  return plan;
}

/** "−2 ●" over a victim's pile as it's taken from (stage.css .take-tag). */
function takeTag(el, n, dot, r = el && !el.rectOnly ? el.getBoundingClientRect() : null) {
  if (!el || el.rectOnly || !r || typeof document === 'undefined') return;
  if (!r.width) return;
  const b = document.createElement('b');
  b.className = 'take-tag ghost-layer';
  b.dataset.born = String(Date.now());
  b.innerHTML = `−${n}${dot}`;
  Object.assign(b.style, { left: `${Math.round(r.left + r.width / 2)}px`, top: `${Math.round(r.top - 2)}px` });
  const life = MO.tug + flightMs(300) + MO.settle;
  b.style.setProperty('--tl', `${life}ms`);
  document.body.appendChild(b);
  setTimeout(() => b.remove(), life + 50);
}

/** A space or member flies out of its place onto the stage (stage.js; ActionStage.jsx draws it). */
// a seat's follower change, lingering under its count
const lingering = new Map();
function linger(el, n, r = el && !el.rectOnly ? el.getBoundingClientRect() : null) {
  if (!el || el.rectOnly || !r || typeof document === 'undefined') return;
  if (!r.width) return;
  const was = lingering.get(el);
  if (was) { clearTimeout(was.t); was.b.remove(); n += was.n; }
  if (!n) { lingering.delete(el); return; }
  const b = document.createElement('b');
  b.className = `seat-delta ${n > 0 ? 'up' : 'down'}`;
  b.textContent = `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
  Object.assign(b.style, { left: `${Math.round(r.right)}px`, top: `${Math.round(r.bottom + 1)}px` });
  b.style.setProperty('--ld', `${MO.lingerDelta}ms`);
  document.body.appendChild(b);
  const t = setTimeout(() => { b.remove(); lingering.delete(el); }, MO.lingerDelta);
  lingering.set(el, { b, n, t });
}

/** The deck's top card as a picture to fly (its back, the cult mark on it), where it sits, as snapshotShop gives a shop card. */
function deckSnap(root) {
  const back = root && root.querySelector('.lt-deck .back');
  if (!back) return null;
  const r = back.getBoundingClientRect();
  if (!r.width) return null;
  const mark = back.querySelector('.cult-mark');
  const html = `<div class="lt-deck" style="width:calc(100% + 6px);height:calc(100% + 6px);flex:none"><span class="back">${mark ? mark.outerHTML : ''}</span></div>`;
  return { html, rect: { left: r.left, top: r.top, width: r.width, height: r.height } };
}
/** How a member shows on the stage: its name, picture, sphere colour and rule. */
/** A shop card's portrait as it stood (the shop snapshot's picture), for a member flying off the shop as itself. */
function shopFig(snap, uid) {
  const sn = snap && snap.get(uid);
  if (!sn || !sn.html || typeof document === 'undefined') return '';
  const t = document.createElement('template');
  t.innerHTML = sn.html;
  const fig = t.content.querySelector('.art svg, .art img');
  return fig ? fig.outerHTML : '';
}
function memberLook(st, uid, def0 = null) {
  const card = st.cards && st.cards[uid];
  let d = null;
  try { d = defById(card ? card.def : def0); } catch { d = null; }
  if (!d) return null;
  let sphere = 'colorless', color = 'var(--colorless)';
  try { if (st.quadrants.includes(d.quadrant)) { sphere = quadrant(d.quadrant).resource; color = `var(--${d.quadrant})`; } } catch { /* colorless */ }
  return { name: d.name, sprite: [d.id, spriteId(d.name)], sphere, color, text: d.text || '' };
}

function stageOut(root, a, ctx, where, chainId, mine = [], pre = null) {
  const st = ctx.state;
  const el = where(a.place);
  // (a member's chip and seat were measured up front on a turn's chain; a space on the wheel is read now)
  const from = pre && pre.from ? pre.from : el && !el.rectOnly ? el.getBoundingClientRect() : null;
  if (a.kind === 'space') {
    const key = a.place.key;
    const [q, i] = String(key).split('-').map(Number);
    const qid = st.quadrants[q];
    let said = null;
    try { said = panelText(qid, quadrant(qid).actions[i], Math.max(1, st.round)); } catch { return; }
    const pid = a.pid ?? (st.slots && st.slots[key]);
    const p = st.players[pid];
    const slot = a.slot || 'card';
    const at = stagePlace(slot, spaceRect(from, slot));
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
  // its bubble pops out of the right side of its seat, level with its chip (Cory, 2026-10-18)
  const seatEl = root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const seatR = pre && pre.seat ? pre.seat : seatEl ? seatEl.getBoundingClientRect() : null;
  const k = stageItems().filter(it => it.kind === 'member' && !it.leaving && !it.recruit && it.pid === pid && it.chain === chainId).length;
  const at = seatR && seatR.width ? stagePlace(a.spot, bubbleRect(seatR, from, k)) : stageRect(a.spot);
  if (!at) return;
  let sphere = 'colorless', color = 'var(--colorless)';
  try { if (st.quadrants.includes(d.quadrant)) { sphere = quadrant(d.quadrant).resource; color = `var(--${d.quadrant})`; } } catch { /* colorless */ }
  stageShow({ id: `member:${pid}:${uid}`, chain: chainId, kind: 'member', uid, pid, at, from, homeEl: el && !el.rectOnly ? el : null, dur: a.dur, color, pc: playerColor(pid),
    name: d.name, sprite: [d.id, spriteId(d.name)], sphere, text: d.text || '', got: a.got || '' });
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
    // everything has landed and only the settle is left (your choices light at the landing): a press on a choice is
    // your move, not a skip; the settle finishes under it (smooth panel, animation.md #4: the skip's cleanup cost every
    // first click of your turn a whole-table render before the move)
    if (!chain.queue.length && !chain.flying && chain.draining && t && t.closest && t.closest('[data-option]')) return;
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
