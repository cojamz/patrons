// What a space's panel says, for a first-time player who hasn't read the rulebook (Cory, 2026-10-15: "we tried to get
// too cute with the action visual language. now it's hard to decipher"). Three lines at most, no pictures:
//   main   line 1, biggest: the gain as a number and its resource dot ("+3 gold"), or followers ("+1 @f")
//   verb   line 1 instead when the space gains nothing directly: the verb in plain words ("Copy a space")
//   second line 2: the rest as a short, complete plain phrase that makes sense alone ("+1 to a rival")
//   note   line 3, small and only if needed: a clarification ("you pick who")
// The only marks are the resource dot (a resource word right after a number) and the follower mark (@f). The
// space's name opens with its hover, whose rule sentence (the engine's action text) uses the same words for the same
// idea ("copy", "in the shop", "on the board"). design/eval/words/decipher-w3.md checks every line against the rule.
import { pipEffect } from '../shorts.js';

// A value that grows by round prints this round's number, and says it grows in plain words (w3b #12/#13, w3a #54: the
// "2 · 4 · 6 by round" run under "+4●" said the number twice, and "+2●" alone read as flat). It takes line 2 when the
// panel has nothing else to say there, else line 3 (joined onto line 2 it made the line too long, and a line 2 that
// doesn't fit drops whole). The run itself is the hover's rule sentence. Round III has nothing left to grow into.
const grows = r => (r < 3 ? 'more each round' : null);
// Line 2 stays within about 16 letters a line: at 1270×700 a narrow panel holds two short lines of it (Cory: "cut words
// or step the size down. Never clip and never abbreviate into code"); a line 2 that doesn't fit drops whole. A condition
// that decides the gain never sits only in line 3 (at 1270×700 line 3 shows on few rings: measured on five tables, w3),
// and where line 2 can drop too (the center ring always, a ring II verb at some turns of the wheel) the space is whole
// in line 1 (w2b #2/#24: "Gain each color" gave nothing without its "per full set"; "Take a member" hid that it's a
// rival's; w3: "Pay all your purple" without its "for 2 extra turns").
const P = {
  gold: {
    // "+1 to anyone" (w3): the gift goes to a rival only, never to you
    jv: { main: '+3 gold', second: '+1 to a rival', note: 'you pick who' },
    rush: r => ({ main: `+${2 * r} gold`, second: grows(r) }),
    discount: { verb: 'Save 4', second: 'on next member' },
    steal: { main: '+3 gold', second: 'from rivals' },
    windfall: { main: '+1 gold', second: 'per member' },
    strike: { verb: 'Double your gold' },
  },
  red: {
    evenswap: { main: '+1 red', second: 'swap, equal cost', note: 'a member with a rival' },
    turnout: { main: '+1 red', second: 'per recruit by all', note: 'this round' },
    hire: { verb: 'Free recruit', second: 'the cheapest' },
    hireup: { verb: 'Free recruit', second: 'cost 4 or less' },
    trade: { verb: 'Swap a member', second: 'with a rival', note: 'theirs can cost 2 more' },
    // the center drops line 2: "Free recruit" alone hid that it's any member
    take: { verb: 'Any member, free' },
  },
  market: {
    // "then recruit" read as a normal recruit (w3a #21): its perk, paying in any colors, is on the panel
    bargain: { main: '+2 blue', second: 'then recruit in any colors' },
    restock: { main: '+2 blue', second: 'refresh the shop' },
    // one wording with the hover: "per blue member in the shop" (w3a #22: "on sale" here, "face-up" there)
    showroom: { main: '+1 blue', second: '+1 per blue in the shop' },
    clearance: { verb: 'Half-price recruit', second: 'as your buy', note: 'in any colors' },
    pricecheck: { verb: 'Gain blue', second: 'half your priciest', note: 'member’s cost' },
    spree: { verb: 'Buy 3 times', second: 'this turn' },
  },
  purple: {
    hourly: r => ({ main: `+${3 + r} purple`, second: grows(r) }),
    catchup: { main: '+1 purple', second: '+2 per rival with more minions', note: 'on the board' },
    // "out" and "left" read alike (w3b #16): where the minions are, in the card's own words ("on the board")
    windup: { main: '+1 purple', second: 'per minion on the board' },
    planahead: { main: '+1 purple', second: 'per minion to place' },
    // "2 extra turns for 8" read as 8 a turn (w3b #17): the price first, as the card says it
    overtime: { verb: 'Pay 8 purple', second: 'for 2 extra turns', note: 'can’t pay? +3 purple' },
    // "Extra turns for all purple" read as a gift to everyone with purple (w3b #18): yours, spent. The center drops
    // line 2, so the trade is whole in line 1. With 4 or more the card always gives 2 (1 per 4, plus 1, up to 2)
    rally: { verb: 'All your purple for 2 extra turns', note: 'less than 4? +4 purple' },
  },
  silver: {
    toast: r => ({ main: `+${3 * r} silver`, second: 'others get 1', note: grows(r) }),
    // "+2 of a color": which one? (w3a #56) yours to pick
    gift: { main: '+2 silver', second: '+2 of a color you pick', note: 'others get 1 of it' },
    // said like Kickback's gift ("a rival gets 2" ran on as "+4 silver a rival gets 2" off the wheel)
    alms: { main: '+4 silver', second: '+2 to a rival' },
    // "trade silver" (w3a #57): with whom? it's a swap of your silver into one other color. Line 2 within 16 letters
    // ("swap silver for a color" didn't fit ring II, and dropped whole)
    tongue: { main: '+4 silver', second: 'swap for a color', note: 'others get 1 silver' },
    // the richest in silver: the hover says "the rival with the most" ("Gain half the silver" left no room for line 2)
    tide: { verb: 'Gain silver', second: 'half the richest', note: 'others get 1' },
    // on the center line 2 drops: the rate is in line 1, and "held" says the silver stays
    jubilee: { verb: '+1 @f per 2 silver held', second: 'others get 2 silver' },
  },
  yellow: {
    harvest: { main: '+1 yellow', second: '+1 per other color', note: 'you hold' },
    bloom: { verb: 'Top up', second: '+1 of your fewest' },
    // in the rule's order, swap first, then the yellow (w4b #21: "+1● swap up to 3" read reversed against the hover)
    transmute: { verb: 'Swap up to 3', second: 'then +1 yellow', note: 'for other colors' },
    prism: { verb: '+1 each other color', second: 'per 3 yellow', note: 'you keep the yellow' },
    // "Members pay out" was all a tight ring II showed: the gain first, whole in line 1
    gather: { verb: '+1 per member', second: 'in its own color' },
    // the center drops line 2: "other" belongs in line 1 (w4b #11: "+1 each per full set" lost it)
    flourish: { verb: '+1 each other color, per full set' },
  },
  thieves: {
    pickpocket: r => ({ main: `+${r + 1} magenta`, second: 'from rivals', note: grows(r) }),
    // "richer" in what? (w3a #52) resources
    tipoff: { verb: 'Steal 1 each', second: 'from rivals with more resources' },
    // "safe" from what? (w3a: guessed swaps) steals
    hideout: { verb: 'Steal 1', second: 'then safe from steals', note: 'this round' },
    rob: { main: '+3 magenta', second: 'from rivals', note: 'at least 1 each' },
    // "Ransom a member" read as paying to get a member back (w3b #19, w3a #57): what you get, whole in line 1 (ring II
    // drops line 2 when tight), and who decides
    // "A rival's member or its cost" read as "I choose" (w4b #5): line 1 says who decides, line 2 what's picked
    ransom: { verb: 'A rival pays, or loses a member', second: 'their choice', note: 'costing 4 or less' },
    heist: { verb: 'Take a rival’s member', second: 'they recruit one free' },
  },
  trading: {
    // "+1 per higher score" (w3b): the players ahead are rivals with more followers
    haggle: { main: '+2 white', second: '+1 per rival with more @f' },
    buylow: r => ({ verb: 'Trade for followers', second: `1 for 1, up to ${2 * r}`, note: grows(r) }),
    pawn: r => ({ main: `+${r} @f`, second: `or +${2 * r} white`, note: grows(r) }),
    // the gain first: "Sell followers" lost its "3 white each" on ring II whenever the panel was tight (w3 words pass)
    sellhigh: { main: '+3 white', second: 'per follower sold', note: 'up to 2' },
    // "loose" is a rulebook word a newcomer won't remember (w3a #57): what it means, in the glossary's own words
    dividend: { main: '+1 white', second: 'per @f bought or won' },
    boom: { verb: 'All for followers, 1 for 1' },
  },
  echo: {
    chant: r => ({ main: `+${2 * r} green`, second: grows(r) }),
    // the hover's own words, "since your last turn" (w4b #22: "a rival just took" said it two ways)
    echo: { verb: 'Copy a space', second: 'taken since your last turn' },
    encore: { verb: 'Copy a space', second: 'taken this round' },
    // one word for it, the hover's (w3a #22: "redo" here, "copy" there)
    refrain: { main: '+2 green', second: 'copy a space you took', note: 'this round' },
    eternity: { verb: 'Copy all your spaces', second: 'from this round' },
  },
};

/** { main, verb, second, note } for a space this round (any may be null; note may be { byRound: [a, b, c] }). */
export function panelText(qid, action, round = 1) {
  const r = Math.max(1, Math.min(3, round));
  let v = P[qid] && P[qid][action.key];
  if (typeof v === 'function') v = v(r);
  if (v) return { main: v.main || null, verb: v.main ? null : v.verb || null, second: v.second || null, note: v.note || null };
  // the plain spheres: "+2 blue +1 red" is the gain, a clause a line when the panel is narrow
  const [main, ...rest] = String(pipEffect(qid, action, r)).split(' · ');
  return { main, verb: null, second: rest.length ? rest.join(', ') : null, note: null };
}

/**
 * The board's own words for a space on one line, for text off the wheel (the strip's "(…)", the setup hints):
 * "+3 gold, +1 to a rival", "+1 purple per minion to place", "Trade for followers: 1 for 1, up to 4". The follower mark
 * stays "@f" (Rich draws it). The strip used to print an older short table ("4 for followers") the board no longer says.
 */
export function panelWords(qid, action, round = 1) {
  const t = panelText(qid, action, round);
  const one = t.main || t.verb || '';
  if (!t.second) return one;
  // a continuation reads straight on ("Copy a space a rival just took", "+1 purple per minion to place"); a verb's
  // terms after a colon ("Trade for followers: 1 for 1, up to 4"); a second gain after a comma ("+3 gold, +1 to a rival")
  const glue = /^(a|an|as|taken|this|from|per|then|and|on|in|of|for|to|with|unless)\b/.test(t.second) ? ' ' : t.verb ? ': ' : ', ';
  return `${one}${glue}${t.second}`;
}

/** Every entry, for the decipher table and the tests: [qid, key, lines] (round 2). */
export const panelEntries = () => Object.entries(P).flatMap(([qid, m]) => Object.keys(m).map(key => [qid, key, panelText(qid, { key }, 2)]));

/** A line as plain text (for measuring). A { byRound } note (none left here) reads "2 · 4 · 6 by round". */
export const lineText = line => (!line ? '' : typeof line === 'string' ? line : `${line.byRound.join(' · ')} by round`);
