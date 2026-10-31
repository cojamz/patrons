// The director's plan, measured without a screen: play whole bot games with effect streams and read planChain's
// timings per move, per turn, and the wait between P1's turns (the grammar's hard targets H2–H4, H7–H10).
//   npx esbuild design/prototypes/motion/plan-probe.mjs --bundle --platform=node --format=esm --jsx=automatic --loader:.js=jsx --packages=external --outfile=/tmp/plan.bundle.mjs
//   node /tmp/plan.bundle.mjs [speed=steady] [games=6] [verbose=0]   (env RFLOOR=600: the bot floor on hand-off steps)
import { createGame, applyMove, chooseBotMove } from '/home/user/patrons/src/engine/v4/index.js';
import { seededRandom } from '/home/user/patrons/src/engine/v4/rng.js';
import { planChain } from '/home/user/patrons/src/v4/game/director.js';
import { setMotionSpeed } from '/home/user/patrons/src/v4/motion.js';

const [speed = 'steady', gamesArg = '6', verbose = '0', seedBase = '11'] = process.argv.slice(2);
setMotionSpeed(speed);
const q = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const turns = [], waits = [], mine = [], chains = [], byCause = new Map();
for (let g = 0; g < Number(gamesArg); g++) {
  const seed = Number(seedBase) + g;
  const seats = [{ name: 'P1', kind: 'bot' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  const rand = seededRandom(seed);
  let cur = null; // the turn being timed: { pid, ms, kinds }
  let waitStart = null, waitMs = 0;
  for (let n = 0; n < 4000 && !s.over; n++) {
    const pend = s.pending;
    const actor = pend ? pend.player : null;
    const mv = chooseBotMove(s, rand);
    const next = applyMove(s, mv, { effects: true });
    if (s.round < 1) { s = next; continue; }
    const plan = planChain(s, next, { mine: [0] });
    const sameNext = !!(next.pending && pend && next.pending.player === pend.player);
    const PASS = { quick: 150, steady: 300, relaxed: 500 }[speed];
    const ms = process.env.OLD ? (plan.total || (actor !== 0 ? 600 : 0)) : plan.total ? (sameNext ? Math.max(plan.handoff ?? plan.total, actor !== 0 ? Number(process.env.RFLOOR ?? 600) : 0) : plan.total) : (actor !== 0 ? (sameNext ? 0 : PASS) : 0);
    const kinds = [...new Set((next.effects || []).map(e => e.cause && e.cause.kind))].join(',');
    chains.push({ ms, actor, kind: pend && pend.kind, kinds, atoms: plan.atoms.length });
    const ck = `${pend && pend.kind}`;
    if (!byCause.has(ck)) byCause.set(ck, []);
    byCause.get(ck).push(ms);
    if ((verbose === '1' && ms > 2600) || (verbose === 'pay' && pend && pend.kind === 'pay' && actor !== 0 && Math.random() < 0.04) || (verbose === 'place' && pend && pend.kind === 'place' && actor !== 0 && Math.random() < 0.03)) console.log('long chain', ms, 'actor', actor, pend && pend.kind, kinds, plan.atoms.map(a => `${a.at}:${a.op}${a.dur ? '(' + a.dur + ')' : ''}${a.n ? 'x' + a.n : ''}${a.bundle ? 'B' : ''}`).join(' '));
    // turns: consecutive moves by one actor within a round (a placement, its choices, its buy)
    if (!cur || cur.pid !== actor || cur.round !== s.round || (pend && pend.kind === 'place')) {
      if (cur) (cur.pid === 0 ? mine : turns).push(cur.ms);
      cur = { pid: actor, ms: 0, round: s.round };
    }
    cur.ms += ms;
    // the wait between P1's turns: the rivals' turns' chains in between
    if (actor === 0) { if (waitStart != null && waitMs > 0) waits.push(waitMs); waitStart = null; waitMs = 0; }
    else { if (waitStart == null) waitStart = n; waitMs += ms; }
    s = next;
  }
  if (cur) (cur.pid === 0 ? mine : turns).push(cur.ms);
}
const row = (name, xs) => console.log(`${name.padEnd(34)} n=${String(xs.length).padStart(4)}  p50=${String(q(xs, 0.5)).padStart(5)}  p95=${String(q(xs, 0.95)).padStart(5)}  max=${String(Math.max(...xs)).padStart(5)}`);
console.log(`speed=${speed} games=${gamesArg} (plan only: planChain at 450px typical distances, P1 as "mine")`);
row('a rival turn (sum of its chains)', turns.filter(x => x > 0));
row('P1 turn (sum of its chains)', mine.filter(x => x > 0));
row('wait between P1 turns (rivals)', waits);
for (const [k, xs] of byCause) row(`chain: ${k}`, xs.filter(x => x > 0));
