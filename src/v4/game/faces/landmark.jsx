// landmark: each space is a little pixel PLACE in its quadrant's color (design/prototypes/actions/refs/README.md,
// direction 1: Stone Age, Everdell, Root, Kingdom Two Crowns). The place is the action's own icon set into a
// building that grows as the rings close in: a stall in ring I, a shrine in ring II, a temple in ring III
// (_landmark-art.js). What you get floats above it as pieces, never words (_landmark-pieces.jsx); the full rule
// stays in the hover card, and the name appears on hover only. A flagstone pad sits at the place's foot: the
// minions stand there.
// States: lit = the place glows in the lamp, pieces full; open = full, no glow; taken = the place at 40%, the
// minion on the pad; locked = the place shuttered in grey with its ring numeral; fresh = taken, plus a dotted
// ring in the mover's color.
import { FaceMinion, FaceText, quadrant } from './kit.jsx';
import { placeRuns, padRuns } from './_landmark-art.js';
import { piecesFor, PieceRow, rowWidth } from './_landmark-pieces.jsx';
import './landmark.css';

// the place's pixel size in board units, per ring (a 32×32 grid), and how big a piece is in screen px
const PIX = { 1: 1.15, 2: 1.0, 3: 1.4 };
const PIECE_PX = 14;

export default function Landmark({ q, action, ring, round, status, minions = [], size, effect, px = 1 }) {
  const { h } = size;
  const sphere = (() => { try { return quadrant(q).resource || q; } catch { return q; } })();
  const lit = status === 'lit', locked = status === 'locked', taken = status === 'taken' || status === 'fresh';
  const u = PIX[ring] || 1;
  const P = 32 * u; // the place's side
  const top = -h / 2;
  // the pieces row: PIECE_PX on screen, shrunk only if a long row would spill far past the box
  let s = PIECE_PX * px;
  const pieces = piecesFor(q, action, round);
  if (pieces) { const wmax = size.w * 1.5; const w0 = rowWidth(pieces, s); if (w0 > wmax) s = Math.max(12 * px, s * (wmax / w0)); }
  const rowTop = top - s * 0.15;
  const placeTop = rowTop + s * 1.2;
  const runs = placeRuns(q, action, sphere, ring);
  const padW = 16 * u * 1.3, padH = 5 * u * 1.3;
  const padY = placeTop + P - padH * 0.55;
  const fresh = status === 'fresh' ? minions.find(m => m.fresh) : null;
  return (
    <g className={`lm lm-${status} lm-r${ring}`} data-lm={`${q}.${action.key}`}>
      {/* the lamp's pool of light on the paper under a lit place */}
      {lit && <ellipse className="lm-pool" cx={0} cy={placeTop + P * 0.62} rx={P * 0.78} ry={P * 0.5} />}
      <g className="lm-place" opacity={taken ? 0.4 : 1}>
        <svg x={-P / 2} y={placeTop} width={P} height={P} viewBox="0 0 32 32" shapeRendering="crispEdges" overflow="visible" className={locked ? 'lm-shut' : ''}>
          {runs.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
          {locked && <g className="lm-shutter">{[9, 13, 17, 21, 25].map(y => <rect key={y} x="5" y={y} width="22" height="3" />)}</g>}
        </svg>
      </g>
      {/* the pad the minion stands on */}
      <svg x={-padW / 2} y={padY} width={padW} height={padH} viewBox="0 0 16 5" shapeRendering="crispEdges" className="lm-pad" opacity={locked ? 0.35 : 1}>
        {padRuns.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
      </svg>
      {locked
        ? <text className="lm-numeral" x={0} y={placeTop + P * 0.56} fontSize={15 * px} textAnchor="middle" dominantBaseline="central">{['', 'I', 'II', 'III'][ring]}</text>
        : pieces
          ? <g transform={`translate(0 ${rowTop})`} opacity={taken ? 0.55 : 1}><PieceRow pieces={pieces} s={s} /></g>
          : <FaceText text={effect} px={px} w={size.w * 1.4} h={s * 1.3} y={rowTop + s * 0.55} />}
      {minions.map((m, k) => <FaceMinion key={m.pid} m={m} x={(k - (minions.length - 1) / 2) * 15 * u} y={padY + padH * 0.6} size={20 * Math.min(1.15, u)} />)}
      {fresh && <ellipse className="lm-fresh" cx={0} cy={placeTop + P * 0.5} rx={P * 0.66} ry={P * 0.62} stroke={fresh.color} />}
    </g>
  );
}
// a box a little taller than wide, so the pieces fit over the place
Landmark.box = { 1: [62, 66], 2: [50, 58], 3: [64, 72] };
