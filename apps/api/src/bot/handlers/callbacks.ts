import { BotContext } from '../index';
import { helpHandler } from './help';
import { productsHandler } from './products';
import { stockHandler } from './stock';
import { ordersHandler } from './orders';
import { reportsHandler } from './reports';
import { settingsHandler } from './settings';
import { sendProductDetails } from './products';
import { formatProductList } from '../utils/formatter';
import { paginationKeyboard } from '../keyboards/products';
import prisma from '../../utils/db';

export async function handleMenuCallback(ctx: BotContext) {
  const callbackData = (ctx.callbackQuery as any)?.data;

  if (!callbackData) {
    return;
  }

  // Answer the callback query to remove loading state (except for long ops)
  await ctx.answerCbQuery();

  // Menu Navigation
  if (callbackData === 'menu_products') return productsHandler(ctx);
  if (callbackData === 'menu_stock') return stockHandler(ctx);
  if (callbackData === 'menu_orders') return ordersHandler(ctx);
  if (callbackData === 'menu_reports') return reportsHandler(ctx);
  if (callbackData === 'menu_settings') return settingsHandler(ctx);
  if (callbackData === 'menu_help') return helpHandler(ctx);
  if (callbackData === 'products_list') return productsHandler(ctx);

  // Pagination: products_page_X
  const pageMatch = callbackData.match(/^products_page_(\d+)$/);
  if (pageMatch) {
    const page = parseInt(pageMatch[1]);
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const products = await prisma.product.findMany({
      take: pageSize,
      skip: skip,
      orderBy: { name: 'asc' }
    });

    const totalCount = await prisma.product.count();
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    try {
      await ctx.editMessageText(
        formatProductList(products, page, totalPages),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: paginationKeyboard(page, totalPages).reply_markup
        }
      );
    } catch (e) {
      // If message content is identical, Telegram throws an error. Ignore it.
      console.log('Pagination error (likely same content):', e);
    }
    return;
  }

  // Product View: product_view_ID
  const viewMatch = callbackData.match(/^product_view_(.+)$/);
  if (viewMatch) {
      const productId = viewMatch[1];
      const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { category: true, supplier: true }
      });

      if (product) {
          // Delete the previous message to clean up chat if user came from search list
          // await ctx.deleteMessage().catch(() => {});
          // Actually, keeping history is often better. Let's send a new message.
          return sendProductDetails(ctx, product);
      } else {
          return ctx.reply('Product not found.');
      }
  }

  // Placeholders for Phase T3/T4
  if (callbackData.startsWith('stock_add_') ||
      callbackData.startsWith('stock_remove_') ||
      callbackData.startsWith('product_edit_') ||
      callbackData.startsWith('product_history_')) {
      return ctx.reply('🚧 This feature is coming in Phase T3 (Stock Management)!');
  }

  if (callbackData === 'products_search') {
      return ctx.reply('🔍 To search, type: /product [name or sku]');
  }

  if (callbackData === 'products_low') {
      // Use the existing lowStockHandler logic but via callback
      // We need to import it or redirect flow.
      // Redirecting via imported handler:
      const { lowStockHandler } = await import('./products');
      return lowStockHandler(ctx);
  }

  if (callbackData === 'noop') {
      return; // Do nothing
  }

  // Fallback
  // return ctx.reply('Unknown action.');
}
