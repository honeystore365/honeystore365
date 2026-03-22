# HoneyStore365 - Project Agent Memory

## Project Overview
E-commerce platform for honey and dates (مناحل الرحيق) built with Next.js 14, TypeScript, and Supabase.

**Live**: https://honeystore365.vercel.app
**Repository**: https://github.com/honeystore365/honeystore365

## Architecture

### Clean Code Principles
1. **Services Layer** - All business logic MUST go through `src/services/`
2. **No Direct Supabase in Components** - Components use services, not raw Supabase
3. **Barrel Exports** - Use `src/lib/index.ts` and `src/services/index.ts` for clean imports
4. **Centralized Types** - All domain types in `src/types/`

### Key Directories
```
src/
├── services/          # Business logic layer
│   ├── auth/          # Authentication services
│   ├── cart/          # Cart operations
│   ├── discounts/     # Discount management
│   ├── orders/        # Order processing
│   ├── products/      # Product catalog
│   └── store-settings/ # Store configuration
├── lib/               # Shared utilities
│   ├── auth/          # Auth utilities
│   ├── errors/        # Error handling
│   ├── logger/        # Logging
│   ├── security/      # RBAC & route guards
│   ├── supabase/      # DB clients
│   └── validation/    # Zod schemas
├── types/             # TypeScript types
├── components/        # React components
│   ├── admin/         # Admin-only components
│   ├── layout/        # Layout components
│   └── ui/            # shadcn/ui components
├── actions/           # Server actions (thin wrappers)
└── app/               # Next.js App Router
    ├── api/           # API routes (use services)
    ├── admin/         # Admin pages
    └── (auth)/        # Auth pages
```

## Common Tasks

### Adding a New Service
1. Create `src/services/{domain}/index.ts`
2. Create `src/services/{domain}/{domain}.service.ts`
3. Create `src/services/{domain}/{domain}.types.ts`
4. Export from `src/services/index.ts`

### Refactoring a Component
If a component uses direct Supabase calls:
1. Check if a service exists for that domain
2. If not, create the service first
3. Refactor component to use service methods
4. Remove direct `createClient` imports

### API Routes Pattern
```typescript
// GOOD - uses service
import { orderService } from '@/services/orders';
const result = await orderService.updateOrderStatus({...});

// BAD - direct Supabase
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);
```

## Current State (2026-03-22)
- ✅ Consolidated duplicate `honeystore-original/` → archived
- ✅ Removed duplicate `src/auth/login/` (kept `src/app/auth/login/`)
- ✅ Removed duplicate `src/components/site-header.tsx` (kept `src/components/layout/site-header.tsx`)
- ✅ Created `StoreSettingsService` for store settings management
- ✅ Refactored `store-settings-section.tsx` to use service
- ✅ Refactored API routes to use services:
  - `/api/admin/orders/update-status`
  - `/api/admin/orders/cancel`
  - `/api/admin/orders/confirm`
  - `/api/admin/orders/stats`
- ✅ Enhanced `src/lib/index.ts` barrel exports
- ✅ Added discounts and store-settings to services barrel

## Known Issues
- Some components still use direct Supabase (e.g., `CartDisplayClient.tsx`)
- Auth routes in `/api/admin/auth/` could use auth services more

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
