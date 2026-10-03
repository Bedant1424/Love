# Local Development & Tooling Runbook

> **Status:** Milestone 1 Foundation.

---

## 1. Initial Setup

1. **Clone & Install Dependencies:**
   ```bash
   git clone <REPO_URL>
   cd "Dynamic QR code Generator"
   npm install
   ```

2. **Setup Local Environment Configuration:**
   ```bash
   cp .env.example .env.local
   ```

---

## 2. Running Local Development

### Option A: Frontend Development with Vite (Rapid HMR)
```bash
npm run dev
# Launches Vite dev server at http://localhost:5173
```

### Option B: Worker Runtime with Local Cloudflare Bindings
```bash
npm run dev:worker
# Launches Wrangler local emulator at http://localhost:8787
```

---

## 3. Local Cloudflare D1 Management

Cloudflare Wrangler provides a local SQLite database engine simulating D1 in `.wrangler/state/v3/d1`.

### Apply Migrations Locally:
```bash
npm run d1:migrate:local
# Applies migrations from /migrations to the local test database
```

### Direct SQLite Shell Inspection:
```bash
npx wrangler d1 execute qroute_local --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Seed Local Test Fleet:
```bash
npx wrangler d1 execute qroute_local --local --file=seed-local.sql
```

---

## 4. Testing Redirects Locally

With `npm run dev:worker` active on port 8787:

```bash
# ACTIVE card redirect (HTTP 302 to Google Review URL)
curl -i http://localhost:8787/c/ACTV123456

# UNACTIVATED card redirect (HTTP 302 to /activate/PEND123456)
curl -i http://localhost:8787/c/PEND123456

# DISABLED card maintenance notice (HTTP 200)
curl -i http://localhost:8787/c/DACT123456

# RETIRED card notice (HTTP 200)
curl -i http://localhost:8787/c/RETR123456

# Non-existent card notice (HTTP 404)
curl -i http://localhost:8787/c/DOESNOTEXIST
```
