// A sphere's setup hint says its round I spaces in words: the follower mark reads "follower" after a 1 and
// "followers" otherwise (plain-words pass: Sob Story read "+1 per rival with more follower").
import { describe, it, expect } from 'vitest';
import { sphereHint } from '../../../v4/screens/Screens.jsx';

describe('setup sphere hints', () => {
  it('pluralise the follower mark where the words are plural', () => {
    const t = sphereHint('trading');
    expect(t).toMatch(/with more followers/);
    expect(t).toMatch(/\+1 follower, or/);
    expect(t).not.toMatch(/@f|more follower\b/);
  });
});
