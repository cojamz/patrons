// Beat 3 — "Take actions granted by the mysterious powers to add to your resources, recruit new members, and become
// more powerful." It opens where beat 2 rests (leader, minions on their ring, three followers, the violet glow) and
// tells it one thing at a time (design/prototypes/intro2/storyboard.md, beat 3; Cory: a first-timer must see
// "minion on a space → that space's resources come to me"):
//   actions   the camera comes to the wheel; ONE minion floats from the leader onto ONE space (Kickback, gold); the
//             space lights and says what it gives, big: "+3 [gold]"; exactly those three glyphs lift off the space,
//             one after another, into the cult's pile, which counts up. A second minion does it again, faster, on a
//             green space (Hum, +3 green), so the pattern is learned;
//   recruit   the wheel dims, the camera pulls back to the cult, and <Initiation/> plays (card, beckon, bow, mark,
//             slot), paid with two of the gold; the followers step back a row to make room for the new member;
//   followers the four other glyphs rise into a small arcane glow, circle once and dissolve; three followers appear
//             there and hop into the crowd: "+3";
//   power     a warm aura blooms behind the leader as it rises two units (LEAD → LEAD_UP).
import {
  Act, At, LEAD, LEAD_UP, LeadFrames, Mini, Fol, Res, Aura, ArcaneFloor, ArcaneColumn, Count, CAM,
  FSLOT, PILE, SWIRL, WHEEL, QUAD, YOU_MEMBERS, ringTL, space, onSpace, useCast,
} from './shared.jsx';
import Initiation, { BECKON, SETTLE, WALK_MS, T as IT } from './Initiation.jsx';

// ---------- timing (ms into the beat) ----------
const A1 = 400; // the first action: a minion lifts off the leader (floats 900), lands, the space pays (~2.5 s)
const A2 = 3000; // the second, faster (~1.3 s)
const DIM = 4600; // the wheel dims; the camera pulls back to the cult
const INIT = 4700; // <Initiation/> starts (the card rises)
const STEP_BACK = INIT + SETTLE; // the followers step back a row as the member walks to its slot (WALK_MS)
const BUY = INIT + 3800; // the four other glyphs rise into the glow (as the initiation's "+1" fades)
const SPAWN = BUY + 800; // three followers appear in the glow
const PLUS = BUY + 1450; // "+3 follower"
const POWER = BUY + 1650; // the aura blooms, the leader rises
/** How long this beat plays before the next (ms). */
export const DURATION = POWER + 1150;

export const shots = [
  { t: 0, d: 1500, ...CAM.wheelNear }, // to the wheel, following the first minion
  { t: DIM, d: 1100, ...CAM.cult }, // back to the cult for the recruit
];
export const stillShot = { ...CAM.wheelAndCult };

// ---------- the actions: which minion, which space, what it pays, and when ----------
// a minion floats (f ms), lands; the space lights; the plaque pops; the glyphs lift off one by one (gap apart)
const ACTS = [
  { m: 0, q: 'gold', k: 0, r: 'gold', n: 3, name: 'Kickback', at: A1, float: 900, arc: 14, gap: 230, pop: 150, fly: 520, pile: [0, 1, 2] },
  { m: 2, q: 'green', k: 1, r: 'green', n: 3, name: 'Hum', at: A2, float: 450, arc: 10, gap: 100, pop: 80, fly: 400, pile: [3, 4, 5] },
].map(a => {
  const land = a.at + a.float;
  const plaque = land + (a.m ? 30 : 100);
  const lift = plaque + (a.m ? 70 : 250); // the first glyph pops up out of the space
  const lands = [0, 1, 2].map(g => lift + g * a.gap + a.pop + a.fly);
  return { ...a, land, plaque, lift, lands, done: lands[2] + (a.m ? 0 : 70) };
});
const rnd = ([x, y]) => [Math.round(x), Math.round(y)];
const INK = { green: '#3d8c66', blue: '#4f7ea8', gold: '#c99327', red: '#b4533e' };
const PAID = [0, 1]; // the PILE slots the initiation pays from (two gold)
const SPENT = [2, 3, 4, 5]; // what's left: one gold and three green buy the followers

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

/** What a space gives, said big over it: "+3 [glyph]", the space's name small beneath (a walnut plaque). */
const Plaque = ({ r, n, name }) => (
  <span style={{ display: 'block', width: 'max-content', transform: 'translateX(-50%)', padding: '2.5px 5px 3px', borderRadius: 3,
    background: 'rgba(28,20,15,.92)', boxShadow: '0 0 0 .5px rgba(243,230,200,.32), 0 2px 5px rgba(0,0,0,.55)', textAlign: 'center', lineHeight: 1 }}>
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <b className="in-num" style={{ fontSize: 11 }}>+{n}</b><Res r={r} size={10} />
    </span>
    <span style={{ display: 'block', marginTop: 2, fontFamily: 'var(--i-sans)', fontWeight: 700, fontSize: 4.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(243,230,200,.72)' }}>{name}</span>
  </span>
);

// ---------- tracks ----------
/** A minion lifts off the leader, floats to its space, and lands softly; once the wheel's work is done it dims. */
function floatTrack(a) {
  const [x0, y0] = ringTL(a.m);
  const [x, y] = rnd(onSpace(space(a.q, a.k)));
  return [{ x: x0, y: y0 },
    [a.at, a.float, { x, y }, 'io', a.arc],
    [a.land - 50, 110, { sx: 1.1, sy: 0.88 }, 'out'], // a soft landing
    [a.land + 60, 220, { sx: 1, sy: 1 }, 'out'],
    [DIM, 600, { o: 0.22 }, 'sine']];
}
/** The minion that stays home: as the camera pulls back it slips down behind its leader (out of the card's way). */
const HOME = 1;
const homeTrack = [{ x: ringTL(HOME)[0], y: ringTL(HOME)[1] }, [DIM + 100, 600, { y: ringTL(HOME)[1] + 18 }, 'io'], [DIM + 200, 350, { o: 0 }, 'sine']];
/** The plaque over the space: pops in above the minion's head, holds while the glyphs leave, then goes. */
function plaqueTrack(a) {
  const [sx, sy] = space(a.q, a.k);
  return [{ x: sx, y: sy - 36, o: 0, s: 0.6 }, [a.plaque, a.m ? 200 : 300, { o: 1, s: 1 }, 'back'], [a.done, 300, { o: 0 }, 'sine']];
}
/** Glyph g of an action: pops up out of its space, then flies to its pile slot (arriving = the pile counts up). */
function glyphTrack(a, g) {
  const [sx, sy] = space(a.q, a.k);
  const slot = a.pile[g];
  const [px, py] = PILE(slot);
  const t = a.lift + g * a.gap;
  const track = [{ x: sx - 4.5 + (g - 1) * 7, y: sy - 1, o: 0, s: 0.4 },
    [t, a.pop, { o: 1, s: 1, y: sy - 6 }, 'out'],
    [t + a.pop, a.fly, { x: px - 4.5, y: py - 4.5 }, 'io', a.m ? 10 : 14]];
  if (PAID.includes(slot)) return [...track, [INIT + IT.pay + 100 * PAID.indexOf(slot), 1, { o: 0 }, 'lin']]; // the initiation carries these on
  // the buy: rise into the glow, circle once (a shrinking spiral), and dissolve into light
  const k = SPENT.indexOf(slot); // 0–3: four phases around the circle
  const ph = 90 * k - 90;
  const enter = [SWIRL[0] + 9 * Math.cos(ph * Math.PI / 180) - 4.5, SWIRL[1] + 9 * Math.sin(ph * Math.PI / 180) - 4.5];
  const b = BUY + 60 * k;
  const steps = [[b, 380, { x: enter[0], y: enter[1] }, 'io']];
  const SEG = 12, T0 = BUY + 440, LAP = 520;
  for (let i = 1; i <= SEG; i++) {
    const ang = (ph + (360 * i) / SEG) * Math.PI / 180, r = 9 - 6 * (i / SEG);
    steps.push([T0 + (LAP * (i - 1)) / SEG, LAP / SEG, { x: SWIRL[0] + r * Math.cos(ang) - 4.5, y: SWIRL[1] + r * Math.sin(ang) - 4.5 }, 'lin']);
  }
  steps.push([T0 + 160, LAP - 160, { o: 0, s: 0.35, f: 1.8 }, 'in']);
  return [...track, ...steps];
}
/** The pile's count: up by one as each glyph lands; down as the initiation pays; gone when the rest is spent. */
const COUNT = [[0, 0], ...ACTS.flatMap((a, ai) => a.lands.map((t, g) => [t, 3 * ai + g + 1])),
  [INIT + IT.pay, 5], [INIT + IT.pay + 100, 4]];
const countTrack = [{ x: -37, y: 15, o: 0 }, [ACTS[0].lands[0] - 120, 200, { o: 1 }, 'sine'], [BUY, 300, { o: 0 }, 'sine']];
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

      {/* the wheel rises in at the left as the camera comes to it, and dims once its work is done */}
      <Act track={[{ x: wheelTL[0], y: wheelTL[1] + 8, o: 0 }, [0, 800, { y: wheelTL[1] }, 'out'], [0, 700, { o: 1 }, 'sine'], [DIM, 600, { o: 0.22 }, 'sine']]}
        stillAs={{ o: 1 }} origin="50% 50%">
        <WheelArt />
        {ACTS.map(a => (
          <Act key={a.q} track={[{ x: 0, y: 0, o: 0 }, [a.land - 60, 300, { o: 1 }, 'sine']]}><SpaceGlow q={a.q} k={a.k} /></Act>
        ))}
      </Act>

      {/* the minions: two float to their spaces, one stays home (behind the leader, so the long float passes behind it) */}
      {ACTS.map(a => <Act key={`m${a.m}`} track={floatTrack(a)} stillAs={{ o: 1 }}><Mini emoji={you} /></Act>)}
      <Act track={homeTrack} stillAs={{ o: 0 }}><Mini emoji={you} /></Act>

      {/* the warm aura of power (behind the leader), blooming at the end */}
      <Act track={[{ x: -28, y: -28, o: 0, s: 0.8 }, [POWER, 700, { o: 1, s: 1, y: -30 }, 'sine']]} origin="50% 50%"><Aura w={56} h={56} /></Act>
      <Act track={[{ x: LEAD[0], y: LEAD[1] }, [POWER, 600, { y: LEAD_UP[1] }, 'out'], [POWER, 700, { f: 1.08 }, 'sine']]}>
        <LeadFrames emoji={you} seq={SEQ} stillAs="idle" />
      </Act>

      {/* recruit: the full ceremony (it takes two gold from the pile; drawn after the leader, before the followers) */}
      <Initiation at={INIT} member={YOU_MEMBERS[0]} slot={0} pile={PAID} />

      {/* the followers from beat 2, stepping back a row for the member */}
      {[0, 1, 2].map(j => <Act key={`f${j}`} track={stepTrack(j)}><Fol /></Act>)}

      {/* the pile's count, under it */}
      <Act track={countTrack} stillAs={{ o: 0 }}><span style={{ display: 'block', fontSize: 8, lineHeight: 1, textShadow: '0 1px 1px rgba(0,0,0,.6)' }}><Count steps={COUNT} /></span></Act>

      {/* buy followers: a small arcane glow at SWIRL (under the glyphs that pay for them and the followers that come out) */}
      <Act track={[{ x: SWIRL[0] - 18, y: SWIRL[1] - 14, o: 0 }, [BUY - 150, 450, { o: 1 }, 'sine'], [SPAWN + 300, 600, { o: 0 }, 'sine']]}>
        <ArcaneFloor w={36} h={28} />
      </Act>
      {/* the glyphs: off the spaces into the pile, then on (to the card, or into the glow) */}
      {ACTS.map(a => [0, 1, 2].map(g => (
        <Act key={`g${a.q}${g}`} track={glyphTrack(a, g)} origin="50% 50%"><Res r={a.r} /></Act>
      )))}
      {/* what each space gives, said big over it */}
      {ACTS.map(a => <Act key={`p${a.q}`} track={plaqueTrack(a)} origin="0 100%" stillAs={{ o: 0 }}><Plaque r={a.r} n={a.n} name={a.name} /></Act>)}
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
