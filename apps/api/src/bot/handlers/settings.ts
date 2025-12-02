import type { BotContext } from '../types.ts';

export async function settingsHandler(ctx: BotContext) {
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
}
