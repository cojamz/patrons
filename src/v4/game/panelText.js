// What a space's panel says (the visual language, plate 1b, Cory 2026-10-15; design/prototypes/language/grammar.md):
// the big line first ("+3 gold": the number biggest, the noun after it as a dot or a mark), then one line of small
// print only where the big line can't say it all ("a rival gets 1 gold"). No name: the name opens with the hover.
// Text: resource words become dots, @m a member, @r a rival, @n a minion, @t an extra turn, @f a follower (Wheel.jsx
// Said); "|" is where the big line may break when its panel is narrow (it reads as a space on one line). A space with no entry here prints its pips-first yield (shorts.js), split at " · " into big · small print.
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
    evenswap: { big: '+1 red|@m⇄@m', fine: 'with a rival, equal cost' },
    turnout: { big: '+1 red / @m', fine: 'per member recruited this round' },
    hire: { big: '@m free', fine: 'the cheapest face-up one' },
    hireup: { big: '@m ≤4|free', fine: 'any face-up one' },
    trade: { big: '@m ⇄ @r', fine: 'theirs may cost 2 more' },
    take: { big: '@m free', fine: 'any face-up member' },
  },
  market: {
    bargain: { big: '+2 blue|+ @m', fine: 'recruit one now, any colors' },
    restock: { big: '+2 blue', fine: 'and a fresh row of members' },
    showroom: { big: '+1 blue|+1 / @m', fine: 'per blue face-up member' },
    clearance: { big: '@m ×½', fine: 'as your buy, any colors' },
    pricecheck: { big: '½ @m|blue', fine: 'half your priciest member' },
    spree: { big: 'buy ×3', fine: 'this turn' },
  },
  purple: {
    hourly: r => ({ big: `+${3 + r} purple`, fine: byRound(4, 5, 6) }),
    catchup: { big: '+1 purple|+2 / @r', fine: 'per rival with more minions out' },
    windup: { big: '+1 purple / @n', fine: 'on the board, this one too' },
    planahead: { big: '+1 purple / @n', fine: 'you have left to place' },
    overtime: { big: '8 purple →|@t @t', fine: 'can’t pay? +3 purple' },
    rally: { big: 'purple → @t', fine: '1 per 4 spent, plus 1' },
  },
  silver: {
    toast: r => ({ big: `+${3 * r} silver`, fine: 'everyone else +1 silver' }),
    gift: { big: '+2 silver|+2 any', fine: 'everyone else 1 of it' },
    alms: { big: '+4 silver', fine: 'a rival gets 2' },
    tongue: { big: '+4 silver', fine: 'swap silver; all +1 silver' },
    tide: { big: '½ @r|silver', fine: 'half the richest rival’s' },
    jubilee: { big: '+1 @f|/ 2 silver', fine: 'keep it; all +2 silver' },
  },
  yellow: {
    harvest: { big: '+1 yellow|+1 / any', fine: 'per other color you hold' },
    bloom: { big: '+1 any', fine: 'of each color you hold fewest' },
    transmute: { big: '3 any ⇄|+1 yellow', fine: 'swap for other colors' },
    prism: { big: '+1 any|/ 3 yellow', fine: 'of each other color' },
    gather: { big: '+1 / @m', fine: 'in its color' },
    flourish: { big: '+1 any|/ set', fine: 'of each other color' },
  },
  thieves: {
    pickpocket: r => ({ big: `+${r + 1} magenta`, fine: 'from rivals, as you like' }),
    tipoff: { big: '+1 magenta|/ @r', fine: 'from each rival richer' },
    hideout: { big: '+1 magenta', fine: 'from a rival; then safe' },
    rob: { big: '+3 magenta', fine: 'from rivals, 1 from each' },
    ransom: { big: '@m ≤4', fine: 'a rival’s: they pay or lose it' },
    heist: { big: '+ @m', fine: 'any rival’s; they get one free' },
  },
  trading: {
    haggle: { big: '+2 white|+1 / @r', fine: 'per player ahead of you' },
    buylow: r => ({ big: `${2 * r} any →|@f`, fine: byRound(2, 4, 6) }),
    pawn: r => ({ big: `${r} @f or|+${2 * r} white`, fine: byRound(1, 2, 3) }),
    sellhigh: { big: '2 @f →|6 white', fine: 'loose followers, 3 each' },
    dividend: { big: '+1 white|/ @f', fine: 'per loose follower' },
    boom: { big: 'all →|@f', fine: '1 for 1; keep white if you like' },
  },
  echo: {
    chant: r => ({ big: `+${2 * r} green`, fine: byRound(2, 4, 6) }),
    echo: { big: 'copy @r', fine: 'a space a rival took since your turn' },
    encore: { big: 'copy', fine: 'any space taken this round' },
    refrain: { big: '+2 green|copy', fine: 'one of your spaces this round' },
    eternity: { big: 'copy all', fine: 'every space you took this round' },
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
