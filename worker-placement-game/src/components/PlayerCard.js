import React from 'react';

const PlayerCard = ({ player, isCurrentPlayer }) => {
  const getPlayerStyle = () => {
    let baseStyle = "bg-white rounded-lg shadow-md p-4 transition-all duration-200";
    if (isCurrentPlayer) {
      baseStyle += " ring-4 ring-blue-400 ring-opacity-50 shadow-lg transform scale-105";
    }
    return baseStyle;
  };
  
  const getResourceIcon = (color, amount) => {
    const colors = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-500', 
      blue: 'bg-blue-500',
      purple: 'bg-purple-500'
    };
    
    return (
      <div className={`w-8 h-8 rounded ${colors[color]} flex items-center justify-center text-white font-bold text-sm`}>
        {amount}
      </div>
    );
  };
  
  return (
    <div className={getPlayerStyle()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">
          {player.name}
          {isCurrentPlayer && <span className="text-blue-500 ml-2">🎯</span>}
        </h3>
        <div className="text-2xl font-bold text-blue-600">
          {player.victoryPoints} VP
        </div>
      </div>
      
      <div className="flex gap-2 mb-3">
        {getResourceIcon('red', player.resources.red)}
        {getResourceIcon('yellow', player.resources.yellow)}
        {getResourceIcon('blue', player.resources.blue)}
        {getResourceIcon('purple', player.resources.purple)}
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        Workers left: <span className="font-semibold">{player.workersLeft}</span>
      </div>
      
      {player.effects.length > 0 && (
        <div className="text-xs text-gray-500">
          <div className="font-semibold mb-1">Effects:</div>
          {player.effects.map((effect, index) => (
            <div key={index} className="bg-gray-100 rounded px-2 py-1 mb-1">
              {effect}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;