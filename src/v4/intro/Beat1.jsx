// Beat 1 — "You are a cult leader." The leader alone in the lamp light: it rises into the light, brings its hands
// together, narrows its eyes, rubs its hands, and laughs without a sound (pixel frames, Leader.jsx poses).
import { Act, LEAD, LeadFrames, Z, useCast } from './shared.jsx';

export const shots = [{ t: 0, cam: [0, 2, Z.near], d: 900, lamp: [0, -2, 190, 140] }];

/** The scheming laugh: [ms, pose]. Hands up, eyes narrow, a rub, then the shoulders shake. */
export const SCHEME = [
  [0, 'idle'], [1250, 'steeple'], [1550, 'scheme'],
  [1900, 'rubA'], [2010, 'rubB'], [2120, 'rubA'], [2230, 'rubB'], [2340, 'rubA'], [2450, 'rubB'],
  [2650, 'laughA'], [2780, 'laughB'], [2910, 'laughA'], [3040, 'laughB'], [3170, 'laughA'], [3300, 'laughB'], [3430, 'laughA'],
  [3560, 'scheme'],
];

export default function Beat1() {
  const { you } = useCast();
  return (
    <>
      <Act track={[{ x: -20, y: 12, o: 0 }, [250, 1000, { o: 1 }, 'sine']]} className="in-shadow" origin="50% 50%"><span className="in-floor" style={{ width: 40, height: 6 }} /></Act>
      <Act track={[{ x: LEAD[0], y: LEAD[1] + 6, o: 0 }, [250, 1000, { y: LEAD[1], o: 1 }, 'out']]}>
        <LeadFrames emoji={you} seq={SCHEME} stillAs="scheme" />
      </Act>
    </>
  );
}
