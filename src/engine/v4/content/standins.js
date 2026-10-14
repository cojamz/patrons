// Plain stand-in quadrants, so a full table can play while the real spheres are designed.
function standIn(id, name, other1, other2) {
  const plain = (key, ring, nm, gains) => {
    const text = Object.entries(gains).map(([c, n]) => `+${n} ${c}`).join(', ') + '.';
    return {
      key, ring, name: nm, text,
      estimate: () => Object.values(gains).reduce((a, b) => a + b, 0),
      resolve(ctx, p) { for (const [c, n] of Object.entries(gains)) ctx.gain(p, c, n, { fromAction: true }); },
    };
  };
  const vanilla = [
    ['recruit', 'Recruit', 1, 0, 1, 2], ['hand', 'Hand', 1, 1, 1, 2], ['helper', 'Helper', 2, 0, 1, 2],
    ['regular', 'Regular', 2, 1, 2, 2], ['devotee', 'Devotee', 2, 2, 2, 2], ['elder', 'Elder', 3, 1, 3, 2],
    ['pillar', 'Pillar', 3, 3, 5, 2], ['patron', 'Patron', 4, 2, 5, 1],
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
      key, name: `${name} ${nm}`, s, w, f, n: 1, copies, text: f > 1 ? `Worth ${f} followers.` : 'Worth 1 follower.', vanilla: true,
    })),
  };
}

export const blue = standIn('blue', 'Blue', 'red', 'green');
export const green = standIn('green', 'Green', 'gold', 'blue');
