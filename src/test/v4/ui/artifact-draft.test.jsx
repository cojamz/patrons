// The artifact draft (Cory, 2026-10-25): what every artifact does without a hover; the only place to pick; taken ones leave.
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { createGame, applyMove, cardDef } from '../../../engine/v4/index.js';
import ArtifactDraft from '../../../v4/game/ArtifactDraft.jsx';
afterEach(cleanup);
const Q = ['red', 'purple', 'echo', 'market'];
const start = () => createGame({ seats: Q.map((_, i) => ({ name: `P${i + 1}` })), seed: 7, quadrants: Q, rules: { artifacts: true } });

it('lists every artifact with its words, and only your pick makes them buttons', () => {
  const s = start();
  const { container, rerender } = render(<ArtifactDraft state={s} onPick={() => {}} />);
  expect(container.querySelectorAll('[data-art-color]')).toHaveLength(4);
  for (const q of Q) expect(container.textContent).toContain(cardDef(s, s.artifacts[q]).name);
  expect(container.textContent).toContain('Whenever a player');
  expect(container.querySelector('button')).toBeNull();
  const onPick = vi.fn();
  rerender(<ArtifactDraft state={s} onPick={onPick} mine />);
  const b = container.querySelector('[data-art-color="purple"] button');
  fireEvent.click(b);
  expect(onPick).toHaveBeenCalledWith(s.pending.options.find(o => o.value === 'purple').id, b);
});

it('a taken artifact leaves the list, and the head says whose pick it is', () => {
  let s = start();
  const purple = s.pending.options.find(o => o.value === 'purple');
  s = applyMove(s, { player: s.pending.player, option: purple.id });
  const { container, rerender } = render(<ArtifactDraft state={s} onPick={() => {}} />);
  expect(container.querySelector('[data-art-color="purple"]')).toBeNull();
  expect(container.querySelectorAll('[data-art-color]')).toHaveLength(3);
  expect(container.querySelector('.ad-head').textContent).toContain(`${s.players[s.pending.player].name} is picking`);
  rerender(<ArtifactDraft state={s} onPick={() => {}} mine />);
  expect(container.querySelector('.art-draft.mine .ad-head').textContent).toMatch(/^Your pick/);
});
