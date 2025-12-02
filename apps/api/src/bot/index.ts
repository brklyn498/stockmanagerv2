import { Telegraf, Scenes } from 'telegraf';
import { startHandler } from './handlers/start';
import { helpHandler } from './handlers/help';
import { menuHandler } from './handlers/menu';
import { handleMenuCallback } from './handlers/callbacks';
import { productsHandler, lowStockHandler, outOfStockHandler, productSearchHandler } from './handlers/products';
import { stockHandler, stockMovementsHandler, quickAddStockHandler, quickRemoveStockHandler } from './handlers/stock';
import { ordersHandler } from './handlers/orders';
import { reportsHandler } from './handlers/reports';
import { settingsHandler } from './handlers/settings';
import { prismaSession } from './middleware/session';
import { BotContext } from './types';
import { stockAdjustmentWizard } from './scenes/stockAdjustment';

export { BotContext };

let bot: Telegraf<BotContext> | null = null;

export function initializeBot(): Telegraf<BotContext> | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log('⚠️  Telegram bot token not found in environment variables.');
    return null;
  }

  // Mask token for security in logs
  const maskedToken = token.substring(0, 5) + '...' + token.substring(token.length - 5);
  console.log(`🤖 Initializing Telegram bot with token: ${maskedToken}`);

  bot = new Telegraf<BotContext>(token);

  // 1. Session Middleware (Must be before stage)
  bot.use(prismaSession());

  // 2. Stage (Scenes) Middleware
  const stage = new Scenes.Stage<BotContext>([
    stockAdjustmentWizard
    // Add other wizards here
  ]);
  bot.use(stage.middleware());

  // 3. Global Commands
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

  // Stock commands
  bot.command('stock', stockHandler);
  bot.command('movements', stockMovementsHandler);
  bot.command('add', quickAddStockHandler);
  bot.command('remove', quickRemoveStockHandler);
  bot.command('adjust', (ctx) => ctx.scene.enter('stock-adjustment'));

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
    }).catch(err => {
      console.error('❌ Failed to start Telegram bot:', err);
    });

    process.once('SIGINT', () => bot?.stop('SIGINT'));
    process.once('SIGTERM', () => bot?.stop('SIGTERM'));
  }

  return bot;
}

export function getBot(): Telegraf<BotContext> | null {
  return bot;
}
