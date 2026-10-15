// The Reckoning (Cory, 2026-10-14: "a little animation showing which cult wins each round prize"; 2026-10-15: "way too
// fast and confusing"). At round end the quadrants pay one at a time, slow enough to follow (~2.9s each): the lamp
// moves to that quadrant's rim plaque and the caption says what is counted; each player's count ticks up beside their
// leader; then the caption names the winner, their count pulses, and "+N" followers arc from the plaque to the
// winner's total, which climbs as it lands (not before: the chairs leave every unpaid prize out, GameScreen
// seatState). Ties pay every tied leader; "no one scores" passes quickly. A tap anywhere, Skip, Space, Enter or
// Escape goes straight to the summary.
// Every number is the engine's: the contests as scored (state.contests via scoredStandings), or the contest table on
// the scoring snapshot for an old save.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { scoredStandings, standings, playerColor } from '../format.js';
import { playerAnchor, motionOK, flyToken } from './flight.js';
import Tick from './Tick.jsx';

export const STEP_MS = 2900;   // one quadrant with a winner: the count, the verdict, the prize's flight, the climb
export const QUIET_MS = 1700;  // one where no one scores
export const VERDICT_MS = 1000; // the counts have ticked up: the caption names the winner
export const FLY_MS = 900;     // the prize's flight from the rim plaque to the winner's total

/** The round's contests as scored: [{ qid, rule, prize, rows:[{ id, shown }], winners:[ids] }]. */
export function reckonRows(info) {
  const { result, after, board } = info;
  const roundNo = ['I', 'II', 'III'].indexOf(result.round) + 1;
  const scored = scoredStandings(after, roundNo);
  const base = scored || standings(board || after).map(st => ({ ...st, leaders: result.rows.find(r => r.qid === st.qid)?.winners || [] }));
  return base.map(st => ({ qid: st.qid, rule: st.rule, counts: st.counts || null, tiebreak: st.tiebreak || null, prize: st.prize ?? result.rows.find(r => r.qid === st.qid)?.v ?? 0, rows: st.rows, winners: st.leaders || [] }));
}

export default function Reckoning({ info, root, onDone, onLamp, onPaid, meId = null }) {
  const rows = useRef(reckonRows(info)).current;
  const [step, setStep] = useState(0); // which quadrant is paying (rows.length = finished)
  const [beat, setBeat] = useState(0); // within it: 0 counting, 1 the verdict (the prize in the air), 2 landed
  const [spots, setSpots] = useState({}); // pid -> { left, top } of that player's chair, for the count chips
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onLamp && onLamp(null); onDone(); } };
  const reduced = !motionOK();

  // where each chair is, so a count can sit beside it
  useLayoutEffect(() => {
    if (!root) return;
    const out = {};
    for (const p of info.after.players) {
      // beside the chair, in the gap between the column and the wheel (the column of chairs, laptop), else beside
      // the leader; never over the chair's own name or numbers
      const seat = root.querySelector(`.lt > .lt-seat[data-pid="${p.id}"]`);
      const sr = seat && seat.getBoundingClientRect();
      if (sr && sr.width && root.querySelector('.lt > .lt-snake')) { out[p.id] = { left: sr.right + 8, top: sr.top + 24 }; continue; }
      const a = playerAnchor(root, p.id);
      if (!a) continue;
      const r = a.getBoundingClientRect();
      out[p.id] = { left: r.right + 6, top: r.top + r.height / 2 };
    }
    setSpots(out);
  }, [root, info]);

  // one quadrant at a time: light its plaque and count, name the winner, fly the prize, and only then pay the total
  useEffect(() => {
    if (step >= rows.length) { const t = setTimeout(finish, reduced ? 0 : 400); return () => clearTimeout(t); }
    const row = rows[step];
    setBeat(0);
    if (onLamp) onLamp(row.qid);
    if (typeof window !== 'undefined') window.__patronsReckon = (window.__patronsReckon || 0) + 1;
    const won = row.winners.length > 0;
    const at = reduced ? { verdict: 0, fly: 0, land: 0, next: 60 } : { verdict: VERDICT_MS, fly: VERDICT_MS + 200, land: VERDICT_MS + 200 + FLY_MS - 60, next: won ? STEP_MS : QUIET_MS };
    const timers = [setTimeout(() => setBeat(1), at.verdict)];
    if (won) timers.push(setTimeout(() => {
      if (!root) return;
      const plaque = root.querySelector(`[data-plaque="${row.qid}"]`);
      for (const id of row.winners) {
        // the prize lands on the number it raises: the winner's total on their chair
        const home = root.querySelector(`.lt-seat[data-pid="${id}"] .cs-total`) || playerAnchor(root, id);
        if (plaque && home) flyToken(plaque, home, `<b class="reckon-token" style="--pc:${playerColor(id)}">+${row.prize}</b>`, { tag: 'reckon', duration: FLY_MS });
      }
    }, at.fly));
    // the prize reaches the chairs' totals as it lands
    timers.push(setTimeout(() => { if (onPaid) onPaid(step + 1); setBeat(2); }, at.land));
    timers.push(setTimeout(() => setStep(s => s + 1), at.next));
    return () => timers.forEach(clearTimeout);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = e => { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); finish(); } };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const row = rows[Math.min(step, rows.length - 1)];
  const name = id => (id === meId ? 'You' : info.after.players[id].name);
  const fol = n => `${n} follower${n === 1 ? '' : 's'}`;
  // the verdict, once the counts are up: who wins what
  const verdict = !row ? '' : !row.winners.length ? 'no one scores'
    : row.winners.length > 1 ? `${row.winners.map(name).join(' and ')} tie: +${fol(row.prize)} each`
    : `${name(row.winners[0])} ${row.winners[0] === meId ? 'win' : 'wins'} +${fol(row.prize)}`;
  const shownBeat = step < rows.length ? beat : 2;
  return (
    <div className="lt-reckon" role="dialog" aria-modal="true" aria-label={`Round ${info.result.round} reckoning`} data-reckon={row ? row.qid : ''} onClick={finish}>
      <div className="reckon-head" style={{ '--c': row ? `var(--${row.qid})` : undefined }} aria-live="polite">
        <small>Round {info.result.round} scoring · {Math.min(step + 1, rows.length)} of {rows.length}</small>
        {row && <b className="reckon-rule">{row.rule}</b>}
        {row && row.counts && <span className="reckon-counts">Counts {row.counts}{row.tiebreak && row.tiebreak.text ? `; ${row.tiebreak.text}` : ''}.</span>}
        <b data-reckon-head className={`reckon-verdict${shownBeat ? ' on' : ''}${row && !row.winners.length ? ' none' : ''}`}>{shownBeat ? verdict : 'counting…'}</b>
        <span className="reckon-dots" aria-hidden="true">{rows.map((r, k) => <i key={r.qid} className={k < step ? 'done' : k === step ? 'on' : ''} style={{ '--c': `var(--${r.qid})` }} />)}</span>
      </div>
      {row && step < rows.length && row.rows.map(r => {
        const at = spots[r.id];
        if (!at) return null;
        const won = shownBeat > 0 && row.winners.includes(r.id);
        return (
          <span key={`${row.qid}-${r.id}`} className={`reckon-count${won ? ' won' : ''}`} data-reckon-count={r.id} style={{ left: at.left, top: at.top, '--pc': playerColor(r.id), '--c': `var(--${row.qid})` }}>
            <Tick value={r.shown} from={0} className="num" float={false} dur={reduced ? 0 : 700} />
          </span>
        );
      })}
      <button type="button" className="btn ghost reckon-skip" data-reckon-skip onClick={e => { e.stopPropagation(); finish(); }}>Skip</button>
    </div>
  );
}
