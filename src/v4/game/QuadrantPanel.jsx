// The quadrant facing you: its scoring rule and its action cards, by ring.
import { useEffect, useRef } from 'react';
import { quadrant, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, roman } from '../format.js';

export default function QuadrantPanel({ state, facing, onFacing, optionFor, onPick, onDenied }) {
  const qid = state.quadrants[facing];
  const Q = quadrant(qid);
  const round = Math.max(1, state.round);
  const col = `var(--${qid})`;
  const tabs = useRef(null);

  // Tabs are one control: focus follows the selected tab (arrow keys, or the wheel turning under it).
  useEffect(() => {
    const el = tabs.current;
    if (el && el.contains(document.activeElement)) {
      const on = el.querySelector('.qtab.on');
      if (on && on !== document.activeElement) on.focus({ preventScroll: true });
    }
  }, [facing]);
  const onTabKey = e => {
    const n = state.quadrants.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); onFacing((facing + 1) % n); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onFacing((facing + n - 1) % n); }
  };

  return (
    <section className="panel quad" style={{ '--c': col }}>
      <div className="qtabs" role="tablist" aria-label="Quadrants" ref={tabs} onKeyDown={onTabKey} hidden={state.round === 0}>
        {state.quadrants.map((id, q) => {
          const free = state.pending && state.pending.kind === 'place'
            ? quadrant(id).actions.some((a, i) => optionFor(`slot:${q}-${i}`)) : false;
          return (
            <button
              key={id} type="button" role="tab" aria-selected={q === facing} tabIndex={q === facing ? 0 : -1}
              className={`qtab${q === facing ? ' on' : ''}${free ? ' open' : ''}`} style={{ '--c': `var(--${id})` }}
              onClick={() => onFacing(q)} aria-label={`${quadrant(id).name}${free ? ', has open spaces for you' : ''}`}
            >{quadrant(id).name}</button>
          );
        })}
      </div>
      <h2 style={{ color: col }}>{Q.name}<small>facing you</small></h2>
      <div className="score">
        <b>Round end:</b> {Q.scoring.label.toLowerCase()} takes the ring’s followers ({RING_VALUE.map(v => `+${v}`).join(' / ')}). Ties all score.
      </div>
      {[1, 2, 3].map(t => (
        <div key={t} className="ringrow">
          <div className="tier">Round {roman(t)}{t > round ? ' · opens later' : ''}</div>
          <div className="acts">
            {Q.actions.map((a, i) => {
              if (a.ring !== t) return null;
              const key = `${facing}-${i}`;
              const owner = state.slots[key];
              const opt = optionFor(`slot:${key}`);
              const locked = t > round;
              const cls = ['act', opt ? 'can' : '', owner !== undefined ? 'taken' : '', locked ? 'locked' : ''].join(' ');
              return (
                <button
                  key={i} type="button" className={cls} aria-disabled={!opt}
                  data-option={opt ? opt.id : undefined}
                  onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'slot', key, q: facing, i }, e.currentTarget))}
                >
                  <b>{a.name}</b><span>{a.text}</span>
                  {owner !== undefined && (
                    <em className="by" style={{ '--pc': playerColor(owner) }}><i />Taken by {state.players[owner].name}</em>
                  )}
                  {locked && <em className="by lockt">Opens in round {roman(t)}</em>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
