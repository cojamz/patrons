// Cults pixel icons: the artifacts (Cory, 2026-10-25: "give them pixel images"). One per color, an object (never a
// person): ids are "artifact.<quadrant>". Same format and palette keys as icons.js. Classic script: load icons.js first;
// this file adds its list at globalThis.CultIconBatches.artifacts.
(function (g) {
  const ICONS = [
    {
      id: 'artifact.purple', name: 'Pocket Watch', kind: 'artifact', sphere: 'purple',
      text: "Whenever a player's turn is skipped, +1 purple.",
      idea: 'a pocket watch on its bow, hands at three',
      px: [
        '........................',
        '..........3221..........',
        '.........32..21.........',
        '.........21..11.........',
        '..........dmmd..........',
        '..........mlmd..........',
        '.........333333.........',
        '.......3333333322.......',
        '......3333llll2222......',
        '.....333lllddlll222.....',
        '....333llllklllll222....',
        '....33lllllkllllll21....',
        '....33lllllkllllll11....',
        '...333lllllkllllll111...',
        '...333dllllkkkkkld111...',
        '...333llllllllllll111...',
        '....33lllllllllllm11....',
        '....32llllllllllmm11....',
        '....222llllllllmm111....',
        '.....222lllddlmm111.....',
        '......2222lllm1111......',
        '.......2211111111.......',
        '.........111111.........',
        '........................',
      ],
    },
  ];
  (g.CultIconBatches = g.CultIconBatches || {}).artifacts = ICONS;
})(globalThis);
