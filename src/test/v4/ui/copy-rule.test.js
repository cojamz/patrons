// @vitest-environment node
// The copy rule's words match the engine (panel tester C #2): a copy gives the space's own printed gain (its chip),
// never the taker's members' bonuses (Grand Host's double, Caterer) or its gifts to others. Greatest Hits copying a
// Grand Host's Toast gives the printed +9, as the engine does (interactions.test.js pins the engine side).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { GLOSSARY } from '../../../v4/glossary.js';

describe('the copy rule says what a copy gives', () => {
  it('the rulebook and the glossary say "printed gain", never "what it gave its taker"', () => {
    const book = readFileSync(new URL('../../../../design/rulebook.md', import.meta.url), 'utf8');
    const line = book.split('\n').find(l => /\*\*copy\*\*/.test(l));
    expect(line).not.toMatch(/what it gave its taker/);
    expect(line).toMatch(/own printed gain/);
    expect(line).toMatch(/member bonuses and gifts to others are not copied/);
    const copy = GLOSSARY.find(g => g.key === 'copy');
    expect(copy.def).toMatch(/printed gain/);
    expect(copy.def).not.toMatch(/as if you had taken it/);
    expect(copy.def).toMatch(/Copying a copy lets you choose again/);
    expect(copy.def).toMatch(/never choose an action already in that chain/);
    expect(copy.def).toMatch(/Agents stops rivals/);
    expect(copy.def).not.toMatch(/never copy another copy/);
  });
});
