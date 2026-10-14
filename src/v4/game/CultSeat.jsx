// A cult at the table (Cory's layout revision, 2026-10-14): every player's cult sits at a corner of the wheel like
// a chair at a table. Its leader (the player's emoji) with the minions still to place floating around it, its
// members as a small crowd of figures, its follower mark and total, and its resources as small stacks. Yours sits
// nearest you and is a little larger, with Use/switch on members you can use now. Hover or tap the cult for its
// card (resources, members, last moves); hover or tap a member for that member's card.
import { followers, quadrant } from '../../engine/v4/index.js';
import { memberChips, playerColor } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { Follower } from '../art/Follower.jsx';
import { realHover } from '../hover.js';
import { Tip, MemberCard, cardColor, onTable } from './Info.jsx';
import { ResourceGlyph, FollowerMark, LeaderRing } from './Glyphs.jsx';
import { lastSpace } from './seats.js';
import './lamp-b.css';

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/**
 * props: state, pid (whose cult), me (the viewer), mine (it's the viewer's own cult: larger, with Use buttons),
 * now (their turn), react (recent reactions: { leader: 'gesture'|'celebrate'|'scheme', members: { defId: n } }),
 * hover (useHoverCards), optionFor/onPick (your members' Use / switch).
 */
export default function CultSeat({ state, pid, me = null, mine = false, now = false, react = null, hover = null, optionFor = () => null, onPick = () => {} }) {
  const p = state.players[pid];
  const f = followers(state, p);
  const groups = memberChips(state, p);
  const last = lastSpace(state, pid);
  const MAX = mine ? 14 : 8; // member figures shown before "+N"
  const shown = groups.slice(0, MAX);
  const rest = groups.slice(MAX).reduce((s, g) => s + g.count, 0);
  const openSeat = (e, pinned) => hover && hover.onSeatHover(pid, e.currentTarget, { pinned });
  return (
    <section className={`lt-cult-seat${mine ? ' mine' : ''}${now ? ' now' : ''}`} data-cult={pid} data-seat={pid} style={{ '--pc': playerColor(pid) }}
      aria-label={`${mine ? 'Your cult' : `${p.name}'s cult`}: ${f} followers, ${p.members.length} members, ${p.left} minions to place${now ? ', their turn' : ''}`}>
      <header className="cs-head" role="button" tabIndex={0} aria-haspopup="dialog" title={`${p.name}: ${f} followers. Show their cult.`}
        onPointerEnter={e => { if (realHover(e)) openSeat(e, false); }}
        onPointerLeave={e => { if (e.pointerType === 'mouse' && hover) hover.onSeatHover(pid, null); }}
        onClick={e => openSeat(e, true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSeat(e, true); } }}>
        <span className={`cs-leader${react && react.leader ? ` react-${react.leader}` : ''}`}><LeaderRing state={state} id={pid} size={32} minion={16} /></span>
        <span className="cs-who">
          <b>{mine ? 'You' : p.name}</b>
          <small>{last ? <>last: <Sprite id={[`${last.qid}.${actionKey(last)}`, spriteId(last.name)]} kind="action" sphere={quadrant(last.qid).resource} size={12} title={last.name} /></> : p.kind === 'bot' ? 'bot' : ' '}</small>
        </span>
        <span className="cs-total" title={`${f} followers`}><b className="num">{f}</b><Follower size={mine ? 14 : 12} title={`${f} followers`} /></span>
      </header>
      <div className="cs-crowd" role="group" aria-label={`${mine ? 'Your' : `${p.name}'s`} members`}>
        {shown.map(g => {
          const d = g.def;
          const use = mine ? g.uids.map(u => optionFor(`use:${u}`)).find(Boolean) : null;
          const toggle = mine ? g.uids.map(u => optionFor(`toggle:${u}`)).find(Boolean) : null;
          const hop = react && react.members && react.members[d.id];
          return (
            <span key={g.key} className={`cs-member${g.card.used ? ' used' : ''}${hop ? ' react-hop' : ''}`} data-member={d.id} data-react={hop || undefined} style={{ '--q': cardColor(state, d), '--ph': phase(g.uids[0]) }}>
              <Tip className="fig" label={`${d.name}: show the card`} content={() => <MemberCard state={state} uid={g.uids[0]} />}>
                <Sprite id={[d.id, spriteId(d.name)]} kind="member" sphere={sphereOf(state, d)} size={24} />
                {g.count > 1 && <b className="x num">×{g.count}</b>}
              </Tip>
              {use && <button type="button" className="lt-btn mini" data-option={use.id} onClick={() => onPick(use.id)} title={`Use ${d.name} now`}>Use<span className="hitbox" aria-hidden="true" /></button>}
              {toggle && <button type="button" className="lt-btn mini" data-option={toggle.id} onClick={() => onPick(toggle.id)} title={toggle.label}>{g.card.on === false ? 'On' : 'Off'}<span className="hitbox" aria-hidden="true" /></button>}
            </span>
          );
        })}
        {rest > 0 && <span className="cs-more" title={`${rest} more member${rest === 1 ? '' : 's'}`}>+{rest}</span>}
      </div>
      <footer className="cs-foot">
        <FollowerMark n={f} size={mine ? 6 : 5} label={false} />
        <span className="cs-res" role="group" aria-label="Resources">
          {state.resources.map(r => (
            <span key={r} className={`cs-stack${p.res[r] ? '' : ' zero'}`} data-res={r} title={`${p.res[r] || 0} ${r}`}>
              <ResourceGlyph r={r} size={mine ? 16 : 13} n={p.res[r] || 0} /><b className="num">{p.res[r] || 0}</b>
            </span>
          ))}
        </span>
      </footer>
    </section>
  );
}
// each figure breathes on its own period and phase, so a crowd never moves in step
const phase = uid => `${((uid * 0.61803) % 1).toFixed(3)}`;
const actionKey = last => { try { return quadrant(last.qid).actions.find(a => a.name === last.name).key; } catch { return ''; } };
