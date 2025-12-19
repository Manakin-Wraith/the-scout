# Future AI Features - InfoFi Intelligence

> **Status:** Deferred for future implementation  
> **Priority:** Medium  
> **Dependencies:** Phase 1-3 complete (InfoFi data layer, merge utilities, UI components)

---

## Overview

Extend the existing Gemini AI service (`services/geminiService.ts`) to provide intelligent insights based on InfoFi data integration. These features will enhance the Risk Radar, Whale Hunter, and Deal Analyzer tabs with AI-powered recommendations.

---

## Proposed Features

### 1. Risk Analysis Insights (`getRiskInsights`)

**Purpose:** Analyze flagged high-risk creators and provide actionable recommendations.

**Input Data:**
- High-risk deal takers (critical + warning)
- Risk factors: bot flags, VPN usage, username changes
- Historical earnings and campaign participation

**Expected Output:**
- Top 3 highest risk accounts with reasoning
- Recommended actions (pause, investigate, remove)
- Estimated wasted budget calculation
- Pattern detection (e.g., "3 accounts from same region with similar behavior")

**Sample Prompt:**
```
You are "The Scout", an AI fraud analyst for an influencer marketing agency.
Analyze these flagged high-risk creators:

${riskyUsers.map(u => `@${u.X_Handle}: Bot=${u.possibleBot}, VPN=${!u.noVPN}, Changes=${u.usernameChanges}, Earnings=$${u.Total_Earnings}`)}

Provide:
1. Risk assessment summary
2. Top 3 accounts requiring immediate action
3. Estimated budget at risk
4. Recommended next steps

Format: Tactical, data-terminal style. No markdown.
```

---

### 2. Whale Recommendations (`getWhaleRecommendations`)

**Purpose:** Identify and prioritize high-quality dormant influencers for activation.

**Input Data:**
- Top-scored dormant influencers (quality score > threshold)
- InfoFi metrics: Ethos, Kaito, Cookie scores
- Smart follower counts and engagement rates

**Expected Output:**
- Top 5 recommended activations with reasoning
- Estimated ROI potential
- Suggested outreach approach per user
- Geographic clustering insights

**Sample Prompt:**
```
You are "The Scout", an AI talent scout for an influencer marketing agency.
Analyze these high-potential dormant influencers:

${topDormants.map(d => `@${handle}: Quality=${d.qualityScore}, SF=${d.Smart_Followers}, Ethos=${d.infofi?.ethosScore}, Location=${d.infofi?.location}`)}

Provide:
1. Top 5 recommended activations
2. Why each is valuable (specific metrics)
3. Suggested outreach strategy
4. Geographic opportunities

Format: Tactical, data-terminal style. No markdown.
```

---

### 3. Budget Optimization (`getBudgetOptimization`)

**Purpose:** Analyze budget allocation efficiency and suggest optimizations.

**Input Data:**
- All deal takers with earnings and post counts
- Risk levels and InfoFi quality data
- Cost per post calculations

**Expected Output:**
- Budget efficiency score
- Underperformers to reduce allocation
- High-performers to increase allocation
- Risk-adjusted ROI recommendations

**Sample Prompt:**
```
You are "The Scout", an AI budget analyst for an influencer marketing agency.
Analyze budget allocation across creators:

Total Budget: $${totalBudget}
At-Risk Budget: $${atRiskBudget}
Average $/Post: $${avgCPP}

Top Performers: ${topPerformers}
Underperformers: ${underperformers}
High-Risk Earners: ${highRiskEarners}

Provide:
1. Budget efficiency assessment
2. Reallocation recommendations
3. Risk mitigation strategy
4. Projected savings

Format: Tactical, data-terminal style. No markdown.
```

---

## Implementation Plan

### Step 1: Extend geminiService.ts

Add new functions alongside existing `getScoutAdvice`:

```typescript
// services/geminiService.ts additions

export const getRiskInsights = async (
  riskyUsers: EnrichedDealTaker[]
): Promise<string> => { /* ... */ };

export const getWhaleRecommendations = async (
  topDormants: EnrichedDormant[]
): Promise<string> => { /* ... */ };

export const getBudgetOptimization = async (
  dealTakers: EnrichedDealTaker[],
  stats: { totalBudget: number; atRiskBudget: number; avgCPP: number }
): Promise<string> => { /* ... */ };
```

### Step 2: Add AI Panels to Tabs

Create reusable `<AIInsightPanel>` component:

```typescript
// components/AIInsightPanel.tsx
interface AIInsightPanelProps {
  title: string;
  fetchInsights: () => Promise<string>;
  icon: React.ReactNode;
}
```

### Step 3: Integrate into Existing Tabs

- **RiskRadarTab:** Add "AI Risk Analysis" collapsible panel
- **WhaleHunterTab:** Add "AI Recommendations" section
- **DealAnalyzerTab:** Add "AI Budget Insights" panel

---

## API Requirements

- **Gemini API Key:** Required in `process.env.API_KEY`
- **Model:** `gemini-2.5-flash` (or latest available)
- **Rate Limits:** Consider caching responses for 5-10 minutes
- **Error Handling:** Graceful fallback when API unavailable

---

## UI/UX Considerations

1. **Loading States:** Show skeleton/spinner while AI generates
2. **Refresh Button:** Allow manual re-generation
3. **Collapse/Expand:** AI panels should be collapsible to reduce noise
4. **Copy to Clipboard:** Allow copying AI insights
5. **Timestamp:** Show when insights were last generated

---

## Testing Checklist

- [ ] API key validation
- [ ] Graceful error handling (no key, API error, timeout)
- [ ] Response parsing and display
- [ ] Loading state transitions
- [ ] Cache invalidation
- [ ] Rate limit handling

---

## References

- Existing implementation: `@/services/geminiService.ts`
- UI pattern: `@/components/ScoutAI.tsx`
- Data sources: `@/services/dataLinkService.ts`
- Types: `@/types.ts` (EnrichedDealTaker, EnrichedDormant)
