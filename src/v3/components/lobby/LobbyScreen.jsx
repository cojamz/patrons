/**
 * LobbyScreen — Create or join a multiplayer room.
 *
 * Two paths:
 *   "Create Game" → host gets room code to share
 *   "Join Game"   → enter 4-character code
 *
 * Once in a room, shows connected players, ready states,
 * and host can configure settings + start the game.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors, playerColors } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';
import { createRoom, joinRoom, leaveRoom, setReady, updateSettings, onRoomUpdate, setRoomStatus } from '../../firebase/rooms';
import JoinScreen from './JoinScreen';

// --- Room View (inside a room) ---

function RoomView({ roomCode, playerId, room, onLeave, onStart, onStartMultiplayer }) {
  const players = room?.players || {};
  const playerList = Object.entries(players).sort((a, b) => (a[1].slot ?? 0) - (b[1].slot ?? 0));
  const isHost = room?.host === playerId;
  const myPlayer = players[playerId];

  const canStart = isHost && playerList.length >= 2;

  // Guest auto-transition: when host starts the game, room.status changes
  // from 'lobby' to 'drafting'/'playing'. Non-host players build the same
  // multiplayer config and transition automatically.
  useEffect(() => {
    if (isHost) return; // host transitions via onStart button
    if (!room || room.status === 'lobby') return;

    const playerEntries = Object.entries(room.players || {})
      .sort((a, b) => (a[1].slot ?? 0) - (b[1].slot ?? 0));

    onStartMultiplayer({
      roomCode,
      playerId,
      isHost: false,
      playerCount: playerEntries.length,
      playerNames: playerEntries.map(([, p]) => p.name),
      playerIds: playerEntries.map(([id]) => id),
      slotMap: Object.fromEntries(playerEntries.map(([id, p]) => [id, p.slot])),
    });
  }, [room?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleReady = () => {
    if (myPlayer) {
      setReady(roomCode, playerId, !myPlayer.ready);
    }
  };

  const handlePlayerCountChange = (count) => {
    if (isHost) {
      updateSettings(roomCode, { playerCount: count });
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: base.board }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.06) 0%, transparent 60%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary})` }} />
            <span
              className="text-xs uppercase tracking-[0.3em] font-medium"
              style={{ color: godColors.gold.primary }}
            >
              Multiplayer Lobby
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}, transparent)` }} />
          </div>
        </div>

        {/* Room code display */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: base.textMuted }}>
            Room Code
          </span>
          <div
            className="text-5xl font-bold tracking-[0.3em] mt-1"
            style={{
              color: godColors.gold.light,
              textShadow: `0 0 30px ${godColors.gold.glowStrong}`,
              fontFamily: 'monospace',
            }}
          >
            {roomCode}
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(roomCode)}
            className="text-[10px] font-medium mt-1 transition-colors"
            style={{ color: base.textMuted }}
            onMouseEnter={e => e.target.style.color = godColors.gold.light}
            onMouseLeave={e => e.target.style.color = base.textMuted}
          >
            Copy code
          </button>
        </div>

        {/* Panel */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{
            background: 'rgba(28, 25, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Player count (host only) */}
          {isHost && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: base.textMuted }}>
                Players Needed
              </label>
              <div className="flex gap-2">
                {[2, 3, 4].map(count => (
                  <button
                    key={count}
                    onClick={() => handlePlayerCountChange(count)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: (room?.settings?.playerCount || 2) === count
                        ? godColors.gold.primary
                        : 'rgba(255, 255, 255, 0.04)',
                      color: (room?.settings?.playerCount || 2) === count
                        ? base.textDark
                        : base.textSecondary,
                      border: `1px solid ${(room?.settings?.playerCount || 2) === count
                        ? godColors.gold.primary
                        : 'rgba(255, 255, 255, 0.08)'}`,
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player list */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: base.textMuted }}>
              Players ({playerList.length}/{room?.settings?.playerCount || 2})
            </label>
            <div className="space-y-2">
              {playerList.map(([pid, player], i) => {
                const colors = playerColors[player.slot ?? i] || playerColors[0];
                const isMe = pid === playerId;
                const isPlayerHost = pid === room?.host;

                return (
                  <div
                    key={pid}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{
                      background: isMe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isMe ? colors.primary + '40' : 'rgba(255, 255, 255, 0.04)'}`,
                    }}
                  >
                    <WorkerIcon playerId={player.slot ?? i} size={22} />
                    <span className="flex-1 text-sm font-semibold" style={{ color: colors.light }}>
                      {player.name}
                      {isPlayerHost && (
                        <span className="ml-2 text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded"
                          style={{ background: godColors.gold.surface, color: godColors.gold.primary, border: `1px solid ${godColors.gold.border}` }}>
                          Host
                        </span>
                      )}
                      {isMe && (
                        <span className="ml-1 text-[9px] uppercase tracking-wider font-medium" style={{ color: base.textMuted }}>
                          (you)
                        </span>
                      )}
                    </span>
                    {/* Connection status */}
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: player.connected ? '#4ade80' : '#ef4444',
                        boxShadow: player.connected ? '0 0 6px #4ade8066' : 'none',
                      }}
                      title={player.connected ? 'Connected' : 'Disconnected'}
                    />
                    {/* Ready state */}
                    {isMe ? (
                      <button
                        onClick={handleToggleReady}
                        className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all"
                        style={{
                          background: player.ready ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${player.ready ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: player.ready ? '#4ade80' : base.textMuted,
                        }}
                      >
                        {player.ready ? 'Ready' : 'Not Ready'}
                      </button>
                    ) : (
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: player.ready ? '#4ade80' : base.textMuted }}
                      >
                        {player.ready ? 'Ready' : 'Waiting'}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, (room?.settings?.playerCount || 2) - playerList.length) }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center px-3 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span className="text-xs" style={{ color: base.textMuted }}>
                    Waiting for player...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onLeave}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: base.textMuted,
              }}
            >
              Leave
            </button>

            {isHost && (
              <motion.button
                onClick={onStart}
                disabled={!canStart}
                className="flex-[2] py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider"
                style={{
                  background: canStart
                    ? `linear-gradient(135deg, ${godColors.gold.primary}, ${godColors.gold.dark})`
                    : 'rgba(120, 113, 108, 0.2)',
                  color: canStart ? base.textDark : base.textMuted,
                  border: canStart
                    ? `1px solid ${godColors.gold.light}`
                    : '1px solid rgba(120, 113, 108, 0.15)',
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  opacity: canStart ? 1 : 0.5,
                }}
                whileHover={canStart ? { scale: 1.02, boxShadow: `0 6px 30px ${godColors.gold.glowStrong}` } : {}}
                whileTap={canStart ? { scale: 0.97 } : {}}
              >
                Start Game
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Landing Screen ---

export default function LobbyScreen({ onStartLocal, onStartMultiplayer }) {
  const [view, setView] = useState('landing'); // landing | creating | joining | inRoom
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [playerName, setPlayerName] = useState('');

  // Subscribe to room updates when in a room
  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = onRoomUpdate(roomCode, (roomData) => {
      if (!roomData) {
        // Room was deleted
        setView('landing');
        setRoomCode(null);
        setPlayerId(null);
        setRoom(null);
        return;
      }
      setRoom(roomData);
    });
    return unsubscribe;
  }, [roomCode]);

  const handleCreateRoom = useCallback(async () => {
    const name = playerName.trim() || 'Player 1';
    setError(null);
    try {
      const result = await createRoom(name);
      setRoomCode(result.roomCode);
      setPlayerId(result.playerId);
      setView('inRoom');
    } catch (err) {
      setError(err.message);
    }
  }, [playerName]);

  const handleJoinRoom = useCallback(async (code) => {
    const name = playerName.trim() || 'Player';
    setError(null);
    try {
      const result = await joinRoom(code.toUpperCase(), name);
      setRoomCode(code.toUpperCase());
      setPlayerId(result.playerId);
      setView('inRoom');
    } catch (err) {
      setError(err.message);
    }
  }, [playerName]);

  const handleLeaveRoom = useCallback(async () => {
    if (roomCode && playerId) {
      await leaveRoom(roomCode, playerId);
    }
    setView('landing');
    setRoomCode(null);
    setPlayerId(null);
    setRoom(null);
  }, [roomCode, playerId]);

  const handleStartGame = useCallback(async () => {
    if (!roomCode || !room) return;

    // Build player config from room
    const players = room.players || {};
    const playerEntries = Object.entries(players).sort((a, b) => (a[1].slot ?? 0) - (b[1].slot ?? 0));

    await setRoomStatus(roomCode, 'drafting');

    onStartMultiplayer({
      roomCode,
      playerId,
      isHost: room.host === playerId,
      playerCount: playerEntries.length,
      playerNames: playerEntries.map(([, p]) => p.name),
      playerIds: playerEntries.map(([id]) => id),
      slotMap: Object.fromEntries(playerEntries.map(([id, p]) => [id, p.slot])),
    });
  }, [roomCode, playerId, room, onStartMultiplayer]);

  // --- Join screen ---
  if (view === 'joining') {
    return (
      <JoinScreen
        onJoin={handleJoinRoom}
        onBack={() => { setView('landing'); setError(null); }}
        error={error}
      />
    );
  }

  // --- In room ---
  if (view === 'inRoom' && roomCode) {
    return (
      <RoomView
        roomCode={roomCode}
        playerId={playerId}
        room={room}
        onLeave={handleLeaveRoom}
        onStart={handleStartGame}
        onStartMultiplayer={onStartMultiplayer}
      />
    );
  }

  // --- Landing ---
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: base.board }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.06) 0%, transparent 60%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary})` }} />
            <span
              className="text-xs uppercase tracking-[0.3em] font-medium"
              style={{ color: godColors.gold.primary }}
            >
              A Game of Divine Favor
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}, transparent)` }} />
          </div>

          <h1
            className="text-5xl font-bold tracking-tight"
            style={{
              color: base.textPrimary,
              textShadow: `0 0 40px ${godColors.gold.glow}`,
            }}
          >
            The Favored
          </h1>
          <p className="text-sm mt-2" style={{ color: base.textMuted }}>
            Worker Placement / Engine Building
          </p>
        </div>

        {/* Mode selection */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{
            background: 'rgba(28, 25, 23, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Name input */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-2" style={{ color: base.textMuted }}>
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: base.textPrimary,
              }}
              onFocus={e => {
                e.target.style.borderColor = godColors.gold.primary;
                e.target.style.boxShadow = `0 0 12px ${godColors.gold.primary}20`;
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <motion.button
              onClick={onStartLocal}
              className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${godColors.gold.primary}, ${godColors.gold.dark})`,
                color: base.textDark,
                boxShadow: `0 4px 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
              whileHover={{ scale: 1.02, boxShadow: `0 6px 30px ${godColors.gold.glowStrong}` }}
              whileTap={{ scale: 0.97 }}
            >
              Local Game
            </motion.button>

            <div className="flex gap-3">
              <motion.button
                onClick={handleCreateRoom}
                className="flex-1 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${godColors.gold.border}`,
                  color: godColors.gold.light,
                }}
                whileHover={{
                  background: godColors.gold.surface,
                  boxShadow: `0 0 20px ${godColors.gold.glow}`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                Create Room
              </motion.button>

              <motion.button
                onClick={() => { setView('joining'); setError(null); }}
                className="flex-1 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: base.textSecondary,
                }}
                whileHover={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                Join Room
              </motion.button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
