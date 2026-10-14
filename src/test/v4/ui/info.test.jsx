// The information layer: badges, card names, keywords, colorless members and picker details (Info.jsx, glossary.js).
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup, within } from '@testing-library/react';
import { createGame, cardDef, defById, allQuadrantIds, quadrant } from '../../../engine/v4/index.js';
import { guestMembers } from '../../../engine/v4/content/index.js';
import { BADGE } from '../../../engine/v4/content/market.js';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { SeatCard } from '../../../v4/game/HoverCards.jsx';
import { Log, ChoicePrompt, CardFace } from '../../../v4/game/parts.jsx';
import { MemberCard, NamedText, CardText } from '../../../v4/game/Info.jsx';
import { GLOSSARY, splitTerms, term } from '../../../v4/glossary.js';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const MARKET = ['gold', 'red', 'market', 'echo'];
const price = d => d.s + d.w;
const none = () => null;

/** A market table with a badged and an unbadged member face up and one badged member held by Bo. */
function marketState() {
  const s = createGame({ seats, seed: 5, quadrants: MARKET });
  const all = Object.keys(s.cards).map(Number);
  const badged = all.filter(u => price(cardDef(s, u)) >= BADGE);
  const plain = all.filter(u => price(cardDef(s, u)) < BADGE);
  s.shop = [badged[0], plain[0], ...s.shop.filter(u => u !== badged[0] && u !== plain[0])].slice(0, 10);
  s.pile = all.filter(u => !s.shop.includes(u) && u !== badged[1]);
  s.players[1].members = [badged[1]];
  return { s, badged, plain };
}

// Ported from the retired Shop.jsx / Players.jsx to what the table shows now: the shop strip (ShopCards), each cult at
// the table (CultSeat: its member figures and their cards) and a cult's card (SeatCard: its member list).
describe('badges are visible wherever a card shows (Blue on the table)', () => {
  it('shop cards, a rival\'s cult and the card face carry ◆ only on badged members, and ◆ opens "badged"', () => {
    const { s, badged, plain } = marketState();
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} optionFor={none} onPick={() => {}} />);
    const card = uid => container.querySelector(`.card[data-uid="${uid}"]`);
    expect(card(badged[0]).querySelector('.badge-mark')).not.toBeNull();
    expect(card(plain[0]).querySelector('.badge-mark')).toBeNull();
    // every shown card agrees with the printed-cost rule
    const shown = container.querySelectorAll('.card[data-uid]');
    expect(shown.length).toBe(s.shop.length);
    for (const el of shown) {
      const d = cardDef(s, Number(el.dataset.uid));
      expect(!!el.querySelector('.badge-mark'), d.name).toBe(price(d) >= BADGE);
    }
    // inside a shop card (a control) the ◆ explains itself by its title (hover, long-press) and the card keeps the click
    const mark = card(badged[0]).querySelector('.badge-mark');
    expect(mark.getAttribute('title')).toMatch(new RegExp(`Badged.*${BADGE} or more`, 'i'));
    fireEvent.click(mark);
    expect(document.querySelector('[data-tip-body]')).toBeNull();
    cleanup();
    // a rival's cult at the table: the badged member's card (tap its figure) carries ◆
    const bo = cardDef(s, badged[1]);
    const seat = render(<CultSeat state={s} pid={1} me={0} />);
    const fig = seat.container.querySelector(`[data-member="${bo.id}"] .fig`);
    expect(fig).not.toBeNull();
    fireEvent.click(fig);
    const tip = document.querySelector('[data-tip-body]');
    expect(tip.querySelector(`[data-card="${bo.id}"]`)).not.toBeNull();
    expect(tip.querySelector('.badge-mark')).not.toBeNull();
    cleanup();
    // the rival's cult card lists its members by name, ◆ on the badged one
    const sc = render(<SeatCard state={s} pid={1} meId={0} />);
    const listed = sc.container.querySelector(`[data-card-name="${bo.id}"]`);
    expect(listed).not.toBeNull();
    expect(listed.querySelector('.badge-mark')).not.toBeNull();
    cleanup();
    const face = render(<CardFace state={s} uid={badged[1]} />);
    expect(face.container.querySelector('.badge-mark')).not.toBeNull();
    expect(face.container.textContent).toMatch(/Bo’s/); // the owner, on the card
  });

  // KNOWN GAP (harness port, 2026-10-14): the retired Players strip put ◆ on each rival member chip, so a Blue table
  // read "who holds badged members" at a glance. CultSeat's member figures carry no ◆ (only their opened card does).
  // Kept strict and marked as failing; when the figures get their ◆ this turns red: make it a plain `it`.
  it.fails('a rival\'s badged member carries ◆ at their seat without opening anything (KNOWN GAP: CultSeat figures)', () => {
    const { s, badged, plain } = marketState();
    s.players[1].members.push(plain[1]);
    const seat = render(<CultSeat state={s} pid={1} me={0} />);
    const at = uid => seat.container.querySelector(`[data-member="${cardDef(s, uid).id}"]`);
    expect(at(plain[1]).querySelector('.badge-mark')).toBeNull();
    expect(at(badged[1]).querySelector('.badge-mark')).not.toBeNull();
  });

  it('no badges on a table without Blue', () => {
    const s = createGame({ seats, seed: 5 });
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} optionFor={none} onPick={() => {}} />);
    expect(container.querySelectorAll('.card[data-uid]').length).toBe(s.shop.length);
    expect(container.querySelector('.badge-mark')).toBeNull();
  });
});

describe('card names open the card everywhere', () => {
  it('a member named in the log opens its full card', () => {
    const { s, badged } = marketState();
    const d = cardDef(s, badged[1]);
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
    const { s, badged } = marketState();
    const d = cardDef(s, badged[1]);
    s.pending = { player: 0, kind: 'choose', prompt: 'Shake Down: which member?', options: [{ id: `card:${badged[1]}`, label: `Bo's ${d.name} (${price(d)})`, kind: 'member', value: badged[1] }] };
    const { container } = render(<ChoicePrompt state={s} onPick={() => {}} busy={false} />);
    const btn = container.querySelector('[data-option]');
    expect(btn.textContent).toContain('Bo’s');
    expect(btn.textContent).toMatch(/Costs \d/);
  });
});

describe('colorless members', () => {
  it('a member whose quadrant is off the table has a neutral frame and says "colorless"', () => {
    const s = createGame({ seats, seed: 5 }); // gold, red, blue, green: no Magenta
    const squatter = guestMembers().find(g => g.lean === 'thieves');
    const { container } = render(<MemberCard state={s} def={squatter} />);
    expect(container.querySelector('.card-face').getAttribute('style')).toContain('var(--colorless)');
    expect(container.textContent).toMatch(/colorless/);
    cleanup();
    const ok = render(<MemberCard state={s} def={quadrant('gold').members[0]} />);
    expect(ok.container.querySelector('.card-face').getAttribute('style')).toContain('var(--gold)');
    expect(ok.container.textContent).not.toMatch(/colorless/);
  });
});

describe('keyword glossary: one source, every keyword in the cards defined', () => {
  it('every linkable keyword found in any card or space text has a definition, and opens it', () => {
    const texts = [];
    for (const id of allQuadrantIds()) { const q = quadrant(id); texts.push(...q.actions.map(a => a.text), ...q.members.map(m => m.text)); }
    texts.push(...guestMembers().map(g => g.text));
    const found = new Set();
    for (const t of texts) for (const part of splitTerms(t)) if (part.key) found.add(part.key);
    for (const k of ['badged', 'unbadged', 'full set', 'plant', 'in play', 'worth', 'extra turn', 'copy', 'set aside', 'once per round', 'face-up']) expect(found.has(k), k).toBe(true);
    for (const k of found) expect(term(k)?.def?.length, k).toBeGreaterThan(20);
    // keys are unique, and release (a base rule, not on cards) is defined too
    expect(new Set(GLOSSARY.map(t => t.key)).size).toBe(GLOSSARY.length);
    expect(term('release').def).toMatch(/bottom of the pile/);
    const { container } = render(<CardText text={quadrant('yellow').members.find(m => m.key === 'harmonist').text} />);
    const u = container.querySelector('[data-term="full set"]');
    expect(u).not.toBeNull();
    fireEvent.click(u);
    expect(document.querySelector('[data-tip-body]').textContent).toMatch(/One of each color/);
  });
});
void defById; void within;

describe('"You\'d get" on a space (the engine\'s dry run)', () => {
  it('shows the exact gain for a plain space, and a range plus "your choice" for a space that asks', async () => {
    const { waitFor } = await import('@testing-library/react');
    const { YoudGet } = await import('../../../v4/game/Info.jsx');
    let s = createGame({ seats, seed: 9, quadrants: ['gold', 'red', 'market', 'echo'] });
    const { applyMove, chooseBotMove } = await import('../../../engine/v4/index.js');
    while (s.pending.kind !== 'place') s = applyMove(s, chooseBotMove(s, () => 0.3));
    const pid = s.pending.player;
    const echo = s.quadrants.indexOf('echo'), hum = quadrant('echo').actions.findIndex(a => a.key === 'hum');
    const one = render(<YoudGet state={s} pid={pid} q={echo} i={hum} />);
    await waitFor(() => expect(one.container.querySelector('[data-youd-get]').dataset.youdGet).toBe('+3 green'));
    cleanup();
    const gold = s.quadrants.indexOf('gold'), jv = quadrant('gold').actions.findIndex(a => a.key === 'jv');
    const two = render(<YoudGet state={s} pid={pid} q={gold} i={jv} />);
    await waitFor(() => expect(two.container.querySelector('[data-youd-get]').dataset.youdGet).toBe('+3 gold'));
    // the rival's +1 gold (Kickback's gift) shows too, as a gold pip
    expect(two.container.querySelector('.youd-others').textContent).toMatch(/rivals \+1/);
    expect(two.container.querySelector('.youd-others .pip').getAttribute('aria-label')).toBe('gold');
    expect(two.container.textContent).toMatch(/you choose how/);
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
    expect(dts).toEqual(GLOSSARY.map(t => t.word));
    expect(container.querySelector('[data-glossary]').textContent).toMatch(/Badged/);
  });
});
