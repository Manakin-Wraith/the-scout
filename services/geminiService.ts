import { GoogleGenAI } from "@google/genai";
import { DealTaker, DormantInfluencer, EnrichedDealTaker, EnrichedDormant } from "../types";

const processDataForPrompt = (
  dealTakers: DealTaker[], 
  dormant: DormantInfluencer[]
) => {
  const topEarners = dealTakers.slice(0, 5).map(d => `${d.X_Handle} ($${d.Total_Earnings})`).join(', ');
  const saturated = dealTakers.filter(d => d.Campaigns_Participated > 15).map(d => d.X_Handle).join(', ');
  const highPotentialDormant = dormant.filter(d => d.Smart_Followers > 1000).map(d => d.TG_Handle).join(', ');
  
  return `
    Top Earners: ${topEarners}
    Saturated Agents (>15 campaigns): ${saturated}
    High Potential Dormant (Active users, 0 earnings, >1k followers): ${highPotentialDormant}
    Total Active Roster: ${dealTakers.length}
    Total Dormant Inventory: ${dormant.length}
  `;
};

export const getScoutAdvice = async (
  dealTakers: DealTaker[],
  dormant: DormantInfluencer[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key missing. Cannot generate insights.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataSummary = processDataForPrompt(dealTakers, dormant);

  const prompt = `
    You are "The Scout", an AI analyst for an influencer marketing agency. 
    Analyze the following data summary and provide 3 brief, high-impact strategic recommendations.
    
    Data Summary:
    ${dataSummary}

    Format requirements:
    - Bullet points only.
    - Focus on ROI, avoiding saturation, and activating dormant inventory.
    - Tone: Professional, tactical, concise (data-terminal style).
    - Do not use markdown bolding or headers, just plain text lines.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System Offline: AI analysis unavailable.";
  }
};

// ============================================================================
// FUTURE AI FEATURES - InfoFi Intelligence
// See docs/FUTURE_AI_FEATURES.md for full specification
// ============================================================================

/**
 * TODO: Implement risk analysis insights
 * Analyzes high-risk creators and provides actionable recommendations
 * @see docs/FUTURE_AI_FEATURES.md#1-risk-analysis-insights
 */
export const getRiskInsights = async (
  _riskyUsers: EnrichedDealTaker[]
): Promise<string> => {
  // TODO: Implement when AI features are prioritized
  return "Risk analysis AI feature coming soon. See docs/FUTURE_AI_FEATURES.md";
};

/**
 * TODO: Implement whale recommendations
 * Identifies and prioritizes high-quality dormant influencers for activation
 * @see docs/FUTURE_AI_FEATURES.md#2-whale-recommendations
 */
export const getWhaleRecommendations = async (
  _topDormants: EnrichedDormant[]
): Promise<string> => {
  // TODO: Implement when AI features are prioritized
  return "Whale recommendations AI feature coming soon. See docs/FUTURE_AI_FEATURES.md";
};

/**
 * TODO: Implement budget optimization insights
 * Analyzes budget allocation efficiency and suggests optimizations
 * @see docs/FUTURE_AI_FEATURES.md#3-budget-optimization
 */
export const getBudgetOptimization = async (
  _dealTakers: EnrichedDealTaker[],
  _stats: { totalBudget: number; atRiskBudget: number; avgCPP: number }
): Promise<string> => {
  // TODO: Implement when AI features are prioritized
  return "Budget optimization AI feature coming soon. See docs/FUTURE_AI_FEATURES.md";
};