export interface ActivityItem {
  id: string;
  product: string;
  action: 'Stock In' | 'Stock Out' | 'Low Stock Alert';
  quantity: string;
  date: string;
}

export interface Stats {
  totalProducts: number;
  stockValue: number;
  lowStockItems: number;
  pendingOrders: number;
}

export interface InsightResponse {
  summary: string;
  actionItems: string[];
}
