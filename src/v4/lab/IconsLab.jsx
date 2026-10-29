// ?lab=icons: where member cards could use better visual language (Cory, Oct 29: keywords bold, "visual language for
// member number", "Per red member could be per SYMBOL"). Each row is the Header card with one treatment of its rule
// text, on the same real members. Design stabs only; nothing here is in the game.
import '../app.css';
import '../game/lamp-b.css';
import './cards-lab.css';
import './icons-lab.css';
import { allQuadrantIds, quadrant } from '../../engine/v4/index.js';
import { guestMembers } from '../../engine/v4/content/index.js';
import { useId } from 'react';
import { cardColor, cardGround } from '../game/Info.jsx';
import { anyDotVars, MemberGlyph } from '../game/Glyphs.jsx';
import { Rich } from '../game/Rich.jsx';
import { CostShapes } from '../game/ShopCards.jsx';
import { FollowerGlyph } from '../game/Glyphs.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { costParts } from '../format.js';

const TABLE = {
  quadrants: allQuadrantIds(), resources: [...new Set(allQuadrantIds().map(id => quadrant(id).resource))],
  players: [], shop: [], cards: {}, round: 1, rules: {}, over: false,
};
const PICKS = ['Mob', 'Patriarch', 'Host', 'Revelers', 'Headhunter', 'Chefs', 'Curator'];
const everyone = () => [...allQuadrantIds().flatMap(id => quadrant(id).members), ...guestMembers()];
const find = name => everyone().find(d => d.name === name);
const sphereOf = d => (d.quadrant && TABLE.quadrants.includes(d.quadrant) ? quadrant(d.quadrant).resource : 'colorless');
const total = d => costParts(d, TABLE.resources).reduce((t, c) => t + c.n, 0);
const ability = d => String(d.text || '').replace(/^Worth \d+ followers?\.\s*/i, '').trim();
const COLORS = ['gold', 'red', 'blue', 'green', 'magenta', 'silver', 'yellow', 'purple', 'white'];

// ---------- the member mark, two drawings ----------
// card: a little upright card (members are cards on the table and in print); a color fills it, "any member" is an outline
function CardMark({ color = null, title }) {
  const fill = color ? `var(--${color})` : 'none';
  return <svg className="il-mark" viewBox="0 0 12 16" role="img" aria-label={title}><title>{title}</title>
    <rect x="1.5" y="1" width="9" height="14" rx="2" fill={fill} stroke={color ? 'rgba(20,14,10,.55)' : 'currentColor'} strokeWidth="1.6" />
    <rect x="3.6" y="3.4" width="4.8" height="5" rx="1" fill={color ? 'rgba(255,255,255,.55)' : 'currentColor'} opacity={color ? 1 : 0.55} />
  </svg>;
}
// hood: the cult member, the same hooded figure the portraits are; a color fills the robe
function HoodMark({ color = null, title }) {
  const fill = color ? `var(--${color})` : 'currentColor';
  return <svg className="il-mark hood" viewBox="0 0 14 16" role="img" aria-label={title}><title>{title}</title>
    <path d="M7 .8 L12.6 7.2 L13 15.2 L1 15.2 L1.4 7.2 Z" fill={fill} stroke={color ? 'rgba(20,14,10,.55)' : 'none'} strokeWidth="1.2" strokeLinejoin="round" />
    <ellipse cx="7" cy="8" rx="2.3" ry="2.7" fill={color ? 'rgba(20,14,10,.75)' : 'var(--pp)'} />
  </svg>;
}
// bust (Cory, Oct 29: "a red head and shoulders symbol for red member… a mix of the colors in the game (like the wildcard
// token is) of the same symbol for any member"): one smooth bust; a color fills it, "any member" is split like the wild dot
const BUST = 'M8 1.2a3.3 3.3 0 1 1 0 6.6a3.3 3.3 0 1 1 0-6.6ZM1.6 15.2C1.6 11.2 4.2 8.8 8 8.8S14.4 11.2 14.4 15.2Z';
const BustMark = ({ color = null, title }) => <span className="il-mark bust" title={title}><MemberGlyph r={color} decorative /></span>;
const MARKS = { card: CardMark, hood: HoodMark, bust: BustMark };

// ---------- one rule, drawn under a treatment ----------
// opts: bold (keywords bold), mark ('card' | 'hood' | null), once (One Time Use's new name), band (keyword on its own line
// above the rule), rounds (a by-round rule as "I +1 · II +2 · III +3")
const KEY = /\b(On Recruit|Round III Start|Round Start|Round [Ee]nd|Game [Ee]nd|One Time Use|Once per game|Once per round|Activate)\b(:?)/g;
const fixCase = k => k.replace(/end$/, 'End');
function memberBits(text, mark) {
  if (!mark) return [text];
  const M = MARKS[mark] || null;
  const out = []; let last = 0;
  // "per red member", "per other blue member", "per 2 members", "per member", "a blue member", "Counts as 3 members"
  const re = new RegExp(`\\b(?:(\\d+) )?(?:(other) )?(?:(${COLORS.join('|')}) )?members?\\b`, 'g');
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, n, other, color] = m;
    const title = `${n ? `${n} ` : ''}${other ? 'other ' : ''}${color ? `${color} ` : ''}member${n > 1 ? 's' : ''}`;
    if (mark === 'pill') { out.push(<span key={m.index} className="il-pill" style={{ '--pc': color ? `var(--${color})` : 'var(--ink3)' }}>{m[0]}</span>); last = m.index + m[0].length; continue; }
    out.push(<span key={m.index} className="il-amt">{other ? 'other ' : ''}{n ? <b className="rich-n">{n}</b> : null}<M color={color} title={title} /></span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
const Words = ({ text, mark }) => <>{memberBits(text, mark).map((b, k) => (typeof b === 'string' ? <Rich key={k} text={b} timingDone /> : b))}</>;

const ROUNDS = /^(.*?)\+(\d+) (.+?) in round I, \+(\d+) in round II, \+(\d+) in round III\.$/;
function Rule({ text, opts }) {
  let t = text;
  if (opts.once) t = t.replace(/One Time Use/g, opts.once);
  const sentences = t.split(/(?<=\.)\s+/);
  return <span className="il-rule">{sentences.map((s, i) => {
    const keys = []; let body = s;
    if (opts.bold || opts.band) {
      KEY.lastIndex = 0;
      const m = KEY.exec(s);
      if (m && m.index === 0) { keys.push(fixCase(m[1])); body = s.slice(m[0].length).trim(); }
    }
    const r = opts.rounds && body.match(ROUNDS);
    const inner = r
      ? <span className="il-rounds">{r[1] ? <Words text={r[1]} mark={opts.mark} /> : null}<span className="il-rline">{[r[2], r[4], r[5]].map((n, k) => <span key={k} className={`il-r${k === 0 ? ' now' : ''}`}>{k ? <i className="il-sep"> · </i> : null}<i className="il-rn">{['I', 'II', 'III'][k]}</i> <b className="rich-n">+{n}</b></span>)}</span><span className="il-rtail"><Words text={r[3]} mark={opts.mark} /></span></span>
      : <Words text={body} mark={opts.mark} />;
    if (opts.band && keys.length) return <span key={i} className="il-line"><span className="il-band">{keys[0]}</span>{inner}</span>;
    return <span key={i} className="il-line">{keys.length ? <><strong className="il-key">{keys[0]}:</strong>{' '}</> : null}{inner}</span>;
  })}</span>;
}

// ---------- the Header card (?lab=cards look H), rule text swapped for a treatment ----------
const Art = ({ d, size = 96 }) => <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(d)} size={size} />;
const colorOf = d => (d.quadrant && TABLE.quadrants.includes(d.quadrant) ? quadrant(d.quadrant).resource : null);
const Corner = ({ d }) => <span className="cl-worth il-corner"><b className="num">{d.n}</b><MemberGlyph r={colorOf(d)} size={18} />{d.f !== d.n ? <><b className="num il-f">{d.f}</b><FollowerGlyph size={16} /></> : null}</span>;
const Worth = ({ d }) => <span className="cl-worth"><b className="num">{d.f}</b><FollowerGlyph size={16} title={`worth ${d.f}`} /></span>;
function Card({ d, opts }) {
  const text = ability(d);
  const M = opts.mark && MARKS[opts.mark];
  return <article className={`cl-card cl-x cl-h${opts.big ? ' il-big' : ''}`} style={{ '--c': cardColor(TABLE, d) }} data-ground={cardGround(TABLE, d)}>
    <header className="x-head"><span className="x-cost num">{total(d)}</span><b className="x-name">{d.name}</b><span className="x-worth">{opts.corner ? <Corner d={d} /> : <Worth d={d} />}</span></header>
    <div className="x-art"><Art d={d} /></div>
    <div className="x-box">{text ? <Rule text={text} opts={opts} /> : <span className="cl-none">Worth {d.f}.</span>}</div>
    <footer className="x-foot"><CostShapes parts={costParts(d, TABLE.resources)} />
      {d.n > 1 && !opts.corner && (M ? <span className="il-count" title={`counts as ${d.n} members`}><b className="rich-n">{d.n}</b><M title={`counts as ${d.n} members`} /></span> : <span className="cl-n">counts as {d.n}</span>)}
    </footer>
  </article>;
}

const ROWS = [
  ['0', 'Today', 'The Header card as Cory picked it.', {}],
  ['1', 'Bold keywords', 'Every keyword bold, words unchanged.', { bold: true }],
  ['2', 'Member mark: a card', '"member" is a little card; a member of a color is the card in that color. "Counts as 3" is 3 cards in the foot.', { bold: true, mark: 'card' }],
  ['3', 'Member mark: a hood', 'The same, drawn as a hooded cult member, like the portraits.', { bold: true, mark: 'hood' }],
  ['4', 'Once per game', '"One Time Use" renamed to pair with "Once per round"; by-round amounts read "I +1 · II +2 · III +3" as on the wheel.', { bold: true, mark: 'card', once: 'Once per game', rounds: true }],
  ['5', 'Activate', 'Cory\'s "Activate", same marks.', { bold: true, mark: 'card', once: 'Activate', rounds: true }],
  ['10', 'Bust in the corner', 'The corner shows how many members the card counts as, as busts in its color; that number is its followers too. Cards whose followers differ show both.', { bold: true, mark: 'bust', once: 'Once per game', rounds: true, big: true, corner: true }],
  ['9', 'Head and shoulders', 'A red member is a red bust; any member is the same bust split in the table\'s colors, like the wild token.', { bold: true, mark: 'bust', once: 'Once per game', rounds: true, big: true }],
  ['7', 'Member words in a tag', 'The words stay; "red member" sits in a tag of its color, so it reads at a glance.', { bold: true, mark: 'pill', once: 'Once per game', rounds: true }],
  ['8', 'Hood, bigger', 'The hooded figure at full text height, colored like its member.', { bold: true, mark: 'hood', once: 'Once per game', rounds: true, big: true }],
  ['6', 'Keyword band', 'The keyword sits on its own small line above what it does, like a trading card\'s trigger.', { band: true, mark: 'card', once: 'Once per game', rounds: true }],
];

export default function IconsLab() {
  const q = new URLSearchParams(location.search);
  const only = q.get('rows');
  const picks = (q.get('names') || '').split(',').filter(Boolean);
  const defs = (picks.length ? picks : PICKS).map(find).filter(Boolean);
  return <main className="cl il" style={anyDotVars(['red', 'purple', 'blue', 'green'])}>
    {ROWS.filter(([k]) => !only || only.split(',').includes(k)).map(([k, name, say, opts]) => <section key={k} className="cl-look" data-row={k}>
      <h2><b>{k}</b> {name} <small>{say}</small></h2>
      <div className="cl-row">{defs.map(d => <Card key={d.id} d={d} opts={opts} />)}</div>
    </section>)}
  </main>;
}
