// "Since your last turn": one short line per rival placement since your own last one, always on the board (RC1 panel:
// bot turns blurred past, "why does P4 suddenly have five gold?"). Each line opens that placement's full card on
// hover or tap; the whole log is one tap away (the Log button), not buried in the menu.
import { playerColor } from '../format.js';
import { Rich } from './Rich.jsx';
import { Tip } from './Info.jsx';
import './since.css';

const MAX = 6;

/** One placement's full card (the same lines as the turn card by the cult). */
export function StoryCard({ story, color }) {
  return (
    <div className="since-card" data-since-card style={{ '--pc': color }}>
      <b className="sc-head">{story.head}</b>
      {story.lines.length ? story.lines.map((l, k) => <span key={`${k}:${l}`} className="sc-line"><Rich text={l} /></span>)
        : <span className="sc-line quiet">Nothing else changed.</span>}
    </div>
  );
}

/**
 * props: state, entries (stories, oldest first: { actor, head, space, short, lines, hit, n }), me (your id or null),
 * yours (it's your move now), onLog (opens the full log).
 */
export default function SinceStrip({ state, entries, me, yours, onLog }) {
  const shown = entries.slice(-MAX);
  const more = entries.length - shown.length;
  const name = id => (id === me ? 'You' : state.players[id].name);
  return (
    <section className={`lt-since${yours ? ' yours' : ''}`} data-since aria-label="Since your last turn">
      <header className="since-head">
        <span>Since your last turn</span>
        <button type="button" className="since-log" data-open-log onClick={onLog} title="The whole game, move by move">Log</button>
      </header>
      {shown.length ? (
        <ol className="since-list">
          {more > 0 && <li className="since-more"><button type="button" onClick={onLog}>{more} earlier… open the log</button></li>}
          {shown.map(e => (
            <li key={e.n} className={e.hit ? 'hit' : ''} style={{ '--pc': playerColor(e.actor) }}>
              <Tip className="since-line" data-since-line={e.n} label={`${e.head}: show what happened`}
                content={() => <StoryCard story={e} color={playerColor(e.actor)} />}>
                <i className="dot" aria-hidden="true" />
                <b className="who">{name(e.actor)}</b>{' '}
                <span className="sp">{e.space || 'turn'}</span>
                {e.short ? <span className="big">: <Rich text={e.short} /></span> : null}
              </Tip>
            </li>
          ))}
        </ol>
      ) : <p className="since-none">{state.round >= 1 ? 'No moves since yours yet.' : 'Moves will show here.'}</p>}
    </section>
  );
}
