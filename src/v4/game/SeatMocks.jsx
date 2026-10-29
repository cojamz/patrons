// Mockups of a rival's seat card (Cory, Oct 29: "the hover over to understand what other players members do needs to
// be better organized… way easier to digest at a glance… try like 5 or 6 different mocks"). Shown only with
// ?seatmock=A…F in the URL; the game's own card is untouched until he picks one. Each reads the same rows as the live
// card (memberRows) so the picked one ports as is.
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { quadrant, cardDef } from '../../engine/v4/index.js';
import { cardGains } from '../format.js';
import { memberTimingWords } from './memberTiming.js';
import { onTable } from './Info.jsx';
import { Rich } from './Rich.jsx';
import { ArtifactTile } from './ArtifactDraft.jsx';
import { memberRows } from './memberUse.js';
import './seat-mocks.css';

export const seatMock = () => {
  try { const m = new URLSearchParams(window.location.search).get('seatmock'); return m && /^[A-F]$/.test(m) ? m : null; } catch { return null; }
};

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };
const GROUP = { artifact: 'Artifact', use: 'Can use', income: 'Every round start', reacts: 'Whenever', always: 'Always', end: 'At game end', joined: 'When recruited' };
const ORDER = ['artifact', 'use', 'income', 'reacts', 'always', 'end', 'joined'];
// the ability without its timing words, when the group heading already says it
const bare = t => String(t || '').replace(/^(Round Start|On Recruit|Game end|Whenever[^:]*|Once (a|per) (round|game)|Use)\s*:\s*/i, '');
const made = (state, row) => {
  const m = {};
  for (const u of row.uids) for (const [k, n] of Object.entries((state.cards[u] && state.cards[u].made) || {})) m[k] = (m[k] || 0) + n;
  const parts = [...state.resources.filter(r => m[r] > 0).map(r => `+${m[r]} ${r}`), ...(m.followers > 0 ? [`+${m.followers} follower${m.followers === 1 ? '' : 's'}`] : [])];
  return parts.join(' ');
};
const artQ = (state, uid) => Object.keys(state.artifacts || {}).find(q => state.artifacts[q] === uid) || null;
const Pic = ({ state, row, size = 24 }) => row.kind === 'artifact'
  ? <ArtifactTile q={artQ(state, row.uid)} res={artQ(state, row.uid) ? quadrant(artQ(state, row.uid)).resource : 'colorless'} size={size} />
  : <Sprite id={[row.def.id, spriteId(row.name)]} kind="member" sphere={sphereOf(state, row.def)} size={size} />;
const color = (state, row) => { const q = row.kind === 'artifact' ? artQ(state, row.uid) : null; return q ? `var(--q-${quadrant(q).resource}, var(--${q}))` : `var(--q-${sphereOf(state, row.def)}, var(--pl-ink-3))`; };
const Name = ({ row }) => <b className="sm-name">{row.name}{row.n > 1 ? <span className="num"> ×{row.n}</span> : null}</b>;
const State = ({ row }) => (row.kind === 'use' ? <span className={`sm-state${row.loaded ? ' live' : ''}`}>{row.loaded ? 'not used yet' : 'used'}</span> : row.used ? <span className="sm-state">used this round</span> : null);

function split(state, pid) {
  const rows = memberRows(state, pid, null);
  const p = state.players[pid];
  const art = p.artifact != null ? (() => { const d = cardDef(state, p.artifact); return { key: 'artifact', uids: [p.artifact], uid: p.artifact, def: d, name: d.name, n: 1, text: memberTimingWords(d.text || ''), kind: 'artifact' }; })() : null;
  const plain = rows.filter(r => r.kind === 'worth');
  const able = [...(art ? [art] : []), ...rows.filter(r => r.kind !== 'worth')];
  const groups = ORDER.map(k => [k, able.filter(r => r.kind === k)]).filter(([, rs]) => rs.length);
  return { rows, plain, able, groups };
}
// the members with no ability: their pictures in a row, and what they're worth together
function Plain({ state, plain, label = 'No ability' }) {
  if (!plain.length) return null;
  const n = plain.reduce((s, r) => s + r.n, 0);
  return (
    <div className="sm-plain">
      <span className="sm-k">{label}</span>
      <span className="sm-faces">{plain.map(r => <span key={r.key} className="sm-face" title={`${r.name}${r.n > 1 ? ` ×${r.n}` : ''}: ${r.text}`}><Pic state={state} row={r} size={20} />{r.n > 1 ? <i className="num">×{r.n}</i> : null}</span>)}</span>
      <span className="sm-plain-n">{n} member{n === 1 ? '' : 's'}</span>
    </div>
  );
}

// A: grouped under when it happens; one line each, no prices; plain members folded into a row of faces
function MockA({ state, pid }) {
  const { groups, plain } = split(state, pid);
  return (
    <div className="sm sm-a">
      {groups.map(([k, rs]) => (
        <section key={k}><h5>{GROUP[k]}</h5>
          {rs.map(r => <div key={r.key} className="sm-row"><Pic state={state} row={r} /><span><Name row={r} /> <Rich text={bare(r.text)} /> <State row={r} /></span></div>)}
        </section>
      ))}
      <Plain state={state} plain={plain} />
    </div>
  );
}

// B: a grid of tiles, two across: picture, name, the ability small; plain members as faces under it
function MockB({ state, pid }) {
  const { able, plain } = split(state, pid);
  return (
    <div className="sm sm-b">
      <div className="sm-grid">
        {able.map(r => (
          <div key={r.key} className={`sm-tile${r.kind === 'use' && !r.loaded ? ' dim' : ''}`} style={{ '--mc': color(state, r) }}>
            <div className="sm-tile-h"><Pic state={state} row={r} size={32} /><Name row={r} /></div>
            <div className="sm-tile-t"><Rich text={r.text} /></div>
          </div>
        ))}
      </div>
      <Plain state={state} plain={plain} />
    </div>
  );
}

// C: words only, dense: name and ability on one line, grouped by when; no pictures at all
function MockC({ state, pid }) {
  const { groups, plain } = split(state, pid);
  return (
    <div className="sm sm-c">
      {groups.map(([k, rs]) => (
        <section key={k}><h5>{GROUP[k]}</h5>
          <ul>{rs.map(r => <li key={r.key} style={{ '--mc': color(state, r) }}><Name row={r} /><span className="sm-dash"> </span><Rich text={bare(r.text)} /> <State row={r} /></li>)}</ul>
        </section>
      ))}
      {plain.length ? <p className="sm-c-plain"><span className="sm-k">No ability</span> {plain.map(r => `${r.name}${r.n > 1 ? ` ×${r.n}` : ''}`).join(', ')}</p> : null}
    </div>
  );
}

// D: the cult in one line on top (members by color, what its members have gained), then only the abilities
function MockD({ state, pid }) {
  const { able, plain, rows } = split(state, pid);
  const byColor = {};
  for (const r of rows) { const c = sphereOf(state, r.def); byColor[c] = (byColor[c] || 0) + r.n; }
  const colors = Object.entries(byColor).filter(([c]) => c !== 'colorless').sort((a, b) => b[1] - a[1]);
  const total = {};
  for (const r of [...able, ...plain]) for (const u of r.uids) for (const [k, n] of Object.entries((state.cards[u] && state.cards[u].made) || {})) total[k] = (total[k] || 0) + n;
  const got = [...state.resources.filter(r => total[r] > 0).map(r => `+${total[r]} ${r}`), ...(total.followers > 0 ? [`+${total.followers} followers`] : [])].join(' ');
  return (
    <div className="sm sm-d">
      <div className="sm-sum">
        <span><Rich text={colors.map(([c, n]) => `${n} ${c} member${n === 1 ? '' : 's'}`).join(' ')} /></span>
        {got ? <span className="sm-got"><span className="sm-k">Members gained</span> <Rich text={got} /></span> : null}
      </div>
      {able.map(r => <div key={r.key} className="sm-row"><Pic state={state} row={r} /><span><Name row={r} /> <State row={r} /><br /><Rich text={r.text} /></span></div>)}
      {plain.length ? <p className="sm-quiet">and {plain.reduce((s, r) => s + r.n, 0)} with no ability</p> : null}
    </div>
  );
}

// E: small cards in the member's color, three across, the ability on the card; plain members as faces
function MockE({ state, pid }) {
  const { able, plain } = split(state, pid);
  return (
    <div className="sm sm-e">
      <div className="sm-cards">
        {able.map(r => (
          <div key={r.key} className={`sm-card${r.kind === 'use' && !r.loaded ? ' dim' : ''}`} style={{ '--mc': color(state, r) }}>
            <div className="sm-card-bar">{r.name}{r.n > 1 ? ` ×${r.n}` : ''}</div>
            <div className="sm-card-pic"><Pic state={state} row={r} size={32} /></div>
            <div className="sm-card-t"><Rich text={r.text} /></div>
          </div>
        ))}
      </div>
      <Plain state={state} plain={plain} />
    </div>
  );
}

// F: what's been working, first: each ability with what it has gained this game, biggest earners on top
function MockF({ state, pid }) {
  const { able, plain } = split(state, pid);
  const worth = r => { let s = 0; for (const u of r.uids) for (const n of Object.values((state.cards[u] && state.cards[u].made) || {})) s += n; return s; };
  const sorted = [...able].sort((a, b) => worth(b) - worth(a));
  return (
    <div className="sm sm-f">
      {sorted.map(r => {
        const m = made(state, r);
        const end = r.kind === 'end' ? cardGains(state, r.uid).end : null;
        return (
          <div key={r.key} className="sm-row f">
            <Pic state={state} row={r} />
            <span><Name row={r} /> <State row={r} /><br /><Rich text={r.text} /></span>
            <span className={`sm-made${m ? '' : ' none'}`}>{m ? <><Rich text={m} /><small>so far</small></> : end != null ? <><Rich text={`+${end} followers`} /><small>at game end</small></> : <small>nothing yet</small>}</span>
          </div>
        );
      })}
      <Plain state={state} plain={plain} />
    </div>
  );
}

const MOCKS = { A: MockA, B: MockB, C: MockC, D: MockD, E: MockE, F: MockF };
export function SeatMockBody({ state, pid, mock }) {
  const M = MOCKS[mock];
  return M ? <M state={state} pid={pid} /> : null;
}
