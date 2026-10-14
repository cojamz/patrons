// The intro's shared kit (design/prototypes/intro2/storyboard.md is the spec): one world, one camera, and the
// pieces every beat is built from. Owned by the foreman; beat files (Beat1–4.jsx) only import from here.
//
// The world: units are art pixels, the origin is YOUR leader's centre. The stage shows 176 × 100 units at zoom 1;
// the camera puts world point (cx, cy) at the stage centre with zoom z: stage = (88 + z(wx − cx), 50 + z(wy − cy)).
// Zooms are 2, 4/3, 1, 2/3 only: whole device pixels at --u 3px (laptop) and 2px × DPR 3 (phone).
//
// Motion: every moving thing is an <Act> with a track. It RESTS at its last frame (that is also the still
// storyboard under reduced motion) and plays its track from the beat's start with the Web Animations API, all in one
// clock (Clock.t0), so beats are deterministic and screenshot-able at any ms.
import { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Leader, Minion } from '../art/Leader.jsx';
import { Sprite } from '../art/Sprite.jsx';
import { Follower } from '../art/Follower.jsx';
import { ResourceGlyph } from '../game/Glyphs.jsx';
import { emojiArt } from '../art/emojis.js';
import { iconFor, rectsFor } from '../art/index.js';

// ---------- clock and cast ----------
/** still: the reduced-motion storyboard (nothing animates; everything shows its rest). t0: the beat's start.
 * at: a frozen moment (ms into the beat; the lab's &at=MS), else null. run: false while the beat is mounted ahead
 * of time, hidden (so a heavy beat never hitches on its cue); its clock starts when run turns true. */
export const Clock = createContext({ still: false, t0: null, at: null, run: true });
export const useClock = () => useContext(Clock);
/** The cast: emoji ids for you and the three rivals ({ you, a, b, c }). */
export const Cast = createContext({ you: null, a: null, b: null, c: null });
export const useCast = () => useContext(Cast);
/** The beat's start on the document timeline (call once per beat, in its root). */
export const nowT0 = () => (typeof document !== 'undefined' && document.timeline && document.timeline.currentTime != null ? document.timeline.currentTime : null);

// ---------- layout (world units) ----------
export const STAGE = { w: 176, h: 100 };
export const Z = { near: 2, mid: 4 / 3, one: 1, far: 2 / 3 };
/** Your leader, top-left of its 32×32 (centre is the origin); LEAD_UP after it grows in beat 3. */
export const LEAD = [-16, -16];
export const LEAD_UP = [-16, -18];
/** Where the three minions wait around the leader (centres; a minion is 16×16), as CultSeat's LeaderRing does. */
export const RING = [[-27, 2], [0, -27], [27, 2]];
export const ringTL = i => [RING[i][0] - 8, RING[i][1] - 8];
/** The wheel in beat 3 (centre, radius) and its round-I spaces: quadrant mids blue 270°, green 0°, gold 90°, red 180°. */
export const WHEEL = { cx: -90, cy: 10, r: 40 };
export const QUAD = { blue: 270, green: 0, gold: 90, red: 180 };
/** Centre of a round-I space: quadrant q, k = -1 / 0 / +1 (27.5° steps). */
export const space = (q, k = 0) => {
  const a = (QUAD[q] + 27.5 * k) * Math.PI / 180, rr = WHEEL.r * 0.748;
  return [WHEEL.cx + rr * Math.cos(a), WHEEL.cy + rr * Math.sin(a)];
};
/** A minion standing ON a space: its 16×16 top-left. */
export const onSpace = ([x, y]) => [x - 8, y - 12];
/** The resource pile beside your leader (left): centre of the i-th 9×9 glyph (3 wide, stacked up). */
export const PILE = i => [-24 - 10 * (i % 3), 8 - 10 * Math.floor(i / 3)];
/** Members (24×24 busts) stand in rows of three under the leader: centre first, then left, right. Top-left. */
export const MSLOT = i => [[-12, -30, 6][i % 3], 12 + 12 * Math.floor(i / 3)];
/** Followers (10×10 marks) stand in rows of six in front of the members, centre-out. rows = member rows. Top-left. */
const FX = [-5, 5, -15, 15, -25, 25];
export const ftop = rows => (rows ? 12 + 12 * (rows - 1) + 22 : 14);
export const FSLOT = (j, rows) => [FX[j % 6] - 5, ftop(rows) + 10 * Math.floor(j / 6)];
export const memberRows = n => Math.ceil(n / 3);
/** Beat 4's four cults side by side (cult origin x; your leader is at 0). */
export const COLS = { a: -66, you: 0, b: 66, c: 132 };
/** Beat 3: the member card (top-left, 26×36), the initiation ring (centre of its floor), the follower swirl. */
export const CARD = [30, -24];
export const INIT_RING = [44, 33];
export const SWIRL = [-34, -16];

// ---------- the cast's members (sprite ids; a member keeps its own sphere colors) ----------
const SPHERE = { gold: 'gold', red: 'red', blue: 'blue', green: 'green', silver: 'silver', thieves: 'magenta', yellow: 'yellow', purple: 'purple' };
export const sphereOf = id => SPHERE[String(id).split('.')[0]] || 'colorless';
/** Yours, in the order they join: the first through the full initiation (beat 3), two in round II, three in round III. */
export const YOU_MEMBERS = ['gold.prospector', 'red.proselytizer', 'silver.toastmaster', 'thieves.robinhood', 'yellow.farmer', 'purple.lamplighter'];
/** The rivals in beat 4: members (in join order), followers, and how many of each they hold after rounds I and II. */
export const RIVALS = {
  a: { members: ['silver.caterer', 'yellow.pilgrim', 'red.intern', 'thieves.mole'], followers: 6, m: [1, 3, 4], f: [3, 5, 6] },
  b: { members: ['purple.foreman', 'gold.merchant', 'red.host', 'silver.dowager', 'yellow.sower'], followers: 7, m: [2, 3, 5], f: [3, 5, 7] },
  c: { members: ['thieves.sticky', 'gold.underdog', 'yellow.gleaner'], followers: 5, m: [1, 2, 3], f: [2, 4, 5] },
};
/** Yours after rounds I, II, III: members and followers (the leader is one more follower). */
export const YOU_COUNTS = { m: [1, 3, 6], f: [6, 8, 10] };

// ---------- timing ----------
/** Each beat's length (ms) before it hands over; the last waits on Begin. */
export const BEAT_MS = [3800, 5200, 9300, null];
/** When Begin shows on the last beat (ms into it). */
export const BEGIN_AT = 6300;

// ---------- motion ----------
export const EASE = {
  lin: p => p,
  io: p => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2), // cubic in-out: moves
  out: p => 1 - (1 - p) ** 3, // arrivals, rises
  in: p => p * p * p, // departures, dissolves
  sine: p => -(Math.cos(Math.PI * p) - 1) / 2, // drifts, glows
  back: p => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2; }, // pops (a small overshoot)
};
const DEF = { o: 1, s: 1, sx: 1, sy: 1, r: 0, f: 1 };
/**
 * A track: [init, ...steps]. init: { x, y, o, s, sx, sy, r, f } (o opacity, s scale, sx/sy squash, r degrees,
 * f brightness). A step: [at, dur, to, ease = 'io', arc = 0, hops = 0]: from `at` ms (beat time) over `dur` ms,
 * tween the props in `to`. arc lifts y by a parabola of that height (a hop); hops adds that many little bounces
 * (walking). Two steps must not move the same prop at the same time.
 */
export function compile([init, ...raw]) {
  const s0 = { ...DEF, ...init };
  const steps = raw.map(([at, d, to, e = 'io', arc = 0, hops = 0]) => ({ at, d: Math.max(1, d), to, e: EASE[e] || e || EASE.io, arc, hops }))
    .sort((a, b) => a.at - b.at);
  const cur = { ...s0 };
  for (const st of steps) { st.from = {}; for (const k in st.to) { st.from[k] = cur[k]; cur[k] = st.to[k]; } }
  const end = steps.reduce((m, st) => Math.max(m, st.at + st.d), 0);
  const moved = new Set(steps.flatMap(st => Object.keys(st.to)));
  const at = t => {
    const v = { ...s0 };
    let lift = 0;
    for (const st of steps) {
      if (t < st.at) break;
      const p = Math.min(1, (t - st.at) / st.d), q = st.e(p);
      for (const k in st.to) v[k] = st.from[k] + (st.to[k] - st.from[k]) * q;
      if (p < 1 && st.arc) lift += st.arc * 4 * p * (1 - p);
      if (p < 1 && st.hops) lift += 1.2 * Math.abs(Math.sin(Math.PI * st.hops * p));
    }
    v.y -= lift;
    return v;
  };
  return { s0, steps, end, at, moved };
}
const geo = v => `rotate(${v.r}deg) scale(${v.s * v.sx}, ${v.s * v.sy})`;
const tf = (v, rest) => `translate(${v.x - rest.x}px, ${v.y - rest.y}px) ${geo(v)}`;

/**
 * <Act track={[init, ...steps]} origin stillT stillAs>: anything placed and moved in the world. It rests at the
 * track's end (or, in the still storyboard, at stillT ms, merged with stillAs). origin: transform-origin.
 */
export function Act({ track, origin = '50% 100%', stillT = null, stillAs = null, className = '', style = null, children }) {
  const ref = useRef(null);
  const { still, t0, at: frozen, run } = useClock();
  const tl = useMemo(() => compile(track), []); // eslint-disable-line react-hooks/exhaustive-deps
  const rest = still ? { ...tl.at(stillT ?? tl.end), ...(stillAs || {}) } : tl.at(tl.end);
  useLayoutEffect(() => {
    const el = ref.current;
    if (still || !run || !el || typeof el.animate !== 'function' || !tl.end) return undefined;
    const moves = ['x', 'y', 's', 'sx', 'sy', 'r'].some(k => tl.moved.has(k)) || tl.steps.some(st => st.arc || st.hops);
    const ts = new Set([0, tl.end]);
    for (const st of tl.steps) { ts.add(st.at); ts.add(st.at + st.d); for (let t = st.at; t < st.at + st.d; t += 16) ts.add(t); }
    const frames = [...ts].sort((a, b) => a - b).map(t => {
      const v = tl.at(t), k = { offset: t / tl.end };
      if (moves) k.transform = tf(v, rest);
      if (tl.moved.has('o')) k.opacity = v.o;
      if (tl.moved.has('f')) k.filter = `brightness(${v.f})`;
      return k;
    });
    const a = el.animate(frames, { duration: tl.end, fill: 'both', easing: 'linear' });
    if (frozen != null) { a.pause(); a.currentTime = Math.min(frozen, tl.end); } else if (t0 != null) a.startTime = t0;
    return () => a.cancel();
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = { left: rest.x, top: rest.y, transformOrigin: origin, ...style };
  if (rest.o !== 1) st.opacity = rest.o;
  if (rest.r || rest.s !== 1 || rest.sx !== 1 || rest.sy !== 1) st.transform = geo(rest);
  if (rest.f !== 1) st.filter = `brightness(${rest.f})`;
  return <span ref={ref} className={`in-act ${className}`} style={st}>{children}</span>;
}
/** A thing that just sits at (x, y) (optionally fading in at `at`). */
export const At = ({ x, y, at = null, d = 400, className, style, children, stillAs }) => (
  <Act track={at == null ? [{ x, y }] : [{ x, y, o: 0 }, [at, d, { o: 1 }, 'sine']]} className={className} style={style} stillAs={stillAs}>{children}</Act>
);

/**
 * <Frames seq={[[ms, key], …]} stillAs={key}>{key => node}</Frames>: pixel sprite animation. Every key's drawing is
 * stacked; one shows at a time, switched on the beat's clock (no tweening: frames step, like a sprite sheet).
 */
export function Frames({ seq, stillAs = null, children }) {
  const { still, t0, at: frozen, run } = useClock();
  const last = seq[seq.length - 1][1];
  const keys = useMemo(() => [...new Set(seq.map(s => s[1]))], []); // eslint-disable-line react-hooks/exhaustive-deps
  const refs = useRef({});
  const end = Math.max(1, seq[seq.length - 1][0] + 1);
  useLayoutEffect(() => {
    if (still || !run) return undefined;
    const anims = keys.map(k => {
      const el = refs.current[k];
      if (!el || typeof el.animate !== 'function') return null;
      const kf = seq.map(([t, key]) => ({ offset: Math.min(1, t / end), opacity: key === k ? 1 : 0, easing: 'step-end' }));
      kf.push({ offset: 1, opacity: last === k ? 1 : 0 });
      const a = el.animate(kf, { duration: end, fill: 'both' });
      if (frozen != null) { a.pause(); a.currentTime = Math.min(frozen, end); } else if (t0 != null) a.startTime = t0;
      return a;
    });
    return () => anims.forEach(a => a && a.cancel());
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  if (still) return <span className="in-frames">{children(stillAs ?? last)}</span>;
  return (
    <span className="in-frames">
      {keys.map((k, i) => <span key={String(k)} ref={el => { refs.current[k] = el; }} className={i ? 'in-frame' : 'in-frame first'} style={{ opacity: k === last ? 1 : 0 }}>{children(k)}</span>)}
    </span>
  );
}

/** A number that steps through [[ms, value], …] on the beat's clock (the storyboard shows the last). */
export function Count({ steps, className = '' }) {
  const { still, at: frozen, run } = useClock();
  const [v, setV] = useState(() => (still ? steps[steps.length - 1][1] : frozen != null ? steps.filter(([ms]) => ms <= frozen).pop()[1] : steps[0][1]));
  useEffect(() => {
    if (still || frozen != null || !run) return undefined;
    const ids = steps.slice(1).map(([ms, val]) => setTimeout(() => setV(val), ms));
    return () => ids.forEach(clearTimeout);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  return <b className={`in-num ${className}`} key={v}>{v}</b>;
}
/** true once `ms` of the beat have passed (at once in the storyboard): for state that flips mid-beat. */
export function useAfter(ms) {
  const { still, at: frozen, run } = useClock();
  const [on, setOn] = useState(still || ms <= 0 || (frozen != null && ms <= frozen));
  useEffect(() => { if (on || frozen != null || !run) return undefined; const id = setTimeout(() => setOn(true), ms); return () => clearTimeout(id); }, [run]); // eslint-disable-line react-hooks/exhaustive-deps
  return on;
}

// ---------- the cast as pixels (sizes in world units = art pixels) ----------
/** A leader (32×32) in a pose (Leader.jsx LEADER_POSES; null = idle). */
export const Lead = ({ emoji, pose = null }) => <span className="in-px in-fig"><Leader emoji={emoji} size={32} pose={pose} /></span>;
/** A leader whose pose follows a frame sequence. */
export const LeadFrames = ({ emoji, seq, stillAs }) => (
  <Frames seq={seq} stillAs={stillAs}>{pose => <Lead emoji={emoji} pose={pose === 'idle' ? null : pose} />}</Frames>
);
/** A minion (16×16): the player's emoji. */
export const Mini = ({ emoji }) => <span className="in-px in-fig"><Minion emoji={emoji} size={16} /></span>;
/** The follower mark (10×10). */
export const Fol = () => <span className="in-px in-fol"><Follower size={10} title="follower" /></span>;
/** A resource (the game's glyph), 9 units. */
export const Res = ({ r, size = 9 }) => <span className="in-res"><ResourceGlyph r={r} size={size} decorative /></span>;
/** The player's emoji as the cult's mark (8×8 emblem). */
export const Emblem = memo(function Emblem({ emoji }) {
  const art = emoji ? emojiArt(emoji) : null;
  if (!art) return <span className="in-px in-emblem"><svg viewBox="0 0 8 8" width="8" height="8"><circle cx="4" cy="4" r="3" fill="#f6d77e" /></svg></span>;
  return (
    <span className="in-px in-emblem">
      <svg viewBox="0 0 8 8" width="8" height="8" shapeRendering="crispEdges" aria-hidden="true">
        {art.rects.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
      </svg>
    </span>
  );
});
// a bow: the head (rows above the shoulders) dips and leans toward the leader
const NECK = 13;
const bowRects = (id, sphere, dy, dx) => {
  const { icon } = iconFor(id);
  const rects = rectsFor(icon, sphere);
  return [...rects.filter(r => r.y >= NECK), ...rects.filter(r => r.y < NECK).map(r => ({ ...r, y: r.y + dy, x: r.x + dx }))];
};
/** A member (24×24 bust in its own sphere's colors). pose: null | 'bow1' | 'bow2' (a nod toward the left). */
export const Member = memo(function Member({ id, pose = null }) {
  const sphere = sphereOf(id);
  if (!pose) return <span className="in-px in-fig"><Sprite id={id} sphere={sphere} size={24} /></span>;
  const rects = bowRects(id, sphere, pose === 'bow2' ? 2 : 1, pose === 'bow2' ? -1 : 0);
  return (
    <span className="in-px in-fig">
      <svg className="sprite" viewBox="0 0 24 24" width="24" height="24" shapeRendering="crispEdges" aria-hidden="true">
        {rects.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
      </svg>
    </span>
  );
});
const CROWN = ['.y...y...y.', '.yy.yyy.yy.', '.yggyggygy.', '.ggggggggg.', '.GgGgGgGgG.', '.GGGGGGGGG.'];
const CROWN_PAL = { y: '#f6d77e', g: '#d9a63a', G: '#8f6516' };
/** The winner's crown (11×6, gold, ink outline). */
export const Crown = memo(function Crown() {
  const out = [];
  const H = CROWN.length, W = CROWN[0].length;
  const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && CROWN[y][x] !== '.';
  for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
    if (filled(x, y)) out.push(<rect key={`${x},${y}`} x={x + 1} y={y + 1} width="1" height="1" fill={CROWN_PAL[CROWN[y][x]]} />);
    else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) out.push(<rect key={`${x},${y}`} x={x + 1} y={y + 1} width="1" height="1" fill="#1c1410" />);
  }
  return <span className="in-px in-crown"><svg viewBox={`0 0 ${W + 2} ${H + 2}`} width={W + 2} height={H + 2} shapeRendering="crispEdges" aria-hidden="true">{out}</svg></span>;
});

// ---------- light ----------
/** The arcane glow ("mysterious powers"): a soft violet floor ellipse, w × h units, centred on its box. */
export const ArcaneFloor = ({ w, h }) => <span className="in-arcane-floor" style={{ width: w, height: h }} />;
/** A soft violet column of light rising from the floor (w × h, its bottom at the box bottom). */
export const ArcaneColumn = ({ w, h }) => <span className="in-arcane-col" style={{ width: w, height: h }} />;
/** A small ring of arcane light on the floor (the initiation ring). */
export const ArcaneRing = ({ w = 26, h = 8 }) => <span className="in-arcane-ring" style={{ width: w, height: h }} />;
/** A warm aura behind a leader (presence). */
export const Aura = ({ w = 56, h = 56 }) => <span className="in-aura" style={{ width: w, height: h }} />;

// ---------- a cult, standing still: the carried-over state between beats ----------
/** Members and follower marks at their slots around a leader at cult origin (ox, oy); dim fades them. */
export function Crowd({ ox = 0, oy = 0, members, followers, rows = memberRows(members.length) }) {
  return (
    <>
      {members.map((id, i) => ({ id, i })).sort((p, q) => (Math.floor(p.i / 3) - Math.floor(q.i / 3)) || ((p.i % 3 === 0) - (q.i % 3 === 0))).map(({ id, i }) => {
        const [x, y] = MSLOT(i);
        return <At key={`m${i}`} x={ox + x} y={oy + y}><Member id={id} /></At>;
      })}
      {Array.from({ length: followers }, (_, j) => { const [x, y] = FSLOT(j, rows); return <At key={`f${j}`} x={ox + x} y={oy + y}><Fol /></At>; })}
    </>
  );
}

// ---------- the camera ----------
/** Stage position (units) of a world point under camera [cx, cy, z]. */
export const toStage = ([cx, cy, z], [wx, wy]) => [STAGE.w / 2 + z * (wx - cx), STAGE.h / 2 + z * (wy - cy)];
/**
 * A beat's camera shots: [{ t, cam: [cx, cy, z], d, lamp: [wx, wy, w, h] }] — at t ms the camera eases to cam over
 * d ms; the lamp pool (w × h stage units) centres on world point (wx, wy).
 */
export function useShot(shots, still, stillShot) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (still) return undefined;
    const ids = shots.map((s, k) => (k ? setTimeout(() => setI(k), s.t) : null));
    return () => ids.forEach(id => id && clearTimeout(id));
  }, [shots, still]);
  return still ? (stillShot || shots[shots.length - 1]) : shots[Math.min(i, shots.length - 1)];
}
/** The camera: world children placed in world units, framed by `shot`. uk: CSS px per stage unit (measured). */
export function Camera({ shot, children }) {
  const [cx, cy, z] = shot.cam;
  return (
    <div className="in-cam" style={{ '--cx': cx, '--cy': cy, '--z': z, '--cd': `${shot.d ?? 1100}ms` }}>
      {children}
    </div>
  );
}
/** The lamp pool for a shot (stage units). */
export function Lamp({ shot }) {
  const [wx, wy, w = 230, h = 170] = shot.lamp || [0, 0];
  const [lx, ly] = toStage(shot.cam, [wx, wy]);
  return <span className="intro-lamp" style={{ '--lx': lx, '--ly': ly, '--lw': w, '--lh': h, '--cd': `${shot.d ?? 1100}ms` }} />;
}

// ---------- camera presets (added for beat 3's wheel close-up; cam = [cx, cy, z], lamp = [wx, wy, w, h]) ----------
export const CAM = {
  /** the whole wheel, large and centred (80 units across at zoom 1) */
  wheel: { cam: [WHEEL.cx, WHEEL.cy, Z.one], lamp: [WHEEL.cx, WHEEL.cy, 170, 130] },
  /** closer: the wheel's right half (green and the spaces near the cult) at 4/3 */
  wheelNear: { cam: [WHEEL.cx + 18, WHEEL.cy, Z.mid], lamp: [WHEEL.cx + 22, WHEEL.cy, 150, 120] },
  /** the wheel on the left and your cult on the right (zoom 1) */
  wheelAndCult: { cam: [-44, 10, Z.one], lamp: [-46, 10, 240, 160] },
  /** your cult, close (4/3): card, initiation ring, pile, crowd */
  cult: { cam: [4, 11, Z.mid], lamp: [6, 6, 200, 150] },
};
