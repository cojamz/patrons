// Your table: your resources as stacks (one shape per color), your leader and minions left, and your cult: each
// member standing as its pixel figure in its sphere's color, beside a follower mark that grows. Hover or tap a
// figure for its card; members you can use (or switch) this step carry a small button.
import { followers, quadrant } from '../../engine/v4/index.js';
import { memberChips } from '../format.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { Tip, MemberCard, cardColor, onTable } from './Info.jsx';
import { ResourceGlyph, FollowerMark, LeaderRing } from './Glyphs.jsx';
import './lamp-b.css';

const STACK = 6; // coins drawn per stack before the number carries the rest
const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

export default function YourTable({ state, me = null, mySeats = [], optionFor = () => null, onPick }) {
  if (me == null || !state.players[me]) return <section className="lt-mine" aria-label="Your table" />;
  const p = state.players[me];
  const f = followers(state, p);
  const groups = memberChips(state, p);
  return (
    <section className="lt-mine" aria-label="Your table" data-pid={me}>
      <h3 className="lt-h">Your table<small>{p.name}{p.discount ? ` · next member −${p.discount}` : ''}</small></h3>
      <div className="lt-mine-row">
        <div className="lt-stacks" role="group" aria-label="Your resources">
          {state.resources.map(r => {
            const n = p.res[r] || 0;
            return (
              <span key={r} className={`lt-stack${n ? '' : ' zero'}`} data-res={r} title={`${n} ${r}`}>
                <span className="lt-coins" aria-hidden="true">
                  {Array.from({ length: Math.max(1, Math.min(n, STACK)) }, (_, k) => <ResourceGlyph key={k} r={r} size={20} />)}
                </span>
                <b className="n num">{n}</b>
              </span>
            );
          })}
        </div>
        {/* your leader with the minions still to place floating around it (the count is seen, not read) */}
        <div className="lt-workers"><LeaderRing state={state} id={me} size={32} minion={16} /></div>
        <div className="lt-cult" role="group" aria-label="Your cult">
          <span className="crowd">
            {groups.map(g => {
              const d = g.def;
              const use = optionFor(`use:${g.uids[0]}`) || g.uids.map(u => optionFor(`use:${u}`)).find(Boolean);
              const toggle = g.uids.map(u => optionFor(`toggle:${u}`)).find(Boolean);
              return (
                <span key={g.key} className={`lt-member${g.card.used ? ' used' : ''}`} style={{ '--q': cardColor(state, d) }} data-member={d.id}>
                  <Tip className="fig" label={`${d.name}: show the card`} content={() => <MemberCard state={state} uid={g.uids[0]} />}>
                    <Sprite id={spriteId(d.name)} kind="member" sphere={sphereOf(state, d)} size={24} />
                    {g.count > 1 && <b className="x num">×{g.count}</b>}
                  </Tip>
                  {use && <button type="button" className="lt-btn mini" data-option={use.id} onClick={() => onPick(use.id)} title={`Use ${d.name} now`}>Use<span className="hitbox" aria-hidden="true" /></button>}
                  {toggle && <button type="button" className="lt-btn mini" data-option={toggle.id} onClick={() => onPick(toggle.id)} title={toggle.label}>{g.card.on === false ? 'On' : 'Off'}<span className="hitbox" aria-hidden="true" /></button>}
                </span>
              );
            })}
          </span>
          <span className="lt-cult-foot"><FollowerMark n={f} /><small>{groups.length ? `${p.members.length} member${p.members.length === 1 ? '' : 's'}` : 'no members yet'}</small></span>
        </div>
      </div>
    </section>
  );
}
