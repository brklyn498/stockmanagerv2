# Stock Manager v2 - Telegram Bot Integration Roadmap

## 🧠 MASTER PROMPT FOR CLAUDE CODE

```
Read TELEGRAM_BOT_ROADMAP.md for Telegram bot integration requirements.
Read PROGRESS.md for current project status.

Implement the Telegram bot following the specifications exactly.
The bot should integrate with the existing Express API on port 3001.

After completing each feature section:
1. Update PROGRESS.md
2. Commit with message "feat: telegram - [feature description]"
3. Push to origin main

Start by telling me current status and what you'll implement first.
```

---

## 📋 Overview

### What We're Building
A Telegram bot that allows users to:
- View stock levels and product info
- Receive low stock alerts
- Record stock movements
- Create quick orders
- Get daily/weekly reports
- Scan barcodes via photo
- Manage inventory on-the-go

### Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Telegram   │────▶│   Bot API   │────▶│  Express    │
│   Users     │◀────│  (webhook)  │◀────│  API :3001  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │              ┌────┴────┐
                           │              │ SQLite  │
                           │              │   DB    │
                           │              └─────────┘
                           │
                    ┌──────┴──────┐
                    │ Bot Service │
                    │  (polling/  │
                    │  webhook)   │
                    └─────────────┘
```

### Tech Stack Addition
| Technology | Purpose |
|------------|---------|
| **node-telegram-bot-api** | Telegram Bot SDK |
| **OR telegraf** | Alternative: more features, middleware support |

---

## 🚀 Phase T1: Bot Foundation

### T1.1 Create Telegram Bot
1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Choose name: `Stock Manager Bot`
4. Choose username: `stockmanagerv2_bot` (must be unique)
5. Save the API token

### T1.2 Project Structure
```
apps/
  api/
    src/
      bot/
        index.ts           # Bot initialization
        handlers/
          start.ts         # /start command
          help.ts          # /help command
          products.ts      # Product-related commands
          stock.ts         # Stock movement commands
          orders.ts        # Order commands
          reports.ts       # Report commands
          alerts.ts        # Alert management
        keyboards/
          main.ts          # Main menu keyboard
          products.ts      # Product selection keyboards
          inline.ts        # Inline keyboards
        middleware/
          auth.ts          # User authentication
          logging.ts       # Command logging
        utils/
          formatter.ts     # Message formatting helpers
          pagination.ts    # Paginated results
        types.ts           # Bot-specific types
      services/
        telegramService.ts # Bridge to existing services
```

### T1.3 Database Additions
```prisma
model TelegramUser {
  id visio        String   @id @default(cuid())
  telegramId    BigInt   @unique  // Telegram user ID
  chatId        BigInt   // Chat ID for sending messages
  username      String?
  firstName     String?
  lastName      String?
  isAuthorized  Boolean  @default(false)
  role          String   @default("VIEWER")  // ADMIN, MANAGER, STAFF, VIEWER
  notifyLowStock Boolean @default(true)
  notifyOrders   Boolean @default(true)
  dailyReport    Boolean @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  userId        String?  // Link to main User account (optional)
  user          User?    @relation(fields: [userId], references: [id])
}

model BotSession {
  id          String   @id @default(cuid())
  telegramId  BigInt   @unique
  state       String   @default("IDLE")  // Current conversation state
  data        String?  // JSON data for multi-step operations
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Add to User model
model User {
  // ... existing fields
  telegramUsers TelegramUser[]
}
```

### T1.4 Commands for Claude Code
```
Set up Telegram bot foundation:

1. Install: npm install node-telegram-bot-api (in apps/api)
   Or: npm install telegraf (alternative, recommended for complex bots)

2. Add to .env:
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_WEBHOOK_URL=https://yourdomain.com/bot/webhook (for production)
   BOT_MODE=polling  # or 'webhook' for production

3. Update Prisma schema with TelegramUser and BotSession models
   Run migration: npx prisma migrate dev --name add-telegram

4. Create bot initialization:
   - apps/api/src/bot/index.ts
   - Initialize bot with token
   - Set up polling (dev) or webhook (prod)
   - Register command handlers

5. Create basic handlers:
   - /start - Welcome message, register user
   - /help - List available commands
   - /menu - Show main menu keyboard

6. Create main menu keyboard with buttons:
   [📦 Products]  [📊 Stock]
   [📋 Orders]    [📈 Reports]
   [⚙️ Settings]  [❓ Help]

7. Integrate bot startup with Express server in apps/api/src/index.ts

8. Test: Send /start to your bot

Commit as "feat: telegram - bot foundation and basic commands", push.
```

---

## 📦 Phase T2: Product Commands

### T2.1 Product Lookup Commands
| Command | Description |
|---------|-------------|
| `/products` | List products with pagination |
| `/product [name/sku]` | Search for product |
| `/product_[id]` | View product details |
| `/low` | List low stock products |
| `/out` | List out of stock products |

### T2.2 Product Message Format
```
📦 *Dark Chocolate Bar*
━━━━━━━━━━━━━━━━━━━━
SKU: `CHO-001`
Category: Snacks
Supplier: Sweet Treats Co

💰 *Pricing*
Cost: $2.50
Retail: $4.99
Margin: 49.9%

📊 *Stock*
Current: 45 pieces
Min: 20 | Max: 100
Status: ✅ Normal

📅 Last Movement: 2 hours ago

[➕ Add Stock] [➖ Remove] [📝 Edit]
```

### T2.3 Product List Pagination
```
📦 *Products (Page 1/5)*
━━━━━━━━━━━━━━━━━━━━

1. Dark Chocolate - 45 pcs ✅
2. Milk Chocolate - 12 pcs ⚠️
3. White Chocolate - 0 pcs ❌
4. Caramel Bar - 89 pcs ✅
5. Mint Chocolate - 34 pcs ✅

[◀️ Prev] [Page 1/5] [Next ▶️]
[🔍 Search] [📉 Low Stock]
```

### T2.4 Commands for Claude Code
```
Implement product commands:

1. Create apps/api/src/bot/handlers/products.ts:

   /products command:
   - Fetch paginated products from API
   - Format as numbered list with stock indicators
   - Add pagination inline keyboard
   - Each product name is clickable (callback: product_VIEW_[id])

   /product [query] command:
   - Search products by name or SKU
   - If single result, show full details
   - If multiple, show list to select from

   /low command:
   - Fetch products where quantity < minStock
   - Show as list with current vs min stock

   /out command:
   - Fetch products where quantity = 0
   - Show with last movement date

2. Create apps/api/src/bot/keyboards/products.ts:
   - Product list pagination keyboard
   - Product detail action buttons
   - Product selection keyboard (for multi-step flows)

3. Create apps/api/src/bot/utils/formatter.ts:
   - formatProduct(product) - detailed view
   - formatProductList(products) - list view
   - formatStockStatus(product) - emoji indicator
   - escapeMarkdown(text) - escape special chars

4. Handle callback queries for:
   - product_VIEW_[id] - Show product details
   - product_PAGE_[num] - Change page
   - product_SEARCH - Prompt for search term

Commit as "feat: telegram - product lookup commands", push.
```

---

## 📊 Phase T3: Stock Management

### T3.1 Stock Commands
| Command | Description |
|---------|-------------|
| `/stock` | Stock management menu |
| `/add [sku] [qty]` | Quick add stock |
| `/remove [sku] [qty]` | Quick remove stock |
| `/adjust` | Start adjustment wizard |
| `/movements` | Recent movements |

### T3.2 Stock Adjustment Flow (Conversational)
```
User: /adjust

Bot: 📦 *Stock Adjustment*
     Which product? Send name, SKU, or barcode photo.

User: CHO-001

Bot: 📦 *Dark Chocolate Bar*
     Current stock: 45 pieces
     
     What type of adjustment?
     [➕ Add] [➖ Remove] [🔄 Set]

User: [clicks ➕ Add]

Bot: How many pieces to add?
     Current: 45 pieces

User: 30

Bot: Select reason:
     [📦 Received Shipment]
     [📋 Inventory Count]
     [↩️ Customer Return]
     [📝 Other]

User: [clicks 📦 Received Shipment]

Bot: ✅ *Stock Updated!*
     
     Dark Chocolate Bar
     Before: 45 pieces
     Added: +30 pieces
     After: 75 pieces
     
     Reason: Received Shipment
     
     [📦 View Product] [🔄 Another Adjustment]
```

### T3.3 Quick Stock Commands
```
User: /add CHO-001 30

Bot: ✅ Added 30 to Dark Chocolate Bar
     New stock: 75 pieces
     
     [📦 View] [↩️ Undo]
```

### T3.4 Commands for Claude Code
```
Implement stock management commands:

1. Create apps/api/src/bot/handlers/stock.ts:

   /stock command:
   - Show stock menu keyboard
   - Options: Add, Remove, Adjust, View Movements

   /add [sku] [qty] [reason?]:
   - Quick add stock
   - Optional reason parameter
   - Confirm with undo option

   /remove [sku] [qty] [reason?]:
   - Quick remove stock
   - Check if sufficient stock
   - Confirm with undo option

   /adjust command:
   - Start multi-step adjustment wizard
   - Use BotSession to track state

   /movements command:
   - Show recent 10 movements
   - Filter buttons: All, In, Out, Today

2. Create conversation state machine:
   States: IDLE, AWAITING_PRODUCT, AWAITING_TYPE, AWAITING_QTY, AWAITING_REASON

3. Create apps/api/src/bot/middleware/session.ts:
   - Load session from BotSession table
   - Save session state after each step
   - Clear expired sessions

4. Handle barcode photo:
   - User sends photo
   - If in AWAITING_PRODUCT state, try to decode barcode
   - Look up product by barcode
   - Continue with adjustment flow

5. Create undo functionality:
   - Store last action in session
   - Undo button reverses the movement
   - Only available for 5 minutes

Commit as "feat: telegram - stock management commands", push.
```

---

## 📋 Phase T4: Orders via Telegram

### T4.1 Order Commands
| Command | Description |
|---------|-------------|
| `/orders` | List recent orders |
| `/order [id]` | View order details |
| `/neworder` | Start order creation |
| `/quickorder [sku] [qty]` | Single item order |

### T4.2 Order Creation Flow
```
User: /neworder

Bot: 📋 *New Order*
     
     Order type?
     [📥 Purchase (Stock In)] [📤 Sale (Stock Out)]

User: [clicks 📥 Purchase]

Bot: Select supplier:
     [Acme Corp]
     [Sweet Treats Co]
     [Global Imports]
     [Skip - No Supplier]

User: [clicks Sweet Treats Co]

Bot: 🛒 *Order from Sweet Treats Co*
     Items: (none yet)
     Total: $0.00
     
     Add products by sending name/SKU or photo.
     [✅ Complete Order] [❌ Cancel]

User: CHO-001 50

Bot: Added: Dark Chocolate Bar x50 ($125.00)
     
     🛒 *Order Summary*
     1. Dark Chocolate Bar x50 - $125.00
     
     Total: $125.00
     
     Add more or complete:
     [➕ Add More] [✅ Complete] [❌ Cancel]

User: [clicks ✅ Complete]

Bot: ✅ *Order Created!*
     
     Order #PO-2024-0042
     Type: Purchase
     Supplier: Sweet Treats Co
     Items: 1
     Total: $125.00
     Status: Pending
     
     [📋 View Order] [📦 Receive Stock] [📋 New Order]
```

### T4.3 Commands for Claude Code
```
Implement order commands:

1. Create apps/api/src/bot/handlers/orders.ts:

   /orders command:
   - List recent 10 orders
   - Show: order number, type, status, total
   - Filter buttons: All, Purchase, Sale, Pending

   /order [id/number] command:
   - Show full order details
   - List items with quantities
   - Action buttons based on status

   /neworder command:
   - Multi-step order creation wizard
   - States: TYPE, SUPPLIER, ITEMS, CONFIRM
   - Build order in session data

   /quickorder [sku] [qty]:
   - Create single-item sale order
   - Skip supplier selection
   - Quick confirmation

2. Order item addition:
   - Parse "SKU QTY" or "product name QTY"
   - Validate product exists
   - Check stock for sale orders
   - Add to session order data

3. Order confirmation:
   - Show full summary
   - Create order via API
   - Auto-update stock if configured
   - Send confirmation message

4. Order status updates:
   - Inline buttons to change status
   - /receive [order] to mark received
   - Update stock on completion

Commit as "feat: telegram - order management commands", push.
```

---

## 🔔 Phase T5: Alerts & Notifications

### T5.1 Alert Types
| Alert | Trigger | Message |
|-------|---------|---------|
| **Low Stock** | Product falls below minStock | Immediate notification |
| **Out of Stock** | Product reaches 0 | Urgent notification |
| **Order Status** | Order status changes | Status update |
| **Daily Summary** | Scheduled (configurable time) | Daily report |
| **Weekly Report** | Scheduled (configurable day) | Weekly summary |

### T5.2 Alert Message Formats
```
🚨 *LOW STOCK ALERT*
━━━━━━━━━━━━━━━━━━━━

⚠️ Dark Chocolate Bar
   Current: 8 pieces
   Minimum: 20 pieces
   
⚠️ Milk Chocolate
   Current: 5 pieces
   Minimum: 15 pieces

[📦 View Products] [📋 Create Order]
```

```
📊 *DAILY SUMMARY*
━━━━━━━━━━━━━━━━━━━━
📅 November 28, 2025

📦 *Stock Overview*
Total Products: 156
Low Stock: 5 ⚠️
Out of Stock: 2 ❌

📊 *Today's Activity*
Stock In: +234 units
Stock Out: -89 units
Net Change: +145 units

📋 *Orders*
New Orders: 3
Completed: 2
Pending: 4

💰 *Value*
Inventory Value: $45,230

[📋 Full Report] [📦 Low Stock]
```

### T5.3 Commands for Claude Code
```
Implement alerts and notifications:

1. Create apps/api/src/bot/handlers/alerts.ts:

   /alerts command:
   - Show alert settings
   - Toggle buttons for each alert type

   /subscribe command:
   - Subscribe to alerts
   - Choose which alerts to receive

   /unsubscribe command:
   - Unsubscribe from all or specific alerts

2. Create apps/api/src/bot/services/alertService.ts:
   - checkLowStock() - Check all products, send alerts
   - sendOrderUpdate(order, users) - Notify about order
   - sendDailySummary(users) - Daily report
   - sendWeeklyReport(users) - Weekly report

3. Create alert triggers:
   
   a. Stock Movement Hook:
      - After stock movement, check if product now low/out
      - If yes, send alert to subscribed users
      - Add to: apps/api/src/controllers/stockMovementController.ts

   b. Order Status Hook:
      - After order status change, notify relevant users
      - Add to: apps/api/src/controllers/orderController.ts

4. Create scheduled jobs (use node-cron):
   npm install node-cron
   
   - Daily summary: configurable time (default 8:00 AM)
   - Weekly report: configurable day/time (default Monday 8:00 AM)
   - Low stock check: every hour

5. Create apps/api/src/bot/scheduler.ts:
   - Initialize cron jobs
   - Fetch subscribed users
   - Generate and send reports

6. Add notification preferences to /settings command

Commit as "feat: telegram - alerts and notifications", push.
```

---

## 📈 Phase T6: Reports via Telegram

### T6.1 Report Commands
| Command | Description |
|---------|-------------|
| `/report` | Report menu |
| `/report inventory` | Current inventory summary |
| `/report movements [period]` | Movement report |
| `/report value` | Inventory valuation |
| `/report lowstock` | Low stock report |

### T6.2 Report Formats
```
📊 *INVENTORY REPORT*
━━━━━━━━━━━━━━━━━━━━
Generated: Nov 28, 2025 14:30

📦 *By Category*
┌─────────────────────────────┐
│ Electronics    │  45 │ $12,340 │
│ Snacks        │ 234 │  $2,456 │
│ Beverages     │ 123 │  $1,890 │
│ Office        │  67 │  $3,210 │
└─────────────────────────────┘

📊 *Summary*
Total Products: 156
Total Units: 469
Total Value: $19,896

⚠️ *Attention Needed*
Low Stock: 5 products
Out of Stock: 2 products

[📥 Download PDF] [📧 Email Report]
```

### T6.3 Commands for Claude Code
```
Implement report commands:

1. Create apps/api/src/bot/handlers/reports.ts:

   /report command:
   - Show report menu keyboard
   - Options: Inventory, Movements, Value, Low Stock

   /report inventory:
   - Fetch all products grouped by category
   - Calculate totals per category
   - Format as table (using monospace)

   /report movements [today/week/month]:
   - Summarize movements for period
   - Show: total in, total out, net change
   - Top products by movement

   /report value:
   - Calculate total inventory value
   - Break down by category
   - Show cost vs retail value

   /report lowstock:
   - List all low stock products
   - Include reorder suggestions
   - Option to create PO

2. Create PDF generation:
   npm install pdfkit (if not already installed)
   
   - Generate PDF report
   - Upload to Telegram as document
   - Alternative: generate and send link to web report

3. Create apps/api/src/bot/utils/tableFormatter.ts:
   - Format data as ASCII tables
   - Handle column alignment
   - Truncate long text

4. Add report period parsing:
   - "today" = current day
   - "week" = last 7 days
   - "month" = last 30 days
   - "2024-11" = specific month
   - Custom date range via conversation

Commit as "feat: telegram - report generation", push.
```

---

## 📷 Phase T7: Barcode Scanning via Photo

### T7.1 Photo Handling Flow
```
User: [sends photo of barcode]

Bot: 🔍 Scanning barcode...

Bot: 📦 *Product Found!*
     
     Dark Chocolate Bar
     SKU: CHO-001
     Stock: 45 pieces
     
     What would you like to do?
     [📋 Details] [➕ Add Stock] [➖ Remove]
```

### T7.2 Commands for Claude Code
```
Implement barcode scanning from photos:

1. Install: npm install @aspect-build/aspect (or similar barcode library)
   Alternative: npm install quagga (works server-side with jimp)
   Alternative: Use external API like Google Vision

2. Create apps/api/src/bot/services/barcodeService.ts:
   - extractBarcode(photoBuffer) - Decode barcode from image
   - Handle multiple barcode formats: EAN-13, Code128, UPC-A, QR

3. Add photo handler to bot:
   
   bot.on('photo', async (msg) => {
     // Get largest photo version
     // Download photo from Telegram
     // Send to barcode service
     // If decoded, look up product
     // If found, show product with actions
     // If not found, offer to create new product
   })

4. Integrate with conversation states:
   - If in AWAITING_PRODUCT state, use decoded barcode
   - Continue with stock adjustment or order flow

5. Handle errors gracefully:
   - "Could not read barcode, please try again"
   - "No product found with barcode: XXX"
   - Offer manual search

6. Add barcode to product creation:
   - If product not found, offer to create
   - Pre-fill barcode field

Commit as "feat: telegram - barcode scanning from photos", push.
```

---

## 🔐 Phase T8: Authentication & Authorization

### T8.1 Auth Flow
```
User: /start

Bot: 👋 Welcome to Stock Manager Bot!
     
     To access inventory features, please authorize:
     [🔑 Enter Access Code]

User: [clicks button]

Bot: Please enter your access code.
     (Get this from your admin or web dashboard)

User: ABC123XYZ

Bot: ✅ *Authorized!*
     
     Welcome, John! You have Manager access.
     
     Type /help to see available commands.
     [📦 Products] [📊 Stock] [📋 Orders]
```

### T8.2 Permission Levels
| Role | Permissions |
|------|-------------|
| **ADMIN** | All commands, user management, settings |
| **MANAGER** | All stock/order commands, reports |
| **STAFF** | Add/remove stock, create orders |
| **VIEWER** | View products, stock levels, reports |

### T8.3 Commands for Claude Code
```
Implement authentication and authorization:

1. Create access code system:
   
   Add to database:
   model AccessCode {
     id        String   @id @default(cuid())
     code      String   @unique
     role      String   // Role to assign
     maxUses   Int      @default(1)
     usedCount Int      @default(0)
     expiresAt DateTime?
     createdBy String
     createdAt DateTime @default(now())
   }

2. Create apps/api/src/bot/middleware/auth.ts:
   
   - checkAuth middleware:
     - Check if user exists in TelegramUser
     - Check if isAuthorized = true
     - If not, prompt for authorization
   
   - checkRole(['ADMIN', 'MANAGER']) middleware:
     - Verify user has required role
     - Send "unauthorized" message if not

3. Create authorization commands:

   /start:
   - Check if user authorized
   - If yes, show main menu
   - If no, show authorization button

   /auth [code]:
   - Validate access code
   - Create/update TelegramUser
   - Set role from access code
   - Mark code as used

   /logout:
   - Set isAuthorized = false
   - Clear session

4. Create admin commands:

   /gencode [role]:
   - Generate new access code
   - Admin only
   - Return code to share

   /users:
   - List authorized Telegram users
   - Admin only

   /revoke [telegram_id]:
   - Revoke user access
   - Admin only

5. Apply auth middleware to all protected commands

6. Add to web dashboard:
   - Generate Telegram access codes
   - View connected Telegram users
   - Revoke access

Commit as "feat: telegram - authentication system", push.
```

---

## ⚙️ Phase T9: Settings & Configuration

### T9.1 User Settings
```
User: /settings

Bot: ⚙️ *Your Settings*
     ━━━━━━━━━━━━━━━━━━━━
     
     🔔 *Notifications*
     Low Stock Alerts: ✅ On
     Order Updates: ✅ On
     Daily Summary: ❌ Off
     Weekly Report: ❌ Off
     
     ⏰ *Report Schedule*
     Daily: 8:00 AM
     Weekly: Monday
     
     🌍 *Preferences*
     Language: English
     Timezone: UTC+5
     
     [🔔 Notifications] [⏰ Schedule] [🌍 Language]
```

### T9.2 Commands for Claude Code
```
Implement settings management:

1. Create apps/api/src/bot/handlers/settings.ts:

   /settings command:
   - Show current settings
   - Inline keyboard for each category

   Notification toggles:
   - Low stock alerts on/off
   - Order updates on/off
   - Daily summary on/off
   - Weekly report on/off

   Schedule settings:
   - Daily report time
   - Weekly report day

2. Create settings persistence:
   - Update TelegramUser fields
   - notifyLowStock, notifyOrders, dailyReport, etc.

3. Add language support (optional):
   - Store preferred language
   - Use i18n for messages
   - Support: English, Russian, Uzbek

4. Add timezone support:
   - Store user timezone
   - Adjust report times accordingly
   - npm install moment-timezone

Commit as "feat: telegram - user settings", push.
```

---

## 🌐 Phase T10: Production Deployment

### T10.1 Webhook Setup (Production)
```typescript
// For production, use webhooks instead of polling

// In apps/api/src/bot/index.ts
if (process.env.BOT_MODE === 'webhook') {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  bot.setWebHook(`${webhookUrl}/bot${token}`);
  
  // Express route for webhook
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
} else {
  bot.startPolling();
}
```

### T10.2 Environment Variables
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_MODE=polling  # 'polling' for dev, 'webhook' for prod
TELEGRAM_WEBHOOK_URL=https://yourdomain.com

# Optional: Webhook secret for security
TELEGRAM_WEBHOOK_SECRET=your_random_secret
```

### T10.3 Commands for Claude Code
```
Set up production deployment:

1. Create webhook endpoint:
   - POST /bot[token] - Telegram webhook
   - Verify webhook secret
   - Process updates

2. Create health check:
   - GET /bot/health - Bot status
   - Return: connected, webhook status, last update

3. Add graceful shutdown:
   - Stop polling on SIGTERM
   - Complete pending operations

4. Add error handling:
   - Catch all bot errors
   - Log errors
   - Don't crash on single error

5. Add rate limiting:
   - Track messages per user
   - Prevent spam/abuse
   - Admin bypass

6. Update deployment docs:
   - Webhook URL requirements (HTTPS, valid cert)
   - Environment variables
   - Process manager setup (PM2)

Commit as "feat: telegram - production webhook setup", push.
```

---

## 📱 Complete Command Reference

### General Commands
| Command | Description | Role |
|---------|-------------|------|
| `/start` | Start bot, authorize | All |
| `/help` | Show help message | All |
| `/menu` | Show main menu | All |
| `/settings` | User settings | All |
| `/logout` | Log out | All |

### Product Commands
| Command | Description | Role |
|---------|-------------|------|
| `/products` | List products | Viewer+ |
| `/product [query]` | Search product | Viewer+ |
| `/low` | Low stock list | Viewer+ |
| `/out` | Out of stock list | Viewer+ |

### Stock Commands
| Command | Description | Role |
|---------|-------------|------|
| `/stock` | Stock menu | Staff+ |
| `/add [sku] [qty]` | Add stock | Staff+ |
| `/remove [sku] [qty]` | Remove stock | Staff+ |
| `/adjust` | Adjustment wizard | Staff+ |
| `/movements` | Recent movements | Staff+ |

### Order Commands
| Command | Description | Role |
|---------|-------------|------|
| `/orders` | List orders | Staff+ |
| `/order [id]` | Order details | Staff+ |
| `/neworder` | Create order | Staff+ |
| `/quickorder` | Quick single-item | Staff+ |

### Report Commands
| Command | Description | Role |
|---------|-------------|------|
| `/report` | Report menu | Manager+ |
| `/report inventory` | Inventory report | Manager+ |
| `/report movements` | Movement report | Manager+ |
| `/report value` | Valuation report | Manager+ |

### Admin Commands
| Command | Description | Role |
|---------|-------------|------|
| `/gencode [role]` | Generate access code | Admin |
| `/users` | List bot users | Admin |
| `/revoke [id]` | Revoke access | Admin |
| `/broadcast [msg]` | Send to all users | Admin |

---

## ✅ Implementation Checklist

### Phase T1: Foundation
- [ ] Create bot with BotFather
- [ ] Install node-telegram-bot-api or telegraf
- [ ] Database: TelegramUser, BotSession models
- [ ] Basic /start, /help, /menu commands
- [ ] Main menu keyboard
- [ ] Integrate with Express server

### Phase T2: Products
- [ ] /products with pagination
- [ ] /product search
- [ ] /low and /out commands
- [ ] Product detail formatting
- [ ] Inline keyboards for actions

### Phase T3: Stock Management
- [ ] /stock menu
- [ ] /add and /remove quick commands
- [ ] /adjust wizard with conversation state
- [ ] /movements list
- [ ] Undo functionality
- [ ] Photo barcode in adjustment flow

### Phase T4: Orders
- [ ] /orders list
- [ ] /order details
- [ ] /neworder wizard
- [ ] /quickorder single item
- [ ] Order status updates

### Phase T5: Alerts
- [ ] Low stock alerts
- [ ] Out of stock alerts
- [ ] Order status notifications
- [ ] Daily summary (scheduled)
- [ ] Weekly report (scheduled)
- [ ] Alert subscription settings

### Phase T6: Reports
- [ ] /report menu
- [ ] Inventory report
- [ ] Movement report
- [ ] Valuation report
- [ ] PDF generation
- [ ] Table formatting

### Phase T7: Barcode Scanning
- [ ] Photo message handler
- [ ] Barcode decoding service
- [ ] Product lookup from barcode
- [ ] Integration with stock/order flows

### Phase T8: Authentication
- [ ] Access code system
- [ ] /auth command
- [ ] Role-based permissions
- [ ] Auth middleware
- [ ] Admin user management
- [ ] Web dashboard integration

### Phase T9: Settings
- [ ] /settings command
- [ ] Notification toggles
- [ ] Schedule configuration
- [ ] Timezone support

### Phase T10: Production
- [ ] Webhook endpoint
- [ ] Health check
- [ ] Error handling
- [ ] Rate limiting
- [ ] Deployment documentation

---

## 🔁 Quick Resume Prompts

### Start Telegram Bot Development:
```
I'm adding Telegram bot to stockmanagerv2.

Read TELEGRAM_BOT_ROADMAP.md for full specifications.
Read PROGRESS.md for current status.

Start with Phase T1: Bot Foundation
- Create bot structure in apps/api/src/bot/
- Add TelegramUser model to Prisma
- Implement /start, /help, /menu commands

After each feature: update PROGRESS.md, commit, push.
```

### Continue Bot Development:
```
Continue Telegram bot development for stockmanagerv2.

Read TELEGRAM_BOT_ROADMAP.md for specifications.
Read PROGRESS.md for current phase.

Tell me: (1) Current phase, (2) What's done, (3) What's next.
Implement the next feature following the roadmap.

Commit and push after each feature.
```

---

## 💡 Tips

1. **Use Telegraf** over node-telegram-bot-api for better middleware support
2. **Test with BotFather** /setcommands to add command hints
3. **Use inline keyboards** for better UX than reply keyboards
4. **Implement conversation timeout** - clear stuck sessions after 10 min
5. **Log all commands** for debugging and analytics
6. **Handle errors gracefully** - never leave user without response
7. **Use markdown formatting** for better readability
8. **Keep messages concise** - Telegram has message size limits
9. **Test on mobile** - most Telegram users are on phones
10. **Add /cancel** command to exit any conversation flow

---

*This roadmap integrates a full-featured Telegram bot with Stock Manager v2, enabling mobile inventory management on-the-go.*
