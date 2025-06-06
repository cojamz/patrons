import React from 'react';
import ActionSpace from './ActionSpace';
import Shop from './Shop';

const GameLayer = ({ color, title, icon, actions, round }) => {
  const getLayerStyle = () => {
    const baseStyle = "bg-white rounded-xl shadow-lg p-6 border-l-8";
    switch (color) {
      case 'red': return `${baseStyle} border-l-red-500`;
      case 'yellow': return `${baseStyle} border-l-yellow-500`;
      case 'blue': return `${baseStyle} border-l-blue-500`;
      case 'purple': return `${baseStyle} border-l-purple-500`;
      default: return `${baseStyle} border-l-gray-500`;
    }
  };
  
  const getIconColor = () => {
    switch (color) {
      case 'red': return 'text-red-500';
      case 'yellow': return 'text-yellow-500';
      case 'blue': return 'text-blue-500';
      case 'purple': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };
  
  // Filter actions based on current round
  const availableActions = actions.filter(action => action.round <= round);
  
  return (
    <div className={getLayerStyle()}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${getIconColor()}`}>
          {icon} {title}
        </h2>
        <span className="text-gray-600 text-lg">
          Round {round} ({availableActions.length} spaces)
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {availableActions.map(action => (
          <ActionSpace
            key={action.id}
            actionId={action.id}
            title={action.title}
            description={action.description}
            round={action.round}
            available={action.round <= round}
          />
        ))}
      </div>
      
      <div className="flex gap-4">
        <Shop color={color} type="regular" />
        <Shop color={color} type="victory" />
      </div>
      
      {round < 3 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-sm text-yellow-800">
          <strong>Round {round + 1}:</strong> Will add {round === 1 ? '2 more' : '1 ultimate'} action spaces
        </div>
      )}
    </div>
  );
};

export default GameLayer;