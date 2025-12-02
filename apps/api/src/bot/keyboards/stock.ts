import { Markup } from 'telegraf';

export function stockMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Add Stock', 'stock_quick_add'),
      Markup.button.callback('➖ Remove Stock', 'stock_quick_remove')
    ],
    [
      Markup.button.callback('🔄 Full Adjustment', 'stock_start_adjust'),
      Markup.button.callback('📊 Movements', 'stock_view_movements')
    ]
  ]);
}

export function stockMovementsKeyboard(hasMore: boolean) {
  // Can add pagination here if needed
  return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh', 'stock_view_movements')]
  ]);
}
