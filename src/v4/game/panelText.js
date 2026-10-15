// What a space's panel says (the visual language, plate 1b, Cory 2026-10-15; design/prototypes/language/grammar.md):
// the big line first ("+3 gold": the number biggest, the noun after it as a dot or a mark), then one line of small
// print only where the big line can't say it all ("a rival gets 1 gold"). No name: the name opens with the hover.
// Text uses the Marked syntax (src/v4/game/Wheel.jsx): resource words become dots, @m a member, @r a rival, @f a
// follower. A space with no entry here prints its pips-first yield (shorts.js), split at " · " into big · small print.
import { pipEffect } from '../shorts.js';

const byRound = (a, b, c) => ({ byRound: [a, b, c] });
// grammar.md "The 15 hardest actions", plus the classic table's other spaces in the same voice
const P = {
  gold: {
    jv: { big: '+3 gold', fine: 'a rival gets 1 gold' },
    rush: r => ({ big: `+${2 * r} gold`, fine: byRound(2, 4, 6) }),
    discount: { big: '@m −4', fine: 'off your next member' },
    steal: { big: '+3 gold', fine: 'up to 3, from rivals' },
    windfall: { big: '+1 gold / @m', fine: 'per member you have' },
    strike: { big: '×2 gold', fine: 'doubles what you hold' },
  },
  red: {
    evenswap: { big: '+1 red @m⇄@m', fine: 'with a rival, equal cost' },
    turnout: { big: '+1 red / @m', fine: 'per member recruited this round' },
    hire: { big: '@m free', fine: 'the cheapest face-up one' },
    hireup: { big: '@m ≤4 free', fine: 'any face-up one' },
    trade: { big: '@m ⇄ @r', fine: 'theirs may cost 2 more' },
    take: { big: '@m free', fine: 'any face-up member' },
  },
  market: {
    bargain: { big: '+2 blue +@m', fine: 'recruit one now, any colors' },
    restock: { big: '+2 blue', fine: 'and a fresh row of members' },
    showroom: { big: '+1 blue +1 / @m', fine: 'per blue face-up member' },
    clearance: { big: '@m ×½', fine: 'as your buy, any colors' },
    pricecheck: { big: '½ @m blue', fine: 'half your priciest member' },
    spree: { big: 'buy ×3', fine: 'this turn' },
  },
  purple: {
    hourly: r => ({ big: `+${3 + r} purple`, fine: byRound(4, 5, 6) }),
    catchup: { big: '+1 purple +2 / @r', fine: 'per rival with more minions out' },
    windup: { big: '+1 purple / minion', fine: 'on the board, this one too' },
    planahead: { big: '+1 purple / minion', fine: 'you have left to place' },
    overtime: { big: '8 purple → 2 turns', fine: 'can’t pay? +3 purple' },
  },
  trading: {
    buylow: r => ({ big: `${2 * r} any → @f`, fine: byRound(2, 4, 6) }),
  },
  silver: {
    jubilee: { big: '+1 @f / 2 silver', fine: 'keep it; everyone else +2 silver' },
  },
  echo: {
    echo: { big: 'copy @r', fine: 'a space a rival took since your turn' },
  },
};

/**
 * { big, fine } for a space this round. fine is a string, null, or { byRound: [a, b, c] } (this round's value is
 * the big line; the small print shows all three, this round's bold).
 */
export function panelText(qid, action, round = 1) {
  const r = Math.max(1, Math.min(3, round));
  let v = P[qid] && P[qid][action.key];
  if (typeof v === 'function') v = v(r);
  if (v) return { big: v.big, fine: v.fine || null };
  const [big, ...rest] = String(pipEffect(qid, action, r)).split(' · ');
  return { big, fine: rest.length ? rest.join(', ') : null };
}

/** The small print as plain text (for measuring): "2 · 4 · 6 by round". */
export const fineText = fine => (!fine ? '' : typeof fine === 'string' ? fine : `${fine.byRound.join(' · ')} by round`);
