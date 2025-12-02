import { BotContext } from '../index';

export async function stockHandler(ctx: BotContext) {
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
}
