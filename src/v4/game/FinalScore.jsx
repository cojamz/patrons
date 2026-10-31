// The end-game scoring on the results' cults (Cory, 2026-10-15: "a clear animation for players that shows scoring
// coming from followers, scoring from members ... a little +x popping over their head for the number of people in the
// member, and another little round of pop ups for other followers that the member gives, à la Recluse"; taste rule 11).
// Every seat in step, each total counting up from 0 as its pops land:
//   1. followers: the leader and every loose follower (bought, prizes, won in play) pop "+x" over the leader's head
//   2. members: each member figure pops "+x" for its people (its follower value), one figure after the next (no mark:
//      over a figure, "+1" reads as its one person, and the narrower pop keeps clear of its neighbour's)
//   3. grants: a member that scores at game end (Mob, Tycoon, Recluse…) pops what it grants over its head
// then the winner's seat lights. Every number is the engine's (finalScore.js scoreSteps adds up to followers()).
// A click anywhere, Space or Escape lands it all at once; nothing waits on it (Play again works throughout).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { followers } from '../../engine/v4/index.js';
import { finalWinners } from '../format.js';
import { Follower } from '../art/Follower.jsx';
import { motionOK } from './flight.js';
import { MO } from '../motion.js';
import { scoreSteps, BEATS } from './finalScore.js';
import Tick from './Tick.jsx';

/** Where a step pops on a seat: the member's figure (its group), the "+N more" chip if it's folded, else the leader. */
function targetOf(seat, step) {
  if (step.uid != null) {
    const fig = [...seat.querySelectorAll('.cs-member[data-uids]')].find(e => e.dataset.uids.split(' ').includes(String(step.uid)));
    if (fig) return { key: `m${fig.dataset.uids}`, el: fig.querySelector('.fig') || fig };
    const more = seat.querySelector('.cs-more');
    if (more) return { key: 'more', el: more };
  }
  return { key: 'leader', el: seat.querySelector('.cs-leader') || seat };
}

/**
 * The pops, in time order: [{ at, pid, beat, n, key, uids }]. One pop per figure per beat (a "×2" figure pops its sum),
 * seats in step: the k-th pop of every seat's beat lands together, a fan apart.
 */
const BEAT_STEPS = 5; // the most step-gaps one beat takes, however many figures pop in it
export function plan(state, order, seatEl) {
  const lead = MO.scoreLead, fan = MO.scoreFan, step = MO.scoreStep, gap = MO.scoreBeat;
  const out = [];
  let t = lead;
  for (const beat of BEATS) {
    const rows = order.map(pid => {
      const seat = seatEl(pid);
      const pops = [];
      for (const s of scoreSteps(state, state.players[pid]).filter(x => x.beat === beat)) {
        const tg = seat ? targetOf(seat, s) : { key: s.uid == null ? 'leader' : `u${s.uid}` };
        const last = pops[pops.length - 1];
        if (last && last.key === tg.key) { last.n += s.n; last.uids.push(s.uid); continue; }
        pops.push({ pid, beat, n: s.n, key: tg.key, uids: [s.uid] });
      }
      return pops;
    });
    const len = Math.max(0, ...rows.map(r => r.length));
    if (!len) continue;
    // a long row of figures quickens so no beat outlasts five steps (21 members read as one wave, not a 4s roll call)
    // (the seat-to-seat fan shrinks with it, so the k-th pops of every seat still land before anyone's next one)
    const each = len > 1 ? Math.min(step, (BEAT_STEPS * step) / (len - 1)) : step;
    const fanned = fan * (each / step);
    for (let k = 0; k < len; k++) rows.forEach((r, i) => { if (r[k]) out.push({ ...r[k], at: Math.round(t + k * each + i * fanned) }); });
    t += Math.round((len - 1) * each + (order.length - 1) * fanned) + gap;
  }
  return out;
}

export default function FinalScore({ state, me, hover, onPick, CultSeat, children, animate = true }) {
  const order = state.ranking || state.players.map(p => p.id);
  const winners = finalWinners(state);
  const box = useRef(null);
  const [run, setRun] = useState(() => (animate && motionOK() ? 'lead' : 'done'));
  const [sums, setSums] = useState(() => Object.fromEntries(order.map(pid => [pid, 0])));
  const [pops, setPops] = useState([]); // on screen now: { id, pid, beat, n, x, y }
  const timers = useRef([]);
  const finish = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPops([]);
    setRun('done');
  };
  useLayoutEffect(() => {
    if (run !== 'lead') return undefined;
    const root = box.current;
    const seatEl = pid => root && root.querySelector(`.over-seat[data-pid="${pid}"]`);
    const all = plan(state, order, seatEl);
    let id = 0;
    const life = MO.scorePop;
    for (const p of all) {
      timers.current.push(setTimeout(() => {
        const seat = seatEl(p.pid);
        let x = 0, y = 0;
        if (seat) {
          const s = seat.getBoundingClientRect();
          const tg = targetOf(seat, { uid: p.uids[0] });
          const r = tg.el.getBoundingClientRect();
          x = Math.round(r.left + r.width / 2 - s.left);
          y = Math.round(r.top - s.top);
        }
        const pop = { life, id: ++id, pid: p.pid, beat: p.beat, n: p.n, x, y, uids: p.uids.filter(u => u != null).join(' ') };
        setPops(ps => [...ps, pop]);
        setSums(m => ({ ...m, [p.pid]: m[p.pid] + p.n }));
        timers.current.push(setTimeout(() => setPops(ps => ps.filter(q => q.id !== pop.id)), life));
      }, p.at));
    }
    const end = all.length ? all[all.length - 1].at + MO.scoreBeat : 0;
    timers.current.push(setTimeout(() => setRun('done'), end));
    setRun('on');
    return undefined;
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // a click anywhere, Space or Escape lands the rest at once (a button's own click still does its job)
  useEffect(() => {
    if (run === 'done') return undefined;
    const down = () => finish();
    const key = e => { if (e.key === ' ' || e.key === 'Escape') finish(); };
    addEventListener('pointerdown', down, true);
    addEventListener('keydown', key, true);
    return () => { removeEventListener('pointerdown', down, true); removeEventListener('keydown', key, true); };
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const done = run === 'done';
  return (
    <div className="side over-cults" aria-label="The cults at the end" ref={box} data-scored={done ? 'done' : 'on'}>
      {order.map((pid, k) => {
        const won = done && winners.includes(pid); // the rule: most followers, members break a tie (lit once it's counted)
        const total = done ? followers(state, state.players[pid]) : sums[pid];
        return (
          <div key={pid} className={`over-seat${won ? ' won' : ''}`} data-pid={pid} data-final={followers(state, state.players[pid])}>
            <span className="rank num" aria-hidden="true">{k + 1}</span>
            <CultSeat state={state} pid={pid} me={me} mine={pid === me} now={won} hover={hover} onPick={onPick} total={done ? null : total} />
            <b className="final num" title="Followers at the end"><Tick value={total} from={done ? total : 0} color="var(--cream)" float={false} /></b>
            {pops.filter(p => p.pid === pid).map(p => (
              <span key={p.id} className={`fs-pop ${p.beat}${p.n < 0 ? ' down' : ''}`} style={{ left: p.x, top: p.y, animationDuration: `${p.life}ms` }} aria-hidden="true"
                data-score-pop={`${p.pid}:${p.beat}:${p.n}`} data-uids={p.uids || undefined}>
                {p.n < 0 ? '−' : '+'}{Math.abs(p.n)}{p.beat !== 'members' && <Follower size={11} title="followers" />}
              </span>
            ))}
          </div>
        );
      })}
      {children}
    </div>
  );
}
