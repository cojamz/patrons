// The quadrant facing you: its scoring rule and its action cards, by ring.
import { quadrant, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, roman } from '../format.js';

export default function QuadrantPanel({ state, facing, onFacing, optionFor, onPick }) {
  const qid = state.quadrants[facing];
  const Q = quadrant(qid);
  const round = Math.max(1, state.round);
  const col = `var(--${qid})`;
  return (
    <section className="panel quad" style={{ '--c': col }}>
      <div className="qtabs" role="tablist" aria-label="Quadrants">
        {state.quadrants.map((id, q) => {
          const free = state.pending && state.pending.kind === 'place'
            ? quadrant(id).actions.some((a, i) => optionFor(`slot:${q}-${i}`)) : false;
          return (
            <button
              key={id} type="button" role="tab" aria-selected={q === facing}
              className={`qtab${q === facing ? ' on' : ''}${free ? ' open' : ''}`} style={{ '--c': `var(--${id})` }}
              onClick={() => onFacing(q)}
            >{quadrant(id).name}</button>
          );
        })}
      </div>
      <h2 style={{ color: col }}>{Q.name}<small>facing you{Q.standIn ? ' · stand-in quadrant' : ''}</small></h2>
      <div className="score">
        <b>Round end:</b> {Q.scoring.label.toLowerCase()} takes the ring’s followers ({RING_VALUE.map(v => `+${v}`).join(' / ')}). Ties all score.
      </div>
      {[1, 2, 3].map(t => (
        <div key={t} className="ringrow">
          <div className="tier">Round {roman(t)}{t > round ? ' · locked' : ''}</div>
          <div className="acts">
            {Q.actions.map((a, i) => {
              if (a.ring !== t) return null;
              const key = `${facing}-${i}`;
              const owner = state.slots[key];
              const opt = optionFor(`slot:${key}`);
              return (
                <button
                  key={i} type="button" className={`act${opt ? ' can' : ''}`} disabled={!opt}
                  data-option={opt ? opt.id : undefined} onClick={() => opt && onPick(opt.id)}
                  title={owner !== undefined ? `Taken by ${state.players[owner].name}` : a.text}
                >
                  {owner !== undefined && <i className="who" style={{ background: playerColor(owner) }} aria-label={`taken by ${state.players[owner].name}`} />}
                  <b>{a.name}</b><span>{a.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
