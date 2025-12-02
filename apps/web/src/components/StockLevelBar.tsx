import React from 'react';

interface StockLevelBarProps {
  quantity: number;
  minStock: number;
  maxStock?: number;
  className?: string;
  showLabels?: boolean;
}

export const StockLevelBar: React.FC<StockLevelBarProps> = ({
  quantity,
  minStock,
  maxStock = minStock * 3, // Default max for visualization if not provided
  className = '',
  showLabels = true,
}) => {
  // Determine status and color
  let colorClass = 'bg-green-400';
  let statusText = 'Normal';
  
  if (quantity === 0) {
    colorClass = 'bg-red-500';
    statusText = 'Out of Stock';
  } else if (quantity < minStock) {
    colorClass = 'bg-orange-400';
    statusText = 'Low Stock';
  } else if (maxStock && quantity > maxStock) {
    colorClass = 'bg-purple-400';
    statusText = 'Overstocked';
  }

  // Calculate percentage for bar width (capped at 100%)
  // Use a sensible max for the denominator if maxStock isn't explicitly set or is too low
  const denominator = Math.max(maxStock || minStock * 2, quantity, 1);
  const percentage = Math.min((quantity / denominator) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center mb-1 text-xs font-bold uppercase tracking-wide">
          <span>{statusText}</span>
          <span>{quantity} / {maxStock || '-'}</span>
        </div>
      )}
      <div className="w-full h-6 border-2 border-black bg-white relative">
        <div 
          className={`h-full border-r-2 border-black transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Min stock marker line */}
        <div 
          className="absolute top-0 bottom-0 border-l-2 border-black border-dashed opacity-50"
          style={{ left: `${Math.min((minStock / denominator) * 100, 100)}%` }}
          title={`Min Stock: ${minStock}`}
        />
      </div>
    </div>
  );
};

export default StockLevelBar;
