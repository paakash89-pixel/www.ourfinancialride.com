# OFR Platform Blueprint

## 1) Full Sitemap

Public marketing and education routes:
- `/` - Homepage with value proposition, founder story, newsletter CTA, calculators preview, free/paid course CTAs.
- `/tools` - Calculator suite (free + premium gated tools).
- `/learn` - Learn index page.
- `/learn/[slug]` - Article detail pages.
- `/courses` - Free + paid course overview and paid access flow.
- `/courses/success` - Stripe success landing and local premium activation.
- `/newsletter` - Signup and issue archive.
- `/faq` - Frequently asked questions.
- `/methodology` - OFR principles and rule set.
- `/privacy` - Privacy summary.
- `/terms` - Terms summary.
- `/login` - Firebase email/password sign-in and account creation.

Technical SEO routes:
- `/sitemap.xml` (generated from `app/sitemap.ts`)
- `/robots.txt` (generated from `app/robots.ts`)

Legacy route behavior:
- `/pricing` -> redirects to `/courses`
- `/blog` -> redirects to `/newsletter`
- `/how-it-works` -> redirects to `/learn`

## 2) UI Component Structure

Global shell:
- `app/layout.tsx`
- `components/site-header.tsx`
- `components/auth-provider.tsx`
- `components/auth-controls.tsx`

Homepage:
- `app/(marketing)/page.tsx`
- `components/newsletter-signup.tsx`

Tools:
- `app/(marketing)/tools/page.tsx`
- `components/tools-suite.tsx`
- `lib/finance.ts`

Learn:
- `app/(marketing)/learn/page.tsx`
- `app/(marketing)/learn/[slug]/page.tsx`
- `lib/learn-content.ts`

Courses:
- `app/(marketing)/courses/page.tsx`
- `app/(marketing)/courses/success/page.tsx`
- `components/courses-overview.tsx`
- `components/billing/checkout-button.tsx`

Newsletter:
- `app/(marketing)/newsletter/page.tsx`
- `lib/newsletter-content.ts`

Auth + Billing:
- `lib/firebase.ts`
- `app/api/checkout/route.ts`
- `app/api/billing/portal/route.ts`

Styling:
- `app/globals.css` (includes OFR theme layer)

## 3) Database/Auth/Payment Flow

Auth (Firebase):
1. User signs up/signs in on `/login`.
2. Client auth state is tracked in `AuthProvider` via `onAuthStateChanged`.
3. `AuthProvider` checks premium access from either:
   - Firebase custom claim: `ofrPremium=true` (production path)
   - Local premium flag (checkout success fallback for demo)

Payments (Stripe):
1. User clicks checkout in `/courses`.
2. Client calls `POST /api/checkout`.
3. Server route creates Stripe Checkout session using `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID`.
4. Stripe redirects to `/courses/success` on success.
5. Success page currently enables local premium flag for immediate unlock.

Production hardening path:
- Stripe webhook -> backend function -> set Firebase custom claim `ofrPremium=true` on user.
- Remove local premium fallback once claims pipeline is active.

## 4) Page-by-Page Copy Draft

Homepage:
- Headline: "Build Wealth Without Noise."
- Positioning: Calm, rational wealth building for India + US audiences.
- Founder proof story and clear CTA split (tools/course/newsletter).

Tools:
- Promise: "Free calculators. Clear outputs. No noise."
- Every tool includes: chart, plain explanation, improvement suggestion.

Learn:
- Practical education only.
- Includes the required topics plus relatable India/US stories.

Courses:
- Free track: "Calm Wealth Blueprint".
- Paid track: "OFR Wealth System" with templates, dashboard, review workflow, and premium simulators.

Newsletter:
- Weekly low-noise educational note.
- Archive supports clean reading and quick scan.

## 5) Calculator Logic Assumptions

A. Compound Interest:
- Monthly contributions and monthly compounding.
- Inflation adjustment done monthly to estimate real purchasing power.
- Consistency score is behavior-oriented, not a market prediction score.

B. FI Calculator:
- FI corpus = annual expenses / withdrawal rate.
- Future FI target inflates expenses to retirement year.
- Monthly SIP required assumes constant return and monthly investment.

C. India SIP + SWP:
- SIP accumulation monthly.
- SWP withdrawal monthly, with inflation-linked withdrawal increase.
- Reports sustainability and depletion timing.

D. US 401(k) + Roth:
- Annual salary growth, annual contributions, annual compounding.
- Shows pre-tax 401(k), Roth value, and after-tax estimate for retirement.

E. Budget Tool:
- Needs/wants percentages from monthly take-home.
- Savings derived as residual.
- Emergency fund target = 6 months of needs.

## 6) SEO Metadata Plan

Global:
- Branded title template in `app/layout.tsx`.
- High-intent keywords around FI, index investing, 401(k), Roth, SIP.

Per-route metadata:
- Homepage, Tools, Learn, Courses, Newsletter, FAQ, Privacy, Terms.
- Dynamic metadata for each learn article based on title/excerpt.

Crawlability:
- `sitemap.ts` includes all major pages and article slugs.
- `robots.ts` allows marketing content, blocks internal `/app` QA routes.

## 7) Launch Checklist

Platform:
- [ ] Configure Firebase web keys in frontend env.
- [ ] Configure Stripe keys and price id.
- [ ] Set production `NEXT_PUBLIC_APP_URL`.
- [ ] Add Stripe webhook pipeline for permanent premium claims.

Compliance:
- [ ] Final legal review of Privacy and Terms.
- [ ] Confirm educational-only disclaimers appear on major decision pages.

Quality:
- [ ] Mobile QA on iOS + Android browsers.
- [ ] Accessibility pass (keyboard nav, contrast, form labels).
- [ ] Performance pass (image optimization, JS payload check).
- [ ] Analytics/events setup for signup and checkout funnels.

Content:
- [ ] Replace placeholder founder details with final approved copy.
- [ ] Publish first 8-12 learn posts and 4-6 newsletter issues.
- [ ] Record and upload free + paid course modules.
