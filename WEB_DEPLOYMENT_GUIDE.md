# Intrinsic Web Deployment Guide

## 1) Prerequisites

- Node.js 20+
- pnpm 9+
- API deployed and reachable

## 2) Environment Variables

Web requires:
- `NEXT_PUBLIC_API_URL`

API requires (separate deploy):
- `DATABASE_URL`
- `REDIS_URL`
- `RC_WEBHOOK_SECRET`
- `CORS_ORIGINS`

## 3) Build and Verify

```bash
pnpm i
pnpm --filter @intrinsic/shared build
pnpm --filter @intrinsic/api prisma:generate
pnpm --filter @intrinsic/web typecheck
pnpm --filter @intrinsic/web build
pnpm test
```

## 4) Deploy API First

1. Deploy `/apps/api`.
2. Apply Prisma migrations.
3. Verify:
   - `GET /market/stress?region=US`
   - `GET /me/discipline`
   - `GET /me/regret`

## 5) Deploy Web (Marketing Only)

1. Deploy `/apps/web`.
2. Set `NEXT_PUBLIC_API_URL` to the deployed API origin.
3. Validate routes:
   - `/`
   - `/how-it-works`
   - `/pricing`
   - `/methodology`
   - `/privacy`
   - `/terms`
   - `/faq`
   - `/blog`

## 6) Post-Deploy Checks

- Confirm homepage message: "Intrinsic prevents panic selling during crashes."
- Confirm marketing routes render.

## 7) Rollback

- Keep previous API/web images available.
- Roll back API and web together when contracts change.
