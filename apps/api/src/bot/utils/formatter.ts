import { Product, Category, Supplier } from '@prisma/client';

// Escape function - ALWAYS use this for user data
export function escapeMarkdownV2(text: string): string {
  if (!text) return '';
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

type ProductWithRelations = Product & {
  category: Category;
  supplier: Supplier | null;
};

export function formatProductCard(product: any): string { // Using any loosely to avoid strict relation checks if types are missing
  const status = getStockStatus(product);

  // Calculate margin safely
  let margin = '0.0';
  if (product.price && product.price > 0) {
     // product model has 'price' (retail) and 'costPrice'
     margin = ((product.price - product.costPrice) / product.price * 100).toFixed(1);
  }

  const safeName = escapeMarkdownV2(product.name);
  const safeCategory = product.category ? escapeMarkdownV2(product.category.name) : 'N/A';
  const safeSupplier = product.supplier ? escapeMarkdownV2(product.supplier.name) : 'N/A';
  const safeSku = escapeMarkdownV2(product.sku);

  return `📦 *${safeName}*
━━━━━━━━━━━━━━━━━━━━
SKU: \`${safeSku}\`
Category: ${safeCategory}
Supplier: ${safeSupplier}

💰 *Pricing*
Cost: $${product.costPrice.toFixed(2)}
Retail: $${product.price.toFixed(2)}
Margin: ${escapeMarkdownV2(margin)}%

📊 *Stock*
Current: ${product.quantity} pieces
Min: ${product.minStock} \\| Max: ${product.maxStock || '∞'}
Status: ${status.emoji} ${escapeMarkdownV2(status.text)}

📅 Last Movement: ${escapeMarkdownV2(formatRelativeTime(product.updatedAt))}`;
}

export function formatProductList(
  products: Product[],
  page: number,
  totalPages: number
): string {
  if (products.length === 0) {
    return '📦 *Products*\n\nNo products found\\.';
  }

  const lines = products.map((p, i) => {
    const status = getStockStatusEmoji(p);
    const safeName = escapeMarkdownV2(p.name);
    return `${(page - 1) * 10 + i + 1}\\. ${safeName} \\- ${p.quantity} pcs ${status}`;
  });

  return `📦 *Products \\(Page ${page}/${totalPages}\\)*
━━━━━━━━━━━━━━━━━━━━

${lines.join('\n')}`;
}

export function getStockStatus(product: { quantity: number; minStock: number; maxStock?: number | null }): { emoji: string; text: string } {
  if (product.quantity === 0) return { emoji: '❌', text: 'Out of Stock' };
  if (product.quantity <= product.minStock) return { emoji: '⚠️', text: 'Low Stock' };
  if (product.maxStock && product.quantity >= product.maxStock) return { emoji: '📈', text: 'Overstocked' };
  return { emoji: '✅', text: 'Normal' };
}

export function getStockStatusEmoji(product: { quantity: number; minStock: number }): string {
  if (product.quantity === 0) return '❌';
  if (product.quantity <= product.minStock) return '⚠️';
  return '✅';
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} mins ago`;
  return 'Just now';
}
