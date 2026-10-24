// The token face (?spaces=token): each space is a round cardboard action token, pixel-cut. A thick rim in the
// quadrant's ink, the space's pixel icon large in the middle (its identity, the verb), and a dark strip across the
// bottom arc carrying what it does as symbols, at most three (Dune: Imperium's icon line). The name is in the hover.
// The rings differ in weight: ring I small and plain, ring II larger with a second rim, ring III the biggest and
// gilded with rivets. States: lit = the lamp catches the upper-left edge and the token lifts; open = flat;
// taken / fresh = darkened like a token turned face-down, the minion standing on it (fresh adds a dotted ring in
// the mover's colour); locked = the blank cardboard back with its ring numeral.
// Contract: ./index.js. Art (rasterizer, marks, strips): ./token-art.js.
import { memo } from 'react';
import './token.css';
import { FaceMinion, Sprite, spriteId, iconFor, Follower, quadrant, roman } from './kit.jsx';
import { ResourceGlyph } from '../Glyphs.jsx';
import { CELL, RING_G, radiusOf, tokenPaths, PAINT, markPaths, isMark, MARK_FILL, RES, stripFor } from './token-art.js';

// ---------- the strip, laid out in SCREEN pixels and scaled by px (so 14px glyphs and 13px numbers stay 14 and 13) ----------
const GLYPH = 14; // a mark is 7 cells of 2px; a resource glyph and the follower mark match it
const FONT = 13;
const charW = ch => (/[0-9]/.test(ch) ? 7.4 : /[+−=≤×]/.test(ch) ? 7.6 : ch === '½' ? 10 : ch === '/' ? 5 : 7);
const textW = t => [...t].reduce((s, ch) => s + charW(ch), 0);
const JOIN = new Set(['→', '/', '|', '=']);

function measure(atom) {
  if (atom.startsWith('tag:')) { const t = atom.slice(4); return { kind: 'tag', t, w: Math.max(14, textW(t) + 11) }; }
  if (atom.startsWith('m:')) { const m = markPaths('m'); return { kind: 'mark', name: 'm', tint: atom.slice(2), w: m.w * 2 }; }
  if (RES.has(atom)) return { kind: 'res', w: GLYPH };
  if (atom === 'f') return { kind: 'fol', w: GLYPH };
  if (isMark(atom)) return { kind: 'mark', name: atom, w: markPaths(atom).w * 2 };
  if (JOIN.has(atom)) return { kind: 'join', w: atom === '→' ? 11 : atom === '|' ? 6 : 7 };
  return { kind: 'num', w: textW(atom) };
}

function Atom({ atom, m, x }) {
  const y = -GLYPH / 2;
  if (m.kind === 'res') return <g className="tk-res"><Pin x={x} y={y} s={GLYPH}><ResourceGlyph r={atom} size={GLYPH} decorative /></Pin></g>;
  if (m.kind === 'fol') return <Pin x={x} y={y} s={GLYPH}><Follower size={GLYPH} title="followers" /></Pin>;
  if (m.kind === 'mark') {
    const mk = markPaths(m.name);
    return (
      <g transform={`translate(${x} ${-mk.h})`} shapeRendering="crispEdges">
        <g transform="scale(2)">
          {Object.entries(mk.paths).map(([k, d]) => <path key={k} d={d} fill={m.tint && k === 'c' ? `var(--${m.tint})` : MARK_FILL[k]} />)}
        </g>
      </g>
    );
  }
  if (m.kind === 'tag') {
    // a price tag: free (0), a discount (−4), half (½), a cap (≤6), or blank: a buy
    const w = m.w, h = 14;
    return (
      <g transform={`translate(${x} ${-h / 2})`}>
        <path d={`M0 ${h / 2}L4 0H${w}V${h}H4Z`} fill="#f3e6c8" />
        <rect x="3" y={h / 2 - 1} width="2" height="2" fill="#1d1611" />
        {m.t && <text x={4 + (w - 4) / 2 + 0.5} y="0.5" dy={h / 2} className="tk-tagtext" textAnchor="middle" dominantBaseline="central">{m.t}</text>}
      </g>
    );
  }
  if (m.kind === 'join') {
    if (atom === '→') return <path d={`M${x} -1H${x + 7}V-3H${x + 9}V-1H${x + 11}V1H${x + 9}V3H${x + 7}V1H${x}Z`} className="tk-join" shapeRendering="crispEdges" />;
    if (atom === '|') return <rect x={x + 2} y="-7" width="2" height="14" className="tk-join" />;
    return <text x={x + m.w / 2} y="0" className="tk-jointext" textAnchor="middle" dominantBaseline="central">{atom}</text>;
  }
  return <text x={x} y="0.5" className="tk-num" dominantBaseline="central">{atom}</text>;
}

/** A nested svg pinned to s×s at (x, y): the stage's CSS sizes every svg to 100%, so a sprite or glyph sits in one. */
function Pin({ x = 0, y = 0, s, children }) {
  return <svg x={x} y={y} viewBox={`0 0 ${s} ${s}`} overflow="visible" style={{ width: s, height: s, overflow: 'visible' }}>{children}</svg>;
}

const GAP_IN = 2, GAP_OUT = 8, PAD = 5, H = 19;
/** The symbol strip: a dark ribbon with notched pixel ends, centred at (0, y) in board units. */
function Strip({ symbols, px, y, ring }) {
  const laid = [];
  let x = 0;
  symbols.forEach((sym, si) => {
    if (si) { laid.push({ dot: true, x: x + GAP_OUT / 2 - 1 }); x += GAP_OUT; }
    sym.forEach((atom, ai) => {
      if (ai) x += GAP_IN;
      const m = measure(atom);
      laid.push({ atom, m, x });
      x += m.w;
    });
  });
  const inner = x, W = inner + PAD * 2, h2 = H / 2, w2 = W / 2;
  // the ribbon with stepped (pixel) corners, its tails tucked behind each end
  const rib = `M${-w2 + 2} ${-h2}H${w2 - 2}V${-h2 + 2}H${w2}V${h2 - 2}H${w2 - 2}V${h2}H${-w2 + 2}V${h2 - 2}H${-w2}V${-h2 + 2}H${-w2 + 2}Z`;
  const tail = s => `M${s * (w2 - 3)} ${-h2 + 5}H${s * (w2 + 5)}L${s * (w2 + 2)} ${2}L${s * (w2 + 5)} ${h2 + 3}H${s * (w2 - 3)}Z`;
  return (
    <g className={`tk-strip r${ring}`} transform={`translate(0 ${y.toFixed(2)}) scale(${px})`}>
      <path d={tail(-1)} className="tk-tail" shapeRendering="crispEdges" />
      <path d={tail(1)} className="tk-tail" shapeRendering="crispEdges" />
      <path d={rib} className="tk-ribbon" shapeRendering="crispEdges" />
      <rect x={-w2 + 2} y={-h2 + 1} width={W - 4} height="1" className="tk-ribbon-hi" />
      <g transform={`translate(${-inner / 2} 0)`}>
        {laid.map((l, k) => (l.dot ? <rect key={k} x={l.x} y="-1" width="2" height="2" className="tk-sep" /> : <Atom key={k} atom={l.atom} m={l.m} x={l.x} />))}
      </g>
    </g>
  );
}

// icon size (board units) and where it sits; where the strip sits; the minion's height
const LAY = {
  1: { icon: 27, iy: -4, sy: 14.6, mh: 23 },
  2: { icon: 30, iy: -4.5, sy: 16.6, mh: 24 },
  3: { icon: 36, iy: -5, sy: 19.2, mh: 26 },
};

function Body({ ring, variant }) {
  const paths = tokenPaths(ring, variant);
  return <g shapeRendering="crispEdges">{PAINT.filter(k => paths[k]).map(k => <path key={k} d={paths[k]} className={`tk-${k}`} />)}</g>;
}

// a light ink would vanish against the cream field: its rim prints a shade darker
const RIM_INK = { white: '#b3a283' };

function Token({ q, action, ring, round, status, minions = [], effect, px = 0.77, color, flash }) {
  const R = radiusOf(ring);
  const L = LAY[ring];
  const locked = status === 'locked';
  const taken = status === 'taken' || status === 'fresh';
  const lit = status === 'lit';
  const res = quadrant(q).resource;
  const ids = [`${q}.${action.key}`, spriteId(action.name)];
  const drawn = iconFor(ids, 'action').drawn;
  const symbols = locked ? [] : stripFor(q, action, round, effect);
  const mover = minions.find(m => m.fresh);
  const lift = lit ? -1.6 : 0;
  return (
    <g className={`tk r${ring} ${status}${flash ? ' flash' : ''}`} style={{ '--tkc': RIM_INK[q] || color || `var(--${q})` }} data-token={`${q}.${action.key}`}>
      {/* the cast shadow, longer when the token is lifted */}
      <ellipse cx="0" cy={R * 0.78 + 2.6} rx={R * (lit ? 1.02 : 0.96)} ry={R * 0.3} className="tk-shadow" />
      {lit && <circle r={R + 2.2} className="tk-glow" />}
      <g className="tk-body" transform={`translate(0 ${lift})`}>
        <g className={taken ? 'tk-down' : undefined}>
          <Body ring={ring} variant={locked ? 'locked' : lit ? 'lit' : 'face'} />
          {locked ? (
            <text y={1} className="tk-numeral" fontSize={(ring === 3 ? 17 : 15) * px} textAnchor="middle" dominantBaseline="central">{roman(ring)}</text>
          ) : (
            <>
              {drawn ? (
                <Pin x={-L.icon / 2} y={L.iy - L.icon / 2} s={L.icon}><Sprite id={ids} kind="action" sphere={res} size={L.icon} /></Pin>
              ) : (
                // no picture drawn yet (the plain stand-in spheres): the resource itself, large
                <Pin x={-L.icon * 0.36} y={L.iy - L.icon * 0.36} s={L.icon * 0.72}><ResourceGlyph r={res} size={L.icon * 0.72} decorative /></Pin>
              )}
              {symbols.length > 0 && <Strip symbols={symbols} px={px} y={L.sy} ring={ring} />}
            </>
          )}
        </g>
      </g>
      {status === 'fresh' && <circle r={R + 2.6} className={`tk-fresh${mover ? '' : ' plain'}`} style={mover ? { stroke: mover.color } : undefined} />}
      {minions.map((m, k) => <FaceMinion key={m.pid} m={m} x={(k - (minions.length - 1) / 2) * (L.mh * 0.62)} y={R * 0.42} size={L.mh} />)}
    </g>
  );
}

const Face = memo(Token);
// the click box per ring: the token itself (ring I 45, II 51, III 57 units across, plus its edge)
Face.box = { 1: [RING_G[1] * CELL, RING_G[1] * CELL + 3], 2: [RING_G[2] * CELL, RING_G[2] * CELL + 3], 3: [RING_G[3] * CELL, RING_G[3] * CELL + 3] };
// the tokens sit on the printed paper; the ring bands stay, faint, as the board they're laid on
export default Face;
