// The shop (6 face-up members) and the buy tray (follower buys, member activations, Pass).
import { cardDef, paymentPlan, followerChoices, TIERS } from '../../engine/v4/index.js';
import { useEffect, useRef } from 'react';
import { costParts, tierCostText } from '../format.js';

const total = spend => Object.values(spend).reduce((a, b) => a + b, 0);

function Cost({ d, plan }) {
  // the list cost, as printed on every card; what you'd pay right now goes on a second line when it differs
  const parts = costParts(d);
  const dots = list => list.map((c, k) => (
    <span key={k} className="cp">{k ? ' + ' : ''}{c.color !== 'any' && <i style={{ background: `var(--${c.color})` }} />}<span className="num">{c.n}</span> {c.color}</span>
  ));
  const listText = parts.map(c => `${c.n} ${c.color}`).join(' + ') || 'free';
  const payText = plan ? (Object.entries(plan).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'free') : null;
  const differs = plan && (total(plan) < d.s + d.w || payText !== listText);
  return (
    <span className="cost-box">
      <span>{parts.length ? dots(parts) : 'free'}</span>
      {differs && <span className="youd">{payText === 'free' ? 'free for you' : `you’d pay ${payText}`}</span>}
    </span>
  );
}

/**
 * The shop. variant 'compact': a fixed row under the board (full names on two lines, ★ and list cost; the ability
 * on hover). 'full': the readable buy view (abilities in full, what you'd pay, an afford tag).
 */
export default function Shop({ state, me, mine, optionFor, onPick, onDenied, variant = 'full', hidden = false }) {
  const pend = state.pending;
  const buying = mine && pend && pend.kind === 'buy';
  const viewer = me != null ? state.players[me] : null;
  const compact = variant === 'compact';
  return (
    <section className={`panel shop-panel ${compact ? 'compact' : 'open'}`} aria-hidden={hidden || undefined} style={hidden ? { visibility: 'hidden' } : undefined}>
      <h2>Shop<small><span className="num">{state.pile.length}</span> in the pile{buying && !compact ? ' · tap a member to recruit' : ''}</small></h2>
      <div className="shop">
        {state.shop.map(uid => {
          const d = cardDef(state, uid);
          const opt = optionFor(`card:${uid}`);
          const plan = viewer ? paymentPlan(state, viewer, uid) : null;
          return (
            <button
              key={uid} data-uid={uid} type="button" className={`card${opt ? ' can' : ''}${buying && !opt ? ' cant' : ''}`}
              style={{ '--c': `var(--${d.quadrant})` }} data-option={opt && !hidden ? opt.id : undefined}
              tabIndex={hidden ? -1 : undefined}
              aria-disabled={!opt} title={`${d.name} · ${d.f}★ · ${d.text}`}
              onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'card', uid, name: d.name }, e.currentTarget))}
            >
              <div className="row"><b className="nm">{d.name}</b><span className="fv num" aria-label={`${d.f} followers`}>{d.f}★</span></div>
              {!compact && <span className="eff">{d.text}</span>}
              <div className="row cost">
                <Cost d={d} plan={compact ? null : plan} />
                {d.n > 1 && !compact && <span><span className="num">{d.n}</span> members</span>}
              </div>
              {!compact && <span className={`afford${opt ? '' : ' none'}`} aria-hidden={!opt}>You can afford</span>}
            </button>
          );
        })}
      </div>
      {state.endEarly && !state.over && !compact && <p className="hint warn">The last +6 is gone — the game ends after this round.</p>}
    </section>
  );
}

/** The shop as a compact strip, affordable first (phone buy sheet and landscape). */
function ShopStrip({ state, me, optionFor, onPick, onDenied }) {
  const viewer = me != null ? state.players[me] : null;
  const box = useRef(null);
  const turn = state.pending ? `${state.round}:${state.pending.player}` : '';
  useEffect(() => { if (box.current) box.current.scrollLeft = 0; }, [turn]);
  const cards = state.shop.map(uid => ({ uid, d: cardDef(state, uid), opt: optionFor(`card:${uid}`) }))
    .sort((a, b) => (!!b.opt - !!a.opt));
  return (
    <div className="strip" role="group" aria-label="Shop" ref={box}>
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
            <span className="sub">
              Pay <span className="num">{t.cost}</span> · {t.colors === 1 ? 'any' : `${t.colors}+ colors`}
              {(() => { const ways = opt && viewer ? followerChoices(state, viewer, t) : []; return ways.length > 1 ? <em className="picks" title="You'll choose how to pay"> ▸</em> : null; })()}
            </span>
            {t.limited && <span className="left-line num" title={`${state.bigLeft} of these left; the last one ends the game after that round`}>{state.bigLeft} left</span>}
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
