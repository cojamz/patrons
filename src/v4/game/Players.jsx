// Players strip: followers, resources, workers left, member chips. The active player is highlighted.
// Chips open a small card on tap (touch-safe) with the member's effect, ★, and Use / switch when it's yours to use.
import { useState, useCallback } from 'react';
import { followers, memberCount } from '../../engine/v4/index.js';
import { memberChips, playerColor, plural } from '../format.js';
import Tick from './Tick.jsx';
import { Popover } from './parts.jsx';

export const memberTip = d => `${d.name} · ${d.f}★ · ${d.text}`;

export function Resources({ state, p }) {
  return state.resources.map(r => (
    <span key={r} className="r" title={`${p.res[r]} ${r}`} aria-label={`${p.res[r]} ${r}`}>
      <i style={{ background: `var(--${r})` }} /><Tick value={p.res[r]} color={`var(--${r})`} className="num" />
    </span>
  ));
}

export function Workers({ p }) {
  return (
    <span className="workers" title={`${plural(p.left, 'worker')} left this round`} aria-label={`${plural(p.left, 'worker')} left this round`}>
      <span className="dots" aria-hidden="true">{'●'.repeat(Math.max(0, p.left)) || '○'}</span>
      <small>{p.left === 1 ? 'worker' : 'workers'}</small>
    </span>
  );
}

export default function Players({ state, active, mySeats, optionFor, onPick }) {
  const [pop, setPop] = useState(null); // { el, group, pid }
  const close = useCallback(() => setPop(null), []);
  return (
    <div className="players">
      {state.players.map(p => {
        const f = followers(state, p);
        const isActive = active === p.id && !state.over;
        return (
          <section key={p.id} data-pid={p.id} className={`pl${isActive ? ' active' : ''}`} style={{ '--pc': playerColor(p.id) }} aria-label={`${p.name}${isActive ? ', to act' : ''}`}>
            <div className="top">
              <span className="nm"><i />{p.name}{p.kind === 'bot' ? <em> · bot</em> : (mySeats.length === 1 ? mySeats[0] === p.id : mySeats.length > 1 && active === p.id && mySeats.includes(p.id)) ? <em> · you</em> : null}</span>
              <span className="fol"><Tick value={f} color={playerColor(p.id)} className="num" /><small>{f === 1 ? 'follower' : 'followers'}</small></span>
            </div>
            <div className="res">
              <Resources state={state} p={p} />
              <span className="meta"><Workers p={p} /> · {plural(memberCount(state, p), 'member')}{p.discount ? ` · −${p.discount} next` : ''}</span>
            </div>
            <div className="chips">
              {p.members.length ? memberChips(state, p).map(g => {
                const use = g.uids.map(u => optionFor(`use:${u}`)).find(Boolean);
                const tog = g.uids.map(u => optionFor(`toggle:${u}`)).find(Boolean);
                const opt = use || tog;
                const onoff = g.def.toggle ? (g.card.on === false ? ' · off' : ' · on') : '';
                return (
                  <button
                    key={g.key} type="button" className={`chip${opt ? ' use' : ''}${g.card.used || g.card.on === false ? ' off' : ''}`}
                    style={{ '--c': `var(--${g.def.quadrant})` }} title={memberTip(g.def)} aria-haspopup="dialog"
                    onClick={e => setPop(pp => (pp && pp.group.key === g.key && pp.pid === p.id ? null : { el: e.currentTarget, group: g, pid: p.id, opt }))}
                  >
                    {g.label}{g.count > 1 ? ` ×${g.count}` : ''}{onoff}{use ? ' · use' : ''}
                  </button>
                );
              }) : <em>no members yet</em>}
            </div>
          </section>
        );
      })}
      {pop && (
        <Popover anchor={pop.el} onClose={close}>
          <div className="pop-card" style={{ '--c': `var(--${pop.group.def.quadrant})` }}>
            <div className="row"><b>{pop.group.def.name}{pop.group.count > 1 ? ` ×${pop.group.count}` : ''}</b><span className="num star">{pop.group.def.f}★</span></div>
            <span>{pop.group.def.text}</span>
            {pop.group.card.copy && <small>Copying {pop.group.label.split('→ ')[1]}</small>}
            {pop.group.card.used && <small>Used</small>}
            {pop.opt && <button type="button" className="btn pri" data-autofocus onClick={() => { const id = pop.opt.id; setPop(null); onPick(id); }}>{pop.opt.label}</button>}
          </div>
        </Popover>
      )}
    </div>
  );
}
