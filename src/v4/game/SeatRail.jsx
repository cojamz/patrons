// The seat rail: the scoreboard in this round's turn order. Each seat: its leader (the player's emoji), name, followers, minions
// left, the space it took last, and a mini crowd of its members in their sphere colors. The seat whose turn it is
// is lit. Hover (or tap) a seat for its card: resources, members, last three moves (HoverCards SeatCard).
import { followers, quadrant, cardDef } from '../../engine/v4/index.js';
import { playerColor } from '../format.js';
import { realHover } from '../hover.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { cardColor } from './Info.jsx';
import { LeaderRing, FollowerGlyph } from './Glyphs.jsx';
import { seatOrder, railInfo, lastSpace } from './seats.js';
import './lamp-b.css';

const CROWD = 10; // member figures shown per seat before "+N"

export default function SeatRail({ state, me = null, mySeats = [], hover = null }) {
  const order = seatOrder(state);
  const rail = railInfo(state);
  const now = state.over ? null : rail.current ?? (state.pending ? state.pending.player : null);
  return (
    <nav className="lt-rail-seats" aria-label="Seats, in this round's turn order">
      {order.map((pid, k) => {
        const p = state.players[pid];
        const f = followers(state, p);
        const last = lastSpace(state, pid);
        const crowd = p.members.slice(0, CROWD);
        const you = mySeats.length === 1 ? mySeats[0] === pid : me === pid;
        return (
          <span key={pid} className="lt-seat-wrap">
            {k > 0 && <span className="arrow" aria-hidden="true">◂</span>}
            <span
              className={`lt-seat${now === pid ? ' now' : ''}${you ? ' you' : ''}`} data-seat={pid} role="button" tabIndex={0} aria-haspopup="dialog"
              style={{ '--pc': playerColor(pid) }} title={`${p.name}: ${f} followers, ${p.left} minion${p.left === 1 ? '' : 's'} left${now === pid ? ' — their turn' : ''}`}
              aria-label={`${you ? 'You' : p.name}, ${f} followers, ${p.left} minions left${now === pid ? ', to play' : ''}. Show their seat.`}
              onPointerEnter={e => { if (hover && realHover(e)) hover.onSeatHover(pid, e.currentTarget); }}
              onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onSeatHover(pid, null); }}
              onClick={e => hover && hover.onSeatHover(pid, e.currentTarget, { pinned: true })}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && hover) { e.preventDefault(); hover.onSeatHover(pid, e.currentTarget, { pinned: true }); } }}
            >
              <LeaderRing state={state} id={pid} size={32} minion={12} compact />
              <span className="who">{you ? 'You' : p.name}
                <small>{last ? <>last: <Sprite id={spriteId(last.name)} kind="action" sphere={quadrant(last.qid).resource} size={12} title={last.name} /></> : p.kind === 'bot' ? 'bot' : ' '}</small>
              </span>
              <span className="score"><b className="num">{f}</b><FollowerGlyph size={14} title={`${f} followers`} /></span>
              {crowd.length > 0 && (
                <span className="crowd" aria-hidden="true">
                  {crowd.map(u => <i key={u} style={{ background: cardColor(state, cardDef(state, u)) }} />)}
                  {p.members.length > CROWD && <small>+{p.members.length - CROWD}</small>}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
