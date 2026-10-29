// A rival's seat card: everything competitive about their cult in one place (Cory, Oct 29: "a better one-stop shop
// for all the competitive info about another players members… distinct groupings based on type of card, and cost";
// he picked mockup 13 of the round: small cards with their color bar, in columns by the card's keyword, priciest
// first). The heading is who, their artifact, and four numbers: what each Round Start gives them, Game End if it
// ended now, the resources they hold and their members by color. A use member not used yet is framed and lit in its
// color; a used one is turned face down. Everything is read off the engine.
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { quadrant, cardDef, memberCount, memberWeight, countMembersOfColor } from '../../engine/v4/index.js';
import { projectedEndGame } from '../format.js';
import { memberTimingWords } from './memberTiming.js';
import { onTable, CardName } from './Info.jsx';
import { Rich } from './Rich.jsx';
import { MemberGlyph } from './Glyphs.jsx';
import { ArtifactTile } from './ArtifactDraft.jsx';
import { memberRows } from './memberUse.js';
import { incomeOf } from './build.js';
import { cardGains } from '../format.js';
import './rival-card.css';

export const RIVAL_CARD_WIDTH = 920;

// the card's own keywords, in the order a turn meets them
const TYPES = [
  ['once-game', 'Once per Game'], ['once-round', 'Once per Round'], ['round', 'Round Start'], ['whenever', 'Whenever'],
  ['always', 'Always'], ['end', 'Game End'], ['recruit', 'On Recruit'], ['plain', 'No ability'],
];
const COLS = [['Uses', ['once-game', 'once-round']], ['Every round', ['round', 'whenever']], ['Standing and scoring', ['always', 'end']], ['Done or plain', ['recruit', 'plain']]];
const typeOf = r => (r.kind === 'use' ? (r.def.activate === 'round' ? 'once-round' : 'once-game')
  : r.kind === 'income' ? 'round' : r.kind === 'reacts' ? 'whenever' : r.kind === 'end' ? 'end' : r.kind === 'joined' ? 'recruit'
    : r.kind === 'worth' ? 'plain' : 'always');
const price = r => (r.def.s || 0) + (r.def.w || 0);
const sumText = (state, m) => [...state.resources.filter(c => m[c] > 0).map(c => `+${m[c]} ${c}`), ...(m.followers > 0 ? [`+${m.followers} follower${m.followers === 1 ? '' : 's'}`] : [])].join(' ');
const madeOf = (state, uids) => {
  const m = {};
  for (const u of uids) for (const [k, n] of Object.entries((state.cards[u] && state.cards[u].made) || {})) m[k] = (m[k] || 0) + n;
  return sumText(state, m);
};
const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };
const tint = (state, d) => (onTable(state, d) ? `var(--${d.quadrant})` : 'var(--colorless, #8a7f72)');
const Pic = ({ state, def, name, size }) => <Sprite id={[def.id, spriteId(name)]} kind="member" sphere={sphereOf(state, def)} size={size} />;

function Heading({ state, pid, who }) {
  const p = state.players[pid];
  const artUid = p.artifact;
  const art = artUid != null ? cardDef(state, artUid) : null;
  const artQ = art ? Object.keys(state.artifacts || {}).find(q => state.artifacts[q] === artUid) : null;
  const artMade = art ? madeOf(state, [artUid]) : '';
  const inc = state.over ? null : incomeOf(state, pid);
  const income = inc ? sumText(state, { ...inc.res, followers: inc.followers }) : '';
  let end = 0;
  if (state.over) end = p.final ? p.final.total : 0;
  else { try { end = (projectedEndGame(state)[pid] || { total: 0 }).total; } catch { end = 0; } }
  const held = state.resources.filter(c => (p.res[c] || 0) > 0);
  const total = held.reduce((t, c) => t + p.res[c], 0);
  // members by color, as the rims count them (a card that counts as 3 counts 3); off-table colors last
  const byColor = state.quadrants.map(q => [quadrant(q).resource, countMembersOfColor(state, p, q)]).filter(([, n]) => n > 0);
  const off = p.members.filter(u => !onTable(state, cardDef(state, u))).reduce((s, u) => s + memberWeight(state, u), 0);
  if (off) byColor.push(['colorless', off]);
  const nums = [
    ['Each Round Start', 'round', income ? <Rich text={income} /> : <span className="rc-nil">nothing</span>],
    [state.over ? 'Game End' : 'Game End, if it ended now', 'end', end ? <Rich text={`${end > 0 ? '+' : '−'}${Math.abs(end)} followers`} /> : <span className="rc-nil">nothing</span>],
    ['Resources', 'res', <><span className="num">{total}</span>{held.length ? <span className="rc-split"><Rich text={held.map(c => `${p.res[c]} ${c}`).join(' ')} /></span> : null}</>],
    ['Members', 'members', <><span className="num">{memberCount(state, p)}</span>{byColor.length ? <span className="rc-split">{byColor.map(([r, n]) => <span key={r} className="rc-bust"><b className="num">{n}</b><MemberGlyph r={r} n={n} size={14} /></span>)}</span> : null}</>],
  ];
  return (
    <header className="rc-head">
      <div className="rc-who">
        <div className="t">{who}</div>
        {art ? (
          <div className="rc-art" data-artifact-row={artUid} style={{ '--mc': artQ ? `var(--${artQ})` : 'var(--colorless, #8a7f72)' }}>
            <ArtifactTile q={artQ} res={artQ ? quadrant(artQ).resource : 'colorless'} size={28} />
            <span><span className="rc-k">Artifact</span> <b className="rc-name">{art.name}</b><span className="rc-text"><Rich text={memberTimingWords(art.text || '')} /></span>{artMade ? <span className="rc-gain"><Rich text={artMade} /><small> so far</small></span> : null}</span>
          </div>
        ) : null}
      </div>
      <div className="rc-nums">{nums.map(([k, key, v]) => <div key={key} className="rc-num" data-rival-num={key}><span className="rc-k">{k}</span><span className="rc-v">{v}</span></div>)}</div>
    </header>
  );
}

function Card({ state, r }) {
  const use = r.kind === 'use';
  const st = use ? (r.loaded ? 'unused' : 'used') : r.used ? 'used' : '';
  const end = r.kind === 'end' && !state.over ? cardGains(state, r.uid).end : null;
  const made = madeOf(state, r.uids);
  return (
    <div className={`rc-card${use ? (r.loaded ? ' use-unused' : ' use-used') : ''}`} data-member-row={r.def.id} data-state={st || undefined} style={{ '--mc': tint(state, r.def) }}>
      <span className="rc-bar">
        <span className="rc-disc num" title={`Costs ${price(r)}`}>{price(r)}</span>
        <span className="rc-bar-n"><CardName state={state} uid={r.uid} />{r.n > 1 ? ` ×${r.n}` : ''}</span>
        {use ? <span className="rc-usetag">{r.loaded ? 'Not used yet' : 'Used'}</span> : r.used ? <span className="rc-usetag">Used this round</span> : null}
      </span>
      <span className="rc-body">
        <Pic state={state} def={r.def} name={r.name} size={28} />
        <span className="rc-main">
          <span className="rc-text" data-ability><Rich text={r.text} /></span>
          {made ? <span className="rc-gain"><Rich text={made} /><small> so far</small></span>
            : end != null ? <span className="rc-gain"><Rich text={`+${end} followers`} /><small> if it ended now</small></span> : null}
        </span>
      </span>
    </div>
  );
}

export function RivalCard({ state, pid, who }) {
  const rows = memberRows(state, pid, null).map(r => ({ ...r, type: typeOf(r) }))
    .sort((a, b) => price(b) - price(a) || a.name.localeCompare(b.name));
  const groups = TYPES.map(([t, label]) => ({ t, label, rows: rows.filter(r => r.type === t) })).filter(g => g.rows.length);
  return (
    <div className="rc">
      <Heading state={state} pid={pid} who={who} />
      {rows.length ? (
        <div className="rc-cols" data-member-list={pid}>
          {COLS.map(([label, ts]) => (
            <div key={label} className="rc-col">
              <h5>{label}</h5>
              {groups.filter(g => ts.includes(g.t)).map(g => (
                <div key={g.t} className="rc-group"><span className="rc-gh">{g.label}</span>
                  {g.t === 'plain'
                    ? <div className="rc-chips">{g.rows.map(r => (
                      <span key={r.key} className="rc-chip" data-member-row={r.def.id} title={r.text}>
                        <span className="rc-disc num">{price(r)}</span><Pic state={state} def={r.def} name={r.name} size={20} /><b className="rc-name"><CardName state={state} uid={r.uid} />{r.n > 1 ? ` ×${r.n}` : ''}</b>
                        <span className="rc-hide" data-ability>{r.text}</span>
                      </span>
                    ))}</div>
                    : g.rows.map(r => <Card key={r.key} state={state} r={r} />)}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : <p className="mu-none">No members yet.</p>}
    </div>
  );
}
