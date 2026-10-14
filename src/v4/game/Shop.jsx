// The shop (6 face-up members) and the buy tray (follower buys, member activations, Pass).
import { cardDef, paymentPlan, followerChoices, TIERS } from '../../engine/v4/index.js';
import { costParts, tierCostText } from '../format.js';

const total = spend => Object.values(spend).reduce((a, b) => a + b, 0);

function Cost({ d, plan }) {
  const parts = costParts(d);
  const full = d.s + d.w;
  const cheaper = plan && total(plan) < full;
  const dots = list => list.map((c, k) => (
    <span key={k} className="cp">{k ? ' + ' : ''}{c.color !== 'any' && <i style={{ background: `var(--${c.color})` }} />}<span className="num">{c.n}</span> {c.color}</span>
  ));
  if (!cheaper) return <span>{parts.length ? dots(parts) : 'free'}</span>;
  const now = Object.entries(plan).filter(([, v]) => v).map(([color, n]) => ({ color, n }));
  return (
    <span className="cheaper" aria-label={`Costs ${full}, ${total(plan)} for you now`}>
      <s className="num">{full}</s> {now.length ? dots(now) : <b>free</b>}
    </span>
  );
}

export default function Shop({ state, me, mine, optionFor, onPick, onDenied }) {
  const pend = state.pending;
  const buying = mine && pend && pend.kind === 'buy';
  const viewer = me != null ? state.players[me] : null;
  // Outside your buy the shop is one compact row (name, ★, cost; ability on hover), so the board's actions fit.
  return (
    <section className={`panel shop-panel${buying ? ' open' : ' compact'}`}>
      <h2>Shop<small><span className="num">{state.pile.length}</span> in the pile{buying ? ' · tap a member to recruit' : ''}</small></h2>
      <div className="shop">
        {state.shop.map(uid => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const plan = viewer ? paymentPlan(state, viewer, uid) : null;
          return (
            <button
              key={uid} data-uid={uid} type="button" className={`card${opt ? ' can' : ''}${buying && !opt ? ' cant' : ''}`}
              style={{ '--c': `var(--${d.quadrant})` }} data-option={opt ? opt.id : undefined}
              aria-disabled={!opt} title={`${d.name} · ${d.f}★ · ${d.text}`}
              onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'card', uid, name: d.name }, e.currentTarget))}
            >
              <div className="row"><b>{d.name}</b><span className="fv num" aria-label={`${d.f} followers`}>{d.f}★</span></div>
              <span className="eff">{d.text}</span>
              <div className="row cost">
                <Cost d={d} plan={plan} />
                {d.n > 1 && <span><span className="num">{d.n}</span> members</span>}
              </div>
              <span className={`afford${opt ? '' : ' none'}`} aria-hidden={!opt}>You can afford</span>
            </button>
          );
        })}
      </div>
      {state.endEarly && !state.over && <p className="hint warn">The last +6 is gone — the game ends after this round.</p>}
    </section>
  );
}

/** The shop as a compact strip, affordable first (phone buy sheet and landscape). */
function ShopStrip({ state, me, optionFor, onPick, onDenied }) {
  const viewer = me != null ? state.players[me] : null;
  const cards = state.shop.map(uid => ({ uid, d: cardDef(state, uid), opt: optionFor(`card:${uid}`) }))
    .sort((a, b) => (!!b.opt - !!a.opt));
  return (
    <div className="strip" role="group" aria-label="Shop">
      {cards.map(({ uid, d, opt }) => {
        const plan = viewer ? paymentPlan(state, viewer, uid) : null;
        return (
          <button
            key={uid} type="button" className={`mini${opt ? ' can' : ''}`} style={{ '--c': `var(--${d.quadrant})` }}
            aria-disabled={!opt} title={`${d.name} · ${d.f}★ · ${d.text}`}
            onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'card', uid, name: d.name }, e.currentTarget))}
          >
            <span className="row"><b>{d.name}</b><span className="num">{d.f}★</span></span>
            <small>{d.text}</small>
            <span className="row cost"><Cost d={d} plan={plan} />{opt && <span className="afford" aria-label="you can afford this" title="You can afford this" />}</span>
          </button>
        );
      })}
    </div>
  );
}

const spendText = v => Object.entries(v).filter(([, n]) => n).map(([c, n]) => `${n} ${c}`).join(', ');

export function BuyTray({ state, me, mine, optionFor, onPick, onDenied }) {
  const pend = state.pending;
  const viewer = me != null ? state.players[me] : null;
  const extras = mine && pend ? pend.options.filter(o => o.kind === 'use' || o.kind === 'toggle') : [];
  const pass = optionFor('pass');
  const buying = mine && pend && pend.kind === 'buy';
  return (
    <div className={`fbuy${buying ? ' live' : ''}`} role="group" aria-label="Buy followers or pass">
      <ShopStrip state={state} me={me} optionFor={optionFor} onPick={onPick} onDenied={onDenied} />
      {TIERS.map(t => {
        const opt = optionFor(`tier:${t.key}`);
        return (
          <button
            key={t.key} type="button" className={`fb${opt ? ' can' : ''}`} data-option={opt ? opt.id : undefined}
            aria-disabled={!opt} onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'tier', tier: t }, e.currentTarget))}
            title={`Buy ${t.get} follower${t.get > 1 ? 's' : ''} for ${tierCostText(t)}`}
          >
            <b><span className="num">+{t.get}</span> follower{t.get > 1 ? 's' : ''}</b>
            <span>{(() => {
              // Say how it would be paid: one way pays at once; several ways opens the picker.
              const ways = opt && viewer ? followerChoices(state, viewer, t) : [];
              if (ways.length === 1) return `pays ${spendText(ways[0])}`;
              if (ways.length > 1) return `${t.cost} · you choose how`;
              return t.colors === 1 ? `${t.cost} of anything` : `${t.cost} · ${t.colors}+ colors`;
            })()}</span>
            {t.limited && <em className="left-badge num" title={`${state.bigLeft} of these left; the last one ends the game after that round`}>{state.bigLeft} left</em>}
          </button>
        );
      })}
      {extras.map(o => (
        <button key={o.id} type="button" className="btn" data-option={o.id} onClick={() => onPick(o.id)}>{o.label}</button>
      ))}
      <button
        type="button" className={`btn pass${pass ? '' : ' idle'}`} title="End your turn without buying" data-option={pass ? 'pass' : undefined} aria-disabled={!pass}
        onClick={e => (pass ? onPick('pass') : onDenied && onDenied({ type: 'pass' }, e.currentTarget))}
      >Pass</button>
      <small className="tray-note">Follower buys: gold counts as any color.</small>
    </div>
  );
}
