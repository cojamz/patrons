// Every member in the game on one page, for Cory's member reviews (Oct 28: "a visual of all our current members and what
// they do… on the site somewhere"). Served at play/members/ (scripts/v4-play.sh copies the page there). Read straight
// from the card files with the in-game card face (Info.jsx MemberCard), so the words, prices and portraits are the
// shipped ones and never drift.
import { useMemo } from 'react';
import '../app.css';
import '../game/lamp-b.css'; // the hover card's look (.mc)
import './members-page.css';
import { allQuadrantIds, quadrant, memberRound, roman } from '../../engine/v4/index.js';
import { guestMembers } from '../../engine/v4/content/index.js';
import { CUT } from '../../engine/v4/content/cull.js';
import { ARTIFACTS, DEFAULT_RULES } from '../../engine/v4/core.js';
import { MemberCard } from '../game/Info.jsx';
import { costParts } from '../format.js';
import { sphereLine, sphereVersion } from '../tables.js';
import { VERSION } from '../version.js';

// 2.0 colors first, in the setup picker's order; then the colors not redesigned yet; guests last
const ORDER = ['red', 'echo', 'thieves', 'purple', 'market', 'trading', 'gold', 'silver', 'yellow'];
const price = d => costParts(d).reduce((t, p) => t + p.n, 0);
const byPrice = (a, b) => price(a) - price(b) || a.name.localeCompare(b.name);

function catalog() {
  const ids = allQuadrantIds().filter(id => !quadrant(id).standIn).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const artifactIds = new Set(Object.values(ARTIFACTS));
  const groups = ids.map(id => {
    const q = quadrant(id);
    return {
      id, name: q.name, line: sphereLine(id), redone: sphereVersion(id) === '2.0',
      members: q.members.filter(d => !CUT.has(d.id) && !d.artifact && !artifactIds.has(d.id)).sort(byPrice),
      artifact: ARTIFACTS[id] ? q.members.find(d => d.id === ARTIFACTS[id]) : null,
    };
  });
  groups.push({ id: 'guest', name: 'Guests', line: 'Colorless: paid in any colors, in every game.', redone: false, guest: true, members: guestMembers().filter(d => !CUT.has(d.id)).sort(byPrice) });
  return groups;
}

// a table with every color on it, so each card shows in its own color and cost
const TABLE = {
  quadrants: allQuadrantIds(), resources: [...new Set(allQuadrantIds().map(id => quadrant(id).resource))],
  players: [], shop: [], cards: {}, round: 1, rules: DEFAULT_RULES, over: false,
};

function Card({ def, artifact = false }) {
  const r = memberRound(def);
  return <article className="mp-card" data-member={def.id} style={{ "--c": TABLE.quadrants.includes(def.quadrant) ? `var(--${def.quadrant})` : "var(--colorless)" }}>
    <MemberCard state={TABLE} def={def} />
    <footer className="mp-meta">
      {artifact ? <span>Artifact: picked at the start, worth no followers</span> : <span>Joins in round {roman(Math.min(r, DEFAULT_RULES.roundDecks || 3))}</span>}
      {!artifact && def.copies > 1 && <span>{def.copies} copies</span>}
    </footer>
  </article>;
}

export default function MembersPage() {
  const groups = useMemo(catalog, []);
  const total = groups.reduce((n, g) => n + g.members.length, 0);
  return <main className="mp">
    <header className="mp-head">
      <h1>Cults members</h1>
      <p>{total} members in {VERSION}, by color, cheapest first. Prices include the +1 wild.</p>
      <nav className="mp-nav">{groups.map(g => <a key={g.id} href={`#${g.id}`} style={{ '--c': g.guest ? 'var(--colorless)' : `var(--${g.id})` }}>{g.name} <small>{g.members.length}</small></a>)}</nav>
    </header>
    {groups.map(g => <section key={g.id} id={g.id} className="mp-color" style={{ '--c': g.guest ? 'var(--colorless)' : `var(--${g.id})` }}>
      <h2>{g.name}{!g.guest && <small>{g.redone ? 'Redesigned' : 'Not redesigned yet'}</small>}</h2>
      {g.line && <p className="mp-line">{g.line}</p>}
      <div className="mp-grid">
        {g.members.map(d => <Card key={d.id} def={d} />)}
        {g.artifact && <Card def={g.artifact} artifact />}
      </div>
    </section>)}
  </main>;
}
