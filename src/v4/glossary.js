// The keyword glossary: one place that defines every game word the screen and the cards use.
// Card text, the How-to-play page and every underlined keyword read these definitions; nothing else defines them.
// `match` finds the word in rules text (lowercase as printed on cards); `link: false` keeps a very common word
// (member, follower) out of the underlining while it stays in the glossary.
import { RING_VALUE, WORKERS, allQuadrantIds, quadrant } from '../engine/v4/index.js';
import { guestMembers } from '../engine/v4/content/index.js';
import { CUT } from '../engine/v4/content/cull.js';

const rings = RING_VALUE.map(v => `+${v}`).join(' / ');

export const GLOSSARY = [
  { key: 'follower', word: 'Followers', link: false, match: /\bfollowers?\b/,
    def: 'Your score. You start with 1 (yourself); members add what they are worth, and you gain more from contests, recruiting followers and abilities. Most followers after round III wins.' },
  { key: 'loose followers', word: 'Loose followers', match: /\bloose followers?\b/,
    def: 'Followers you bought or won, not the ones your members are worth (and never yourself). Only loose followers can be taken away.' },
  { key: 'member', word: 'Member', link: false, match: /\bmembers?\b/,
    def: 'A card you recruit. It counts as its printed follower value in members, or a larger member count stated on the card. Bonus followers do not add members. Most cards have an ability.' },
  { key: 'worth', word: 'Worth', match: /\bworth \d+ followers?\b/i,
    def: 'How many followers a member counts for while you hold it: the number beside the follower mark on the card.' },
  { key: 'full set', word: 'Full set', match: /\bfull sets?\b/,
    def: 'One resource of each color on the table. Holding 2 of every color is 2 full sets; your fewest color sets how many you have.' },
  { key: 'plant', word: 'Plant', card: true, match: /\bplants?\b/,
    def: 'Sower: at round start you put some of your yellow on the card (it leaves your supply). At round end you gain that many of each other color.' },
  { key: 'set aside', word: 'Set aside', card: true, match: /\bset aside\b/,
    def: 'Investor: at round start you put some of your gold on the card (it leaves your supply, so it doesn’t count for Most gold). At round end it comes back doubled.' },
  { key: 'in play', word: 'In play', match: /\bin play\b/,
    def: 'Held by any player. Members in the shop or the pile are not in play.' },
  { key: 'release', word: 'Release', legacy: true, match: /\breleas(e|ed|es)\b/,
    def: 'Legacy rule, unavailable in normal play. Once per round, when you recruit: put one of your members (not one you recruited this round) at the bottom of the pile and take back only the colored part of its cost, in its own color. You keep your buy.' },
  { key: 'extra turn', word: 'Extra turn', match: /\bextra turns?\b/,
    def: 'Another turn right after this one: you place one more minion and may recruit again. Never in round I; later only if a space remains after every minion still due has landed.' },
  // Cory, 2026-10-22: a skip passes you over once; you never lose the turn or the minion
  { key: 'skip', word: 'Skip', match: /\bskip(?:s|ped)?\b/i,
    def: 'A skipped turn is passed over: play goes on to the next turn, and the skipped player places that minion later in the round. Nobody loses a turn or a minion.' },
  // Cory, 2026-10-24: "cast out" instead of "bury a member", in the cult's own words
  { key: 'cast out', word: 'Cast out', match: /\bcast out\b/i,
    def: 'Send one of your own members to the bottom of the pile. It leaves your cult.' },
  { key: 'leaves your cult', word: 'Leaves your cult', match: /\bleaves your cult\b/i,
    def: 'Any way a member stops being yours: you cast it out, a rival steals it, or a swap takes it away.' },
  { key: 'turn into followers', word: 'Turn into followers', match: /\bturn (?:\d+ |all your )?(?:[a-z]+ )*?(?:resources?|white|members?)(?: or members)? into (?:\d+ )?followers\b|\binto \d+ followers\b/i,
    def: 'Trade resources or members for followers with a White space or member (Exchange, Cash In, Farewell…). Recruiting followers in your recruit step is not turning.' },
  { key: 'now and at round start', word: 'Now and at round start', match: /\bnow and at (?:round start|the start of round)/i,
    def: 'Happens once when you recruit the member, then again each time a later round starts.' },
  { key: 'copy', word: 'Copy', match: /\bcop(y|ies|ied)\b(?= (?:any|every|one|the|it|that|what|a)\b)|\bwhat you copy\b|\bcopy a space\b/,
    def: 'Copy an action: get its own printed gain (what its chip shows). Members’ bonuses on it and its gifts to others don’t repeat. Its taker keeps what they got. Copying a copy lets you choose again; never choose an action already in that chain. Each green action gives +1 green, including when copied. Agents blocks everyone from copying its owner’s actions. Echo copies the previous action, Encore an action with a rival minion, Reprise one with your minion, and Greatest Hits every action with your minion.' },
  { key: 'face-up', word: 'Face-up', match: /\bface-up\b/,
    def: 'The members in the shop that everyone can see. When one leaves, the pile refills the row.' },
  { key: 'pile', word: 'Pile', match: /\b(?:the|of the) pile\b/,
    def: 'The face-down deck the shop refills from. Swept members go to its bottom; the market also refreshes between rounds.' },
  { key: 'once per round', word: 'Once per round', match: /\bonce per round\b/i,
    def: 'Usable one time each round; it comes back when the next round starts.' },
  { key: 'once per game', word: 'Once per game', match: /\bonce per game\b/i,
    def: 'Usable one time in the whole game.' },
  { key: 'round start', word: 'Round start', match: /\bround start\b/i,
    def: 'When a round begins, before anyone places a minion.' },
  { key: 'round end', word: 'Round end', match: /\bround end\b/i,
    def: 'After the round’s last minion is placed. Round-end abilities happen first, then each quadrant’s contest is scored.' },
  { key: 'game end', word: 'Game end', match: /\bgame end\b/i,
    def: 'After round III is scored. Game-end bonuses are added, then the most followers wins (ties: more members).' },
  { key: 'when recruited', word: 'On recruit', match: /\bon recruit\b|\bwhen recruited\b|\bwhen it joins you\b/i,
    def: 'Happens when the member joins your cult by your own doing, paid or free: recruit, take or swap (your own red action). Being given a member does not trigger it, and a rival moving it into your cult doesn’t either.' },
  // Cory, 2026-10-21: what "recruit" means on every card that says "whenever you recruit"
  { key: 'recruit', word: 'Recruit', match: /\bwhenever you recruit\b/i,
    def: 'Bring a member or followers into your cult by your own doing: recruit or take a member (paid or free), swap one in with your own red action, or recruit followers (each follower purchase is one recruit). A member a rival moves into your cult isn’t your recruit.' },
  { key: 'rival', word: 'Rival', link: false, match: /\brivals?’?s?\b/,
    def: 'Any other player.' },
  { key: 'leader', word: 'Leader', match: /\bthe leader\b/,
    def: 'The player with the most followers right now. Tied players all count as leaders.' },
  { key: 'minions on the board', word: 'Minions on the board', match: /\b(?:minions?|workers?) on the board\b/,
    def: 'Your minions on spaces this round, including a space you joined. They all come back when the round ends.' },
  { key: 'next member costs less', word: 'Next member costs less', match: /\bnext member costs \d+ less\b/,
    def: 'A discount: the next member you recruit that costs something is that much cheaper (colored part first). It waits until you use it.' },
  { key: 'steal', word: 'Steal', match: /\bsteals?\b/,
    def: 'Take resources or a member from a rival. Stolen resources keep their colors. Lie Low protects your members and resources until round end; some members stop steals too.' },
  { key: 'colorless', word: 'Colorless', match: /\bcolou?rless\b/,
    def: 'A member of no color (a guest card). Its whole cost is paid in any colors. Its member quantity still counts, but never toward a color, and it brings nothing to cards that pay “its color”.' },
  { key: 'any', word: 'Any (cost)', link: false, match: /\bin any colors\b/,
    def: '“Any” in a cost or a gain: resources of any colors, your choice.' },
  { key: 'contest', word: 'Contest', match: /\bcontests?\b/,
    def: `Each quadrant’s round-end rule. Whoever leads it when the round ends gains ${rings} followers in rounds I / II / III; tied leaders each gain half the prize. You need at least 1 of what it counts.` },
  { key: 'snake order', word: 'Snake order', match: /\bsnake order\b/,
    def: `Turns go first to last, then last to first, and so on, one minion each turn (${WORKERS.join(' / ')} minions in rounds I / II / III). Fewest followers picks first from round II.` },
  { key: 'effect', word: 'Effects', link: false, match: /\beffects?\b/,
    def: 'Followers gained from members’ abilities during play (not what members are worth, not buys, not contests).' },
];

const BY_KEY = Object.fromEntries(GLOSSARY.map(t => [t.key, t]));

// Every space and member in the deck right now (cut cards left out), read from the cards themselves, so the
// glossary's card lists can't lag a redesign (Cory, 2026-10-23: "has the glossary not been updated?").
function liveCards() {
  const out = [];
  for (const id of allQuadrantIds()) {
    const q = quadrant(id);
    if (q.standIn) continue;
    for (const a of q.actions) out.push({ name: a.name, text: a.text || '' });
    for (const m of q.members) if (!CUT.has(m.id)) out.push({ name: m.name, text: m.text || '' });
  }
  for (const m of guestMembers()) if (!CUT.has(m.id)) out.push({ name: m.name, text: m.text || '' });
  return out;
}
/** Cards in the deck whose text uses a term, by name. */
export function cardsUsing(t) {
  const re = new RegExp(t.match.source, 'i'); // a card's first word is capitalized ("Steal 1 resource")
  return [...new Set(liveCards().filter(c => re.test(c.text)).map(c => c.name))];
}
/** The glossary as the rules show it: every term but legacy rules, each keyword with the cards in the deck that use
 *  it today ({ ...term, cards: [names], out }; common words list none). out: a card word no card in the deck uses
 *  right now (its cards were cut), kept and marked so (Cory, 2026-10-23: show what's in and what's not). */
export function glossaryEntries() {
  return GLOSSARY.filter(t => !t.legacy).map(t => {
    const cards = t.link === false ? [] : cardsUsing(t);
    return { ...t, cards, out: !!t.card && !cards.length };
  });
}
/** "Sleep In, Hold Up, Last Call and 3 more" */
export const cardList = (names, most = 6) => names.length <= most ? names.join(', ')
  : `${names.slice(0, most).join(', ')} and ${names.length - most} more`;
/** The glossary entry for a key ('full set', 'plant'…), or null. */
export const term = key => BY_KEY[key] || null;

/**
 * Splits rules text into plain parts and keyword parts: [{ text, key? }]. Only linkable terms are marked, each at
 * most once per text (the first time it appears), so a card's text isn't a wall of underlines.
 */
export function splitTerms(text) {
  if (!text) return [];
  const hits = [];
  for (const t of GLOSSARY) {
    if (t.link === false) continue;
    const re = new RegExp(t.match.source, t.match.flags.includes('i') ? 'i' : '');
    const m = re.exec(text);
    if (m && m[0]) hits.push({ at: m.index, end: m.index + m[0].length, key: t.key });
  }
  hits.sort((a, b) => a.at - b.at || b.end - a.end);
  const out = [];
  let last = 0;
  for (const h of hits) {
    if (h.at < last) continue; // overlapping: the earlier (longer) one wins
    if (h.at > last) out.push({ text: text.slice(last, h.at) });
    out.push({ text: text.slice(h.at, h.end), key: h.key });
    last = h.end;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
