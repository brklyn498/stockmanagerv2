import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { startHandler } from './handlers/start';
import { helpHandler } from './handlers/help';
import { menuHandler } from './handlers/menu';
import { handleMenuCallback } from './handlers/callbacks';
import { productsHandler, lowStockHandler, outOfStockHandler, productSearchHandler } from './handlers/products';

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
  bot.hears('📊 Stock', (ctx) => ctx.reply(
    '📊 *Stock Management*\n\n' +
    'Stock features:\n' +
    '/stock - Stock menu\n' +
    '/add [sku] [qty] - Add stock\n' +
    '/remove [sku] [qty] - Remove stock\n' +
    '/movements - Recent movements\n\n' +
    '_Stock commands coming soon!_',
    { parse_mode: 'Markdown' }
  ));
  bot.hears('📋 Orders', (ctx) => ctx.reply(
    '📋 *Orders*\n\n' +
    'Order features:\n' +
    '/orders - View recent orders\n' +
    '/order [id] - Order details\n\n' +
    '_Order commands coming soon!_',
    { parse_mode: 'Markdown' }
  ));
  bot.hears('📈 Reports', (ctx) => ctx.reply(
    '📈 *Reports*\n\n' +
    'Available reports:\n' +
    '/report inventory - Inventory summary\n' +
    '/report movements - Movement report\n' +
    '/report value - Inventory valuation\n\n' +
    '_Report commands coming soon!_',
    { parse_mode: 'Markdown' }
  ));
  bot.hears('⚙️ Settings', (ctx) => ctx.reply(
    '⚙️ *Settings*\n\n' +
    'Notification preferences:\n' +
    '• Low stock alerts\n' +
    '• Order notifications\n' +
    '• Daily reports\n' +
    '• Weekly summaries\n\n' +
    '_Settings coming soon!_',
    { parse_mode: 'Markdown' }
  ));
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
