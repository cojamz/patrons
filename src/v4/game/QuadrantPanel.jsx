// The quadrant facing you: its scoring rule and its action cards, by ring.
import { useEffect, useRef, useState, useCallback } from 'react';
import { quadrant, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, roman, standings } from '../format.js';
import { Popover } from './parts.jsx';

export default function QuadrantPanel({ state, facing, onFacing, optionFor, onPick, onDenied, meId = null, confirmPlace = false }) {
  const [pop, setPop] = useState(null); // touch: { el, key, a, opt }
  const pointer = useRef('mouse');
  const close = useCallback(() => setPop(null), []);
  useEffect(() => { setPop(null); }, [state, facing]);
  const qid = state.quadrants[facing];
  const Q = quadrant(qid);
  const round = Math.max(1, state.round);
  const col = `var(--${qid})`;
  const tabs = useRef(null);
  const standing = state.round >= 1 && !state.over ? standings(state)[facing] : null;

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
        <span><b>{Q.scoring.label}</b> at round end wins <b className="num">+{RING_VALUE[round - 1]}</b> this round <small className="num">({RING_VALUE.map(v => `+${v}`).join(' / ')} by round; ties all score)</small></span>
        {standing && standing.top > 0 ? (
          <span className="lead-line">
            Now: {standing.rows.slice(0, 4).map((r, k) => (
              <span key={r.id} className={standing.leaders.includes(r.id) ? 'leads' : ''} style={{ '--pc': playerColor(r.id) }}>
                {k ? ' · ' : ''}<i />{r.id === meId ? 'you' : state.players[r.id].name} <b className="num">{r.shown}</b>
              </span>
            ))}
          </span>
        ) : state.round >= 1 && <span className="lead-line">Now: nobody has any yet.</span>}
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
                  key={i} type="button" className={cls} aria-disabled={!opt} title={`${a.name}: ${a.text}`}
                  data-option={opt ? opt.id : undefined}
                  onPointerDown={e => { pointer.current = e.pointerType || 'mouse'; }}
                  onClick={e => {
                    if (opt && (pointer.current === 'touch' || confirmPlace)) { setPop({ el: e.currentTarget, key, a, opt: opt.id }); return; }
                    if (opt) onPick(opt.id); else if (onDenied) onDenied({ type: 'slot', key, q: facing, i }, e.currentTarget);
                  }}
                >
                  <span className="act-line"><b>{a.name}</b><span className="act-text">{a.text}</span></span>
                  {owner !== undefined && <i className="who" style={{ background: playerColor(owner) }} title={`Taken by ${state.players[owner].name}`} aria-label={`taken by ${state.players[owner].name}`} />}
                  {locked && <em className="lockt">round {roman(t)}</em>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {pop && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-card" style={{ '--c': col }}>
            <b>{pop.a.name}</b>
            <span>{pop.a.text}</span>
            <button type="button" className="btn pri" data-autofocus data-place={pop.opt} onClick={() => { const id = pop.opt; setPop(null); onPick(id); }}>Place here</button>
          </div>
        </Popover>
      )}
    </section>
  );
}
