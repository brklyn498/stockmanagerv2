import { BotContext } from '../index';
import { helpHandler } from './help';
import { productsHandler } from './products';

export async function handleMenuCallback(ctx: BotContext) {
  const callbackData = (ctx.callbackQuery as any)?.data;

  if (!callbackData) {
    return;
  }

  // Answer the callback query to remove loading state
  await ctx.answerCbQuery();

  switch (callbackData) {
    case 'menu_products':
      return productsHandler(ctx);

    case 'menu_stock':
      return ctx.reply(
        '📊 *Stock Management*\n\n' +
        'Stock features:\n' +
        '/stock - Stock menu\n' +
        '/add [sku] [qty] - Add stock\n' +
        '/remove [sku] [qty] - Remove stock\n' +
        '/movements - Recent movements\n\n' +
        '_Stock commands coming soon!_',
        { parse_mode: 'Markdown' }
      );

    case 'menu_orders':
      return ctx.reply(
        '📋 *Orders*\n\n' +
        'Order features:\n' +
        '/orders - View recent orders\n' +
        '/order [id] - Order details\n\n' +
        '_Order commands coming soon!_',
        { parse_mode: 'Markdown' }
      );

    case 'menu_reports':
      return ctx.reply(
        '📈 *Reports*\n\n' +
        'Available reports:\n' +
        '/report inventory - Inventory summary\n' +
        '/report movements - Movement report\n' +
        '/report value - Inventory valuation\n\n' +
        '_Report commands coming soon!_',
        { parse_mode: 'Markdown' }
      );

    case 'menu_settings':
      return ctx.reply(
        '⚙️ *Settings*\n\n' +
        'Notification preferences:\n' +
        '• Low stock alerts\n' +
        '• Order notifications\n' +
        '• Daily reports\n' +
        '• Weekly summaries\n\n' +
        '_Settings coming soon!_',
        { parse_mode: 'Markdown' }
      );

    case 'menu_help':
      return helpHandler(ctx);

    default:
      return ctx.reply('Unknown action. Please try again or use /menu');
  }
}
