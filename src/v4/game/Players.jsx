// Players strip: followers, resources, workers left, member chips. The active player is highlighted.
// Cards keep one height: chips that don't fit fold into a "+N" chip that opens the full list. Chips open a small
// card on tap (touch-safe) with the member's effect, ★, and Use / switch when it's yours to use.
import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { followers, memberCount } from '../../engine/v4/index.js';
import { memberChips, playerColor, plural, projectedEndGame } from '../format.js';
import Tick from './Tick.jsx';
import { Popover } from './parts.jsx';
import { Rich, CostPips } from './Rich.jsx';

export const memberTip = d => `${d.name} · ${d.f}★ · ${d.text}`;

export function Resources({ state, p, float = true, dur = 0 }) {
  return state.resources.map(r => (
    <span key={r} className="r" title={`${p.res[r]} ${r}`} aria-label={`${p.res[r]} ${r}`}>
      <i style={{ background: `var(--${r})` }} /><Tick value={p.res[r]} color={`var(--${r})`} className="num" float={float} dur={dur} />
    </span>
  ));
}

/** One pill per card summing what just changed ("+3 gold −2 red"), instead of floaters jostling each other. */
function useChanges(state) {
  const prev = useRef(state);
  const [changes, setChanges] = useState({});
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (before === state || before.round !== state.round && before.round === 0) return undefined;
    const next = {};
    for (const p of state.players) {
      const b = before.players[p.id];
      if (!b) continue;
      const parts = state.resources.map(r => [r, p.res[r] - b.res[r]]).filter(([, d]) => d);
      if (parts.length) next[p.id] = { n: Date.now(), parts };
    }
    if (!Object.keys(next).length) return undefined;
    setChanges(c => ({ ...c, ...next }));
    const t = setTimeout(() => setChanges(c => { const o = { ...c }; for (const k in next) if (o[k] === next[k]) delete o[k]; return o; }), 1600);
    return () => clearTimeout(t);
  }, [state]);
  return changes;
}

export function Workers({ p, caption = true }) {
  // little worker pawns, one per worker left this round
  const n = Math.max(0, p.left);
  return (
    <span className="workers" title={`${plural(p.left, 'worker')} left this round`} aria-label={`${plural(p.left, 'worker')} left this round`}>
      <span className="pawns" aria-hidden="true">
        {n ? Array.from({ length: n }, (_, k) => (
          <svg key={k} viewBox="0 0 10 12" width="9" height="11"><circle cx="5" cy="3" r="2.4" /><path d="M1 12 Q1 6.2 5 6.2 Q9 6.2 9 12 Z" /></svg>
        )) : null}
      </span>
      {n === 0 ? <small>no workers</small> : caption && <small><span className="num">{n}</span> {n === 1 ? 'worker' : 'workers'}</small>}
    </span>
  );
}

/** Chips for one player: as many as fit on the card, then "+N". */
function ChipRow({ state, p, own, onOpen, onAll }) {
  const groups = p.members.length ? memberChips(state, p) : [];
  const box = useRef(null);
  const [fit, setFit] = useState(Infinity);
  const sig = groups.map(g => g.key + g.count).join(',');
  useLayoutEffect(() => { setFit(Infinity); }, [sig]);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || fit !== Infinity) return undefined;
    const measure = () => {
      const kids = [...el.querySelectorAll('.chip[data-g]')];
      const box2 = el.getBoundingClientRect();
      if (!box2.height) { setFit(kids.length); return; }
      const limit = box2.top + el.clientHeight + 1;
      const inside = kids.filter(k => k.getBoundingClientRect().bottom <= limit).length;
      setFit(inside >= kids.length ? kids.length : Math.max(0, inside - 1));
    };
    measure();
    return undefined;
  }, [fit, sig]);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) > 4) { w = el.clientWidth; setFit(Infinity); } });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!groups.length) return <div className="chips none" ref={box}><span className="no-members">No members yet</span></div>;
  const shown = groups.slice(0, fit === Infinity ? groups.length : fit);
  const hidden = groups.length - shown.length;
  return (
    <div className="chips" ref={box}>
      {shown.map(g => {
        // Your own switchable member shows its switch; on a rival's card it's just a name.
        const sw = own && g.def.toggle;
        return (
          <button
            key={g.key} data-g data-uids={g.uids.join(' ')} type="button" className={`chip${g.card.used || (sw && g.card.on === false) ? ' off' : ''}${sw ? ' switch' : ''}`}
            style={{ '--c': `var(--${g.def.quadrant})` }} title={memberTip(g.def)} aria-haspopup="dialog"
            onClick={e => onOpen(e.currentTarget, g)}
          >
            <span className="glyph" aria-hidden="true" />{g.label}{g.def.f > 1 ? <em className="stars"> {g.def.f}★</em> : null}{g.count > 1 ? <em className="copies"> ×{g.count} copies</em> : ''}{g.card.used ? <em className="used"> · used</em> : null}
            {sw && <i className={`sw${g.card.on === false ? '' : ' on'}`} aria-label={g.card.on === false ? 'off' : 'on'} />}
          </button>
        );
      })}
      {hidden > 0 && (
        <button type="button" className="chip more" data-uids={groups.slice(shown.length).flatMap(g => g.uids).join(' ')} aria-haspopup="dialog" title={`Show all ${groups.length} members`} onClick={e => onAll(e.currentTarget)}>+{hidden} more</button>
      )}
    </div>
  );
}

export default function Players({ state, active, mySeats, gifts = [], robbed = null }) {
  const [pop, setPop] = useState(null); // { el, group?, all?, pid, opt }
  const close = useCallback(() => setPop(null), []);
  const changes = useChanges(state);
  // from round II on, what each player's end-game bonuses would add if the game ended now
  const proj = state.round >= 2 && !state.over ? projectedEndGame(state) : null;
  const [open, setOpen] = useState(false); // phones: the player list starts as one summary line
  return (
    <div className={`players${open ? ' open' : ''}`}>
      <button type="button" className="pl-summary" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {state.players.map(p => (
          <span key={p.id} className={`ps${active === p.id ? ' act' : ''}`} style={{ '--pc': playerColor(p.id) }}>
            <i />{p.name} <b className="num">{followers(state, p)}</b>
          </span>
        ))}
        <span className="more-ind" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {state.players.map(p => {
        const f = followers(state, p);
        const isActive = active === p.id && !state.over;
        const isYou = mySeats.length === 1 ? mySeats[0] === p.id : mySeats.length > 1 && active === p.id && mySeats.includes(p.id);
        const n = memberCount(state, p);
        return (
          <section key={p.id} data-pid={p.id} className={`pl${isActive ? ' active' : ''}`} style={{ '--pc': playerColor(p.id) }} aria-label={`${p.name}${isActive ? ', to act' : ''}`}>
            <div className="top">
              <span className="nm"><i />{p.name}{p.hideout && p.hideout === state.round && !state.over ? <span className="hideout" title="Hideout: no one can steal from this player this round">⛨ hidden</span> : null}{p.kind === 'bot' ? <em> · bot</em> : isYou ? <em> · you</em> : null}</span>
              <span className="fol">
                <Tick value={f} color={playerColor(p.id)} className="num" float={false} /><small>{f === 1 ? 'follower' : 'followers'}</small>
                {proj && proj[p.id] && proj[p.id].total > 0 && (
                  <em className="at-end" title={`If the game ended now: ${proj[p.id].parts.map(x => `${x.name} +${x.n}`).join(', ')}`}>+{proj[p.id].total} at end</em>
                )}
              </span>
            </div>
            <div className={`res${robbed && robbed.pid === p.id ? ' robbed' : ''}`}>
              <Resources state={state} p={p} float={false} />
              <span className="meta">
                <Workers p={p} />
                <span className="sep" aria-hidden="true" />
                <button type="button" className="mcount" aria-haspopup="dialog" title="Show members" onClick={e => setPop({ el: e.currentTarget, all: true, pid: p.id })}>{plural(n, 'member')}</button>
              </span>
            </div>
            {p.discount && !state.over ? <div className="disc" title={`The next member ${p.name} recruits costs ${p.discount} less`}>Next member −{p.discount}</div> : null}
            {/* gains and losses get their own lane under the resources, never over the chips */}
            <div className="lane" aria-live="polite">
              {gifts.filter(g => g.pid === p.id).map(g => (
                <span key={g.n} className="gift" title={g.text} data-clip-ok style={{ '--c': `var(--${g.color}, var(--ink))` }}>{g.text}</span>
              ))}
              {changes[p.id] && !gifts.some(g => g.pid === p.id) && (
                <span key={changes[p.id].n} className="gift change" aria-hidden="true">
                  {changes[p.id].parts.map(([r, d]) => <span key={r} style={{ color: `var(--${r})` }}>{d > 0 ? '+' : '−'}{Math.abs(d)} {r} </span>)}
                </span>
              )}
            </div>
            <ChipRow
              state={state} p={p} own={mySeats.includes(p.id)}
              onOpen={(el, g) => setPop(pp => (pp && pp.group && pp.group.key === g.key && pp.pid === p.id ? null : { el, group: g, pid: p.id }))}
              onAll={el => setPop({ el, all: true, pid: p.id })}
            />
          </section>
        );
      })}
      {pop && pop.all && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-list">
            <b>{state.players[pop.pid].name}’s members</b>
            {memberChips(state, state.players[pop.pid]).map(g => (
              <div key={g.key} className="pop-row" style={{ '--c': `var(--${g.def.quadrant})` }}>
                <span><i />{g.label} <span className="num star">{g.count > 1 ? `${g.count} copies · ${g.def.f}★ each` : `${g.def.f}★`}</span></span>
                <small><Rich text={g.def.text} /></small>
              </div>
            ))}
          </div>
        </Popover>
      )}
      {pop && pop.group && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-card" style={{ '--c': `var(--${pop.group.def.quadrant})` }}>
            <div className="row"><b>{pop.group.label}</b><span className="num star">{pop.group.count > 1 ? `${pop.group.count} copies · ${pop.group.def.f}★ each` : `${pop.group.def.f}★`}</span></div>
            <span><Rich text={pop.group.def.text} /></span>
            {pop.group.card.used && <small>Used</small>}
          </div>
        </Popover>
      )}
    </div>
  );
}
