import type { BotContext } from '../types.ts';

export async function ordersHandler(ctx: BotContext) {
  return ctx.reply(
    '📋 *Orders*\n\n' +
    'Order features:\n' +
    '/orders - View recent orders\n' +
    '/order [id] - Order details\n\n' +
    '_Order commands coming soon!_',
    { parse_mode: 'Markdown' }
  );
}
