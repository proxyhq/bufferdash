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
- **UI**: shadcn/ui, @tabler/icons-react, Recharts, @tanstack/react-table

### Structure

```
app/                    # Pages: /home, /activity, /cards, /reports, /sign-in, /sign-up
components/             # React components (ui/ for shadcn)
convex/                 # Backend: schema.ts, users.ts, http.ts, auth.config.ts
middleware.ts           # Clerk route protection
```

### Auth Flow

- Clerk handles authentication (sign-in/sign-up pages)
- `ConvexProviderWithClerk` syncs auth state
- Webhook at `/clerk-webhook` syncs users to Convex
- `ctx.auth.getUserIdentity()` for auth in Convex functions

### Key Patterns

- `@/*` path alias to project root
- `useIsMobile()` hook for responsive components
- Drawer opens bottom (mobile) / right (desktop)
- Sidebar always dark, collapsible
