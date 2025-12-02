import { BotContext } from '../index';
import { helpHandler } from './help';
import { productsHandler } from './products';
import { stockHandler } from './stock';
import { ordersHandler } from './orders';
import { reportsHandler } from './reports';
import { settingsHandler } from './settings';

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
      return stockHandler(ctx);

    case 'menu_orders':
      return ordersHandler(ctx);

    case 'menu_reports':
      return reportsHandler(ctx);

    case 'menu_settings':
      return settingsHandler(ctx);

    case 'menu_help':
      return helpHandler(ctx);

    default:
      return ctx.reply('Unknown action. Please try again or use /menu');
  }
}
