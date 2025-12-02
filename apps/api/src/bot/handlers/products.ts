import { BotContext } from '../index';
import prisma from '../../utils/db';
import {
  formatProductList,
  formatProductCard,
  escapeMarkdownV2,
  getStockStatusEmoji,
  getStockStatus
} from '../utils/formatter';
import {
  paginationKeyboard,
  productActionsKeyboard
} from '../keyboards/products';
import { Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';

export async function productsHandler(ctx: BotContext) {
  try {
    const page = 1;
    const pageSize = 10;

    const products = await prisma.product.findMany({
      take: pageSize,
      orderBy: { name: 'asc' }
    });

    const totalCount = await prisma.product.count();
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return ctx.reply(
      formatProductList(products, page, totalPages),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: paginationKeyboard(page, totalPages).reply_markup
      }
    );
  } catch (error) {
    console.error('Error in products handler:', error);
    return ctx.reply('Sorry, an error occurred while fetching products.');
  }
}

export async function lowStockHandler(ctx: BotContext) {
  try {
    const allProducts = await prisma.product.findMany({
      orderBy: { quantity: 'asc' },
      include: {
        category: true,
        supplier: true
      }
    });

    const products = allProducts.filter((p) =>
      p.minStock !== null && p.quantity <= p.minStock
    );

    if (products.length === 0) {
      return ctx.reply('✅ *All products are adequately stocked\\!*', { parse_mode: 'MarkdownV2' });
    }

    let message = '⚠️ *Low Stock Alert*\n━━━━━━━━━━━━━━━━━━━━\n\n';

    // Group by category for better readability in alert
    for (const product of products.slice(0, 15)) { // Limit to avoid message size limits
      const status = getStockStatus(product);
      const safeName = escapeMarkdownV2(product.name);
      message += `${status.emoji} *${safeName}*\n`;
      message += `   SKU: \`${escapeMarkdownV2(product.sku)}\`\n`;
      message += `   Stock: ${product.quantity} \\| Min: ${product.minStock}\n\n`;
    }

    if (products.length > 15) {
      message += `_...and ${products.length - 15} more items._`;
    }

    return ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('📦 View Products', 'products_list')]
      ]).reply_markup
    });
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
      return ctx.reply('✅ *No products are out of stock\\!*', { parse_mode: 'MarkdownV2' });
    }

    let message = '🚫 *Out of Stock*\n━━━━━━━━━━━━━━━━━━━━\n\n';

    for (const product of products.slice(0, 15)) {
      const safeName = escapeMarkdownV2(product.name);
      message += `❌ *${safeName}*\n`;
      message += `   SKU: \`${escapeMarkdownV2(product.sku)}\`\n\n`;
    }

    if (products.length > 15) {
      message += `_...and ${products.length - 15} more items._`;
    }

    return ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: Markup.inlineKeyboard([
         [Markup.button.callback('📦 View Products', 'products_list')]
      ]).reply_markup
    });
  } catch (error) {
    console.error('Error in out of stock handler:', error);
    return ctx.reply('Sorry, an error occurred while checking stock.');
  }
}

export async function productSearchHandler(ctx: BotContext, searchTerm: string) {
  try {
    const allProducts = await prisma.product.findMany({
      take: 100, // Reasonable limit
      include: {
        category: true,
        supplier: true
      }
    });

    const searchLower = searchTerm.toLowerCase();
    const products = allProducts.filter((p) =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      (p.description && p.description.toLowerCase().includes(searchLower))
    );

    if (products.length === 0) {
      return ctx.reply(`❌ No products found matching "*${escapeMarkdownV2(searchTerm)}*"`, { parse_mode: 'MarkdownV2' });
    }

    // Single result - show full details
    if (products.length === 1) {
      const product = products[0];
      return sendProductDetails(ctx, product);
    }

    // Multiple results - show list
    const topResults = products.slice(0, 5);
    let message = `🔍 *Search Results for "${escapeMarkdownV2(searchTerm)}"* \n\n`;

    for (const product of topResults) {
      const status = getStockStatusEmoji(product);
      const safeName = escapeMarkdownV2(product.name);
      message += `${status} *${safeName}* \\(${product.quantity} pcs\\)\n`;
      message += `/product\\_${escapeMarkdownV2(product.id)}\n\n`;
    }

    if (products.length > 5) {
        message += `_...and ${products.length - 5} more. Try a more specific query._`;
    }

    const buttons = topResults.map(p => [
        Markup.button.callback(p.name, `product_view_${p.id}`)
    ]);

    return ctx.reply(message, {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  } catch (error) {
    console.error('Error in product search handler:', error);
    return ctx.reply('Sorry, an error occurred while searching products.');
  }
}

export async function sendProductDetails(ctx: BotContext, product: any) {
    try {
        // Ensure product has all relations
        if (!product.category || product.supplier === undefined) {
             product = await prisma.product.findUnique({
                 where: { id: product.id },
                 include: { category: true, supplier: true }
             });
        }

        const cardText = formatProductCard(product);
        const keyboard = productActionsKeyboard(product.id);

        // Handle Image
        if (product.imageUrl) {
            // Determine if it's a local upload or external URL
            // Assuming local uploads start with /uploads/ or just filename
            // And external URLs are full http/https

            // NOTE: The user confirmed using fs.createReadStream for local files

            const isExternal = product.imageUrl.startsWith('http');

            if (isExternal) {
                await ctx.replyWithPhoto(
                    { url: product.imageUrl },
                    {
                        caption: cardText,
                        parse_mode: 'MarkdownV2',
                        reply_markup: keyboard.reply_markup
                    }
                );
            } else {
                // Local file handling
                // The DB stores paths like 'uploads/filename.jpg' or '/uploads/filename.jpg'
                // We need to resolve this to the absolute file path on disk

                // Remove leading slash if present
                const relativePath = product.imageUrl.startsWith('/') ? product.imageUrl.slice(1) : product.imageUrl;
                const filePath = path.resolve(process.cwd(), relativePath);

                if (fs.existsSync(filePath)) {
                     await ctx.replyWithPhoto(
                        { source: fs.createReadStream(filePath) },
                        {
                            caption: cardText,
                            parse_mode: 'MarkdownV2',
                            reply_markup: keyboard.reply_markup
                        }
                    );
                } else {
                     // Fallback if file not found
                     console.warn(`Image file not found at: ${filePath}`);
                     await ctx.reply(cardText, {
                        parse_mode: 'MarkdownV2',
                        reply_markup: keyboard.reply_markup
                    });
                }
            }
        } else {
            // No image
            await ctx.reply(cardText, {
                parse_mode: 'MarkdownV2',
                reply_markup: keyboard.reply_markup
            });
        }
    } catch (error) {
        console.error('Error sending product details:', error);
        await ctx.reply('Error displaying product details.');
    }
}
