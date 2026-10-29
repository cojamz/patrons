// The color explorer (Cory, Oct 28: "update the members tab to just better show the member deck and the actions… kind
// of like investigating a color"; "look at a colors full member deck, artifact(s), and actions to hold them all in my
// head at once as i brainstorm. hoverable and detail version for members"). One color at a time: its spaces by round
// and its artifact on the left, its member deck by the round it joins on the right, as the shop's cards (hover for the
// full card, click to keep it open) or as full cards (Details). Served at play/members/ (scripts/v4-play.sh copies the
// page there); read straight from the card files with the game's own faces, so a rework shows up on its next ship.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../app.css';
import '../game/lamp-b.css'; // the shop card (.lt-card) and the hover card's look (.mc)
import './members-page.css';
import { allQuadrantIds, quadrant, memberRound, roman } from '../../engine/v4/index.js';
import { guestMembers } from '../../engine/v4/content/index.js';
import { CUT } from '../../engine/v4/content/cull.js';
import { ARTIFACTS, DEFAULT_RULES } from '../../engine/v4/core.js';
import { MemberCard, RuleText, cardColor, cardGround } from '../game/Info.jsx';
import { CostShapes } from '../game/ShopCards.jsx';
import { kindOf } from '../game/cards.js';
import { FollowerGlyph } from '../game/Glyphs.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { costParts } from '../format.js';
import { ruleWords } from '../shorts.js';
import { sphereLine, sphereVersion } from '../tables.js';
import { VERSION } from '../version.js';

// 2.0 colors first, in the setup picker's order; then the colors not redesigned yet; guests last
const ORDER = ['red', 'echo', 'thieves', 'purple', 'market', 'trading', 'gold', 'silver', 'yellow'];
const ROUNDS = DEFAULT_RULES.roundDecks || 3;
const price = d => costParts(d).reduce((t, p) => t + p.n, 0);
const byPrice = (a, b) => price(a) - price(b) || a.name.localeCompare(b.name);

function catalog() {
  const ids = allQuadrantIds().filter(id => !quadrant(id).standIn).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const artifactIds = new Set(Object.values(ARTIFACTS));
  const groups = ids.map(id => {
    const q = quadrant(id);
    return {
      id, name: q.name, line: sphereLine(id), redone: sphereVersion(id) === '2.0',
      rim: q.scoring ? `${ruleWords(id, q.scoring.label)}: ${q.scoring.counts}` : '',
      actions: [...q.actions].sort((a, b) => a.ring - b.ring),
      members: q.members.filter(d => !CUT.has(d.id) && !d.artifact && !artifactIds.has(d.id)).sort(byPrice),
      artifact: ARTIFACTS[id] ? q.members.find(d => d.id === ARTIFACTS[id]) : null,
    };
  });
  groups.push({ id: 'guest', name: 'Guests', line: 'Colorless: paid in any colors, in every game.', guest: true, actions: [], members: guestMembers().filter(d => !CUT.has(d.id)).sort(byPrice) });
  return groups;
}

// a table with every color on it, so each card shows in its own color and cost
const TABLE = {
  quadrants: allQuadrantIds(), resources: [...new Set(allQuadrantIds().map(id => quadrant(id).resource))],
  players: [], shop: [], cards: {}, round: 1, rules: DEFAULT_RULES, over: false,
};
const tint = g => (g.guest ? 'var(--colorless)' : `var(--${g.id})`);
const joins = d => Math.min(memberRound(d), ROUNDS);

const VIEW_KEY = 'patrons.v4.membersView';
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } } };
const fromHash = groups => { const h = decodeURIComponent(location.hash.slice(1)); return groups.some(g => g.id === h) ? h : groups[0].id; };

/** A member as the shop shows it: picture, name, cost, worth (taste.md: what it does lives in the hover). */
function Tile({ def, copies, onOver, onOut, onPin, pinned }) {
  const parts = costParts(def, TABLE.resources);
  const total = parts.reduce((t, c) => t + c.n, 0);
  const sphere = def.quadrant && TABLE.quadrants.includes(def.quadrant) ? quadrant(def.quadrant).resource : 'colorless';
  return <button type="button" className={`card lt-card paper mp-tile${pinned ? ' pinned' : ''}`} data-member={def.id}
    style={{ '--q': cardColor(TABLE, def) }} data-ground={cardGround(TABLE, def)} data-kind={kindOf(def).kind}
    aria-label={`${def.name}, worth ${def.f}, costs ${total}`} aria-pressed={pinned}
    onPointerEnter={e => onOver(def, e.currentTarget)} onPointerLeave={onOut} onFocus={e => onOver(def, e.currentTarget)} onBlur={onOut}
    onClick={e => onPin(def, e.currentTarget)}>
    <span className="art"><Sprite id={[def.id, spriteId(def.name)]} kind="member" sphere={sphere} size={48} />
      <span className="lt-corner-cost num" aria-hidden="true">{total}</span>
      {def.from > 1 && <span className="lt-round-tag" title="Works from round II on">II+</span>}
      {copies > 1 && <span className="mp-copies" title={`${copies} copies in the deck`}>×{copies}</span>}
    </span>
    {kindOf(def).word && <span className="lt-kind" data-kind-word="">{kindOf(def).word}</span>}
    <span className="nm">{def.name}</span>
    <span className="ft"><CostShapes parts={parts} />
      <span className="val" title={`Worth ${def.f} follower${def.f === 1 ? '' : 's'}`}><b className="num">{def.f}</b><FollowerGlyph size={11} title={`worth ${def.f}`} /></span>
    </span>
  </button>;
}

/** The full card, on the hover card's paper, with where it sits in the deck. */
function Full({ def, artifact = false }) {
  return <article className="mp-card" data-card-full={def.id} style={{ '--c': cardColor(TABLE, def) }}>
    <MemberCard state={TABLE} def={def} />
    {/* the round it joins is the heading it sits under; only what the face doesn't say */}
    {(artifact || def.copies > 1) && <footer className="mp-meta">
      {artifact ? <span>Picked at the start, worth no followers</span> : <span>{def.copies} copies in the deck</span>}
    </footer>}
  </article>;
}

function Space({ qid, action }) {
  return <li className="mp-space" data-space={action.id}>
    <b className="mp-space-name">{action.name}</b>
    <span className="mp-space-rule"><RuleText def={action} round={1} lines /></span>
    {action.lastRound ? <small className="mp-space-note">Closes after round {roman(action.lastRound)}</small> : null}
  </li>;
}

const POP_W = 300;
function place(el) {
  const r = el.getBoundingClientRect();
  const right = r.right + 8 + POP_W <= window.innerWidth;
  return { left: right ? r.right + 8 : Math.max(8, r.left - 8 - POP_W), top: Math.max(8, Math.min(r.top - 6, window.innerHeight - 240)) };
}

export default function MembersPage() {
  const groups = useMemo(catalog, []);
  const [color, setColor] = useState(() => fromHash(groups));
  const [view, setView] = useState(() => (store.get(VIEW_KEY) === 'details' ? 'details' : 'cards'));
  const [hover, setHover] = useState(null); // { def, at, pinned }
  const g = groups.find(x => x.id === color) || groups[0];
  const pick = useCallback(id => { setColor(id); setHover(null); history.replaceState(null, '', `#${id}`); }, []);
  const flip = v => { setView(v); store.set(VIEW_KEY, v); setHover(null); };

  // arrows (or 1-9, 0 for guests) walk the colors; Escape lets go of a kept card
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
      const at = groups.findIndex(x => x.id === color);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') pick(groups[(at + (e.key === 'ArrowRight' ? 1 : groups.length - 1)) % groups.length].id);
      else if (/^[0-9]$/.test(e.key)) { const k = e.key === '0' ? groups.length - 1 : Number(e.key) - 1; if (groups[k]) pick(groups[k].id); }
      else if (e.key === 'Escape') setHover(null);
    };
    const onHash = () => pick(fromHash(groups));
    window.addEventListener('keydown', onKey); window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash); };
  }, [groups, color, pick]);

  const over = useCallback((def, el) => setHover(h => (h && h.pinned ? h : { def, at: place(el), pinned: false })), []);
  const out = useCallback(() => setHover(h => (h && h.pinned ? h : null)), []);
  const pin = useCallback((def, el) => setHover(h => (h && h.pinned && h.def.id === def.id ? null : { def, at: place(el), pinned: true })), []);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [color]);

  const byRound = [1, 2, 3].map(r => ({ r, members: g.members.filter(d => joins(d) === r) })).filter(x => x.members.length);
  const deckSize = g.members.reduce((n, d) => n + (d.copies || 1), 0);
  return <main className="mp" style={{ '--c': tint(g) }} onPointerDown={e => { if (hover && hover.pinned && !e.target.closest('.mp-tile, .mp-pop')) setHover(null); }}>
    <header className="mp-head">
      <h1>Cults <small>{VERSION}</small></h1>
      <nav className="mp-nav" aria-label="Colors">{groups.map(x => <button key={x.id} type="button" aria-pressed={x.id === color} onClick={() => pick(x.id)} style={{ '--c': tint(x) }}>{x.name}</button>)}</nav>
      <span className="mp-view" role="group" aria-label="Member view">
        <button type="button" aria-pressed={view === 'cards'} onClick={() => flip('cards')}>Cards</button>
        <button type="button" aria-pressed={view === 'details'} onClick={() => flip('details')}>Details</button>
      </span>
    </header>
    <div className={`mp-body${g.guest ? ' no-spaces' : ''}`}>
      {!g.guest && <aside className="mp-side" aria-label={`${g.name} spaces`}>
        <h2>{g.name}{!g.redone && <small>Not redesigned yet</small>}</h2>
        {g.line && <p className="mp-line">{g.line}</p>}
        {[1, 2, 3].map(r => { const acts = g.actions.filter(a => a.ring === r); return acts.length ? <section key={r} className="mp-ring">
          <h3>Round {roman(r)}{r > 1 ? ' on' : ''}</h3>
          <ul>{acts.map(a => <Space key={a.id} qid={g.id} action={a} />)}</ul>
        </section> : null; })}
        {g.rim && <p className="mp-rim"><b>Rim</b> {g.rim}</p>}
        {g.artifact && <section className="mp-ring mp-art">
          <h3>Artifact</h3>
          <Full def={g.artifact} artifact />
        </section>}
      </aside>}
      <section className="mp-deck" ref={scroller} aria-label={`${g.name} members`} data-view={view}>
        <h2 className="mp-deck-head">{g.guest ? g.name : 'Members'}<small>{g.members.length} members{deckSize !== g.members.length ? `, ${deckSize} cards` : ''}, cheapest first</small></h2>
        {g.guest && <p className="mp-line">{g.line}</p>}
        {byRound.map(({ r, members }) => <div key={r} className="mp-round">
          {!g.guest && <h3>Joins in round {roman(r)}</h3>}
          <div className={view === 'details' ? 'mp-grid' : 'mp-row'}>
            {members.map(d => view === 'details' ? <Full key={d.id} def={d} />
              : <Tile key={d.id} def={d} copies={d.copies || 1} onOver={over} onOut={out} onPin={pin} pinned={!!(hover && hover.pinned && hover.def.id === d.id)} />)}
          </div>
        </div>)}
      </section>
    </div>
    {hover && view === 'cards' && <div className="mp-pop" role="dialog" aria-label={hover.def.name} style={{ left: hover.at.left, top: hover.at.top, width: POP_W }}><Full def={hover.def} /></div>}
  </main>;
}
