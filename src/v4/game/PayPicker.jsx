// "How do you want to pay?" The engine lists every legal spend (pending.options of kind 'pay'); the UI never
// decides what's legal, it only moves resources between your pile and the cost and asks whether the result is one
// of those options.
//  - The suggested spend is already in the cost: one tap on Confirm pays.
//  - Adjusting is direct: tap one of your resources to put it into the cost (when the cost is full it swaps in for
//    another color, if that's still a legal way to pay); tap a coin in the cost to take it back.
//  - The cost slots fill with color and count down; "Paid in full" says when it's done.
import { useEffect, useMemo, useState } from 'react';
import { cardDef, TIERS } from '../../engine/v4/index.js';
import { costParts, tierCostText } from '../format.js';
import { useDialog, TurnOf } from './parts.jsx';
import { Rich, CostPips } from './Rich.jsx';

const sum = v => Object.values(v).reduce((a, b) => a + (b || 0), 0);
const idOf = (res, v) => `pay:${res.map(r => v[r] || 0).join('-')}`;

export default function PayPicker({ state, onPick, busy, turnOf = null }) {
  const pend = state.pending;
  const p = state.players[pend.player];
  const res = state.resources;
  const ways = pend.options.filter(o => o.kind === 'pay');
  const legal = useMemo(() => new Map(ways.map(o => [o.id, o])), [pend]); // eslint-disable-line react-hooks/exhaustive-deps
  const back = pend.options.find(o => o.kind === 'back');
  const suggested = (ways.find(o => o.default) || ways[0])?.spend || Object.fromEntries(res.map(r => [r, 0]));
  const [spend, setSpend] = useState(suggested);
  const [nudge, setNudge] = useState(null); // { text, n } a short answer when a tap can't go in
  useEffect(() => { setSpend(suggested); setNudge(null); }, [pend]); // eslint-disable-line react-hooks/exhaustive-deps

  const id = idOf(res, spend);
  const match = legal.get(id) || null;
  const total = sum(spend);
  const need = sum(suggested); // slots shown: the suggested way's size (a discount can make some ways smaller)

  const def = pend.uid !== undefined ? cardDef(state, pend.uid) : null;
  const tier = pend.tier ? TIERS.find(t => t.key === pend.tier) : null;
  const title = def ? `Recruit ${def.name}` : `Buy ${tier.get} follower${tier.get > 1 ? 's' : ''}`;
  const parts = def ? costParts(def, state.resources) : [];
  const box = useDialog(back ? () => onPick('back') : null);
  const say = text => setNudge(n => ({ text, n: (n ? n.n : 0) + 1 }));

  // tap one of your resources: into the cost, or (cost full) swapped in for another color if that's a legal way
  const add = r => {
    if ((spend[r] || 0) >= p.res[r]) { say(`You have no more ${r}.`); return; }
    if (total < need) { setSpend(s => ({ ...s, [r]: (s[r] || 0) + 1 })); setNudge(null); return; }
    const swaps = res.filter(y => y !== r && spend[y] > 0).sort((a, b) => spend[b] - spend[a])
      .map(y => ({ ...spend, [r]: (spend[r] || 0) + 1, [y]: spend[y] - 1 }));
    const ok = swaps.find(v => legal.has(idOf(res, v)));
    if (ok) { setSpend(ok); setNudge(null); } else say(`${r[0].toUpperCase()}${r.slice(1)} can’t go into this cost.`);
  };
  // tap a coin in the cost: back to your pile
  const remove = r => { setSpend(s => ({ ...s, [r]: Math.max(0, (s[r] || 0) - 1) })); setNudge(null); };

  // the cost as slots: filled coins (colored part's color first), then empty slots (outlined in the color they need)
  const coins = res.flatMap(r => Array.from({ length: spend[r] || 0 }, (_, k) => ({ r, k })));
  const colored = parts.find(c => c.color !== 'any');
  const coloredLeft = colored ? Math.max(0, colored.n - (spend[colored.color] || 0)) : 0;
  const empty = Math.max(0, need - total);
  const status = match ? 'Paid in full' : total < need ? `${need - total} more to pay` : total > need ? `${total - need} too many` : 'That mix doesn’t fit the cost';

  return (
    <div className="overlay sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog pay" ref={box} onKeyDown={e => { if (e.key === 'Enter' && match && !busy) { e.preventDefault(); onPick(match.id); } }} style={def ? { '--c': `var(--${def.quadrant})` } : undefined}>
        <div className="pay-head">
          {turnOf && <TurnOf player={turnOf} />}
          <h2>{title}</h2>
          {def && <span className="ability"><Rich text={def.text} /> <span className="num star">{def.f}★</span></span>}
          <span className="hint">Costs {def ? <CostPips parts={parts} /> : tierCostText(tier)}{def && p.discount ? ' · your discount applies' : ''}</span>
        </div>

        <div className={`pay-slots${match ? ' done' : ''}`} role="group" aria-label={`The cost: ${total} of ${need} paid. Tap a coin to take it back.`}>
          {coins.map(({ r, k }) => (
            <button key={`${r}${k}`} type="button" className="slot-coin" data-pay-coin={r} style={{ '--c': `var(--${r})` }}
              aria-label={`${r} in the cost: take it back`} title={`${r}: tap to take it back`} onClick={() => remove(r)} />
          ))}
          {Array.from({ length: empty }, (_, k) => (
            <span key={`e${k}`} className={`slot-empty${k < coloredLeft ? ' colored' : ''}`} style={k < coloredLeft ? { '--c': `var(--${colored.color})` } : undefined} aria-hidden="true" />
          ))}
          <span className={`pay-status${match ? ' ok' : ''}`} aria-live="polite" data-pay-status>{match ? '✓ ' : ''}{status}</span>
        </div>

        <div className="pay-tray" role="group" aria-label="Your resources: tap one to put it into the cost">
          {res.map(r => {
            const left = p.res[r] - (spend[r] || 0);
            return (
              <button key={r} type="button" className="tray-coin" data-pay-add={r} style={{ '--c': `var(--${r})` }} disabled={busy || p.res[r] === 0}
                aria-label={`${r}: you have ${left} left. Put one into the cost`} onClick={() => add(r)}>
                <i /><span className="num">{left}</span>
              </button>
            );
          })}
        </div>
        {nudge && <p key={nudge.n} className="hint warn" role="status">{nudge.text}</p>}
        {total !== need || !match ? (
          <button type="button" className="btn ghost pay-reset" onClick={() => { setSpend(suggested); setNudge(null); }}>Use the suggested way</button>
        ) : null}

        <div className="row-btns">
          {back && <button type="button" className="btn" data-option="back" disabled={busy} onClick={() => onPick('back')}>Back</button>}
          <button type="button" className="btn pri" data-autofocus data-option={match ? match.id : undefined} disabled={!match || busy}
            title={match ? `Pay ${match.label}` : undefined} onClick={() => match && onPick(match.id)}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
