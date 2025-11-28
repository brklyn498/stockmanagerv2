import React from 'react';

interface BadgeProps {
  type: 'Stock In' | 'Stock Out' | 'Low Stock Alert';
}

const Badge: React.FC<BadgeProps> = ({ type }) => {
  let bgColor = 'bg-gray-200';
  
  switch (type) {
    case 'Stock In':
      bgColor = 'bg-neoGreen';
      break;
    case 'Stock Out':
      bgColor = 'bg-neoRed'; // Using red/pink for stock out to match image's "Stock Out" which is reddish
      break;
    case 'Low Stock Alert':
      bgColor = 'bg-neoYellow';
      break;
  }

  return (
    <span className={`${bgColor} border-2 border-black px-3 py-1 text-sm font-bold rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap`}>
      {type}
    </span>
  );
};

export default Badge;