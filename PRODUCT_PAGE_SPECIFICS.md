# Product Page Specifications

## 🧠 MASTER PROMPT FOR CLAUDE CODE

```
Read PRODUCT_PAGE_SPECIFICS.md for detailed product page requirements.
Read PROGRESS.md for current project status.

Implement the product page enhancements following the specifications exactly.
Maintain Neobrutalism design: 4px black borders, 8px hard shadows, yellow-400 primary, no rounded corners.

After completing each feature section:
1. Update PROGRESS.md
2. Commit with message "feat: [feature description]"
3. Push to origin main

Start by telling me current product page status and what you'll implement first.
```

---

## 📸 1. Product Photos

### 1.1 Database Changes
```prisma
// Add to Product model
model Product {
  // ... existing fields
  
  imageUrl     String?   // Main product image URL
  images       ProductImage[]
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  isPrimary Boolean  @default(false)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

### 1.2 Image Upload System
| Feature | Description |
|---------|-------------|
| **Local Storage** | Store in `apps/api/uploads/products/` folder |
| **File Types** | JPG, PNG, WebP (max 5MB) |
| **Processing** | Resize to max 800x800, create thumbnail 200x200 |
| **Multiple Images** | Support up to 5 images per product |
| **Primary Image** | First image or manually selected as primary |

### 1.3 API Endpoints
```
POST   /api/products/:id/images     - Upload image(s)
DELETE /api/products/:id/images/:imageId - Delete image
PUT    /api/products/:id/images/:imageId/primary - Set as primary
PUT    /api/products/:id/images/reorder - Reorder images
GET    /api/uploads/products/:filename - Serve image file
```

### 1.4 Frontend Components

**ImageUpload Component:**
```tsx
// apps/web/src/components/ImageUpload.tsx
- Drag & drop zone with Neobrutalism border (dashed 4px black)
- Click to browse files
- Preview thumbnails before upload
- Progress indicator during upload
- Remove button on each image
- Star icon to set primary
- Drag to reorder images
```

**ProductImage Display:**
```tsx
// apps/web/src/components/ProductImage.tsx
- Main image display (large)
- Thumbnail row below (clickable to switch)
- Lightbox on click (full size view)
- Placeholder image when no photo (gray box with camera icon)
- Neobrutalism frame: 4px black border, 4px shadow
```

### 1.5 Commands for Claude Code
```
Add product image upload functionality:

1. Install backend: npm install multer sharp (in apps/api)
2. Install frontend: npm install react-dropzone (in apps/web)

3. Update Prisma schema with ProductImage model, run migration

4. Create image upload middleware:
   - apps/api/src/middleware/upload.ts
   - Configure multer for /uploads/products/
   - Add sharp processing for resize/thumbnail

5. Create image routes:
   - apps/api/src/routes/imageRoutes.ts
   - Upload, delete, set primary, reorder endpoints

6. Create ImageUpload component with:
   - Drag & drop zone (react-dropzone)
   - Image preview grid
   - Upload progress
   - Delete and set primary buttons

7. Create ProductImage display component with lightbox

8. Update Product form to include image upload section

9. Update Products list to show thumbnail in table

Neobrutalism styling throughout. Commit as "feat: add product image upload", push.
```

---

## 📊 2. Product Metrics & Information Display

### 2.1 Key Metrics Cards
| Metric | Description | Visual |
|--------|-------------|--------|
| **Current Stock** | Quantity on hand | Large number with unit |
| **Stock Value** | quantity × costPrice | Currency formatted |
| **Retail Value** | quantity × price | Currency formatted |
| **Profit Margin** | (price - costPrice) / price × 100 | Percentage with color |
| **Stock Status** | Low / Normal / Overstocked | Badge with color |
| **Days of Stock** | Based on average daily movement | Number with trend |
| **Last Movement** | Date of last stock change | Relative time |
| **Times Sold** | Total quantity sold (from orders) | Number |

### 2.2 Product Detail Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Back Button]                              [Edit] [Delete]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    PRODUCT NAME                    [Badge]   │
│  │              │    SKU: PRD-001                               │
│  │    IMAGE     │    Category: Electronics                      │
│  │              │    Supplier: Acme Corp                        │
│  │              │    Barcode: 123456789                         │
│  └──────────────┘                                               │
│  [thumb][thumb][thumb]                                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  METRICS ROW                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Stock   │ │ Value   │ │ Retail  │ │ Margin  │ │ Status  │  │
│  │   150   │ │ $1,500  │ │ $2,250  │ │  33.3%  │ │ Normal  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TABS: [Overview] [Stock History] [Orders] [Analytics]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tab Content Area                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Tab Contents

**Overview Tab:**
- Description (full text)
- Pricing details (cost, retail, margin)
- Stock thresholds (min, max, reorder point)
- Supplier contact info
- Product notes
- Created/Updated dates

**Stock History Tab:**
- Table of all stock movements for this product
- Filters: type, date range
- Chart: stock level over time (line chart)
- Export to CSV button

**Orders Tab:**
- Table of orders containing this product
- Shows: order number, date, quantity, type (sale/purchase)
- Link to order detail

**Analytics Tab:**
- Movement frequency chart (bar chart by month)
- Average daily sales
- Best selling periods
- Stock turnover rate
- Reorder suggestions

### 2.4 Commands for Claude Code
```
Create enhanced product detail page:

1. Create apps/web/src/pages/ProductDetail.tsx with:
   - Header: back button, product name, action buttons
   - Image gallery section (main + thumbnails)
   - Metrics row with 5 stat cards
   - Tabbed interface (Overview, Stock History, Orders, Analytics)

2. Create API endpoint: GET /api/products/:id/analytics
   - Return: movement stats, order stats, turnover rate, avg daily sales

3. Create API endpoint: GET /api/products/:id/movements
   - Return: paginated movements for this product only

4. Create API endpoint: GET /api/products/:id/orders  
   - Return: orders containing this product

5. Build each tab component:
   - ProductOverview.tsx
   - ProductStockHistory.tsx (with chart)
   - ProductOrders.tsx
   - ProductAnalytics.tsx

6. Add stock level chart using Recharts (area chart)
7. Add movement frequency chart (bar chart)

8. Update Products list: clicking row goes to detail page
9. Add "View Details" button in product actions

All Neobrutalism styling. Commit as "feat: add product detail page with metrics", push.
```

---

## ✏️ 3. Product Editing

### 3.1 Edit Modes

**Inline Edit (Quick):**
- Double-click on field to edit in place
- Fields: name, price, quantity, minStock
- Save on blur or Enter
- Cancel on Escape

**Full Edit (Modal/Page):**
- Complete form with all fields
- Image management
- Validation before save
- Unsaved changes warning

### 3.2 Edit Form Fields
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| **Name** | text | 2-100 chars | Yes |
| **SKU** | text | Unique, alphanumeric | Yes |
| **Description** | textarea | Max 1000 chars | No |
| **Category** | select | Must exist | Yes |
| **Supplier** | select | Must exist | No |
| **Barcode** | text | Unique if provided | No |
| **Cost Price** | number | > 0 | Yes |
| **Retail Price** | number | >= cost price | Yes |
| **Quantity** | number | >= 0 | Yes |
| **Min Stock** | number | >= 0 | Yes |
| **Max Stock** | number | > min stock | No |
| **Unit** | select | piece/kg/liter/box/etc | Yes |
| **Is Active** | toggle | - | Yes |
| **Images** | upload | Max 5, max 5MB each | No |

### 3.3 Bulk Edit
| Feature | Description |
|---------|-------------|
| **Select Multiple** | Checkbox on each row |
| **Bulk Actions Menu** | Appears when items selected |
| **Edit Category** | Change category for all selected |
| **Edit Supplier** | Change supplier for all selected |
| **Adjust Prices** | Increase/decrease by % or fixed amount |
| **Adjust Stock** | Add/subtract from all selected |
| **Activate/Deactivate** | Toggle active status |
| **Delete** | Delete all selected (with confirmation) |

### 3.4 Commands for Claude Code
```
Enhance product editing functionality:

1. Create inline edit component:
   - apps/web/src/components/InlineEdit.tsx
   - Double-click to edit, blur/Enter to save, Escape to cancel
   - Loading state while saving
   - Error handling with toast

2. Update ProductForm.tsx:
   - Add all fields from specification
   - Add image upload section
   - Add unsaved changes detection
   - Add "Save & Add Another" button for quick entry

3. Add bulk edit functionality:
   - Checkbox column in products table
   - Selection counter in header
   - Bulk actions dropdown: Edit Category, Edit Supplier, Adjust Prices, 
     Adjust Stock, Activate, Deactivate, Delete
   - Bulk edit modal for each action type

4. Create bulk edit API endpoints:
   PUT /api/products/bulk/category
   PUT /api/products/bulk/supplier  
   PUT /api/products/bulk/prices
   PUT /api/products/bulk/stock
   PUT /api/products/bulk/status
   DELETE /api/products/bulk

5. Add keyboard shortcut: 'e' to edit selected product (single selection)

Neobrutalism modals and buttons. Commit as "feat: add inline and bulk editing", push.
```

---

## 🔍 4. Search & Filtering

### 4.1 Search Capabilities
| Search Type | Description |
|-------------|-------------|
| **Text Search** | Name, SKU, description, barcode |
| **Category Filter** | Dropdown, multi-select |
| **Supplier Filter** | Dropdown, multi-select |
| **Stock Status** | Low / Normal / Overstocked / Out of Stock |
| **Price Range** | Min/max price inputs |
| **Active Status** | Active / Inactive / All |
| **Date Added** | Date range picker |

### 4.2 Advanced Filter Panel
```
┌────────────────────────────────────────────────────┐
│  FILTERS                              [Clear All] │
├────────────────────────────────────────────────────┤
│  Search: [________________________] 🔍            │
│                                                    │
│  Category:    [Select categories...     ▼]        │
│  Supplier:    [Select suppliers...      ▼]        │
│  Stock Status: [All ▼]                            │
│                                                    │
│  Price: [$___] to [$___]                          │
│  Status: ( ) All  (•) Active  ( ) Inactive        │
│                                                    │
│  Added: [Start Date] to [End Date]                │
│                                                    │
│  [Apply Filters]                                  │
└────────────────────────────────────────────────────┘
```

### 4.3 Saved Filters
- Save current filter combination with a name
- Quick access to saved filters
- Store in localStorage or database

### 4.4 Commands for Claude Code
```
Enhance product search and filtering:

1. Create FilterPanel component:
   - apps/web/src/components/FilterPanel.tsx
   - Collapsible panel (toggle button)
   - All filter fields from specification
   - Clear all button
   - Apply filters button

2. Add multi-select dropdowns for Category and Supplier:
   - Checkbox list inside dropdown
   - "Select All" option
   - Search within dropdown
   - Badge showing count of selected

3. Update products API to support all filters:
   GET /api/products?search=&categories=id1,id2&suppliers=id1,id2
       &stockStatus=low&priceMin=10&priceMax=100&isActive=true
       &dateFrom=2024-01-01&dateTo=2024-12-31&page=1&limit=10

4. Add URL sync: filters reflect in URL query params
   - Shareable filtered URLs
   - Browser back/forward works with filters

5. Add saved filters:
   - Save button next to Apply
   - Saved filters dropdown
   - Store in localStorage

Neobrutalism filter panel. Commit as "feat: add advanced product filtering", push.
```

---

## 📋 5. Product List View Options

### 5.1 View Modes
| Mode | Description |
|------|-------------|
| **Table View** | Current default, dense data display |
| **Card View** | Grid of product cards with images |
| **Compact View** | Minimal table, more rows visible |

### 5.2 Table Columns (Configurable)
| Column | Default | Sortable |
|--------|---------|----------|
| Image | ✅ | No |
| Name | ✅ | Yes |
| SKU | ✅ | Yes |
| Category | ✅ | Yes |
| Supplier | ❌ | Yes |
| Cost Price | ❌ | Yes |
| Retail Price | ✅ | Yes |
| Quantity | ✅ | Yes |
| Stock Status | ✅ | No |
| Min Stock | ❌ | Yes |
| Last Movement | ❌ | Yes |
| Actions | ✅ | No |

### 5.3 Card View Layout
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  [IMAGE]    │ │  [IMAGE]    │ │  [IMAGE]    │
│             │ │             │ │             │
│ Product 1   │ │ Product 2   │ │ Product 3   │
│ SKU-001     │ │ SKU-002     │ │ SKU-003     │
│ $29.99      │ │ $49.99      │ │ $19.99      │
│ Stock: 150  │ │ Stock: 23   │ │ Stock: 0    │
│ [●] Normal  │ │ [●] Low     │ │ [●] Out     │
│ [Edit][Del] │ │ [Edit][Del] │ │ [Edit][Del] │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 5.4 Commands for Claude Code
```
Add product list view options:

1. Create view toggle buttons (Table | Cards | Compact) in Products page header

2. Create ProductCard component:
   - apps/web/src/components/ProductCard.tsx
   - Image, name, SKU, price, stock, status badge
   - Hover actions: Edit, Delete, View
   - Neobrutalism card style

3. Create ProductsGrid component:
   - Responsive grid: 4 cols desktop, 3 tablet, 2 mobile, 1 small
   - Uses ProductCard

4. Create column configuration:
   - Gear icon opens column selector modal
   - Checkboxes for each column
   - Drag to reorder columns
   - Save preference to localStorage

5. Update Products page:
   - View mode state (table/cards/compact)
   - Render appropriate view
   - Persist view preference

Neobrutalism toggle buttons. Commit as "feat: add product view modes", push.
```

---

## ⚡ 6. Quick Actions

### 6.1 Product Quick Actions
| Action | Shortcut | Description |
|--------|----------|-------------|
| **Quick Add Stock** | + | Open stock adjustment modal |
| **Quick Remove Stock** | - | Open stock removal modal |
| **Duplicate** | Cmd+D | Create copy with new SKU |
| **Print Label** | Cmd+L | Print barcode label |
| **View History** | H | Jump to stock history tab |
| **Create Order** | O | Start order with this product |

### 6.2 Stock Adjustment Modal
```
┌─────────────────────────────────────────┐
│  ADJUST STOCK: Product Name             │
├─────────────────────────────────────────┤
│                                         │
│  Current Stock: 150 pieces              │
│                                         │
│  Type:  (•) Add  ( ) Remove  ( ) Set    │
│                                         │
│  Quantity: [________]                   │
│                                         │
│  Reason: [Select reason...        ▼]    │
│          - Received shipment            │
│          - Inventory count              │
│          - Damaged                      │
│          - Returned                     │
│          - Other                        │
│                                         │
│  Notes: [________________________]      │
│                                         │
│  New Stock: 150 → 175 (+25)             │
│                                         │
│  [Cancel]              [Save Adjustment]│
└─────────────────────────────────────────┘
```

### 6.3 Commands for Claude Code
```
Add product quick actions:

1. Create QuickStockAdjust modal:
   - apps/web/src/components/QuickStockAdjust.tsx
   - Add/Remove/Set modes
   - Quantity input with +/- buttons
   - Reason dropdown (predefined + custom)
   - Notes field
   - Preview: current → new stock
   - Auto-create stock movement record

2. Create DuplicateProduct function:
   - Copy all fields except SKU and images
   - Generate new SKU: original-COPY or original-2
   - Open edit form with duplicated data

3. Add action buttons to product row:
   - [+] Quick add stock
   - [-] Quick remove stock
   - [...] More actions dropdown (Duplicate, Print Label, History, Order)

4. Add keyboard shortcuts on product detail page:
   - + : Quick add stock
   - - : Quick remove stock
   - d : Duplicate
   - l : Print label
   - h : Go to history tab
   - o : Create order with product

5. Create quick actions toolbar when product row is focused/selected

Neobrutalism modals. Commit as "feat: add product quick actions", push.
```

---

## 📦 7. Stock Level Visualization

### 7.1 Visual Indicators
| Status | Condition | Color | Icon |
|--------|-----------|-------|------|
| **Out of Stock** | quantity = 0 | Red-500 | ⊘ |
| **Critical** | quantity < minStock × 0.5 | Red-400 | ⚠ |
| **Low** | quantity < minStock | Orange-400 | ↓ |
| **Normal** | minStock ≤ quantity ≤ maxStock | Green-400 | ✓ |
| **Overstocked** | quantity > maxStock | Purple-400 | ↑ |

### 7.2 Stock Bar Visualization
```
Product A  [████████████░░░░░░░░]  60/100  Normal
Product B  [██░░░░░░░░░░░░░░░░░░]  10/100  Low ⚠
Product C  [░░░░░░░░░░░░░░░░░░░░]   0/100  Out ⊘
Product D  [████████████████████████] 120/100  Over ↑
```

### 7.3 Commands for Claude Code
```
Enhance stock level visualization:

1. Create StockLevelBar component:
   - apps/web/src/components/StockLevelBar.tsx
   - Visual progress bar showing current vs max
   - Color coded by status
   - Shows: current / max with percentage
   - Neobrutalism: thick border, no rounded

2. Create StockStatusBadge component:
   - apps/web/src/components/StockStatusBadge.tsx
   - Icon + text based on status
   - Color coded background
   - Neobrutalism badge style

3. Add stock bar to:
   - Product detail page (large version)
   - Product card view
   - Products table (optional column)

4. Add stock status summary to Products page header:
   - "5 low stock, 2 out of stock, 3 overstocked"
   - Clickable to filter by status

5. Add color legend/key to Products page

Commit as "feat: add stock level visualization", push.
```

---

## 📱 8. Mobile Responsiveness

### 8.1 Mobile Product List
- Single column card layout
- Swipe actions (left: delete, right: edit)
- Pull to refresh
- Floating action button for add product
- Bottom sheet for filters

### 8.2 Mobile Product Detail
- Full width image carousel
- Collapsible sections
- Sticky action buttons at bottom
- Tab bar for sections (swipeable)

### 8.3 Commands for Claude Code
```
Ensure mobile responsiveness:

1. Update Products page for mobile:
   - Force card view on mobile (< 768px)
   - Collapse filter panel by default
   - Floating "+" button for add product
   - Simplified table with fewer columns

2. Update ProductDetail for mobile:
   - Full width image with swipe carousel
   - Stack metrics in 2 columns
   - Tabs become scrollable horizontal list
   - Sticky bottom action bar

3. Update ProductForm for mobile:
   - Full screen modal/page
   - Larger touch targets
   - Keyboard-aware scrolling

4. Add touch gestures:
   - Swipe left on product card to reveal actions
   - Pull down to refresh list
   - Long press to select (bulk mode)

5. Test all breakpoints:
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

Commit as "feat: improve mobile responsiveness", push.
```

---

## 🔗 9. Related Features

### 9.1 Related Products
- Products from same category
- Products from same supplier
- "Frequently bought together" (from order history)

### 9.2 Product Variants (Future)
- Size variants (S, M, L)
- Color variants
- Shared base product, separate stock

### 9.3 Product Bundles (Future)
- Combine multiple products as one
- Auto-deduct component stock on sale

---

## ✅ Implementation Checklist

### Photo System
- [ ] ProductImage database model
- [ ] Multer upload middleware
- [ ] Sharp image processing (resize, thumbnail)
- [ ] Image CRUD API endpoints
- [ ] ImageUpload component (drag & drop)
- [ ] ProductImage display with lightbox
- [ ] Update product form with images
- [ ] Thumbnails in product list

### Metrics & Detail Page
- [ ] Product detail page route
- [ ] Header with actions
- [ ] Image gallery component
- [ ] Metrics row (5 stat cards)
- [ ] Tabbed interface
- [ ] Overview tab content
- [ ] Stock history tab with chart
- [ ] Orders tab with table
- [ ] Analytics tab with charts
- [ ] API: /products/:id/analytics
- [ ] API: /products/:id/movements
- [ ] API: /products/:id/orders

### Editing
- [ ] InlineEdit component
- [ ] Enhanced ProductForm
- [ ] Unsaved changes warning
- [ ] Bulk selection (checkboxes)
- [ ] Bulk actions dropdown
- [ ] Bulk edit modals
- [ ] Bulk API endpoints

### Search & Filtering
- [ ] FilterPanel component
- [ ] Multi-select dropdowns
- [ ] All filter parameters in API
- [ ] URL sync for filters
- [ ] Saved filters

### View Options
- [ ] View mode toggle (Table/Cards/Compact)
- [ ] ProductCard component
- [ ] ProductsGrid component
- [ ] Column configuration
- [ ] Persist preferences

### Quick Actions
- [ ] QuickStockAdjust modal
- [ ] Duplicate product function
- [ ] Action buttons in rows
- [ ] Keyboard shortcuts
- [ ] Quick actions toolbar

### Stock Visualization
- [ ] StockLevelBar component
- [ ] StockStatusBadge component
- [ ] Stock summary in header
- [ ] Color legend

### Mobile
- [ ] Mobile card layout
- [ ] Mobile detail page
- [ ] Mobile form
- [ ] Touch gestures
- [ ] Responsive breakpoints

---

## 🎨 Design Notes

**All components must follow Neobrutalism:**
- Borders: 4px solid black
- Shadows: 8px 8px 0px 0px black (cards), 4px for smaller elements
- Colors: Yellow-400 primary, Yellow-100 background, bold accent colors
- No rounded corners (border-radius: 0)
- Bold typography
- Buttons: translate + shadow reduction on hover/active

**Image Frames:**
```css
.product-image-frame {
  @apply border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)];
}
```

**Stat Cards:**
```css
.stat-card {
  @apply bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4;
}
.stat-value {
  @apply text-3xl font-black;
}
.stat-label {
  @apply text-sm font-bold uppercase tracking-wide;
}
```

---

*This specification covers all aspects of the enhanced product page. Implement section by section, testing each feature before moving to the next.*
