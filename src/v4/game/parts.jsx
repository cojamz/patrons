// Small game-screen pieces: the choice prompt, the log and the hot-seat handoff.
import { quadrant } from '../../engine/v4/index.js';
import { playerColor } from '../format.js';

export function ChoicePrompt({ state, onPick, busy }) {
  const pend = state.pending;
  const setup = pend.kind === 'setup';
  return (
    <section className="prompt" aria-live="polite">
      <p>{setup ? 'Pick a starting resource' : pend.prompt}</p>
      <div className="opts">
        {pend.options.map(o => {
          const color = setup || o.kind === 'color' ? o.value : null;
          const q = color && state.quadrants.includes(color) ? quadrant(color) : null;
          return (
            <button
              key={o.id} type="button" className={`btn${color ? ' color' : ''}`} data-option={o.id} disabled={busy}
              style={color ? { '--c': `var(--${color})` } : undefined} onClick={() => onPick(o.id)}
            >
              {color && <i />}{q ? q.name : o.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Log({ state }) {
  const lines = state.log.slice(-16).reverse();
  return (
    <div className="log" aria-label="Game log">
      {lines.map((l, k) => <div key={state.log.length - k}>{l}</div>)}
    </div>
  );
}

export function Handoff({ player, onReady }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`${player.name}'s turn`}>
      <div className="dialog handoff" style={{ '--pc': playerColor(player.id) }}>
        <div className="big-dot" />
        <h2>{player.name}’s turn</h2>
        <p className="hint">Pass the device to {player.name}.</p>
        <button type="button" className="btn pri" autoFocus onClick={onReady} data-handoff>I’m {player.name} — go</button>
      </div>
    </div>
  );
}
