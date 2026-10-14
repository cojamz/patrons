// Patrons v4 app shell: Home → Local setup / Online lobby → Game → Results.
import { useCallback, useEffect, useState } from 'react';
import './v4.css';
import { createLocalSession, createRoom, joinRoom, defaultTransport, onlineReady } from './sessionApi.js';
import GameScreen from './game/GameScreen.jsx';
import { Home, LocalSetup, Lobby } from './screens/Screens.jsx';

const BOT_DELAY = { slow: 1100, normal: 650, fast: 180 };
const transport = () => (typeof defaultTransport === 'function' ? defaultTransport() : defaultTransport);

export default function App() {
  const [screen, setScreen] = useState({ name: 'home' });
  const [config, setConfig] = useState(null);
  const [session, setSession] = useState(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => () => { if (session) session.destroy(); }, [session]);

  const startLocal = useCallback(cfg => {
    setConfig(cfg);
    const seats = cfg.seats.filter(s => s.kind !== 'empty').map((s, i) => ({ name: s.name.trim() || `P${i + 1}`, kind: s.kind }));
    const botDelayMs = Number(new URLSearchParams(location.search).get('botDelay')) || BOT_DELAY[cfg.speed] || 650;
    setSession(createLocalSession({ seats, seed: Math.floor(Math.random() * 1e9), botDelayMs }));
    setGameKey(k => k + 1);
    setScreen({ name: 'game' });
  }, []);

  const goHome = useCallback(() => { setSession(null); setScreen({ name: 'home' }); }, []);

  const enterLobby = useCallback(async (make) => {
    try {
      const res = await make();
      const lobby = res.lobby || res;
      if (lobby.onStart) lobby.onStart(s => { setSession(s); setGameKey(k => k + 1); setScreen({ name: 'game' }); });
      setScreen({ name: 'lobby', lobby, myId: res.playerId ?? res.myId ?? lobby.myId });
    } catch (e) {
      alert(`Couldn't open the room: ${e.message || e}`);
    }
  }, []);

  if (screen.name === 'game' && session) {
    return <GameScreen key={gameKey} session={session} onHome={goHome} onPlayAgain={config && session.info?.mode !== 'online' ? () => startLocal(config) : null} />;
  }
  if (screen.name === 'setup') return <LocalSetup initial={config} onStart={startLocal} onBack={goHome} />;
  if (screen.name === 'lobby') return <Lobby lobby={screen.lobby} myId={screen.myId} onLeave={goHome} />;
  return (
    <Home
      onlineReady={onlineReady}
      onLocal={() => setScreen({ name: 'setup' })}
      onHost={name => enterLobby(() => createRoom({ name, transport: transport() }))}
      onJoin={(code, name) => enterLobby(() => joinRoom({ code, name, transport: transport() }))}
    />
  );
}
