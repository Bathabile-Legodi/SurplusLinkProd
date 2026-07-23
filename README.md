# SurplusLink

A web app connecting food donors with NGOs to reduce food waste. Donors can list surplus food, and NGOs can browse and claim donation batches.

## Tech Stack

- **React 19** + **TanStack Router / Start**
- **Supabase** — auth & database
- **Tailwind CSS v4** + **shadcn/ui**
- **Vite** — dev server & bundler
- **Cloudflare** — deployment target

## Getting Started

```bash
npm install
npm run dev
```

The app runs at the local address shown in the terminal.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Environment

The app connects to Supabase via the client configured in `src/lib/supabase.ts`. Add your Supabase URL and anon key there before running locally.
