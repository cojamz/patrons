// Cory, 2026-10-15: the seat card "should cleanly show a list of member ability/passives, if they've been activated",
// and "I still don't know how to activate a member / the UI for it". Every use-once member in content (a def with
// `activate`) goes through one flow: lit with "ready to use" and a "Use: …" button on your turn, the engine's own dry
// run saying what it gives, then "used" after. A rival's members show their state, never a button.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { allQuadrantIds, quadrant, applyMove } from '../../../engine/v4/index.js';
import { resume } from '../../../engine/v4/core.js';
import { table, uidIn } from '../../engine/v4/cards-helpers-b.js';
import { memberRows, useNow, usableNow, safeThisRound } from '../../../v4/game/memberUse.js';
import { SeatMembers, MemberActions } from '../../../v4/game/MemberUse.jsx';
import { promptFor } from '../../../v4/format.js';
import { gainsBetween } from '../../../v4/game/gains.js';

afterEach(cleanup);
const optionsOf = s => { const m = new Map((s.pending ? s.pending.options : []).map(o => [o.id, o])); return id => m.get(id) || null; };
// every use-once member on any table, with a table it can sit on (its own quadrant plus three others)
const USE_ONCE = allQuadrantIds().flatMap(q => quadrant(q).members.filter(m => m.activate).map(m => ({ q, id: m.id, name: m.name, activate: m.activate })));
const others = q => allQuadrantIds().filter(x => x !== q && ['gold', 'echo', 'trading', 'purple', 'silver', 'yellow'].includes(x)).slice(0, 3);

describe('every use-once member goes through the one flow', () => {
  it('finds the use-once members in content', () => {
    expect(USE_ONCE.length).toBeGreaterThanOrEqual(10);
  });
  for (const m of USE_ONCE) {
    it(`${m.name}: a "use" row, a dry run that matches the engine, then "used"`, () => {
      const s = table([m.q, ...others(m.q)], { members: [[m.id]], res: [{}, {}], bonus: [3, 0] });
      for (const r of s.resources) { s.players[0].res[r] = 6; s.players[1].res[r] = 6; }
      const uid = uidIn(s, m.id, 0);
      expect(s.pending.player).toBe(0);
      const row = memberRows(s, 0, 0, optionsOf(s)).find(r => r.uids.includes(uid));
      expect(row.kind).toBe('use');
      expect(row.text.length).toBeGreaterThan(10); // the whole sentence, uncut
      const u = useNow(s, 0, uid);
      expect(u).not.toBeNull();
      expect(u.option).toBe(`use:${uid}`);
      if (u.blocked) {
        expect(row.tag.text).toBe('can’t use now');
        expect(usableNow(s, 0).map(x => x.uid)).not.toContain(uid);
        return;
      }
      if (u.idle) {
        // worth nothing now: never lit, never named in the prompt, a muted "Use: +0" with the reason (w2b #19)
        expect(row.tag.text).toBe('nothing to gain now');
        expect(u.label).toBe('Use: +0');
        expect(u.why.length).toBeGreaterThan(5);
        expect(usableNow(s, 0).map(x => x.uid)).not.toContain(uid);
        return;
      }
      expect(row.tag).toEqual({ text: 'ready to use', tone: 'lit' });
      expect(u.label).toMatch(/^Use(: | now)/);
      // the label is what the engine does: resources and followers after the same move
      const after = applyMove(s, { player: 0, option: u.option });
      for (const r of s.resources) {
        const d = after.players[0].res[r] - s.players[0].res[r];
        if (d) expect(u.words).toContain(`${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`);
      }
      expect(after.cards[uid].used).toBe(true);
      const used = memberRows(after, 0, 0, optionsOf(after)).find(r => r.uids.includes(uid));
      expect(used.used).toBe(true);
      expect(used.tag.text).toBe(m.activate === 'round' ? 'used this round' : 'used');
      expect(used.use).toBeNull();
    });
  }
});

describe('the seat card list', () => {
  const scene = () => {
    const s = table(['gold', 'echo', 'trading', 'purple'], {
      members: [['gold.jackpot', 'gold.speculator', 'gold.midas', 'gold.banker', 'gold.prospector', 'gold.tycoon', 'trading.pawnbroker'], ['echo.hourglass']],
      res: [{ gold: 2 }, { gold: 7 }],
    });
    s.cards[uidIn(s, 'gold.speculator', 0)].used = true;
    return resume(s); // the waiting step sees it used

  };
  it('one row per member with its whole sentence and its state; use-once first; Use only on your own', () => {
    const s = scene();
    const pick = [];
    const { container } = render(<SeatMembers state={s} pid={0} me={0} optionFor={optionsOf(s)} onPick={id => pick.push(id)} />);
    const rows = [...container.querySelectorAll('[data-member-row]')];
    expect(rows.map(r => r.dataset.memberRow).slice(0, 3)).toEqual(['gold.jackpot', 'gold.speculator', 'trading.pawnbroker']);
    const by = id => container.querySelector(`[data-member-row="${id}"]`);
    expect(by('gold.jackpot').dataset.state).toBe('ready');
    expect(by('gold.jackpot').querySelector('[data-use]').textContent).toMatch(/^Use: \+7/);
    expect(by('gold.speculator').dataset.state).toBe('used');
    expect(by('gold.speculator').textContent).toContain('used');
    expect(by('trading.pawnbroker').dataset.state).toBe('blocked'); // nothing to sell: no button
    expect(by('trading.pawnbroker').querySelector('[data-use]')).toBeNull();
    expect(by('gold.midas').querySelector('[data-switch]').dataset.switch).toBe('on');
    expect(by('gold.banker').textContent).toContain('pays at round start');
    expect(by('gold.tycoon').textContent).toContain('scores at game end');
    // the sentences are whole (no "…")
    for (const r of rows) expect(r.querySelector('[data-ability]').textContent).not.toMatch(/…$/);
    fireEvent.click(by('gold.jackpot').querySelector('[data-use]'));
    expect(pick).toEqual([`use:${uidIn(s, 'gold.jackpot', 0)}`]);
    cleanup();
    // a rival's card: their states, never a button
    const r = render(<SeatMembers state={s} pid={1} me={0} />);
    expect(r.container.querySelector('[data-use]')).toBeNull();
    expect(r.container.querySelector('[data-member-row="echo.hourglass"]').textContent).toContain('once a round');
  });
  it('the member\'s own hover: the big Use button, or why not', () => {
    const s = scene();
    const a = render(<MemberActions state={s} uid={uidIn(s, 'gold.jackpot', 0)} me={0} optionFor={optionsOf(s)} onPick={() => {}} />);
    expect(a.container.querySelector('[data-use]').className).toContain('big');
    cleanup();
    const b = render(<MemberActions state={s} uid={uidIn(s, 'trading.pawnbroker', 0)} me={0} optionFor={optionsOf(s)} onPick={() => {}} />);
    expect(b.container.textContent).toMatch(/Can’t use it now: no loose followers/);
    cleanup();
    const c = render(<MemberActions state={s} uid={uidIn(s, 'echo.hourglass', 1)} me={0} optionFor={optionsOf(s)} onPick={() => {}} />);
    expect(c.container.textContent).toBe('');
  });
  it('the prompt names only what would do something, once', () => {
    const s = scene();
    expect(promptFor(s, true).sub).toBe('…or use Lottery Winner first'); // not Pawnbroker (nothing to sell), not Speculator (used)
  });
  it('what a used member gives flies from that member', () => {
    const s = scene();
    const uid = uidIn(s, 'gold.jackpot', 0);
    const after = applyMove(s, { player: 0, option: `use:${uid}` });
    const moves = gainsBetween(s, after);
    expect(moves.some(m => m.what === 'res' && m.r === 'gold' && m.n === 7 && m.from.kind === 'member' && m.from.def === 'gold.jackpot')).toBe(true);
  });
});

describe('threats you can see coming (w2b #19, #21)', () => {
  it('a use worth nothing now is muted with its reason; Lie Low reads "safe this round"', () => {
    const s = table(['gold', 'echo', 'trading', 'thieves'], { members: [['thieves.bigscore'], ['echo.hourglass']], res: [{ magenta: 0 }, { magenta: 1 }] });
    const uid = uidIn(s, 'thieves.bigscore', 0);
    const u = useNow(s, 0, uid);
    expect(u.idle).toBe(true);
    expect(u.label).toBe('Use: +0');
    expect(u.why).toMatch(/Safecracker found no magenta/);
    expect(promptFor(s, true).sub || '').not.toMatch(/Safecracker/);
    const { container } = render(<MemberActions state={s} uid={uid} me={0} optionFor={optionsOf(s)} onPick={() => {}} />);
    expect(container.querySelector('[data-use]').dataset.idle).toBe('1');
    expect(container.textContent).toMatch(/Nothing to gain now: Safecracker found no magenta/);
    cleanup();
    expect(safeThisRound(s, 1)).toBe(false);
    s.players[1].hideout = s.round;
    const t = structuredClone(s);
    expect(safeThisRound(t, 1)).toBe(true);
    expect(safeThisRound(t, 0)).toBe(false);
  });
});
