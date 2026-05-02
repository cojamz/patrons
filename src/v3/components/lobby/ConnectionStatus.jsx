/**
 * ConnectionStatus — Non-blocking banners for multiplayer connection issues.
 *
 * Two modes:
 *   1. "Reconnecting..." overlay when this client loses connection
 *   2. "Player X disconnected" amber banner when a remote player drops
 *
 * Both are non-blocking — the game continues underneath.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, playerColors } from '../../styles/theme';
import { db, ref, onValue } from '../../firebase/config';
import WorkerIcon from '../icons/WorkerIcon';

/**
 * Shows reconnecting overlay when this guest client is disconnected.
 */
export function ReconnectingOverlay({ connectionState }) {
  if (connectionState === 'connected') return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[90] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(12, 10, 9, 0.5)' }}
        />
        <motion.div
          className="relative flex items-center gap-3 px-6 py-3 rounded-xl"
          style={{
            background: 'rgba(28, 25, 23, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.1)',
          }}
          initial={{ y: 20, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: '#F59E0B' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-sm font-semibold" style={{ color: '#FCD34D' }}>
            Reconnecting...
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Shows amber banner when remote players disconnect during a game.
 * Watches Firebase room.players[id].connected for all players.
 */
export function DisconnectedPlayerBanner({ roomCode, slotMap, game }) {
  const [disconnected, setDisconnected] = useState([]);

  useEffect(() => {
    if (!roomCode || !game?.players) return;

    const playersRef = ref(db, `v3rooms/${roomCode}/players`);
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) return;

      // Build reverse slotMap: slot → fbPlayerId
      const slotToFb = {};
      for (const [fbId, slot] of Object.entries(slotMap || {})) {
        slotToFb[slot] = fbId;
      }

      const disc = [];
      for (const player of game.players) {
        const fbId = slotToFb[player.id];
        if (fbId && val[fbId] && val[fbId].connected === false) {
          disc.push({ slot: player.id, name: player.name });
        }
      }
      setDisconnected(disc);
    });

    return unsubscribe;
  }, [roomCode, slotMap, game?.players]);

  if (disconnected.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[85] flex justify-center pointer-events-none">
      <AnimatePresence>
        {disconnected.map(({ slot, name }) => {
          const colors = playerColors[slot] || playerColors[0];
          return (
            <motion.div
              key={slot}
              className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg pointer-events-auto"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <WorkerIcon playerId={slot} size={16} />
              <span className="text-xs font-semibold" style={{ color: '#FCD34D' }}>
                {name} disconnected
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
