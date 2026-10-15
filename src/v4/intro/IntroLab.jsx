// ?lab=intro[&beat=N][&at=MS][&still=1]: the intro's beats in isolation, for building and recording them
// (scripts/v4-gif.mjs). beat=N plays only beat N, on a loop; at=MS freezes it MS into the beat; still=1 shows the
// reduced-motion storyboard. No beat: the whole intro, replayed when it closes.
import { useState } from 'react';
import '../app.css'; // the game's CSS in its one order (v4.css, then lamp.css)
import Intro from '../Intro.jsx';

export default function IntroLab() {
  const q = new URLSearchParams(location.search);
  const beat = Number(q.get('beat')) || null;
  const at = q.get('at') != null ? Number(q.get('at')) : null;
  const still = q.get('still') === '1' ? true : undefined; // else prefers-reduced-motion decides
  const [k, setK] = useState(0);
  return <div data-intro-lab><Intro key={k} onClose={() => setK(n => n + 1)} only={beat} at={at} still={still} /></div>;
}
