// A room on another release: the page finds where that release is still published (play/ or play/v/<version>/).
import { describe, it, expect } from 'vitest';
import { oldBuildUrl } from '../../../v4/oldBuild.js';

const site = served => async url => {
  const dir = url.split('build.json')[0];
  return served[dir] ? { ok: true, json: async () => ({ version: served[dir] }) } : { ok: false };
};
const at = (pathname, search = '') => ({ origin: 'https://x.io', pathname, search, hash: '' });

describe('oldBuildUrl', () => {
  const served = { '/patrons/play/': 'v0.8.60', '/patrons/play/v/v0.8.58/': 'v0.8.58' };
  it('sends the newest page to a kept older release, keeping the invite link', async () => {
    expect(await oldBuildUrl('v0.8.58', at('/patrons/play/', '?join=ABCD'), site(served))).toBe('https://x.io/patrons/play/v/v0.8.58/?join=ABCD');
  });
  it('sends an older page back to the newest when the room is on it', async () => {
    expect(await oldBuildUrl('v0.8.60', at('/patrons/play/v/v0.8.58/'), site(served))).toBe('https://x.io/patrons/play/');
  });
  it('gives up when that release is gone, or is this page, or there are no releases here', async () => {
    expect(await oldBuildUrl('v0.8.40', at('/patrons/play/'), site(served))).toBe(null);
    expect(await oldBuildUrl('v0.8.58', at('/patrons/play/v/v0.8.58/'), site(served))).toBe(null);
    expect(await oldBuildUrl('v0.8.58', at('/'), site(served))).toBe(null);
    expect(await oldBuildUrl(null, at('/patrons/play/'), site(served))).toBe(null);
  });
});
