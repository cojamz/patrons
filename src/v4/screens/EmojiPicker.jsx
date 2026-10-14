// Pick your emoji (Cory, 2026-10-14): each player picks one of the 20 pixel emojis, one per table. All their
// minions are that emoji and their cult leader wears it. A small button shows yours; it opens a compact grid of all
// 20, drawn with the real sprites. One another person holds is dimmed; one a bot holds can be taken (the bot picks
// another). Used by local setup and the online lobby.
import { useEffect, useId, useRef, useState } from 'react';
import { Minion } from '../art/Leader.jsx';
import { emojiIds, emojiInfo } from '../art/emojis.js';
import './emoji.css';

export const emojiName = id => emojiInfo(id)?.name || 'Emoji';
const GREY = '#8d9693';

/** A seat's emoji, not pickable here (a bot's, another player's). */
export function EmojiFace({ id, title = null, size = 32 }) {
  return (
    <span className={`emoji-face${id ? '' : ' blank'}`} data-emoji-face={id || ''} title={title || (id ? emojiName(id) : undefined)}>
      {id && <Minion emoji={id} color={GREY} size={size} />}
    </span>
  );
}

/**
 * Your emoji, as a button that opens the picker.
 * props: value (emoji id); taken (Map id -> name of the person holding it: dimmed, can't be picked);
 * bots (Map id -> name of the bot holding it: pickable, the bot takes another); onPick(id); label (whose emoji).
 */
export function EmojiButton({ value, taken = new Map(), bots = new Map(), onPick, label = 'Your emoji', disabled = false }) {
  const [open, setOpen] = useState(false);
  const gridId = useId();
  const btn = useRef(null);
  const grid = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    addEventListener('keydown', onKey);
    const cur = grid.current?.querySelector('.emoji-cell.on') || grid.current?.querySelector('.emoji-cell:not(:disabled)');
    cur?.focus({ preventScroll: true });
    grid.current?.scrollIntoView?.({ block: 'nearest' });
    return () => removeEventListener('keydown', onKey);
  }, [open]);
  const name = emojiName(value);
  const pick = id => { setOpen(false); btn.current?.focus(); if (id !== value) onPick(id); };
  return (
    <>
      <button ref={btn} type="button" className={`emoji-btn${open ? ' open' : ''}`} data-emoji-btn={value || ''} aria-expanded={open} aria-controls={gridId}
        aria-label={`${label}: ${name}. Pick another`} title={`${label}: ${name}. Your minions are this emoji, and your cult leader wears it. Tap to pick another.`}
        disabled={disabled} onClick={() => setOpen(o => !o)}>
        <Minion emoji={value} color={GREY} size={32} />
      </button>
      {open && (
        <div className="emoji-grid" id={gridId} ref={grid} role="radiogroup" aria-label={`${label}: pick one`} data-emoji-grid>
          <p className="emoji-cap">Your minions are this emoji, and your leader wears it. One each.</p>
          {emojiIds().map(id => {
            const nm = emojiName(id);
            const by = taken.get(id);
            const bot = bots.get(id);
            return (
              <button key={id} type="button" role="radio" aria-checked={id === value} data-pick={id} disabled={!!by}
                className={`emoji-cell${id === value ? ' on' : ''}${by ? ' taken' : ''}`}
                aria-label={by ? `${nm}, taken by ${by}` : nm}
                title={by ? `${nm}: ${by} has it` : bot ? `${nm}: ${bot} has it and will pick another` : nm}
                onClick={() => pick(id)}>
                <Minion emoji={id} color={GREY} size={32} />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
