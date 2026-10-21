// The information layer: card names, keywords, colorless members and picker details (Info.jsx, glossary.js).
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup, within } from '@testing-library/react';
import { createGame, cardDef, defById, allQuadrantIds, quadrant } from '../../../engine/v4/index.js';
import { guestMembers } from '../../../engine/v4/content/index.js';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { SeatCard } from '../../../v4/game/HoverCards.jsx';
import { Log, ChoicePrompt, CardFace } from '../../../v4/game/parts.jsx';
import { MemberCard, NamedText, CardText } from '../../../v4/game/Info.jsx';
import { memberTimingWords } from '../../../v4/game/memberTiming.js';
import { GLOSSARY, splitTerms, term } from '../../../v4/glossary.js';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const MARKET = ['gold', 'red', 'market', 'echo'];
const price = d => d.s + d.w;
const none = () => null;

/** A market table with one member (not face up) held by Bo. */
function marketState() {
  const s = createGame({ seats, seed: 5, quadrants: MARKET });
  const all = Object.keys(s.cards).map(Number);
  const held = all.find(u => !s.shop.includes(u));
  s.pile = all.filter(u => !s.shop.includes(u) && u !== held);
  s.players[1].members = [held];
  return { s, held };
}

// Ported from the retired Shop.jsx / Players.jsx to what the table shows now: the shop strip (ShopCards), each cult at
// the table (CultSeat: its member figures and their cards) and a cult's card (SeatCard: its member list).
describe('a member\'s card opens wherever the member shows', () => {
  it('the shop strip shows every face-up card; a rival\'s figure and cult card open the member; the card face omits redundant ownership', () => {
    const { s, held } = marketState();
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} optionFor={none} onPick={() => {}} />);
    expect(container.querySelectorAll('.card[data-uid]').length).toBe(s.shop.length);
    cleanup();
    // a rival's cult at the table: tap a member's figure and its card opens
    const bo = cardDef(s, held);
    const seat = render(<CultSeat state={s} pid={1} me={0} />);
    const fig = seat.container.querySelector(`[data-member="${bo.id}"] .fig`);
    expect(fig).not.toBeNull();
    fireEvent.click(fig);
    const tip = document.querySelector('[data-tip-body]');
    expect(tip.querySelector(`[data-card="${bo.id}"]`)).not.toBeNull();
    cleanup();
    // the rival's cult card lists its members by name
    const sc = render(<SeatCard state={s} pid={1} meId={0} />);
    expect(sc.container.querySelector(`[data-card-name="${bo.id}"]`)).not.toBeNull();
    cleanup();
    const face = render(<CardFace state={s} uid={held} />);
    expect(face.container.querySelector('.owner')).toBeNull();
    expect(face.container.textContent).not.toMatch(/Bo’s/);
    cleanup();
    s.cards[held].used = true;
    const used = render(<CardFace state={s} uid={held} />);
    expect(used.container.querySelector('[data-member-used]').textContent).toBe('Used');
  });
});

describe('card names open the card everywhere', () => {
  it('a member named in the log opens its full card', () => {
    const { s, held } = marketState();
    const d = cardDef(s, held);
    s.log.push(`Bo recruited ${d.name} (8 blue).`);
    const { container } = render(<Log state={s} />);
    const name = [...container.querySelectorAll('.card-name')].find(e => e.textContent.startsWith(d.name));
    expect(name).toBeTruthy();
    fireEvent.click(name);
    const body = document.querySelector('[data-tip-body]');
    expect(body.querySelector(`[data-card="${d.id}"]`)).not.toBeNull();
    expect(body.textContent).toContain(d.name);
  });

  it('bonus lines name their members ("Snob +3")', () => {
    const { s } = marketState();
    const snob = quadrant('market').members.find(m => m.key === 'snob');
    const { container } = render(<NamedText state={s} text={`${snob.name} +3, ${snob.name} +1`} />);
    expect(container.querySelectorAll('.card-name')).toHaveLength(2);
  });

  it('a picker of rivals\' members shows each one\'s owner and cost (Shake Down)', () => {
    const { s, held } = marketState();
    const d = cardDef(s, held);
    s.pending = { player: 0, kind: 'choose', prompt: 'Shake Down: choose a member.', options: [{ id: `card:${held}`, label: `Bo's ${d.name} (${price(d)})`, kind: 'member', value: held }] };
    const { container } = render(<ChoicePrompt state={s} onPick={() => {}} busy={false} />);
    // the member is picked on the board now; the keyboard list (opened from "Pick from a list") still names owner and cost
    const open = container.querySelector('.pick-keys-open');
    if (open) fireEvent.click(open);
    const btn = container.querySelector('.pick-keys [data-option]') || container.querySelector('[data-option]');
    expect(btn.textContent).toContain('Bo’s');
    // the cost in dots, as the card prints it, never color words (wave-2 tester B #54)
    expect(btn.querySelector('.cost-line').textContent).toMatch(/^costs \d/);
    expect(btn.querySelector('.cost-line .pip')).not.toBeNull();
    expect(btn.querySelector('.cost-line').textContent).not.toMatch(/gold|red|blue|green|magenta|any/);
  });
});

describe('colorless members', () => {
  it('a member whose quadrant is off the table has a neutral frame and says "colorless"', () => {
    const s = createGame({ seats, seed: 5 }); // gold, red, blue, green: no Magenta
    const squatter = guestMembers().find(g => g.lean === 'thieves');
    const { container } = render(<MemberCard state={s} def={squatter} />);
    expect(container.querySelector('.card-face').getAttribute('style')).toContain('var(--colorless)');
    // no "its color isn't on this table" line (Cory, 2026-10-18): guests are colorless, the frame says so
    expect(container.querySelector('[data-colorless]')).toBeNull();
    expect(container.textContent).not.toMatch(/isn’t on this table/);
    expect(container.querySelector('.mc-cost').textContent).not.toMatch(/colorless/i);
    cleanup();
    const ok = render(<MemberCard state={s} def={quadrant('gold').members[0]} />);
    expect(ok.container.querySelector('.card-face').getAttribute('style')).toContain('var(--gold)');
    expect(ok.container.textContent).not.toMatch(/colorless/i);
  });

  it('a member you use says so first, and in the shop how (w3a #5)', () => {
    const s = createGame({ seats, seed: 5 });
    const use = render(<MemberCard state={s} def={defById('gold.speculator')} />);
    expect(use.container.querySelector('.mc-text').textContent).toMatch(/^UseOnce per game/);
    cleanup();
    const plain = render(<MemberCard state={s} def={defById('gold.banker')} />);
    expect(plain.container.querySelector('[data-use-tag]')).toBeNull();
    cleanup();
    const uid = Object.values(s.cards).find(c => c.def === 'gold.speculator').uid;
    if (!s.shop.includes(uid)) { s.pile = s.pile.filter(u => u !== uid); s.shop[0] = uid; }
    const shop = render(<MemberCard state={s} uid={uid} me={0} onFace />);
    expect(shop.container.querySelector('[data-use-how]').textContent).toMatch(/use it on your turn/);
  });

  it('a shop card\'s hover doesn\'t repeat the cost and worth printed on its face (w3a #24)', () => {
    const s = createGame({ seats, seed: 5 });
    const uid = s.shop.find(u => (s.cards[u] && cardDef(s, u).n || 1) === 1);
    const face = render(<MemberCard state={s} uid={uid} onFace />);
    expect(face.container.querySelector('.mc-cost')).toBeNull();
    expect(face.container.querySelector('.mc-worth')).toBeNull();
    cleanup();
    const away = render(<MemberCard state={s} uid={uid} />); // a name in the log, a seat: the card says it all
    expect(away.container.querySelector('.mc-cost').textContent).toMatch(/^costs/);
    expect(away.container.querySelector('.mc-worth')).not.toBeNull();
  });
});

describe('keyword glossary: one source, every keyword in the cards defined', () => {
  it('every linkable keyword found in any card or space text has a definition, and opens it', () => {
    const texts = [];
    for (const id of allQuadrantIds()) { const q = quadrant(id); texts.push(...q.actions.map(a => a.text), ...q.members.map(m => m.text)); }
    texts.push(...guestMembers().map(g => g.text));
    const found = new Set();
    for (const t of texts) for (const part of splitTerms(t)) if (part.key) found.add(part.key);
    // 'face-up' left the card texts with Blue's Oct 20 rework (its spaces say "shop member"); the pile is Blue's word now
    // 'in play' left with Patron Saint's rewording (Cory's wording pass, 2026-10-21: "per 2 silver members, anyone’s")
    for (const k of ['full set', 'plant', 'worth', 'extra turn', 'copy', 'set aside', 'once per round', 'pile']) expect(found.has(k), k).toBe(true);
    for (const k of found) expect(term(k)?.def?.length, k).toBeGreaterThan(20);
    // Keys are unique; legacy card text can still explain Release without teaching it as normal play.
    expect(new Set(GLOSSARY.map(t => t.key)).size).toBe(GLOSSARY.length);
    expect(term('release').legacy).toBe(true);
    expect(term('release').def).toMatch(/unavailable in normal play/);
    const { container } = render(<CardText text={quadrant('yellow').members.find(m => m.key === 'harmonist').text} />);
    const u = container.querySelector('[data-term="full set"]');
    expect(u).not.toBeNull();
    fireEvent.click(u);
    expect(document.querySelector('[data-tip-body]').textContent).toMatch(/One resource of each color/);
  });
});
void defById; void within;

describe('"You\'d get" on a space (the engine\'s dry run)', () => {
  it('shows the exact gain for a plain space, and no pick note when the pick changes nothing of yours', async () => {
    const { waitFor } = await import('@testing-library/react');
    const { YoudGet } = await import('../../../v4/game/Info.jsx');
    let s = createGame({ seats, seed: 9, quadrants: ['gold', 'red', 'market', 'echo'] });
    const { applyMove, chooseBotMove } = await import('../../../engine/v4/index.js');
    while (s.pending.kind !== 'place') s = applyMove(s, chooseBotMove(s, () => 0.3));
    const pid = s.pending.player;
    const echo = s.quadrants.indexOf('echo'), hum = quadrant('echo').actions.findIndex(a => a.key === 'hum');
    const one = render(<YoudGet state={s} pid={pid} q={echo} i={hum} />);
    await waitFor(() => expect(one.container.querySelector('[data-youd-get]').dataset.youdGet).toBe('+1 green'));
    cleanup();
    const gold = s.quadrants.indexOf('gold'), jv = quadrant('gold').actions.findIndex(a => a.key === 'jv');
    const two = render(<YoudGet state={s} pid={pid} q={gold} i={jv} />);
    await waitFor(() => expect(two.container.querySelector('[data-youd-get]').dataset.youdGet).toBe('+3 gold'));
    // the rival's +1 gold (Kickback's gift) shows too, as a gold pip
    expect(two.container.querySelector('.youd-others').textContent).toMatch(/rivals \+1/);
    expect(two.container.querySelector('.youd-others .pip').getAttribute('aria-label')).toBe('gold');
    // who gets the gift doesn't change what you get: no "you choose how" note (the rule above says it; design pod)
    expect(two.container.textContent).not.toMatch(/you choose how|your pick/);
  });

  it('minions on the board carry their seat: one emoji per seat, never color alone', async () => {
    const { default: Wheel } = await import('../../../v4/game/Wheel.jsx');
    const s = createGame({ seats, seed: 5 });
    s.round = 1; s.slots = { '0-0': 0, '1-0': 1, '2-0': 2 };
    const { container } = render(<Wheel state={s} legal={new Map()} onPick={() => {}} flash={new Set()} facing={0} onFacing={() => {}} />);
    const figs = [...container.querySelectorAll('.worker-fig')];
    expect(figs.map(f => f.dataset.seat).sort()).toEqual(['0', '1', '2']);
    const emojis = new Set(figs.map(f => f.querySelector('[data-emoji]')?.dataset.emoji));
    expect(emojis.size).toBe(3); // three seats, three different emojis
  });
});

describe('How to play lists the glossary', () => {
  it('every glossary term is defined on the How to play page', async () => {
    const { default: HowToPlay } = await import('../../../v4/HowToPlay.jsx');
    const { container } = render(<HowToPlay onClose={() => {}} />);
    const dts = [...container.querySelectorAll('[data-glossary] dt')].map(e => e.textContent);
    expect(dts).toEqual(GLOSSARY.filter(t => !t.legacy).map(t => t.word));
    expect(container.querySelector('[data-glossary]').textContent).toMatch(/Full set/);
    expect(dts).not.toContain('Release');
    expect(container.textContent).not.toContain('Released members');
  });
});

// v0.5 timing stays consistent between a member card and the seat list, without changing engine text.
it('member timing names recruitment and round starts precisely', () => {
  expect(memberTimingWords('Now and at round start, +3 gold.')).toBe('On recruit and at round start, +3 gold.');
  expect(memberTimingWords('When recruited: +2 red.')).toBe('On recruit: +2 red.');
  expect(memberTimingWords('Round start: plant any yellow.')).toBe('At round start: plant any yellow.');
  const { container } = render(<CardText text="Now and at round start, +3 gold." />);
  expect(container.textContent).toMatch(/^On Recruit and Round Start/);
  expect(container.textContent).not.toMatch(/Now/);
});


describe('shop discount origin', () => {
  it('opens a named breakdown on tap, with an honest fallback for legacy discounts', () => {
    const { s } = marketState();
    s.players[0].discount = 6;
    s.players[0].discountSources = [{ name: 'Intro Offer', n: 4 }, { name: 'Planner', n: 2 }];
    const { getByRole } = render(<ShopCards state={s} me={0} mySeats={[0]} optionFor={none} onPick={() => {}} />);
    fireEvent.click(getByRole('button', { name: 'Discount sources' }));
    const body = document.querySelector('[data-tip-body]');
    expect(body.textContent).toContain('Intro Offer: next member −4');
    expect(body.textContent).toContain('Planner: next member −2');
  });
});


it('glossary matches confirmed member quantity, protection and recruit rules', () => {
  expect(term('member').def).toContain('printed follower value');
  expect(term('member').def).toContain('larger member count');
  expect(term('member').def).toContain('Bonus followers do not add members');
  expect(term('colorless').def).not.toContain('one of your members');
  expect(term('steal').def).toContain('protects your members and resources until round end');
  expect(term('when recruited').def).toContain('paid or free');
  expect(term('when recruited').def).toContain('recruit, take or swap');
  expect(term('when recruited').def).toContain('Being given a member does not trigger it.');
});
