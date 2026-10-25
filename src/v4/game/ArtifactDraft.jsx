// The artifact draft (Cory, 2026-10-25: "when you're drafting, it should tell you what those things do. ideally without
// hover"): every artifact on the table, picture, name and what it does, on the wheel's dark middle (unused in round I)
// for the whole starting pick. On your pick the ones you can take are buttons; a taken one shows who has it.
import { cardDef, quadrant } from '../../engine/v4/index.js';
import { Sprite } from '../art/Sprite.jsx';
import { playerColor, seatEmoji } from '../format.js';
import { EmojiFace } from '../screens/EmojiPicker.jsx';
import { ResourceGlyph } from './Glyphs.jsx';
import { Rich } from './Rich.jsx';
import './artifact-draft.css';

/** An artifact's picture on a small plate in its color (the seat, the starting pick and the draft). */
export function ArtifactTile({ q, res, title = null, size = 24 }) {
  return <span className="art-tile" style={{ '--c': `var(--${q})` }}><Sprite id={`artifact.${q}`} kind="artifact" sphere={res} size={size} title={title} /></span>;
}

export default function ArtifactDraft({ state, onPick, mine = false, busy = false }) {
  const pend = state.pending;
  const holder = uid => state.players.find(p => p.artifact === uid) || null;
  const option = q => (mine && !busy && pend?.kind === 'setup' ? pend.options.find(o => o.value === q) : null);
  const qs = state.quadrants.filter(q => state.artifacts?.[q] !== undefined);
  if (!qs.length) return null;
  return (
    <section className={`art-draft${mine ? ' mine' : ''}`} aria-label="Artifacts" data-art-draft="">
      <p className="ad-head">Artifacts <small>· each comes with 1 of its color</small></p>
      <ul>
        {qs.map(q => {
          const uid = state.artifacts[q], def = cardDef(state, uid), res = quadrant(q).resource, by = holder(uid), o = option(q);
          const body = <>
            <ArtifactTile q={q} res={res} />
            <span className="ad-words"><b>{def.name}</b><span className="ad-text"><Rich text={def.text} /></span></span>
            {by ? <span className="ad-by" title={`${by.name} has it`} style={{ '--pc': playerColor(by.id) }}><EmojiFace id={seatEmoji(state, by.id)} /></span>
              : <span className="ad-plus num">+1<ResourceGlyph r={res} size={12} decorative /></span>}
          </>;
          return <li key={q} className={by ? 'taken' : o ? 'open' : ''} data-art-color={q} style={{ '--c': `var(--${q})` }}>
            {o ? <button type="button" data-option={o.id} onClick={e => onPick(o.id, e.currentTarget)} aria-label={`Take ${def.name} and 1 ${res}`}>{body}</button> : <div>{body}</div>}
          </li>;
        })}
      </ul>
    </section>
  );
}
