// Patrons v4 app shell: Home → Local setup / Online lobby → Game → Results.
// Local games save on every change and can be resumed; online seats are rejoined after a reload.
import { useCallback, useEffect, useRef, useState } from 'react';
import './app.css'; // v4.css then lamp.css, inlined in that order (see app.css)
import { createRoom, joinRoom, rejoinRoom, makeTransport, transportKind, onlineReady } from './sessionApi.js';
import { createLocalSession } from './session/local.js';
import { loadLocal, saveLocalSoon, flushLocalSave, clearLocal, finishLocal, loadLast, clearLast, claimLocal, ownsLocal, onLocalLost, releaseLocal, loadOnline, saveOnline, clearOnline, rememberRoom, roomIds, lastRoomCode } from './saved.js';
import GameScreen from './game/GameScreen.jsx';
import { friendlyError, OFFLINE } from './errors.js';
import { oldBuildUrl } from './oldBuild.js';
import { Home, LocalSetup, Lobby, initialTable } from './screens/Screens.jsx';
import OnlineBar from './screens/OnlineBar.jsx';
import { tableProblem, fitTable } from './tables.js';
import { Recovered } from './Recovery.jsx';
import { IntroGate, introOnGameStart } from './Intro.jsx';
import { BOT, motionSpeed, onMotionSpeed } from './motion.js';
import { PerfProfiler, traceSession } from './perf.js'; // ?trace=1 only (design/eval/perf/)

// Bots decide quickly; the table paces what you see (each visible bot step holds PACE ms, a pass doesn't wait).
const BOT_DELAY = BOT.think; // src/v4/motion.js: every pace in one place
const PACE = BOT.pace;
const urlBotDelay = () => Number(new URLSearchParams(location.search).get('botDelay')) || 0;
// An invite link (?join=CODE) reopened on a device that already sat in that room goes straight back to its seat.
const linkCode = () => (new URLSearchParams(location.search).get('join') || '').trim().toUpperCase();
const linkRejoin = () => (linkCode() && roomIds(linkCode()).length ? linkCode() : '');

/** The v4 root: a crash anywhere shows a recovery screen, not a blank page; notices sit on top (Recovery.jsx). */
export default function V4Root() {
  return <Recovered><App /><IntroGate /></Recovered>;
}

function App() {
  const [screen, setScreen] = useState(() => (loadOnline() && rejoinRoom ? { name: 'rejoining' } : linkRejoin() && joinRoom ? { name: 'rejoining', link: linkRejoin() } : { name: 'home' }));
  const [config, setConfig] = useState(null);
  // one speed setting (setup's Speed and the ☰ menu's): the bots' pace and the animations, read live (decisions.md)
  const [speed, setSpeedNow] = useState(motionSpeed);
  useEffect(() => onMotionSpeed(setSpeedNow), []);
  const [session, setSession] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [saved, setSaved] = useState(() => loadLocal());
  const [last, setLast] = useState(() => loadLast()); // the last finished game: home offers its results
  const [away, setAway] = useState(false); // another tab took this local game (session/owner.js)
  const [homeError, setHomeError] = useState('');
  const configRef = useRef(null);
  // read before anything clears it: was this tab in a local game when it reloaded?
  const wasInGame = useRef((() => { try { return sessionStorage.getItem('patrons.v4.inGame') === '1'; } catch { return false; } })());
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // Browser Back from setup or the lobby returns home. Mid-game it never leaves on its own: an edge swipe on a phone is
  // Back, and leaving an online game hands your seat to a bot. It stays put and asks, like the Leave button.
  const [askLeave, setAskLeave] = useState(0);
  useEffect(() => {
    if (screen.name === 'home' || screen.name === 'rejoining') return;
    if (!history.state || history.state.patrons !== screen.name) history.pushState({ patrons: screen.name }, '');
  }, [screen.name]);
  useEffect(() => {
    const onPop = () => {
      const cur = screenRef.current;
      if (cur.name === 'home') return;
      const st = cur.name === 'game' && sessionRef.current && sessionRef.current.getState();
      if (st && !st.over) {
        history.pushState({ patrons: 'game' }, '');
        setAskLeave(n => n + 1);
        return;
      }
      if (cur.lobby) leaveRef.current(cur.lobby); else goHomeRef.current();
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const leaveRef = useRef(null);
  const goHomeRef = useRef(null);

  useEffect(() => () => { if (session) session.destroy(); }, [session]);
  useEffect(() => traceSession(session), [session]); // the ?trace=1 tracer watches the session on screen (no-op off)
  const sessionRef = useRef(null);
  sessionRef.current = session;

  // A reload during a local game goes straight back into it (this tab remembers it was playing).
  useEffect(() => {
    const local = screen.name === 'game' && session && session.info?.mode !== 'online';
    try { if (local) sessionStorage.setItem('patrons.v4.inGame', '1'); else if (screen.name !== 'rejoining') sessionStorage.removeItem('patrons.v4.inGame'); } catch { /* ignore */ }
  }, [screen.name, session]);
  useEffect(() => {
    if (!wasInGame.current || screen.name !== 'home') return;
    // a game in progress resumes; a finished one (a reload of its results) shows its results again
    if (loadLocal()) resumeRef.current(); else if (loadLast()) lastRef.current();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const resumeRef = useRef(null);
  const lastRef = useRef(null);

  // One tab owns a local game: when a newer tab opens it, this one stops its bots and saving and says so.
  useEffect(() => onLocalLost(() => {
    const s = sessionRef.current;
    if (!s || s.info?.mode === 'online' || screenRef.current.last) return;
    s.destroy();
    setAway(true);
  }), []);

  // Save local games on every change.
  // Once its results have been on screen a finished game is done: nothing saves it again (a late save would
  // offer to "resume" a game that's over).
  const finished = useRef(null);
  // The finished game is kept (results and record) as the last game until a new one starts.
  const onResultsShown = useCallback(() => { finished.current = session; finishLocal(configRef.current, session && session.getState()); releaseLocal(); }, [session]);
  useEffect(() => {
    if (!session || session.info?.mode === 'online') return undefined;
    // the round-end hold goes with the state, so a reload reopens the round summary (session/local.js)
    // off the input path (saved.js saveLocalSoon): the latest state is written in idle time, at once on pagehide
    const save = s => { if (!(s && s.over && finished.current === session)) saveLocalSoon(configRef.current, s, session.undoCheckpoint, session.roundHold); };
    save(session.getState());
    const off = session.subscribe(save);
    // the game screen going away (home, a new game) writes what's waiting at once: never a save after the next screen
    return () => { off(); flushLocalSave(); };
  }, [session]);

  const begin = useCallback((s, cfg, extra = {}) => {
    configRef.current = cfg;
    setConfig(cfg);
    setSession(s);
    setGameKey(k => k + 1);
    setAway(false);
    setScreen({ name: 'game', ...extra });
  }, []);

  const startLocal = useCallback(cfg => {
    const seats = cfg.seats.filter(s => s.kind !== 'empty').map((s, i) => ({ name: s.name.trim() || `P${i + 1}`, kind: s.kind, ...(s.emoji ? { emoji: s.emoji } : {}) }));
    const botDelayMs = () => urlBotDelay() || BOT_DELAY[motionSpeed()] || 650;
    // one sphere per player (Cory, 2026-10-15): the table fitted to the seats that play
    const fit = cfg.table ? fitTable(cfg.table, seats.length) : null;
    const quadrants = fit && !tableProblem(fit.quadrants, seats.length) ? fit.quadrants : undefined;
    // this tab takes the one local save (any other tab holding a game lets go), then starts over in it
    claimLocal(); clearLocal(); clearLast(); setLast(null);
    begin(createLocalSession({ seats, seed: Math.floor(Math.random() * 1e9), botDelayMs, quadrants, rules: cfg.roundDecks === 3 ? { roundDecks: 3 } : undefined, botLevel: cfg.level, holdRoundEnds: true, isOwner: ownsLocal }), cfg);
    introOnGameStart(); // this browser's first game: the intro, on this screen only (Intro.jsx)
  }, [begin]);

  // Claim first, then read: every move the other tab saved before it let go is in what we load.
  const resume = useCallback(() => {
    claimLocal();
    const v = loadLocal();
    if (!v) { setSaved(null); return false; }
    const botDelayMs = () => urlBotDelay() || BOT_DELAY[motionSpeed()] || 650;
    begin(createLocalSession({ state: v.state, undo: v.undo, hold: v.hold, botDelayMs, holdRoundEnds: true, isOwner: ownsLocal }), v.config);
    return true;
  }, [begin]);
  resumeRef.current = resume;

  // The last finished game's results, read-only: nothing claims or saves it (its session never moves).
  const viewLast = useCallback(() => {
    const v = loadLast();
    if (!v) { setLast(null); return false; }
    const s = createLocalSession({ state: v.state });
    finished.current = s;
    begin(s, v.config, { last: true });
    return true;
  }, [begin]);
  lastRef.current = viewLast;
  // "Play here" in a tab that lost the game: take it back from the save (or its results, if it has ended since).
  const playHere = useCallback(() => {
    setAway(false);
    if (resume()) return;
    if (viewLast()) return;
    goHomeRef.current();
  }, [resume, viewLast]);

  const goHome = useCallback(() => {
    setSession(null); setSaved(loadLocal()); setLast(loadLast()); setAway(false); setScreen({ name: 'home' });
    screenRef.current = { name: 'home' }; // the history.back() below must not read as "Back pressed mid-game"
    if (history.state && history.state.patrons) history.back();
  }, []);
  goHomeRef.current = () => { setSession(null); setSaved(loadLocal()); setLast(loadLast()); setAway(false); setScreen({ name: 'home' }); };

  const enterLobby = useCallback(async (make, kind) => {
    // No network means no answer: give up after 15 seconds instead of "Connecting…" forever (a phone on a weak
    // signal can need several seconds to sign in and connect). If the answer comes after we gave up, let that seat go.
    const attempt = Promise.resolve().then(make);
    let gaveUp = false;
    try {
      let timer;
      const res = await Promise.race([
        attempt,
        new Promise((_, reject) => { timer = setTimeout(() => { gaveUp = true; reject(new Error('TIMEOUT')); }, 15000); }),
      ]).finally(() => clearTimeout(timer));
      const lobby = res.lobby;
      saveOnline({ code: res.code || lobby.code, playerId: res.playerId, transport: kind });
      rememberRoom(res.code || lobby.code, res.playerId);
      setScreen({ name: 'lobby', lobby, myId: res.playerId });
      lobby.onStart(s => { setSession(s); setGameKey(k => k + 1); setScreen({ name: 'game', lobby }); introOnGameStart(); });
      return null;
    } catch (e) {
      // a late new seat is freed (the retry takes one); a late rejoin just stops listening (the seat stays yours)
      if (gaveUp) attempt.then(r => (r && r.lobby ? (r.rejoined ? r.lobby.destroy() : r.lobby.leave()) : null)).catch(() => {});
      // the room runs another release: open that one (the page goes away, so this never settles) or say why not
      if (e && e.roomVersion) {
        const url = await oldBuildUrl(e.roomVersion);
        if (url) { location.replace(url); return new Promise(() => {}); }
      }
      return friendlyError(e);
    }
  }, []);

  // After a reload: take your seat back in the room you were in.
  useEffect(() => {
    if (screen.name !== 'rejoining') return;
    if (screen.link) {
      // a reopened invite link: this device's seat if it still has one, else the ordinary join form (code filled in)
      const kind = transportKind();
      enterLobby(() => joinRoom({ code: screen.link, transport: makeTransport(kind), knownIds: roomIds(screen.link), onlyRejoin: true, botDelayMs: urlBotDelay() || BOT_DELAY[motionSpeed()] }), kind)
        .then(err => { if (err) setScreen({ name: 'home' }); });
      return;
    }
    const v = loadOnline();
    enterLobby(() => rejoinRoom({ code: v.code, playerId: v.playerId, transport: makeTransport(v.transport), botDelayMs: urlBotDelay() || BOT_DELAY[motionSpeed()] }), v.transport)
      .then(err => {
        if (!err) return;
        // offline: keep the seat to try again (Join with the same code takes it back); otherwise it's gone
        if (err !== OFFLINE) clearOnline();
        setHomeError(`Couldn't rejoin room ${v.code}: ${err}`);
        setScreen({ name: 'home' });
      });
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
      <>
      {online && <OnlineBar session={session} />}
      <PerfProfiler id="GameScreen">
      <GameScreen
        key={gameKey} session={session} pace={urlBotDelay() ? Math.min(urlBotDelay() * 2, PACE.steady) : PACE[speed] ?? PACE.steady}
        onHome={screen.lobby ? () => leaveLobby(screen.lobby) : goHome}
        leaveText={online ? 'A bot will play your seat. Open the invite link again to take it back.' : 'You can resume it from the home screen.'}
        onPlayAgain={config && !online ? () => startLocal(config) : null}
        onResults={online || screen.last ? null : onResultsShown}
        askLeave={askLeave}
      />
      </PerfProfiler>
      {away && !online && (
        <div className="tab-away" role="dialog" aria-modal="true" aria-labelledby="tab-away-title" data-tab-away>
          <div className="tab-away-card">
            <h2 id="tab-away-title">This game is open in another tab</h2>
            <p>It carries on there. Nothing here moves until you bring it back.</p>
            <button type="button" className="btn pri" data-play-here onClick={playHere} autoFocus>Play here</button>
          </div>
        </div>
      )}
      </>
    );
  }
  if (screen.name === 'rejoining') return <div className="app narrow"><div className="dialog page"><h2>Rejoining your game…</h2></div></div>;
  if (screen.name === 'setup') return <LocalSetup initial={config} onStart={cfg => startLocal(cfg)} onBack={goHome} />;
  if (screen.name === 'lobby') return <Lobby lobby={screen.lobby} myId={screen.myId} onLeave={() => leaveLobby(screen.lobby)} />;
  const kind = transportKind();
  return (
    <Home
      onlineReady={onlineReady}
      saved={saved}
      onResume={resume}
      last={last}
      onLast={viewLast}
      error={homeError}
      lastCode={lastRoomCode()}
      onLocal={() => setScreen({ name: 'setup' })}
      onHost={(name, emoji) => enterLobby(() => createRoom({ name, emoji, table: initialTable(config?.table), transport: makeTransport(kind), botDelayMs: urlBotDelay() || BOT_DELAY[motionSpeed()] }), kind)}
      onJoin={(code, name, emoji) => enterLobby(() => joinRoom({ code, name, emoji, knownIds: roomIds(code), transport: makeTransport(kind), botDelayMs: urlBotDelay() || BOT_DELAY[motionSpeed()] }), kind)}
    />
  );
}
