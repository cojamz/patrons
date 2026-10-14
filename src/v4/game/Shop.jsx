// The shop (6 face-up members) and the buy tray (follower buys, member activations, Pass).
import { cardDef, paymentPlan, followerChoices, TIERS, tierLeft } from '../../engine/v4/index.js';
import { useEffect, useRef, useState } from 'react';
import { costParts, tierCostText } from '../format.js';
import { realHover } from '../hover.js';
import { Rich, CostPips } from './Rich.jsx';

// long words get a soft hyphen in the middle: it shows only when the word must break ("Doppel-ganger")
const softBreak = name => name.replace(/[A-Za-z]{9,}/g, w => `${w.slice(0, Math.ceil(w.length / 2))}\u00AD${w.slice(Math.ceil(w.length / 2))}`);
const total = spend => Object.values(spend).reduce((a, b) => a + b, 0);

function Cost({ d, plan, disc = false, res = null }) {
  // the list cost, as printed on every card; what you'd pay right now goes on a second line when it differs
  const parts = costParts(d, res);
  const dots = list => <CostPips parts={list} />;
  const listText = parts.map(c => `${c.n} ${c.color}`).join(' + ') || 'free';
  const payText = plan ? (Object.entries(plan).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'free') : null;
  const differs = plan && (total(plan) < d.s + d.w || payText !== listText);
  return (
    <span className="cost-box">
      <span>{parts.length ? dots(parts) : 'free'}</span>
      {differs && <span className="youd">{payText === 'free' ? (disc ? 'free with Discount' : 'free for you') : `you’d pay ${payText}`}</span>}
    </span>
  );
}

/**
 * The shop. variant 'compact': a fixed row under the board (full names on two lines, ★ and list cost; the ability
 * on hover). 'full': the readable buy view (abilities in full, what you'd pay, an afford tag).
 */
export default function Shop({ state, me, mine, optionFor, onPick, onDenied, variant = 'full', hidden = false, onHoverCard = null }) {
  const pend = state.pending;
  const buying = mine && pend && pend.kind === 'buy';
  const viewer = me != null ? state.players[me] : null;
  const compact = variant === 'compact';
  return (
    <section className={`panel shop-panel ${compact ? 'compact' : 'open'}`} aria-hidden={hidden || undefined} style={hidden ? { visibility: 'hidden' } : undefined}>
      <h2>Shop<small><span className="num">{state.pile.length}</span> in the pile{buying && !compact ? ` · ${coarse() ? 'tap' : 'click'} a member to recruit` : ''}</small></h2>
      <div className="shop">
        {[...state.shop, ...(!compact ? pileUids(state, mine) : [])].map(uid => {
          const d = cardDef(state, uid);
          const fromPile = !state.shop.includes(uid);
          const opt = optionFor(`card:${uid}`);
          const plan = viewer ? paymentPlan(state, viewer, uid) : null;
          return (
            <button
              key={uid} data-uid={uid} type="button" className={`card${opt ? ' can' : ''}${buying && !opt ? ' cant' : ''}`}
              style={{ '--c': `var(--${d.quadrant})` }} data-option={opt && !hidden ? opt.id : undefined}
              tabIndex={hidden ? -1 : undefined}
              aria-disabled={!opt} title={compact && onHoverCard ? undefined : `${d.name} · ${d.f}★ · ${d.text}`}
              onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'card', uid, name: d.name }, e.currentTarget))}
              // the compact row is too small to read: hovering a card shows it in full (touch: a tap does)
              onPointerEnter={compact && onHoverCard ? e => { if (realHover(e)) onHoverCard(uid, e.currentTarget); } : undefined}
              onPointerLeave={compact && onHoverCard ? e => { if (e.pointerType === 'mouse') onHoverCard(null); } : undefined}
            >
              {compact ? (
                <>
                  <div className="row top"><b className="nm">{d.name}</b><span className="fv num" aria-label={`${d.f} followers`}>{d.f}★</span></div>
                  <span className="eff1"><Rich text={d.text} /></span>
                  <div className="row cost"><Cost d={d} plan={null} res={state.resources} /></div>
                </>
              ) : (
                <div className="row"><b className="nm">{d.name}</b><span className="fv num" aria-label={`${d.f} followers`}>{d.f}★</span></div>
              )}
              {fromPile && !compact && (
                <span className="from-pile">From the pile (Insider)</span>
              )}
              {!compact && <span className="eff"><Rich text={d.text} /></span>}
              {!compact && <div className="row cost">
                <Cost d={d} plan={plan} disc={!!(viewer && viewer.discount)} res={state.resources} />
                {d.n > 1 && <span><span className="num">{d.n}</span> members</span>}
              </div>}
              {!compact && <span className={`afford${opt ? '' : ' none'}`} aria-hidden={!opt}>You can afford</span>}
            </button>
          );
        })}
      </div>
      {state.endEarly && !state.over && !compact && <p className="hint warn">The last +{TIERS.find(t => t.clock)?.get} is gone — the game ends after this round.</p>}
    </section>
  );
}

/** Cards you may recruit from the top of the pile right now (Insider): offered as buy options marked fromPile. */
const pileUids = (state, mine) => (mine && state.pending && state.pending.kind === 'buy'
  ? state.pending.options.filter(o => o.kind === 'card' && o.fromPile).map(o => o.uid) : []);

/** The shop as a compact strip, affordable first (phone buy sheet and landscape). */
function ShopStrip({ state, me, mine = false, optionFor, onPick, onDenied }) {
  const viewer = me != null ? state.players[me] : null;
  const box = useRef(null);
  const turn = state.pending ? `${state.round}:${state.pending.player}` : '';
  useEffect(() => { if (box.current) box.current.scrollLeft = 0; }, [turn]);
  // a strip wider than the screen says so: page dots under it and a fade on the side with more
  const [pager, setPager] = useState({ over: false, at: 0, end: true });
  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const check = () => {
      const over = el.scrollWidth - el.clientWidth > 4;
      const kids = [...el.children];
      const at = Math.max(0, kids.findIndex(k => k.offsetLeft + k.offsetWidth / 2 >= el.scrollLeft + 4));
      setPager(p => { const n = { over, at, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 }; return p.over === n.over && p.at === n.at && p.end === n.end ? p : n; });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null;
    if (ro) ro.observe(el);
    return () => { el.removeEventListener('scroll', check); if (ro) ro.disconnect(); };
  }, []);
  const cards = [...state.shop, ...pileUids(state, mine)].map(uid => ({ uid, d: cardDef(state, uid), opt: optionFor(`card:${uid}`), fromPile: !state.shop.includes(uid) }))
    .sort((a, b) => (!!b.opt - !!a.opt));
  return (
    <>
    <div className={`strip${pager.over && !pager.end ? ' more-r' : ''}${pager.over && pager.at > 0 ? ' more-l' : ''}`} role="group" aria-label={`Shop, ${cards.length} cards${pager.over ? ', swipe for more' : ''}`} ref={box}>
      {cards.map(({ uid, d, opt, fromPile }) => {
        const plan = viewer ? paymentPlan(state, viewer, uid) : null;
        return (
          <button
            key={uid} type="button" className={`mini${opt ? ' can' : ''}`} style={{ '--c': `var(--${d.quadrant})` }}
            aria-disabled={!opt} title={`${d.name} · ${d.f}★ · ${d.text}`}
            onClick={e => (opt ? onPick(opt.id) : onDenied && onDenied({ type: 'card', uid, name: d.name }, e.currentTarget))}
          >
            <span className="row"><b>{d.name}</b><span className="num">{d.f}★</span></span>
            {fromPile && <span className="from-pile">From the pile (Insider)</span>}
            <small><Rich text={d.text} /></small>
            <span className="row cost"><Cost d={d} plan={plan} res={state.resources} />{opt && <span className="afford" aria-label="you can afford this" title="You can afford this" />}</span>
          </button>
        );
      })}
    </div>
    {pager.over && (
      <div className="strip-dots" aria-hidden="true">
        <span className="strip-hint">{cards.length} cards · swipe</span>
        {cards.map((c, k) => <i key={c.uid} className={k === pager.at ? 'on' : ''} />)}
      </div>
    )}
    </>
  );
}

const buying_key = state => (state.pending ? `${state.round}:${state.pending.player}:${state.pending.kind}` : '');
const coarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const spendText = v => Object.entries(v).filter(([, n]) => n).map(([c, n]) => `${n} ${c}`).join(', ');

export function BuyTray({ state, me, mine, optionFor, onPick, onDenied }) {
  const pend = state.pending;
  const viewer = me != null ? state.players[me] : null;
  const extras = mine && pend ? pend.options.filter(o => o.kind === 'use' || o.kind === 'toggle') : [];
  // Release (base rule): once per round, discard a member for its cost in any colors (the colors come next)
  const releases = mine && pend && pend.kind === 'buy' ? pend.options.filter(o => o.kind === 'release') : [];
  const [relOpen, setRelOpen] = useState(false);
  const relTurn = buying_key(state);
  useEffect(() => { setRelOpen(false); }, [relTurn]);
  const pass = optionFor('pass');
  const buying = mine && pend && pend.kind === 'buy';
  return (
    <div className={`fbuy${buying ? ' live' : ''}`} style={{ '--tiers': TIERS.length, '--tiers-narrow': TIERS.length > 3 ? 2 : TIERS.length }} role="group" aria-label="Buy followers or pass">
      <ShopStrip state={state} me={me} mine={mine} optionFor={optionFor} onPick={onPick} onDenied={onDenied} />
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
              Pay <span className="num">{t.cost}</span> · {t.colors > 1 ? `${t.colors}+ colors` : 'any'}
              {(() => { const ways = opt && viewer ? followerChoices(state, viewer, t) : []; return ways.length > 1 ? <em className="picks" title="You'll choose how to pay"> ▸</em> : null; })()}
            </span>
            {t.limited && <span className="left-line num" title={`${tierLeft(state, t)} of these left${t.clock ? '; the last one ends the game after that round' : ''}`}>{tierLeft(state, t)} left</span>}
          </button>
        );
      })}
      {extras.map(o => (
        <button key={o.id} type="button" className="btn" data-option={o.id} onClick={() => onPick(o.id)}>{o.label}</button>
      ))}
      {releases.length > 0 && (
        // folded by default: it's a once-a-round extra, and the buy row stays the buy row. The list is only in the page
        // while open, so nothing hidden carries a live option.
        <div className={`release-row${relOpen ? ' open' : ''}`}>
          <button type="button" className="btn ghost rel-toggle" aria-expanded={relOpen} onClick={() => setRelOpen(o => !o)}
            title="Once per round: discard one of your members (it goes to the bottom of the pile) for its cost, in any colors you choose.">
            Release a member <small>once a round · its cost back in any colors</small>
          </button>
          {relOpen && (
            <div className="rel-list" role="group" aria-label="Release which member">
              {releases.map(o => {
                const d = state.cards[o.uid] ? cardDef(state, o.uid) : null;
                return (
                  <button key={o.id} type="button" className="btn ghost rel" data-option={o.id} onClick={() => onPick(o.id)} style={d ? { '--c': `var(--${d.quadrant})` } : undefined}
                    title={o.label}>{d ? <>{d.name} <span className="num">+{d.s + d.w}</span></> : o.label}</button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <button
        type="button" className={`btn pass${pass ? '' : ' idle'}`} title="End your turn without buying" data-option={pass ? 'pass' : undefined} aria-disabled={!pass}
        onClick={e => (pass ? onPick('pass') : onDenied && onDenied({ type: 'pass' }, e.currentTarget))}
      >Pass</button>
    </div>
  );
}
