# Continuous Integration & GitHub Actions Workflow

> **Status:** Milestone 1 Foundation.

---

## 1. CI Pipeline Architecture (`.github/workflows/ci.yml`)

The continuous integration pipeline runs automatically on all pull requests and pushes to `main` and `feature/*` branches.

### Execution Steps
1. **Dependency Installation:** `npm ci` ensuring strictly pinned dependencies.
2. **Strict Typecheck:** `npm run typecheck` enforcing zero implicit `any` and composite reference validation.
3. **Lint Verification:** `npm run lint` running ESLint 9 across all TypeScript files.
4. **Unit & Integration Suite:** `npm run test` executing Vitest and `@cloudflare/vitest-plugin` with in-memory D1 test databases.
5. **Production Build:** `npm run build` validating client asset compilation via Vite.

---

## 2. CI Failure Conditions

The CI workflow fails immediately and blocks merge if:
- Any TypeScript typecheck error occurs (`tsc -b`).
- Any ESLint rule triggers a warning or error.
- Any unit, integration, or D1 binding test fails.
- Vite build fails to compile or bundle assets.
