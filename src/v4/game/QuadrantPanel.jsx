// The quadrant facing you: its scoring rule and its action cards, by ring.
import { useEffect, useRef, useState, useCallback } from 'react';
import { quadrant, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, roman, standings, shortLabel, tiebreakNote } from '../format.js';
import { ContestTip } from './Info.jsx';
import { Popover } from './parts.jsx';
import { Rich, CostPips } from './Rich.jsx';

export default function QuadrantPanel({ state, facing, onFacing, optionFor, onPick, onDenied, meId = null, confirmPlace = false, onPeek }) {
  const [pop, setPop] = useState(null); // touch: { el, key, a, opt }
  // Collapsible to a one-line summary (remembered); short screens start collapsed.
  // Until you choose, it follows the window: short laptop screens start folded so the shop stays in view.
  const autoFold = () => false; // the action list stays visible at every height (it scrolls); folding is your choice
  const [chosen, setChosen] = useState(() => { try { const v = localStorage.getItem('patrons.v4.quadFolded'); return v == null ? null : v === '1'; } catch { return null; } });
  const [auto, setAuto] = useState(autoFold);
  useEffect(() => {
    const onResize = () => setAuto(autoFold());
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, []);
  const folded = chosen ?? auto;
  const fold = v => { setChosen(v); try { localStorage.setItem('patrons.v4.quadFolded', v ? '1' : '0'); } catch { /* ignore */ } };
  const pointer = useRef('mouse');
  const close = useCallback(() => setPop(null), []);
  useEffect(() => { setPop(null); }, [state, facing]);
  const qid = state.quadrants[facing];
  const Q = quadrant(qid);
  const round = Math.max(1, state.round);
  const col = `var(--${qid})`;
  const tabs = useRef(null);
  const standing = state.round >= 1 && !state.over ? standings(state)[facing] : null;
  const openCount = Q.actions.filter((a, i) => (optionFor(`slot:${facing}-${i}`) || optionFor(`squat:${facing}-${i}`))).length;

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
    <section className={`panel quad${folded ? ' folded' : ''}`} style={{ '--c': col }}>
      <div className="quad-head">
      <h2 style={{ color: col }}>
        <button type="button" className="fold" aria-expanded={!folded} onClick={() => fold(!folded)} aria-label={folded ? `Show ${Q.name}'s actions` : `Collapse ${Q.name}`}>{folded ? '▸' : '▾'}</button>
        {Q.name}<small>facing you</small>
      </h2>
      <div className="qtabs" role="tablist" aria-label="Quadrants" ref={tabs} onKeyDown={onTabKey} hidden={state.round === 0}>
        {state.quadrants.map((id, q) => {
          const free = state.pending && state.pending.kind === 'place'
            ? quadrant(id).actions.some((a, i) => (optionFor(`slot:${q}-${i}`) || optionFor(`squat:${q}-${i}`))) : false;
          return (
            <button
              key={id} type="button" role="tab" aria-selected={q === facing} tabIndex={q === facing ? 0 : -1}
              className={`qtab${q === facing ? ' on' : ''}${free ? ' open' : ''}`} style={{ '--c': `var(--${id})` }}
              onClick={() => onFacing(q)} aria-label={`${quadrant(id).name}${free ? ', has open spaces for you' : ''}`} title={free ? `${quadrant(id).name}: the dot means it has open spaces for you` : quadrant(id).name}
            >{quadrant(id).name}</button>
          );
        })}
      </div>
      </div>
      {folded && (
        <button type="button" className="quad-line" onClick={() => fold(false)}>
          <b>{shortLabel(Q.scoring.label)} <span className="num">+{RING_VALUE[round - 1]}</span></b>
          {standing && standing.top > 0 && <span> · now {standing.rows.slice(0, 3).map(r => `${r.id === meId ? 'you' : state.players[r.id].name} ${r.shown}`).join(', ')}</span>}
          <span> · {openCount ? `${openCount} open for you` : `${Q.actions.filter((a, i) => a.ring <= round && state.slots[`${facing}-${i}`] === undefined).length} open`}</span>
        </button>
      )}
      <div className="score" title={`${Q.scoring.label} at round end wins ${RING_VALUE.map(v => `+${v}`).join(' / ')} in rounds I / II / III. Ties all score.`}>
        <span className="score-line">
          {/* the rule opens its standings, from the engine (what it counts, every count, who'd score now) */}
          <b><ContestTip state={state} qid={qid} meId={meId}>{shortLabel(Q.scoring.label)}</ContestTip> <span className="num">+{RING_VALUE[round - 1]}</span></b> this round
          {Q.scoring.tiebreak && <small className="tb"> ({Q.scoring.tiebreak.text})</small>}
          {standing && standing.top > 0 ? (
            <> · now {standing.rows.slice(0, 4).map((r, k) => (
              <span key={r.id} className={standing.leaders.includes(r.id) ? 'leads' : ''} style={{ '--pc': playerColor(r.id) }}>
                {k ? ', ' : ''}<i />{r.id === meId ? 'you' : state.players[r.id].name} <b className="num">{r.shown}</b>
                {tiebreakNote(standing, r) && <small className="tb"> ({tiebreakNote(standing, r)})</small>}
              </span>
            ))}</>
          ) : state.round >= 1 ? <> · nobody has any yet</> : null}
        </span>
      </div>
      <div className="acts">
        {Q.actions.map((a, i) => {
          const t = a.ring;
          const key = `${facing}-${i}`;
          const owner = state.slots[key];
          const opt = optionFor(`slot:${key}`) || optionFor(`squat:${key}`); // squat: a rival's space you may join (Squatter)
          const locked = t > round;
          const cls = ['act', opt ? 'can' : '', owner !== undefined ? 'taken' : '', locked ? 'locked' : ''].join(' ');
          return (
            <button
              key={i} type="button" className={cls} aria-disabled={!opt} title={`${a.name} (round ${roman(t)}): ${a.text}`}
              data-option={opt ? opt.id : undefined}
              onPointerDown={e => { pointer.current = e.pointerType || 'mouse'; }}
              onClick={e => {
                // touch (and online): the same sheet as tapping the space on the wheel, with "Place here"
                if (opt && (pointer.current === 'touch' || confirmPlace)) { if (onPeek) onPeek({ key, n: Date.now() }); else setPop({ el: e.currentTarget, key, a, opt: opt.id }); return; }
                if (opt) onPick(opt.id); else if (onDenied) onDenied({ type: 'slot', key, q: facing, i }, e.currentTarget);
              }}
            >
              <span className="rn">Round {roman(t)}</span>
              <b>{a.name}</b><span className="act-text"><Rich text={a.text} /></span>
              {owner !== undefined
                ? <span className="by" style={{ '--pc': playerColor(owner) }}><i />{state.players[owner].name}{opt && opt.squat ? ' · you can join' : ''}</span>
                : locked ? <span className="by lockt">opens round {roman(t)}</span> : null}
            </button>
          );
        })}
      </div>
      {pop && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-card" style={{ '--c': col }}>
            <b>{pop.a.name}</b>
            <span><Rich text={pop.a.text} /></span>
            <button type="button" className="btn pri" data-autofocus data-place={pop.opt} onClick={() => { const id = pop.opt; setPop(null); onPick(id); }}>Place here</button>
          </div>
        </Popover>
      )}
    </section>
  );
}
