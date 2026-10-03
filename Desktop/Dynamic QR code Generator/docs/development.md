# Development Guide & Platform Conventions

> **Status:** Milestone 1 Foundation.

---

## 1. Architectural Boundaries

The codebase enforces strict isolation between client, server, and shared layers:

- `src/client/`: React components, application shell, and DOM interactions. Must **NEVER** import server secrets or Worker bindings.
- `src/server/`: Cloudflare Worker request routing (Hono) and edge business logic. Interfaces directly with D1 database bindings.
- `src/shared/`: Shared TypeScript types, validation logic, and utility functions safely consumable by both client and server.
- `src/components/ui/`: Accessible, reusable UI primitives adhering to the Swiss design tokens.
- `src/styles/`: Tailwind CSS v4 styling and token variables.

---

## 2. Environment Variables & Secret Handling

- Public client environment variables are prefixed with `VITE_` (e.g. `VITE_TURNSTILE_SITE_KEY`).
- Server secrets (`ACTIVATION_SECRET`, `TURNSTILE_SECRET_KEY`) reside exclusively in Worker bindings and are never bundled into client JS.
- Local overrides use `.env.local` (ignored by Git).
- See [`.env.example`](../.env.example) for placeholder definitions.

---

## 3. Git Workflow & Conventional Commits

- Work exclusively on feature branches (e.g. `feature/qr-platform-foundation`).
- Never push directly to `main`.
- Conventional commit message format:
  - `feat(...)`: New feature or endpoint.
  - `fix(...)`: Bug fix.
  - `chore(...)`: Tooling, dependencies, or configuration.
  - `docs(...)`: Documentation updates.
  - `test(...)`: Adding or updating test suites.
