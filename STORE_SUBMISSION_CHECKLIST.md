# Intrinsic Store Submission Checklist

## Product Positioning

- [ ] App clearly states educational analysis + behavioral coaching only.
- [ ] No buy/sell/hold recommendations anywhere in product copy.
- [ ] No guarantees of return language.
- [ ] Sell Friction is explicitly simulated journaling, not brokerage execution.

## Compliance Surfaces

- [ ] Onboarding disclaimer required before app use.
- [ ] Stress Mode and PCC behavior flow does not contain deceptive urgency patterns.
- [ ] Pricing/plan disclosures are accurate for US and India.
- [ ] Billing language matches RevenueCat entitlement behavior.

## Privacy & Data Rights

- [ ] Privacy mode and profile controls available.
- [ ] User data export available.
- [ ] Account deletion endpoint available.

## iOS (Apple App Store)

- [ ] App metadata + screenshots updated for current UX.
- [ ] In-app subscriptions configured and reviewed.
- [ ] Privacy nutrition labels completed.
- [ ] Financial-services related claims reviewed for deception risk.
- [ ] Support URL, privacy URL, and terms URL published.

## Android (Google Play)

- [ ] Play listing, screenshots, and content rating complete.
- [ ] Subscription products configured and mapped.
- [ ] Data safety form completed.
- [ ] Non-deceptive financial positioning verified.

## Operational Readiness

- [ ] Production env vars set (Firebase, DB, Redis, webhook secrets, OpenAI key).
- [ ] DB migrations applied.
- [ ] `pnpm test` is green.
- [ ] `pnpm typecheck` is green.
- [ ] Incident logging/monitoring configured.
