// The board: a spinning wheel of 4 quadrants. Outer ring = round I, inner = round II, center = round III.
// Every space carries its full action name, curved along the ring and always upright. Hover or focus (mouse)
// or a first tap (touch) shows a card with the action's text; on touch, placing takes a second tap.
import { useEffect, useRef, useState, useCallback } from 'react';
import { quadrant, roman } from '../../engine/v4/index.js';
import { playerColor, standings, shortLabel, tiebreakNote } from '../format.js';
import { RING_VALUE } from '../../engine/v4/index.js';
import { sheetMode } from './parts.jsx';

const RING = { 1: { r0: 142, r1: 198, r: 170, n: 3 }, 2: { r0: 90, r1: 142, r: 116, n: 2 }, 3: { r0: 34, r1: 90, r: 62, n: 1 } };
const LABEL = { 1: { r: 147.5, h: 16, f: 9.2 }, 2: { r: 95, h: 22, f: 8.6 }, 3: { r: 40.5, h: 44, f: 8.6 } }; // name arcs, toward the center
const CX = 200, CY = 200, VB0 = -26, VBS = 452;
const qCenter = q => 180 + q * 90;
const norm = a => ((a % 360) + 540) % 360 - 180;
function polar(a, r) { const t = (a - 90) * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
function arc(a0, a1, r0, r1) {
  const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
}
/** An arc for text that reads upright wherever it sits once the wheel is turned by `rot`. */
function textArc(center, half, r, rot) {
  const top = Math.abs(norm(center + rot)) < 90;
  const [ax, ay] = polar(top ? center - half : center + half, r);
  const [bx, by] = polar(top ? center + half : center - half, r);
  return `M${ax},${ay} A${r},${r} 0 0 ${top ? 1 : 0} ${bx},${by}`;
}
export const facingOf = (rot, count) => {
  let best = 0, bd = 1e9;
  for (let q = 0; q < count; q++) { const d = Math.abs(norm(qCenter(q) + rot - 180)); if (d < bd) { bd = d; best = q; } }
  return best;
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Where each space sits on the (unturned) wheel. */
export function spaceGeometry(state) {
  const out = [];
  state.quadrants.forEach((qid, q) => {
    const Q = quadrant(qid);
    Q.actions.forEach((a, i) => {
      const t = a.ring, R = RING[t];
      const idx = Q.actions.filter((x, j) => x.ring === t && j < i).length;
      const span = t === 1 ? 66 : t === 2 ? 44 : 0;
      const c = qCenter(q);
      const ang = R.n === 1 ? c : (c + span / 2) - idx * (span / (R.n - 1));
      out.push({ key: `${q}-${i}`, q, i, qid, a, ring: t, ang, xy: polar(ang, R.r) });
    });
  });
  return out;
}

/**
 * @param {{ state:any, legal:Map<string,string>, onPick:(id:string)=>void, onDenied?:(info:object, el:Element)=>void,
 *   flash:Set<string>, late?:boolean, facing:number, onFacing:(q:number)=>void }} props
 */
export default function Wheel({ state, legal, onPick, onDenied, onTouched, confirmPlace = false, flash, late = false, caption = null, lastMove = null, meId = null, facing, onFacing }) {
  const [rot, setRot] = useState(() => -90 * facing);
  const [peek, setPeek] = useState(null); // { key, pinned }
  const rotRef = useRef(rot);
  const anim = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const lastPointer = useRef('mouse');
  const stage = useRef(null);
  const nq = state.quadrants.length;
  // On-screen scale of the board, so text is sized in real pixels: never under 10px, hidden if it can't fit.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    const measure = () => { const w = el.getBoundingClientRect().width; if (w) setScale(w / VBS); };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const nameUnits = 10.4 / scale;
  const showNames = nameUnits <= 11.2;

  const applyRot = useCallback(r => {
    rotRef.current = r;
    setRot(r);
    onFacing(facingOf(r, nq));
  }, [nq, onFacing]);

  const stop = () => { if (anim.current) cancelAnimationFrame(anim.current); anim.current = null; };
  const animateTo = useCallback(to => {
    stop();
    const from = rotRef.current, t0 = performance.now(), dur = reduced() ? 1 : 420;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      applyRot(from + (to - from) * e);
      anim.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim.current = requestAnimationFrame(step);
  }, [applyRot]);
  const touched = useRef(onTouched);
  touched.current = onTouched;
  const nudge = useCallback(deg => { if (touched.current) touched.current(); animateTo(Math.round((rotRef.current + deg) / 90) * 90); }, [animateTo]);

  // Parent asked to face a quadrant (a tab, or a rival's move): spin there the short way.
  useEffect(() => {
    if (anim.current || drag.current) return;
    if (facingOf(rotRef.current, nq) !== facing) animateTo(rotRef.current + norm(-90 * facing - rotRef.current));
  }, [facing, nq, animateTo]);

  useEffect(() => {
    const onKey = e => {
      const t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable],[role="tablist"],[role="dialog"]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-90); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(90); }
      if (e.key === 'Escape') setPeek(null);
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); stop(); };
  }, [nudge]);

  // A pinned peek (touch) closes on any tap elsewhere.
  useEffect(() => {
    if (!peek || !peek.pinned) return undefined;
    const close = e => { if (!e.target.closest || !e.target.closest('.peek, .slot')) setPeek(null); };
    addEventListener('pointerdown', close);
    return () => removeEventListener('pointerdown', close);
  }, [peek]);
  // A new decision clears a stale selection.
  useEffect(() => { setPeek(null); }, [state]);

  const local = e => {
    const b = stage.current.getBoundingClientRect();
    const x = VB0 + (e.clientX - b.left) / b.width * VBS, y = VB0 + (e.clientY - b.top) / b.height * VBS;
    return { x, y, a: Math.atan2(y - CY, x - CX) * 180 / Math.PI, d: Math.hypot(x - CX, y - CY) };
  };
  const onDown = e => {
    lastPointer.current = e.pointerType || 'mouse';
    if (onTouched) onTouched();
    if (e.target.closest('button')) return;
    const p = local(e);
    if (p.d > 205 || p.d < 30) return; // only drags that start on the ring
    stop();
    drag.current = { a: p.a, x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
    moved.current = false;
  };
  const onMove = e => {
    const dr = drag.current;
    if (!dr) return;
    if (!moved.current) {
      const dx = Math.abs(e.clientX - dr.x), dy = Math.abs(e.clientY - dr.y);
      if (Math.max(dx, dy) < 6) return;
      // on touch, a mostly-vertical swipe is a page scroll, not a spin; a sideways swipe turns one notch on release
      if (dr.touch && dy > dx) { drag.current = null; return; }
      moved.current = true;
      if (dr.touch) { dr.swipe = true; return; }
      try { stage.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (dr.swipe) { dr.lastX = e.clientX; return; }
    const a = local(e).a;
    const d = norm(a - dr.a);
    dr.a = a;
    applyRot(rotRef.current + d);
  };
  const onUp = e => {
    if (e && e.pointerType === 'touch' && !moved.current && drag.current) {
      const p = local(e);
      const r = (rotRef.current * Math.PI) / 180;
      // undo the wheel's rotation, then take the nearest space within reach
      const ux = CX + (p.x - CX) * Math.cos(-r) - (p.y - CY) * Math.sin(-r);
      const uy = CY + (p.x - CX) * Math.sin(-r) + (p.y - CY) * Math.cos(-r);
      let best = null, bd = 1e9;
      for (const sp of spaceGeometry(state)) { const d = Math.hypot(sp.xy[0] - ux, sp.xy[1] - uy); if (d < bd) { bd = d; best = sp; } }
      drag.current = null;
      if (best && bd < 44) { e.preventDefault(); touchTapped.current = Date.now(); tap(best, stage.current.querySelector(`[data-slot="${best.key}"]`)); }
      return;
    }
    if (!drag.current) return;
    const dr = drag.current;
    drag.current = null;
    if (!moved.current) return;
    // swipe right moves the facing quadrant right (the wheel turns counter-clockwise), and the other way round
    if (dr.swipe) { const dx = (dr.lastX ?? dr.x) - dr.x; if (Math.abs(dx) > 24) nudge(dx > 0 ? -90 : 90); setTimeout(() => { moved.current = false; }, 0); return; }
    animateTo(Math.round(rotRef.current / 90) * 90);
    setTimeout(() => { moved.current = false; }, 0);
  };

  const round = Math.max(1, state.round);
  const spaces = spaceGeometry(state);

  const touchTapped = useRef(0);
  const tap = (s, el) => {
    if (moved.current) return;
    const opt = legal.get(s.key);
    const touch = confirmPlace || lastPointer.current === 'touch';
    if (opt && !touch) { setPeek(null); onPick(opt); return; }
    if (opt && touch) {
      if (peek && peek.key === s.key && peek.pinned) { setPeek(null); onPick(opt); return; }
      setPeek({ key: s.key, pinned: true });
      return;
    }
    setPeek({ key: s.key, pinned: true });
    if (onDenied) onDenied({ type: 'slot', key: s.key, q: s.q, i: s.i }, el);
  };

  const parts = [];
  const paying = Math.max(1, state.round);
  // The hub belongs to the round-III spaces: each quadrant's color runs into it, so it doesn't read as a space.
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q);
    const [hx0, hy0] = polar(c - 44, 33), [hx1, hy1] = polar(c + 44, 33);
    parts.push(<path key={`hub${q}`} className="hub" d={`M${CX},${CY} L${hx0},${hy0} A33,33 0 0 1 ${hx1},${hy1} Z`} fill={`var(--${qid})`} fillOpacity={paying === 3 ? 0.3 : 0.12} />);
  });
  parts.push(<circle key="hubdot" className="hub" cx={CX} cy={CY} r="6" fill="var(--table-2)" stroke="var(--rim)" />);
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q), a0 = c - 45, a1 = c + 45, isFacing = q === facing;
    const col = `var(--${qid})`;
    [1, 2, 3].forEach(t => {
      const R = RING[t], open = t <= round;
      const pays = t === paying;
      parts.push(
        <g key={`ring${q}${t}`} className={`ring${pays ? ' pays' : ''}`}>
          <path d={arc(a0 + 0.8, a1 - 0.8, R.r0 + 1, R.r1 - 1)} fill={col} fillOpacity={open ? (isFacing ? 0.26 : 0.12) : 0.04} stroke={col} strokeOpacity={open ? 0.55 : 0.18} />
          {pays && <path d={arc(a0 + 1.6, a1 - 1.6, R.r1 - 6, R.r1 - 1.6)} fill={col} fillOpacity={0.35} />}
        </g>,
      );
    });
  });
  for (const s of spaces) {
    const { key, q, a, ring: t, ang, qid } = s;
    const [x, y] = s.xy;
    const col = `var(--${qid})`;
    const owner = state.slots[key];
    const open = t <= round;
    const rad = t === 3 ? 15 : 16;
    const opt = legal.get(key);
    const selected = peek && peek.key === key;
    const cls = ['slot', opt ? 'can' : '', flash.has(key) ? 'flash' : '', selected ? 'sel' : '', open ? '' : 'locked'].join(' ');
    const status = owner !== undefined ? `Taken by ${state.players[owner].name}` : open ? 'Open' : `Opens in round ${roman(t)}`;
    const L = LABEL[t];
    const lid = `n${key}`;
    parts.push(
      <g
        key={`s${key}`} className={cls} data-slot={key} data-option={opt || undefined}
        role="button" tabIndex={opt ? 0 : -1} aria-label={`${a.name}, ${quadrant(qid).name} round ${roman(t)}: ${a.text} ${status}.`}
        onClick={e => { if (Date.now() - touchTapped.current > 500) tap(s, e.currentTarget); }}
        onKeyDown={e => { if (opt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(opt); } }}
        onPointerEnter={e => { if (e.pointerType === 'mouse') setPeek(p => (p && p.pinned ? p : { key, pinned: false })); }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') setPeek(p => (p && !p.pinned && p.key === key ? null : p)); }}
        onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setPeek({ key, pinned: false }); }}
        onBlur={() => setPeek(p => (p && !p.pinned && p.key === key ? null : p))}
      >
        <circle className="hit" cx={x} cy={y} r={t === 3 ? 30 : t === 2 ? 28 : 26} fill="transparent" />
        {opt && <circle className="halo" cx={x} cy={y} r={rad + 4} fill="none" stroke={col} />}
        <circle className="base" cx={x} cy={y} r={rad} fill="var(--table)" stroke={col} strokeOpacity={open ? 1 : 0.3} strokeWidth={opt || selected ? 2.5 : 1.5} />
        {owner !== undefined
          ? <circle className="worker" cx={x} cy={y} r={rad - 5} fill={playerColor(owner)} />
          : open ? <circle cx={x} cy={y} r="3" fill={col} fillOpacity=".55" /> : <circle cx={x} cy={y} r="2.5" fill={col} fillOpacity=".3" />}
        {flash.has(key) && <circle className="ping" cx={x} cy={y} r={rad} fill="none" stroke={playerColor(owner ?? 0)} />}
        <path id={lid} d={textArc(ang, L.h, L.r, rot)} fill="none" />
        {showNames && (
          <text className="name" fontSize={nameUnits} fontWeight="700" fill={col} fillOpacity={open ? 1 : 0.45} dominantBaseline="central">
            <textPath href={`#${lid}`} startOffset="50%" textAnchor="middle">{a.name}</textPath>
          </text>
        )}
      </g>,
    );
  }

  // The latest rival move stays marked (a ring and a rim arrow in their color) until the next one.
  if (lastMove && state.slots[lastMove.key] !== undefined) {
    const sp = spaces.find(x => x.key === lastMove.key);
    if (sp) {
      const [x, y] = sp.xy;
      const pc = playerColor(lastMove.pid);
      const [ax, ay] = polar(sp.ang, 203), [bx, by] = polar(sp.ang - 3.2, 214), [cx2, cy2] = polar(sp.ang + 3.2, 214);
      parts.push(
        <g key={`last${lastMove.key}${lastMove.n}`} className="lastmove" aria-hidden="true">
          <title>{`Last move by ${state.players[lastMove.pid].name}`}</title>
          <circle cx={x} cy={y} r={(sp.ring === 3 ? 15 : 16) + 5} fill="none" stroke={pc} strokeWidth="2.6" />
          <circle cx={x} cy={y} r={(sp.ring === 3 ? 15 : 16) + 8} fill="none" stroke="var(--table)" strokeWidth="1.5" />
          <path d={`M${ax},${ay} L${bx},${by} L${cx2},${cy2}Z`} fill={pc} />
        </g>,
      );
    }
  }

  // The peek card: full name, text and status of a space, near it on screen.
  let peekCard = null;
  if (peek) {
    const s = spaces.find(x => x.key === peek.key);
    if (s) {
      const r = (rot * Math.PI) / 180;
      const [x0, y0] = s.xy;
      const X = CX + (x0 - CX) * Math.cos(r) - (y0 - CY) * Math.sin(r);
      const Y = CY + (x0 - CX) * Math.sin(r) + (y0 - CY) * Math.cos(r);
      const owner = state.slots[s.key];
      const open = s.ring <= round;
      const opt = legal.get(s.key);
      const sr = stage.current ? stage.current.getBoundingClientRect() : null;
      const half = 105;
      let leftPx = sr ? ((X - VB0) / VBS) * sr.width : 0;
      if (sr) leftPx = Math.max(12 + half - sr.left, Math.min(innerWidth - 12 - half - sr.left, leftPx));
      const left = sr ? null : ((X - VB0) / VBS) * 100;
      const top = ((Y - VB0) / VBS) * 100;
      const below = Y < CY;
      peekCard = (
        <div
          className={`peek${below ? ' below' : ''}${peek.pinned ? ' pinned' : ''}${peek.pinned && sheetMode() ? ' as-sheet' : ''}`}
          style={peek.pinned && sheetMode() ? { '--c': `var(--${s.qid})` } : { left: left == null ? `${leftPx}px` : `${left}%`, top: `${top}%`, '--c': `var(--${s.qid})` }}
          role={peek.pinned ? 'dialog' : 'tooltip'}
        >
          <b>{s.a.name}</b>
          <small>{quadrant(s.qid).name} · round {roman(s.ring)}</small>
          <span>{s.a.text}</span>
          <em>
            {owner !== undefined ? <><i style={{ background: playerColor(owner) }} />Taken by {state.players[owner].name}</>
              : open ? (opt ? 'Open — yours to take' : 'Open') : `Opens in round ${roman(s.ring)}`}
          </em>
          {opt && peek.pinned && (
            <button type="button" className="btn pri" data-place={opt} onClick={() => { setPeek(null); onPick(opt); }}>Place here</button>
          )}
        </div>
      );
    }
  }

  return (
    <div className="wheel-wrap">
      {state.round >= 1 && !state.over && (
        <div className="contests" aria-label={`Contests this round, +${RING_VALUE[paying - 1]} each`}>
          {standings(state).map(st => {
            const leaders = st.rows.filter(r => st.leaders.includes(r.id));
            const me = meId != null ? st.rows.find(r => r.id === meId) : null;
            const nm = r => (r.id === meId ? 'you' : state.players[r.id].name);
            return (
              <span key={st.qid} className="contest" style={{ '--c': `var(--${st.qid})` }} title={`${st.label}: +${RING_VALUE[paying - 1]} at round end`}>
                <i />{shortLabel(st.label).replace(/^Most /, '')} <b className="num">+{RING_VALUE[paying - 1]}</b>
                <span className="who">
                  {st.top > 0 ? leaders.map((r, k) => <span key={r.id}>{k ? ' & ' : ' '}{nm(r)} <b className="num">{r.shown}</b>{tiebreakNote(st, r) ? <small> ({tiebreakNote(st, r)})</small> : null}</span>) : ' nobody yet'}
                  {me && st.top > 0 && !st.leaders.includes(me.id) ? <span className="mine"> · you {me.shown}</span> : null}
                </span>
              </span>
            );
          })}
        </div>
      )}
      <div className="stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <svg viewBox="-26 -26 452 452" role="group" aria-label="Board" className={late ? 'late' : undefined}>
          <circle cx={CX} cy={CY} r="200" fill="var(--table-2)" stroke="var(--rim)" strokeWidth="2" />
          <g transform={`rotate(${rot} ${CX} ${CY})`} className="wheel">{parts}</g>
          <path d={`M${CX - 9},${CY + 214} L${CX},${CY + 203} L${CX + 9},${CY + 214}Z`} fill="var(--ink)" opacity=".8" />
        </svg>
        {peekCard}
        {caption && <div key={caption.n} className="caption" style={{ '--pc': playerColor(caption.pid) }} role="status"><i />{caption.text}</div>}
        <button type="button" className="spin l" aria-label="Turn the board left" title="Turn the board left" onClick={() => nudge(-90)}>‹</button>
        <button type="button" className="spin r" aria-label="Turn the board right" title="Turn the board right" onClick={() => nudge(90)}>›</button>
      </div>
      {lastMove && state.slots[lastMove.key] !== undefined && (
        <div className="lm-legend" style={{ '--pc': playerColor(lastMove.pid) }}>
          <i aria-hidden="true" />Ring and rim arrow: last move by {state.players[lastMove.pid].name}
          {(() => { const sp = spaces.find(x => x.key === lastMove.key); return sp ? ` (${sp.a.name})` : ''; })()}
        </div>
      )}
      <div className="pointer">▲ facing you<span className="kbd-hint"> · drag, arrows or ← → to spin</span><span className="touch-hint"> · swipe sideways to spin</span></div>
    </div>
  );
}
