// ?lab=intro[&beat=N][&at=MS]: the intro's beats in isolation, for building and recording them (scripts/v4-gif.mjs).
// The intro lead wires this to the kit in shared.jsx: beat=N plays only beat N on a loop; at=MS freezes it at MS.
export default function IntroLab() {
  return <div style={{ position: 'fixed', inset: 0, background: '#1d1611', color: '#f3e6c8', display: 'grid', placeItems: 'center', fontFamily: 'Alegreya, serif' }} data-intro-lab>Intro lab: waiting for the intro lead to wire beats.</div>;
}
