import { BotContext } from '../index';

export async function helpHandler(ctx: BotContext) {
  const helpMessage = `📚 *Stock Manager Bot - Help*

*General Commands:*
/start - Start the bot
/help - Show this help message
/menu - Show main menu

*Product Commands:*
/products - List all products
/product [name/sku] - Search for a product
/low - Show low stock products
/out - Show out of stock products

*Stock Commands:*
/stock - Stock management menu
/add [sku] [qty] - Quick add stock
/remove [sku] [qty] - Quick remove stock
/movements - View recent stock movements

*Order Commands:*
/orders - List recent orders
/order [id] - View order details

*Report Commands:*
/report - Report menu
/report inventory - Inventory summary
/report movements - Movement report
/report value - Inventory valuation

*Settings:*
/settings - Manage your preferences

📝 *Tips:*
• Use the menu buttons for quick access
• You can send product names or SKUs directly
• Photos of barcodes will be scanned automatically

Need more help? Contact your administrator.`;

  return ctx.reply(helpMessage, { parse_mode: 'Markdown' });
}
