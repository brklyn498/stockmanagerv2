import type { BotContext } from '../types.ts';
import { getMainMenuInline } from '../keyboards/main';

export async function menuHandler(ctx: BotContext) {
  const menuMessage = `📱 *Main Menu*

Choose an option below to get started:

📦 *Products* - View and search inventory
📊 *Stock* - Manage stock levels
📋 *Orders* - View and create orders
📈 *Reports* - Get insights and reports
⚙️ *Settings* - Configure preferences
❓ *Help* - View help and commands`;

  return ctx.reply(menuMessage, {
    parse_mode: 'Markdown',
    ...getMainMenuInline()
  });
}
