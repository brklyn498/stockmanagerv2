import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { startHandler } from './handlers/start';
import { helpHandler } from './handlers/help';
import { menuHandler } from './handlers/menu';

export interface BotContext extends Context<Update> {
  // Add custom context properties here if needed
}

let bot: Telegraf<BotContext> | null = null;

export function initializeBot(): Telegraf<BotContext> | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log('⚠️  Telegram bot token not found. Bot will not start.');
    console.log('   Add TELEGRAM_BOT_TOKEN to .env to enable Telegram bot.');
    return null;
  }

  console.log('🤖 Initializing Telegram bot...');

  bot = new Telegraf<BotContext>(token);

  // Register command handlers
  bot.command('start', startHandler);
  bot.command('help', helpHandler);
  bot.command('menu', menuHandler);

  // Error handling
  bot.catch((err, ctx) => {
    console.error(`❌ Bot error for ${ctx.updateType}:`, err);
    ctx.reply('Sorry, an error occurred. Please try again.').catch(console.error);
  });

  // Start bot
  const mode = process.env.BOT_MODE || 'polling';

  if (mode === 'polling') {
    bot.launch({
      dropPendingUpdates: true,
    }).then(() => {
      console.log('🤖 Telegram bot started in polling mode');
      console.log('   Send /start to your bot to begin!');
    }).catch(err => {
      console.error('❌ Failed to start Telegram bot:', err);
    });

    // Enable graceful stop
    process.once('SIGINT', () => {
      console.log('🛑 Stopping Telegram bot...');
      bot?.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      console.log('🛑 Stopping Telegram bot...');
      bot?.stop('SIGTERM');
    });
  } else {
    console.log('🤖 Telegram bot initialized (webhook mode - needs webhook setup)');
  }

  return bot;
}

export function getBot(): Telegraf<BotContext> | null {
  return bot;
}
