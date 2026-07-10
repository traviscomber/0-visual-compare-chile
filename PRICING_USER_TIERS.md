# Pricing & User Tiers - Visual Compare Chile

## Overview

Single User MVP model optimized for early market validation. Monetization strategy evolves as user base grows.

---

## Phase 1: Single User (MVP - Now)

### User Model: One Founder/Admin Account

```
User Role: Founder/Admin
├─ Unlimited searches
├─ Unlimited comparisons
├─ Full API access
├─ No cost (personal use)
└─ For testing & validation
```

### Pricing Strategy: FREE MVP

- **Cost to user:** $0
- **Cost to operate:** $240/year (infrastructure only)
- **Purpose:** Validate product-market fit with Chilean SMB market
- **Timeline:** 3-6 months

### Focus Areas in Phase 1

1. **Accuracy Testing**
   - Benchmark GPT-4o mini vision model
   - Test 100+ real Chilean brand comparisons
   - Document baseline metrics

2. **Usage Patterns**
   - Track comparison frequency
   - Monitor search behavior
   - Identify user pain points

3. **Feature Validation**
   - Confirm Niza/Viena classification accuracy
   - Test export functionality
   - Validate audit trail logging

4. **Market Discovery**
   - Conduct 10-15 discovery calls
   - Test pricing willingness
   - Identify buyer personas

---

## Phase 2: Early Adopter Tiers (6-12 months)

Once product-market fit is validated with 3-5 paying customers:

### Tier 1: Freemium (Free)
- 10 comparisons/month
- 100 searches/month
- Basic export (CSV only)
- Email support
- Target: Individual designers, students
- Revenue: $0

### Tier 2: Professional ($29/month or $290/year)
- 500 comparisons/month
- Unlimited searches
- Full export (CSV, JSON, PDF)
- API access (100K requests/month)
- Email + chat support
- Audit logs & history
- Target: Design studios (1-5 people)
- Revenue per user: $29/month = $348/year
- Breakeven: 2 users

### Tier 3: Enterprise ($99/month or $990/year)
- Unlimited comparisons
- Unlimited searches
- Priority support (24h response)
- Custom integrations
- Dedicated API quota (1M requests/month)
- Team management (5 seats included)
- Advanced analytics
- Target: Large design agencies, IP firms
- Revenue per user: $99/month = $1,188/year
- Add 5 additional seats: $15/seat/month

### Tier 4: White Label (Custom)
- Everything unlimited
- On-premise option available
- Custom branding
- SLA guarantee
- Target: Patent offices, enterprise
- Minimum: $500/month

---

## Revenue Projections

### Year 1: MVP Phase
```
Users: 1 (founder)
Revenue: $0
Costs: $240 (infrastructure)
```

### Year 2: Early Adoption (assuming 50 customers)
```
Freemium:        20 users × $0      = $0
Professional:    25 users × $348    = $8,700
Enterprise:      5 users  × $1,188  = $5,940
Total Revenue:                       $14,640/year

Infrastructure Costs: $1,200/year
Gross Margin: 91.8%
```

### Year 3: Growth (assuming 300 customers)
```
Freemium:        150 users × $0      = $0
Professional:    120 users × $348    = $41,760
Enterprise:      30 users  × $1,188  = $35,640
Total Revenue:                       $77,400/year

Infrastructure Costs: $8,400/year
Gross Margin: 89.2%
```

---

## Unit Economics

### Professional Tier ($29/month)
```
Revenue per user/year:     $348
Gross infrastructure cost:  $240 (amortized across 100+ users)
Cost per user:              $2.40
Gross margin:               99.3%
Payback period:             12 seconds ⚡
```

### Enterprise Tier ($99/month)
```
Revenue per user/year:     $1,188
Gross infrastructure cost:  $240 (amortized across 100+ users)
Cost per user:              $2.40
Gross margin:               99.8%
Payback period:             9 seconds ⚡
```

### Model: Extremely profitable at scale

---

## Payment & Billing

### Accepted Methods
- Credit card (Stripe)
- Crypto (optional - for Chile market expansion)
- Bank transfer (for Enterprise)

### Billing Cycle
- Monthly: Charged on day of signup
- Annual: 20% discount (save $60/year on Pro)
- No long-term contracts required
- Cancel anytime (month-to-month)

### Auto-Renewal
- Enabled by default
- Email reminder 7 days before renewal
- Easy 1-click cancellation

---

## Feature Matrix

| Feature | Freemium | Pro | Enterprise | White Label |
|---------|----------|-----|-----------|-------------|
| Comparisons/mo | 10 | 500 | Unlimited | Unlimited |
| Searches/mo | 100 | Unlimited | Unlimited | Unlimited |
| Export formats | CSV | CSV, JSON, PDF | All + custom | All + custom |
| API requests/mo | 0 | 100K | 1M | Unlimited |
| Support | Email | Email, Chat | 24h priority | Dedicated |
| Audit logs | ✓ | ✓ | ✓ | ✓ |
| Team seats | 1 | 1 | 5 included | Custom |
| Custom branding | ✗ | ✗ | ✗ | ✓ |
| SLA guarantee | ✗ | ✗ | 99.5% | 99.95% |
| On-premise | ✗ | ✗ | ✗ | ✓ |

---

## Go-to-Market Strategy

### Phase 1: MVP Launch (Month 1-3)
- Free for single founder
- Email 50 Chilean design studios
- LinkedIn outreach to IP professionals
- Create 2-3 case studies

### Phase 2: Freemium Launch (Month 4-6)
- Launch Freemium tier
- Target: Students, individual designers
- Goal: 100 free users by month 6

### Phase 3: Professional Launch (Month 6-9)
- Launch Pro tier at $29/month
- Target: Design studios (2-5 people)
- Offer 50% discount for early adopters (3 months)
- Goal: 25 paying users

### Phase 4: Enterprise Launch (Month 9-12)
- Launch Enterprise tier at $99/month
- Target: IP firms, large agencies
- Dedicated sales approach
- Custom implementations
- Goal: 3-5 Enterprise customers

---

## Customer Acquisition Cost (CAC)

### Assumptions
- Marketing budget: $500/month (Year 2)
- Sales cycle: 2-3 months
- Close rate: 30%

### CAC Calculation
```
Professional Tier:
  Monthly spend: $500
  Closes per month: 10 leads × 30% = 3 customers
  CAC: $500 / 3 = $167/customer
  LTV: ($348/year) × 3 years = $1,044
  LTV/CAC: 6.2x ✓ (Healthy = > 3x)

Enterprise Tier:
  Monthly spend: $1,000
  Closes per month: 3 leads × 30% = 1 customer  
  CAC: $1,000 / 1 = $1,000/customer
  LTV: ($1,188/year) × 5 years = $5,940
  LTV/CAC: 5.9x ✓ (Healthy = > 3x)
```

---

## Implementation Timeline

### Month 1-3: MVP
- Single user account (founder)
- Free tier
- Validate product
- Collect user feedback

### Month 4-6: Freemium
- Implement tiering logic
- Add Stripe integration
- Deploy Freemium tier
- Target: 100 free users

### Month 6-9: Professional
- Add Pro tier features
- Launch sales campaign
- Implement team management
- Target: 25 Pro customers

### Month 9-12: Enterprise
- Add Enterprise features
- Dedicated sales team
- Custom integrations
- Target: 5 Enterprise customers

---

## Technical Implementation

### Database Schema Updates

```sql
-- Add subscription tier tracking
ALTER TABLE users ADD COLUMN subscription_tier ENUM('free', 'pro', 'enterprise', 'white_label');
ALTER TABLE users ADD COLUMN subscription_start DATE;
ALTER TABLE users ADD COLUMN subscription_renew_date DATE;

-- Track usage against quotas
CREATE TABLE usage_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  comparisons_used INT DEFAULT 0,
  searches_used INT DEFAULT 0,
  api_requests_used INT DEFAULT 0,
  reset_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Stripe payment tracking
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_payment_id TEXT UNIQUE,
  amount_cents INT,
  currency TEXT DEFAULT 'USD',
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints for Billing

```
POST   /api/v1/billing/checkout         - Start Stripe checkout
GET    /api/v1/billing/status           - Get subscription status
POST   /api/v1/billing/cancel           - Cancel subscription
GET    /api/v1/billing/invoices         - List invoices
POST   /api/v1/billing/usage            - Check quota usage
```

### Stripe Integration Points

1. **Checkout**: Create Stripe Checkout Session
2. **Webhook**: Handle payment_intent.succeeded
3. **Portal**: Customer self-service portal
4. **Invoices**: Auto-generate and email

---

## Monitoring & Metrics

### Key Metrics to Track

```
Acquisition:
  - Users per channel
  - CAC per tier
  - Conversion rate (free → paid)

Retention:
  - Monthly churn rate
  - LTV per tier
  - Upgrade rate (free → pro → enterprise)

Revenue:
  - MRR (Monthly Recurring Revenue)
  - ARR (Annual Recurring Revenue)
  - ARPU (Average Revenue Per User)
  - NRR (Net Revenue Retention)
```

### Monthly Review Dashboard

Track in spreadsheet or Stripe dashboard:
- Total active users per tier
- New signups
- Cancellations
- Revenue (MRR, ARR)
- Churn rate
- NPS (Net Promoter Score)

---

## Risk Mitigation

### Risk 1: Low Willingness to Pay
- **Mitigated by:** Freemium tier for feature sampling
- **Strategy:** Collect user interviews, A/B test pricing

### Risk 2: High Churn (free users)
- **Mitigated by:** Email onboarding, product education
- **Strategy:** Track feature adoption, improve UX

### Risk 3: Competitor Entry
- **Mitigated by:** Fast execution, build network effects
- **Strategy:** Patent key algorithms, build switching costs

### Risk 4: Payment Processing Issues
- **Mitigated by:** Stripe reliability (99.9% uptime)
- **Strategy:** Implement retry logic, monitor failed payments

---

## Conclusion

Visual Compare Chile starts as a **free MVP with one user** to validate product-market fit with Chilean design studios and IP professionals. After 3-6 months of data and feedback, we launch a freemium model, followed by tiered pricing:

- **Freemium**: Free tier with usage limits (100 searches/mo)
- **Professional**: $29/month (500 comparisons/mo)
- **Enterprise**: $99/month (unlimited, team management)
- **White Label**: Custom pricing (on-premise, custom branding)

Unit economics are exceptional (99%+ margins at scale), and customer acquisition is achievable through content marketing and direct sales. Breakeven is reached at just 2 Professional customers.

---

**Document Version:** 1.0
**Created:** July 10, 2026
**Status:** Ready for implementation Phase 2 (6+ months)
