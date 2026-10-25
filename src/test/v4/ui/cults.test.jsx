// A cult at the table (CultSeat): its leader, minions to place, members, follower total and resources; and the
// living cult: a member reacts when its own trace line appears, the leader when a minion is placed / a prize is won.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, followers, cardDef, quadrant } from '../../../engine/v4/index.js';
import CultSeat, { reactionsBetween } from '../../../v4/game/CultSeat.jsx';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const toPlace = s => { let t = s; for (let k = 0; k < 400 && !(t.pending && t.pending.kind === 'place' && t.round >= 1); k++) t = applyMove(t, chooseBotMove(t, () => 0.3)); return t; };

describe('CultSeat', () => {
  it('shows the leader with one floating minion per minion left, the members, the follower total and resources', () => {
    const s = toPlace(createGame({ seats, seed: 21 }));
    const banker = Object.values(s.cards).find(c => c.def === 'gold.banker');
    s.players[1].members.push(banker.uid);
    const { container } = render(<CultSeat state={s} pid={1} me={0} />);
    const ring = container.querySelector('[data-leader-ring="1"]');
    expect(Number(ring.dataset.left)).toBe(s.players[1].left);
    expect(container.querySelectorAll('[data-minion="1"]').length).toBe(s.players[1].left);
    expect(container.querySelector('[data-leader="1"]')).not.toBeNull(); // the anchor a placed minion flies from
    expect(container.querySelector('[data-member="gold.banker"]')).not.toBeNull();
    expect(container.querySelector('.cs-total').textContent).toContain(String(followers(s, s.players[1])));
    expect(container.querySelectorAll('[data-res]').length).toBe(s.resources.length);
    expect(container.textContent).not.toMatch(/★/);
  });

  it('a member hops when its trace line appears, and only that member', () => {
    const s0 = toPlace(createGame({ seats, seed: 22 }));
    const banker = Object.values(s0.cards).find(c => c.def === 'gold.banker');
    const crew = Object.values(s0.cards).find(c => cardDef(s0, c.uid).quadrant === 'red' && c.def !== 'gold.banker');
    s0.players[0].members.push(banker.uid, crew.uid);
    const s1 = { ...s0, log: [...s0.log, "Ana's Banker: +3 gold."] };
    const r = reactionsBetween(s0, s1, 0);
    expect(Object.keys(r.members)).toEqual(['gold.banker']);
    expect(reactionsBetween(s0, s1, 1)).toBeNull(); // Bo's cult didn't do anything
    const { container, rerender } = render(<CultSeat state={s0} pid={0} me={0} mine />);
    expect(container.querySelector('[data-member="gold.banker"]').dataset.react).toBeUndefined();
    act(() => { rerender(<CultSeat state={s1} pid={0} me={0} mine />); });
    expect(container.querySelector('[data-member="gold.banker"]').dataset.react).toBeTruthy();
    expect(container.querySelector(`[data-member="${cardDef(s0, crew.uid).id}"]`).dataset.react).toBeUndefined();
    // "(Ana's Retinue)" style lines (a gift to someone else) count too
    const s2 = { ...s0, log: [...s0.log, `Bo +1 silver (Ana's ${cardDef(s0, crew.uid).name}).`] };
    expect(Object.keys(reactionsBetween(s0, s2, 0).members)).toEqual([cardDef(s0, crew.uid).id]);
  });

  it('the leader gestures when a minion is placed, schemes on a recruit, celebrates a prize', () => {
    const s0 = toPlace(createGame({ seats, seed: 23 }));
    const pid = s0.pending.player;
    const s1 = applyMove(s0, { player: pid, option: s0.pending.options.find(o => o.kind === 'slot').id });
    expect(reactionsBetween(s0, s1, pid)?.leader).toBe('gesture');
    const rec = { ...s0, log: [...s0.log, `${s0.players[pid].name} recruited Banker (4 gold).`] };
    expect(reactionsBetween(s0, rec, pid).leader).toBe('scheme');
    const won = { ...s0, contests: [{ round: 1, prize: 2, results: [{ qid: 'gold', winners: [pid], rows: [] }] }] };
    expect(reactionsBetween({ ...s0, contests: [] }, won, pid).leader).toBe('celebrate');
    void quadrant;
  });
});

describe('every member reads as its sphere', () => {
  it('a member whose art is mostly neutral (or a silver/white one) stands on a strong ground in its color', async () => {
    const { sphereShare, spriteId } = await import('../../../v4/art/index.js');
    const { allQuadrantIds } = await import('../../../engine/v4/index.js');
    const s = toPlace(createGame({ seats, seed: 24, quadrants: ['gold', 'red', 'silver', 'echo'] }));
    const silver = Object.values(s.cards).find(c => cardDef(s, c.uid).quadrant === 'silver');
    const gold = Object.values(s.cards).find(c => cardDef(s, c.uid).quadrant === 'gold' && sphereShare([c.def, spriteId(cardDef(s, c.uid).name)]) >= 0.33);
    s.players[1].members.push(silver.uid, ...(gold ? [gold.uid] : []));
    const { container } = render(<CultSeat state={s} pid={1} me={0} />);
    const sv = container.querySelector(`[data-member="${cardDef(s, silver.uid).id}"]`);
    expect(sv.dataset.sphere).toBe('silver');
    expect(sv.querySelector('.aura.strong')).not.toBeNull();
    if (gold) expect(container.querySelector(`[data-member="${cardDef(s, gold.uid).id}"] .aura:not(.strong)`)).not.toBeNull();
    // no member anywhere has art with no sphere color at all and no ground (the share is measured for every one)
    for (const id of allQuadrantIds()) for (const d of quadrant(id).members) expect(sphereShare([d.id, spriteId(d.name)])).toBeGreaterThanOrEqual(0);
  });

  it('every member of a real sphere (and every guest) has its own drawing, not the hooded template', async () => {
    // a new or renamed member without art fails here (Night Owl and Revelers were caught missing, 2026-10-14)
    const { iconFor, spriteId } = await import('../../../v4/art/index.js');
    const { allQuadrantIds } = await import('../../../engine/v4/index.js');
    const { guestMembers } = await import('../../../engine/v4/content/index.js');
    const defs = [...allQuadrantIds().filter(id => !quadrant(id).standIn).flatMap(id => quadrant(id).members), ...guestMembers()];
    expect(defs.length).toBeGreaterThan(100);
    expect(defs.filter(d => !d.artifact && !iconFor([d.id, spriteId(d.name)], 'member').drawn).map(d => d.id)).toEqual([]);
  });

  it('every color with an artifact has its artifact drawn (an object on a plate, never the template)', async () => {
    const { iconFor } = await import('../../../v4/art/index.js');
    const { ARTIFACTS } = await import('../../../engine/v4/core.js');
    expect(Object.keys(ARTIFACTS).filter(q => !iconFor(`artifact.${q}`, 'artifact').drawn)).toEqual([]);
  });
});
