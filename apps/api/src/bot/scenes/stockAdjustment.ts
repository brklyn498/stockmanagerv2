import { Scenes, Markup } from 'telegraf';
import type { BotContext } from '../types.ts';
import prisma from '../../utils/db';
import { decodeBarcodeFromUrl } from '../utils/barcode.ts';
import { getSystemBotUser } from '../utils/systemUser.ts';
import { escapeMarkdownV2 } from '../utils/formatter.ts';

export const stockAdjustmentWizard = new Scenes.WizardScene<BotContext>(
  'stock-adjustment',

  // Step 1: Ask for product
  async (ctx) => {
    await ctx.reply(
      '📦 *Stock Adjustment*\n\nWhich product? Send name, SKU, or a photo of the barcode\\.',
      { parse_mode: 'MarkdownV2' }
    );
    return ctx.wizard.next();
  },

  // Step 2: Receive product (Text or Photo)
  async (ctx) => {
    let product = null;
    const message = ctx.message as any;

    if (message.photo) {
      await ctx.reply('🔍 Scanning barcode\\.\\.\\.', { parse_mode: 'MarkdownV2' });
      // Get highest res photo
      const photo = message.photo[message.photo.length - 1];
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);

      const barcode = await decodeBarcodeFromUrl(fileLink.href);

      if (barcode) {
        product = await prisma.product.findUnique({ where: { barcode } });
        if (!product) {
          await ctx.reply(`🔍 Barcode detected: \`${barcode}\`, but no product found.`, { parse_mode: 'MarkdownV2' });
          // Could ask to search manually, but for now just stay here
          return;
        }
      } else {
        await ctx.reply('❌ Could not read barcode. Please try entering SKU or Name.', { parse_mode: 'MarkdownV2' });
        return;
      }
    } else if (message.text) {
      const input = message.text.trim();
      // Try exact SKU match first
      product = await prisma.product.findUnique({ where: { sku: input } });

      // If not, try approximate name match
      if (!product) {
        const candidates = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: input } },
              { sku: { contains: input } }
            ]
          },
          take: 5
        });

        if (candidates.length === 0) {
          await ctx.reply('❌ No product found. Try again or /cancel.');
          return;
        }

        if (candidates.length === 1) {
          product = candidates[0];
        } else {
          // Multiple candidates, ask user to choose (simple way: buttons)
          // Since wizard expects linear flow, we can't easily branch without complex logic.
          // For MVP, if multiple found, we ask to be more specific or picking first.
          // Let's list them and ask to type exact SKU.
          let list = candidates.map(c => `• ${c.sku}: ${c.name}`).join('\n');
          await ctx.reply(`Found multiple products:\n${list}\n\nPlease type the exact SKU.`);
          return; // Stay on this step
        }
      }
    } else {
      await ctx.reply('Please send text or a photo.');
      return;
    }

    if (!product) return; // Should not reach here

    // Save product to session
    (ctx.wizard.state as any).productId = product.id;
    (ctx.wizard.state as any).productName = product.name;
    (ctx.wizard.state as any).currentStock = product.quantity;

    await ctx.reply(
      `📦 *${escapeMarkdownV2(product.name)}*\n` +
      `Current Stock: ${product.quantity}\n\n` +
      `What would you like to do?`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Add', 'adjust_type_add'),
            Markup.button.callback('➖ Remove', 'adjust_type_remove')
          ],
          [Markup.button.callback('🔄 Set Total', 'adjust_type_set')]
        ]).reply_markup
      }
    );

    return ctx.wizard.next();
  },

  // Step 3: Receive Action Type
  async (ctx) => {
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const action = ctx.callbackQuery.data;
      if (!action.startsWith('adjust_type_')) {
        await ctx.answerCbQuery('Please select an option.');
        return;
      }

      const type = action.replace('adjust_type_', '');
      (ctx.wizard.state as any).actionType = type;

      await ctx.answerCbQuery();
      await ctx.reply(`Enter quantity to ${type}:`);
      return ctx.wizard.next();
    } else {
      // If they typed something instead of clicking
      await ctx.reply('Please use the buttons above.');
      return;
    }
  },

  // Step 4: Receive Quantity
  async (ctx) => {
    const text = (ctx.message as any)?.text;
    const qty = parseInt(text);

    if (isNaN(qty) || qty < 0) {
      await ctx.reply('Please enter a valid positive number.');
      return;
    }

    (ctx.wizard.state as any).quantity = qty;

    await ctx.reply(
      'Reason for adjustment?',
      Markup.inlineKeyboard([
        [Markup.button.callback('📦 Shipment', 'reason_shipment')],
        [Markup.button.callback('📝 Audit', 'reason_audit')],
        [Markup.button.callback('🗑️ Damaged', 'reason_damaged')],
        [Markup.button.callback('↩️ Return', 'reason_return')],
        [Markup.button.callback('Skip', 'reason_skip')]
      ])
    );
    return ctx.wizard.next();
  },

  // Step 5: Receive Reason & Execute
  async (ctx) => {
    let reason = 'Stock Adjustment';

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data.startsWith('reason_')) {
        reason = data.replace('reason_', '');
        if (reason === 'skip') reason = 'Stock Adjustment';
        else reason = reason.charAt(0).toUpperCase() + reason.slice(1);
        await ctx.answerCbQuery();
      }
    } else if ((ctx.message as any)?.text) {
      reason = (ctx.message as any).text;
    }

    const state = ctx.wizard.state as any;
    const { productId, actionType, quantity, productName, currentStock } = state;

    const systemUser = await getSystemBotUser();

    // Calculate new quantity
    let newQuantity = currentStock;
    let change = 0;
    let type = 'ADJUSTMENT'; // DB Enum: IN, OUT, ADJUSTMENT... schema says String.

    if (actionType === 'add') {
      newQuantity += quantity;
      change = quantity;
      type = 'IN';
    } else if (actionType === 'remove') {
      newQuantity -= quantity;
      change = -quantity;
      type = 'OUT';
    } else if (actionType === 'set') {
      newQuantity = quantity;
      change = quantity - currentStock;
      type = 'ADJUSTMENT';
    }

    try {
      await prisma.$transaction([
        prisma.product.update({
          where: { id: productId },
          data: { quantity: newQuantity }
        }),
        prisma.stockMovement.create({
          data: {
            type,
            quantity: Math.abs(change),
            reason,
            productId,
            userId: systemUser.id
          }
        })
      ]);

      await ctx.reply(
        `✅ *Adjustment Complete*\n\n` +
        `📦 ${escapeMarkdownV2(productName)}\n` +
        `Old Stock: ${currentStock}\n` +
        `New Stock: ${newQuantity}\n` +
        `Reason: ${escapeMarkdownV2(reason)}`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Adjust Another', 'stock_start_adjust')], // We need to handle this callback or just command
            [Markup.button.callback('🔙 Menu', 'menu_stock')]
          ]).reply_markup
        }
      );
    } catch (e) {
      console.error('Adjustment error:', e);
      await ctx.reply('❌ Failed to update stock.');
    }

    return ctx.scene.leave();
  }
);

// Exit handler
stockAdjustmentWizard.command('cancel', async (ctx) => {
  await ctx.reply('❌ Adjustment cancelled.');
  return ctx.scene.leave();
});
