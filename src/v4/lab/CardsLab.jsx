// ?lab=cards: member cards drawn as trading cards (Cory, Oct 29: "evolve the cards to a really good point, where they read
// simply like TCG playing cards"). Design stabs only, side by side on the same real members, at full size and shop size.
// Nothing here is in the game yet.
import '../app.css';
import '../game/lamp-b.css';
import './cards-lab.css';
import { allQuadrantIds, quadrant } from '../../engine/v4/index.js';
import { guestMembers } from '../../engine/v4/content/index.js';
import { RuleText, cardColor, cardGround } from '../game/Info.jsx';
import { CostShapes } from '../game/ShopCards.jsx';
import { FollowerGlyph } from '../game/Glyphs.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { costParts } from '../format.js';

const TABLE = {
  quadrants: allQuadrantIds(), resources: [...new Set(allQuadrantIds().map(id => quadrant(id).resource))],
  players: [], shop: [], cards: {}, round: 1, rules: {}, over: false,
};
const PICKS = ['Host', 'Busker', 'Headhunter', 'Patriarch', 'Bodyguard', 'Twins', 'Mob'];
const everyone = () => [...allQuadrantIds().flatMap(id => quadrant(id).members), ...guestMembers()];
const find = name => everyone().find(d => d.name === name);
const sphereOf = d => (d.quadrant && TABLE.quadrants.includes(d.quadrant) ? quadrant(d.quadrant).resource : 'colorless');
const colorName = d => (d.quadrant && TABLE.quadrants.includes(d.quadrant) ? quadrant(d.quadrant).name : 'Guest');
const ability = d => String(d.text || '').replace(/^Worth \d+ followers?\.\s*/i, '').replace(/^(Free\.\s*)?No effect\.?$/i, '').trim();
const total = d => costParts(d, TABLE.resources).reduce((t, c) => t + c.n, 0);

const Art = ({ d, size = 96 }) => <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(d)} size={size} />;
const Worth = ({ d, size = 14 }) => <span className="cl-worth" title={`Worth ${d.f}`}><b className="num">{d.f}</b><FollowerGlyph size={size} title={`worth ${d.f}`} /></span>;
const Text = ({ d }) => (ability(d) ? <RuleText def={d} text={ability(d)} round={1} lines /> : <span className="cl-none">Worth {d.f} follower{d.f === 1 ? '' : 's'}.</span>);
const Members = ({ d }) => (d.n > 1 ? <span className="cl-n">counts as {d.n}</span> : null);

// A · Classic: name and cost on one bar, the picture, a line naming its color, the rule box, worth in the corner
function Classic({ d, small }) {
  return <article className={`cl-card cl-a${small ? ' sm' : ''}`} style={{ '--c': cardColor(TABLE, d) }} data-ground={cardGround(TABLE, d)}>
    <header className="a-bar"><b className="a-name">{d.name}</b><CostShapes parts={costParts(d, TABLE.resources)} /></header>
    <div className="a-art"><Art d={d} size={small ? 48 : 96} /></div>
    {!small && <div className="a-line"><span>{colorName(d)} member</span>{d.n > 1 && <span className="cl-n">counts as {d.n}</span>}</div>}
    {!small && <div className="a-box"><Text d={d} /></div>}
    <footer className="a-foot"><Worth d={d} size={small ? 11 : 14} /></footer>
  </article>;
}

// B · Corners: the price in the top-left corner and the worth in the top-right, as in most digital card games;
// the picture fills the top, the name sits on a ribbon, the rule underneath, the colors of the price along the foot
function Corners({ d, small }) {
  return <article className={`cl-card cl-b${small ? ' sm' : ''}`} style={{ '--c': cardColor(TABLE, d) }} data-ground={cardGround(TABLE, d)}>
    <div className="b-art"><Art d={d} size={small ? 48 : 96} /></div>
    <span className="b-cost num">{total(d)}</span>
    <span className="b-worth"><Worth d={d} size={small ? 11 : 15} /></span>
    <b className="b-name">{d.name}</b>
    {!small && <div className="b-box"><Text d={d} /></div>}
    <footer className="b-foot"><CostShapes parts={costParts(d, TABLE.resources)} />{!small && <Members d={d} />}</footer>
  </article>;
}

// C · Tarot: a tall card with a printed border, the price as a numeral up top, the picture in a window, the name in caps
// across the foot of the picture, the rule set small and centered
function Tarot({ d, small }) {
  return <article className={`cl-card cl-c${small ? ' sm' : ''}`} style={{ '--c': cardColor(TABLE, d) }} data-ground={cardGround(TABLE, d)}>
    <div className="c-in">
      <header className="c-top"><CostShapes parts={costParts(d, TABLE.resources)} /><span className="c-worth"><Worth d={d} size={small ? 10 : 13} /></span></header>
      <div className="c-art"><Art d={d} size={small ? 48 : 96} /></div>
      <b className="c-name">{d.name}</b>
      {!small && <div className="c-box"><Text d={d} /></div>}
      {!small && <footer className="c-foot">{colorName(d)}{d.n > 1 ? ` · counts as ${d.n}` : ''}</footer>}
    </div>
  </article>;
}

// D · Full art: the picture is the whole card, the name and rule on a paper panel over its lower half, price and worth
// as two plain tabs on the top edge
function FullArt({ d, small }) {
  return <article className={`cl-card cl-d${small ? ' sm' : ''}`} style={{ '--c': cardColor(TABLE, d) }} data-ground={cardGround(TABLE, d)}>
    <div className="d-art"><Art d={d} size={small ? 72 : 120} /></div>
    <span className="d-cost"><CostShapes parts={costParts(d, TABLE.resources)} /></span>
    <span className="d-worth"><Worth d={d} size={small ? 11 : 14} /></span>
    <div className="d-panel"><b className="d-name">{d.name}</b>{!small && <div className="d-box"><Text d={d} /></div>}</div>
  </article>;
}

const LOOKS = [['A', 'Classic', Classic], ['B', 'Corners', Corners], ['C', 'Tarot', Tarot], ['D', 'Full art', FullArt]];

export default function CardsLab() {
  const only = new URLSearchParams(location.search).get('look');
  const picks = (new URLSearchParams(location.search).get('names') || '').split(',').filter(Boolean);
  const defs = (picks.length ? picks : PICKS).map(find).filter(Boolean);
  return <main className="cl">
    {LOOKS.filter(([k]) => !only || only.includes(k)).map(([k, name, Card]) => <section key={k} className="cl-look" data-look={k}>
      <h2><b>{k}</b> {name}</h2>
      <div className="cl-row">{defs.map(d => <Card key={d.id} d={d} />)}</div>
      <div className="cl-row sm">{defs.map(d => <Card key={d.id} d={d} small />)}</div>
    </section>)}
  </main>;
}
