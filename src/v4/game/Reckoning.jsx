// The Reckoning (Cory, 2026-10-14: "a little animation showing which cult wins each round prize"). At round end the
// quadrants pay one at a time (~1.2s each): the lamp moves to that quadrant's rim plaque, each player's count ticks up
// beside their chair, the winner's chair pulses and "+N" followers arc from the plaque to the winner's leader; ties
// pay every tied leader; "no one scores" dims the plaque. A tap (or Skip, or Enter) goes straight to the summary.
// Every number is the engine's: the contests as scored (state.contests via scoredStandings), or the contest table on
// the scoring snapshot for an old save.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { scoredStandings, standings, playerColor } from '../format.js';
import { playerAnchor, motionOK, flyToken } from './flight.js';
import Tick from './Tick.jsx';

export const STEP_MS = 1250;

/** The round's contests as scored: [{ qid, rule, prize, rows:[{ id, shown }], winners:[ids] }]. */
export function reckonRows(info) {
  const { result, after, board } = info;
  const roundNo = ['I', 'II', 'III'].indexOf(result.round) + 1;
  const scored = scoredStandings(after, roundNo);
  const base = scored || standings(board || after).map(st => ({ ...st, leaders: result.rows.find(r => r.qid === st.qid)?.winners || [] }));
  return base.map(st => ({ qid: st.qid, rule: st.rule, prize: st.prize ?? result.rows.find(r => r.qid === st.qid)?.v ?? 0, rows: st.rows, winners: st.leaders || [] }));
}

export default function Reckoning({ info, root, onDone, onLamp, meId = null }) {
  const rows = useRef(reckonRows(info)).current;
  const [step, setStep] = useState(0); // which quadrant is paying (rows.length = finished)
  const [spots, setSpots] = useState({}); // pid -> { left, top } of that player's chair, for the count chips
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onLamp && onLamp(null); onDone(); } };
  const reduced = !motionOK();

  // where each chair is, so a count can sit beside it
  useLayoutEffect(() => {
    if (!root) return;
    const out = {};
    for (const p of info.after.players) {
      const a = playerAnchor(root, p.id);
      if (!a) continue;
      const r = a.getBoundingClientRect();
      out[p.id] = { left: r.right + 6, top: r.top + r.height / 2 }; // beside the leader, never over it
    }
    setSpots(out);
  }, [root, info]);

  // one quadrant at a time: light its plaque, then pay its winners
  useEffect(() => {
    if (step >= rows.length) { const t = setTimeout(finish, reduced ? 0 : 350); return () => clearTimeout(t); }
    const row = rows[step];
    if (onLamp) onLamp(row.qid);
    if (typeof window !== 'undefined') window.__patronsReckon = (window.__patronsReckon || 0) + 1;
    const pay = setTimeout(() => {
      if (!root) return;
      const plaque = root.querySelector(`[data-plaque="${row.qid}"]`);
      for (const id of row.winners) {
        const home = playerAnchor(root, id);
        if (plaque && home) flyToken(plaque, home, `<b class="reckon-token" style="--pc:${playerColor(id)}">+${row.prize}</b>`, { tag: 'reckon' });
      }
    }, reduced ? 0 : 620);
    const next = setTimeout(() => setStep(s => s + 1), reduced ? 60 : STEP_MS);
    return () => { clearTimeout(pay); clearTimeout(next); };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = e => { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); finish(); } };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const row = rows[Math.min(step, rows.length - 1)];
  const name = id => (id === meId ? 'You' : info.after.players[id].name);
  const head = row
    ? row.winners.length
      ? `${row.rule}: ${row.winners.map(name).join(' & ')} ${row.winners.length > 1 ? 'tie' : row.winners[0] === meId ? 'win' : 'wins'} +${row.prize}`
      : `${row.rule}: no one scores`
    : '';
  return (
    <div className="lt-reckon" role="dialog" aria-modal="true" aria-label={`Round ${info.result.round} reckoning`} data-reckon={row ? row.qid : ''} onClick={finish}>
      <div className="reckon-head" style={{ '--c': row ? `var(--${row.qid})` : undefined }} aria-live="polite">
        <small>Round {info.result.round} · the reckoning</small>
        <b data-reckon-head>{head}</b>
        <span className="reckon-dots" aria-hidden="true">{rows.map((r, k) => <i key={r.qid} className={k < step ? 'done' : k === step ? 'on' : ''} style={{ '--c': `var(--${r.qid})` }} />)}</span>
      </div>
      {row && step < rows.length && row.rows.map(r => {
        const at = spots[r.id];
        if (!at) return null;
        const won = row.winners.includes(r.id);
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
