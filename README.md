# SurplusLink

SurplusLink is a React + TanStack Start web app for donor and NGO food donation workflows.

## Prerequisites

Install the following tools before running the app:

- **Node.js** 18.x or newer
- **npm** (included with Node.js)
- **Git**
- A modern **web browser**

Optional:
- **Bun** (the repository includes a `bun.lockb` file, but the app runs fine with npm)

## Project dependencies

### Production dependencies
- `@cloudflare/vite-plugin`
- `@hookform/resolvers`
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-label`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`
- `@supabase/supabase-js`
- `@tailwindcss/vite`
- `@tanstack/react-query`
- `@tanstack/react-router`
- `@tanstack/react-start`
- `@tanstack/router-plugin`
- `class-variance-authority`
- `clsx`
- `cmdk`
- `date-fns`
- `embla-carousel-react`
- `input-otp`
- `lucide-react`
- `react`
- `react-day-picker`
- `react-dom`
- `react-hook-form`
- `react-resizable-panels`
- `recharts`
- `sonner`
- `tailwind-merge`
- `tailwindcss`
- `tw-animate-css`
- `vaul`
- `vite-tsconfig-paths`
- `zod`

### Development dependencies
- `@eslint/js`
- `@lovable.dev/vite-tanstack-config`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `eslint`
- `eslint-config-prettier`
- `eslint-plugin-prettier`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `prettier`
- `typescript`
- `typescript-eslint`
- `vite`

## Installation

```bash
npm install
```

If you prefer Bun:

```bash
bun install
```

## Run locally

Start the development server:

```bash
npm run dev
```

The app will be available in your browser at the local Vite address shown in the terminal.

## Build for production

```bash
npm run build
```

## Build for development mode

```bash
npm run build:dev
```

## Preview the production build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Format code

```bash
npm run format
```

## Notes

- The project uses **Vite** and **TanStack Start**.
- The app includes **Cloudflare** build support via `wrangler.jsonc` and `@cloudflare/vite-plugin`.
- The app connects to **Supabase** using the key configured in `src/lib/supabase.ts`.
- No extra environment variables are required for local development unless you plan to change the Supabase integration.
