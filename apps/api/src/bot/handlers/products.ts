import { BotContext } from '../index';
import prisma from '../../utils/db';

export async function productsHandler(ctx: BotContext) {
  try {
    // Fetch products from database
    const products = await prisma.product.findMany({
      take: 10, // Limit to 10 products per message
      orderBy: { name: 'asc' }
    });

    if (products.length === 0) {
      return ctx.reply('📦 No products found in inventory.');
    }

    // Format products into a message
    let message = '📦 *Product List*\n\n';

    for (const product of products) {
      const stockStatus = getStockStatusEmoji(product.quantity, product.minStock);
      const price = product.price.toString();

      message += `${stockStatus} *${product.name}*\n`;
      message += `   SKU: \`${product.sku}\`\n`;
      message += `   Stock: ${product.quantity} units`;
      if (product.minStock) {
        message += ` (min: ${product.minStock})`;
      }
      message += `\n`;
      message += `   Price: $${price}\n\n`;
    }

    const totalCount = await prisma.product.count();
    if (totalCount > 10) {
      message += `_Showing 10 of ${totalCount} products_\n`;
      message += `Use /product [name/sku] to search for specific items.`;
    }

    return ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in products handler:', error);
    return ctx.reply('Sorry, an error occurred while fetching products.');
  }
}

export async function lowStockHandler(ctx: BotContext) {
  try {
    // Get all products and filter in JavaScript
    const allProducts = await prisma.product.findMany({
      orderBy: { quantity: 'asc' }
    });

    const products = allProducts.filter(p =>
      p.minStock !== null && p.quantity <= p.minStock
    );

    if (products.length === 0) {
      return ctx.reply('✅ All products are adequately stocked!');
    }

    let message = '⚠️ *Low Stock Alert*\n\n';

    for (const product of products) {
      const stockStatus = getStockStatusEmoji(product.quantity, product.minStock);
      message += `${stockStatus} *${product.name}*\n`;
      message += `   SKU: \`${product.sku}\`\n`;
      message += `   Stock: ${product.quantity} / ${product.minStock} min\n`;
      message += `   Status: ${getStockStatusText(product.quantity, product.minStock)}\n\n`;
    }

    return ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in low stock handler:', error);
    return ctx.reply('Sorry, an error occurred while checking stock levels.');
  }
}

export async function outOfStockHandler(ctx: BotContext) {
  try {
    const products = await prisma.product.findMany({
      where: { quantity: 0 },
      orderBy: { name: 'asc' }
    });

    if (products.length === 0) {
      return ctx.reply('✅ No products are out of stock!');
    }

    let message = '🚫 *Out of Stock*\n\n';

    for (const product of products) {
      message += `❌ *${product.name}*\n`;
      message += `   SKU: \`${product.sku}\`\n\n`;
    }

    message += `_${products.length} product(s) need restocking_`;

    return ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in out of stock handler:', error);
    return ctx.reply('Sorry, an error occurred while checking stock.');
  }
}

export async function productSearchHandler(ctx: BotContext, searchTerm: string) {
  try {
    // Get all products and filter in JavaScript for case-insensitive search
    const allProducts = await prisma.product.findMany({
      take: 100 // Reasonable limit
    });

    const searchLower = searchTerm.toLowerCase();
    const products = allProducts.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
    ).slice(0, 5);

    if (products.length === 0) {
      return ctx.reply(`No products found matching "${searchTerm}"`);
    }

    let message = `🔍 *Search Results for "${searchTerm}"*\n\n`;

    for (const product of products) {
      const stockStatus = getStockStatusEmoji(product.quantity, product.minStock);
      const price = product.price.toString();

      message += `${stockStatus} *${product.name}*\n`;
      message += `   SKU: \`${product.sku}\`\n`;
      message += `   Price: $${price}\n`;
      message += `   Stock: ${product.quantity} units`;
      if (product.minStock) {
        message += ` (min: ${product.minStock})`;
      }
      message += `\n`;

      if (product.description) {
        message += `   ${product.description}\n`;
      }
      message += '\n';
    }

    if (products.length === 5) {
      message += '_Showing first 5 results. Refine your search for more specific results._';
    }

    return ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in product search handler:', error);
    return ctx.reply('Sorry, an error occurred while searching products.');
  }
}

// Helper functions
function getStockStatusEmoji(quantity: number, minStock: number | null): string {
  if (quantity === 0) return '🔴';
  if (minStock && quantity <= minStock) return '🟠';
  return '🟢';
}

function getStockStatusText(quantity: number, minStock: number | null): string {
  if (quantity === 0) return 'Out of Stock';
  if (minStock && quantity <= minStock) return 'Low Stock';
  return 'In Stock';
}
