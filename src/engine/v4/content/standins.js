// Plain stand-in quadrants, so a full table can play while the real spheres are designed.
function standIn(id, name, other1, other2) {
  const plain = (key, ring, nm, gains) => {
    const text = Object.entries(gains).map(([c, n]) => `+${n} ${c}`).join(', ') + '.';
    return {
      key, ring, name: nm, text,
      estimate: () => Object.values(gains).reduce((a, b) => a + b, 0),
      // a named color that isn't on this table comes as the stand-in's own color instead
      resolve(ctx, p) { for (const [c, n] of Object.entries(gains)) ctx.gain(p, ctx.state.resources.includes(c) ? c : id, n, { fromAction: true }); },
    };
  };
  const vanilla = [
    ['recruit', 'Recruit', 2, 0, 1, 2], ['hand', 'Hand', 2, 2, 1, 2], ['helper', 'Helper', 4, 0, 1, 2],
    ['regular', 'Regular', 4, 2, 2, 2], ['devotee', 'Devotee', 4, 4, 2, 2], ['elder', 'Elder', 6, 2, 3, 2],
    ['pillar', 'Pillar', 6, 6, 5, 2], ['patron', 'Patron', 8, 4, 5, 1],
  ];
  return {
    id, name, resource: id, standIn: true,
    scoring: { label: `Most ${id}`, score: (ctx, p) => p.res[id] },
    actions: [
      plain('a1', 1, name === 'Blue' ? 'Tide' : 'Sprout', { [id]: 3 }),
      plain('a2', 1, name === 'Blue' ? 'Current' : 'Graft', { [id]: 2, [other1]: 1 }),
      plain('a3', 1, name === 'Blue' ? 'Shoal' : 'Root', { [id]: 2, [other2]: 1 }),
      plain('a4', 2, name === 'Blue' ? 'Swell' : 'Grove', { [id]: 5 }),
      plain('a5', 2, name === 'Blue' ? 'Harbor' : 'Orchard', { [id]: 4, [other1 === 'red' ? 'gold' : 'red']: 1 }),
      plain('a6', 3, name === 'Blue' ? 'Flood' : 'Bloom', { [id]: 8 }),
    ],
    handlers: {},
    members: vanilla.map(([key, nm, s, w, f, copies]) => ({
      // plain members keep their pre-doubling cost: they don't pay for an ability they lack (Claude, 2026-10-14)
      key, name: `${name} ${nm}`, s: s / 2, w: w / 2, f, n: 1, copies, text: f > 1 ? `Worth ${f} followers.` : 'Worth 1 follower.', vanilla: true,
    })),
  };
}

export const blue = standIn('blue', 'Blue', 'red', 'green');
export const green = standIn('green', 'Green', 'gold', 'blue');
