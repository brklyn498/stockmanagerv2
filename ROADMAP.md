# Stock Manager v2 - Development Roadmap

## Project Overview
A complete store stock management system built with modern web technologies. This document serves as the master guide for AI-assisted development using Claude Code.

---

## 🧠 MASTER PROMPT FOR CLAUDE CODE

**Copy and paste this prompt every time you start a new Claude Code session:**

```
Read the file ROADMAP.md in the project root to understand the full project requirements and tech stack.

Then read PROGRESS.md to see what has been completed and what to work on next.

After completing any task:
1. Update PROGRESS.md with what you finished (move task from "Current" to "Completed" with date)
2. Add the next logical task to "Current Sprint"
3. Git add, commit with conventional commit message, and push to origin main

If PROGRESS.md doesn't exist, create it using the template from ROADMAP.md.

Always check existing code structure before creating new files to maintain consistency.

Start by telling me: (1) Current project status, (2) What was last completed, (3) What you'll work on now.
```

---

## 📊 PROGRESS.md Template

**Claude Code will create and maintain this file in your repo:**

```markdown
# Stock Manager v2 - Progress Tracker

## Project Status
- **Current Phase:** [Phase 1/2/3/4/5/6/7]
- **Last Updated:** [DATE]
- **Last Session:** [Brief description of what was done]

---

## ✅ Completed Tasks

### Phase 1: Project Foundation
- [ ] Monorepo initialized with pnpm
- [ ] apps/web created (Vite + React + TypeScript)
- [ ] apps/api created (Express + TypeScript)
- [ ] packages/shared created
- [ ] TypeScript configured with paths
- [ ] ESLint + Prettier configured
- [ ] Prisma initialized with SQLite schema
- [ ] .gitignore includes *.db
- [ ] Initial commit pushed to GitHub

### Phase 2: Backend API
- [ ] Express server setup with TypeScript
- [ ] JWT auth middleware
- [ ] Auth routes (register, login, refresh, me)
- [ ] Products CRUD routes
- [ ] Categories CRUD routes
- [ ] Suppliers CRUD routes
- [ ] Stock Movements routes
- [ ] Orders routes
- [ ] Dashboard stats routes
- [ ] Error handling middleware
- [ ] Zod validation

### Phase 3: Frontend Foundation
- [ ] React Router setup with protected routes
- [ ] Layout component (sidebar + header)
- [ ] TanStack Query configured
- [ ] Axios API client
- [ ] Zustand auth store
- [ ] UI Components: Button, Input, Select
- [ ] UI Components: Table, Modal, Card, Badge
- [ ] Tailwind CSS configured

### Phase 4: Core Features
- [ ] Products list page with filters
- [ ] Products create/edit forms
- [ ] Stock level indicators
- [ ] Stock Movements page
- [ ] Movement history view
- [ ] Orders list page
- [ ] Order creation workflow
- [ ] Order status updates
- [ ] Auto stock update on order complete

### Phase 5: Dashboard
- [ ] Stats cards
- [ ] Low stock alerts
- [ ] Stock value chart
- [ ] Category distribution chart
- [ ] Recent movements table
- [ ] Quick action buttons

### Phase 6: Advanced Features
- [ ] Global search (Cmd+K)
- [ ] CSV export
- [ ] Keyboard shortcuts
- [ ] Print reports
- [ ] Barcode scanning
- [ ] Batch operations
- [ ] User management

### Phase 7: Testing & Docs
- [ ] API unit tests
- [ ] Component tests
- [ ] Swagger documentation
- [ ] README complete

---

## 🔄 Current Sprint

**Working on:** [TASK NAME]

**Tasks this session:**
1. [Current task]
2. [Next task]
3. [Next task]

---

## 📝 Session Log

### [DATE]
- Started: [task]
- Completed: [task]
- Blocked: [any issues]
- Next: [what to do next]

### [PREVIOUS DATE]
- ...

---

## ⚠️ Known Issues / Blockers
- [List any issues that need attention]

---

## 🗒️ Notes for Next Session
- [Important context that shouldn't be lost]
- [Any decisions made]
- [Any deviations from the roadmap]
```

---

## 🔧 Initial Setup Requirements

### GitHub Repository
- **Repository URL:** https://github.com/brklyn498/stockmanagerv2
- **First command to run:** `git clone https://github.com/brklyn498/stockmanagerv2.git`
- **All code must be committed and pushed to this repo**

### Development Environment
- Node.js v20+ (LTS)
- npm or pnpm (recommended: pnpm for speed)
- Git configured with your GitHub credentials
- VS Code or terminal for Claude Code

---

## 📚 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **React Router v6** | Navigation |
| **TanStack Query** | Server state management |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form handling & validation |
| **Recharts** | Dashboard charts |

### 🎨 Design System: Neobrutalism

**All UI must follow Neobrutalism design principles:**

| Element | Style Rules |
|---------|-------------|
| **Borders** | Thick black borders (2-4px), no border-radius or minimal (4px max) |
| **Shadows** | Hard offset shadows (4-8px), black color, no blur |
| **Colors** | Bold, saturated colors - bright yellows, pinks, blues, greens |
| **Backgrounds** | Solid colors, no gradients |
| **Typography** | Bold, chunky fonts. Use Inter, Space Grotesk, or similar |
| **Buttons** | Thick borders, hard shadows, slight translate on hover/active |
| **Cards** | White/colored background, thick black border, hard shadow offset |
| **Inputs** | Thick borders, no rounded corners, visible focus states |
| **Layout** | Generous whitespace, clear visual hierarchy |

**Tailwind Classes to Use:**
```css
/* Card */
.neo-card {
  @apply bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)];
}

/* Button Primary */
.neo-btn {
  @apply bg-yellow-400 border-4 border-black font-bold px-6 py-3 
         shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
         hover:translate-x-1 hover:translate-y-1 
         hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
         active:translate-x-2 active:translate-y-2 
         active:shadow-none transition-all;
}

/* Input */
.neo-input {
  @apply border-4 border-black px-4 py-3 font-medium 
         focus:outline-none focus:ring-4 focus:ring-yellow-400;
}

/* Badge */
.neo-badge {
  @apply px-3 py-1 border-2 border-black font-bold text-sm;
}
```

**Color Palette:**
- Primary: `#FACC15` (Yellow 400)
- Secondary: `#A855F7` (Purple 500)
- Accent 1: `#22D3EE` (Cyan 400)
- Accent 2: `#FB7185` (Rose 400)
- Success: `#4ADE80` (Green 400)
- Warning: `#FB923C` (Orange 400)
- Danger: `#F87171` (Red 400)
- Background: `#FEF9C3` (Yellow 100) or `#FFFFFF`
- Text: `#000000`
- Borders: `#000000`

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | API server |
| **TypeScript** | Type safety |
| **Prisma** | ORM & database toolkit |
| **SQLite** | Database (no admin rights needed, file-based) |
| **JWT** | Authentication |
| **Zod** | API validation |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD |
| **ESLint + Prettier** | Code quality |
| **Vitest** | Testing |

> **Note:** SQLite is perfect for development and small-to-medium deployments. No installation required - it's just a file. If you ever need to scale, Prisma makes it easy to switch to PostgreSQL later.

---

## 📁 Project Structure

```
stockmanagerv2/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── types/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── dev.db          # SQLite database file (auto-created)
│       └── package.json
├── packages/
│   └── shared/                 # Shared types & utilities
│       ├── src/
│       └── package.json
├── package.json                # Root workspace
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
└── README.md
```

---

## 🗄️ Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("STAFF")  // ADMIN, MANAGER, STAFF
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  stockMovements StockMovement[]
  orders         Order[]
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  products    Product[]
}

model Supplier {
  id        String   @id @default(cuid())
  name      String
  email     String?
  phone     String?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  products  Product[]
  orders    Order[]
}

model Product {
  id            String   @id @default(cuid())
  sku           String   @unique
  name          String
  description   String?
  barcode       String?  @unique
  price         Float
  costPrice     Float
  quantity      Int      @default(0)
  minStock      Int      @default(10)
  maxStock      Int?
  unit          String   @default("piece")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  
  supplierId    String?
  supplier      Supplier? @relation(fields: [supplierId], references: [id])
  
  stockMovements StockMovement[]
  orderItems     OrderItem[]
}

model StockMovement {
  id          String   @id @default(cuid())
  type        String   // IN, OUT, ADJUSTMENT, RETURN, DAMAGED
  quantity    Int
  reason      String?
  reference   String?
  createdAt   DateTime @default(now())
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
}

model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique
  type        String   // PURCHASE, SALE
  status      String   @default("PENDING")  // PENDING, APPROVED, PROCESSING, COMPLETED, CANCELLED
  totalAmount Float
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  supplierId  String?
  supplier    Supplier? @relation(fields: [supplierId], references: [id])
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  items       OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  unitPrice Float
  
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId String
  product   Product @relation(fields: [productId], references: [id])
}

model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String
}
```

> **SQLite Notes:** 
> - Enums are replaced with String fields (SQLite doesn't support enums)
> - Decimal is replaced with Float (SQLite limitation)
> - The database is just a file - no server needed!
> - Add `*.db` to .gitignore to avoid committing the database

---

## 🚀 Development Phases

### Phase 1: Project Foundation
**Goal:** Set up the monorepo, configure tools, connect to GitHub

**Tasks:**
1. Initialize pnpm workspace monorepo
2. Set up TypeScript configuration
3. Configure ESLint + Prettier
4. Initialize Prisma with SQLite schema
5. Set up GitHub Actions CI pipeline
6. Create initial README with setup instructions

**Commands for Claude Code:**
```
Initialize a pnpm monorepo at the root. Create apps/web (Vite + React + TypeScript), 
apps/api (Express + TypeScript), and packages/shared. Configure TypeScript paths 
for imports between packages. Set up Prisma in apps/api with SQLite as the database 
provider using the schema provided. Add "*.db" to .gitignore. After every significant 
change, commit to git with a descriptive message and push to origin main.
```

---

### Phase 2: Backend API Core
**Goal:** Build the Express API with authentication and core CRUD

**API Endpoints:**
```
Auth:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

Products:
GET    /api/products           (list with pagination, search, filters)
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/low-stock

Categories:
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

Suppliers:
GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

Stock Movements:
GET    /api/stock-movements    (with filters by product, type, date range)
POST   /api/stock-movements

Orders:
GET    /api/orders             (with filters)
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status
DELETE /api/orders/:id

Dashboard:
GET    /api/dashboard/stats
GET    /api/dashboard/low-stock
GET    /api/dashboard/recent-movements
```

**Commands for Claude Code:**
```
In apps/api, create the Express server with TypeScript. Implement JWT authentication 
middleware. Create all controllers, routes, and services for the endpoints listed. 
Use Zod for request validation. Implement proper error handling middleware. 
Add pagination utility for list endpoints. Commit and push after completing 
each major feature (auth, products, categories, etc.).
```

---

### Phase 3: Frontend Foundation
**Goal:** Set up React app with routing and state management

**Pages to create:**
- Login / Register
- Dashboard (home)
- Products (list, create, edit)
- Categories (list, create, edit)
- Suppliers (list, create, edit)
- Stock Movements (list, create)
- Orders (list, create, view)
- Settings

**Commands for Claude Code:**
```
In apps/web, set up React Router with protected routes. Create a layout component 
with sidebar navigation and header - use Neobrutalism style (thick black borders, 
hard shadows, bold colors). Set up TanStack Query for API calls with a base API 
client using axios. Create Zustand store for auth state. 

Build reusable UI components following Neobrutalism design from ROADMAP.md:
- Button (thick border, hard shadow, translate on hover)
- Input (thick border, no rounded corners)
- Select (same style as input)
- Table (thick borders, alternating bold colors)
- Modal (hard shadow, thick border)
- Card (white bg, black border, offset shadow)
- Badge (thick border, bold colors for status)

Use the color palette and Tailwind classes defined in the Design System section.
Commit and push after completing each page.
```

---

### Phase 4: Core Features Implementation
**Goal:** Build all CRUD interfaces and business logic

**Feature Details:**

#### Products Management
- List with search, category filter, stock status filter
- Create/Edit form with validation
- Stock level indicators (low, normal, overstocked)
- Quick stock adjustment from product view
- Barcode field with scanner support preparation

#### Stock Movements
- Record stock in/out with reason
- View movement history by product
- Bulk stock adjustment
- Movement audit trail

#### Orders
- Purchase orders to suppliers
- Sales orders (stock out)
- Order status workflow
- Auto-update stock on order completion

**Commands for Claude Code:**
```
Implement the Products page with full CRUD. Add TanStack Query hooks for all 
product API calls. Create a DataTable component with sorting, filtering, and 
pagination. Build the product form with React Hook Form and Zod validation. 
Add stock level badges using Neobrutalism style:
- Low stock: red background (#F87171), thick black border
- Near-low: orange background (#FB923C), thick black border  
- Normal: green background (#4ADE80), thick black border
Commit and push.

Then implement Stock Movements page with movement recording and history view.
Then implement Orders page with creation workflow and status updates.
```

---

### Phase 5: Dashboard & Analytics
**Goal:** Build informative dashboard with key metrics

**Dashboard Components:**
- Total products count
- Low stock alerts count
- Today's movements summary
- Pending orders count
- Stock value chart
- Recent movements table
- Top products by movement
- Category distribution chart

**Commands for Claude Code:**
```
Build the Dashboard page with stat cards using Neobrutalism style (thick borders, 
hard shadows, bold colors for each stat category). Use the dashboard API endpoints.

Add Recharts with Neobrutalism styling:
- Stock value over time (line chart) - thick lines, bold colors
- Category distribution (pie chart) - use the bold color palette
- Movement types breakdown (bar chart) - thick borders on bars

Create an alerts section for low stock products using danger-colored neo cards.
Add quick action buttons using the neo-btn style. Commit and push.
```

---

### Phase 6: Advanced Features
**Goal:** Add power-user features and polish

**Features:**
- Global search across products, orders, suppliers
- Keyboard shortcuts for navigation
- Export to CSV/Excel
- Print stock reports
- Barcode scanning (camera-based)
- Batch operations (bulk edit, bulk delete)
- Activity log
- User management (admin only)

**Commands for Claude Code:**
```
Add a global search modal (Cmd+K) with Neobrutalism styling - thick black border,
hard shadow, bold input field. Search results should use neo-card style. 
Implement CSV export for products and stock movements using a utility function.
Add keyboard shortcuts using a custom hook. Create a print-friendly stock 
report page. Commit and push.
```

---

### Phase 7: Testing & Documentation
**Goal:** Ensure reliability and maintainability

**Tasks:**
- Unit tests for API services
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical flows
- API documentation (OpenAPI/Swagger)
- README with full setup guide
- Environment variables documentation

**Commands for Claude Code:**
```
Add Vitest to both apps/api and apps/web. Write unit tests for all service 
functions in the API. Write component tests for form components and DataTable. 
Add Swagger documentation to the API using swagger-jsdoc. Update README with 
complete setup instructions. Commit and push.
```

---

## 📋 Environment Variables

```env
# .env.example

# Database (SQLite - just a file path, no server needed!)
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

> **SQLite Advantage:** No database server to install or configure. The database is created automatically when you run migrations!

---

## 🎯 Git Workflow Instructions for Claude Code

**IMPORTANT:** Include these instructions in every prompt to Claude Code:

```
After completing each task:
1. Stage all changes: git add .
2. Commit with descriptive message: git commit -m "feat: description"
3. Push to remote: git push origin main

Use conventional commit prefixes:
- feat: new feature
- fix: bug fix
- refactor: code restructuring
- docs: documentation
- style: formatting
- test: adding tests
- chore: maintenance
```

---

## 🚦 Getting Started Commands

Run these commands to start a new development session:

```bash
# Clone the repo (first time only)
git clone https://github.com/brklyn498/stockmanagerv2.git
cd stockmanagerv2

# Install dependencies
pnpm install

# Run migrations (this creates the SQLite database automatically)
cd apps/api && pnpm prisma migrate dev

# Go back to root and start development servers
cd ../..
pnpm dev
```

> **No Docker needed!** SQLite creates the database file automatically when you run migrations.

---

## 📝 Sample Prompts for Claude Code

### Initial Setup Prompt:
```
Clone https://github.com/brklyn498/stockmanagerv2.git and set up a pnpm monorepo 
with apps/web (Vite React TypeScript), apps/api (Express TypeScript), and 
packages/shared. Set up Prisma in apps/api with SQLite as the database provider 
using the schema I'll provide. Add "*.db" to .gitignore. Configure TypeScript paths, 
ESLint, Prettier. Commit everything with message "chore: initial project setup" 
and push to origin main.
```

### Feature Development Prompt Template:
```
In the stockmanagerv2 project, implement [FEATURE]. 
Requirements: [LIST REQUIREMENTS]
When done, commit with message "[TYPE]: [DESCRIPTION]" and push to origin main.
```

---

## ✅ Completion Checklist

- [ ] Phase 1: Project foundation & GitHub setup
- [ ] Phase 2: Backend API with auth
- [ ] Phase 3: Frontend foundation
- [ ] Phase 4: Core CRUD features
- [ ] Phase 5: Dashboard & analytics
- [ ] Phase 6: Advanced features
- [ ] Phase 7: Testing & documentation
- [ ] Production deployment setup

---

## 🔁 Quick Resume Prompts

**Use these when starting a new Claude Code session:**

### First Time Setup (Project doesn't exist yet):
```
Clone https://github.com/brklyn498/stockmanagerv2.git

Read ROADMAP.md for full project specs.

Create PROGRESS.md using the template in ROADMAP.md.

Start Phase 1: Initialize pnpm monorepo with apps/web (Vite React TypeScript), 
apps/api (Express TypeScript), packages/shared. Set up Prisma with SQLite using 
the schema in ROADMAP.md. Configure TypeScript, ESLint, Prettier. Add *.db to .gitignore.

Update PROGRESS.md, commit as "chore: initial project setup", push to origin main.
```

### Resuming Work (Project already exists):
```
I'm working on the stockmanagerv2 project.

Read ROADMAP.md to understand the full requirements.
Read PROGRESS.md to see current status and what to work on next.

Tell me: (1) what phase we're in, (2) what was last completed, (3) what you'll work on now.

After any task: update PROGRESS.md, commit with conventional message, push to origin main.
```

### Quick Task (You know exactly what you want):
```
In stockmanagerv2 project, read PROGRESS.md for context, then:

[YOUR SPECIFIC TASK HERE]

Update PROGRESS.md with what you completed, commit and push.
```

### Fix/Debug Session:
```
In stockmanagerv2, read PROGRESS.md. 

There's an issue with [DESCRIBE PROBLEM].

Fix it, update PROGRESS.md (add to Known Issues if not fully resolved), commit and push.
```

### End of Session (Important!):
```
Before we end, update PROGRESS.md with:
- What we completed today
- What we were working on
- Any issues encountered  
- What to do next session
- Any important decisions or context

Commit as "docs: update progress tracker" and push.
```

---

## 💡 Tips for Best Results with Claude Code

1. **Always start by reading both files** - The master prompt ensures Claude Code checks ROADMAP.md and PROGRESS.md first

2. **Keep sessions focused** - Work on 2-3 related tasks per session rather than jumping around

3. **End sessions properly** - Always run the "End of Session" prompt to save context

4. **Be specific when resuming** - If you remember what you were doing, mention it in your prompt

5. **Let Claude Code verify** - When resuming, let it tell you the status before giving new instructions

6. **Commit frequently** - Small, frequent commits make it easier to track progress and rollback

7. **Trust the PROGRESS.md** - It's your memory between sessions, keep it accurate

---

*This roadmap is designed to be fed to Claude Code for AI-assisted development. Each phase builds on the previous one. Follow the order for best results.*
