// The intro (Cory, 2026-10-14): ~20 seconds, seven beats, each a tiny pixel vignette on the walnut table with one
// line of text: you lead a cult → send a minion to the wheel → it pays resources → recruit a member (they join your
// cult) → buy followers (the crowd grows) → quadrant leaders win followers each round → most followers after III wins.
//
// Per player and local only: it shows on this browser's first game start (a localStorage flag), never on a resume,
// never pauses the table or touches the engine or session (bots and other seats carry on underneath). Skip is
// always on screen; after the first beat Esc or a tap anywhere also closes it. prefers-reduced-motion gets a still
// storyboard with Back/Next instead. replayIntro() opens it again from a menu. ?intro=0 never shows it on a game
// start (the e2e suites), ?intro=1 shows it on every one (review).
import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react';
import './intro.css';
import { Sprite } from './art/Sprite.jsx';
import { Follower } from './art/Follower.jsx';
import { Leader, Minion } from './art/Leader.jsx';
import { emojiIds } from './art/emojis.js';
import { drawnIds, iconFor } from './art/index.js';

// ---------- when it shows ----------
const SEEN = 'patrons.v4.introSeen';
const EVENT = 'patrons:intro';
let seenThisPage = false; // storage can be blocked: then it still shows at most once per page load
const urlIntro = () => { try { return new URLSearchParams(location.search).get('intro'); } catch { return null; } };
/** Has this browser seen the intro? */
export function introSeen() {
  if (seenThisPage) return true;
  try { return localStorage.getItem(SEEN) === '1'; } catch { return false; }
}
function markSeen() {
  seenThisPage = true;
  try { localStorage.setItem(SEEN, '1'); } catch { /* private mode: the page-load flag above covers it */ }
}
/** A new game started on this device: the intro shows if this browser hasn't seen it. */
export function introOnGameStart() { dispatchEvent(new CustomEvent(EVENT, { detail: { replay: false } })); }
/** "Replay intro" (a menu item): show it again now, seen or not. */
export function replayIntro() { dispatchEvent(new CustomEvent(EVENT, { detail: { replay: true } })); }

/** Mounted once at the app root; opens the intro on introOnGameStart() / replayIntro(). */
export function IntroGate() {
  const [open, setOpen] = useState(0); // a counter: every opening starts fresh
  useEffect(() => {
    const on = e => {
      const replay = !!(e.detail && e.detail.replay);
      const q = urlIntro();
      if (!replay && (q === '0' || (q !== '1' && introSeen()))) return;
      markSeen();
      setOpen(k => k + 1);
    };
    addEventListener(EVENT, on);
    return () => removeEventListener(EVENT, on);
  }, []);
  const close = useCallback(() => setOpen(0), []);
  return open ? <Intro key={open} onClose={close} /> : null;
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- pixel pieces ----------
// 9×9 resources from the vision kit (design/prototypes/vision/px.js): one shape per color, ink outline baked in.
const PAL = {
  k: '#1c1410', g: '#e0aa2f', G: '#9c6a12', y: '#f8dc86', s: '#b9c3cc', S: '#6e7a87', l: '#eef2f5',
  m: '#c43f7f', M: '#7c2250', p: '#f08cbb', e: '#4f9f74', E: '#2b6a4b', n: '#a5d9ad',
};
const RES = {
  gold: ['..kkkkk..', '.kyyyggk.', 'kyyggggGk', 'kygggggGk', 'kygggggGk', 'kygggggGk', 'kggggggGk', '.kGGGGGk.', '..kkkkk..'],
  silver: ['...kkk...', '..kllsk..', '..klssk..', '.kllssSk.', '.klsssSk.', '.klsssSk.', 'kllsssSSk', 'kkkkkkkkk', '...kSSk..'],
  magenta: ['..kkkkk..', '.kppmmMk.', 'kppmmmmMk', '.kpmmmMk.', '..kmmMk..', '...kmk...', '....k....', '.........', '.........'],
  green: ['.....kkk.', '...kknnk.', '..knneek.', '.kneeeEk.', '.kneeEk..', 'kneeEk...', 'kneEk....', 'kEkk.....', 'k........'],
  any: ['..kkkkk..', '.kgggssk.', 'kg.....sk', 'ke.....sk', 'ke.....mk', 'ke.....mk', 'kee...mmk', '.keemmmk.', '..kkkkk..'],
};
const runsOf = rows => {
  const out = [];
  rows.forEach((r, y) => { let x = 0; while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.') out.push({ x, y, w, fill: PAL[ch] }); x += w; } });
  return out;
};
const RES_RUNS = Object.fromEntries(Object.entries(RES).map(([k, v]) => [k, runsOf(v)]));
const Res = memo(function Res({ kind }) {
  return (
    <svg viewBox="0 0 9 9" width="9" height="9" shapeRendering="crispEdges" aria-hidden="true">
      {RES_RUNS[kind].map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
    </svg>
  );
});

// The cast. Size order everywhere: leader 32 > member 24 > minion 16 > follower 9 (one art pixel = one stage unit).
const YOU = '#e3d3b0'; // a bone robe in the lamp
const RIVAL_A = '#7b8d9d'; // slate
const RIVAL_B = '#bd6c4b'; // clay
const Q = { gold: '#c99327', silver: '#8794a2', magenta: '#b2386c', green: '#3d8c66' };
const pick = (ids, list) => list.find(id => ids.includes(id)) || null;
const SPOOKY = ['ghost', 'bat', 'skull', 'pumpkin', 'spider', 'eye', 'candle', 'moon', 'cat', 'owl'];
function cast() {
  const emo = emojiIds();
  const you = pick(emo, SPOOKY) || emo[0] || null;
  const rest = emo.filter(e => e !== you);
  const drawn = drawnIds();
  const member = pick(drawn, ['banker', 'gold.banker', 'gold.midas', 'tycoon', 'gold.tycoon']) || 'banker';
  return { you, a: rest[0] || null, b: rest[1] || null, member, memberName: iconFor(member).drawn ? iconFor(member).icon.name : 'Banker' };
}

/** Anything placed on the stage at (x, y) in stage units (the stage is 176 × 100 units; --u is the unit). */
function At({ x, y, className = '', t, style, children }) {
  return <span className={`in-at ${className}`} style={{ '--x': x, '--y': y, ...(t != null ? { '--t': `${t}ms` } : null), ...style }}>{children}</span>;
}
const You = ({ c, x, y, className = '', t }) => <At x={x} y={y} t={t} className={`in-fig in-w32 ${className}`}><Leader color={YOU} emoji={c.you} sigil="circle" size={32} /></At>;
const Rival = ({ color, emoji, sigil, x, y, className = '', t, style }) => <At x={x} y={y} t={t} style={style} className={`in-fig in-w32 ${className}`}><Leader color={color} emoji={emoji} sigil={sigil} size={32} /></At>;
const Fol = () => <span className="in-fol in-w9"><Follower size={9} title="follower" /></span>;

/** Something that hops in an arc from `from` to `to` (stage units) and lands with a squash. show: when it appears
 * (omit: there from the start); post 'fade': it's used up on arrival. */
function Hop({ from, to, h = 12, t = 0, dur = 600, show = null, post = 'stay', className = '', children }) {
  return (
    <span className={`in-at in-hop${show != null ? ' pre-hide' : ''}${post === 'fade' ? ' post-fade' : ''} ${className}`}
      style={{ '--x': from[0], '--y': from[1], '--dx': to[0] - from[0], '--dy': to[1] - from[1], '--h': h, '--t': `${t}ms`, '--dur': `${dur}ms`, '--t0': `${show ?? 0}ms` }}>
      <span className="in-hy"><span className="in-appear"><span className="in-land">{children}</span></span></span>
    </span>
  );
}

/** A number that steps through [[ms, value], …] (a still storyboard shows the last). */
function Count({ steps, still, className = '' }) {
  const [v, setV] = useState(() => (still ? steps[steps.length - 1][1] : steps[0][1]));
  useEffect(() => {
    if (still) return undefined;
    const ids = steps.slice(1).map(([ms, val]) => setTimeout(() => setV(val), ms));
    return () => ids.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <b className={`in-num ${className}`} key={v}>{v}</b>;
}

// ---------- the wheel: a printed paper wheel, four quadrants, round I's ring of spaces ----------
const MID = { gold: 90, silver: 180, magenta: 270, green: 0 };
const pol = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
const wedge = (r0, r1, a0, a1) => {
  const [x0, y0] = pol(50, 50, r1, a0), [x1, y1] = pol(50, 50, r1, a1), [x2, y2] = pol(50, 50, r0, a1), [x3, y3] = pol(50, 50, r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3} Z`;
};
const SOCKETS = Object.entries(MID).flatMap(([q, m]) => [-27.5, 0, 27.5].map(o => ({ q, a: m + o })));
/** Center of the space at angle a on wheel w, in stage units. */
const space = (w, a) => pol(w.cx, w.cy, w.r * 0.748, a);
const GLYPH = { gold: 'gold', silver: 'silver', magenta: 'magenta', green: 'green' };

function Wheel({ w, taken = null, lit = [], className = '', t }) {
  return (
    <At x={w.cx - w.r} y={w.cy - w.r} t={t} className={`in-wheel ${className}`} style={{ '--s': w.r * 2 }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="intro-paper" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#f7efdd" /><stop offset=".8" stopColor="#ecdfc3" /><stop offset="1" stopColor="#dccba6" /></radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#intro-paper)" />
        {Object.entries(MID).map(([q, m]) => (
          <g key={q}>
            <path d={wedge(28, 46.75, m - 45, m + 45)} fill={Q[q]} opacity=".24" />
            <path d={wedge(46.75, 50, m - 45, m + 45)} fill={Q[q]} opacity=".9" />
            <path d={wedge(11.75, 28, m - 45, m + 45)} fill={Q[q]} opacity=".07" />
          </g>
        ))}
        <circle cx="50" cy="50" r="28" fill="rgba(70,50,25,.10)" />
        {[46.75, 28, 19.25, 11.75].map(r => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(42,31,23,.35)" strokeWidth={r === 46.75 ? 0.7 : 0.5} />)}
        {[45, 135, 225, 315].map(a => { const [x0, y0] = pol(50, 50, 11.75, a), [x1, y1] = pol(50, 50, 50, a); return <line key={a} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(42,31,23,.45)" strokeWidth=".7" />; })}
        <circle cx="50" cy="50" r="49.6" fill="none" stroke="#7a6244" strokeWidth=".8" />
        {SOCKETS.map(({ q, a }) => { const [x, y] = pol(50, 50, 37.4, a); return <circle key={a} cx={x} cy={y} r="6.25" fill="#f8f1e2" stroke={Q[q]} strokeWidth="1.1" />; })}
        {Object.values(MID).flatMap(m => [-17, 17].map(o => { const [x, y] = pol(50, 50, 23.4, m + o); return <circle key={m + o} cx={x} cy={y} r="4.4" fill="none" stroke="rgba(110,90,64,.55)" strokeWidth=".6" strokeDasharray="1.6 1.2" />; }))}
        {lit.map(l => <path key={l.q} className="in-lit" style={{ '--t': `${l.t}ms` }} d={wedge(11.75, 50, MID[l.q] - 45, MID[l.q] + 45)} fill="rgb(255,217,154)" />)}
        <circle cx="50" cy="50" r="11.75" fill="#2a1f17" />
        <circle cx="50" cy="50" r="9.6" fill="none" stroke="rgba(243,230,200,.2)" strokeWidth=".5" />
        <text x="50" y="54.2" textAnchor="middle" className="in-hub">I</text>
      </svg>
      {SOCKETS.map(({ q, a }) => {
        const [x, y] = pol(w.r, w.r, w.r * 0.748, a);
        return <At key={a} x={x - 4.5} y={y - 4.5} className={`in-w9${taken === a ? ' in-taken' : ''}`}><Res kind={GLYPH[q]} /></At>;
      })}
    </At>
  );
}

// ---------- the seven beats ----------
// Stage layout (units): the wheel on the left, your cult on the right (leader, then members beside it, followers
// counted in a row underneath), your resources stacked between them.
const W = { cx: 48, cy: 50, r: 44 }; // the wheel, beats 2–3
const GOLD_SPACE = 62.5; // the gold space your minion takes
const ME = { x: 120, y: 26 }; // your leader, beats 2–5
const ROW = { x: 118, y: 63 }; // your follower count; marks at x + 10 + 9i
const MEMBER_AT = { x: 151, y: 34 };
const STACK = i => [100, 51 - 5 * i]; // the i-th resource on your stack
const markAt = i => [ROW.x + 10 + 9 * i, ROW.y];

function FollowerRow({ steps, marks, still, x = ROW.x, y = ROW.y, className = '' }) {
  return (
    <>
      <At x={x} y={y} className={`in-count ${className}`}><Count steps={steps} still={still} /></At>
      {Array.from({ length: marks }, (_, i) => <At key={i} x={x + 10 + 9 * i} y={y} className={className}><Fol /></At>)}
    </>
  );
}

function BeatCult({ c, still }) {
  return (
    <>
      <Rival color={RIVAL_A} emoji={c.a} sigil="triangle" x={12} y={24} t={1100} className="in-shade" />
      <Rival color={RIVAL_B} emoji={c.b} sigil="square" x={132} y={24} t={1300} className="in-shade" />
      <You c={c} x={72} y={22} t={250} className="in-rise" />
      <At x={70} y={59} t={950} className="in-count in-pop"><Count steps={[[0, 1]]} still={still} /></At>
      <At x={80} y={59} t={1050} className="in-pop"><Fol /></At>
    </>
  );
}

function BeatPlace({ c, still }) {
  const [sx, sy] = space(W, GOLD_SPACE);
  return (
    <>
      <Wheel w={W} t={0} className="in-fade" />
      <span className="in-moves in-slide" style={{ '--sx': -48, '--sy': -4 }}>
        <You c={c} {...ME} />
        <FollowerRow steps={[[0, 1]]} marks={1} still={still} />
      </span>
      <Hop from={[103, 41]} to={[sx - 8, sy - 13]} h={16} show={750} t={1150} dur={720} className="in-fig in-w16">
        <Minion color={YOU} emoji={c.you} size={16} />
      </Hop>
      <At x={sx - 9} y={sy - 6} t={1950} className="in-ring in-pop" />
    </>
  );
}

function BeatGain({ c, still }) {
  const [sx, sy] = space(W, GOLD_SPACE);
  return (
    <>
      <Wheel w={W} taken={GOLD_SPACE} />
      <At x={sx - 9} y={sy - 6} className="in-ring" />
      <At x={sx - 8} y={sy - 13} className="in-fig in-w16"><Minion color={YOU} emoji={c.you} size={16} /></At>
      <At x={sx - 9} y={sy - 9} t={150} className="in-flash" />
      {[0, 1, 2].map(i => (
        <Hop key={i} from={[sx - 4.5, sy - 4.5]} to={STACK(i)} h={18} show={350 + 330 * i} t={350 + 330 * i} dur={640} className="in-w9">
          <Res kind="gold" />
        </Hop>
      ))}
      <You c={c} {...ME} />
      <FollowerRow steps={[[0, 1]]} marks={1} still={still} />
    </>
  );
}

const CARD = { x: 18, y: 14 };
const SLOT = j => [24.5 + 12 * j, 66];
function BeatRecruit({ c, still }) {
  return (
    <>
      <At x={CARD.x} y={CARD.y} t={2700} className="in-card in-spent">
        <span className="in-card-band" />
        <span className="in-card-art" />
        <span className="in-card-name">{c.memberName}</span>
      </At>
      <At x={29} y={22} t={1700} className="in-w24 in-leave"><Sprite id={c.member} sphere={Q.gold} size={24} /></At>
      {[0, 1, 2].map(j => <At key={j} x={SLOT(j)[0]} y={SLOT(j)[1]} className="in-slot" />)}
      {[2, 1, 0].map((i, j) => (
        <Hop key={i} from={STACK(i)} to={SLOT(j)} h={12} t={300 + 300 * j} dur={560} className="in-w9"><Res kind="gold" /></Hop>
      ))}
      <Hop from={[29, 22]} to={[MEMBER_AT.x, MEMBER_AT.y]} h={14} show={1700} t={1750} dur={820} className="in-fig in-w24">
        <Sprite id={c.member} sphere={Q.gold} size={24} />
      </Hop>
      <You c={c} {...ME} />
      <FollowerRow steps={[[0, 1], [2650, 2]]} marks={1} still={still} />
      <At x={markAt(1)[0]} y={markAt(1)[1]} t={2650} className="in-pop"><Fol /></At>
    </>
  );
}

const MIXED = ['gold', 'silver', 'magenta', 'green'];
function BeatBuy({ c, still }) {
  return (
    <>
      <At x={10} y={40} className="in-offer in-glowbox" t={1450}>
        <b>4</b><span className="in-w9"><Res kind="any" /></span><i aria-hidden="true">→</i><b>3</b><Fol />
      </At>
      {[3, 2, 1, 0].map((i, j) => (
        <Hop key={i} from={STACK(i)} to={[20, 45.5]} h={14} show={70 * i} t={500 + 230 * j} dur={540} post="fade" className="in-w9 in-arrive">
          <Res kind={MIXED[i]} />
        </Hop>
      ))}
      {[0, 1, 2].map(k => (
        <Hop key={k} from={[58, 45.5]} to={markAt(2 + k)} h={16} show={1650 + 220 * k} t={1650 + 220 * k} dur={640}>
          <Fol />
        </Hop>
      ))}
      <At x={MEMBER_AT.x} y={MEMBER_AT.y} className="in-fig in-w24"><Sprite id={c.member} sphere={Q.gold} size={24} /></At>
      <You c={c} {...ME} />
      <FollowerRow steps={[[0, 2], [2290, 3], [2510, 4], [2730, 5]]} marks={2} still={still} />
    </>
  );
}

const W6 = { cx: 88, cy: 50, r: 44 };
const PLAQUE = { gold: [75, 88], silver: [31, 44], magenta: [75, 0], green: [119, 44] };
function BeatReckon({ c, still }) {
  return (
    <>
      <Wheel w={W6} lit={[{ q: 'gold', t: 300 }, { q: 'silver', t: 1550 }]} className="in-fade" />
      {Object.entries(PLAQUE).map(([q, [x, y]]) => (
        <At key={q} x={x} y={y} className={`in-plaque${q === 'gold' || q === 'silver' ? ' in-plaque-lit' : ''}`} t={q === 'gold' ? 300 : 1550} style={{ '--q': Q[q] }}>
          <span className="in-w9"><Res kind={GLYPH[q]} /></span><b>+2</b>
        </At>
      ))}
      <Rival color={RIVAL_A} emoji={c.a} sigil="triangle" x={0} y={12} t={2450} className="in-glow in-far" />
      <At x={2} y={50} className="in-count"><Count steps={[[0, 4], [2450, 6]]} still={still} /></At>
      <At x={12} y={50}><Fol /></At>
      <You c={c} x={142} y={12} t={1250} className="in-glow" />
      <At x={144} y={50} className="in-count"><Count steps={[[0, 5], [1250, 7]]} still={still} /></At>
      <At x={154} y={50}><Fol /></At>
      <Hop from={[80, 88]} to={[150, 52]} h={20} show={600} t={620} dur={640} post="fade" className="in-token"><b>+2</b><Fol /></Hop>
      <Hop from={[36, 44]} to={[6, 52]} h={12} show={1850} t={1870} dur={580} post="fade" className="in-token"><b>+2</b><Fol /></Hop>
    </>
  );
}

const COLS = [
  { key: 'a', cx: 30, color: RIVAL_A, sigil: 'triangle', n: [6, 10, 12] },
  { key: 'you', cx: 88, color: YOU, sigil: 'circle', n: [7, 11, 16] },
  { key: 'b', cx: 146, color: RIVAL_B, sigil: 'square', n: [5, 9, 14] },
];
const ROUND_AT = [150, 850, 1550];
function BeatWin({ c, still }) {
  return (
    <>
      {['I', 'II', 'III'].map((r, i) => <At key={r} x={76 + 12 * i} y={1} t={ROUND_AT[i]} className="in-round"><span>{r}</span></At>)}
      {COLS.map(col => {
        const mine = col.key === 'you';
        const marks = [];
        for (let k = 0; k < col.n[2]; k++) {
          const round = col.n.findIndex(v => k < v);
          const t = ROUND_AT[round] + 60 + 45 * (k - (round ? col.n[round - 1] : 0));
          marks.push(<At key={k} x={col.cx - 22.5 + 9 * (k % 5)} y={52 + 9 * Math.floor(k / 5)} t={t} className="in-pop"><Fol /></At>);
        }
        return (
          <Fragment key={col.key}>
            {mine
              ? <You c={c} x={col.cx - 16} y={16} t={2250} className="in-jump" />
              : <Rival color={col.color} emoji={c[col.key]} sigil={col.sigil} x={col.cx - 16} y={16} t={2250} className="in-fall" />}
            <At x={col.cx + 17} y={22} className={`in-count${mine ? ' in-mine' : ''}`}>
              <Count steps={col.n.map((v, i) => [ROUND_AT[i] + 60, v])} still={still} />
            </At>
            {marks}
          </Fragment>
        );
      })}
    </>
  );
}

const BEATS = [
  { Scene: BeatCult, ms: 2900, lamp: [88, 40], line: <>You lead a little <em>cult</em>.</> },
  { Scene: BeatPlace, ms: 2900, lamp: [74, 52], line: <>Each turn, send a <em>minion</em> to a space on the wheel.</> },
  { Scene: BeatGain, ms: 2800, lamp: [78, 58], line: <>The space pays you <em>resources</em>.</> },
  { Scene: BeatRecruit, ms: 3100, lamp: [86, 48], line: <>Spend them to <em>recruit members</em> to your cult.</> },
  { Scene: BeatBuy, ms: 3100, lamp: [86, 48], line: <>Or buy <em>followers</em>: they’re your score.</> },
  { Scene: BeatReckon, ms: 3000, lamp: [88, 50], line: <>Each round, whoever <em>leads a quadrant</em> wins followers.</> },
  { Scene: BeatWin, ms: null, lamp: [88, 46], line: <>Most <em>followers</em> after round III wins.</> },
];
const LAST = BEATS.length - 1;

/** The intro itself. onClose runs once it's gone. still: a storyboard (defaults to prefers-reduced-motion). */
export default function Intro({ onClose, still: stillProp }) {
  const [still] = useState(() => (stillProp ?? reducedMotion()));
  const [c] = useState(cast);
  const [beat, setBeat] = useState(0);
  const [prev, setPrev] = useState(null); // the beat fading out under this one
  const [closing, setClosing] = useState(false);
  const root = useRef(null);
  const state = useRef({});
  state.current = { beat, closing };

  const close = useCallback(() => {
    if (state.current.closing) return;
    setClosing(true);
    if (still) onClose(); else state.current.timer = setTimeout(onClose, 220);
  }, [still, onClose]);
  const go = useCallback(n => {
    const b = state.current.beat;
    if (n < 0 || n > LAST || n === b || state.current.closing) return;
    setPrev(still ? null : b);
    setBeat(n);
  }, [still]);

  // the clock: each beat plays, holds, and hands over (the last one waits for Begin)
  useEffect(() => {
    if (still || closing || beat >= LAST) return undefined;
    const id = setTimeout(() => go(beat + 1), BEATS[beat].ms);
    return () => clearTimeout(id);
  }, [beat, still, closing, go]);
  useEffect(() => {
    if (prev == null) return undefined;
    const id = setTimeout(() => setPrev(null), 340);
    return () => clearTimeout(id);
  }, [prev, beat]);
  useEffect(() => () => clearTimeout(state.current.timer), []);

  // keys: Esc closes after the first beat, arrows step, Tab stays inside; nothing reaches the table underneath
  useEffect(() => {
    const back = document.activeElement;
    const first = root.current && root.current.querySelector(still ? '[data-intro-next]' : '[data-intro-skip]');
    if (first) first.focus({ preventScroll: true });
    const onKey = e => {
      const el = root.current;
      if (!el) return;
      const inside = el.contains(e.target);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (state.current.beat >= 1 || still) close(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(state.current.beat + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(state.current.beat - 1); return; }
      if (e.key === 'Tab') {
        const f = [...el.querySelectorAll('button:not([disabled])')];
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        e.preventDefault(); e.stopPropagation();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        return;
      }
      if (!inside) { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }
    };
    addEventListener('keydown', onKey, true);
    return () => {
      removeEventListener('keydown', onKey, true);
      if (back && back.isConnected && back.focus) back.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onBackdrop = e => {
    if (still || beat < 1 || (e.target.closest && e.target.closest('button'))) return;
    close();
  };
  const { lamp } = BEATS[beat];
  const shown = prev != null ? [prev, beat] : [beat];
  return (
    <div ref={root} className={`intro${still ? ' still' : ''}${closing ? ' out' : ''}`} role="dialog" aria-modal="true" aria-label="Cults in twenty seconds"
      data-intro={still ? 'still' : 'motion'} data-beat={beat + 1} onClick={onBackdrop} onKeyDown={e => e.stopPropagation()}>
      <p className="intro-kicker" aria-hidden="true">Cults <i>in twenty seconds</i></p>
      <button type="button" className="intro-skip" data-intro-skip onClick={close}>Skip intro</button>
      <div className="intro-main">
        <div className="intro-stage" style={{ '--lx': lamp[0], '--ly': lamp[1] }}>
          <span className="intro-lamp" />
          {shown.map(b => {
            const { Scene } = BEATS[b];
            return <div key={b} className={`intro-scene${b === beat ? '' : ' leaving'}`} aria-hidden="true"><Scene c={c} still={still} /></div>;
          })}
        </div>
        <p className="intro-line" key={beat} aria-live="polite">{BEATS[beat].line}</p>
        <div className="intro-dots" aria-hidden="true">
          {BEATS.map((_, i) => <i key={i} className={i === beat ? 'on' : i < beat ? 'done' : ''} />)}
        </div>
        <span className="intro-sr">Step {beat + 1} of {BEATS.length}</span>
        {still ? (
          <div className="intro-nav">
            <button type="button" className="intro-btn ghost" onClick={() => go(beat - 1)} disabled={beat === 0} data-intro-back>Back</button>
            {beat < LAST
              ? <button type="button" className="intro-btn" onClick={() => go(beat + 1)} data-intro-next>Next</button>
              : <button type="button" className="intro-btn" onClick={close} data-intro-next data-intro-begin>Begin</button>}
          </div>
        ) : (
          <div className="intro-nav">
            {beat === LAST && <button type="button" className="intro-btn in-cta" onClick={close} data-intro-begin>Begin</button>}
          </div>
        )}
      </div>
    </div>
  );
}
