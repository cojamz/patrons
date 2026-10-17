import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createGame, quadrant } from '../../../engine/v4/index.js';
import { requestPreviews, peekPreview, cancelPreviewFallback, _setPreviewWorker } from '../../../v4/game/Info.jsx';
import { usePreviewWarmup } from '../../../v4/game/HoverCards.jsx';

beforeEach(() => { vi.useFakeTimers(); _setPreviewWorker(false); });
afterEach(() => { cleanup(); _setPreviewWorker(null); vi.unstubAllGlobals(); vi.useRealTimers(); });
const fresh = () => {
 const state = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Other', kind: 'bot' }], seed: 7, quadrants: ['gold', 'red'] });
 state.round = 1;
 state.pending = { kind: 'place', player: 0, options: [] };
 return state;
};
const keys = () => quadrant('gold').actions.map((a,i) => a.ring === 1 ? `0-${i}` : null).filter(Boolean);
const peek = (s,k) => peekPreview(s,0,...k.split('-').map(Number));

// Cache results are the observable effect: an obsolete simulation must never run at all.
describe('preview fallback scheduler', () => {
 it('discards an old state before its queued simulations run', () => {
  const old = fresh(), latest = fresh(), list = keys();
  requestPreviews(old,0,list);
  requestPreviews(latest,0,[list[0]]);
  vi.runAllTimers();
  expect(list.every(k => peek(old,k) === undefined)).toBe(true);
  expect(peek(latest,list[0])).toBeTruthy();
  expect(vi.getTimerCount()).toBe(0);
 });

 it('deduplicates warmup requests and advances the hovered key ahead of the batch', () => {
  const state = fresh(), [first,hovered] = keys();
  requestPreviews(state,0,[first,hovered]);
  requestPreviews(state,0,[first,hovered]);
  requestPreviews(state,0,[hovered,hovered],{front:true});
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersToNextTimer();
  expect(peek(state,hovered)).toBeTruthy();
  expect(peek(state,first)).toBeUndefined();
  vi.runAllTimers();
  expect(peek(state,first)).toBeTruthy();
  expect(vi.getTimerCount()).toBe(0);
 });

 it('does not continue a partially completed obsolete batch', () => {
  const old = fresh(), latest = fresh(), [first,next] = keys();
  requestPreviews(old,0,[first,next]);
  vi.advanceTimersToNextTimer();
  expect(peek(old,first)).toBeTruthy();
  requestPreviews(latest,0,[first]);
  vi.runAllTimers();
  expect(peek(old,next)).toBeUndefined();
  expect(peek(latest,first)).toBeTruthy();
 });

 it('cancels the table warmup on unmount', () => {
  const state = fresh();
  function Warmup(){ usePreviewWarmup(state,0); return null; }
  const view = render(<Warmup />);
  view.unmount();
  vi.runAllTimers();
  expect(keys().every(k => peek(state,k) === undefined)).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
 });

 it('does not resurrect cancelled work when a previously healthy worker fails later', () => {
  const worker = { postMessage() {}, terminate:vi.fn() };
  _setPreviewWorker(worker);
  const state = fresh(), [first] = keys();
  requestPreviews(state,0,[first]);
  cancelPreviewFallback(state);
  worker.onerror(new Event('error'));
  vi.runAllTimers();
  expect(peek(state,first)).toBeUndefined();
  expect(worker.terminate).toHaveBeenCalledOnce();
 });

 it('yields background work to idle time and cancels that wait for a hover', () => {
  const idle = vi.fn(() => 42), cancelIdle = vi.fn();
  vi.stubGlobal('requestIdleCallback',idle);
  vi.stubGlobal('cancelIdleCallback',cancelIdle);
  const state = fresh(), [first,hovered] = keys();
  requestPreviews(state,0,[first,hovered]);
  expect(idle).toHaveBeenCalledOnce();
  requestPreviews(state,0,[hovered],{front:true});
  expect(cancelIdle).toHaveBeenCalledWith(42);
  vi.advanceTimersToNextTimer();
  expect(peek(state,hovered)).toBeTruthy();
  expect(peek(state,first)).toBeUndefined();
  cancelPreviewFallback(state);
 });
});
