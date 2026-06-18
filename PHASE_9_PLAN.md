# PHASE 9 — PRODUCTION

## Scope
- Stripe billing integration
- Rate limiting and quotas
- Observability (logging, monitoring, tracing)
- E2E tests on critical paths
- CI/CD pipeline
- Deployment to Vercel

## Files to Create/Modify

### New Files
- `src/core/billing/stripe.ts` — Stripe integration
- `src/core/billing/quotas.ts` — Rate limiting
- `src/core/observability/logger.ts` — Logging
- `src/core/observability/metrics.ts` — Metrics
- `tests/e2e/` — E2E test suite
- `.github/workflows/deploy.yml` — CI/CD pipeline

### Modified Files
- `src/ai/gateway.ts` — Add cost tracking
- `src/core/sync.ts` — Add rate limiting
- All API routes — Add logging

## Implementation Order
1. Set up Stripe integration
2. Implement rate limiting and quotas
3. Add logging and monitoring
4. Create E2E tests
5. Set up CI/CD pipeline
6. Deploy to Vercel
7. Monitor production metrics
8. Implement auto-scaling

## Risks
- Stripe webhook handling
- Rate limit bypass attempts
- Cold start latency on Vercel

## Tradeoff
Rate limiting will use in-memory store instead of Redis. This is simpler but won't work with multiple instances. Recommend Redis for scale.
