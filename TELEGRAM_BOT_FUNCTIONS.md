# Telegram Bot API Reference for Stock Manager v2

> **AI Coder Reference Document** — Bot API 9.2 (August 2025)
> Use this document when implementing Telegram bot features for stockmanagerv2.

---

## 📚 Table of Contents

1. [Tech Stack & Setup](#tech-stack--setup)
2. [Message Formatting (MarkdownV2 & HTML)](#message-formatting)
3. [Visual Product Display](#visual-product-display)
4. [Media Handling](#media-handling)
5. [Keyboards & Interactive Elements](#keyboards--interactive-elements)
6. [Conversation State Management](#conversation-state-management)
7. [Reactions & Link Previews](#reactions--link-previews)
8. [Barcode Scanning](#barcode-scanning)
9. [Document Generation (PDF Reports)](#document-generation)
10. [Scheduled Messages & Alerts](#scheduled-messages--alerts)
11. [Forum Topics for Inventory Organization](#forum-topics)
12. [API Method Reference](#api-method-reference)
13. [Code Examples](#code-examples)

---

## Tech Stack & Setup

### Recommended Library: Telegraf v4+

```bash
npm install telegraf
```

**Why Telegraf over node-telegram-bot-api:**
- Built-in middleware support
- Better TypeScript support
- Scene/wizard system for conversation flows
- Easier session management

### Environment Variables

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_MODE=polling          # 'polling' for dev, 'webhook' for prod
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/bot/webhook
TELEGRAM_WEBHOOK_SECRET=random_secret_string
```

### Bot Initialization (Telegraf)

```typescript
// apps/api/src/bot/index.ts
import { Telegraf, session, Scenes } from 'telegraf';
import { MyContext } from './types';

const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);

// Enable session for conversation state
bot.use(session());

// Register scenes for multi-step flows
const stage = new Scenes.Stage<MyContext>([
  adjustmentWizard,
  orderWizard,
  // ... other wizards
]);
bot.use(stage.middleware());

// Start bot
if (process.env.BOT_MODE === 'webhook') {
  // Production: webhook
  const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL}/bot${bot.secretPathComponent()}`;
  bot.telegram.setWebhook(webhookUrl);
} else {
  // Development: polling
  bot.launch();
}

export { bot };
```

---

## Message Formatting

### MarkdownV2 Reference

**CRITICAL:** In MarkdownV2, these characters MUST be escaped with `\`:
```
_ * [ ] ( ) ~ ` > # + - = | { } . !
```

```typescript
// apps/api/src/bot/utils/formatter.ts

// Escape function - ALWAYS use this for user data
export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

// Format product name safely
const safeName = escapeMarkdownV2(product.name);
const message = `*${safeName}*`; // Bold
```

### MarkdownV2 Formatting Entities

| Format | Syntax | Example |
|--------|--------|---------|
| **Bold** | `*text*` | `*Dark Chocolate*` |
| *Italic* | `_text_` | `_out of stock_` |
| __Underline__ | `__text__` | `__urgent__` |
| ~~Strikethrough~~ | `~text~` | `~old price~` |
| ||Spoiler|| | `\|\|text\|\|` | `\|\|hidden\|\|` |
| `Code` | `` `text` `` | `` `CHO-001` `` |
| Code Block | ` ```lang\ncode``` ` | See below |
| Link | `[text](url)` | `[View](https://...)` |
| Mention | `[name](tg://user?id=123)` | User mention |

### Block Quotes (Bot API 7.0+)

```markdown
>This is a block quote
>Second line of quote
```

### Expandable Block Quotes (Bot API 7.4+) ⭐ NEW

Perfect for product specifications, FAQs, detailed descriptions:

```markdown
**>Product Specifications
>Weight: 100g
>Dimensions: 10x5x2cm
>Material: Premium cocoa
>Origin: Belgium||
```

**Result:** Only "Product Specifications" shows initially. User taps to expand.

### HTML Formatting (Alternative)

```html
<b>Bold</b>
<i>Italic</i>
<u>Underline</u>
<s>Strikethrough</s>
<tg-spoiler>Spoiler</tg-spoiler>
<code>inline code</code>
<pre><code class="language-json">{ "sku": "CHO-001" }</code></pre>
<blockquote>Regular quote</blockquote>
<blockquote expandable>Expandable quote content</blockquote>
<a href="https://...">Link</a>
<a href="tg://user?id=123456789">User mention</a>
```

### Custom Emoji (Premium Bots Only)

Requires bot to have purchased username on Fragment:

```html
<tg-emoji emoji-id="5368324170671202286">📦</tg-emoji>
```

```markdown
![📦](tg://emoji?id=5368324170671202286)
```

---

## Visual Product Display

### Product Card Template (Rich Format)

```typescript
// apps/api/src/bot/utils/productFormatter.ts

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  costPrice: number;
  retailPrice: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  barcode?: string;
  imageUrl?: string;
  description?: string;
  lastMovement?: Date;
}

export function formatProductCard(product: Product): string {
  const status = getStockStatus(product);
  const margin = ((product.retailPrice - product.costPrice) / product.retailPrice * 100).toFixed(1);
  const safeName = escapeMarkdownV2(product.name);
  const safeCategory = escapeMarkdownV2(product.category);
  const safeSupplier = escapeMarkdownV2(product.supplier);
  
  return `📦 *${safeName}*
━━━━━━━━━━━━━━━━━━━━
SKU: \`${product.sku}\`
Category: ${safeCategory}
Supplier: ${safeSupplier}

💰 *Pricing*
Cost: $${product.costPrice.toFixed(2)}
Retail: $${product.retailPrice.toFixed(2)}
Margin: ${margin}%

📊 *Stock*
Current: ${product.quantity} pieces
Min: ${product.minStock} \\| Max: ${product.maxStock}
Status: ${status.emoji} ${status.text}

📅 Last Movement: ${formatRelativeTime(product.lastMovement)}`;
}

function getStockStatus(product: Product): { emoji: string; text: string } {
  if (product.quantity === 0) return { emoji: '❌', text: 'Out of Stock' };
  if (product.quantity <= product.minStock) return { emoji: '⚠️', text: 'Low Stock' };
  if (product.quantity >= product.maxStock) return { emoji: '📈', text: 'Overstocked' };
  return { emoji: '✅', text: 'Normal' };
}
```

### Product List with Pagination

```typescript
export function formatProductList(
  products: Product[],
  page: number,
  totalPages: number
): string {
  const lines = products.map((p, i) => {
    const status = getStockStatusEmoji(p);
    const safeName = escapeMarkdownV2(p.name);
    return `${(page - 1) * 10 + i + 1}\\. ${safeName} \\- ${p.quantity} pcs ${status}`;
  });

  return `📦 *Products \\(Page ${page}/${totalPages}\\)*
━━━━━━━━━━━━━━━━━━━━

${lines.join('\n')}`;
}

function getStockStatusEmoji(product: Product): string {
  if (product.quantity === 0) return '❌';
  if (product.quantity <= product.minStock) return '⚠️';
  return '✅';
}
```

### Product Detail with Expandable Specs

```typescript
export function formatProductDetailExpanded(product: Product): string {
  const safeName = escapeMarkdownV2(product.name);
  const safeDesc = product.description ? escapeMarkdownV2(product.description) : 'No description';
  
  return `📦 *${safeName}*
SKU: \`${product.sku}\`
Stock: ${product.quantity} pieces ${getStockStatusEmoji(product)}

**>📋 Full Specifications
>Category: ${escapeMarkdownV2(product.category)}
>Supplier: ${escapeMarkdownV2(product.supplier)}
>Barcode: ${product.barcode || 'N/A'}
>
>💰 Pricing
>Cost: $${product.costPrice.toFixed(2)}
>Retail: $${product.retailPrice.toFixed(2)}
>
>📦 Stock Levels
>Current: ${product.quantity}
>Minimum: ${product.minStock}
>Maximum: ${product.maxStock}
>
>📝 Description
>${safeDesc}||`;
}
```

---

## Media Handling

### Send Product Photo with Caption

```typescript
// Single product image
await ctx.replyWithPhoto(
  { url: product.imageUrl },  // or { source: fs.createReadStream(path) }
  {
    caption: formatProductCard(product),
    parse_mode: 'MarkdownV2',
    reply_markup: productActionsKeyboard(product.id)
  }
);
```

### Send Product Gallery (Media Group)

**IMPORTANT:** Only the FIRST item's caption displays for the album.

```typescript
// apps/api/src/bot/handlers/products.ts
import { InputMediaPhoto } from 'telegraf/types';

async function sendProductGallery(ctx: MyContext, product: Product) {
  if (!product.images || product.images.length === 0) {
    // Fallback to text-only
    return ctx.reply(formatProductCard(product), { parse_mode: 'MarkdownV2' });
  }

  const mediaGroup: InputMediaPhoto[] = product.images.map((img, index) => ({
    type: 'photo',
    media: img.url,
    caption: index === 0 ? formatProductCard(product) : undefined,
    parse_mode: index === 0 ? 'MarkdownV2' : undefined,
    has_spoiler: false,
    show_caption_above_media: true  // Bot API 7.4+
  }));

  await ctx.replyWithMediaGroup(mediaGroup);
  
  // Send action buttons separately (media groups can't have inline keyboards)
  await ctx.reply('Actions:', {
    reply_markup: productActionsKeyboard(product.id)
  });
}
```

### Media Group Constraints

| Constraint | Value |
|------------|-------|
| Min items | 2 |
| Max items | 10 |
| Photo max size (upload) | 10 MB |
| Photo max size (URL) | 5 MB |
| Video max size (upload) | 50 MB |
| Video max size (URL) | 20 MB |
| Caption max length | 1024 characters |
| Mixing allowed | Photos + Videos only |
| Documents | Must be separate group |

### Photo with Spoiler (Hidden Until Tap)

```typescript
await ctx.replyWithPhoto(
  { url: product.imageUrl },
  {
    caption: '*Tap to reveal product*',
    parse_mode: 'MarkdownV2',
    has_spoiler: true  // Blurs image until tapped
  }
);
```

### Video with Custom Cover (Bot API 8.3+) ⭐ NEW

```typescript
await ctx.telegram.sendVideo(ctx.chat.id, 
  { source: fs.createReadStream('product_demo.mp4') },
  {
    caption: '*Product Demo*',
    parse_mode: 'MarkdownV2',
    cover: { source: fs.createReadStream('cover.jpg') },  // Custom thumbnail
    start_timestamp: 5,  // Preview starts at 5 seconds
    width: 1280,
    height: 720,
    duration: 60
  }
);
```

### Caption Above Media (Bot API 7.4+)

```typescript
await ctx.replyWithPhoto(url, {
  caption: '*Dark Chocolate Bar*\nIn stock: 45 pieces',
  parse_mode: 'MarkdownV2',
  show_caption_above_media: true  // Caption appears above, not below
});
```

---

## Keyboards & Interactive Elements

### Inline Keyboard (Recommended for Actions)

```typescript
// apps/api/src/bot/keyboards/products.ts
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
```

### Pagination Keyboard

```typescript
export function paginationKeyboard(
  currentPage: number,
  totalPages: number,
  prefix: string  // e.g., 'products', 'orders'
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
```

### Copy Text Button (Bot API 7.11+) ⭐ NEW

Perfect for SKUs, barcodes, promo codes:

```typescript
export function productWithCopyButtons(product: Product) {
  return Markup.inlineKeyboard([
    [
      Markup.button.copyText('📋 Copy SKU', product.sku),
      Markup.button.copyText('📋 Copy Barcode', product.barcode || 'N/A')
    ],
    [
      Markup.button.callback('➕ Add Stock', `stock_add_${product.id}`)
    ]
  ]);
}

// Manual construction if Telegraf doesn't have helper:
const keyboard = {
  inline_keyboard: [[
    {
      text: '📋 Copy SKU',
      copy_text: { text: product.sku }
    },
    {
      text: '📋 Copy Barcode', 
      copy_text: { text: product.barcode }
    }
  ]]
};
```

### Reply Keyboard (Persistent Menu)

```typescript
export function mainMenuKeyboard() {
  return Markup.keyboard([
    ['📦 Products', '📊 Stock'],
    ['📋 Orders', '📈 Reports'],
    ['⚙️ Settings', '❓ Help']
  ]).resize();  // Fits keyboard to button sizes
}

// Remove keyboard
await ctx.reply('Keyboard removed', Markup.removeKeyboard());
```

### Request User Selection (Bot API 7.0+)

```typescript
// Request user to select another user (e.g., assign task)
const keyboard = Markup.keyboard([
  [Markup.button.userRequest('👤 Select User', 1, { 
    user_is_bot: false,
    max_quantity: 5  // Allow selecting up to 5 users
  })]
]).resize().oneTime();

await ctx.reply('Select users to notify:', keyboard);
```

### Inline Keyboard Button Types Reference

| Button Type | Parameter | Use Case |
|-------------|-----------|----------|
| Callback | `callback_data` | Bot actions (max 64 bytes) |
| URL | `url` | External links |
| Copy Text | `copy_text` | Copy to clipboard |
| Web App | `web_app` | Launch Mini App |
| Login | `login_url` | Website auth |
| Inline Query | `switch_inline_query` | Share via inline |
| Pay | `pay` | Payments (first button only) |

---

## Conversation State Management

### Using Telegraf Scenes (Wizards)

```typescript
// apps/api/src/bot/scenes/stockAdjustment.ts
import { Scenes, Markup } from 'telegraf';
import { MyContext } from '../types';

interface AdjustmentSession extends Scenes.WizardSessionData {
  productId?: string;
  productName?: string;
  adjustmentType?: 'add' | 'remove' | 'set';
  quantity?: number;
  reason?: string;
}

type AdjustmentContext = MyContext & Scenes.WizardContext<AdjustmentSession>;

export const stockAdjustmentWizard = new Scenes.WizardScene<AdjustmentContext>(
  'stock-adjustment',
  
  // Step 1: Ask for product
  async (ctx) => {
    await ctx.reply(
      '📦 *Stock Adjustment*\n\nWhich product? Send name, SKU, or barcode photo\\.',
      { parse_mode: 'MarkdownV2' }
    );
    return ctx.wizard.next();
  },
  
  // Step 2: Receive product, ask for type
  async (ctx) => {
    const input = ctx.message?.text;
    const photo = ctx.message?.photo;
    
    let product: Product | null = null;
    
    if (photo) {
      // Handle barcode photo
      const barcode = await scanBarcodeFromPhoto(ctx, photo);
      if (barcode) {
        product = await findProductByBarcode(barcode);
      }
    } else if (input) {
      product = await findProductBySkuOrName(input);
    }
    
    if (!product) {
      await ctx.reply('❌ Product not found\\. Try again or /cancel', { parse_mode: 'MarkdownV2' });
      return; // Stay on same step
    }
    
    ctx.wizard.state.productId = product.id;
    ctx.wizard.state.productName = product.name;
    
    await ctx.reply(
      `📦 *${escapeMarkdownV2(product.name)}*\nCurrent stock: ${product.quantity} pieces\n\nWhat type of adjustment?`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('➕ Add', 'adjust_type_add'),
            Markup.button.callback('➖ Remove', 'adjust_type_remove'),
            Markup.button.callback('🔄 Set', 'adjust_type_set')
          ]
        ]).reply_markup
      }
    );
    return ctx.wizard.next();
  },
  
  // Step 3: Receive type, ask for quantity
  async (ctx) => {
    // Handle callback query
    if (ctx.callbackQuery?.data) {
      const type = ctx.callbackQuery.data.replace('adjust_type_', '') as 'add' | 'remove' | 'set';
      ctx.wizard.state.adjustmentType = type;
      await ctx.answerCbQuery();
      
      const typeLabel = { add: 'add', remove: 'remove', set: 'set to' }[type];
      await ctx.reply(`How many pieces to ${typeLabel}?`);
      return ctx.wizard.next();
    }
  },
  
  // Step 4: Receive quantity, ask for reason
  async (ctx) => {
    const qty = parseInt(ctx.message?.text || '');
    if (isNaN(qty) || qty <= 0) {
      await ctx.reply('❌ Please enter a valid number');
      return;
    }
    
    ctx.wizard.state.quantity = qty;
    
    await ctx.reply(
      'Select reason:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📦 Received Shipment', 'reason_shipment')],
        [Markup.button.callback('📋 Inventory Count', 'reason_count')],
        [Markup.button.callback('↩️ Customer Return', 'reason_return')],
        [Markup.button.callback('🗑️ Damaged/Expired', 'reason_damaged')],
        [Markup.button.callback('📝 Other', 'reason_other')]
      ])
    );
    return ctx.wizard.next();
  },
  
  // Step 5: Complete adjustment
  async (ctx) => {
    if (ctx.callbackQuery?.data) {
      const reason = ctx.callbackQuery.data.replace('reason_', '');
      ctx.wizard.state.reason = reason;
      await ctx.answerCbQuery();
      
      // Perform the adjustment
      const result = await performStockAdjustment(
        ctx.wizard.state.productId!,
        ctx.wizard.state.adjustmentType!,
        ctx.wizard.state.quantity!,
        ctx.wizard.state.reason!,
        ctx.from?.id
      );
      
      const typeEmoji = ctx.wizard.state.adjustmentType === 'add' ? '➕' : 
                        ctx.wizard.state.adjustmentType === 'remove' ? '➖' : '🔄';
      
      await ctx.reply(
        `✅ *Stock Updated\\!*

${escapeMarkdownV2(ctx.wizard.state.productName!)}
Before: ${result.previousQty} pieces
${typeEmoji} ${ctx.wizard.state.adjustmentType === 'set' ? 'Set to' : ctx.wizard.state.adjustmentType === 'add' ? 'Added' : 'Removed'}: ${ctx.wizard.state.quantity} pieces
After: ${result.newQty} pieces

Reason: ${escapeMarkdownV2(ctx.wizard.state.reason!)}`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback('📦 View Product', `product_view_${ctx.wizard.state.productId}`),
              Markup.button.callback('🔄 Another Adjustment', 'start_adjustment')
            ],
            [
              Markup.button.callback('↩️ Undo', `undo_${result.movementId}`)
            ]
          ]).reply_markup
        }
      );
      
      return ctx.scene.leave();
    }
  }
);

// Handle /cancel anywhere in wizard
stockAdjustmentWizard.command('cancel', async (ctx) => {
  await ctx.reply('❌ Adjustment cancelled');
  return ctx.scene.leave();
});
```

### Session Types

```typescript
// apps/api/src/bot/types.ts
import { Context, Scenes } from 'telegraf';

interface SessionData extends Scenes.WizardSessionData {
  // Global session data
  lastProductId?: string;
  recentSearches?: string[];
  undoStack?: UndoAction[];
}

interface UndoAction {
  type: 'stock_movement';
  movementId: string;
  expiresAt: number;
}

export interface MyContext extends Context {
  session: SessionData;
  scene: Scenes.SceneContextScene<MyContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}
```

---

## Reactions & Link Previews

### Set Message Reaction (Bot API 7.0+)

```typescript
// React to user's message with emoji
await ctx.telegram.setMessageReaction(
  ctx.chat.id,
  ctx.message.message_id,
  [{ type: 'emoji', emoji: '✅' }],  // Confirmation
  false  // is_big
);

// Available standard reactions:
const REACTIONS = [
  '👍', '👎', '❤', '🔥', '🥰', '👏', '😁', '🤔', '🤯', '😱', 
  '🤬', '😢', '🎉', '🤩', '🤮', '💩', '🙏', '👌', '🕊', '🤡',
  '🥱', '🥴', '😍', '🐳', '❤‍🔥', '🌚', '🌭', '💯', '🤣', '⚡',
  '🍌', '🏆', '💔', '🤨', '😐', '🍓', '🍾', '💋', '😈', '😴',
  '😭', '🤓', '👻', '👨‍💻', '👀', '🎃', '🙈', '😇', '😨', '🤝',
  '✍', '🤗', '🫡', '🎅', '🎄', '☃', '💅', '🤪', '🗿', '🆒',
  '💘', '🙉', '🦄', '😘', '💊', '🙊', '😎', '👾', '🤷', '😡'
];
```

### Custom Link Preview (Bot API 7.0+)

```typescript
await ctx.reply(
  'Check out our website: https://stockmanager.app and docs: https://docs.stockmanager.app',
  {
    link_preview_options: {
      url: 'https://stockmanager.app',  // Force this URL's preview
      prefer_large_media: true,          // Larger preview image
      show_above_text: false,            // Preview below text
      is_disabled: false                 // Enable preview
    }
  }
);

// Disable preview entirely
await ctx.reply('Link: https://example.com', {
  link_preview_options: { is_disabled: true }
});
```

---

## Barcode Scanning

### Option 1: Photo Handler with Server-Side Decoding

```typescript
// apps/api/src/bot/handlers/barcode.ts
import Jimp from 'jimp';
import jsQR from 'jsqr';
// Or use: npm install @aspect-build/aspect for traditional barcodes

bot.on('photo', async (ctx) => {
  // Check if user is in a flow expecting barcode
  const session = ctx.session;
  
  // Get highest resolution photo
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileLink = await ctx.telegram.getFileLink(photo.file_id);
  
  await ctx.reply('🔍 Scanning barcode\\.\\.\\.');
  
  try {
    // Download and decode
    const response = await fetch(fileLink.href);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const barcode = await decodeBarcode(buffer);
    
    if (!barcode) {
      await ctx.reply('❌ Could not read barcode\\. Please try again with better lighting\\.', {
        parse_mode: 'MarkdownV2'
      });
      return;
    }
    
    // Look up product
    const product = await findProductByBarcode(barcode);
    
    if (product) {
      await ctx.replyWithPhoto(
        product.imageUrl ? { url: product.imageUrl } : undefined,
        {
          caption: formatProductCard(product),
          parse_mode: 'MarkdownV2',
          reply_markup: productActionsKeyboard(product.id)
        }
      );
    } else {
      await ctx.reply(
        `📦 No product found with barcode: \`${barcode}\`\n\nWould you like to create a new product?`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('➕ Create Product', `create_product_${barcode}`)],
            [Markup.button.callback('🔍 Search Instead', 'products_search')]
          ]).reply_markup
        }
      );
    }
  } catch (error) {
    console.error('Barcode scan error:', error);
    await ctx.reply('❌ Error scanning barcode\\. Please try again\\.', {
      parse_mode: 'MarkdownV2'
    });
  }
});

async function decodeBarcode(buffer: Buffer): Promise<string | null> {
  // For QR codes
  const image = await Jimp.read(buffer);
  const { data, width, height } = image.bitmap;
  
  const qrCode = jsQR(new Uint8ClampedArray(data), width, height);
  if (qrCode) {
    return qrCode.data;
  }
  
  // For traditional barcodes, use additional library
  // e.g., quagga, zxing-wasm, or cloud API
  
  return null;
}
```

### Option 2: Mini App Scanner (Mobile Only)

```typescript
// Bot sends button to launch scanner Mini App
await ctx.reply('Scan a barcode:', {
  reply_markup: Markup.inlineKeyboard([
    [Markup.button.webApp('📷 Open Scanner', 'https://yourapp.com/scanner')]
  ]).reply_markup
});

// Mini App JavaScript (scanner.html)
/*
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script>
Telegram.WebApp.ready();

Telegram.WebApp.showScanQrPopup(
  { text: 'Scan product barcode' },
  function(scannedText) {
    // Send back to bot
    Telegram.WebApp.sendData(JSON.stringify({
      type: 'barcode',
      value: scannedText
    }));
    return true; // Close popup
  }
);
</script>
*/

// Handle data from Mini App
bot.on('web_app_data', async (ctx) => {
  const data = JSON.parse(ctx.webAppData.data);
  if (data.type === 'barcode') {
    const product = await findProductByBarcode(data.value);
    // ... handle product
  }
});
```

---

## Document Generation

### Send PDF Report

```typescript
// apps/api/src/bot/handlers/reports.ts
import PDFDocument from 'pdfkit';

async function sendInventoryReport(ctx: MyContext) {
  await ctx.reply('📊 Generating report\\.\\.\\.');
  
  // Generate PDF
  const pdfBuffer = await generateInventoryPDF();
  
  // Create thumbnail (optional, JPEG only, max 200KB, 320x320)
  const thumbnail = await generateReportThumbnail();
  
  await ctx.replyWithDocument(
    { 
      source: pdfBuffer, 
      filename: `inventory_report_${formatDate(new Date())}.pdf` 
    },
    {
      caption: '📊 *Inventory Report*\nGenerated: ' + escapeMarkdownV2(new Date().toLocaleString()),
      parse_mode: 'MarkdownV2',
      thumbnail: thumbnail ? { source: thumbnail } : undefined
    }
  );
}

async function generateInventoryPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Header
    doc.fontSize(20).text('Inventory Report', { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    
    // Table header
    doc.fontSize(10);
    doc.text('SKU', 50, doc.y, { continued: true, width: 80 });
    doc.text('Product', 130, doc.y, { continued: true, width: 200 });
    doc.text('Stock', 330, doc.y, { continued: true, width: 60 });
    doc.text('Value', 390, doc.y, { width: 80 });
    doc.moveDown();
    
    // Add rows...
    // (implementation details)
    
    doc.end();
  });
}
```

### Document Size Limits

| Method | Upload Limit | URL Limit |
|--------|--------------|-----------|
| `sendDocument` | 50 MB | 20 MB |
| `sendPhoto` | 10 MB | 5 MB |
| `sendVideo` | 50 MB | 20 MB |
| Local Bot API Server | 2 GB | 2 GB |

---

## Scheduled Messages & Alerts

### Using node-cron for Scheduled Reports

```typescript
// apps/api/src/bot/scheduler.ts
import cron from 'node-cron';
import { bot } from './index';

export function initScheduler() {
  // Daily summary at 8:00 AM (server timezone)
  cron.schedule('0 8 * * *', async () => {
    await sendDailySummaryToSubscribers();
  });
  
  // Weekly report on Mondays at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    await sendWeeklyReportToSubscribers();
  });
  
  // Low stock check every hour
  cron.schedule('0 * * * *', async () => {
    await checkAndAlertLowStock();
  });
  
  console.log('📅 Scheduler initialized');
}

async function sendDailySummaryToSubscribers() {
  const subscribers = await db.telegramUser.findMany({
    where: { 
      isAuthorized: true, 
      dailyReport: true 
    }
  });
  
  const report = await generateDailySummary();
  
  for (const user of subscribers) {
    try {
      await bot.telegram.sendMessage(
        user.chatId.toString(),
        report,
        { 
          parse_mode: 'MarkdownV2',
          disable_notification: false  // Enable notification for reports
        }
      );
    } catch (error) {
      console.error(`Failed to send to ${user.chatId}:`, error);
      // Handle blocked bot, etc.
    }
  }
}

async function checkAndAlertLowStock() {
  const lowStockProducts = await db.product.findMany({
    where: {
      quantity: { lte: db.raw('minStock') }
    }
  });
  
  if (lowStockProducts.length === 0) return;
  
  const subscribers = await db.telegramUser.findMany({
    where: { 
      isAuthorized: true, 
      notifyLowStock: true 
    }
  });
  
  const alert = formatLowStockAlert(lowStockProducts);
  
  for (const user of subscribers) {
    try {
      await bot.telegram.sendMessage(
        user.chatId.toString(),
        alert,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('📦 View Products', 'products_low')],
            [Markup.button.callback('📋 Create Order', 'order_restock')]
          ]).reply_markup
        }
      );
    } catch (error) {
      console.error(`Failed to send alert to ${user.chatId}:`, error);
    }
  }
}
```

### Silent Notifications

```typescript
// Send without notification sound
await ctx.reply(message, {
  disable_notification: true
});
```

### Protect Content (Prevent Forwarding)

```typescript
// Prevent forwarding/saving sensitive reports
await ctx.replyWithDocument(
  { source: pdfBuffer, filename: 'confidential_report.pdf' },
  {
    caption: '🔒 *Confidential Report*',
    parse_mode: 'MarkdownV2',
    protect_content: true  // Can't forward or save
  }
);
```

---

## Forum Topics

### Organize Inventory by Category (Supergroups Only)

```typescript
// Create forum topics for each category
async function setupForumTopics(ctx: MyContext, forumId: string) {
  const categories = await db.category.findMany();
  
  for (const category of categories) {
    const topic = await ctx.telegram.createForumTopic(
      forumId,
      category.name,
      {
        icon_color: getCategoryColor(category.name),
        icon_custom_emoji_id: category.emojiId  // Optional custom emoji
      }
    );
    
    // Store topic ID for later use
    await db.category.update({
      where: { id: category.id },
      data: { forumTopicId: topic.message_thread_id }
    });
  }
}

// Send message to specific category topic
async function sendToCategoryTopic(
  ctx: MyContext, 
  forumId: string, 
  categoryId: string, 
  message: string
) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  
  await ctx.telegram.sendMessage(
    forumId,
    message,
    {
      message_thread_id: category.forumTopicId,
      parse_mode: 'MarkdownV2'
    }
  );
}

// Topic icon colors
const TOPIC_COLORS = {
  blue: 0x6FB9F0,
  yellow: 0xFFD67E,
  violet: 0xCB86DB,
  green: 0x8EEE98,
  rose: 0xFF93B2,
  red: 0xFB6F5F
};
```

---

## API Method Reference

### Message Sending Methods

| Method | Use Case | Key Parameters |
|--------|----------|----------------|
| `sendMessage` | Text messages | `parse_mode`, `link_preview_options`, `reply_markup` |
| `sendPhoto` | Single image | `caption`, `has_spoiler`, `show_caption_above_media` |
| `sendMediaGroup` | Album (2-10) | Array of `InputMedia*` |
| `sendVideo` | Video | `cover`, `start_timestamp`, `has_spoiler` |
| `sendDocument` | Files/PDFs | `thumbnail`, `disable_content_type_detection` |
| `sendAnimation` | GIFs | `has_spoiler` |
| `sendInvoice` | Payments | `prices`, `currency` ("XTR" for Stars) |

### Message Editing Methods

| Method | Use Case |
|--------|----------|
| `editMessageText` | Update text content |
| `editMessageCaption` | Update media caption |
| `editMessageMedia` | Replace media entirely |
| `editMessageReplyMarkup` | Update inline keyboard only |
| `deleteMessage` | Remove message |

### Interactive Methods

| Method | Use Case |
|--------|----------|
| `answerCallbackQuery` | Respond to button press (required!) |
| `setMessageReaction` | Add emoji reaction |
| `sendChatAction` | Show "typing...", "uploading..." |

### Chat Actions

```typescript
// Show "typing..." indicator
await ctx.sendChatAction('typing');

// Show "uploading document..." indicator  
await ctx.sendChatAction('upload_document');

// Available actions:
// 'typing', 'upload_photo', 'record_video', 'upload_video',
// 'record_voice', 'upload_voice', 'upload_document',
// 'choose_sticker', 'find_location', 'record_video_note', 'upload_video_note'
```

---

## Code Examples

### Complete Product Handler

```typescript
// apps/api/src/bot/handlers/products.ts
import { Telegraf, Markup } from 'telegraf';
import { MyContext } from '../types';
import { 
  formatProductCard, 
  formatProductList, 
  escapeMarkdownV2 
} from '../utils/formatter';
import { 
  productActionsKeyboard, 
  paginationKeyboard 
} from '../keyboards/products';

export function registerProductHandlers(bot: Telegraf<MyContext>) {
  
  // /products - List with pagination
  bot.command('products', async (ctx) => {
    await ctx.sendChatAction('typing');
    
    const products = await db.product.findMany({
      take: 10,
      orderBy: { name: 'asc' }
    });
    const total = await db.product.count();
    const totalPages = Math.ceil(total / 10);
    
    await ctx.reply(
      formatProductList(products, 1, totalPages),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: paginationKeyboard(1, totalPages, 'products').reply_markup
      }
    );
  });
  
  // /product [query] - Search
  bot.command('product', async (ctx) => {
    const query = ctx.message.text.replace('/product', '').trim();
    
    if (!query) {
      await ctx.reply('Usage: `/product CHO\\-001` or `/product chocolate`', {
        parse_mode: 'MarkdownV2'
      });
      return;
    }
    
    await ctx.sendChatAction('typing');
    
    const products = await searchProducts(query);
    
    if (products.length === 0) {
      await ctx.reply(`❌ No products found for "${escapeMarkdownV2(query)}"`, {
        parse_mode: 'MarkdownV2'
      });
      return;
    }
    
    if (products.length === 1) {
      // Single result - show full details
      const product = products[0];
      
      if (product.imageUrl) {
        await ctx.replyWithPhoto(
          { url: product.imageUrl },
          {
            caption: formatProductCard(product),
            parse_mode: 'MarkdownV2',
            show_caption_above_media: true,
            reply_markup: productActionsKeyboard(product.id).reply_markup
          }
        );
      } else {
        await ctx.reply(formatProductCard(product), {
          parse_mode: 'MarkdownV2',
          reply_markup: productActionsKeyboard(product.id).reply_markup
        });
      }
    } else {
      // Multiple results - show list
      await ctx.reply(
        formatProductList(products.slice(0, 10), 1, 1),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: Markup.inlineKeyboard(
            products.slice(0, 5).map(p => [
              Markup.button.callback(
                `${p.name} (${p.quantity} pcs)`,
                `product_view_${p.id}`
              )
            ])
          ).reply_markup
        }
      );
    }
  });
  
  // /low - Low stock products
  bot.command('low', async (ctx) => {
    await ctx.sendChatAction('typing');
    
    const lowStock = await db.product.findMany({
      where: {
        quantity: { lte: db.raw('minStock') },
        quantity: { gt: 0 }
      },
      orderBy: { quantity: 'asc' }
    });
    
    if (lowStock.length === 0) {
      await ctx.reply('✅ No low stock products\\!', { parse_mode: 'MarkdownV2' });
      return;
    }
    
    const lines = lowStock.map(p => {
      const safeName = escapeMarkdownV2(p.name);
      return `⚠️ *${safeName}*\n   Current: ${p.quantity} \\| Min: ${p.minStock}`;
    });
    
    await ctx.reply(
      `🚨 *LOW STOCK PRODUCTS*\n━━━━━━━━━━━━━━━━━━━━\n\n${lines.join('\n\n')}`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('📋 Create Restock Order', 'order_restock')]
        ]).reply_markup
      }
    );
  });
  
  // Callback: View product details
  bot.action(/^product_view_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    
    const productId = ctx.match[1];
    const product = await db.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      await ctx.reply('❌ Product not found');
      return;
    }
    
    // Edit existing message or send new
    try {
      if (product.imageUrl) {
        await ctx.editMessageMedia(
          {
            type: 'photo',
            media: product.imageUrl,
            caption: formatProductCard(product),
            parse_mode: 'MarkdownV2'
          },
          { reply_markup: productActionsKeyboard(product.id).reply_markup }
        );
      } else {
        await ctx.editMessageText(formatProductCard(product), {
          parse_mode: 'MarkdownV2',
          reply_markup: productActionsKeyboard(product.id).reply_markup
        });
      }
    } catch {
      // Message can't be edited, send new
      await ctx.reply(formatProductCard(product), {
        parse_mode: 'MarkdownV2',
        reply_markup: productActionsKeyboard(product.id).reply_markup
      });
    }
  });
  
  // Callback: Pagination
  bot.action(/^products_page_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    
    const page = parseInt(ctx.match[1]);
    const skip = (page - 1) * 10;
    
    const products = await db.product.findMany({
      take: 10,
      skip,
      orderBy: { name: 'asc' }
    });
    const total = await db.product.count();
    const totalPages = Math.ceil(total / 10);
    
    await ctx.editMessageText(
      formatProductList(products, page, totalPages),
      {
        parse_mode: 'MarkdownV2',
        reply_markup: paginationKeyboard(page, totalPages, 'products').reply_markup
      }
    );
  });
}
```

### Error Handling Wrapper

```typescript
// apps/api/src/bot/utils/errorHandler.ts

export function wrapHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const ctx = args[0] as MyContext;
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Bot handler error:', error);
      
      try {
        await ctx.reply(
          '❌ An error occurred\\. Please try again\\.',
          { parse_mode: 'MarkdownV2' }
        );
      } catch {
        // Can't even send error message
      }
    }
  }) as T;
}

// Usage
bot.command('products', wrapHandler(async (ctx) => {
  // ... handler code
}));
```

---

## Quick Reference Cards

### Message Limits

| Item | Limit |
|------|-------|
| Message text | 4096 characters |
| Caption | 1024 characters |
| Callback data | 64 bytes |
| Inline keyboard buttons per row | 8 |
| Inline keyboard rows | 100 |
| File upload | 50 MB |
| Media group items | 2-10 |

### Parse Mode Comparison

| Feature | MarkdownV2 | HTML |
|---------|------------|------|
| Escaping required | Yes (many chars) | Yes (< > &) |
| Nesting | Limited | Full |
| Expandable quotes | `**>text||` | `<blockquote expandable>` |
| Code language | ` ```python ` | `<code class="language-python">` |
| Custom emoji | `![e](tg://emoji?id=X)` | `<tg-emoji emoji-id="X">` |

### Bot API Version Features

| Version | Date | Key Features for Inventory Bots |
|---------|------|--------------------------------|
| 7.0 | Dec 2023 | Reactions, block quotes, link preview options |
| 7.4 | May 2024 | Expandable quotes, caption above media, Telegram Stars |
| 7.11 | Oct 2024 | Copy text buttons |
| 8.3 | Feb 2025 | Video cover/start_timestamp |
| 9.0 | Apr 2025 | Business management, story posting |

---

*Last updated: Bot API 9.2 (August 2025)*
