# DayClarity

DayClarity is a small React, TypeScript, Convex, and Electron app for sorting
daily work by ownership and closing the day with a clear summary.

The MVP includes:

- Today dashboard grouped into My Real Commitments, Real Fires, Borrowed Fires,
  and Noise / Needs Clarity.
- Add/edit/archive/move/done flows for work items.
- Daily Close flow with finished work, still-open work, needs-prioritization
  suggestions, one first step for tomorrow, and copyable Markdown.
- Simple history view for previous daily closes.
- Local fallback storage for immediate development, plus Convex backend
  functions for hosted data once configured.
- Electron entry point for desktop packaging.

## Run Locally

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Convex Setup

The app works immediately with `localStorage`. To use Convex for stored data:

```sh
npm run convex:dev
```

Convex will create the deployment settings and generated files. Then copy the
Convex URL into `.env.local`:

```sh
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Without `VITE_CONVEX_URL`, the UI stays local-first and persists in browser
storage only.

## Desktop

Run the Electron shell during development:

```sh
npm run dev:electron
```

Build a packaged desktop app:

```sh
npm run build:electron
```

## Checks

```sh
npm run lint
npm run build
```
