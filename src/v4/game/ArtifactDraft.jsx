// The artifact draft (Cory, 2026-10-25: "when you're drafting, it should tell you what those things do. ideally without
// hover"): every artifact on the table, picture, name and what it does, on the wheel's dark middle (unused in round I)
// for the whole starting pick. It's the only place to pick (Cory, 2026-10-25: "only pick from the wheels list, but it has
// to be obvious when it's your turn… as a player picks it disappears. and it's clear whose turn it is"): the head says
// whose pick it is, on yours the panel is lit and its rows are buttons, and a taken artifact leaves the list.
import { cardDef, quadrant } from '../../engine/v4/index.js';
import { Sprite } from '../art/Sprite.jsx';
import { playerColor } from '../format.js';
import { ResourceGlyph } from './Glyphs.jsx';
import { Rich } from './Rich.jsx';
import './artifact-draft.css';

/** An artifact's picture on a small plate in its color (the seat, the starting pick and the draft). */
export function ArtifactTile({ q, res, title = null, size = 24 }) {
  return <span className="art-tile" style={{ '--c': `var(--${q})` }}><Sprite id={`artifact.${q}`} kind="artifact" sphere={res} size={size} title={title} /></span>;
}

export const SUB = 'A boon for your cult. Comes with 1 resource.';

export default function ArtifactDraft({ state, onPick, mine = false, busy = false }) {
  const pend = state.pending;
  const held = uid => state.players.some(p => p.artifact === uid);
  const option = q => (mine && !busy && pend?.kind === 'setup' ? pend.options.find(o => o.value === q) : null);
  const qs = state.quadrants.filter(q => state.artifacts?.[q] !== undefined && !held(state.artifacts[q]));
  if (!qs.length || pend?.kind !== 'setup') return null;
  const who = state.players[pend.player];
  return (
    <section className={`art-draft${mine ? ' mine' : ''}`} aria-label={mine ? 'Your pick: take an artifact' : `${who.name} is picking an artifact`} data-art-draft="" data-picker={pend.player}>
      <p className="ad-head" style={{ '--pc': playerColor(who.id) }}>
        {mine ? <>Your pick</> : <><span className="ad-who">{who.name}</span> is picking</>}
      </p>
      {/* what an artifact is (Cory, 2026-10-25: "this is your cult's bonus for the game. but pithier") */}
      <p className="ad-sub">{SUB}</p>
      <ul>
        {qs.map(q => {
          const uid = state.artifacts[q], def = cardDef(state, uid), res = quadrant(q).resource, o = option(q);
          const body = <>
            <ArtifactTile q={q} res={res} />
            <span className="ad-words"><b>{def.name}</b><span className="ad-text"><Rich text={def.text} /></span></span>
            <span className="ad-plus num">+1<ResourceGlyph r={res} size={12} decorative /></span>
          </>;
          return <li key={q} className={o ? 'open' : ''} data-art-color={q} style={{ '--c': `var(--${q})` }}>
            {o ? <button type="button" data-option={o.id} onClick={e => onPick(o.id, e.currentTarget)} aria-label={`Take ${def.name} and 1 ${res}`}>{body}</button> : <div>{body}</div>}
          </li>;
        })}
      </ul>
    </section>
  );
}
