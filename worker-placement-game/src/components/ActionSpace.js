import React from 'react';
import { useGame } from '../GameContext';

const ActionSpace = ({ actionId, title, description, round, available = true }) => {
  const { state, dispatch } = useGame();
  const isOccupied = state.occupiedSpaces[actionId];
  const occupyingPlayer = isOccupied ? state.players.find(p => p.id === isOccupied) : null;
  
  const handleClick = () => {
    if (isOccupied || !available) return;
    
    const currentPlayer = state.players.find(p => p.id === state.currentPlayer);
    if (currentPlayer.workersLeft <= 0) return;
    
    if (state.workerPlacedThisTurn) {
      alert('You have already placed a worker this turn. End your turn or buy from shops.');
      return;
    }
    
    // Place worker
    dispatch({ type: 'PLACE_WORKER', actionId });
    
    // Execute action (simplified for now)
    executeAction(actionId, currentPlayer, dispatch);
  };
  
  const getRoundStyle = () => {
    if (round === 1) return 'bg-gray-100 border-gray-300';
    if (round === 2) return 'bg-green-100 border-green-500';
    if (round === 3) return 'bg-yellow-100 border-yellow-500';
    return 'bg-gray-100 border-gray-300';
  };
  
  const getAvailabilityStyle = () => {
    if (!available) return 'opacity-50';
    if (isOccupied) return 'bg-red-100 border-red-400 cursor-not-allowed';
    return 'hover:bg-blue-50 hover:border-blue-400 cursor-pointer transform hover:scale-105';
  };
  
  return (
    <div 
      className={`relative p-4 border-2 rounded-lg min-h-24 flex flex-col justify-center text-center transition-all duration-200 ${getRoundStyle()} ${getAvailabilityStyle()}`}
      onClick={handleClick}
    >
      <div className="font-bold text-sm mb-1">{title}</div>
      <div className="text-xs text-gray-600">{description}</div>
      
      {occupyingPlayer && (
        <div 
          className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold player-${occupyingPlayer.id}`}
        >
          {occupyingPlayer.id}
        </div>
      )}
      
      <div className="absolute bottom-1 right-1 text-xs text-gray-500">
        R{round}
      </div>
    </div>
  );
};

// Simplified action execution (we'll expand this)
function executeAction(actionId, player, dispatch) {
  const basicGains = {
    'gain3red': { red: 3 },
    'gain2red': { red: 2 },
    'gain3blue': { blue: 3 },
    'gain2blue': { blue: 2 },
    'gain3purple': { purple: 3 },
    'gain2purple': { purple: 2 }
  };
  
  if (basicGains[actionId]) {
    dispatch({
      type: 'UPDATE_RESOURCES',
      playerId: player.id,
      resources: basicGains[actionId]
    });
  }
  
  // Add more complex actions here
  console.log(`Player ${player.id} executed action: ${actionId}`);
}

export default ActionSpace;