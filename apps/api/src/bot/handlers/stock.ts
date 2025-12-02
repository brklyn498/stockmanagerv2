import { BotContext } from '../index';
import prisma from '../../utils/db';
import { stockMenuKeyboard, stockMovementsKeyboard } from '../keyboards/stock';
import { escapeMarkdownV2, formatRelativeTime } from '../utils/formatter';
import { getSystemBotUser } from '../utils/systemUser';
import { Markup } from 'telegraf';

export async function stockHandler(ctx: BotContext) {
  await ctx.reply(
    '📊 *Stock Management*\n' +
    'Select an action below or use quick commands:\n' +
    '• `/add [sku] [qty]`\n' +
    '• `/remove [sku] [qty]`',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: stockMenuKeyboard().reply_markup
    }
  );
}

export async function stockMovementsHandler(ctx: BotContext) {
  try {
    await ctx.sendChatAction('typing');
    const movements = await prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        user: true
      }
    });

    if (movements.length === 0) {
      return ctx.reply('No stock movements recorded yet.', { parse_mode: 'MarkdownV2' });
    }

    let message = '📊 *Recent Stock Movements*\n━━━━━━━━━━━━━━━━━━━━\n\n';

    movements.forEach(m => {
      const icon = m.type === 'IN' ? '📥' : m.type === 'OUT' ? '📤' : '🔄';
      const time = formatRelativeTime(m.createdAt);
      const safeName = escapeMarkdownV2(m.product.name);

      message += `${icon} *${safeName}*\n`;
      message += `   ${m.type}: ${m.quantity} | ${time}\n`;
      message += `   By: ${escapeMarkdownV2(m.user.name)}\n\n`;
    });

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: stockMovementsKeyboard(false).reply_markup
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    await ctx.reply('❌ Error fetching movements');
  }
}

export async function quickAddStockHandler(ctx: BotContext) {
  // Usage: /add SKU QTY [Reason]
  // We need to parse from ctx.message.text
  const text = (ctx.message as any).text;
  await handleQuickStockAction(ctx, text, 'IN');
}

export async function quickRemoveStockHandler(ctx: BotContext) {
  const text = (ctx.message as any).text;
  await handleQuickStockAction(ctx, text, 'OUT');
}

async function handleQuickStockAction(ctx: BotContext, text: string, type: 'IN' | 'OUT') {
  // Format: /command SKU QTY [Reason...]
  const parts = text.split(' ');
  if (parts.length < 3) {
    return ctx.reply(
      `Usage: /${type === 'IN' ? 'add' : 'remove'} [SKU] [Quantity] [Reason?]\n` +
      `Example: /${type === 'IN' ? 'add' : 'remove'} CHO-001 50 Restock`
    );
  }

  const sku = parts[1];
  const qtyStr = parts[2];
  const reason = parts.slice(3).join(' ') || 'Quick Action via Bot';

  const qty = parseInt(qtyStr);
  if (isNaN(qty) || qty <= 0) {
    return ctx.reply('❌ Quantity must be a valid positive number.');
  }

  try {
    const product = await prisma.product.findUnique({
      where: { sku: sku } // Assuming SKU is unique. If not, logic changes.
    });

    // If not found by SKU, try finding by name (inexact) if sku looks like a name?
    // No, instructions say SKU. Stick to SKU for quick actions.
    if (!product) {
      return ctx.reply(`❌ Product with SKU \`${sku}\` not found.`, { parse_mode: 'Markdown' });
    }

    // Check stock for removal
    if (type === 'OUT' && product.quantity < qty) {
      return ctx.reply(
        `❌ Insufficient stock.\nCurrent: ${product.quantity}\nRequested: ${qty}`
      );
    }

    const systemUser = await getSystemBotUser();

    // Perform transaction
    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: {
          quantity: {
            increment: type === 'IN' ? qty : -qty
          }
        }
      }),
      prisma.stockMovement.create({
        data: {
          type: type,
          quantity: qty,
          reason: reason,
          productId: product.id,
          userId: systemUser.id
        }
      })
    ]);

    const emoji = type === 'IN' ? '📈' : '📉';
    const action = type === 'IN' ? 'Added' : 'Removed';

    await ctx.reply(
      `✅ *Stock Updated*\n\n` +
      `📦 ${escapeMarkdownV2(product.name)}\n` +
      `${emoji} ${action}: ${qty}\n` +
      `📊 New Stock: ${updatedProduct.quantity}\n` +
      `📝 Reason: ${escapeMarkdownV2(reason)}`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('Quick stock action error:', error);
    await ctx.reply('❌ Failed to update stock. Please try again.');
  }
}
