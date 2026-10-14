// The board: a printed paper wheel of 4 quadrants (the Lamplit Table). Outer ring = round I, middle = round II,
// inner = round III. It still spins (drag, arrow keys, a sideways swipe), but everything on it stays upright and
// nothing else on screen changes with its orientation. Each space is a socket with its name and its effect in a
// few words (readable without hovering); a worker stands on it as a hooded figure with its seat's sigil; a rival's
// fresh placement wears a dashed ring. Each quadrant's contest sits on a rim plaque (rule, prize, leader), with the
// standings on hover/tap. Hover or focus (mouse) or a first tap (touch) shows a space's card; on touch, placing takes
// a second tap.
import { useEffect, useRef, useState, useCallback } from 'react';
import { quadrant, roman, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, seatSigil, standings } from '../format.js';
import { sigilPath, YoudGet, ContestTip, Sigil } from './Info.jsx';
import { sheetMode } from './parts.jsx';
import { realHover } from '../hover.js';
import { Rich } from './Rich.jsx';
import { shortEffect } from '../shorts.js';

// Discs sit toward the outer edge of their ring and names on a fixed radius along the inner edge, so a name
// never runs into its disc, the disc's glow or a recent-move ring at any board size.
const RING = { 1: { r0: 132, r1: 188, r: 160, n: 3 }, 2: { r0: 84, r1: 132, r: 108, n: 2 }, 3: { r0: 36, r1: 84, r: 60, n: 1 } };
const CX = 200, CY = 200, VB0 = -26, VBS = 452;
const qCenter = q => 180 + q * 90;
const norm = a => ((a % 360) + 540) % 360 - 180;
function polar(a, r) { const t = (a - 90) * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
function arc(a0, a1, r0, r1) {
  const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
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
export default function Wheel({ state, legal, onPick, onDenied, onTouched, confirmPlace = false, flash, late = false, caption = null, lastMove = null, recentMoves = [], spacePeek = null, onSpacePeek, meId = null, facing, onFacing }) {
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
  const boardPx = scale * VBS;

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
  // A space picked from the panel list opens here: one sheet for the same space, wherever you tapped it.
  useEffect(() => { if (spacePeek && spacePeek.key) setPeek({ key: spacePeek.key, pinned: true }); }, [spacePeek]);
  useEffect(() => {
    if (!peek || !peek.pinned || !sheetMode()) return;
    const t = setTimeout(() => {
      const el = stage.current && stage.current.querySelector(`[data-slot="${peek.key}"] .base`);
      const sheet = document.querySelector('.peek.as-sheet');
      if (!el || !sheet) return;
      const r = el.getBoundingClientRect(), top = sheet.getBoundingClientRect().top;
      if (r.bottom > top - 12) window.scrollBy({ top: r.bottom - top + 40, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(t);
  }, [peek]);
  // turning the board hides a hover card (it no longer sits over its space)
  const rotSeen = useRef(rot);
  useEffect(() => { if (Math.abs(rot - rotSeen.current) > 2) { rotSeen.current = rot; setPeek(p => (p && !p.pinned ? null : p)); } }, [rot]);
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
    drag.current = { a: p.a, x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch', start: rotRef.current, t: performance.now(), v: 0 };
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
      if (dr.touch) { dr.swipe = true; dr.lastX = e.clientX; return; }
      try { stage.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (dr.swipe) { dr.lastX = e.clientX; return; }
    const a = local(e).a;
    const d = norm(a - dr.a);
    dr.a = a;
    // angular speed (deg/ms), smoothed, so a quick flick can carry the wheel on to the next quadrant
    const now = performance.now(), dt = Math.max(1, now - dr.t);
    dr.v = 0.6 * (d / dt) + 0.4 * dr.v; dr.t = now;
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
    if (dr.swipe) { const dx = (e && e.type !== 'pointercancel' && e.clientX != null ? e.clientX : dr.lastX ?? dr.x) - dr.x; if (Math.abs(dx) > 24) nudge(dx > 0 ? -90 : 90); setTimeout(() => { moved.current = false; }, 0); return; }
    // a fling (fast and recent) steps one quadrant in its direction; a slow drag settles on the nearest
    const home = Math.round(dr.start / 90) * 90;
    let target = Math.round(rotRef.current / 90) * 90;
    if (Math.abs(dr.v) > 0.18 && performance.now() - dr.t < 120 && target === home) target = home + Math.sign(dr.v) * 90;
    animateTo(target);
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
    // touch pins the card (it's how you read a space); a mouse already sees it on hover
    setPeek(touch ? { key: s.key, pinned: true } : null);
    if (onDenied) onDenied({ type: 'slot', key: s.key, q: s.q, i: s.i }, el);
  };

  const paying = Math.max(1, state.round);
  const P = 100 / VBS; // viewBox units → % of the stage
  const at = (x, y) => ({ left: `${(x - VB0) * P}%`, top: `${(y - VB0) * P}%` });
  // where a point of the (unturned) wheel sits once it's turned: spaces and plaques stay upright, only places move
  const turned = (x0, y0) => {
    const r = (rot * Math.PI) / 180;
    return [CX + (x0 - CX) * Math.cos(r) - (y0 - CY) * Math.sin(r), CY + (x0 - CX) * Math.sin(r) + (y0 - CY) * Math.cos(r)];
  };

  // the printed paper wheel: quadrant inks, ring bands (closed rings carved and dim), seams, the dark hub
  const paper = [];
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q), a0 = c - 45, a1 = c + 45;
    const col = `var(--${qid})`;
    [1, 2, 3].forEach(t => {
      const R = RING[t], open = t <= round;
      paper.push(<path key={`b${q}${t}`} className={`band${open ? ' open' : ''}${t === paying ? ' pays' : ''}`} d={arc(a0, a1, R.r0, R.r1)} fill={col} fillOpacity={open ? (t === 1 ? 0.26 : 0.2) : 0.05} />);
    });
    paper.push(<path key={`rim${q}`} className="rim" d={arc(a0, a1, 188, 200)} fill={col} fillOpacity=".85" />);
  });
  for (const r of [188, RING[1].r0, RING[2].r0, RING[3].r0]) paper.push(<circle key={`c${r}`} cx={CX} cy={CY} r={r} fill="none" className="ring-line" />);
  state.quadrants.forEach((qid, q) => {
    const [x0, y0] = polar(qCenter(q) - 45, RING[3].r0), [x1, y1] = polar(qCenter(q) - 45, 200);
    paper.push(<line key={`seam${q}`} x1={x0} y1={y0} x2={x1} y2={y1} className="seam" />);
  });

  // spaces: a socket per space, upright wherever the wheel is turned, with its effect printed on it
  const sockets = spaces.map(s => {
    const { key, q, a, ring: t, qid } = s;
    const [X, Y] = turned(s.xy[0], s.xy[1]);
    const owner = state.slots[key];
    const open = t <= round;
    const opt = legal.get(key);
    const selected = peek && peek.key === key;
    const fresh = recentMoves.find(m => m.key === key && !m.mine && owner !== undefined);
    const newest = fresh && recentMoves.filter(m => !m.mine)[recentMoves.filter(m => !m.mine).length - 1] === fresh;
    const cls = ['slot', `r${t}`, opt ? 'can' : '', flash.has(key) ? 'flash' : '', selected ? 'sel' : '', open ? 'open' : 'locked', owner !== undefined ? 'taken' : '', fresh ? 'fresh' : '', newest ? 'newest' : ''].filter(Boolean).join(' ');
    const status = owner !== undefined ? `Taken by ${state.players[owner].name}${opt && String(opt).startsWith('squat:') ? ' (you can join it)' : ''}` : open ? 'Open' : `Opens in round ${roman(t)}`;
    return (
      <div
        key={key} className={cls} data-slot={key} data-option={opt || undefined} style={{ ...at(X, Y), '--c': `var(--${qid})` }}
        role="button" tabIndex={opt ? 0 : -1} aria-label={`${a.name}, ${quadrant(qid).name} round ${roman(t)}: ${a.text} ${status}.`}
        onClick={e => { if (Date.now() - touchTapped.current > 500) tap(s, e.currentTarget); }}
        onKeyDown={e => { if (opt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(opt); } }}
        onPointerEnter={e => { if (realHover(e)) setPeek(p => (p && p.pinned ? p : { key, pinned: false })); }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') setPeek(p => (p && !p.pinned && p.key === key ? null : p)); }}
        onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setPeek({ key, pinned: false }); }}
        onBlur={() => setPeek(p => (p && !p.pinned && p.key === key ? null : p))}
      >
        <span className="hit" aria-hidden="true" />
        <span className="base" aria-hidden="true" />
        {open && (
          <span className="face" aria-hidden="true">
            <span className="nm">{a.name}</span>
            <span className="yl" data-yield><Rich text={shortEffect(qid, a, round)} /></span>
          </span>
        )}
        {owner !== undefined && (
          <span className="worker-fig" data-seat={owner} title={`${state.players[owner].name}’s worker`}>
            <svg className="worker" viewBox="0 0 20 24" aria-hidden="true">
              <path d="M10 1.5c3.6 0 5.6 3 5.6 6.4 0 1.6-.5 2.9-1.2 3.9 2.6 1.5 4.3 5 4.3 10.7H1.3c0-5.7 1.7-9.2 4.3-10.7-.7-1-1.2-2.3-1.2-3.9 0-3.4 2-6.4 5.6-6.4z" fill={playerColor(owner)} stroke="rgba(30,20,12,.85)" strokeWidth="1.1" />
              <path className="sigil" d={sigilPath(seatSigil(owner), 10, 16.5, 3.4)} fill="rgba(30,20,12,.8)" />
            </svg>
          </span>
        )}
        {fresh && <span className="fresh-ring" aria-hidden="true" title={`${state.players[fresh.pid].name} took ${fresh.action}`} />}
      </div>
    );
  });

  // rim plaques: each quadrant's contest (its rule, the prize, who leads), upright; standings on hover/tap
  const stand = standings(state);
  const plaques = state.quadrants.map((qid, q) => {
    const [X, Y] = turned(...polar(qCenter(q), 196));
    // anchored on the rim and leaning outward, so a plaque never covers a space
    const ax = Math.max(-1, Math.min(1, (X - CX) / 120)), ay = Math.max(-1, Math.min(1, (Y - CY) / 120));
    const st = stand.find(x => x.qid === qid);
    const leaders = st ? st.leaders : [];
    return (
      <div key={`pl${qid}`} className="plaque" data-plaque={qid} style={{ ...at(X, Y), '--c': `var(--${qid})`, '--ax': ax.toFixed(2), '--ay': ay.toFixed(2) }}>
        <ContestTip state={state} qid={qid} meId={meId}>
          <i className="dot" aria-hidden="true" /><span className="r">{st ? st.rule : quadrant(qid).scoring.label}</span>
          <b className="num rw">+{RING_VALUE[paying - 1]}</b>
          <span className="ld">{leaders.length ? leaders.slice(0, 2).map(id => <Sigil key={id} id={id} size={12} />) : '—'}</span>
        </ContestTip>
      </div>
    );
  });

  // The peek card: full name, text and status of a space, near it on screen.
  let peekCard = null;
  if (peek) {
    const s = spaces.find(x => x.key === peek.key);
    if (s) {
      const [X, Y] = turned(s.xy[0], s.xy[1]);
      const owner = state.slots[s.key];
      const open = s.ring <= round;
      const opt = legal.get(s.key);
      const sr = stage.current ? stage.current.getBoundingClientRect() : null;
      const half = 120;
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
          <span><Rich text={s.a.text} /></span>
          {/* exactly what you'd get, from the engine's dry run (hover / tap layer) */}
          {open && (owner === undefined || opt) && !state.over && (meId != null || (legal.size && state.pending)) && (
            <YoudGet state={state} pid={meId != null ? meId : state.pending.player} q={s.q} i={s.i} />
          )}
          <em>
            {owner !== undefined ? <><i style={{ background: playerColor(owner) }} />Taken by {state.players[owner].name}{opt ? ' — you can join it (Squatter)' : ''}</>
              : open ? (opt ? 'Open — yours to take' : 'Open') : `Opens in round ${roman(s.ring)}`}
          </em>
          {opt && peek.pinned && (
            <button type="button" className="btn pri" data-place={opt} onClick={() => { setPeek(null); onPick(opt); }}>{String(opt).startsWith('squat:') ? 'Join here' : 'Place here'}</button>
          )}
          {peek.pinned && sheetMode() && <button type="button" className="btn ghost sheet-close" onClick={() => setPeek(null)}>Close</button>}
        </div>
      );
    }
  }

  return (
    <div className="wheel-wrap">
      <div className="stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ '--wheel-px': `${Math.round(boardPx)}px` }}>
        <svg viewBox="-26 -26 452 452" role="group" aria-label="Board" className={`paper${late ? ' late' : ''}`}>
          <defs>
            <radialGradient id="ltPaper" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="var(--paper)" /><stop offset=".8" stopColor="var(--paper-2)" /><stop offset="1" stopColor="var(--paper-3)" /></radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r="200" fill="url(#ltPaper)" className="disk" />
          <g transform={`rotate(${rot} ${CX} ${CY})`} className="wheel">{paper}</g>
          <circle cx={CX} cy={CY} r="199.5" fill="none" className="edge" />
          <circle cx={CX} cy={CY} r={RING[3].r0} className="hub" />
        </svg>
        <div className="hub-label" aria-label={`Round ${roman(round)}`}>
          <small>Round</small><b>{state.round ? roman(state.round) : '·'}</b>
          <span className="pips" aria-hidden="true">{[1, 2, 3].map(i => <i key={i} className={i <= state.round ? 'on' : ''} />)}</span>
        </div>
        {sockets}
        {plaques}
        {peek && peek.pinned && sheetMode() && <div className="sheet-backdrop" onPointerDown={e => { e.preventDefault(); e.stopPropagation(); setPeek(null); }} />}
        {peekCard}
        {caption && <div key={caption.n} className="caption" style={{ '--pc': playerColor(caption.pid) }} role="status"><i />{caption.text}</div>}
      </div>
    </div>
  );
}
