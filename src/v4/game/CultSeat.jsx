// A cult at the table (Cory's layout revision, 2026-10-14): every player's cult sits at a corner of the wheel like
// a chair at a table. Its leader (the player's emoji) with the minions still to place floating around it, its
// members as a small crowd of figures, its follower mark and total, and its resources as small stacks. Yours sits
// nearest you and is a little larger, with Use/switch on members you can use now. Hover or tap the cult for its
// card (resources, members, last moves); hover or tap a member for that member's card.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { followers, quadrant, cardDef } from '../../engine/v4/index.js';
import { memberChips, playerColor, newLogLines, seatEmoji } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId, sphereShare } from '../art/index.js';
import { Follower } from '../art/Follower.jsx';
import { realHover } from '../hover.js';
import { Tip, MemberCard, cardColor, onTable } from './Info.jsx';
import { MemberActions, MemberSwitch, useUseResult, UseResult } from './MemberUse.jsx';
import { usableNow, loadedUse, safeThisRound, memberAsks } from './memberUse.js';
import { ResourceGlyph, LeaderRing } from './Glyphs.jsx';
import { Minion } from '../art/Leader.jsx';
import { seatTurns } from './seats.js';
import { seatRanks } from './RankRow.jsx';
import { incomeOf, incomeTerms } from './build.js';
import Tick from './Tick.jsx';
import { Rich } from './Rich.jsx';
import { MO } from '../motion.js';
import './lamp-b.css';

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/**
 * props: state, pid (whose cult), me (the viewer), mine (it's the viewer's own cult: larger, with Use buttons),
 * now (their turn), react (recent reactions: { leader: 'gesture'|'celebrate'|'scheme', members: { defId: n } }),
 * hover (useHoverCards), optionFor/onPick (your members' Use / switch), total (the follower count to show, while the
 * results' end-game scoring counts it up).
 */
export default function CultSeat({ state, pid, me = null, mine = false, now = false, react: given = null, hover = null, optionFor = () => null, onPick = () => {}, pick = null, total = null }) {
  const p = state.players[pid];
  const rootEl = useRef(null);
  const own = useCultReactions(state, pid, rootEl);
  const react = given || own;
  // (total: the count so far while the results' scoring runs (FinalScore.jsx); otherwise the engine's)
  const f = total ?? followers(state, p);
  // grouped by color (the approved plate: "the color mix is their lean"), table order, colorless last
  const colorAt = d => (onTable(state, d) ? state.quadrants.indexOf(d.quadrant) : state.quadrants.length);
  const groups = memberChips(state, p).map((g, k) => ({ g, k })).sort((a, b) => colorAt(a.g.def) - colorAt(b.g.def) || a.k - b.k).map(x => x.g);
  // your members you can use right now, with an effect (the engine's own dry run; one it would refuse stays unlit)
  const safe = safeThisRound(state, pid);
  // what a use just did, over that member for a moment (even "+0"); and the member giving a second buy hops as it does
  const result = useUseResult(state, pid);
  const pend = state.pending;
  const extraBuyNow = !!(mine && pend && pend.player === pid && pend.kind === 'buy' && pend.extra && !state.over);
  const givesExtra = g => extraBuyNow && g.uids.some(u => { const c = state.cards[u]; return !(c.spent && c.spent.extraBuy === state.round) && !!cardDef(state, u).extraBuy; });
  const ready = new Set(mine ? [...usableNow(state, pid).filter(x => optionFor(`use:${x.uid}`)).map(x => x.uid), ...memberAsks(state, pid).keys()] : []); // + a member asking you now (memberUse.js)
  // the turns in plain words (Cory, 2026-10-16: the rail confused him), on yours only: "your turn in 3" (seats.js
  // seatTurns, read off the engine's queue); a rival's seat says nothing (Cory, 2026-10-15: "next" dropped)
  const turn = seatTurns(state, me)[pid] || null;
  // who's winning lives here now (no score row): this chair's place, lit when it leads, the margin on hover
  const rank = seatRanks(state, me)[pid] || null;
  // its build at one glance: its members (grouped by color) and what they hand it each round (the engine's round start)
  const income = incomeOf(state, pid);
  const incomeParts = income ? Object.entries(income.res).filter(([, n]) => n > 0) : [];
  // a dry run of next round's start: a part that hangs on a condition says so ("+1 purple per 2 purple"), and the hover
  // says each member's rule (build.js incomeTerms, f8: Late Bloomer read as a sure +1 every round)
  const terms = incomeParts.length || (income && income.followers > 0) ? incomeTerms(state, p) : null;
  const incomeWords = (terms ? terms.groups : []).flatMap(g => g.parts.map(([r, n], i) => `+${n} ${r}${g.cond && i === g.parts.length - 1 ? ` ${g.cond}` : ''}`))
    .concat(income && income.followers > 0 ? [`+${income.followers} follower${income.followers === 1 ? '' : 's'}`] : []);
  // the hover's sentence: a comma after each condition, so "+1 if fewest, +2 per 2 purple" never runs together
  const incomeText = incomeWords.map((w, i) => (i < incomeWords.length - 1 && /[a-z]$/.test(w) && !/^\+\d+ \w+$/.test(w) ? `${w},` : w)).join(' ');
  // member figures shown before "+N": one row beside the "each round" line, so every chair keeps one fixed height
  // (the seat column is narrower now: six figures ran under "each round +3●"; each income part takes a figure's room)
  // (design pod, w2b #22: figures are 32px on the laptop so a rival's members can be told apart: six and a "+N" to a
  // row, and the "each round" line takes about one figure per part plus its label)
  // a steal pick that pays the thief's Robin Hood here (boardPick.js seatPart): the second row says so, in place of the
  // "each round" line, so the figures fold early to leave it room
  const bonus = pick && pick.bonus ? pick.bonus : null;
  // On a laptop the row shows as many figures as fit (w3a A16: yours folded to three and a "+1" beside "each round",
  // w3b: a rival's seventh member folded with room to spare), measured from the row's own width, the "each round" block
  // beside it and a figure's width. None of these changes with how many are shown, so measuring can't feed back (the
  // TurnCard lesson, 2026-10-15). Phones keep fixed counts: their crowd wraps.
  // "each round" stands in one spot on every seat, yours too: beside the figures, at the row's right. Yours used to move
  // up beside your name whenever it cleared your turn words, so it jumped between rounds (blind testers, 2026-10-15).
  // (live panel r1, G4: "+N more" hid members, so "Most members" couldn't be counted) the row now leads with the count,
  // always in view, and the figures stand 24px (the sprites' own pixels) two rows deep, so twice as many show
  const fit = useFigureFit(rootEl);
  // a choice that picks one of this seat's members (Doppelganger, Echo, a swap, a steal) shows every member, never "+N"
  // (Cory, 2026-10-15: "doppleganger can only copy whats available"); the row grows for the choice and folds after
  const pickAll = !!(pick && pick.members && groups.some(g => g.uids.some(u => pick.members[u])));
  const MAX = pickAll ? groups.length : fit ? (fit.all >= groups.length ? groups.length : fit.withMore) : bonus ? 3 : incomeWords.length ? Math.max(1, 4 - incomeWords.length) : 6;
  const nMembers = p.members.length;
  // your starting pick, when it's yours to make here (the engine's options, through the same optionFor as Use)
  const setupPick = mine && pend && pend.kind === 'setup' && pend.player === pid && !state.over
    ? (() => { const options = pend.options.filter(o => optionFor(o.id)); const m = /\((\d) of 2\)/.exec(pend.prompt || ''); return options.length ? { options, k: m ? Number(m[1]) : 1 } : null; })()
    : null;
  // what's never folded into "+N", most needed first: one you can use now or the board picker lights (folded, it could
  // only be picked from the keyboard list), then a use still in hand (a rival's loaded Raider is a threat to see
  // coming, w2b #21); each takes the place of the last one shown that's needed less
  // then the newest member (the engine appends every arrival: a recruit, a Poach, a swap), so the piece that flies in
  // lands on its own figure, never on "+N more" (the travel gate's Poach landed on nothing, 2026-10-15)
  const newest = p.members.length ? p.members[p.members.length - 1] : null;
  const need = g => (g.uids.some(u => ready.has(u) || !!(pick && pick.members && pick.members[u]) || (result && result.uid === u)) || givesExtra(g) ? 2 : g.uids.includes(newest) ? 1.5 : g.uids.some(u => loadedUse(state, u)) ? 1 : 0);
  const keep = groups.slice(0, MAX);
  for (const g of groups.slice(MAX).filter(need).sort((x, y) => need(y) - need(x))) {
    const k = keep.map(need).reduce((at, n, i) => (n < need(g) && (at < 0 || n <= need(keep[at])) ? i : at), -1);
    if (k < 0) continue;
    keep.splice(k, 1); keep.push(g);
  }
  const shown = groups.filter(g => keep.includes(g));
  const rest = groups.filter(g => !shown.includes(g)).reduce((s, g) => s + g.count, 0);
  // what the pointer is on decides the card, and the card opens right next to it (w3a A8): the follower total opens where
  // its followers came from (w3b #39); anywhere else on the seat (name, leader, body, resources) the seat card
  const pointed = e => (e.target && e.target.closest && e.target.closest('.cs-total, .cs-leader, .cs-who, .cs-stack, .cs-res, .cs-crowd, .cs-build, .cs-foot')) || e.currentTarget;
  const openSeat = (e, pinned) => {
    if (!hover) return;
    const el = pointed(e);
    if (el.classList && el.classList.contains('cs-total')) hover.onFollowersHover(pid, el, { pinned });
    else hover.onSeatHover(pid, el, { pinned });
  };
  // the seat's body and resource row open its card too (w3b #47), but a member figure opens its own card
  // (a stack in a pick says its own thing: why it's dim, or nothing while lit; the seat card over it hid the reason, w4b #8)
  const onFig = e => !!(e.target && e.target.closest && e.target.closest('.cs-member, .cs-pick-seat, button, .cs-stack[data-why], .cs-stack.pick-on'));
  const bodyHover = {
    onPointerEnter: e => { if (realHover(e) && !onFig(e)) openSeat(e, false); },
    onPointerMove: e => { if (realHover(e) && hover && !onFig(e)) openSeat(e, false); },
    onPointerLeave: e => { if (e.pointerType === 'mouse' && hover) hover.onSeatHover(pid, null); },
  };
  // the turn words under the name explain the turn order when pointed at, not the seat (w2a #28); crossing between the
  // two swaps which one is open
  const onRail = e => !!(e.target && e.target.closest && e.target.closest('.cs-turn'));
  const railIn = useRef(false);
  return (
    <section ref={rootEl} className={`lt-cult-seat${mine ? ' mine' : ''}${now ? ' now' : ''}${setupPick ? ' setup-pick' : ''}${pick ? ` picking${pick.lit ? ' pick-lit' : ''}${pick.dim ? ' pick-dim' : ''}${pick.seatMode ? ' pick-seat' : ''}${pickAll ? ' pick-all' : ''}` : ''}`} data-cult={pid} data-pick={pick ? (pick.lit ? 'on' : pick.dim ? 'off' : 'part') : undefined} data-seat={pid} style={{ '--pc': playerColor(pid) }}
      // a click beside the lit picks in this chair (w3a A53: "a click 30px off did nothing, and no 'pick a lit stack'")
      // makes them pulse once, so the miss says where to click
      onClick={pick && pick.lit && !pick.seatMode ? e => {
        if (e.target.closest && e.target.closest('[data-option], .cs-pick-member, .cs-stack.pick-on')) return;
        const el = e.currentTarget;
        el.classList.remove('pick-nudge'); void el.offsetWidth; el.classList.add('pick-nudge');
        setTimeout(() => el.classList.remove('pick-nudge'), 700);
      } : undefined}
      aria-label={`${mine ? 'Your cult' : `${p.name}'s cult`}: ${f} follower${f === 1 ? '' : 's'}, ${p.members.length} member${p.members.length === 1 ? '' : 's'}, ${p.left} minion${p.left === 1 ? '' : 's'} to place${now ? ', their turn' : ''}`}>
      <header className="cs-head" role="button" tabIndex={0} aria-haspopup="dialog" data-hint={`${p.name}: ${f} follower${f === 1 ? '' : 's'}. Show their cult.`}
        onPointerEnter={e => { railIn.current = onRail(e); if (realHover(e) && !railIn.current) openSeat(e, false); }}
        onPointerMove={e => {
          const r = onRail(e);
          if (!realHover(e) || !hover) return;
          if (r !== railIn.current) { railIn.current = r; if (r) { hover.onSeatHover(pid, null); return; } }
          // still on the head: its card stays (or opens now, if it was crossed on the way to another open card)
          if (!r) openSeat(e, false);
        }}
        onPointerLeave={e => { railIn.current = false; if (e.pointerType === 'mouse' && hover) hover.onSeatHover(pid, null); }}
        onClick={e => openSeat(e, true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSeat(e, true); } }}>
        <span className={`cs-leader${react && react.leader ? ` react-${react.leader}` : ''}`}><LeaderRing state={state} id={pid} size={mine ? 40 : 32} orbit={false} face={!mine} /></span>
        <span className="cs-who">
          <b>{mine ? 'You' : p.name}</b>
          {/* on yours, its place in the turns in words under the name: "your turn in 3" */}
          {turn && <Tip className={`cs-turn ${turn.kind}`} data-turn={turn.kind} data-turn-n={turn.n ?? undefined}
            label={turn.title} content={() => <div className="pop-card gloss"><b>Turn order</b><span>{turn.title}</span></div>}>{turn.say}</Tip>}
        </span>
        <span className={`cs-total${rank && rank.lead ? ' lead' : ''}`} data-followers={f} data-rank={rank ? rank.place : undefined} title={`Score: ${f} follower${f === 1 ? '' : 's'}. Most followers at the end wins.${rank && rank.title ? ` ${rank.title}` : ''}`} data-hint={`Score: ${f} followers`}><Tick value={f} color={playerColor(pid)} className="num" float={false} /><Follower size={mine ? 14 : 12} title={`${f} followers`} /></span>
      </header>
      {/* the minions still to place this round, standing in a column at the panel's right edge (Cory: "way less noisy,
          and easier to grok quickly how many they have left"); each bobs on its own slow phase. A placement flies from here. */}
      <span className="cs-minions" data-left={p.left || 0} data-n={Math.max(0, p.left || 0)} title={`${p.left || 0} minion${p.left === 1 ? '' : 's'} to place this round`}>
        {Array.from({ length: Math.max(0, p.left || 0) }, (_, k) => (
          <i key={k} className="cs-min" data-minion={pid} data-k={k} style={{ '--ph': (((pid * 3 + k) * 0.618034) % 1).toFixed(3) }}>
            <Minion color={playerColor(pid)} emoji={seatEmoji(state, pid)} size={mine ? 16 : 14} />
          </i>
        ))}
      </span>
      {/* the starting pick, in your own chair, lit (Cory, 2026-10-15: "I looked around for 10s before I realized that's
          what I needed to do. It could just show it IN the player card"): it stands where your members will, until both
          picks are in */}
      {setupPick && (
        <div className="cs-setup" role="group" aria-label={`Pick a starting resource (${setupPick.k} of 2)`} data-setup-k={setupPick.k}>
          <small className="cs-setup-say">Pick a starting resource <span className="num">{setupPick.k}</span> of 2</small>
          <span className="cs-setup-row">
            {setupPick.options.map(o => {
              const res = state.quadrants.includes(o.value) ? quadrant(o.value).resource : o.value;
              return (
                <button key={o.id} type="button" className="token cs-setup-token" data-option={o.id} style={{ '--c': `var(--${o.value})` }}
                  onClick={e => onPick(o.id, e.currentTarget)} aria-label={`Take 1 ${res}`} title={`Start with 1 ${res}`}>
                  <ResourceGlyph r={res} size={18} decorative /><span className="tk-name">{res}</span>
                </button>
              );
            })}
          </span>
        </div>
      )}
      <div className="cs-crowd" {...bodyHover} role="group" aria-label={`${mine ? 'Your' : `${p.name}'s`} members: ${nMembers}`}>
        {/* how many members, always in view (live panel r1: "Most members" is a prize, so the count can never fold away);
            the label above the number, like "each round" across the row. Pointing at it opens the seat's card, which
            lists every member. */}
        <span className="cs-count" data-member-count={nMembers} title={`${mine ? 'You have' : `${p.name} has`} ${nMembers} member${nMembers === 1 ? '' : 's'}`}>
          <small>{nMembers === 1 ? 'member' : 'members'}</small><b className="num">{nMembers}</b>
        </span>
        <span className="cs-figs" style={fit ? { maxWidth: `${fit.per * fit.cell}px` } : undefined}>
        {shown.map(g => {
          const d = g.def;
          // yours to use now (Cory, 2026-10-15): the figure is lit, and its card carries the Use button (MemberUse.jsx)
          const readyUid = mine ? g.uids.find(u => ready.has(u)) : undefined;
          // a use still in hand, anyone's: subdued light, so a rival's loaded Raider can be seen coming (w2b #21)
          // (not at game over: the results' seats show who holds what, never a use state, w3b #53)
          const loaded = !state.over && readyUid == null && g.uids.some(u => loadedUse(state, u));
          const toggle = mine ? g.uids.map(u => optionFor(`toggle:${u}`)).find(Boolean) : null;
          const hop = (react && react.members && react.members[d.id]) || (givesExtra(g) ? 'extra-buy' : null);
          // its sphere at a glance: a soft ground in the sphere's color, stronger when the clothes alone don't carry it
          const sphere = sphereOf(state, d);
          const weak = ['silver', 'white', 'colorless'].includes(sphere) || sphereShare([d.id, spriteId(d.name)]) < 0.33;
          // the board picker: a member the choice offers is clicked right here (seat figure)
          const pickM = pick && pick.members ? g.uids.map(u => pick.members[u]).find(Boolean) : null;
          return (
            <span key={g.key} className={`cs-member${g.card.used && !state.over ? ' used' : ''}${readyUid != null ? ' ready' : ''}${loaded ? ' loaded' : ''}${hop ? ' react-hop' : ''}${pickM ? ' pick-on' : pick && pick.members ? ' pick-off' : ''}${pick && pick.askerUid != null && g.uids.includes(pick.askerUid) ? ' pick-asker' : ''}`} data-member={d.id} data-sphere={sphere} data-uids={g.uids.join(' ')} data-state={readyUid != null ? 'ready' : g.card.used && !state.over ? 'used' : loaded ? 'loaded' : undefined} data-react={hop || undefined} style={{ '--q': cardColor(state, d), '--ph': phase(g.uids[0]) }}>
              <span className={`aura${weak ? ' strong' : ''}`} aria-hidden="true" />
              <Tip className="fig" sticky={mine} {...(mine ? {} : { tabIndex: -1 })} label={`${d.name}: ${readyUid != null ? 'ready to use, show the card' : g.card.used ? 'used, show the card' : loaded ? 'not used yet, show the card' : 'show the card'}`}
                content={() => <><MemberCard state={state} uid={readyUid ?? g.uids[0]} me={me} />{mine && <MemberActions state={state} uid={readyUid ?? g.uids[0]} me={me} optionFor={optionFor} onPick={onPick} />}</>}>
                <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={24} />
                {g.count > 1 && <b className="x num">×{g.count}</b>}
              </Tip>
              {result && g.uids.includes(result.uid) && <UseResult result={result} />}
              {/* a lit member says who it is when pointed at, its card beside it (w3b: Shake Down's lit members opened
                  nothing, so you ransomed blind); a pick that says more (Release's refund) keeps that on its hover too */}
              {pickM && (() => {
                const pickUid = g.uids.find(u => pick.members[u] === pickM) ?? g.uids[0];
                return <button type="button" className="cs-pick-member" tabIndex={-1} data-option={pickM.id} aria-label={pickM.say || `${pick.title ? `${pick.title}: ` : ''}${mine ? 'your' : `${p.name}’s`} ${d.name}`} title={pickM.say || undefined}
                  onPointerEnter={e => { if (hover && realHover(e)) hover.onCardHover(pickUid, e.currentTarget); }}
                  onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onCardHover(pickUid, null); }}
                  onClick={e => pick.onPick(pickM.id, e.currentTarget)}><span className="hitbox" aria-hidden="true" /></button>;
              })()}
              {/* a switch shows its state, small under its figure; a click flips it in your buy step (its card says so) */}
              {mine && d.toggle && <MemberSwitch name={d.name} on={g.card.on !== false} option={toggle} onPick={onPick} about={d.text} />}
            </span>
          );
        })}
        {/* says what it counts ("+3" alone read as followers, final panel S#32); pointing at it opens the chair's card,
            which lists every member */}
        {/* the figures that don't fit fold into one quiet "+N" cell (the count beside them says the whole) */}
        {rest > 0 && <span className="cs-more num" data-more={rest} aria-label={`${rest} more member${rest === 1 ? '' : 's'}`} title={`${rest} more: point at the seat for every member`}>+{rest}</span>}
        </span>
        {/* Lie Low and the like: no one can steal this seat's resources this round, said in words (w2b #21) */}
        {safe && <small className="cs-safe" data-safe="1" title={`No one can steal resources from ${mine ? 'you' : p.name} until this round ends`}>safe this round</small>}
      </div>
      {/* what its members make each round, and what it just did (the approved plate's rival panel) */}
      {bonus ? (
        <div className="cs-build cs-bonus" data-pick-bonus={bonus.n} title={bonus.why}>
          <span className="cs-income"><small>Robin Hood</small><span className="cs-gains"><span className="cs-inc"><b className="num">+{bonus.n}</b><Follower size={12} title="follower" /></span></span></span>
        </div>
      ) : incomeWords.length > 0 && (
        <div className="cs-build" {...bodyHover}>
          {incomeWords.length > 0 && (
            <Tip className="cs-income" data-income={incomeWords.join(', ')} label={`Each round its members make ${incomeWords.join(', ')}`}
              content={() => <div className="pop-card gloss"><b>Each round</b><span>Next round starts with <Rich text={incomeText} /> for {mine ? 'you' : p.name}, as things stand now.</span>
                {terms && terms.sources.map(x => <span key={x.name} className="cs-why">{x.name}{x.n > 1 ? ` ×${x.n}` : ''}: <Rich text={x.text} />{x.hold ? ` (${x.hold})` : ''}</span>)}</div>}>
              <small>each round</small>
              <span className={`cs-gains${terms && terms.groups.some(g => g.cond) ? ' has-cond' : ''}`}>
                {/* a condition and the parts it covers stay together on one line ("+1● +1● +1● if fewest") */}
                {(terms ? terms.groups : []).map(g => (
                  <span key={g.cond || '-'} className="cs-grp" {...(g.cond ? { 'data-cond': g.cond } : {})}>
                    {g.parts.map(([r, n]) => <span key={r} className="cs-inc"><b className="num">+{n}</b><ResourceGlyph r={r} size={mine ? 13 : 11} n={n} /></span>)}
                    {g.cond && <small className="cs-cond"><Rich text={g.cond} /></small>}
                  </span>
                ))}
                {income.followers > 0 && <span className="cs-inc"><b className="num">+{income.followers}</b><Follower size={11} title="followers" /></span>}
              </span>
            </Tip>
          )}
        </div>
      )}
      <footer className="cs-foot" {...bodyHover}>
        <span className="cs-res" role="group" aria-label="Resources">
          {state.resources.map(r => {
            // the seat selector (seatPick.js): a stack you can take lights up and a click takes one; one you can't says why
            const sp = pick && pick.stacks ? pick.stacks[r] : null;
            const o = sp && sp.option, took = (pick && pick.picked[r]) || 0;
            // a pick in progress (Collect Debts) shows what's left with what's picked beside it, never the old count and
            // the change together (w3b #35: "3" with a "−2" badge)
            const shown = Math.max(0, (p.res[r] || 0) - took);
            const say = o ? (pick.give || mine ? `${pick.title ? `${pick.title}: ` : ''}${o.label}` : `Take 1 ${r} from ${p.name} (${took ? `${shown} left, ${took} picked` : shown})`) : sp ? sp.why : `${p.res[r] || 0} ${r}`;
            return (
              <span key={r} className={`cs-stack${p.res[r] ? '' : ' zero'}${sp ? (o ? ' pick-on' : ' pick-off') : ''}`} data-res={r} title={say}
                {...(o ? { role: 'button', tabIndex: -1, 'data-option': o.id, 'aria-label': say, onClick: e => pick.onPick(o.id, e.currentTarget) } : sp ? { 'data-why': sp.why, onClick: e => pick.onDenied && pick.onDenied(sp.why, e.currentTarget) } : {})}>
                <ResourceGlyph r={r} size={mine ? 16 : 13} n={shown} /><b className="num">{shown}</b>
                {took > 0 && <i className="cs-took num" aria-hidden="true">−{took}</i>}
                {o && <span className="hitbox" aria-hidden="true" />}
              </span>
            );
          })}
        </span>
      </footer>
      {/* a choice that picks a player: the whole seat is the button (or says why it isn't) */}
      {pick && pick.seatMode && (pick.seat
        ? <button type="button" className="cs-pick-seat" tabIndex={-1} data-option={pick.seat.id} aria-label={`${pick.title ? `${pick.title}: ` : ''}${p.name}`} title={`${pick.title ? `${pick.title}: ` : ''}${p.name}`} onClick={e => pick.onPick(pick.seat.id, e.currentTarget)} />
        : <span className="cs-pick-seat off" title={pick.why} aria-hidden="true" />)}
    </section>
  );
}
// each figure breathes on its own period and phase, so a crowd never moves in step
const phase = uid => `${((uid * 0.61803) % 1).toFixed(3)}`;
const actionKey = last => { try { return quadrant(last.qid).actions.find(a => a.name === last.name).key; } catch { return ''; } };

// ---------- reactions: the cult answers what its cards and its leader just did ----------
const REACT_MS = () => MO.react; // src/v4/motion.js (read when used: it follows the speed)
/**
 * Diffs each new state against the last for one player: a member hops when a log line names it as theirs
 * ("Ana's Banker: +3 gold.", "Bo +1 silver (Ana's Retinue)."), the leader gestures when one of its minions is placed,
 * celebrates when it wins a round-end prize, and schemes when it recruits. { leader, members:{ defId: n } } or null.
 */
export function useCultReactions(state, pid, rootRef = null) {
  const prev = useRef(state);
  const [react, setReact] = useState(null);
  const timer = useRef(null);
  const lit = useRef([]); // [el, class] the reaction put on the chair (DOM path)
  const unlight = () => { for (const [el, c] of lit.current) { el.classList.remove(c); if (c === 'react-hop' && el.dataset.reactDom) { delete el.dataset.reactDom; delete el.dataset.react; } } lit.current = []; };
  useEffect(() => () => { clearTimeout(timer.current); unlight(); }, []);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (before === state || !before || before.seed !== state.seed) return;
    const out = reactionsBetween(before, state, pid);
    if (!out) return;
    const root = rootRef && rootRef.current;
    clearTimeout(timer.current);
    if (root) {
      // on the chair's own elements, never through React state (perf, 2026-10-15: a reaction cost the chair two renders
      // mid-chain, on and off)
      // (a class React already drew stays React's: only what this adds is taken off again)
      if (out.leader) { const l = root.querySelector('.cs-leader'), c = `react-${out.leader}`; if (l && !l.classList.contains(c)) { l.classList.add(c); lit.current.push([l, c]); } }
      for (const id of Object.keys(out.members)) {
        for (const m of root.querySelectorAll('.cs-member')) {
          if (m.dataset.member !== id || m.classList.contains('react-hop')) continue;
          m.classList.add('react-hop');
          if (!m.dataset.react) { m.dataset.react = String(out.members[id]); m.dataset.reactDom = '1'; }
          lit.current.push([m, 'react-hop']);
        }
      }
      timer.current = setTimeout(unlight, REACT_MS());
      return;
    }
    setReact(r => ({ leader: out.leader || (r && r.leader) || null, members: { ...(r && r.members), ...out.members }, n: Date.now() }));
    timer.current = setTimeout(() => setReact(null), REACT_MS());
  }, [state, pid]); // eslint-disable-line react-hooks/exhaustive-deps
  return react;
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** What player pid's cult reacts to between two states (pure; exported for tests). */
export function reactionsBetween(before, state, pid) {
  const p = state.players[pid];
  const lines = newLogLines(before, state);
  const members = {};
  let leader = null;
  if (lines.length) {
    const defs = new Map();
    for (const u of p.members) { try { const d = cardDef(state, u); defs.set(d.name, d.id); } catch { /* gone */ } }
    for (const [name, id] of defs) {
      const re = new RegExp(`(^|\\(|\\s)${esc(p.name)}'s ${esc(name)}(?![A-Za-z0-9\u00C0-\u024F])`);
      // and its owner using it: "P1 used Lottery Winner: +7 gold.", "P1 uses Big Spender." (w2a #6: it fired unseen)
      const by = new RegExp(`^${esc(p.name)} (?:uses|used) ${esc(name)}(?![A-Za-z0-9\u00C0-\u024F])`);
      if (lines.some(l => re.test(l) || by.test(l))) members[id] = Date.now();
    }
    if (lines.some(l => l.startsWith(`${p.name} recruited `))) leader = 'scheme';
  }
  // a minion just placed (a new space of theirs this round)
  if (!leader && state.round === before.round && Object.keys(state.slots).some(k => state.slots[k] === pid && before.slots[k] !== pid)) leader = 'gesture';
  // a round-end prize won
  const h0 = (before.contests || []).length, h1 = (state.contests || []).length;
  if (h1 > h0 && state.contests[h1 - 1].results.some(c => c.winners.includes(pid))) leader = 'celebrate';
  return leader || Object.keys(members).length ? { leader, members } : null;
}

/**
 * How many member figures fit a laptop chair's row: { all, withMore } (all of them, or with room kept for "+N"), or null
 * on a phone (fixed counts there). Read in a ResizeObserver (after layout, so the reads are free) from the row's width,
 * the "each round" block when it shares the row, "safe this round", and one figure's width; a block that comes or goes,
 * and the first figure, are watched as they appear. Set only when the numbers change.
 */
function useFigureFit(rootEl, layout = null) {
  const [fit, setFit] = useState(null);
  const ro = useRef(null), watched = useRef(new Set()), measure = useRef(null);
  useLayoutEffect(() => {
    const el = rootEl.current;
    if (!el || typeof ResizeObserver !== 'function') return;
    if (!ro.current) {
      ro.current = new ResizeObserver(measure.current = () => {
        const seat = rootEl.current;
        if (!seat) return;
        const wide = typeof matchMedia === 'function' && matchMedia('(min-width:861px) and (min-height:500px)').matches;
        const crowd = seat.querySelector(':scope > .cs-crowd'), build = seat.querySelector(':scope > .cs-build');
        const box = crowd && crowd.querySelector(':scope > .cs-figs');
        const figs = box ? [...box.querySelectorAll(':scope > .cs-member')] : [];
        if (!wide || !crowd || !box || !figs.length) { setFit(f => (f === null ? f : null)); return; }
        const c = crowd.getBoundingClientRect();
        if (!c.width) return;
        // the row: the count, then the figures in a box of whole cells (two rows of them where the row is tall enough),
        // then "safe this round"; the "each round" block stands over the row's right end
        const gap = parseFloat(getComputedStyle(crowd).columnGap) || 0;
        const fgap = parseFloat(getComputedStyle(box).columnGap) || 0;
        const cell = Math.max(...figs.map(x => x.getBoundingClientRect().width)) + fgap;
        const figH = Math.max(...figs.map(x => x.getBoundingClientRect().height));
        const rows = Math.max(1, Math.floor((c.height + (parseFloat(getComputedStyle(box).rowGap) || 0)) / (figH + (parseFloat(getComputedStyle(box).rowGap) || 0))));
        const b = build && build.getBoundingClientRect();
        const beside = b && b.width && b.top < c.bottom - 1 && b.bottom > c.top + 1 ? b.width + 8 : 0;
        const count = crowd.querySelector(':scope > .cs-count');
        const safe = crowd.querySelector(':scope > .cs-safe');
        const room = c.width - beside - (count ? count.getBoundingClientRect().width + gap : 0) - (safe ? safe.getBoundingClientRect().width + gap : 0);
        const per = Math.max(1, Math.floor((room + fgap) / cell));
        const all = per * rows;
        const withMore = Math.max(1, all - 1); // "+N" takes the last cell
        setFit(f => (f && f.all === all && f.withMore === withMore && f.per === per && f.cell === cell ? f : { all, withMore, per, cell }));
      });
    }
    const r = ro.current, w = watched.current;
    for (const x of [...w]) if (!x.isConnected) { r.unobserve(x); w.delete(x); }
    for (const x of [el, el.querySelector(':scope > .cs-crowd'), el.querySelector(':scope > .cs-crowd > .cs-figs > .cs-member'), el.querySelector(':scope > .cs-build')]) if (x && !w.has(x)) { r.observe(x); w.add(x); }
  });
  // the "each round" block moving between the name row and the figures' row resizes nothing the observer watches
  useLayoutEffect(() => { if (measure.current) measure.current(); }, [layout]);
  useEffect(() => () => { if (ro.current) ro.current.disconnect(); ro.current = null; watched.current.clear(); }, []);
  return fit;
}
