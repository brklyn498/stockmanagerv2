import { Markup } from 'telegraf';

export function productActionsKeyboard(productId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Add Stock', `stock_add_${productId}`),
      Markup.button.callback('➖ Remove', `stock_remove_${productId}`)
    ],
    [
      Markup.button.callback('📝 Edit', `product_edit_${productId}`),
      Markup.button.callback('📊 History', `product_history_${productId}`)
    ],
    [
      Markup.button.callback('🔙 Back to List', 'products_list')
    ]
  ]);
}

export function paginationKeyboard(
  currentPage: number,
  totalPages: number,
  prefix: string = 'products'
) {
  const buttons = [];

  if (currentPage > 1) {
    buttons.push(Markup.button.callback('◀️ Prev', `${prefix}_page_${currentPage - 1}`));
  }

  buttons.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'));

  if (currentPage < totalPages) {
    buttons.push(Markup.button.callback('Next ▶️', `${prefix}_page_${currentPage + 1}`));
  }

  return Markup.inlineKeyboard([
    buttons,
    [
      Markup.button.callback('🔍 Search', `${prefix}_search`),
      Markup.button.callback('📉 Low Stock', `${prefix}_low`)
    ]
  ]);
}

export function searchResultKeyboard(productId: string) {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('📦 View Details', `product_view_${productId}`)
        ]
    ]);
}
