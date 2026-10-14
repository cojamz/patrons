// "How do you want to pay?" The engine lists every legal spend (pending.options of kind 'pay').
// The default is preselected so one tap confirms; steppers or the quick list adjust it. Confirm is live only
// when the chosen spend is one of the legal options.
import { useEffect, useMemo, useState } from 'react';
import { cardDef, TIERS } from '../../engine/v4/index.js';
import { costParts, tierCostText } from '../format.js';
import { useDialog, TurnOf } from './parts.jsx';
import { Rich, CostPips } from './Rich.jsx';

export default function PayPicker({ state, onPick, busy, turnOf = null }) {
  const pend = state.pending;
  const p = state.players[pend.player];
  const res = state.resources;
  const ways = pend.options.filter(o => o.kind === 'pay');
  const back = pend.options.find(o => o.kind === 'back');
  const start = (ways.find(o => o.default) || ways[0])?.spend || Object.fromEntries(res.map(r => [r, 0]));
  const [spend, setSpend] = useState(start);
  useEffect(() => { setSpend(start); }, [pend]); // eslint-disable-line react-hooks/exhaustive-deps

  const id = `pay:${res.map(r => spend[r] || 0).join('-')}`;
  const match = useMemo(() => ways.find(o => o.id === id), [ways, id]);
  const total = res.reduce((s, r) => s + (spend[r] || 0), 0);

  const def = pend.uid !== undefined ? cardDef(state, pend.uid) : null;
  const tier = pend.tier ? TIERS.find(t => t.key === pend.tier) : null;
  const title = def ? `Recruit ${def.name}` : `Buy ${tier.get} follower${tier.get > 1 ? 's' : ''}`;
  const costLine = def
    ? (costParts(def, state.resources).map(c => `${c.n} ${c.color}`).join(' + ') || 'free') + (p.discount ? ` · your discount applies` : '')
    : tierCostText(tier);
  const box = useDialog(back ? () => onPick('back') : null);
  const step = (r, d) => setSpend(s => ({ ...s, [r]: Math.max(0, Math.min(p.res[r], (s[r] || 0) + d)) }));

  return (
    <div className="overlay sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog pay" ref={box} onKeyDown={e => { if (e.key === 'Enter' && match && !busy) { e.preventDefault(); onPick(match.id); } }} style={def ? { '--c': `var(--${def.quadrant})` } : undefined}>
        <div className="pay-head">
          {turnOf && <TurnOf player={turnOf} />}
          <h2>{title}</h2>
          {def && <span className="ability"><Rich text={def.text} /> <span className="num star">{def.f}★</span></span>}
          <span className="hint">Costs {costLine}</span>
        </div>
        <div className="coins" aria-label={`Paying ${match ? match.label : 'nothing yet'}`}>
          {res.flatMap(r => Array.from({ length: spend[r] || 0 }, (_, k) => <i key={`${r}${k}`} className="coin" style={{ background: `var(--${r})` }} />))}
          {!total && <span className="hint">nothing</span>}
        </div>
        <div className="steppers">
          {res.map(r => (
            <div key={r} className="stepper" style={{ '--c': `var(--${r})` }}>
              <button type="button" aria-label={`One less ${r}`} disabled={!spend[r]} onClick={() => step(r, -1)}>−</button>
              <span><i /><span className="num">{spend[r] || 0}</span><small className="num">/{p.res[r]}</small></span>
              <button type="button" aria-label={`One more ${r}`} disabled={(spend[r] || 0) >= p.res[r]} onClick={() => step(r, 1)}>+</button>
            </div>
          ))}
        </div>
        {ways.length > 1 && (
          <div className="ways">
            <span className="hint">Ways to pay</span>
            <div className="opts">
              {ways.map(o => (
                <button key={o.id} type="button" className={`way${o.id === id ? ' on' : ''}`} aria-pressed={o.id === id} onClick={() => setSpend(o.spend)}>
                  {res.filter(r => o.spend[r]).map(r => <span key={r}><i style={{ background: `var(--${r})` }} /><span className="num">{o.spend[r]}</span></span>)}
                  {o.default && <em>suggested</em>}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className={`hint${match ? '' : ' warn'}`} aria-live="polite">{match ? `You pay ${match.label}.` : 'That spend doesn’t fit the cost. Adjust it, or pick a way above.'}</p>
        <div className="row-btns">
          {back && <button type="button" className="btn" data-option="back" disabled={busy} onClick={() => onPick('back')}>Back</button>}
          <button type="button" className="btn pri" data-autofocus data-option={match ? match.id : undefined} disabled={!match || busy} onClick={() => match && onPick(match.id)}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
