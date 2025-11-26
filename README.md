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
- pnpm workspace monorepo
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
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/brklyn498/stockmanagerv2.git
cd stockmanagerv2
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up the database:
```bash
cd apps/api
cp .env.example .env
pnpm db:migrate
cd ../..
```

4. Start development servers:
```bash
pnpm dev
```

This will start:
- Frontend at http://localhost:3000
- Backend API at http://localhost:3001

## Development

### Available Scripts

From root:
- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

From `apps/api`:
- `pnpm dev` - Start API server with hot reload
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

From `apps/web`:
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production

## Database

This project uses SQLite for simplicity and portability. The database file is created automatically when you run migrations. No server setup needed!

To view/edit the database:
```bash
cd apps/api
pnpm db:studio
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
