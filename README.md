# Stock Manager v2

A modern inventory management system built with a TypeScript monorepo architecture.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- TanStack Query for server state
- Zustand for client state
- React Router v6 for navigation
- React Hook Form + Zod for forms

### Backend
- Node.js + Express with TypeScript
- Prisma ORM with SQLite
- JWT authentication
- Zod validation

### DevOps
- npm workspace monorepo
- ESLint + Prettier
- TypeScript strict mode

## Project Structure

```
stockmanagerv2/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types & utilities
└── package.json      # Root workspace config
```

## Getting Started

### Prerequisites
- Node.js v20+ (LTS)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/brklyn498/stockmanagerv2.git
cd stockmanagerv2
```

2. Install dependencies:
```bash
npm install
cd apps/web && npm install
cd ../api && npm install
cd ../../packages/shared && npm install
cd ../..
```

3. Set up the database:
```bash
cd apps/api
npx prisma migrate dev
cd ../..
```

4. Start development servers:
```bash
# In separate terminals:
npm run dev:api    # Start API server
npm run dev:web    # Start frontend
```

This will start:
- Frontend at http://localhost:3000
- Backend API at http://localhost:3001

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |

### Access

**The application is configured in demo mode with authentication disabled.** Simply navigate to `http://localhost:3000` and you'll have immediate access to all features without needing to log in.

### Re-enabling Authentication (Optional)

If you want to enable authentication, follow these steps:

1. Uncomment `router.use(authMiddleware)` in all route files:
   - `apps/api/src/routes/productRoutes.ts`
   - `apps/api/src/routes/categoryRoutes.ts`
   - `apps/api/src/routes/supplierRoutes.ts`
   - `apps/api/src/routes/stockMovementRoutes.ts`
   - `apps/api/src/routes/orderRoutes.ts`
   - `apps/api/src/routes/dashboardRoutes.ts`

2. Restore ProtectedRoute wrapper in `apps/web/src/App.tsx`

3. Re-enable auth interceptors in `apps/web/src/services/api.ts`

4. Add login/register routes back to `apps/web/src/App.tsx`

5. Test credentials:
   ```
   Email: admin@stockmanager.com
   Password: admin123
   ```

## Development

### Available Scripts

From root:
- `npm run dev:api` - Start API server
- `npm run dev:web` - Start frontend
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier

From `apps/api`:
- `npm run dev` - Start API server with hot reload
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio

From `apps/web`:
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production

## Database

This project uses SQLite for simplicity and portability. The database file is created automatically when you run migrations. No server setup needed!

To view/edit the database:
```bash
cd apps/api
npx prisma studio
```

## Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` and configure:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
API_PORT=3001
NODE_ENV=development
```

## Progress

See [PROGRESS.md](./PROGRESS.md) for development status and task tracking.

See [STOCK_MANAGER_ROADMAP.md](./STOCK_MANAGER_ROADMAP.md) for the complete project roadmap.

## License

MIT
