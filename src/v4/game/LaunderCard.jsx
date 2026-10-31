// Launderers (Cory, 2026-10-29: "should let me rearrange colors as i please, not all to one color"). A paper card in the
// pay sheet's grammar: one row per color with − and +, the count between them, and how many are still loose. The
// total never changes: − lifts one off a color, + puts a loose one on. "All" under a color puts everything there.
// Done sends the engine's own steps for that mix (benders.js: one color for all, keep, or the split chain asking "how
// many <color>?" color by color), one after another as each question comes back, so a reload mid-way picks up the
// same plan. Keep my colors keeps them.
import { useEffect, useMemo, useState } from 'react';
import { useDialog, TurnOf } from './parts.jsx';
import { ResourceGlyph } from './Glyphs.jsx';
import './pay.css';
import './launder.css';

// the mix being sent, kept outside the card so a re-render between two steps never loses it: { key, mix, done }
let run = null;
const keyOf = (state, pend) => `${pend.player}|${state.round}`;
const isLaunder = pend => !!(pend && pend.kind === 'choose' && /^[^:]+: (pick a color for all \d+, or split them|how many \w+\? \()/.test(String(pend.prompt || '')));

/**
 * Does the Launderers card answer this choice: its first question, or a "how many <color>?" step of a mix the card is
 * sending. A split step with no mix behind it (a reload mid-way) stays the plain question, so it can still be answered.
 */
export const launderChoice = (state, pend) => isLaunder(pend)
  && (pend.options.some(o => o.id === 'split') || (!!run && run.key === keyOf(state, pend) && pend.options.some(o => o.kind === 'amount')));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

/** The engine's option for the mix at this step, or null. */
export function launderStep(state, pend, mix) {
  const p = state.players[pend.player];
  const has = id => pend.options.find(o => o.id === id);
  if (pend.options.some(o => o.id === 'split')) {
    const total = sum(p.res);
    if (state.resources.every(c => (mix[c] || 0) === (p.res[c] || 0))) return has('keep');
    const one = state.resources.find(c => (mix[c] || 0) === total);
    return (one && has(`color:${one}`)) || has('split');
  }
  const c = (String(pend.prompt).match(/how many (\w+)\?/) || [])[1];
  return c == null ? null : has(`amount:${mix[c] || 0}`);
}

export default function LaunderCard({ state, onPick, busy, turnOf = null }) {
  const pend = state.pending;
  const p = state.players[pend.player];
  const colors = state.resources;
  const key = keyOf(state, pend);
  const total = sum(p.res);
  const sending = !!(run && run.key === key);
  const [mix, setMix] = useState(() => (sending ? { ...run.mix } : Object.fromEntries(colors.map(c => [c, p.res[c] || 0]))));
  const loose = total - sum(mix);
  const box = useDialog(null);

  // the next step of a mix already sent, a beat after each question comes back
  useEffect(() => {
    if (!run || run.key !== key || run.done === pend || busy) return undefined;
    const t = setTimeout(() => {
      if (!run || run.key !== key || run.done === pend) return;
      const o = launderStep(state, pend, run.mix);
      if (!o) { run = null; return; }
      run.done = pend;
      onPick(o.id, 'automatic');
    }, 120);
    return () => clearTimeout(t);
  }, [pend, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  // the card closes when the steps are done (or the table moves on): a mix half sent is left to the plain question
  useEffect(() => () => { if (run && run.key === key) run = null; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = m => {
    if (busy || sending) return;
    const o = launderStep(state, pend, m);
    if (!o) return;
    run = { key, mix: { ...m }, done: pend };
    if (o.id === 'keep' || o.id.startsWith('color:')) run = null;
    onPick(o.id, 'automatic');
  };
  const keepIt = () => send(Object.fromEntries(colors.map(c => [c, p.res[c] || 0])));
  const set = (c, n) => setMix(m => ({ ...m, [c]: n }));
  const shown = useMemo(() => colors.map(c => ({ c, n: mix[c] || 0, was: p.res[c] || 0 })), [colors, mix, p.res]);
  const locked = busy || sending;

  return (
    <div className="overlay sheet pay-overlay launder-overlay" role="dialog" aria-modal="true" aria-label="Launderers: rearrange your resources">
      <div className="dialog pay pay-card launder-card" ref={box}
        onKeyDown={e => { if (e.key === 'Enter' && !loose && !e.target.closest('.ld-keep')) { e.preventDefault(); send(mix); } }}>
        {turnOf && <TurnOf player={turnOf} />}
        <h2 className="ld-title">{String(pend?.prompt || 'Launderers:').split(':')[0]}</h2>
        <p className="ld-sub">Rearrange your <b className="num">{total}</b> resources into any mix of colors.</p>
        <div className="ld-rows" role="group" aria-label="Your colors">
          {shown.map(({ c, n, was }) => (
            <div key={c} className="ld-row" data-launder={c} data-n={n}>
              <ResourceGlyph r={c} size={24} />
              <span className="ld-name">{c}</span>
              <button type="button" className="ld-step" data-step="-" disabled={locked || n === 0} aria-label={`One less ${c}`} onClick={() => set(c, n - 1)}>−</button>
              <b className="ld-n num" aria-live="polite">{n}</b>
              <button type="button" className="ld-step" data-step="+" disabled={locked || loose === 0} aria-label={`One more ${c}`} onClick={() => set(c, n + 1)}>+</button>
              <button type="button" className="ld-all" disabled={locked || n === total} aria-label={`All ${total} ${c}`}
                onClick={() => setMix(Object.fromEntries(colors.map(x => [x, x === c ? total : 0])))}>All</button>
              <small className="ld-was" data-moved={n !== was || undefined}>{n === was ? '' : `was ${was}`}</small>
            </div>
          ))}
        </div>
        <p className="ld-loose" data-loose={loose} role="status">{loose ? <><b className="num">{loose}</b> still to place: press + on a color.</> : ' '}</p>
        <div className="pay-foot">
          <button type="button" className="pay-cancel ld-keep" disabled={locked} onClick={keepIt}>Keep my colors</button>
          <button type="button" className="pay-go" data-autofocus data-launder-done disabled={locked || loose > 0} onClick={() => send(mix)}>Done</button>
        </div>
      </div>
    </div>
  );
}
