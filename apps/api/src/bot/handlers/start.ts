import { BotContext } from '../index';
import prisma from '../../utils/db';
import { getMainMenuKeyboard } from '../keyboards/main';

export async function startHandler(ctx: BotContext) {
  try {
    const telegramId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;

    if (!telegramId || !chatId) {
      return ctx.reply('Sorry, I couldn\'t identify you. Please try again.');
    }

    // Check if user exists
    let telegramUser = await prisma.telegramUser.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (!telegramUser) {
      // Create new user (unauthorized by default)
      telegramUser = await prisma.telegramUser.create({
        data: {
          telegramId: BigInt(telegramId),
          chatId: BigInt(chatId),
          username: username || null,
          firstName: firstName || null,
          lastName: lastName || null,
          isAuthorized: true, // Auto-authorize for now (no auth flow yet)
          role: 'VIEWER'
        }
      });

      // Welcome new user
      const welcomeMessage = `👋 *Welcome to Stock Manager Bot!*

Hello ${firstName}! I'm your inventory assistant.

I can help you:
📦 View products and stock levels
📊 Check stock movements
📋 View orders
📈 Get reports and insights

Type /help to see all available commands, or use the menu below to get started.`;

      return ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    }

    // Existing user - show menu
    const userName = firstName || username || 'there';

    if (!telegramUser.isAuthorized) {
      return ctx.reply(
        `👋 Welcome back, ${userName}!\n\n` +
        `⚠️ You need authorization to access inventory features.\n` +
        `Please contact your admin for an access code.\n\n` +
        `Use /auth [code] to authorize.`
      );
    }

    const greeting = `👋 Welcome back, ${userName}!

What would you like to do today?

Use the menu below or type /help for commands.`;

    return ctx.reply(greeting, getMainMenuKeyboard());

  } catch (error) {
    console.error('Error in start handler:', error);
    return ctx.reply('Sorry, an error occurred. Please try again later.');
  }
}
