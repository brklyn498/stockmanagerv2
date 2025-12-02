import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, ArrowUpCircle } from 'lucide-react';
import Badge from './Badge';

interface StockStatusBadgeProps {
  quantity: number;
  minStock: number;
  maxStock?: number;
  className?: string;
  showIcon?: boolean;
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  quantity,
  minStock,
  maxStock,
  className = '',
  showIcon = true,
}) => {
  if (quantity === 0) {
    return (
      <Badge variant="danger" className={`flex items-center gap-1 ${className}`}>
        {showIcon && <XCircle size={14} />}
        <span>Out of Stock</span>
      </Badge>
    );
  }

  if (quantity < minStock) {
    return (
      <Badge variant="warning" className={`flex items-center gap-1 ${className}`}>
        {showIcon && <AlertTriangle size={14} />}
        <span>Low Stock</span>
      </Badge>
    );
  }

  if (maxStock && quantity > maxStock) {
    return (
      <Badge variant="purple" className={`flex items-center gap-1 ${className}`}>
        {showIcon && <ArrowUpCircle size={14} />}
        <span>Overstocked</span>
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={`flex items-center gap-1 ${className}`}>
      {showIcon && <CheckCircle size={14} />}
      <span>Normal</span>
    </Badge>
  );
};

export default StockStatusBadge;
