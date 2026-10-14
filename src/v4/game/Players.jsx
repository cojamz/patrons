// Players strip: followers big, resources, workers left, member chips (tooltips), active player highlighted.
import { useState } from 'react';
import { followers, memberCount } from '../../engine/v4/index.js';
import { memberChips, playerColor, plural } from '../format.js';

export default function Players({ state, active, mySeats, optionFor, onPick }) {
  const [open, setOpen] = useState(() => new Set());
  const flip = id => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="players">
      {state.players.map(p => {
        const f = followers(state, p);
        const isActive = active === p.id && !state.over;
        return (
          <section key={p.id} className={`pl${isActive ? ' active' : ''}${open.has(p.id) ? ' open' : ''}`} style={{ '--pc': playerColor(p.id) }} aria-label={`${p.name}${isActive ? ', to act' : ''}`}>
            <div className="top">
              <span className="nm"><i />{p.name}{p.kind === 'bot' ? <em> · bot</em> : mySeats.includes(p.id) && mySeats.length < state.players.length ? <em> · you</em> : null}</span>
              <span className="fol">{f}<small>{f === 1 ? 'follower' : 'followers'}</small></span>
            </div>
            <div className="res">
              {state.resources.map(r => (
                <span key={r} title={`${p.res[r]} ${r}`}><i style={{ background: `var(--${r})` }} />{p.res[r]}</span>
              ))}
              <span className="meta">
                <span className="workers" title={`${plural(p.left, 'worker')} left this round`} aria-label={`${plural(p.left, 'worker')} left`}>{'●'.repeat(Math.max(0, p.left)) || '○'}</span>
                {' · '}{plural(memberCount(state, p), 'member')}
                {p.discount ? ` · −${p.discount} next` : ''}
              </span>
              {p.members.length > 0 && (
                <button type="button" className="more" aria-expanded={open.has(p.id)} onClick={() => flip(p.id)}>{open.has(p.id) ? 'hide' : 'show'}</button>
              )}
            </div>
            <div className="chips">
              {p.members.length ? memberChips(state, p).map(g => {
                const use = g.uids.map(u => optionFor(`use:${u}`)).find(Boolean);
                const tog = g.uids.map(u => optionFor(`toggle:${u}`)).find(Boolean);
                const opt = use || tog;
                const state2 = g.def.toggle ? (g.card.on === false ? ' · off' : ' · on') : '';
                const tip = `${g.def.name}: ${g.def.text}${g.def.f > 1 ? ` (${g.def.f} followers)` : ''}${g.def.n > 1 ? ` Counts as ${g.def.n} members.` : ''}${g.card.used ? ' Used.' : ''}`;
                return (
                  <button
                    key={g.key} type="button" className={`chip${opt ? ' use' : ''}${g.card.used || g.card.on === false ? ' off' : ''}`}
                    style={{ '--c': `var(--${g.def.quadrant})` }} title={tip} aria-label={tip}
                    data-option={opt ? opt.id : undefined} tabIndex={opt ? 0 : -1}
                    onClick={() => opt && onPick(opt.id)}
                  >
                    {g.label}{g.count > 1 ? ` ×${g.count}` : ''}{state2}{use ? ' · use' : ''}
                  </button>
                );
              }) : <em>no members yet</em>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
