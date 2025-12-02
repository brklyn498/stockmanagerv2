import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { startHandler } from './handlers/start';
import { helpHandler } from './handlers/help';
import { menuHandler } from './handlers/menu';
import { handleMenuCallback } from './handlers/callbacks';
import { productsHandler, lowStockHandler, outOfStockHandler, productSearchHandler } from './handlers/products';
import { stockHandler } from './handlers/stock';
import { ordersHandler } from './handlers/orders';
import { reportsHandler } from './handlers/reports';
import { settingsHandler } from './handlers/settings';

export interface BotContext extends Context<Update> {
  // Add custom context properties here if needed
}

let bot: Telegraf<BotContext> | null = null;

export function initializeBot(): Telegraf<BotContext> | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log('⚠️  Telegram bot token not found in environment variables.');
    console.log('   Please check your .env file and ensure TELEGRAM_BOT_TOKEN is set.');
    console.log('   Bot functionality will be disabled.');
    return null;
  }

  // Mask token for security in logs
  const maskedToken = token.substring(0, 5) + '...' + token.substring(token.length - 5);
  console.log(`🤖 Initializing Telegram bot with token: ${maskedToken}`);

  bot = new Telegraf<BotContext>(token);

  // Register command handlers
  bot.command('start', startHandler);
  bot.command('help', helpHandler);
  bot.command('menu', menuHandler);

  // Product commands
  bot.command('products', productsHandler);
  bot.command('low', lowStockHandler);
  bot.command('out', outOfStockHandler);
  bot.command('product', (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      return ctx.reply('Please provide a product name or SKU.\nExample: /product laptop');
    }
    return productSearchHandler(ctx, args.join(' '));
  });

  // Register text handlers for menu buttons
  bot.hears('📦 Products', productsHandler);
  bot.hears('📊 Stock', stockHandler);
  bot.hears('📋 Orders', ordersHandler);
  bot.hears('📈 Reports', reportsHandler);
  bot.hears('⚙️ Settings', settingsHandler);
  bot.hears('❓ Help', helpHandler);

  // Register callback query handlers for inline buttons
  bot.on('callback_query', handleMenuCallback);

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
