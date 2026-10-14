// The shop: 6 face-up members, the follower buys, member activations and Pass.
import { cardDef, paymentPlan, TIERS } from '../../engine/v4/index.js';
import { costParts, tierCostText } from '../format.js';

const payText = spend => Object.entries(spend).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'nothing';

export default function Shop({ state, mine, optionFor, onPick }) {
  const pend = state.pending;
  const buying = mine && pend && pend.kind === 'buy';
  const buyer = pend ? state.players[pend.player] : null;
  const extras = mine && pend ? pend.options.filter(o => o.kind === 'use' || o.kind === 'toggle') : [];
  const pass = optionFor('pass');
  return (
    <section className="panel shop-panel">
      <h2>Shop<small>{state.pile.length} in the pile{buying ? ' · tap one to recruit' : ''}</small></h2>
      <div className="shop">
        {state.shop.map(uid => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const plan = buying && buyer ? paymentPlan(state, buyer, uid) : null;
          const tip = `${d.name}: ${d.text}${opt && plan ? ` — you'd pay ${payText(plan)}` : buying ? ' — can’t afford yet' : ''}`;
          return (
            <button
              key={uid} data-uid={uid} type="button" className={`card${opt ? ' can' : ''}${buying && !opt ? ' cant' : ''}`}
              style={{ '--c': `var(--${d.quadrant})` }} data-option={opt ? opt.id : undefined}
              aria-disabled={!opt} tabIndex={opt ? 0 : -1} title={tip}
              onClick={() => opt && onPick(opt.id)}
            >
              <div className="row"><b>{d.name}</b><span className="fv" aria-label={`${d.f} followers`}>{d.f}★</span></div>
              <span className="eff">{d.text}</span>
              <div className="row cost">
                <span>
                  {costParts(d).length ? costParts(d).map((c, k) => (
                    <span key={k} className="cp">{k ? ' + ' : ''}{c.color !== 'any' && <i style={{ background: `var(--${c.color})` }} />}{c.n} {c.color}</span>
                  )) : 'free'}
                </span>
                {d.n > 1 && <span>{d.n} members</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="fbuy">
        {TIERS.map(t => {
          const opt = optionFor(`tier:${t.key}`);
          return (
            <button
              key={t.key} type="button" className={`fb${opt ? ' can' : ''}`} data-option={opt ? opt.id : undefined}
              aria-disabled={!opt} tabIndex={opt ? 0 : -1} onClick={() => opt && onPick(opt.id)}
              title={`Buy ${t.get} follower${t.get > 1 ? 's' : ''} for ${tierCostText(t)}`}
            >
              <b>+{t.get} follower{t.get > 1 ? 's' : ''}</b>
              <span>{tierCostText(t)}{t.limited ? ` · ${state.bigLeft} left` : ''}</span>
            </button>
          );
        })}
        {extras.map(o => (
          <button key={o.id} type="button" className="btn" data-option={o.id} onClick={() => onPick(o.id)}>{o.label}</button>
        ))}
        {pass && <button type="button" className="btn" data-option="pass" onClick={() => onPick('pass')}>Pass</button>}
      </div>
      {state.endEarly && !state.over && <p className="hint warn">The last +6 is gone — the game ends after this round.</p>}
    </section>
  );
}
