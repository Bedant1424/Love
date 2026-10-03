# Testing Architecture & Execution Guide

> **Status:** Milestone 1 Foundation.

---

## 1. Testing Framework Structure

The platform uses a unified multi-tiered testing strategy:

1. **Unit Tests (`tests/unit/`):** Pure TypeScript modules executed by Vitest. Fast in-memory validation.
2. **Workers Integration Tests (`tests/integration/`):** Executed using `@cloudflare/vitest-plugin`. Runs directly inside the Cloudflare Workers runtime environment with native local D1 database bindings.
3. **End-to-End Tests (`tests/e2e/`):** Browser-driven user journeys automated via Playwright against the local build or development server.

---

## 2. Test Execution Commands

```bash
# Run all unit and integration tests
npm run test

# Run unit tests only
npm run test:unit

# Run Workers runtime & D1 tests only
npm run test:integration

# Run Playwright E2E browser tests
npm run test:e2e
```

---

## 3. Writing Binding-Aware Workers Tests

Workers integration tests import bindings from `cloudflare:test`:

```typescript
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../../src/server/index';

describe('Worker Endpoint', () => {
  it('handles request using D1 binding', async () => {
    const res = await app.fetch(new Request('http://localhost/healthz'), env);
    expect(res.status).toBe(200);
  });
});
```
