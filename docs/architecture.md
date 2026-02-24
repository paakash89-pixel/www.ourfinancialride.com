# Intrinsic v1 Architecture

## Monorepo

- `apps/mobile`: Expo React Native discipline app
- `apps/web`: Next.js marketing site only
- `apps/api`: NestJS API with PostgreSQL + Redis + BullMQ infra
- `packages/shared`: Pure deterministic engines (stress, discipline score, regret, streak)

## Core Behavioral Flow

1. Stress engine evaluates regional proxy drawdowns (`SPY`, `NIFTY` proxy)
2. User creates immutable PCC revisions per ticker
3. Sell Friction flow enforces:
   - PCC presence
   - required fundamentals-change reason
   - server 60s cooldown
   - break-condition check
4. Event logged as `PANIC_SELL_SIMULATED` or `HELD`
5. Regret engine computes 3m/6m/12m counterfactuals for panic events
6. Hold streak is computed from active stress periods and panic-event dates

## API Safety Controls

- `class-validator` DTO validation
- CORS allowlist via `CORS_ORIGINS`
- Structured request/event logs
- Idempotent event logging (`clientEventId`)
- Rate limiting logic on `/events`
- RevenueCat webhook verification via `RC_WEBHOOK_SECRET`

## Compliance Boundary

- Educational and behavioral coaching only
- No brokerage execution
- No personalized buy/sell recommendations
