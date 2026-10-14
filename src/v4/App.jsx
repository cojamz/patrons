// Patrons v4 app shell: Home → Local setup / Online lobby → Game → Results.
// Local games save on every change and can be resumed; online seats are rejoined after a reload.
import { useCallback, useEffect, useRef, useState } from 'react';
import './v4.css';
import { createRoom, joinRoom, rejoinRoom, makeTransport, transportKind, onlineReady } from './sessionApi.js';
import { createLocalSession } from './session/local.js';
import { loadLocal, saveLocal, clearLocal, loadOnline, saveOnline, clearOnline } from './saved.js';
import GameScreen from './game/GameScreen.jsx';
import { friendlyError } from './errors.js';
import { Home, LocalSetup, Lobby } from './screens/Screens.jsx';

const BOT_DELAY = { slow: 1100, normal: 650, fast: 180 };
const urlBotDelay = () => Number(new URLSearchParams(location.search).get('botDelay')) || 0;

export default function App() {
  const [screen, setScreen] = useState(() => (loadOnline() && rejoinRoom ? { name: 'rejoining' } : { name: 'home' }));
  const [config, setConfig] = useState(null);
  const [session, setSession] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [saved, setSaved] = useState(() => loadLocal());
  const [homeError, setHomeError] = useState('');
  const configRef = useRef(null);
  // read before anything clears it: was this tab in a local game when it reloaded?
  const wasInGame = useRef((() => { try { return sessionStorage.getItem('patrons.v4.inGame') === '1'; } catch { return false; } })());
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // Browser Back from a game, setup or lobby returns home (a local game stays saved to resume).
  useEffect(() => {
    if (screen.name === 'home' || screen.name === 'rejoining') return;
    if (!history.state || history.state.patrons !== screen.name) history.pushState({ patrons: screen.name }, '');
  }, [screen.name]);
  useEffect(() => {
    const onPop = () => {
      const cur = screenRef.current;
      if (cur.name === 'home') return;
      if (cur.lobby) leaveRef.current(cur.lobby); else goHomeRef.current();
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const leaveRef = useRef(null);
  const goHomeRef = useRef(null);

  useEffect(() => () => { if (session) session.destroy(); }, [session]);

  // A reload during a local game goes straight back into it (this tab remembers it was playing).
  useEffect(() => {
    const local = screen.name === 'game' && session && session.info?.mode !== 'online';
    try { if (local) sessionStorage.setItem('patrons.v4.inGame', '1'); else if (screen.name !== 'rejoining') sessionStorage.removeItem('patrons.v4.inGame'); } catch { /* ignore */ }
  }, [screen.name, session]);
  useEffect(() => {
    if (wasInGame.current && screen.name === 'home' && loadLocal()) resumeRef.current();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const resumeRef = useRef(null);

  // Save local games on every change.
  useEffect(() => {
    if (!session || session.info?.mode === 'online') return undefined;
    const save = s => saveLocal(configRef.current, s, session.undoCheckpoint);
    save(session.getState());
    return session.subscribe(save);
  }, [session]);

  const begin = useCallback((s, cfg) => {
    configRef.current = cfg;
    setConfig(cfg);
    setSession(s);
    setGameKey(k => k + 1);
    setScreen({ name: 'game' });
  }, []);

  const startLocal = useCallback(cfg => {
    const seats = cfg.seats.filter(s => s.kind !== 'empty').map((s, i) => ({ name: s.name.trim() || `P${i + 1}`, kind: s.kind }));
    const botDelayMs = urlBotDelay() || BOT_DELAY[cfg.speed] || 650;
    begin(createLocalSession({ seats, seed: Math.floor(Math.random() * 1e9), botDelayMs }), cfg);
  }, [begin]);

  const resume = useCallback(() => {
    const v = loadLocal();
    if (!v) { setSaved(null); return; }
    const botDelayMs = urlBotDelay() || BOT_DELAY[v.config?.speed] || 650;
    begin(createLocalSession({ state: v.state, undo: v.undo, botDelayMs }), v.config);
  }, [begin]);
  resumeRef.current = resume;

  const goHome = useCallback(() => {
    setSession(null); setSaved(loadLocal()); setScreen({ name: 'home' });
    if (history.state && history.state.patrons) history.back();
  }, []);
  goHomeRef.current = () => { setSession(null); setSaved(loadLocal()); setScreen({ name: 'home' }); };

  const enterLobby = useCallback(async (make, kind) => {
    try {
      // No network means no answer: give up after 8 seconds instead of "Connecting…" forever.
      let timer;
      const res = await Promise.race([
        Promise.resolve().then(make),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('TIMEOUT')), 8000); }),
      ]).finally(() => clearTimeout(timer));
      const lobby = res.lobby;
      saveOnline({ code: res.code || lobby.code, playerId: res.playerId, transport: kind });
      setScreen({ name: 'lobby', lobby, myId: res.playerId });
      lobby.onStart(s => { setSession(s); setGameKey(k => k + 1); setScreen({ name: 'game', lobby }); });
      return null;
    } catch (e) {
      return friendlyError(e);
    }
  }, []);

  // After a reload: take your seat back in the room you were in.
  useEffect(() => {
    if (screen.name !== 'rejoining') return;
    const v = loadOnline();
    enterLobby(() => rejoinRoom({ code: v.code, playerId: v.playerId, transport: makeTransport(v.transport), botDelayMs: urlBotDelay() || BOT_DELAY.normal }), v.transport)
      .then(err => { if (err) { clearOnline(); setHomeError(`Couldn't rejoin room ${v.code}: ${err}`); setScreen({ name: 'home' }); } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dropLobby = lobby => {
    clearOnline();
    Promise.resolve(lobby && lobby.leave ? lobby.leave() : null).catch(() => {}).finally(() => { if (lobby && lobby.destroy) lobby.destroy(); });
  };
  const leaveLobby = useCallback(lobby => { dropLobby(lobby); goHome(); }, [goHome]);
  leaveRef.current = lobby => { dropLobby(lobby); goHomeRef.current(); };

  if (screen.name === 'game' && session) {
    const online = session.info?.mode === 'online';
    return (
      <GameScreen
        key={gameKey} session={session}
        onHome={screen.lobby ? () => leaveLobby(screen.lobby) : goHome}
        leaveText={online ? 'You’ll give up your seat in this room.' : 'You can resume it from the home screen.'}
        onPlayAgain={config && !online ? () => { clearLocal(); startLocal(config); } : null}
      />
    );
  }
  if (screen.name === 'rejoining') return <div className="app narrow"><div className="dialog page"><h2>Rejoining your game…</h2></div></div>;
  if (screen.name === 'setup') return <LocalSetup initial={config} onStart={cfg => { clearLocal(); startLocal(cfg); }} onBack={goHome} />;
  if (screen.name === 'lobby') return <Lobby lobby={screen.lobby} myId={screen.myId} onLeave={() => leaveLobby(screen.lobby)} />;
  const kind = transportKind();
  return (
    <Home
      onlineReady={onlineReady}
      saved={saved}
      onResume={resume}
      error={homeError}
      onLocal={() => setScreen({ name: 'setup' })}
      onHost={name => enterLobby(() => createRoom({ name, transport: makeTransport(kind), botDelayMs: urlBotDelay() || BOT_DELAY.normal }), kind)}
      onJoin={(code, name) => enterLobby(() => joinRoom({ code, name, transport: makeTransport(kind), botDelayMs: urlBotDelay() || BOT_DELAY.normal }), kind)}
    />
  );
}
