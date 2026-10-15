// The faces lab (?lab=faces&face=<name>[&states=lit,taken,locked][&box=0][&only=grid1|grid2|wheel]): one face (see
// src/v4/game/faces/index.js for the contract) drawn for every action of the classic table and of a second table
// holding the hard ones (copy: Echo; steal: Thieves; trade: Trading; Market), in each state, at the wheel's real
// on-screen size; then the live wheels in round III wearing that face. Built for 1270×700. Not part of the game.
// Shots: node scripts/v4-faces.mjs <face> <outDir>
import { useMemo } from 'react';
import '../app.css'; // the game's CSS in its one order
import { createGame, applyMove, chooseBotMove, quadrant, roman } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import Wheel from '../game/Wheel.jsx';
import { CLASSIC } from '../tables.js';
import { playerColor, seatEmoji } from '../format.js';
import { pipEffect } from '../shorts.js';
import { useFace, FaceBox, boxOf, faceNames, BUILT_IN } from '../game/faces/index.js';

export const HARD = ['echo', 'thieves', 'trading', 'market'];
const WHEEL_PX = 600; // the live wheels' width; the grid draws at the same scale
const VBS = 452;

/** Round III, seat 0 to place, the bots' minions down (the same play every load). */
function roundThree(quadrants, seed = 11) {
  const seats = [{ name: 'You', kind: 'human' }, { name: 'Wren', kind: 'bot' }, { name: 'Ossian', kind: 'bot' }, { name: 'Ilse', kind: 'bot' }];
  for (let sd = seed; sd < seed + 40; sd++) {
    const rand = seededRandom(sd);
    let s = createGame({ seats, seed: sd, quadrants });
    for (let k = 0; k < 6000 && !s.over; k++) {
      if (s.round === 3 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && Object.keys(s.slots).length >= 4) return s;
      if (s.round > 3) break;
      s = applyMove(s, chooseBotMove(s, rand));
    }
  }
  return null;
}

function LiveWheel({ quadrants, face }) {
  const state = useMemo(() => roundThree(quadrants), [quadrants.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!state) return <p className="fl-note">No round III state for {quadrants.join(', ')}.</p>;
  const legal = new Map((state.pending.options || []).filter(o => o.kind === 'slot' && o.q != null).map(o => [`${o.q}-${o.i}`, o.id]));
  // the last two rival placements read as fresh
  const rivals = Object.entries(state.slots).filter(([, pid]) => pid !== 0).slice(-2);
  const recentMoves = rivals.map(([key, pid]) => { const [q, i] = key.split('-').map(Number); return { key, pid, mine: false, action: quadrant(state.quadrants[q]).actions[i].name }; });
  return (
    <div className="lt-wheel fl-wheel" style={{ width: WHEEL_PX, height: WHEEL_PX, containerType: 'size' }}>
      <Wheel state={state} legal={legal} onPick={() => {}} flash={new Set()} facing={0} onFacing={() => {}} meId={0} recentMoves={recentMoves} look={face} />
    </div>
  );
}

const MINION_STATE = (() => { try { return createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Wren', kind: 'bot' }, { name: 'Ossian', kind: 'bot' }], seed: 3 }); } catch { return null; } })();
const minionOf = pid => ({ emoji: seatEmoji(MINION_STATE, pid), pid, fresh: false, color: playerColor(pid), name: MINION_STATE ? MINION_STATE.players[pid].name : `P${pid + 1}` });

function Tile({ Face, face, q, action, status, scale, cellW, cellH, showBox }) {
  const ring = action.ring;
  const [w, h] = boxOf(Face, ring);
  const round = 3;
  const minions = status === 'taken' ? [minionOf(1)] : status === 'fresh' ? [{ ...minionOf(2), fresh: true }] : [];
  const cls = ['slot', `r${ring}`, status === 'lit' ? 'can lit' : '', status === 'locked' ? 'locked' : 'open', status === 'taken' || status === 'fresh' ? 'taken' : '', status === 'fresh' ? 'fresh newest' : ''].filter(Boolean).join(' ');
  return (
    <div className="fl-tile" style={{ width: cellW, height: cellH }} data-tile={`${q}.${action.key}.${status}`} title={`${quadrant(q).name} · ${action.name} · ${status}`}>
      <div className="stage" style={{ position: 'absolute', inset: 0, '--wheel-px': `${WHEEL_PX}px`, '--px': (1 / scale).toFixed(4) }}>
        {showBox && <div className="fl-box" style={{ width: w * scale, height: h * scale }} />}
        <div className={cls} style={{ left: '50%', top: '50%', width: w * scale, height: h * scale, aspectRatio: 'auto', '--c': `var(--${q})` }}>
          {Face && <FaceBox Face={Face} q={q} action={action} ring={ring} round={round} name={action.name} effect={pipEffect(q, action, round)}
            status={status} minions={minions} onPick={status === 'lit' ? () => {} : null} px={1 / scale} color={`var(--${q})`} angle={0} flash={false} selected={false} />}
        </div>
      </div>
    </div>
  );
}

function Grid({ id, title, quadrants, Face, face, states, scale, showBox }) {
  const cellW = Math.ceil(Math.max(...[1, 2, 3].map(r => boxOf(Face, r)[0])) * scale) + 10;
  const cellH = Math.ceil(Math.max(...[1, 2, 3].map(r => boxOf(Face, r)[1])) * scale) + 12;
  return (
    <section className="fl-grid" id={id} data-shot={id} data-spaces={face} data-face={face}>
      <h2>{title} <small>{states.join(' · ')} — round III yields, {scale.toFixed(2)} px per board unit</small></h2>
      <div className="fl-quads" style={{ gridTemplateColumns: `repeat(${quadrants.length}, auto)` }}>
        {quadrants.map(q => (
          <div key={q} className="fl-quad" style={{ '--c': `var(--${q})` }}>
            <h3>{quadrant(q).name}</h3>
            {[...quadrant(q).actions].sort((a, b) => a.ring - b.ring).map(a => (
              <div key={a.key} className="fl-row">
                <span className="fl-lab">{roman(a.ring)}</span>
                {states.map(st => <Tile key={st} Face={Face} face={face} q={q} action={a} status={st} scale={scale} cellW={cellW} cellH={cellH} showBox={showBox} />)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

const CSS = `
.lab-faces{min-height:100dvh;padding:10px 14px 40px;color:var(--cream,#ece6d6);font-family:var(--sans)}
.lab-faces header{display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;margin-bottom:8px}
.lab-faces header h1{margin:0;font-size:18px}
.lab-faces header a{color:inherit;opacity:.7;font-size:13px}
.lab-faces header a.on{opacity:1;font-weight:800;text-decoration:none;border-bottom:2px solid currentColor}
.lab-faces h2{margin:14px 0 6px;font-size:15px}
.lab-faces h2 small{font-weight:400;opacity:.65;font-size:12px;margin-left:8px}
.fl-quads{display:grid;gap:10px;justify-content:start}
.fl-quad{padding:6px 8px 8px;border-radius:10px;background:radial-gradient(circle at 50% 40%,var(--paper,#f4ebd7),var(--paper-2,#e9dcc0));box-shadow:inset 0 0 0 3px color-mix(in srgb,var(--c) 70%,transparent)}
.fl-quad h3{margin:0 0 2px;font-size:12px;color:var(--paper-ink,#2a1f17);text-transform:uppercase;letter-spacing:.08em}
.fl-row{display:flex;align-items:center;gap:2px}
.fl-lab{width:20px;font:700 11px var(--serif);color:var(--paper-ink-2,#6e5a40);text-align:center}
.fl-tile{position:relative}
.fl-tile .stage .slot{position:absolute}
.fl-box{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);outline:1px dashed rgba(42,31,23,.25);pointer-events:none}
.fl-wheels{display:flex;gap:24px;flex-wrap:wrap}
.fl-wheels figure{margin:0}
.fl-wheels figcaption{font-size:12px;opacity:.7;margin-bottom:4px}
.fl-note{opacity:.75}
`;

export default function FacesLab() {
  const p = new URLSearchParams(location.search);
  const face = p.get('face') || 'sockets';
  const states = (p.get('states') || 'lit,taken,locked').split(',').filter(Boolean);
  const showBox = p.get('box') !== '0';
  const only = p.get('only');
  const builtIn = BUILT_IN.includes(face);
  const Face = useFace(builtIn ? null : face);
  const scale = WHEEL_PX / VBS;
  const names = faceNames();
  const ready = builtIn || !!Face;
  const show = id => !only || only === id;
  return (
    <div className="app game lt lab-faces" data-phase="place" data-yours="1" data-faces-ready={ready ? '1' : undefined}>
      <style>{CSS}</style>
      <header>
        <h1>Faces lab: {face}</h1>
        {names.map(n => <a key={n} className={n === face ? 'on' : ''} href={`?lab=faces&face=${n}`}>{n}</a>)}
      </header>
      {!names.includes(face) && <p className="fl-note">No face called “{face}”. Add src/v4/game/faces/{face}.jsx (contract: src/v4/game/faces/index.js).</p>}
      {builtIn && <p className="fl-note">“{face}” is drawn by the Wheel itself: the grid needs a face from src/v4/game/faces/; the wheels below show it.</p>}
      {!builtIn && Face && show('grid1') && <Grid id="grid1" title={`Classic table: ${CLASSIC.map(q => quadrant(q).name).join(' · ')}`} quadrants={CLASSIC} Face={Face} face={face} states={states} scale={scale} showBox={showBox} />}
      {!builtIn && Face && show('grid2') && <Grid id="grid2" title={`The hard ones: ${HARD.map(q => quadrant(q).name).join(' · ')}`} quadrants={HARD} Face={Face} face={face} states={states} scale={scale} showBox={showBox} />}
      {show('wheel') && (
        <section id="wheel" data-shot="wheel">
          <h2>Round III, your placement <small>lit = yours to take; the last two rival moves read as fresh</small></h2>
          <div className="fl-wheels">
            <figure><figcaption>Classic</figcaption><LiveWheel quadrants={CLASSIC} face={face} /></figure>
            <figure><figcaption>The hard ones</figcaption><LiveWheel quadrants={HARD} face={face} /></figure>
          </div>
        </section>
      )}
    </div>
  );
}
