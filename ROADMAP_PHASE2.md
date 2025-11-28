# Stock Manager v2 - Phase 2 Roadmap (Expanded Features)

## 🧠 MASTER PROMPT FOR CLAUDE CODE

**Copy and paste this prompt every time you start a new session:**

```
Read ROADMAP_PHASE2.md in the project root for expanded feature requirements.
Read PROGRESS.md to see current status and what to work on next.

After completing any task:
1. Update PROGRESS.md - move task from "Current" to "Completed" with date
2. Add next logical task to "Current Sprint"
3. Git add, commit with conventional message, push to origin main

Maintain Neobrutalism design: thick black borders (4px), hard shadows (8px offset), 
bold colors (yellow-400 primary, yellow-100 bg), no rounded corners.

Start by telling me: (1) Current status, (2) What was last completed, (3) What you'll work on now.
```

---

## 📊 Current State Summary

**Completed (Phases 1-6):**
- ✅ Full monorepo setup (React + Express + TypeScript + SQLite)
- ✅ Complete CRUD for Products, Categories, Suppliers
- ✅ Stock Movements tracking with history
- ✅ Orders (Purchase & Sale) with auto stock updates
- ✅ Dashboard with charts and stats
- ✅ Global search (Cmd+K)
- ✅ CSV export
- ✅ Keyboard shortcuts
- ✅ Neobrutalism UI throughout
- ✅ Demo mode (auth disabled)

**Remaining from Original:**
- [ ] Print reports
- [ ] Barcode scanning
- [ ] Batch operations
- [ ] User management
- [ ] API tests & Swagger docs

---

## 🚀 PHASE 2: EXPANDED FEATURES

### Phase 8: Reporting & Analytics
**Goal:** Professional reports and deeper business insights

#### 8.1 Print Reports
| Report | Description |
|--------|-------------|
| **Inventory Report** | Full stock list with values, sorted by category |
| **Low Stock Report** | Products below minimum threshold |
| **Movement Report** | Stock movements for date range |
| **Order Report** | Orders by status, date range, supplier |
| **Valuation Report** | Total inventory value by category |

**API Endpoints:**
```
GET /api/reports/inventory?format=pdf|html
GET /api/reports/low-stock?format=pdf|html
GET /api/reports/movements?from=DATE&to=DATE&format=pdf|html
GET /api/reports/orders?status=STATUS&from=DATE&to=DATE
GET /api/reports/valuation
```

**Commands for Claude Code:**
```
Create a reports module in apps/api/src/controllers/reportController.ts.

Add endpoints for inventory, low-stock, movements, orders, and valuation reports.
Each endpoint should support both JSON and HTML format via query param.

In frontend, create apps/web/src/pages/Reports.tsx with:
- Report type selector (dropdown)
- Date range picker for applicable reports
- Filter options (category, supplier, status)
- Preview button (shows in modal)
- Print button (opens browser print dialog)
- Export PDF button (uses browser print to PDF)

Style with Neobrutalism. Use CSS @media print for clean printed output.
Commit as "feat: add reporting module with print support", push to origin main.
```

#### 8.2 Advanced Analytics Dashboard
| Widget | Description |
|--------|-------------|
| **Sales Trend** | Line chart of sales orders over time |
| **Top Sellers** | Bar chart of most moved products |
| **Stock Turnover** | How fast inventory moves |
| **Dead Stock** | Products with no movement in 30+ days |
| **Supplier Performance** | Orders by supplier, delivery tracking |
| **Profit Margins** | Revenue vs cost analysis |

**Commands for Claude Code:**
```
Expand the Dashboard page with new analytics widgets:

1. Add API endpoints:
   GET /api/analytics/sales-trend?period=week|month|year
   GET /api/analytics/top-sellers?limit=10
   GET /api/analytics/dead-stock?days=30
   GET /api/analytics/turnover
   GET /api/analytics/profit-margins

2. Create new chart components using Recharts:
   - SalesTrendChart (area chart with gradient)
   - TopSellersChart (horizontal bar chart)
   - DeadStockList (table with warning badges)
   - TurnoverGauge (visual indicator)

3. Add date range filter to dashboard header

Style all with Neobrutalism (thick borders on chart containers, bold colors).
Commit as "feat: add advanced analytics to dashboard", push.
```

---

### Phase 9: Multi-Location & Warehouse Management
**Goal:** Support multiple store locations or warehouses

#### 9.1 Database Changes
```prisma
model Location {
  id        String   @id @default(cuid())
  name      String   @unique
  address   String?
  phone     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  inventory LocationInventory[]
  movements StockMovement[]
  orders    Order[]
}

model LocationInventory {
  id         String   @id @default(cuid())
  quantity   Int      @default(0)
  minStock   Int      @default(10)
  
  locationId String
  location   Location @relation(fields: [locationId], references: [id])
  
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  
  @@unique([locationId, productId])
}

// Update StockMovement to include location
model StockMovement {
  // ... existing fields
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id])
}

// Update Order to include location
model Order {
  // ... existing fields
  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id])
}
```

**Commands for Claude Code:**
```
Add multi-location support to the stock manager:

1. Update Prisma schema with Location and LocationInventory models
2. Run migration: npx prisma migrate dev --name add-locations

3. Create location CRUD:
   - apps/api/src/controllers/locationController.ts
   - apps/api/src/routes/locationRoutes.ts
   - apps/web/src/pages/Locations.tsx

4. Update Products to show stock per location (tabs or table)
5. Update Stock Movements to require location selection
6. Update Orders to associate with location
7. Add location filter to Dashboard

8. Add location switcher in header (dropdown) that filters all views

Seed with 2 test locations: "Main Warehouse" and "Retail Store"
Commit as "feat: add multi-location warehouse support", push.
```

#### 9.2 Stock Transfers
```
Transfer stock between locations without creating orders
```

**API Endpoints:**
```
POST /api/transfers
{
  fromLocationId: string
  toLocationId: string
  items: [{ productId: string, quantity: number }]
  notes?: string
}

GET /api/transfers (list with filters)
GET /api/transfers/:id
```

**Commands for Claude Code:**
```
Add stock transfer functionality:

1. Create Transfer model in Prisma schema:
   - id, fromLocation, toLocation, items, status, createdAt, createdBy

2. Create transfer API:
   - POST creates transfer and updates both location inventories
   - Status: PENDING -> IN_TRANSIT -> COMPLETED
   
3. Create apps/web/src/pages/Transfers.tsx:
   - List of transfers with status badges
   - Create transfer form (from/to location, product selector, quantities)
   - Transfer detail view

4. Add "Transfer Stock" quick action to Dashboard

Neobrutalism styling. Commit as "feat: add stock transfers between locations", push.
```

---

### Phase 10: Barcode & Label System
**Goal:** Professional barcode scanning and label printing

#### 10.1 Barcode Scanning
**Commands for Claude Code:**
```
Add barcode scanning using the device camera:

1. Install: npm install @aspect/barcode-scanner react-webcam (or similar library)

2. Create apps/web/src/components/BarcodeScanner.tsx:
   - Camera preview with scanning frame overlay
   - Supports Code128, EAN-13, UPC-A formats
   - Beep sound on successful scan
   - Returns scanned code to parent component

3. Add barcode field back to Product model if removed

4. Integrate scanner into:
   - Products page: Quick lookup by scanning
   - Stock Movements: Scan to add product
   - Orders: Scan to add item to order

5. Add keyboard shortcut: Cmd+B to open scanner modal

Neobrutalism modal styling. Commit as "feat: add barcode scanning", push.
```

#### 10.2 Label Printing
**Commands for Claude Code:**
```
Add label/barcode printing for products:

1. Install: npm install jsbarcode (for generating barcode images)

2. Create apps/web/src/components/LabelTemplate.tsx:
   - Product name
   - SKU
   - Barcode image
   - Price
   - Configurable size (small/medium/large)

3. Create apps/web/src/pages/Labels.tsx:
   - Select products to print
   - Choose label size/format
   - Preview grid of labels
   - Print button (uses @media print CSS)

4. Add "Print Labels" button to Products page (for selected items)

5. Support Avery-style label sheets (configurable grid)

Commit as "feat: add barcode label printing", push.
```

---

### Phase 11: Purchase Order Workflow
**Goal:** Full procurement cycle management

#### 11.1 Purchase Order States
```
DRAFT -> SUBMITTED -> APPROVED -> ORDERED -> PARTIALLY_RECEIVED -> RECEIVED -> CLOSED
```

#### 11.2 Features
| Feature | Description |
|---------|-------------|
| **PO Creation** | Create from low stock alerts or manually |
| **Auto-suggest** | Suggest quantities based on min/max stock |
| **Approval Workflow** | Optional manager approval step |
| **Receiving** | Mark items received (partial supported) |
| **Discrepancy Handling** | Note differences from ordered qty |
| **Supplier Linking** | Auto-fill supplier details |

**Commands for Claude Code:**
```
Enhance the Orders system for full purchase order workflow:

1. Update Order model with new statuses:
   DRAFT, SUBMITTED, APPROVED, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CLOSED

2. Add to Order model:
   - approvedBy (userId, optional)
   - approvedAt (datetime, optional)
   - orderedAt (datetime)
   - receivedAt (datetime)
   - expectedDelivery (date, optional)

3. Add OrderItemReceived model to track partial receiving:
   - orderItemId
   - quantityReceived
   - receivedAt
   - notes (for discrepancies)

4. Create receiving interface:
   - apps/web/src/pages/ReceiveOrder.tsx
   - Show order items with expected vs received
   - Input fields for received quantities
   - Notes field for each item
   - Auto-update stock on receive

5. Add "Create PO from Low Stock" button that pre-fills items below minimum

6. Update Orders list with status badges and quick actions

Commit as "feat: add full purchase order workflow", push.
```

---

### Phase 12: User Management & Permissions
**Goal:** Re-enable auth with role-based access control

#### 12.1 Role Permissions
| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access, user management, settings |
| **MANAGER** | All operations, approve POs, view reports |
| **STAFF** | CRUD products, create movements/orders |
| **VIEWER** | Read-only access to all data |

#### 12.2 Implementation
**Commands for Claude Code:**
```
Re-enable and enhance the authentication system:

1. Update User model:
   - Add role field: ADMIN, MANAGER, STAFF, VIEWER
   - Add isActive field
   - Add lastLogin field

2. Create permission middleware:
   - apps/api/src/middleware/permissions.ts
   - checkRole(['ADMIN', 'MANAGER']) helper
   - Apply to routes based on required permissions

3. Re-enable auth middleware on all routes (currently commented out)

4. Create apps/web/src/pages/Users.tsx (Admin only):
   - List users with role badges
   - Create/edit user form
   - Activate/deactivate users
   - Reset password function

5. Update frontend to:
   - Show/hide menu items based on role
   - Disable buttons user can't use
   - Show role in header/profile dropdown

6. Create apps/web/src/pages/Profile.tsx:
   - View own profile
   - Change password
   - Update name/email

7. Seed users:
   - admin@stockmanager.com (ADMIN)
   - manager@stockmanager.com (MANAGER)  
   - staff@stockmanager.com (STAFF)
   All with password: password123

Commit as "feat: add user management and role-based permissions", push.
```

---

### Phase 13: Notifications & Alerts
**Goal:** Proactive system alerts and notifications

#### 13.1 Alert Types
| Alert | Trigger | Action |
|-------|---------|--------|
| **Low Stock** | Product below minStock | Show in dashboard, optional email |
| **Reorder Point** | Stock at 120% of minStock | Suggest creating PO |
| **Order Status** | PO status changes | In-app notification |
| **Expiring Stock** | Products near expiry (if tracked) | Warning badge |

#### 13.2 Implementation
**Commands for Claude Code:**
```
Add notification and alert system:

1. Create Notification model:
   - id, type, title, message, userId, isRead, createdAt
   - Types: LOW_STOCK, REORDER, ORDER_UPDATE, SYSTEM

2. Create notification API:
   GET /api/notifications (user's notifications)
   PUT /api/notifications/:id/read
   PUT /api/notifications/read-all
   DELETE /api/notifications/:id

3. Add background job (runs on server start and hourly):
   - Check all products for low stock
   - Create notifications for items below threshold
   - Avoid duplicate notifications (check existing unread)

4. Create NotificationBell component:
   - Shows in header
   - Badge with unread count
   - Dropdown with recent notifications
   - Click to mark read and navigate

5. Create apps/web/src/pages/Notifications.tsx:
   - Full list with filters (read/unread, type)
   - Mark all read button
   - Delete old notifications

6. Add toast notifications for real-time alerts (when creating orders, etc.)

Neobrutalism styling for bell icon and dropdown.
Commit as "feat: add notification system", push.
```

---

### Phase 14: Import/Export & Backup
**Goal:** Data portability and system backup

#### 14.1 Features
| Feature | Description |
|---------|-------------|
| **CSV Import** | Bulk import products from CSV |
| **Excel Import** | Import from .xlsx files |
| **Full Export** | Export all data as JSON backup |
| **Full Import** | Restore from JSON backup |
| **Template Downloads** | CSV templates for import |

**Commands for Claude Code:**
```
Add data import/export functionality:

1. Install: npm install xlsx multer (backend), npm install papaparse (frontend)

2. Create import API:
   POST /api/import/products (multipart form, CSV/XLSX file)
   - Parse file, validate each row
   - Return preview of changes
   POST /api/import/products/confirm (apply the import)
   - Create/update products
   - Return summary (created, updated, errors)

3. Create export API:
   GET /api/export/backup (full JSON dump)
   GET /api/export/products?format=csv|xlsx
   GET /api/export/templates/products (empty CSV with headers)

4. Create apps/web/src/pages/ImportExport.tsx:
   - File upload zone (drag & drop)
   - Preview table showing what will be imported
   - Validation errors highlighted in red
   - Confirm import button
   - Download template buttons
   - Full backup download button

5. Add import validation:
   - Required fields check
   - SKU uniqueness
   - Category/Supplier existence
   - Data type validation

Neobrutalism file upload zone. Commit as "feat: add import/export functionality", push.
```

---

### Phase 15: Settings & Customization
**Goal:** Make the system configurable

#### 15.1 Settings Categories
| Category | Settings |
|----------|----------|
| **General** | Company name, logo, timezone, currency |
| **Inventory** | Default minStock, low stock threshold %, units |
| **Orders** | Order number prefix, require approval |
| **Notifications** | Email alerts on/off, alert thresholds |
| **Display** | Items per page, date format, theme (future) |

**Commands for Claude Code:**
```
Create settings management:

1. Create Settings model (already exists, expand it):
   - key: string (unique)
   - value: string (JSON stringified for complex values)
   - category: string (general, inventory, orders, etc.)

2. Create settings API:
   GET /api/settings (all settings, grouped by category)
   PUT /api/settings (bulk update)
   GET /api/settings/:key
   PUT /api/settings/:key

3. Create apps/web/src/pages/Settings.tsx:
   - Tabbed interface by category
   - Form inputs for each setting
   - Save button per section
   - Reset to defaults option

4. Create useSettings hook:
   - Fetch settings on app load
   - Store in Zustand
   - Access anywhere: const { currency, dateFormat } = useSettings()

5. Apply settings throughout app:
   - Currency symbol in prices
   - Date formatting
   - Pagination limits
   - Company name in reports

6. Seed default settings

Commit as "feat: add settings and customization", push.
```

---

## 📋 Phase 2 Checklist

### Phase 8: Reporting & Analytics
- [ ] Print reports (inventory, low stock, movements, orders, valuation)
- [ ] Report preview modal
- [ ] Print-friendly CSS
- [ ] Sales trend chart
- [ ] Top sellers chart
- [ ] Dead stock identification
- [ ] Profit margins analysis

### Phase 9: Multi-Location
- [ ] Location model and CRUD
- [ ] Location-based inventory
- [ ] Stock transfers between locations
- [ ] Location filter in all views
- [ ] Location switcher in header

### Phase 10: Barcode & Labels
- [ ] Camera barcode scanning
- [ ] Scanner integration in forms
- [ ] Barcode generation (JsBarcode)
- [ ] Label templates
- [ ] Bulk label printing

### Phase 11: Purchase Order Workflow
- [ ] Extended PO statuses
- [ ] Approval workflow
- [ ] Receiving interface
- [ ] Partial receiving support
- [ ] Auto-suggest from low stock

### Phase 12: User Management
- [ ] Role-based permissions
- [ ] Permission middleware
- [ ] User management page (admin)
- [ ] Profile page
- [ ] Re-enable authentication

### Phase 13: Notifications
- [ ] Notification model
- [ ] Low stock alerts
- [ ] Notification bell component
- [ ] Notifications page
- [ ] Background alert generation

### Phase 14: Import/Export
- [ ] CSV product import
- [ ] Import preview & validation
- [ ] Excel support
- [ ] Full backup export
- [ ] Import templates

### Phase 15: Settings
- [ ] Settings model expansion
- [ ] Settings page with tabs
- [ ] useSettings hook
- [ ] Apply settings throughout app
- [ ] Default settings seed

---

## 🔁 Quick Resume Prompts

### Continue Phase 2 Development:
```
I'm working on stockmanagerv2 Phase 2 expansion.

Read ROADMAP_PHASE2.md for new feature requirements.
Read PROGRESS.md for current status.

Tell me: (1) What phase we're in, (2) What's completed, (3) What to work on next.

Maintain Neobrutalism design throughout. After each task: update PROGRESS.md, 
commit with conventional message, push to origin main.
```

### Specific Feature Request:
```
In stockmanagerv2, read PROGRESS.md for context, then implement:

[SPECIFIC FEATURE FROM ROADMAP_PHASE2.md]

Follow the commands provided in the roadmap for this feature.
Update PROGRESS.md, commit and push.
```

---

## 💡 Recommended Implementation Order

**Suggested sequence for maximum value:**

1. **Phase 12: User Management** - Re-enable auth, adds security
2. **Phase 8: Reporting** - High business value, completes analytics
3. **Phase 11: PO Workflow** - Improves purchasing process
4. **Phase 14: Import/Export** - Essential for real data migration
5. **Phase 13: Notifications** - Proactive inventory management
6. **Phase 10: Barcode** - Speeds up operations
7. **Phase 9: Multi-Location** - Only if needed for business
8. **Phase 15: Settings** - Polish and customization

**Estimated effort per phase:**
- Phase 8: 2-3 sessions
- Phase 9: 3-4 sessions
- Phase 10: 2 sessions
- Phase 11: 2-3 sessions
- Phase 12: 2 sessions
- Phase 13: 1-2 sessions
- Phase 14: 2 sessions
- Phase 15: 1-2 sessions

---

## 🗒️ Notes

**Tech Stack Remains:**
- React 18 + TypeScript + Vite
- Express + TypeScript
- SQLite + Prisma
- TanStack Query + Zustand
- Tailwind CSS (Neobrutalism)
- Recharts

**Design System:**
- Primary: Yellow-400 (#FACC15)
- Background: Yellow-100 (#FEF9C3)
- Borders: 4px solid black
- Shadows: 8px 8px 0px black
- No rounded corners (0 or 4px max)

**Commands to Start:**
```bash
cd stockmanagerv2
cd apps/api && npm run dev    # Terminal 1 - Port 3001
cd apps/web && npm run dev    # Terminal 2 - Port 3000
```

---

*This roadmap extends Stock Manager v2 from a basic inventory system to a full-featured warehouse management solution. Implement features based on your business priorities.*
