# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Next.js dev server at http://localhost:3000
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture

This is a Next.js 16 dashboard application ("Slate") using the App Router with React 19. Slate is a fintech app for multi-currency accounts and transfers.

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - Routes: `/home`, `/activity`, `/cards`, `/reports`
  - `app/globals.css` - Global styles with Tailwind CSS v4 theme configuration using CSS variables (oklch colors)
- `components/` - React components
  - `components/ui/` - shadcn/ui component library (new-york style)
  - Dashboard-specific components at root: sidebar navigation, data tables, interactive charts, wallet cards, virtual cards
- `lib/utils.ts` - `cn()` helper for merging Tailwind classes
- `hooks/use-mobile.ts` - Mobile detection hook

### Key Technologies

- **UI Components**: shadcn/ui with Radix primitives
- **Icons**: @tabler/icons-react (primary), lucide-react
- **Charts**: Recharts wrapped with shadcn chart components
- **Data Tables**: @tanstack/react-table with pagination, sorting, filtering, and row selection
- **Drag and Drop**: @dnd-kit for sortable table rows
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Validation**: Zod for schema validation
- **Notifications**: Sonner for toast notifications
- **Font**: Open Runde via next/font (local)

### Path Aliases

`@/*` maps to the project root.

### Component Patterns

- Data tables use Zod schemas to define row types and @tanstack/react-table for features
- Drawer component (vaul) opens from bottom on mobile, right on desktop (using `useIsMobile` hook)
- Sidebar is always dark (even in light mode) using custom CSS variables, collapsible via `SidebarProvider`
- Virtual cards use theme variants (dark with mesh gradient for physical, silver with pattern for virtual)
- Fund modal supports multiple currencies (USD, GBP, EUR) with bank logos and mobile money options
- Verification banner with dark gradient background and purple glow effects
- Welcome header with time-based greeting
- Recent activity table on home page using TanStack Table
