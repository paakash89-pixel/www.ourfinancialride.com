# OFR — Our Financial Ride (Web)

Production-ready Next.js App Router site focused on converting the first 10 paid families into the **12-Month Time Freedom Blueprint (₹25,000 founder cohort pricing)**.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Chart.js + react-chartjs-2
- Markdown content for letters (`/content/letters`)
- Password-gated member area using secure httpOnly cookie session

## Primary Routes
- `/` Home
- `/work-with-us` Primary sales page + apply form
- `/tools` 4 calculators
- `/blueprint` 12-month program timeline
- `/blueprint-tools/[slug]` payment-gated toolkit info pages
- `/account/login` account login
- `/account` onboarding status page
- `/create-account` account setup for gated tools
- `/letters` letters index
- `/letters/[slug]` letter detail
- `/newsletter` secondary capture
- `/member` owner-only review area
- `/member/blueprint-kit` private full-kit review page
- `/login` member login
- `/disclaimer`
- `/privacy`
- `/terms`

## Quick Start (Local)
From repo root:

```bash
pnpm install
cp .env.example .env
pnpm --filter @intrinsic/web dev
```

Open `http://localhost:3000`.

Build check:

```bash
pnpm --filter @intrinsic/web build
```

## Environment Variables
Set in `.env` (see `.env.example`):

- `NEXT_PUBLIC_SITE_URL` - public site URL (production: `https://www.ourfinancialride.com`)
- `NEXT_PUBLIC_CONTACT_EMAIL` - contact email used in application success mailto draft
- `APPLICATION_TO_EMAIL` - inbox that receives apply-form submissions (default: `ourfinancialride@gmail.com`)
- `RESEND_API_KEY` - Resend API key for server-side email delivery
- `RESEND_FROM_EMAIL` - verified sender used by Resend (example: `OFR Applications <onboarding@resend.dev>`)
- `MEMBER_PASSWORD` - owner/member login password for `/login`
- `MEMBER_SESSION_SECRET` - cookie signing secret

## Application Form Data Handling
`/work-with-us` submit behavior:

1. Validates with Zod.
2. Sends the submission by email to `APPLICATION_TO_EMAIL` through Resend (if configured).
3. Stores submission in an in-memory queue on the server (`/api/applications`) for production safety.
4. In local development (`NODE_ENV !== production`), appends to `/data/applications.json`.
5. In browser, stores a backup in localStorage.
6. Shows submission summary + copy-to-email + JSON download.

### Why this approach?
Vercel serverless does not support persistent runtime disk writes. The current flow is safe and explicit for launch.

### How to wire a real DB later
Replace `app/api/applications/route.ts` persistence section with:
- Postgres via Prisma, or
- Supabase server client, or
- another hosted database

…and keep the current success UX unchanged.

## Content Management
Letters live at:

- `/Users/paaka/Documents/New project/content/letters/*.md`

Each letter file uses frontmatter:

```md
---
title: Example
date: 2026-01-01
slug: example-slug
summary: One-line summary.
---

Body content...
```

## Update Pricing and Copy
- Home + pricing snippets: `apps/web/app/(marketing)/page.tsx`
- Sales page pricing + FAQ + apply: `apps/web/app/(marketing)/work-with-us/page.tsx`
- Shared outcomes + philosophy + timeline: `apps/web/lib/content.ts`

## Blueprint Kit Delivery Policy
- Paid client kits are delivered by email after payment confirmation.
- Owner can review and download test files on `/member/blueprint-kit`.
- API download route `/api/member/blueprint-kit/[slug]` is member-authenticated and enabled for owner testing.

## SEO
Implemented:
- Route metadata across key pages
- `app/sitemap.ts`
- `app/robots.ts`
- OG fallback image at `public/og-default.svg`

## Deploy to Vercel
1. Push repo to GitHub.
2. Import project in Vercel.
3. Set Root Directory to `apps/web`.
4. Add env vars from `.env.example`.
5. Deploy.

Recommended checks after deploy:
- `/work-with-us` form submission + success JSON download
- `/create-account` + `/account/login` + `/account` workflow
- `/login` + `/member` owner cookie gate
- `/tools` calculators + charts
- `/letters/[slug]` rendering
- `sitemap.xml` and `robots.txt`
