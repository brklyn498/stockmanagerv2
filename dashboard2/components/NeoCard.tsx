import React from 'react';

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  color?: 'white' | 'yellow' | 'green' | 'pink' | 'blue';
  onClick?: () => void;
}

const colorMap = {
  white: 'bg-white',
  yellow: 'bg-neoYellow',
  green: 'bg-neoGreen',
  pink: 'bg-neoPink',
  blue: 'bg-neoBlue',
};

const NeoCard: React.FC<NeoCardProps> = ({ children, className = '', color = 'white', onClick }) => {
  return (
    <div 
      className={`border-2 border-black shadow-neo rounded-md ${colorMap[color]} ${className} ${onClick ? 'cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none transition-all' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default NeoCard;