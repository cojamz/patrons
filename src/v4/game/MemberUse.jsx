// Using members, made obvious (Cory, 2026-10-15: "I still don't know how to activate a member / the UI for it"), and a
// player's members as one calm list (the seat card). A member you can use now is lit in your seat; its hover and its
// row in the seat card carry the same "Use: +7 ●" button; once used it reads "used" everywhere. Switches (Midas,
// Translator) are a small on/off switch. Everything here is read off the engine (memberUse.js).
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { quadrant } from '../../engine/v4/index.js';
import { CardName, onTable } from './Info.jsx';
import { Rich } from './Rich.jsx';
import { memberRows, useNow } from './memberUse.js';
import './members.css';

const sphereOf = (state, d) => { if (!onTable(state, d)) return 'colorless'; try { return quadrant(d.quadrant).resource; } catch { return 'colorless'; } };

/** "Use: +7 ●": the one button that uses a member. big: the primary button of a member's hover. */
export function UseButton({ use, uid, name, onPick, big = false }) {
  if (!use || use.blocked) return null;
  return (
    <button type="button" className={`mu-use${big ? ' big' : ''}`} data-use={uid} data-option={use.option} title={`Ready to use: ${name}${use.words ? `, ${use.words}` : ''}`}
      onClick={e => { e.stopPropagation(); onPick(use.option); }}>
      <Rich text={use.label} />
    </button>
  );
}

/** A member's on/off switch: a button in your buy step (it flips it), else its state alone. */
export function MemberSwitch({ name, on, option = null, onPick = null }) {
  const say = `${name} is ${on ? 'on' : 'off'}.${option ? ` Click to switch it ${on ? 'off' : 'on'}.` : ' You can switch it when you buy.'}`;
  const face = <><i className="mu-track" aria-hidden="true"><i className="mu-knob" /></i><span className="mu-sw-word">{on ? 'on' : 'off'}</span></>;
  return option && onPick
    ? <button type="button" role="switch" aria-checked={on} className={`mu-switch${on ? ' on' : ''}`} data-switch={on ? 'on' : 'off'} data-option={option.id} title={say} aria-label={say}
        onClick={e => { e.stopPropagation(); onPick(option.id); }}>{face}</button>
    : <span className={`mu-switch idle${on ? ' on' : ''}`} data-switch={on ? 'on' : 'off'} title={say} aria-label={say} role="img">{face}</span>;
}

const stateOf = row => (row.toggle ? (row.toggle.on ? 'on' : 'off') : row.used ? 'used' : row.tag && row.tag.tone === 'lit' ? 'ready' : row.use && row.use.blocked ? 'blocked' : row.kind === 'use' ? 'unused' : '');

/**
 * The seat card's body (Cory, 2026-10-15): the player's members, one row each: picture, name, the ability as one
 * plain sentence (never cut), and a quiet state where one applies. Use-once members come first, then what pays at
 * round start, what reacts, the standing rules, and the game-end scorers.
 */
export function SeatMembers({ state, pid, me = null, optionFor = () => null, onPick = null }) {
  const rows = memberRows(state, pid, me, optionFor);
  if (!rows.length) return <p className="mu-none">No members yet.</p>;
  return (
    <ul className="mu-list" data-member-list={pid}>
      {rows.map((row, k) => {
        const st = stateOf(row);
        const brk = k > 0 && rows[k - 1].kind !== row.kind;
        return (
          <li key={row.key} className={`mu-row k-${row.kind}${st ? ` s-${st}` : ''}${brk ? ' brk' : ''}`} data-member-row={row.def.id} data-state={st || undefined}>
            <span className="mu-art" aria-hidden="true"><Sprite id={[row.def.id, spriteId(row.name)]} kind="member" sphere={sphereOf(state, row.def)} size={24} /></span>
            <span className="mu-body">
              <span className="mu-head">
                <b className="mu-name"><CardName state={state} uid={row.uid} />{row.n > 1 ? <span className="num"> ×{row.n}</span> : null}</b>
                {/* its state on the right: a switch, the Use button when it's yours to use now, else a quiet word */}
                {row.toggle ? <MemberSwitch name={row.name} on={row.toggle.on} option={row.toggle.option} onPick={onPick} />
                  : onPick && row.use && !row.use.blocked ? <UseButton use={row.use} uid={row.uid} name={row.name} onPick={onPick} />
                    : row.tag ? <span className={`mu-tag ${row.tag.tone}`} title={row.tag.title || undefined}>{row.tag.text}</span> : null}
              </span>
              {/* the whole sentence, never cut; plain (the member's own card underlines its keywords) */}
              <span className="mu-text" data-ability>{row.text ? <Rich text={row.text} /> : 'No effect.'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Under a member's card when it's one of yours: "Use: +7 ●" when you can use it now, why not when the engine says
 * no, and its switch. Nothing for anyone else's member (the card itself says "used").
 */
export function MemberActions({ state, uid, me = null, optionFor = () => null, onPick = null }) {
  const owner = state.players.find(p => p.members.includes(uid));
  if (!owner || owner.id !== me || !state.cards[uid]) return null;
  const c = state.cards[uid];
  const row = memberRows(state, me, me, optionFor).find(r => r.uids.includes(uid));
  if (!row) return null;
  const use = row.kind === 'use' && !c.used ? useNow(state, me, uid) : null;
  if (!use && !row.toggle) return null;
  return (
    <div className="mu-actions" data-member-actions={uid}>
      {row.toggle ? <span className="mu-sw-line"><span>{row.name} is {row.toggle.on ? 'on' : 'off'}</span><MemberSwitch name={row.name} on={row.toggle.on} option={row.toggle.option} onPick={onPick} /></span> : null}
      {use && use.blocked ? <small className="mu-why">Can’t use it now: {use.why || 'nothing would happen'}.</small> : null}
      {use && !use.blocked && onPick ? <UseButton use={use} uid={uid} name={row.name} onPick={onPick} big /> : null}
    </div>
  );
}
