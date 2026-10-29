// Mockups of a rival's seat card. Cory, Oct 29: "the hover over to understand what other players members do needs to
// be better organized… way easier to digest at a glance"; round 2: "better distinct groupings based on type of card,
// and cost… this hover over can take up a bit more space if needed, its an important one… a better one-stop shop for
// all the competitive info about another players members… do 10 mocks this time, wider variety, elegant design".
// Shown only with ?seatmock=1…10 in the URL; the game's own card is untouched until he picks one. Everything is read
// off the engine (memberRows, roundStartIncome, contestTable, the end-game projection, card.made).
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { quadrant, cardDef, contestTable, memberCount } from '../../engine/v4/index.js';
import { cardGains, projectedEndGame } from '../format.js';
import { memberTimingWords } from './memberTiming.js';
import { onTable } from './Info.jsx';
import { Rich } from './Rich.jsx';
import { ArtifactTile } from './ArtifactDraft.jsx';
import { memberRows, spendingPower } from './memberUse.js';
import { incomeOf } from './build.js';
import './seat-mocks.css';

export const MOCK_WIDTH = { 11: 920, 12: 920, 13: 920, 14: 920, 15: 920, 1: 480, 2: 480, 3: 900, 4: 520, 5: 520, 6: 780, 7: 760, 8: 760, 9: 900, 10: 560 };
export const seatMock = () => {
  try { const m = new URLSearchParams(window.location.search).get('seatmock'); return m && MOCK_WIDTH[m] ? m : null; } catch { return null; }
};

// ---------- the facts ----------
const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };
const artQ = (state, uid) => Object.keys(state.artifacts || {}).find(q => state.artifacts[q] === uid) || null;

// the card's own keywords, in the order a turn meets them
const TYPES = [
  ['artifact', 'Artifact'], ['once-game', 'Once per Game'], ['once-round', 'Once per Round'], ['round', 'Round Start'],
  ['whenever', 'Whenever'], ['always', 'Always'], ['end', 'Game End'], ['recruit', 'On Recruit'], ['plain', 'No ability'],
];
const LABEL = Object.fromEntries(TYPES);
const typeOf = r => (r.kind === 'artifact' ? 'artifact' : r.kind === 'use' ? (r.def.activate === 'round' ? 'once-round' : 'once-game')
  : r.kind === 'income' ? 'round' : r.kind === 'reacts' ? 'whenever' : r.kind === 'end' ? 'end' : r.kind === 'joined' ? 'recruit'
    : r.kind === 'worth' ? 'plain' : 'always');
// the ability without the keyword its group already says ("Once per Round: swap…" under Once per Round)
const bare = (t, type) => {
  const s = String(t || '').trim();
  const m = s.match(/^([^:]{2,40}):\s*/);
  return m && LABEL[type] && m[1].toLowerCase() === LABEL[type].toLowerCase() ? s.slice(m[0].length) : s;
};
const price = r => (r.kind === 'artifact' ? -1 : (r.def.s || 0) + (r.def.w || 0));
// it can reach you: it names rivals, steals or takes, or hits everyone
const hitsYou = r => /rival|steal|\btake|from (each|another|a) player|everyone|each player|all players/i.test(r.text || '');
const sumText = (state, m) => [...state.resources.filter(c => m[c] > 0).map(c => `+${m[c]} ${c}`), ...(m.followers > 0 ? [`+${m.followers} follower${m.followers === 1 ? '' : 's'}`] : [])].join(' ');
const madeOf = (state, r) => {
  const m = {};
  for (const u of r.uids) for (const [k, n] of Object.entries((state.cards[u] && state.cards[u].made) || {})) m[k] = (m[k] || 0) + n;
  return sumText(state, m);
};

function intel(state, pid) {
  const p = state.players[pid];
  const rows = memberRows(state, pid, null).map(r => ({ ...r, type: typeOf(r) }));
  if (p.artifact != null) {
    const d = cardDef(state, p.artifact);
    rows.unshift({ key: 'artifact', uids: [p.artifact], uid: p.artifact, def: d, name: d.name, n: 1, text: memberTimingWords(d.text || ''), kind: 'artifact', type: 'artifact' });
  }
  rows.sort((a, b) => price(b) - price(a) || a.name.localeCompare(b.name));
  for (const r of rows) {
    r.made = madeOf(state, r);
    r.end = r.kind === 'end' ? cardGains(state, r.uid).end : null;
    r.threat = (r.type === 'once-game' || r.type === 'once-round') ? r.loaded && hitsYou(r) : (r.type === 'whenever' || r.type === 'always') && hitsYou(r);
  }
  const groups = TYPES.map(([t, label]) => ({ t, label, rows: rows.filter(r => r.type === t), n: rows.filter(r => r.type === t).reduce((s, r) => s + r.n, 0) })).filter(g => g.rows.length);
  const inc = incomeOf(state, pid);
  const income = inc ? sumText(state, { ...inc.res, followers: inc.followers }) : '';
  let endNow = 0;
  try { endNow = (projectedEndGame(state)[pid] || { total: 0 }).total; } catch { /* none */ }
  const made = {};
  for (const r of rows) for (const u of r.uids) for (const [k, n] of Object.entries((state.cards[u] && state.cards[u].made) || {})) made[k] = (made[k] || 0) + n;
  let rims = [];
  try {
    rims = contestTable(state).map(c => {
      const mine = (c.rows.find(x => x.player === pid) || { count: 0 }).count;
      const best = Math.max(0, ...c.rows.filter(x => x.player !== pid).map(x => x.count));
      const lead = c.winners.includes(pid);
      return { qid: c.qid, label: c.label, res: quadrant(c.qid).resource, mine, best, lead, tie: lead && c.winners.length > 1, prize: c.prize };
    });
  } catch { /* unread */ }
  let spend = null;
  try { spend = spendingPower(state, p); } catch { /* none */ }
  const members = rows.filter(r => r.kind !== 'artifact').reduce((s, r) => s + r.n, 0);
  return { p, rows, groups, income, endNow, gained: sumText(state, made), rims, spend, members, uses: rows.filter(r => r.kind === 'use' && r.loaded), threats: rows.filter(r => r.threat) };
}

// ---------- pieces ----------
const Pic = ({ state, row, size = 24 }) => (row.kind === 'artifact'
  ? <ArtifactTile q={artQ(state, row.uid)} res={artQ(state, row.uid) ? quadrant(artQ(state, row.uid)).resource : 'colorless'} size={size} />
  : <Sprite id={[row.def.id, spriteId(row.name)]} kind="member" sphere={sphereOf(state, row.def)} size={size} />);
const tint = (state, r) => { const q = r.kind === 'artifact' ? artQ(state, r.uid) : onTable(state, r.def) ? r.def.quadrant : null; return q ? `var(--${q})` : 'var(--colorless, #8a7f72)'; };
const Disc = ({ r }) => (r.kind === 'artifact' ? <span className="sm-disc none" aria-hidden="true" /> : <span className="sm-disc num" title={`Costs ${price(r)}`}>{price(r)}</span>);
const Name = ({ r }) => <b className="sm-name">{r.name}{r.n > 1 ? <span className="num"> ×{r.n}</span> : null}</b>;
const State = ({ r }) => (r.kind === 'use' ? <span className={`sm-state${r.loaded ? ' live' : ''}`}>{r.loaded ? 'not used yet' : 'used'}</span> : r.used ? <span className="sm-state">used this round</span> : null);
const Gain = ({ r, words = true }) => (r.made ? <span className="sm-gain"><Rich text={r.made} />{words ? <small> so far</small> : null}</span>
  : r.end != null ? <span className="sm-gain"><Rich text={`+${r.end} followers`} />{words ? <small> at game end</small> : null}</span> : null);
const Text = ({ r }) => (r.type === 'plain' ? null : <span className="sm-text"><Rich text={bare(r.text, r.type)} /></span>);
const Chip = ({ state, r }) => <span className="sm-chip" title={r.text}><Disc r={r} /><Pic state={state} row={r} size={20} /><Name r={r} /></span>;
const Kw = ({ t }) => <span className={`sm-kw t-${t}`}>{LABEL[t]}</span>;

function Line({ state, r, kw = false, gain = true }) {
  return (
    <div className={`sm-line${r.threat ? ' threat' : ''}${r.kind === 'use' && !r.loaded ? ' spent' : ''}`} style={{ '--mc': tint(state, r) }}>
      <Disc r={r} />
      <Pic state={state} row={r} />
      <span className="sm-what"><span className="sm-top"><Name r={r} />{kw ? <Kw t={r.type} /> : null}<State r={r} /></span><Text r={r} /></span>
      {gain ? <Gain r={r} /> : <span />}
    </div>
  );
}
function Panel({ state, g, gain = true }) {
  return (
    <section className={`sm-panel t-${g.t}`}>
      <h5><span>{g.label}</span><span className="sm-count num">{g.n}</span></h5>
      {g.t === 'plain'
        ? <div className="sm-chips">{g.rows.map(r => <Chip key={r.key} state={state} r={r} />)}</div>
        : g.rows.map(r => <Line key={r.key} state={state} r={r} gain={gain} />)}
    </section>
  );
}
// the four numbers a rival's members add up to
function Stats({ state, I, vertical = false }) {
  const cells = [
    ['Next round start', I.income ? <Rich text={I.income} /> : <span className="sm-nil">nothing</span>],
    ['Game End if it ended now', I.endNow ? <Rich text={`+${I.endNow} followers`} /> : <span className="sm-nil">nothing</span>],
    ['Uses still in hand', I.uses.length ? <span className="num">{I.uses.length}</span> : <span className="sm-nil">none</span>],
    ['Members gained this game', I.gained ? <Rich text={I.gained} /> : <span className="sm-nil">nothing yet</span>],
  ];
  return <div className={`sm-stats${vertical ? ' v' : ''}`}>{cells.map(([k, v]) => <div key={k} className="sm-stat"><span className="sm-k">{k}</span><span className="sm-v">{v}</span></div>)}</div>;
}
function Rims({ I, compact = false }) {
  if (!I.rims.length) return null;
  return (
    <div className={`sm-rims${compact ? ' compact' : ''}`}>
      {I.rims.map(r => (
        <div key={r.qid} className={`sm-rim${r.lead ? ' lead' : ''}`} style={{ '--rc': `var(--${r.res})` }}>
          <span className="sm-rim-l">{r.label}</span>
          <span className="sm-rim-v num">{r.mine}</span>
          <span className="sm-rim-s">{r.tie ? 'tied for the lead' : r.lead ? `leads by ${r.mine - r.best}` : r.best ? `${r.best - r.mine} behind` : '—'}</span>
        </div>
      ))}
    </div>
  );
}
function Watch({ state, I }) {
  if (!I.threats.length) return <p className="sm-calm">Nothing here can reach you right now.</p>;
  return (
    <section className="sm-watch">
      <h5><span>Can reach you</span><span className="sm-count num">{I.threats.length}</span></h5>
      {I.threats.map(r => <Line key={r.key} state={state} r={r} kw gain={false} />)}
    </section>
  );
}

// ---------- the ten ----------
// 1 Dossier: the four numbers up top, then one panel per card type, priciest first
function M1({ state, I }) {
  return <div className="sm sm-1"><Stats state={state} I={I} />{I.groups.map(g => <Panel key={g.t} state={state} g={g} />)}</div>;
}
// 2 Threat first: what can reach you, then their engine, then what scores, then the rest
function M2({ state, I }) {
  const shelves = [
    ['Their engine', ['artifact', 'round', 'whenever', 'once-game', 'once-round']],
    ['How they score', ['end', 'always']],
    ['Done or plain', ['recruit', 'plain']],
  ];
  return (
    <div className="sm sm-2">
      <Watch state={state} I={I} />
      {shelves.map(([label, ts]) => {
        const rs = I.rows.filter(r => ts.includes(r.type) && !r.threat);
        if (!rs.length) return null;
        return <section key={label} className="sm-panel"><h5><span>{label}</span><span className="sm-count num">{rs.reduce((s, r) => s + r.n, 0)}</span></h5>{rs.map(r => <Line key={r.key} state={state} r={r} kw />)}</section>;
      })}
    </div>
  );
}
// 3 Columns: one column per kind of card, side by side, wide and short
function M3({ state, I }) {
  const cols = [['Uses', ['artifact', 'once-game', 'once-round']], ['Every round', ['round', 'whenever']], ['Standing and scoring', ['always', 'end']], ['Done or plain', ['recruit', 'plain']]];
  return (
    <div className="sm sm-3">
      <Stats state={state} I={I} />
      <div className="sm-cols">
        {cols.map(([label, ts]) => (
          <div key={label} className="sm-col">
            <h5><span>{label}</span></h5>
            {I.groups.filter(g => ts.includes(g.t)).map(g => (
              <div key={g.t} className="sm-sub"><span className="sm-subh">{g.label}</span>
                {g.rows.map(r => <div key={r.key} className={`sm-card3${r.threat ? ' threat' : ''}`} style={{ '--mc': tint(state, r) }}><span className="sm-top"><Disc r={r} /><Pic state={state} row={r} size={20} /><Name r={r} /></span><Text r={r} /><span className="sm-foot"><State r={r} /><Gain r={r} /></span></div>)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
// 4 Cost ladder: members on rungs by price, the card's keyword beside each, so the expensive core reads first
function M4({ state, I }) {
  const prices = [...new Set(I.rows.map(price))].sort((a, b) => b - a);
  return (
    <div className="sm sm-4">
      <Stats state={state} I={I} />
      <div className="sm-ladder">
        {prices.map(c => (
          <div key={c} className="sm-rung">
            <span className="sm-rung-c">{c < 0 ? <span className="sm-k">Artifact</span> : <span className="sm-disc num big">{c}</span>}</span>
            <div className="sm-rung-m">{I.rows.filter(r => price(r) === c).map(r => <div key={r.key} className={`sm-rl${r.threat ? ' threat' : ''}`}><span className="sm-top"><Pic state={state} row={r} size={20} /><Name r={r} /><Kw t={r.type} /><State r={r} /><Gain r={r} words={false} /></span><Text r={r} /></div>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
// 5 The race: where they stand on each rim, then the members that matter for it, grouped by type
function M5({ state, I }) {
  return <div className="sm sm-5"><Rims I={I} />{I.groups.map(g => <Panel key={g.t} state={state} g={g} />)}</div>;
}
// 6 Ledger: one aligned row per member with columns, a header row per type, totals at the foot
function M6({ state, I }) {
  return (
    <div className="sm sm-6">
      <table>
        <thead><tr><th className="c">Cost</th><th>Member</th><th>Does</th><th className="r">Gained</th></tr></thead>
        {I.groups.map(g => (
          <tbody key={g.t}>
            <tr className="sm-trh"><th colSpan={4}>{g.label} <span className="num">{g.n}</span></th></tr>
            {g.rows.map(r => (
              <tr key={r.key} className={r.threat ? 'threat' : r.kind === 'use' && !r.loaded ? 'spent' : ''}>
                <td className="c"><Disc r={r} /></td>
                <td><span className="sm-top"><Pic state={state} row={r} size={20} /><Name r={r} /></span></td>
                <td>{g.t === 'plain' ? <span className="sm-nil">nothing</span> : <><Rich text={bare(r.text, r.type)} /> <State r={r} /></>}</td>
                <td className="r"><Gain r={r} words={false} /></td>
              </tr>
            ))}
          </tbody>
        ))}
        <tfoot><tr><td colSpan={2}>Next round start <Rich text={I.income || 'nothing'} /></td><td>Game End now <Rich text={I.endNow ? `+${I.endNow} followers` : 'nothing'} /></td><td className="r"><Rich text={I.gained || ''} /></td></tr></tfoot>
      </table>
    </div>
  );
}
// 7 Spread: a summary page on the left (numbers, rims, colors), the members by type on the right
function M7({ state, I }) {
  return (
    <div className="sm sm-7">
      <div className="sm-left"><Stats state={state} I={I} vertical /><Rims I={I} compact /></div>
      <div className="sm-right">{I.groups.map(g => <Panel key={g.t} state={state} g={g} gain={false} />)}</div>
    </div>
  );
}
// 8 Shelves: small card faces on a shelf per type, priciest left; a use still in hand is lit, a spent one faded
function M8({ state, I }) {
  return (
    <div className="sm sm-8">
      {I.groups.map(g => (
        <section key={g.t} className="sm-shelf">
          <h5><span>{g.label}</span><span className="sm-count num">{g.n}</span></h5>
          <div className="sm-faces8">
            {g.rows.map(r => (
              <div key={r.key} className={`sm-face8${r.kind === 'use' ? (r.loaded ? ' loaded' : ' spent') : ''}${r.threat ? ' threat' : ''}`} style={{ '--mc': tint(state, r) }}>
                <span className="sm-f8-bar"><Disc r={r} /><span className="sm-f8-n">{r.name}{r.n > 1 ? ` ×${r.n}` : ''}</span></span>
                <span className="sm-f8-pic"><Pic state={state} row={r} size={32} /></span>
                {g.t !== 'plain' ? <span className="sm-f8-t"><Rich text={bare(r.text, r.type)} /></span> : null}
                {r.made || r.end != null ? <span className="sm-f8-g"><Gain r={r} words={false} /></span> : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
// 9 A round in their hands: columns in the order things happen (round start, their turns, any time, game end)
function M9({ state, I }) {
  const stages = [
    ['Round Start', 'at the start of each round', ['round']],
    ['On their turn', 'when they choose', ['artifact', 'once-game', 'once-round']],
    ['Any time', 'whenever it happens', ['whenever', 'always']],
    ['Game End', `+${I.endNow} if it ended now`, ['end']],
  ];
  const rest = I.rows.filter(r => r.type === 'recruit' || r.type === 'plain');
  return (
    <div className="sm sm-9">
      <div className="sm-stages">
        {stages.map(([label, sub, ts], k) => (
          <div key={label} className="sm-stage">
            <h5><span>{label}</span>{k < stages.length - 1 ? <span className="sm-arrow" aria-hidden="true">›</span> : null}</h5>
            <small className="sm-stage-sub">{label === 'Round Start' && I.income ? <Rich text={`${I.income} next round`} /> : sub}</small>
            {I.rows.filter(r => ts.includes(r.type)).map(r => <div key={r.key} className={`sm-card3${r.threat ? ' threat' : ''}`} style={{ '--mc': tint(state, r) }}><span className="sm-top"><Disc r={r} /><Pic state={state} row={r} size={20} /><Name r={r} /></span><Text r={r} /><span className="sm-foot"><State r={r} /><Gain r={r} /></span></div>)}
          </div>
        ))}
      </div>
      {rest.length ? <div className="sm-rest"><span className="sm-k">No ability or done on recruit</span>{rest.map(r => <Chip key={r.key} state={state} r={r} />)}</div> : null}
    </div>
  );
}
// 10 Glance, then detail: every member's face bucketed by type with counts, then the abilities in the same order
function M10({ state, I }) {
  return (
    <div className="sm sm-10">
      <div className="sm-glance">
        {I.groups.map(g => (
          <div key={g.t} className="sm-gl">
            <span className="sm-gl-h">{g.label}</span>
            <span className="sm-gl-f">{g.rows.map(r => <span key={r.key} className={`sm-gl-p${r.threat ? ' threat' : ''}${r.kind === 'use' && !r.loaded ? ' spent' : ''}`} title={r.name}><Pic state={state} row={r} size={24} />{r.n > 1 ? <i className="num">×{r.n}</i> : null}</span>)}</span>
          </div>
        ))}
      </div>
      <Stats state={state} I={I} />
      <div className="sm-detail">{I.groups.filter(g => g.t !== 'plain' && g.t !== 'recruit').map(g => <Panel key={g.t} state={state} g={g} />)}</div>
    </div>
  );
}

// ---------- #3, polished (Cory, Oct 29: "#3 is best… give me 5 more versions with the polish applied") ----------
// The heading carries who it is, their artifact and four numbers (next Round Start, Game End if it ended now, the
// resources they hold, how many members); the body is #3's columns without the artifact. A use member not yet used
// and a used one each look plainly different (each version tries a different way).
const COLS = [['Uses', ['once-game', 'once-round']], ['Every round', ['round', 'whenever']], ['Standing and scoring', ['always', 'end']], ['Done or plain', ['recruit', 'plain']]];
const useClass = r => (r.kind === 'use' ? (r.loaded ? ' use-ready' : ' use-spent') : '');
const UseTag = ({ r, ready = 'Not used yet', spent = 'Used' }) => (r.kind === 'use' ? <span className={`sm-usetag ${r.loaded ? 'ready' : 'spent'}`}>{r.loaded ? ready : spent}</span> : null);
function held(state, p) {
  const parts = state.resources.filter(c => (p.res[c] || 0) > 0).map(c => [c, p.res[c]]);
  return { total: parts.reduce((t, [, n]) => t + n, 0), text: parts.map(([c, n]) => `${n} ${c}`).join(' ') };
}
function Head({ state, I, who, layout = 'grid' }) {
  const art = I.rows.find(r => r.kind === 'artifact');
  const h = held(state, I.p);
  const n = memberCount(state, I.p);
  const stats = [
    ['Next Round Start', I.income ? <Rich text={I.income} /> : <span className="sm-nil">nothing</span>],
    ['Game End, if it ended now', I.endNow ? <Rich text={`+${I.endNow} followers`} /> : <span className="sm-nil">nothing</span>],
    ['Resources', <><span className="num">{h.total}</span>{h.text ? <span className="sm-held"><Rich text={h.text} /></span> : null}</>],
    ['Members', <span className="num">{n}</span>],
  ];
  return (
    <header className={`sm-head l-${layout}`}>
      <div className="sm-who"><div className="t">{who}</div>
        {art ? <div className="sm-art" style={{ '--mc': tint(state, art) }}><Pic state={state} row={art} size={28} /><span><span className="sm-top"><span className="sm-k">Artifact</span><Name r={art} /></span><span className="sm-text"><Rich text={art.text} /></span>{art.made ? <span className="sm-gain"><Rich text={art.made} /><small> so far</small></span> : null}</span></div> : null}
      </div>
      <div className="sm-nums">{stats.map(([k, v]) => <div key={k} className="sm-num"><span className="sm-k">{k}</span><span className="sm-v">{v}</span></div>)}</div>
    </header>
  );
}
function Card3({ state, r, face = 'tile' }) {
  if (face === 'bar') {
    return (
      <div className={`sm-c3 bar${useClass(r)}${r.threat ? ' threat' : ''}`} style={{ '--mc': tint(state, r) }}>
        <span className="sm-c3-bar"><span className="sm-disc num">{price(r)}</span><span className="sm-c3-n">{r.name}{r.n > 1 ? ` ×${r.n}` : ''}</span><UseTag r={r} ready="Ready" /></span>
        <span className="sm-c3-body"><Pic state={state} row={r} size={28} /><span><Text r={r} /><Gain r={r} /></span></span>
      </div>
    );
  }
  if (face === 'row') {
    return (
      <div className={`sm-c3 row${useClass(r)}${r.threat ? ' threat' : ''}`} style={{ '--mc': tint(state, r) }}>
        <span className="sm-c3-pic"><Pic state={state} row={r} size={32} />{r.kind === 'use' && !r.loaded ? <span className="sm-check" aria-hidden="true">✓</span> : null}</span>
        <span className="sm-c3-main"><span className="sm-top"><Disc r={r} /><Name r={r} /><UseTag r={r} ready="Ready" /></span><Text r={r} /><Gain r={r} /></span>
      </div>
    );
  }
  return (
    <div className={`sm-c3${useClass(r)}${r.threat ? ' threat' : ''}`} style={{ '--mc': tint(state, r) }}>
      <span className="sm-top"><Disc r={r} /><Pic state={state} row={r} size={24} /><Name r={r} /></span>
      <Text r={r} />
      <span className="sm-foot"><UseTag r={r} /><Gain r={r} /></span>
    </div>
  );
}
function Columns({ state, I, face, splitUses = false }) {
  return (
    <div className="sm-cols">
      {COLS.map(([label, ts]) => (
        <div key={label} className="sm-col">
          <h5><span>{label}</span></h5>
          {I.groups.filter(g => ts.includes(g.t)).map(g => {
            if (splitUses && (g.t === 'once-game' || g.t === 'once-round')) {
              const ready = g.rows.filter(r => r.loaded), spent = g.rows.filter(r => !r.loaded);
              return (
                <div key={g.t} className="sm-sub"><span className="sm-subh">{g.label}</span>
                  {ready.length ? <><span className="sm-subk ready">Not used yet</span>{ready.map(r => <Card3 key={r.key} state={state} r={r} face={face} />)}</> : null}
                  {spent.length ? <><span className="sm-subk">Used</span><div className="sm-spentchips">{spent.map(r => <span key={r.key} className="sm-spentchip"><span className="sm-check" aria-hidden="true">✓</span><Pic state={state} row={r} size={20} /><Name r={r} /></span>)}</div></> : null}
                </div>
              );
            }
            return (
              <div key={g.t} className="sm-sub"><span className="sm-subh">{g.label}</span>
                {g.t === 'plain' ? <div className="sm-chips">{g.rows.map(r => <Chip key={r.key} state={state} r={r} />)}</div> : g.rows.map(r => <Card3 key={r.key} state={state} r={r} face={face} />)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
const P3 = ({ state, I, who, v, layout, face, splitUses }) => (
  <div className={`sm sm-3 sm-p v${v}`}><Head state={state} I={I} who={who} layout={layout} /><Columns state={state} I={I} face={face} splitUses={splitUses} /></div>
);
// 11 Glow: heading as identity and artifact beside a 2×2 of numbers; a use not yet used glows in its color, a used one is dashed and faded
const M11 = p => <P3 {...p} v={11} layout="grid" face="tile" />;
// 12 Scoreboard: the four numbers big in one row under the name; ready uses lit like a lamp, used ones greyed with a "Used" stamp
const M12 = p => <P3 {...p} v={12} layout="board" face="tile" />;
// 13 Cards: each member a small card with its color bar (as in the shop); ready ones framed in their color, used ones turned face down
const M13 = p => <P3 {...p} v={13} layout="grid" face="bar" />;
// 14 Ready and used apart: inside Uses, "Not used yet" cards on top with a ring, used ones shrunk to ticked chips below
const M14 = p => <P3 {...p} v={14} layout="line" face="tile" splitUses />;
// 15 Portraits: a bigger picture leads each card; a ready one has a lit ring and "Ready", a used one a big tick over its picture
const M15 = p => <P3 {...p} v={15} layout="grid" face="row" />;

const MOCKS = { 11: M11, 12: M12, 13: M13, 14: M14, 15: M15, 1: M1, 2: M2, 3: M3, 4: M4, 5: M5, 6: M6, 7: M7, 8: M8, 9: M9, 10: M10 };
export function SeatMockBody({ state, pid, mock, who = null }) {
  const M = MOCKS[mock];
  return M ? <M state={state} I={intel(state, pid)} who={who} /> : null;
}
