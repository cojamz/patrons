// A cult at the table (Cory's layout revision, 2026-10-14): every player's cult sits at a corner of the wheel like
// a chair at a table. Its leader (the player's emoji) with the minions still to place floating around it, its
// members as a small crowd of figures, its follower mark and total, and its resources as small stacks. Yours sits
// nearest you and is a little larger, with Use/switch on members you can use now. Hover or tap the cult for its
// card (resources, members, last moves); hover or tap a member for that member's card.
import { useEffect, useRef, useState } from 'react';
import { followers, quadrant, cardDef } from '../../engine/v4/index.js';
import { memberChips, playerColor, newLogLines, seatEmoji } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId, sphereShare } from '../art/index.js';
import { Follower } from '../art/Follower.jsx';
import { realHover } from '../hover.js';
import { Tip, MemberCard, cardColor, onTable } from './Info.jsx';
import { MemberActions, MemberSwitch } from './MemberUse.jsx';
import { usableNow, loadedUse, safeThisRound } from './memberUse.js';
import { ResourceGlyph, LeaderRing } from './Glyphs.jsx';
import { Minion } from '../art/Leader.jsx';
import { turnPlaces } from './seats.js';
import { seatRanks } from './RankRow.jsx';
import { incomeOf } from './build.js';
import Tick from './Tick.jsx';
import { MO } from '../motion.js';
import './lamp-b.css';

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/**
 * props: state, pid (whose cult), me (the viewer), mine (it's the viewer's own cult: larger, with Use buttons),
 * now (their turn), react (recent reactions: { leader: 'gesture'|'celebrate'|'scheme', members: { defId: n } }),
 * hover (useHoverCards), optionFor/onPick (your members' Use / switch).
 */
export default function CultSeat({ state, pid, me = null, mine = false, now = false, react: given = null, hover = null, optionFor = () => null, onPick = () => {}, pick = null }) {
  const p = state.players[pid];
  const own = useCultReactions(state, pid);
  const react = given || own;
  const f = followers(state, p);
  // grouped by color (the approved plate: "the color mix is their lean"), table order, colorless last
  const colorAt = d => (onTable(state, d) ? state.quadrants.indexOf(d.quadrant) : state.quadrants.length);
  const groups = memberChips(state, p).map((g, k) => ({ g, k })).sort((a, b) => colorAt(a.g.def) - colorAt(b.g.def) || a.k - b.k).map(x => x.g);
  // your members you can use right now, with an effect (the engine's own dry run; one it would refuse stays unlit)
  const safe = safeThisRound(state, pid);
  const ready = new Set(mine ? usableNow(state, pid).filter(x => optionFor(`use:${x.uid}`)).map(x => x.uid) : []);
  // its place in what's left of this round's turn order (who's up now, who's next)
  const turns = turnPlaces(state, me);
  const place = turns.places[pid];
  // who's winning lives here now (no score row): this chair's place, lit when it leads, the margin on hover
  const rank = seatRanks(state, me)[pid] || null;
  // its build at one glance: its members (grouped by color) and what they hand it each round (the engine's round start)
  const income = incomeOf(state, pid);
  const incomeParts = income ? Object.entries(income.res).filter(([, n]) => n > 0) : [];
  const incomeWords = incomeParts.map(([r, n]) => `+${n} ${r}`).concat(income && income.followers > 0 ? [`+${income.followers} follower${income.followers === 1 ? '' : 's'}`] : []);
  // member figures shown before "+N": one row beside the "each round" line, so every chair keeps one fixed height
  // (the seat column is narrower now: six figures ran under "each round +3●"; each income part takes a figure's room)
  // (design pod, w2b #22: figures are 32px on the laptop so a rival's members can be told apart: six and a "+N" to a
  // row, and the "each round" line takes about one figure per part plus its label)
  const MAX = incomeWords.length ? Math.max(1, 4 - incomeWords.length) : 6;
  // what's never folded into "+N", most needed first: one you can use now or the board picker lights (folded, it could
  // only be picked from the keyboard list), then a use still in hand (a rival's loaded Raider is a threat to see
  // coming, w2b #21); each takes the place of the last one shown that's needed less
  const need = g => (g.uids.some(u => ready.has(u) || !!(pick && pick.members && pick.members[u])) ? 2 : g.uids.some(u => loadedUse(state, u)) ? 1 : 0);
  const keep = groups.slice(0, MAX);
  for (const g of groups.slice(MAX).filter(need).sort((x, y) => need(y) - need(x))) {
    const k = keep.map(need).reduce((at, n, i) => (n < need(g) && (at < 0 || n <= need(keep[at])) ? i : at), -1);
    if (k < 0) continue;
    keep.splice(k, 1); keep.push(g);
  }
  const shown = groups.filter(g => keep.includes(g));
  const rest = groups.filter(g => !shown.includes(g)).reduce((s, g) => s + g.count, 0);
  const openSeat = (e, pinned) => hover && hover.onSeatHover(pid, e.currentTarget, { pinned });
  return (
    <section className={`lt-cult-seat${mine ? ' mine' : ''}${now ? ' now' : ''}${pick ? ` picking${pick.lit ? ' pick-lit' : ''}${pick.dim ? ' pick-dim' : ''}${pick.seatMode ? ' pick-seat' : ''}` : ''}`} data-cult={pid} data-pick={pick ? (pick.lit ? 'on' : pick.dim ? 'off' : 'part') : undefined} data-seat={pid} style={{ '--pc': playerColor(pid) }}
      aria-label={`${mine ? 'Your cult' : `${p.name}'s cult`}: ${f} follower${f === 1 ? '' : 's'}, ${p.members.length} member${p.members.length === 1 ? '' : 's'}, ${p.left} minion${p.left === 1 ? '' : 's'} to place${now ? ', their turn' : ''}`}>
      <header className="cs-head" role="button" tabIndex={0} aria-haspopup="dialog" data-hint={`${p.name}: ${f} follower${f === 1 ? '' : 's'}. Show their cult.`}
        onPointerEnter={e => { if (realHover(e)) openSeat(e, false); }}
        onPointerLeave={e => { if (e.pointerType === 'mouse' && hover) hover.onSeatHover(pid, null); }}
        onClick={e => openSeat(e, true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSeat(e, true); } }}>
        <span className={`cs-leader${react && react.leader ? ` react-${react.leader}` : ''}`}><LeaderRing state={state} id={pid} size={mine ? 40 : 30} orbit={false} /></span>
        <span className="cs-who">
          <b>{mine ? 'You' : p.name}</b>
          {/* its place in the turns, said like the plate's "You  place a minion"; the rail beside the column marks it too */}
          {place && <span className={`cs-order ${place.label.replace(' ', '-')}${place.twice ? ' twice' : ''}`} data-order={place.label} data-twice={place.twice ? '1' : undefined} title={place.title}>
            <span className="co-t">{place.label}</span>{place.twice && <b className="co-x">twice</b>}
          </span>}
        </span>
        <span className={`cs-total${rank && rank.lead ? ' lead' : ''}`} data-followers={f} data-rank={rank ? rank.place : undefined} title={rank ? rank.title : `${f} followers`}><Tick value={f} color={playerColor(pid)} className="num" float={false} /><Follower size={mine ? 14 : 12} title={`${f} followers`} /></span>
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
      <div className="cs-crowd" role="group" aria-label={`${mine ? 'Your' : `${p.name}'s`} members`}>
        {shown.map(g => {
          const d = g.def;
          // yours to use now (Cory, 2026-10-15): the figure is lit, and its card carries the Use button (MemberUse.jsx)
          const readyUid = mine ? g.uids.find(u => ready.has(u)) : undefined;
          // a use still in hand, anyone's: subdued light, so a rival's loaded Raider can be seen coming (w2b #21)
          const loaded = readyUid == null && g.uids.some(u => loadedUse(state, u));
          const toggle = mine ? g.uids.map(u => optionFor(`toggle:${u}`)).find(Boolean) : null;
          const hop = react && react.members && react.members[d.id];
          // its sphere at a glance: a soft ground in the sphere's color, stronger when the clothes alone don't carry it
          const sphere = sphereOf(state, d);
          const weak = ['silver', 'white', 'colorless'].includes(sphere) || sphereShare([d.id, spriteId(d.name)]) < 0.33;
          // the board picker: a member the choice offers is clicked right here (seat figure)
          const pickM = pick && pick.members ? g.uids.map(u => pick.members[u]).find(Boolean) : null;
          return (
            <span key={g.key} className={`cs-member${g.card.used ? ' used' : ''}${readyUid != null ? ' ready' : ''}${loaded ? ' loaded' : ''}${hop ? ' react-hop' : ''}${pickM ? ' pick-on' : pick && pick.members ? ' pick-off' : ''}${pick && pick.chosenUid != null && g.uids.includes(pick.chosenUid) ? ' pick-chosen' : ''}${pickM && pickM.alt ? ' pick-alt' : ''}${pick && pick.askerUid != null && g.uids.includes(pick.askerUid) ? ' pick-asker' : ''}`} data-member={d.id} data-sphere={sphere} data-uids={g.uids.join(' ')} data-state={readyUid != null ? 'ready' : g.card.used ? 'used' : loaded ? 'loaded' : undefined} data-react={hop || undefined} style={{ '--q': cardColor(state, d), '--ph': phase(g.uids[0]) }}>
              <span className={`aura${weak ? ' strong' : ''}`} aria-hidden="true" />
              <Tip className="fig" sticky={mine} label={`${d.name}: ${readyUid != null ? 'ready to use, show the card' : g.card.used ? 'used, show the card' : loaded ? 'not used yet, show the card' : 'show the card'}`}
                content={() => <><MemberCard state={state} uid={readyUid ?? g.uids[0]} me={me} />{mine && <MemberActions state={state} uid={readyUid ?? g.uids[0]} me={me} optionFor={optionFor} onPick={onPick} />}</>}>
                <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={24} />
                {g.count > 1 && <b className="x num">×{g.count}</b>}
              </Tip>
              {pickM && <button type="button" className="cs-pick-member" tabIndex={-1} data-option={pickM.id} aria-label={pickM.say || `${pick.title ? `${pick.title}: ` : ''}${mine ? 'your' : `${p.name}’s`} ${d.name}`} title={pickM.say || `${pick.title ? `${pick.title}: ` : ''}${mine ? 'your' : `${p.name}’s`} ${d.name}`} onClick={e => pick.onPick(pickM.id, e.currentTarget)}><span className="hitbox" aria-hidden="true" /></button>}
              {/* a switch shows its state, small under its figure; a click flips it in your buy step (its card says so) */}
              {mine && d.toggle && <MemberSwitch name={d.name} on={g.card.on !== false} option={toggle} onPick={onPick} />}
            </span>
          );
        })}
        {rest > 0 && <span className="cs-more" title={`${rest} more member${rest === 1 ? '' : 's'}`}>+{rest}</span>}
        {/* Lie Low and the like: no one can steal this seat's resources this round, said in words (w2b #21) */}
        {safe && <small className="cs-safe" data-safe="1" title={`No one can steal resources from ${mine ? 'you' : p.name} until this round ends`}>safe this round</small>}
      </div>
      {/* what its members make each round, and what it just did (the approved plate's rival panel) */}
      {incomeWords.length > 0 && (
        <div className="cs-build">
          {incomeWords.length > 0 && (
            <span className="cs-income" data-income={incomeWords.join(', ')} title={`Each round its members make ${incomeWords.join(', ')} (at the round's start)`}>
              <small>each round</small>
              {incomeParts.map(([r, n]) => <span key={r} className="cs-inc"><b className="num">+{n}</b><ResourceGlyph r={r} size={mine ? 13 : 11} n={n} /></span>)}
              {income.followers > 0 && <span className="cs-inc"><b className="num">+{income.followers}</b><Follower size={11} title="followers" /></span>}
            </span>
          )}
        </div>
      )}
      <footer className="cs-foot">
        <span className="cs-res" role="group" aria-label="Resources">
          {state.resources.map(r => {
            // the seat selector (seatPick.js): a stack you can take lights up and a click takes one; one you can't says why
            const sp = pick && pick.stacks ? pick.stacks[r] : null;
            const o = sp && sp.option, took = (pick && pick.picked[r]) || 0;
            const say = o ? (pick.give || mine ? `${pick.title ? `${pick.title}: ` : ''}${o.label}` : `Take 1 ${r} from ${p.name} (${p.res[r] || 0}${took ? `, ${took} picked` : ''})`) : sp ? sp.why : `${p.res[r] || 0} ${r}`;
            return (
              <span key={r} className={`cs-stack${p.res[r] ? '' : ' zero'}${sp ? (o ? ' pick-on' : ' pick-off') : ''}${sp && sp.chosen ? ' pick-chosen' : ''}${o && o.alt ? ' pick-alt' : ''}`} data-res={r} title={say}
                {...(o ? { role: 'button', tabIndex: -1, 'data-option': o.id, 'aria-label': say, onClick: e => pick.onPick(o.id, e.currentTarget) } : sp ? { 'data-why': sp.why, onClick: e => pick.onDenied && pick.onDenied(sp.why, e.currentTarget) } : {})}>
                <ResourceGlyph r={r} size={mine ? 16 : 13} n={p.res[r] || 0} /><b className="num">{p.res[r] || 0}</b>
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
const REACT_MS = MO.react; // src/v4/motion.js
/**
 * Diffs each new state against the last for one player: a member hops when a log line names it as theirs
 * ("Ana's Banker: +3 gold.", "Bo +1 silver (Ana's Retinue)."), the leader gestures when one of its minions is placed,
 * celebrates when it wins a round-end prize, and schemes when it recruits. { leader, members:{ defId: n } } or null.
 */
export function useCultReactions(state, pid) {
  const prev = useRef(state);
  const [react, setReact] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (before === state || !before || before.seed !== state.seed) return;
    const out = reactionsBetween(before, state, pid);
    if (!out) return;
    setReact(r => ({ leader: out.leader || (r && r.leader) || null, members: { ...(r && r.members), ...out.members }, n: Date.now() }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReact(null), REACT_MS);
  }, [state, pid]);
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
      if (lines.some(l => re.test(l))) members[id] = Date.now();
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
