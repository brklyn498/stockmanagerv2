import { BotContext } from '../index';

export async function reportsHandler(ctx: BotContext) {
  return ctx.reply(
    '📈 *Reports*\n\n' +
    'Available reports:\n' +
    '/report inventory - Inventory summary\n' +
    '/report movements - Movement report\n' +
    '/report value - Inventory valuation\n\n' +
    '_Report commands coming soon!_',
    { parse_mode: 'Markdown' }
  );
}
