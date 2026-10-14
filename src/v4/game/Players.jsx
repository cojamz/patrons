// Players strip: followers, resources, workers left, member chips. The active player is highlighted.
// Cards keep one height: chips that don't fit fold into a "+N" chip that opens the full list. Chips open a small
// card on tap (touch-safe) with the member's effect, ★, and Use / switch when it's yours to use.
import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { followers, memberCount } from '../../engine/v4/index.js';
import { memberChips, playerColor, plural } from '../format.js';
import Tick from './Tick.jsx';
import { Popover } from './parts.jsx';

export const memberTip = d => `${d.name} · ${d.f}★ · ${d.text}`;

export function Resources({ state, p, float = true }) {
  return state.resources.map(r => (
    <span key={r} className="r" title={`${p.res[r]} ${r}`} aria-label={`${p.res[r]} ${r}`}>
      <i style={{ background: `var(--${r})` }} /><Tick value={p.res[r]} color={`var(--${r})`} className="num" float={float} />
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
  return (
    <span className="workers" title={`${plural(p.left, 'worker')} left this round`} aria-label={`${plural(p.left, 'worker')} left this round`}>
      <span className="dots" aria-hidden="true">{'●'.repeat(Math.max(0, p.left)) || '○'}</span>
      {caption && <small>{p.left === 1 ? 'worker' : 'workers'}</small>}
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
  if (!groups.length) return <div className="chips" ref={box}><em>no members yet</em></div>;
  const shown = groups.slice(0, fit === Infinity ? groups.length : fit);
  const hidden = groups.length - shown.length;
  return (
    <div className="chips" ref={box}>
      {shown.map(g => {
        // Your own switchable member shows its switch; on a rival's card it's just a name.
        const sw = own && g.def.toggle;
        return (
          <button
            key={g.key} data-g type="button" className={`chip${g.card.used || (sw && g.card.on === false) ? ' off' : ''}${sw ? ' switch' : ''}`}
            style={{ '--c': `var(--${g.def.quadrant})` }} title={memberTip(g.def)} aria-haspopup="dialog"
            onClick={e => onOpen(e.currentTarget, g)}
          >
            {g.label}{g.count > 1 ? ` ×${g.count}` : ''}
            {sw && <i className={`sw${g.card.on === false ? '' : ' on'}`} aria-label={g.card.on === false ? 'off' : 'on'} />}
          </button>
        );
      })}
      {hidden > 0 && (
        <button type="button" className="chip more" aria-haspopup="dialog" title={`Show all ${groups.length} members`} onClick={e => onAll(e.currentTarget)}>+{hidden} more</button>
      )}
    </div>
  );
}

export default function Players({ state, active, mySeats, gifts = [] }) {
  const [pop, setPop] = useState(null); // { el, group?, all?, pid, opt }
  const close = useCallback(() => setPop(null), []);
  const changes = useChanges(state);
  return (
    <div className="players">
      {state.players.map(p => {
        const f = followers(state, p);
        const isActive = active === p.id && !state.over;
        const isYou = mySeats.length === 1 ? mySeats[0] === p.id : mySeats.length > 1 && active === p.id && mySeats.includes(p.id);
        const n = memberCount(state, p);
        return (
          <section key={p.id} data-pid={p.id} className={`pl${isActive ? ' active' : ''}`} style={{ '--pc': playerColor(p.id) }} aria-label={`${p.name}${isActive ? ', to act' : ''}`}>
            <div className="top">
              <span className="nm"><i />{p.name}{p.kind === 'bot' ? <em> · bot</em> : isYou ? <em> · you</em> : null}</span>
              <span className="fol"><Tick value={f} color={playerColor(p.id)} className="num" dur={650} /><small>{f === 1 ? 'follower' : 'followers'}</small></span>
            </div>
            <div className="res">
              <Resources state={state} p={p} float={false} />
              <span className="meta"><Workers p={p} caption={false} /><span className="mcount">{plural(n, 'member')}</span>{p.discount ? <span className="disc"> −{p.discount} next</span> : null}</span>
            </div>
            <ChipRow
              state={state} p={p} own={mySeats.includes(p.id)}
              onOpen={(el, g) => setPop(pp => (pp && pp.group && pp.group.key === g.key && pp.pid === p.id ? null : { el, group: g, pid: p.id }))}
              onAll={el => setPop({ el, all: true, pid: p.id })}
            />
            {changes[p.id] && !gifts.some(g => g.pid === p.id) && (
              <span key={changes[p.id].n} className="gift change" aria-hidden="true">
                {changes[p.id].parts.map(([r, d]) => <span key={r} style={{ color: `var(--${r})` }}>{d > 0 ? '+' : '−'}{Math.abs(d)} {r} </span>)}
              </span>
            )}
            {gifts.filter(g => g.pid === p.id).map(g => (
              <span key={g.n} className="gift" style={{ '--c': `var(--${g.color}, var(--ink))` }} role="status">{g.text}</span>
            ))}
          </section>
        );
      })}
      {pop && pop.all && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-list">
            <b>{state.players[pop.pid].name}’s members</b>
            {memberChips(state, state.players[pop.pid]).map(g => (
              <div key={g.key} className="pop-row" style={{ '--c': `var(--${g.def.quadrant})` }}>
                <span><i />{g.label}{g.count > 1 ? ` ×${g.count}` : ''} <span className="num star">{g.def.f}★</span></span>
                <small>{g.def.text}</small>
              </div>
            ))}
          </div>
        </Popover>
      )}
      {pop && pop.group && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-card" style={{ '--c': `var(--${pop.group.def.quadrant})` }}>
            <div className="row"><b>{pop.group.label}{pop.group.count > 1 ? ` ×${pop.group.count}` : ''}</b><span className="num star">{pop.group.def.f}★</span></div>
            <span>{pop.group.def.text}</span>
            {pop.group.card.used && <small>Used</small>}
          </div>
        </Popover>
      )}
    </div>
  );
}
