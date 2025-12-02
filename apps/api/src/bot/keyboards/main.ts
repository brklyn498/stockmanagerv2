import { Markup } from 'telegraf';

export function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['📦 Products', '📊 Stock'],
    ['📋 Orders', '📈 Reports'],
    ['⚙️ Settings', '❓ Help']
  ]).resize();
}

export function getMainMenuInline() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📦 Products', 'menu_products'),
      Markup.button.callback('📊 Stock', 'menu_stock')
    ],
    [
      Markup.button.callback('📋 Orders', 'menu_orders'),
      Markup.button.callback('📈 Reports', 'menu_reports')
    ],
    [
      Markup.button.callback('⚙️ Settings', 'menu_settings'),
      Markup.button.callback('❓ Help', 'menu_help')
    ]
  ]);
}
