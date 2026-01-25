# CLAUDE.md

## Commands

```bash
npm run dev          # Next.js dev server + Convex
npx convex dev       # Convex backend only
npm run build        # Production build
```

## Architecture

**Slate** - Next.js 15 fintech dashboard for multi-currency accounts and transfers.

### Stack

- **Frontend**: Next.js (App Router), React 19, Tailwind CSS v4
- **Backend**: Convex (realtime database, HTTP actions)
- **Auth**: Clerk + Convex integration
- **Payments**: Bridge API (fiat on/off ramp, wallets, transfers)
- **UI**: shadcn/ui, @tabler/icons-react, Recharts, @tanstack/react-table

### Structure

```
app/                    # Pages: /home, /activity, /cards, /reports, /sign-in, /sign-up
components/             # React components (ui/ for shadcn)
convex/                 # Backend: schema.ts, users.ts, http.ts, auth.config.ts
middleware.ts           # Clerk route protection
scripts/                # Bridge API test scripts
```

### Auth Flow

- Clerk handles authentication (sign-in/sign-up pages)
- `ConvexProviderWithClerk` syncs auth state
- Webhook at `/clerk-webhook` syncs users to Convex
- `ctx.auth.getUserIdentity()` for auth in Convex functions

### Bridge API Integration

Convex modules for Bridge API (fiat ↔ crypto):

| Module | Purpose |
|--------|---------|
| `bridgeCustomers.ts` | KYC-approved customer management |
| `bridgeWallets.ts` | Custodial crypto wallets (Solana/Base/Ethereum) |
| `bridgeTransfers.ts` | Money movement (fiat ↔ crypto, wallet ↔ wallet) |
| `bridgeVirtualAccounts.ts` | Permanent fiat deposit addresses (USD/EUR/GBP/MXN/BRL) |
| `bridgeExternalAccounts.ts` | Linked bank accounts for withdrawals |
| `bridgeExchangeRates.ts` | Cached exchange rates for display |
| `bridgeHelpers.ts` | Fee calculations, precision, currency/rail constants |
| `liquidationAddresses.ts` | Crypto deposit addresses that auto-convert |
| `bridgeWebhooks.ts` | Webhook event processing |

**Webhook endpoint**: `/bridge-webhook` (signature verified)

**Environment variables**:
- `BRIDGE_API_KEY` - Bridge API key
- `BRIDGE_API_URL` - API base URL (default: https://api.bridge.xyz/v0)
- `BRIDGE_WEBHOOK_PUBLIC_KEY` - Webhook signature verification

### Key Patterns

- `@/*` path alias to project root
- `useIsMobile()` hook for responsive components
- Drawer opens bottom (mobile) / right (desktop)
- Sidebar always dark, collapsible
- Single USDC wallet with exchange rates for multi-currency display
