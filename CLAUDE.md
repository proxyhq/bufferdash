# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Start Next.js dev server at http://localhost:3000
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture

This is a Next.js 16 dashboard application using the App Router with React 19.

### Directory Structure

- `app/` - Next.js App Router pages and layouts
  - `app/dashboard/` - Main dashboard page with data table, charts, and cards
  - `app/globals.css` - Global styles and Tailwind CSS configuration
- `components/` - React components
  - `components/ui/` - shadcn/ui component library (new-york style)
  - Dashboard-specific components at the root level (sidebar, charts, data table)
- `lib/utils.ts` - `cn()` helper for merging Tailwind classes
- `hooks/` - Custom React hooks (e.g., `useIsMobile`)
- `scripts/` - Node.js utility scripts for Bridge API interactions (unrelated to the dashboard UI)

### Key Technologies

- **UI Components**: shadcn/ui with Radix primitives
- **Icons**: @tabler/icons-react and lucide-react
- **Charts**: Recharts
- **Data Tables**: @tanstack/react-table
- **Drag and Drop**: @dnd-kit
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Fonts**: Geist Sans and Geist Mono via next/font

### Path Aliases

`@/*` maps to the project root, configured in tsconfig.json.
