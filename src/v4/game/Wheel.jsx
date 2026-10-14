// The board: a spinning wheel of 4 quadrants. Outer ring = round I, inner = round II, center = round III.
// Spaces are drawn so their labels face the bottom seat; the quadrant at the bottom is "facing you".
import { useEffect, useRef, useState, useCallback } from 'react';
import { quadrant } from '../../engine/v4/index.js';
import { bannerText, playerColor } from '../format.js';

const RING = { 1: { r0: 142, r1: 198, r: 170, n: 3 }, 2: { r0: 90, r1: 142, r: 116, n: 2 }, 3: { r0: 34, r1: 90, r: 62, n: 1 } };
const CX = 200, CY = 200;
const qCenter = q => 180 + q * 90;
const norm = a => ((a % 360) + 540) % 360 - 180;
function polar(a, r) { const t = (a - 90) * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
function arc(a0, a1, r0, r1) {
  const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
}
const abbrev = name => name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
export const facingOf = (rot, count) => {
  let best = 0, bd = 1e9;
  for (let q = 0; q < count; q++) { const d = Math.abs(norm(qCenter(q) + rot - 180)); if (d < bd) { bd = d; best = q; } }
  return best;
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {{ state:any, legal:Map<string,string>, onPick:(id:string)=>void, flash:Set<string>, facing:number, onFacing:(q:number)=>void }} props
 */
export default function Wheel({ state, legal, onPick, flash, facing, onFacing }) {
  const [rot, setRot] = useState(() => -90 * facing);
  const rotRef = useRef(rot);
  const anim = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const stage = useRef(null);
  const nq = state.quadrants.length;

  const applyRot = useCallback(r => {
    rotRef.current = r;
    setRot(r);
    const f = facingOf(r, nq);
    onFacing(f);
  }, [nq, onFacing]);

  const stop = () => { if (anim.current) cancelAnimationFrame(anim.current); anim.current = null; };
  const animateTo = useCallback(to => {
    stop();
    const from = rotRef.current, t0 = performance.now(), dur = reduced() ? 1 : 600;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      applyRot(from + (to - from) * e);
      anim.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim.current = requestAnimationFrame(step);
  }, [applyRot]);
  const nudge = useCallback(deg => animateTo(Math.round((rotRef.current + deg) / 90) * 90), [animateTo]);

  // Parent asked to face a quadrant (e.g. a tab was clicked): spin there the short way.
  useEffect(() => {
    if (anim.current || drag.current) return;
    if (facingOf(rotRef.current, nq) !== facing) animateTo(rotRef.current + norm(-90 * facing - rotRef.current));
  }, [facing, nq, animateTo]);

  useEffect(() => {
    const onKey = e => {
      const t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-90); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(90); }
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); stop(); };
  }, [nudge]);

  const angAt = e => {
    const b = stage.current.getBoundingClientRect();
    return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180 / Math.PI;
  };
  const onDown = e => {
    if (e.target.closest('button')) return;
    stop(); drag.current = { a: angAt(e) }; moved.current = false;
  };
  const onMove = e => {
    if (!drag.current) return;
    const a = angAt(e);
    const d = norm(a - drag.current.a);
    if (Math.abs(d) > 3 && !moved.current) { moved.current = true; try { stage.current.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    if (moved.current) { drag.current.a = a; applyRot(rotRef.current + d); }
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (!moved.current) return;
    animateTo(Math.round(rotRef.current / 90) * 90);
    setTimeout(() => { moved.current = false; }, 0);
  };

  const pick = id => { if (!moved.current && id) onPick(id); };
  const round = Math.max(1, state.round);

  const parts = [];
  state.quadrants.forEach((qid, q) => {
    const Q = quadrant(qid);
    const c = qCenter(q), a0 = c - 45, a1 = c + 45, isFacing = q === facing;
    const col = `var(--${qid})`;
    [1, 2, 3].forEach(t => {
      const R = RING[t], open = t <= round;
      const id = `b${q}${t}`;
      const br = R.r1 - 6.5;
      const [bx0, by0] = polar(a1 - 3, br), [bx1, by1] = polar(a0 + 3, br);
      parts.push(
        <g key={`ring${q}${t}`} className="ring">
          <path d={arc(a0 + 0.8, a1 - 0.8, R.r0 + 1, R.r1 - 1)} fill={col} fillOpacity={open ? (isFacing ? 0.26 : 0.12) : 0.04} stroke={col} strokeOpacity={open ? 0.55 : 0.18} />
          <path d={arc(a0 + 1.6, a1 - 1.6, R.r1 - 12, R.r1 - 1.6)} fill="var(--table)" fillOpacity={open ? 0.55 : 0.3} />
          <path id={id} d={`M${bx0},${by0} A${br},${br} 0 0 0 ${bx1},${by1}`} fill="none" />
          <text fontSize="7" fontWeight="700" letterSpacing="1.2" fill={col} fillOpacity={open ? 1 : 0.45} dominantBaseline="central">
            <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{bannerText(qid, t)}</textPath>
          </text>
        </g>,
      );
    });
    Q.actions.forEach((a, i) => {
      const t = a.ring, R = RING[t];
      const idx = Q.actions.filter((x, j) => x.ring === t && j < i).length;
      const span = t === 1 ? 66 : t === 2 ? 44 : 0;
      const ang = R.n === 1 ? c : (c + span / 2) - idx * (span / (R.n - 1));
      const [x, y] = polar(ang, R.r);
      const key = `${q}-${i}`;
      const owner = state.slots[key];
      const open = t <= round;
      const rad = t === 3 ? 15 : 16;
      const opt = legal.get(key);
      const cls = ['slot', opt ? 'can' : '', flash.has(key) ? 'flash' : ''].join(' ');
      const label = `${a.name} (${Q.name}, round ${t}): ${a.text}${owner !== undefined ? ` Taken by ${state.players[owner].name}.` : ''}`;
      parts.push(
        <g
          key={`s${key}`} className={cls} data-slot={key} data-option={opt || undefined}
          role={opt ? 'button' : undefined} tabIndex={opt ? 0 : undefined} aria-label={opt ? label : undefined}
          onClick={() => pick(opt)}
          onKeyDown={e => { if (opt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(opt); } }}
        >
          <title>{label}</title>
          {opt && <circle className="halo" cx={x} cy={y} r={rad + 4} fill="none" stroke={col} />}
          <circle cx={x} cy={y} r={rad} fill="var(--table)" stroke={col} strokeOpacity={open ? 1 : 0.3} strokeWidth={opt ? 2.5 : 1.5} />
          {owner !== undefined
            ? <circle className="worker" cx={x} cy={y} r={rad - 5} fill={playerColor(owner)} />
            : open
              ? <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={col} fontSize="8.5" fontWeight="700" transform={`rotate(${ang + 180} ${x} ${y})`}>{abbrev(a.name)}</text>
              : <circle cx={x} cy={y} r="2.5" fill={col} fillOpacity=".4" />}
          {flash.has(key) && <circle className="ping" cx={x} cy={y} r={rad} fill="none" stroke={playerColor(owner ?? 0)} />}
        </g>,
      );
    });
  });

  return (
    <div className="wheel-wrap">
      <div className="stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <svg viewBox="-26 -26 452 452" role="img" aria-label="Board">
          <circle cx={CX} cy={CY} r="200" fill="var(--table-2)" stroke="var(--rim)" strokeWidth="2" />
          <g transform={`rotate(${rot} ${CX} ${CY})`} className="wheel">{parts}</g>
          <path d={`M${CX - 9},${CY + 214} L${CX},${CY + 203} L${CX + 9},${CY + 214}Z`} fill="var(--ink)" opacity=".8" />
        </svg>
        <button type="button" className="spin l" aria-label="Spin left" onClick={() => nudge(-90)}>‹</button>
        <button type="button" className="spin r" aria-label="Spin right" onClick={() => nudge(90)}>›</button>
      </div>
      <div className="pointer">▲ facing you · drag, arrows or ← → to spin</div>
    </div>
  );
}
