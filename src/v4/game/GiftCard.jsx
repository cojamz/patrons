// The gift card (Cory, 2026-10-16: the two-step pick on the seats was "very bad/confusing"). A choice that gives to a
// rival, or pairs two things (boardPick.js giftPick: Good Deed, Kickback, Benefactor, Even Swap, Swap Sides, Trade Seeds,
// Sweet Talk), or a color of yours asked by a space (Goody Bags, Cheap Seats: one row, your counts when you pay), is a small paper card beside the space just used: a plain heading ("A rival you pick gets 2"), then the first
// row (your colors, or your members), then the second (the rivals' faces, the color you get, how many, their members).
// The second row is there from the start, quiet, so the card never changes shape; it lights once a first is picked. The
// picked one stays pressed, and a click on another switches it. Every answer is the engine's own option id.
import { useEffect, useRef, useState } from 'react';
import { cardDef, quadrant } from '../../engine/v4/index.js';
import { costParts, playerColor, seatEmoji } from '../format.js';
import { ResourceGlyph } from './Glyphs.jsx';
import { Pip } from './Rich.jsx';
import { Minion } from '../art/Leader.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { cardColor, onTable } from './Info.jsx';
import { realHover } from '../hover.js';
import { TurnOf } from './parts.jsx';
import './giftcard.css';

const LABELS = { color: [null, null], give: ['Color', 'To'], gift: [null, 'To'], colors: ['Give', 'Get'], amount: ['Get', 'How many'], trade: ['Member', 'For'], steal: [null, null], recruit: [null, null], move: [null, null] };
// a swap with this many members on the card sets them closer (round III: twelve of yours and twenty of theirs), so
// every row shows whole, never cut off at the card's foot (live panel round 1)
const DENSE = 14;

// "Take all N" runs one pick per question the engine asks, as each comes back (kept outside the card, so a re-render
// between two picks never loses it): { key, picks: [{ pid, res }], done: the question already answered }
let takeAll = null;
const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/**
 * onFirst(a | null, el): lift a first (null puts it down); onAnswer(id, el, b): the engine's option. place: where
 * GameScreen puts the card beside the space ({ left, top, up }), as for any plain question.
 */
export default function GiftCard({ state, gift: g, onFirst, onAnswer, busy, place = null, turnOf = null, hover = null, onBack = null }) {
  const pend = state.pending;
  const me = state.players[g.actor];
  const box = useRef(null);
  const step = g.kind === 'gift' || g.kind === 'color' || g.kind === 'steal' || g.kind === 'recruit' || g.kind === 'move' || g.chosen != null ? 2 : 1;
  // Escape closes the card (live panel round 1: it didn't close Kickback's): a lifted first is put down; else the
  // placement is taken back (Undo, while it's offered); else a choice you may decline (Stay put, Recruit nothing) is
  // declined. A hover open over it closes first, on its own Escape.
  const esc = useRef(null);
  esc.current = () => {
    if (busy) return;
    if (g.chosen != null && g.firsts.length > 1) { onFirst(null, null); return; }
    if (onBack) { onBack(); return; }
    const no = g.rest.find(o => o.value == null && /^(no|none|pass|back|skip)$/.test(o.kind || ''));
    if (no) onAnswer(no.id, null, null);
  };
  useEffect(() => {
    const key = e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[data-hover-layer][data-open="1"], .dialog[role="dialog"], [role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      if (esc.current) esc.current();
    };
    addEventListener('keydown', key);
    // a "Take all" still running when the card goes (the game moved on) never answers a later steal
    return () => { removeEventListener('keydown', key); takeAll = null; };
  }, []);
  // the steal's "Take all": the plan's stacks show what each gives up while the button is pointed at
  const [preview, setPreview] = useState(false);
  const allKey = g.kind === 'steal' ? `${g.actor}|${g.title}|${state.round}|${pend.count ? pend.count.of : 0}` : null;
  const optionAt = (pid, res) => (g.seconds.find(x => x.b === `${pid}:${res}`) || {}).o || null;
  const stackEl = (pid, res) => box.current && box.current.querySelector(`.gc-stack[data-pid="${pid}"][data-res="${res}"]`);
  const takeNext = () => {
    const run = takeAll;
    if (!run || run.key !== allKey || run.done === pend || busy) return;
    const next = run.picks.shift();
    // the plan's pick, or (a limit changed what's offered) the engine's own best
    const o = (next && optionAt(next.pid, next.res)) || [...g.seconds].sort((a, b) => (b.o.hint ?? 0) - (a.o.hint ?? 0))[0]?.o;
    if (!o) { takeAll = null; return; }
    run.done = pend;
    if (!run.picks.length) takeAll = null;
    onAnswer(o.id, stackEl(o.target.pid, o.target.res), o.target.pid);
  };
  useEffect(() => {
    if (!takeAll) return undefined;
    if (takeAll.key !== allKey) { takeAll = null; return undefined; }
    // a beat between picks, so each coin's flight reads on its own
    const t = setTimeout(takeNext, 140);
    return () => clearTimeout(t);
  }, [pend, busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const onTakeAll = () => {
    if (busy || !g.plan || !g.plan.length) return;
    setPreview(false);
    takeAll = { key: allKey, picks: g.plan.slice(), done: null };
    takeNext();
  };
  // the row to act on takes the focus, so the keyboard starts where the mouse would
  useEffect(() => {
    const b = box.current && box.current.querySelector(`.gc-row[data-row="${step}"] button:not([disabled])`);
    if (b && (!document.hasFocus || document.hasFocus())) b.focus({ preventScroll: true });
  }, [pend, step]);
  // a second row that scrolls inside the card (a swap in round III: many rivals' members) fades at the edge that has
  // more, so it never reads as cut off
  const more = useRef(null);
  const edge = () => {
    const el = more.current;
    if (!el) return;
    const up = el.scrollTop > 1, down = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    const v = up && down ? 'both' : up ? 'up' : down ? 'down' : '';
    if ((el.dataset.more || '') !== v) { if (v) el.dataset.more = v; else delete el.dataset.more; }
  };
  useEffect(edge);
  const [l1, l2] = LABELS[g.kind];
  const card = uid => cardDef(state, uid);
  const owner = uid => state.players.find(p => p.members.includes(uid));
  const ownerName = uid => { const p = owner(uid); return p ? p.id === g.actor ? 'You' : p.name : 'Shop'; };
  const memberLabel = uid => `${ownerName(uid)}: ${card(uid).name}`;
  const from = g.kind === 'amount' ? (String(pend.prompt).match(/swap (\w+) for/i) || [])[1] : null;
  // the gift comes from the bank, never your own stack (blind testers read "Give 1 to a rival" as paying it, 2026-10-15)
  const head = g.kind === 'give' && g.chosen ? <>A rival you pick gets <b className="num">{g.n}</b><Pip color={g.chosen} /></>
    : g.kind === 'gift' ? <>A rival you pick gets <b className="num">{g.n}</b>{g.color ? <Pip color={g.color} /> : null}</>
      : g.kind === 'colors' && g.chosen ? <>Swap <b className="num">1</b><Pip color={g.chosen} /> for another color</>
        : g.kind === 'amount' && from ? <>Swap {g.chosen ? 'your' : ''}<Pip color={from} /> for {g.chosen ? <Pip color={g.chosen} /> : 'another color'}</>
          : g.kind === 'trade' && g.chosen != null ? <>Swap {card(g.chosen).name} for…</>
            : g.head;
  // what the second row's items pair with, live or (before a first is picked) quiet
  const live = new Map(g.seconds.map(x => [x.b, x.o]));
  const color = g.kind === 'gift' ? g.color : g.chosen;
  const memberHover = uid => (hover ? {
    onPointerEnter: e => { if (realHover(e)) hover.onCardHover(uid, e.currentTarget); },
    onPointerLeave: e => { if (e.pointerType === 'mouse') hover.onCardHover(uid, null); },
  } : {});

  // a member's tile: its picture with what it costs beside it (live panel round 1: the swaps showed no cost, and
  // Even Swap is "equal cost"), its name under them. pay: what you'd pay instead of its printed cost (Snap Up).
  const memberFace = (d, size, pay = null) => {
    const parts = pay || costParts(d, state.resources);
    const total = parts.reduce((t, c) => t + c.n, 0);
    return (
      <>
        <span className="gc-pic">
          <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={size} />
          <span className="gc-cost" data-cost={total} aria-label={parts.length ? `costs ${parts.map(c => `${c.n} ${c.color === 'any' ? 'any' : c.color}`).join(' + ')}` : 'free'}>
            {parts.length ? parts.map((c, k) => <span key={k} className="gc-cd"><b className="num">{c.n}</b><Pip color={c.color} n={c.n} /></span>) : <span className="gc-free">free</span>}
          </span>
        </span>
        <span className="gc-name">{d.name}</span>
      </>
    );
  };
  const dense = g.kind === 'trade' && g.firsts.length + g.others.length > DENSE;
  const pic = dense ? 24 : 28;

  const firstItem = f => {
    const press = e => onFirst(f.chosen ? null : f.a, e.currentTarget);
    const common = { type: 'button', 'data-option': f.id, 'aria-pressed': f.chosen, disabled: busy, onClick: press, className: `gc-item${f.chosen ? ' chosen' : ''}` };
    if (g.kind === 'trade') {
      const d = card(f.a);
      return (
        <button key={f.a} {...common} className={`${common.className} gc-member`} data-uid={f.a} aria-label={`${memberLabel(f.a)}${f.chosen ? ' (picked)' : ''}`} style={{ '--q': cardColor(state, d) }} {...memberHover(f.a)}>
          {memberFace(d, pic)}
        </button>
      );
    }
    const n = g.kind === 'colors' ? me.res[f.a] || 0 : null;
    return (
      <button key={f.a} {...common} className={`${common.className} gc-dot`} data-res={f.a} aria-label={`${n != null ? `Your ${f.a} (${n})` : f.a}${f.chosen ? ', picked' : ''}`} title={f.a}>
        <ResourceGlyph r={f.a} size={24} decorative />
        {n != null && <b className="num">{n}</b>}
      </button>
    );
  };

  const secondItem = b => {
    const o = live.get(b) || null;
    const press = e => o && onAnswer(o.id, e.currentTarget, b);
    const common = { type: 'button', 'data-option': o ? o.id : undefined, disabled: busy || !o, onClick: press, className: 'gc-item' };
    if (g.kind === 'give' || g.kind === 'gift') {
      const p = state.players[b];
      const has = color ? p.res[color] || 0 : null;
      return (
        <button key={b} {...common} className={`${common.className} gc-face`} data-pid={b} style={{ '--pc': playerColor(b) }}
          aria-label={o ? `Give ${g.n || ''} ${color || ''} to ${p.name}${has != null ? ` (has ${has})` : ''}`.replace(/\s+/g, ' ') : `${p.name}: pick a color first`}
          title={o ? `${p.name} has ${has} ${color}` : 'Pick a color first'}>
          <Minion color={playerColor(b)} emoji={seatEmoji(state, b)} size={28} />
          <span className="gc-name">{p.name}</span>
          {/* what they hold of the color (kept in its place, unseen, until a color is picked: the card never changes size) */}
          <span className="gc-has num" style={has == null ? { visibility: 'hidden' } : undefined}>{has ?? 0}<ResourceGlyph r={color || state.resources[0]} size={11} decorative /></span>
        </button>
      );
    }
    if (g.kind === 'color') {
      const n = me.res[b] || 0;
      return (
        <button key={b} {...common} className={`${common.className} gc-dot`} data-res={b} aria-label={g.pay ? `Pay 1 ${b} (you have ${n})` : `${b} (you have ${n})`} title={b}>
          <ResourceGlyph r={b} size={24} decorative />
          {g.pay && <b className="num">{n}</b>}
        </button>
      );
    }
    if (g.kind === 'colors') {
      return (
        <button key={b} {...common} className={`${common.className} gc-dot`} data-res={b} aria-label={o ? `Get 1 ${b}` : `${b}: pick what you give first`} title={b}>
          <ResourceGlyph r={b} size={24} decorative />
        </button>
      );
    }
    if (g.kind === 'amount') {
      return (
        <button key={b} {...common} className={`${common.className} gc-amt`} data-n={b} aria-label={o ? `Swap ${b} ${from || ''} for ${b} ${g.chosen}` : `${b}: pick a color first`}>
          <b className="num">{b}</b>
        </button>
      );
    }
    return null;
  };

  // Both sides show their real holder: a Red action may swap two rivals or a rival with the shop.
  const memberGroups = (uids, first = false) => {
    const groups = new Map();
    for (const u of uids) { const pid = owner(u)?.id ?? 'shop'; if (!groups.has(pid)) groups.set(pid, []); groups.get(pid).push(u); }
    return [...groups].map(([pid, uids]) => (
      <span key={pid} className="gc-group" data-pid={pid}>
        <span className="gc-who gc-holder">
          {pid !== 'shop' && <Minion color={playerColor(pid)} emoji={seatEmoji(state, pid)} size={20} />}
          <span className="gc-who-name">{pid === 'shop' ? 'Shop' : pid === g.actor ? 'You' : state.players[pid].name}</span>
        </span>
        <span className="gc-group-items">{uids.map(u => {
          if (first) return firstItem(g.firsts.find(f => f.a === u));
          const o = live.get(u) || null, d = card(u);
          return (
            <button key={u} type="button" className="gc-item gc-member" data-uid={u} data-option={o ? o.id : undefined} disabled={busy || !o} style={{ '--q': cardColor(state, d) }}
              aria-label={o ? memberLabel(u) : `${memberLabel(u)}: ${g.chosen == null ? 'pick a member first' : 'not eligible'}`} {...memberHover(u)}
              onClick={e => o && onAnswer(o.id, e.currentTarget, u)}>
              {memberFace(d, pic)}
            </button>
          );
        })}</span>
      </span>
    ));
  };

  // the steal: each rival's face, then the stacks you can take from (one coin a click); a rival you can't take from
  // says why, quietly, in its place
  const plan = new Map();
  if (preview && g.plan) for (const x of g.plan) plan.set(`${x.pid}:${x.res}`, (plan.get(`${x.pid}:${x.res}`) || 0) + (x.take || 1));
  const stealRows = () => g.rivals.map(r => (
    <span key={r.pid} className="gc-group gc-rival" data-pid={r.pid} data-dim={r.stacks.length ? undefined : '1'}>
      <span className="gc-who" title={r.name}><Minion color={playerColor(r.pid)} emoji={seatEmoji(state, r.pid)} size={24} /><span className="gc-who-name">{r.name}</span></span>
      <span className="gc-group-items">
        {r.stacks.map(st => {
          const k = plan.get(`${r.pid}:${st.res}`) || 0;
          return (
            <button key={st.res} type="button" className="gc-item gc-dot gc-stack" data-pid={r.pid} data-res={st.res} data-option={st.o.id} data-plan={k || undefined} disabled={busy}
              aria-label={`Take ${st.o.take || 1} ${st.res} from ${r.name} (has ${st.has})`} title={`Take ${st.o.take || 1} ${st.res} from ${r.name}`}
              onClick={e => onAnswer(st.o.id, e.currentTarget, r.pid)}>
              <ResourceGlyph r={st.res} size={24} decorative />
              <b className="num">{st.has}</b>
              {k > 0 && <i className="gc-plan num" aria-hidden="true">−{k}</i>}
            </button>
          );
        })}
        {!r.stacks.length && <span className="gc-why">{r.why}</span>}
      </span>
    </span>
  ));
  const planTotal = g.plan?.reduce((n, x) => n + (x.take || 1), 0) || 0;
  const planWords = g.plan ? (() => {
    const by = new Map();
    for (const x of g.plan) { const k = `${x.pid}:${x.res}`; by.set(k, (by.get(k) || 0) + (x.take || 1)); }
    return [...by].map(([k, n]) => { const [pid, res] = k.split(':'); return `${n} ${res} from ${state.players[pid].name}`; }).join(', ');
  })() : '';
  // the members you can recruit from the row: picture, name and what you pay
  const recruitItems = () => g.seconds.map(({ o, b: uid }) => {
    const d = card(uid);
    const pay = (String(o.label).match(/pay (\d+)$/) || [])[1];
    return (
      <button key={uid} type="button" className="gc-item gc-member" data-uid={uid} data-option={o.id} disabled={busy} style={{ '--q': cardColor(state, d) }}
        aria-label={`${d.name}${pay != null ? `, pay ${pay}` : ''}`} {...memberHover(uid)} onClick={e => onAnswer(o.id, e.currentTarget, uid)}>
        {memberFace(d, 28, pay != null ? [{ color: 'any', n: Number(pay) }] : null)}
      </button>
    );
  });
  // the minion's move: the open spaces by name too (the card may sit over some of them on the wheel)
  const spaceItems = () => g.seconds.map(({ o, b: key }) => {
    const q = Number(String(key).split('-')[0]);
    let res = null;
    try { res = quadrant(state.quadrants[q]).resource; } catch { /* none */ }
    const name = String(o.label).replace(/\s*\([^)]*\)$/, '');
    return (
      <button key={key} type="button" className="gc-item gc-space" data-space={key} data-option={o.id} disabled={busy} aria-label={`Move to ${o.label}`} onClick={e => onAnswer(o.id, e.currentTarget, key)}>
        {res && <Pip color={res} />}<span className="gc-name">{name}</span>
      </button>
    );
  });
  const headOf = g.kind === 'steal' ? <>Take <b className="num">{g.n}</b>{g.color ? <Pip color={g.color} /> : null}</>
    : g.kind === 'move' ? <>{g.head}</> : g.kind === 'recruit' ? <>{g.head}</> : head;
  const sub = g.kind === 'move' ? <>{g.from ? <>It’s on {g.from}. </> : null}{g.sub}</> : g.sub;
  const farBody = g.kind === 'steal' ? (
    <div className="gc-row" data-row="2" data-live="1">
      <div className="gc-items gc-theirs">{stealRows()}</div>
    </div>
  ) : g.kind === 'recruit' ? (
    <div className="gc-row" data-row="2" data-live="1">
      <div ref={more} onScroll={edge} className="gc-items">{recruitItems()}</div>
    </div>
  ) : g.kind === 'move' ? (
    <div className="gc-row" data-row="2" data-live="1">
      <div className="gc-items">{spaceItems()}</div>
    </div>
  ) : null;
  const far = g.kind === 'steal' || g.kind === 'recruit' || g.kind === 'move';

  return (
    <section ref={box} className={`prompt choice plain gift-card${place ? ` at-space ${place.up ? 'below' : 'above'}` : ''}`} role="group" aria-label={pend.prompt}
      data-gift={g.kind} data-step={step} data-dense={dense ? '1' : undefined} style={place ? { left: place.left, top: place.top } : undefined}>
      {turnOf && <TurnOf player={turnOf} />}
      <header className="gc-head">
        {g.title && <small className="gc-title">{g.title}{g.left != null ? <> · <span className="num pick-left" data-left={g.left}>{g.left}</span> left</> : null}{g.done ? <> · <span className="num">{g.done}</span> swapped</> : null}</small>}
        <p className="gc-what">{far ? headOf : head}</p>
        {sub && <p className="gc-sub">{sub}</p>}
      </header>
      {far ? farBody : null}
      {!far && l1 && (
        <div className="gc-row" data-row="1" data-live={step === 1 ? '1' : undefined}>
          <span className="gc-lbl">{l1}</span>
          <div className={`gc-items${g.kind === 'trade' ? ' gc-theirs' : ''}`}>{g.kind === 'trade' ? memberGroups(g.firsts.map(f => f.a), true) : g.firsts.map(firstItem)}</div>
        </div>
      )}
      {!far && (
        <div className="gc-row" data-row="2" data-live={step === 2 ? '1' : undefined}>
          {l2 && <span className="gc-lbl">{l2}</span>}
          <div ref={more} onScroll={edge} className={`gc-items${g.kind === 'trade' ? ' gc-theirs' : ''}`}>{g.kind === 'trade' ? memberGroups(g.others) : g.others.map(secondItem)}</div>
        </div>
      )}
      {(g.rest.length > 0 || (g.plan && g.plan.length > 1)) && (
        <div className="gc-rest">
          {g.plan && g.plan.length > 1 && (
            <button type="button" className="btn gc-rest-btn gc-all" data-take-all={planTotal} disabled={busy} title={`Takes ${planWords}`} aria-label={`Take all ${planTotal}: ${planWords}`}
              onPointerEnter={() => setPreview(true)} onPointerLeave={() => setPreview(false)} onFocus={() => setPreview(true)} onBlur={() => setPreview(false)} onClick={onTakeAll}>
              Take all <b className="num">{planTotal}</b>
            </button>
          )}
          {g.rest.map(o => <button key={o.id} type="button" className="btn gc-rest-btn" data-option={o.id} disabled={busy} onClick={e => onAnswer(o.id, e.currentTarget, null)}>{o.label}</button>)}
        </div>
      )}
    </section>
  );
}
