// Beat 3 — "Take actions granted by the mysterious powers to add to your resources, recruit new members, and become
// more powerful." It opens where beat 2 rests (leader, minions on their ring, three followers, the violet glow) and
// tells it one thing at a time (design/prototypes/intro2/storyboard.md, beat 3):
//   actions   the wheel rises in at the left; the minions hop onto three round-I spaces, one by one; each space glows
//             and pays two of the real resource glyphs, which hop back to the pile beside the leader;
//   recruit   the wheel dims, the camera moves to the cult, and <Initiation/> plays (card, beckon, bow, mark, slot);
//             the followers step back a row to make room for the new member;
//   followers the four other glyphs rise into a small arcane glow, circle once and dissolve; three followers appear
//             there and hop into the crowd: "+3";
//   power     a warm aura blooms behind the leader as it rises two units (LEAD → LEAD_UP).
import {
  Act, At, LEAD, LEAD_UP, LeadFrames, Mini, Fol, Res, Aura, ArcaneFloor, ArcaneColumn,
  FSLOT, PILE, SWIRL, WHEEL, QUAD, YOU_MEMBERS, ringTL, space, onSpace, Z, useCast,
} from './shared.jsx';
import Initiation, { BECKON, SETTLE, WALK_MS, T as IT } from './Initiation.jsx';

/** How long this beat plays before the next (ms). */
export const DURATION = 9300;
export const shots = [
  { t: 0, cam: [-44, 10, Z.one], d: 1100, lamp: [-46, 10, 240, 160] },
  { t: 3000, cam: [4, 11, Z.mid], d: 1000, lamp: [6, 6, 200, 150] },
];
export const stillShot = shots[0];

// ---------- timing (ms into the beat) ----------
const WHEEL_IN = 0; // the wheel rises in (700)
const HOP = [900, 1150, 1400]; // each minion's hop to its space (650)
const HOP_MS = 650;
const PAY = 50; // after a landing, the space's two glyphs start up (110 apart, 600 each)
const DIM = 3000; // the wheel dims; the camera moves to the cult
const INIT = 3100; // <Initiation/> starts (the card rises)
const GOLD_OUT = n => INIT + IT.pay + 100 * n; // Initiation takes the two gold glyphs from the pile here
const STEP_BACK = INIT + SETTLE; // the followers step back a row as the member walks to its slot (WALK_MS)
const BUY = 6900; // the green and blue glyphs rise into the glow (as the initiation's "+1" fades)
const SPAWN = 7700; // three followers appear in the glow
const PLUS = 8350; // "+3 follower"
const POWER = 8550; // the aura blooms, the leader rises

// ---------- the actions: which minion goes where, what each space pays ----------
const rnd = ([x, y]) => [Math.round(x), Math.round(y)];
const ACTS = [
  { q: 'green', k: 0, arc: 10 }, // left minion → green, centre space
  { q: 'blue', k: 1, arc: 13 }, // top minion → blue, right of centre
  { q: 'gold', k: -1, arc: 20 }, // right minion → gold, right of centre (the long hop, behind the leader)
];
const INK = { green: '#3d8c66', blue: '#4f7ea8', gold: '#c99327', red: '#b4533e' };
// the pile fills in landing order: green 0–1, blue 2–3, gold 4–5 (the gold pays for the member)
const pileOf = (a, n) => 2 * a + n;

// ---------- the wheel: a small printed paper disc (the game's look), drawn in world units ----------
const R = { rim0: 36.6, rim1: 40, i0: 22.6, ii0: 13.4, hub: 6.5 };
const pt = (a, r) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
const f = n => n.toFixed(2);
function sector(a0, a1, r0, r1) {
  const [x0, y0] = pt(a0, r1), [x1, y1] = pt(a1, r1), [x2, y2] = pt(a1, r0), [x3, y3] = pt(a0, r0);
  const big = a1 - a0 > 180 ? 1 : 0;
  if (r0 <= 0) return `M0 0L${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${big} 1 ${f(x1)} ${f(y1)}Z`;
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${big} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 ${big} 0 ${f(x3)} ${f(y3)}Z`;
}
const cellOf = (q, k) => { const c = QUAD[q] + 27.5 * k; return sector(c - 13.75, c + 13.75, R.i0, R.rim0); };
const BOX = 41; // the svg is 82 × 82 units around the wheel's centre
const wheelTL = [WHEEL.cx - BOX, WHEEL.cy - BOX];

function WheelArt() {
  const quads = Object.keys(QUAD);
  return (
    <svg viewBox={`${-BOX} ${-BOX} ${2 * BOX} ${2 * BOX}`} width={2 * BOX} height={2 * BOX} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="b3Paper" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#f4ebd7" /><stop offset=".8" stopColor="#eadfc4" /><stop offset="1" stopColor="#d9caa8" /></radialGradient>
      </defs>
      <circle r={R.rim1} fill="url(#b3Paper)" />
      {quads.map(q => {
        const c = QUAD[q];
        return (
          <g key={q}>
            <path d={sector(c - 45, c + 45, R.ii0, R.i0)} fill={INK[q]} fillOpacity=".1" />
            <path d={sector(c - 45, c + 45, 0, R.ii0)} fill={INK[q]} fillOpacity=".06" />
            {[-1, 0, 1].map(k => <path key={k} d={cellOf(q, k)} fill={INK[q]} fillOpacity=".3" stroke="rgba(255,250,238,.5)" strokeWidth=".4" />)}
            <path d={sector(c - 45, c + 45, R.rim0, R.rim1)} fill={INK[q]} fillOpacity=".88" />
          </g>
        );
      })}
      {[R.i0, R.ii0].map(r => <circle key={r} r={r} fill="none" stroke="rgba(42,31,23,.32)" strokeWidth=".4" />)}
      {quads.map(q => { const [x0, y0] = pt(QUAD[q] + 45, R.hub), [x1, y1] = pt(QUAD[q] + 45, R.rim1); return <line key={q} x1={f(x0)} y1={f(y0)} x2={f(x1)} y2={f(y1)} stroke="rgba(42,31,23,.42)" strokeWidth=".5" />; })}
      <circle r={R.rim1 - 0.3} fill="none" stroke="#7a6244" strokeWidth=".6" />
      <circle r={R.hub} fill="#2a1f17" stroke="rgba(243,230,200,.18)" strokeWidth=".4" />
    </svg>
  );
}
/** One space lit by the lamp (a warm wash and edge), laid over the wheel; it fades up as the minion lands. */
const SpaceGlow = ({ q, k }) => (
  <svg viewBox={`${-BOX} ${-BOX} ${2 * BOX} ${2 * BOX}`} width={2 * BOX} height={2 * BOX} aria-hidden="true"
    style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 2px rgba(255,231,176,.75))' }}>
    <path d={cellOf(q, k)} fill="#ffe7b0" fillOpacity=".42" stroke="#ffe7b0" strokeWidth=".9" />
  </svg>
);

// ---------- tracks ----------
const land = i => HOP[i] + HOP_MS;
function minionTrack(i) {
  const [x0, y0] = ringTL(i);
  const [x, y] = rnd(onSpace(space(ACTS[i].q, ACTS[i].k)));
  const t = land(i);
  return [{ x: x0, y: y0 },
    [HOP[i], 120, { sx: 1.08, sy: 0.9 }, 'out'], // a crouch,
    [HOP[i] + 120, HOP_MS - 120, { x, y }, 'io', ACTS[i].arc], // the hop,
    [HOP[i] + 120, 140, { sx: 0.94, sy: 1.08 }, 'out'], // stretched in the air,
    [t - 40, 110, { sx: 1.1, sy: 0.88 }, 'out'], // a soft landing
    [t + 70, 200, { sx: 1, sy: 1 }, 'out'],
    [DIM, 600, { o: 0.22 }, 'sine']]; // done: it dims with the wheel
}
/** A glyph pops up out of its space and hops to the pile (then, later, leaves it). */
function glyphTrack(a, n) {
  const [sx, sy] = space(ACTS[a].q, ACTS[a].k);
  const i = pileOf(a, n);
  const [px, py] = PILE(i);
  const t = land(a) + PAY + 110 * n;
  const start = [{ x: sx - 4.5 + (n ? 2 : -2), y: sy - 8, o: 0, s: 0.5 }, [t, 160, { o: 1, s: 1 }, 'out'], [t + 60, 600, { x: px - 4.5, y: py - 4.5 }, 'io', 12]];
  if (ACTS[a].q === 'gold') return [...start, [GOLD_OUT(n), 1, { o: 0 }, 'lin']]; // Initiation carries these on
  // the buy: rise into the glow, circle once (a shrinking spiral), and dissolve into light
  const k = i; // 0–3: four phases around the circle
  const ph = 90 * k - 90;
  const enter = [SWIRL[0] + 9 * Math.cos(ph * Math.PI / 180) - 4.5, SWIRL[1] + 9 * Math.sin(ph * Math.PI / 180) - 4.5];
  const b = BUY + 60 * k;
  const steps = [[b, 380, { x: enter[0], y: enter[1] }, 'io']];
  const SEG = 12, T0 = BUY + 440, LAP = 520;
  for (let s = 1; s <= SEG; s++) {
    const ang = (ph + (360 * s) / SEG) * Math.PI / 180, r = 9 - 6 * (s / SEG);
    steps.push([T0 + (LAP * (s - 1)) / SEG, LAP / SEG, { x: SWIRL[0] + r * Math.cos(ang) - 4.5, y: SWIRL[1] + r * Math.sin(ang) - 4.5 }, 'lin']);
  }
  steps.push([T0 + 160, LAP - 160, { o: 0, s: 0.35, f: 1.8 }, 'in']);
  return [...start, ...steps];
}
/** The three bought followers: appear in the glow, hop to the second row of the crowd. */
const BOUGHT = [{ j: 4, off: [-7, 2] }, { j: 3, off: [0, -3] }, { j: 5, off: [7, 2] }];
function boughtTrack({ j, off }, n) {
  const [x, y] = FSLOT(j, 1);
  const x0 = SWIRL[0] + off[0] - 5, y0 = SWIRL[1] + off[1] - 5;
  const t = SPAWN + 70 * n;
  return [{ x: x0, y: y0, o: 0, s: 0.4 }, [t, 240, { o: 1, s: 1 }, 'back'], [t + 220, 450, { x, y }, 'io', 10]];
}
/** The three followers from beat 2 step back a row (FSLOT row 0 → 1) to make room for the member. */
function stepTrack(j) {
  const [x0, y0] = FSLOT(j, 0), [x, y] = FSLOT(j, 1);
  return [{ x: x0, y: y0 }, [STEP_BACK + 40 * j, WALK_MS, { x, y }, 'io', 0, 2]];
}
const SEQ = [[0, 'idle'], ...BECKON.map(([t, p]) => [INIT + t, p])];

export default function Beat3() {
  const { you } = useCast();
  return (
    <>
      {/* carried over from beat 2, as it rests */}
      <At x={-32} y={-42}><ArcaneColumn w={64} h={58} /></At>
      <At x={-44} y={11}><ArcaneFloor w={88} h={10} /></At>
      <At x={-20} y={12} className="in-shadow"><span className="in-floor" style={{ width: 40, height: 6 }} /></At>

      {/* actions: the wheel rises in at the left, then dims once its work is done */}
      <Act track={[{ x: wheelTL[0], y: wheelTL[1] + 8, o: 0 }, [WHEEL_IN, 700, { y: wheelTL[1] }, 'out'], [WHEEL_IN, 600, { o: 1 }, 'sine'], [DIM, 600, { o: 0.22 }, 'sine']]}
        stillAs={{ o: 1 }} origin="50% 50%">
        <WheelArt />
        {ACTS.map((a, i) => (
          <Act key={a.q} track={[{ x: 0, y: 0, o: 0 }, [land(i) - 60, 320, { o: 1 }, 'sine']]}><SpaceGlow q={a.q} k={a.k} /></Act>
        ))}
      </Act>

      {/* the minions hop onto their spaces, one by one (behind the leader: the right one's long hop passes behind it) */}
      {[0, 1, 2].map(i => <Act key={`m${i}`} track={minionTrack(i)} stillAs={{ o: 1 }}><Mini emoji={you} /></Act>)}

      {/* the warm aura of power (behind the leader), blooming at the end */}
      <Act track={[{ x: -28, y: -28, o: 0, s: 0.8 }, [POWER, 700, { o: 1, s: 1, y: -30 }, 'sine']]} origin="50% 50%"><Aura w={56} h={56} /></Act>
      <Act track={[{ x: LEAD[0], y: LEAD[1] }, [POWER, 600, { y: LEAD_UP[1] }, 'out'], [POWER, 700, { f: 1.08 }, 'sine']]}>
        <LeadFrames emoji={you} seq={SEQ} stillAs="idle" />
      </Act>

      {/* recruit: the full ceremony (it takes the two gold glyphs from the pile; drawn after the leader, before the followers) */}
      <Initiation at={INIT} member={YOU_MEMBERS[0]} slot={0} pile={[pileOf(2, 0), pileOf(2, 1)]} />

      {/* the followers from beat 2, stepping back a row for the member */}
      {[0, 1, 2].map(j => <Act key={`f${j}`} track={stepTrack(j)}><Fol /></Act>)}

      {/* buy followers: a small arcane glow at SWIRL, the glyphs that pay for them, the followers that come out */}
      <Act track={[{ x: SWIRL[0] - 18, y: SWIRL[1] - 14, o: 0 }, [BUY - 150, 450, { o: 1 }, 'sine'], [SPAWN + 300, 600, { o: 0 }, 'sine']]}>
        <ArcaneFloor w={36} h={28} />
      </Act>
      {ACTS.map((a, ai) => [0, 1].map(n => (
        <Act key={`g${ai}${n}`} track={glyphTrack(ai, n)} origin="50% 50%"><Res r={a.q} /></Act>
      )))}
      {BOUGHT.map((b, n) => <Act key={`b${b.j}`} track={boughtTrack(b, n)}><Fol /></Act>)}
      {/* "+3 [follower]": rises beside the new followers, holds, and is gone before the hand-over */}
      <Act track={[{ x: 22, y: 28, o: 0 }, [PLUS, 400, { y: 23, o: 1 }, 'out'], [DURATION - 500, 400, { o: 0 }, 'in']]} stillAs={{ o: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 1.5, lineHeight: 1 }}>
          <b className="in-num" style={{ fontSize: 9, textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>+3</b>
          <Fol />
        </span>
      </Act>
    </>
  );
}
