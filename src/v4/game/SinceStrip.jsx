// "Since your last turn": one short line per rival placement since your own last one, always on the board (RC1 panel:
// bot turns blurred past, "why does P4 suddenly have five gold?"). The player's name opens that placement's full card
// on hover (a tap on the line pins it); every space and member named opens its own card, like on the board. The whole
// log is one tap away (the Log button), not buried in the menu. Self-contained: the layout places the box.
import { playerColor, seatEmoji } from '../format.js';
import { Minion } from '../art/Leader.jsx';
import { Tip } from './Info.jsx';
import { HoverName, HoverNames } from './HoverNames.jsx';
import { Rich } from './Rich.jsx';
import { quadrant } from '../../engine/v4/index.js';
import { panelWords } from './panelText.js';
import './since.css';

const MAX = 6;
/** The words the board prints on a space ("+3 gold, +1 to anyone"), for this round: the panel's own lines. */
const words = (state, key) => {
  if (!key) return '';
  try { const [q, i] = key.split('-').map(Number); const qid = state.quadrants[q]; return panelWords(qid, quadrant(qid).actions[i], Math.max(1, state.round)) || ''; } catch { return ''; }
};

/** One placement's full card (the same lines as the turn card by the cult), its names hover targets. */
export function StoryCard({ story, color, state, hover }) {
  return (
    <div className="since-card" data-since-card style={{ '--pc': color }}>
      <b className="sc-head"><HoverNames state={state} hover={hover} text={story.head} uids={story.uids} /></b>
      {story.lines.length ? story.lines.map((l, k) => <span key={`${k}:${l}`} className="sc-line"><HoverNames state={state} hover={hover} text={l} uids={story.uids} /></span>)
        : <span className="sc-line quiet">Nothing else changed.</span>}
    </div>
  );
}

/**
 * props: state, entries (stories, oldest first: { actor, head, space, spaceKey, short, lines, uids, hit, n }), me (your
 * id or null), yours (it's your move now), hover (the board's hover layer), onLog (opens the full log).
 */
export default function SinceStrip({ state, entries, me, yours, hover = null, onLog }) {
  const shown = entries.slice(-MAX);
  const more = entries.length - shown.length;
  const name = id => (id === me ? 'You' : state.players[id].name);
  // a tap anywhere on a line that isn't a name pins its card (the name's own tap opens the name's card)
  const pinLine = e => { const t = e.currentTarget.querySelector('[data-since-line]'); if (t && !e.target.closest('[data-hover-name], [data-since-line]')) t.click(); };
  return (
    <section className={`lt-since${yours ? ' yours' : ''}`} data-since aria-label="Since your last turn">
      <header className="since-head">
        <span className="since-title">Since your last turn</span>
        <button type="button" className="since-log" data-open-log onClick={onLog} title="The whole game, move by move">Log</button>
      </header>
      {shown.length ? (
        <ol className="since-list">
          {more > 0 && <li className="since-more"><button type="button" onClick={onLog}>{more} earlier… open the log</button></li>}
          {shown.map(e => (
            <li key={e.n} className={`since-row${e.hit ? ' hit' : ''}`} style={{ '--pc': playerColor(e.actor) }} onClick={pinLine}>
              <Tip className="since-line" data-since-line={e.n} label={`${e.head}: show what happened`}
                content={() => <StoryCard story={e} color={playerColor(e.actor)} state={state} hover={hover} />}>
                <Minion color={playerColor(e.actor)} emoji={seatEmoji(state, e.actor)} size={14} /><b className="who">{name(e.actor)}</b>
              </Tip>{' '}
              {e.spaceKey && hover ? <HoverName hover={hover} target={{ kind: 'space', key: e.spaceKey }}><span className="sp">{e.space}</span></HoverName>
                : <span className="sp">{e.space || 'turn'}</span>}
              {/* the space's own words from the board, so the name needs no lookup */}
              {words(state, e.spaceKey) ? <span className="sp-words"> (<Rich text={words(state, e.spaceKey)} />)</span> : null}
              {e.short ? <span className="big">: <HoverNames state={state} hover={hover} text={e.short} uids={e.uids} /></span> : null}
            </li>
          ))}
        </ol>
      ) : <p className="since-none">{state.round >= 1 ? 'No moves since yours yet.' : 'Moves will show here.'}</p>}
    </section>
  );
}
