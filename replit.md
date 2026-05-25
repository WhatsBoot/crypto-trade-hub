# NexaDEX

A decentralized crypto exchange (DEX) platform where users can trade, swap, and manage crypto assets (USD-only, no fiat). Admins control balances, withdrawal thresholds, wallet addresses, and custom messages.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dex-exchange run dev` — run the frontend (port 24350)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + TanStack Query + Wouter

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/dex-exchange/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- JWT tokens stored in localStorage, sent as `Authorization: Bearer` header
- pgcrypto extension used for password hashing via SQL seeding; bcryptjs used at runtime
- Market prices are static with small random variation (no live price feed)
- Withdrawal threshold: user must hold X% of withdrawal USD value in USDT — configurable by admin
- Admin settings row (single row in `admin_settings` table) controls: threshold %, withdrawal message template ({required} and {current} placeholders), wallet address, and network

## Product

- **Dashboard**: Portfolio overview, total USD value, market mini-cards, recent activity
- **Markets**: Live market prices for 14 coins with 24h change indicators
- **Trade**: Buy/sell interface — market orders executed instantly against live prices
- **Swap**: Uniswap-style token swap with real-time quote preview (0.3% fee)
- **Wallet**: Balance overview, deposit address display, withdrawal form with eligibility check
- **Transactions**: Full history of deposits, withdrawals, trades, and swaps
- **Admin panel**: User management (add/set/subtract balances), withdrawal approvals, settings editor

## Test accounts

- Admin: `admin@nexadex.com` / `admin123`
- Trader: `trader@nexadex.com` / `user123`

## User preferences

- Portuguese-speaking user
- USD/crypto only — no Brazilian Reais or fiat currencies
- Admin controls: withdrawal percentage threshold, wallet address, network, and personalized message
- DEX style — decentralized exchange aesthetic

## Gotchas

- After any DB schema change, run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen`
- The `admin_settings` table uses a single row (id=1) — always upsert, never insert multiple rows
- Withdrawal message template uses `{required}` and `{current}` placeholders
- Market prices have a small random variation per request to simulate live data

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
