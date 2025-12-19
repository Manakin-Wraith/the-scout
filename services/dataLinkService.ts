/**
 * Data Link Service
 * Utilities to merge InfoFi data with existing Deal Takers, Dormant Influencers, and Non-Interactors
 * Links data by X Handle (username) and Telegram username
 */

import { 
  DealTaker, 
  DormantInfluencer, 
  NonInteractor,
  InfoFiProfile, 
  EnrichedDealTaker, 
  EnrichedDormant,
  RiskLevel 
} from '../types';
import { DEAL_TAKERS, DORMANT_INFLUENCERS, NON_INTERACTORS } from '../constants';
import { INFOFI_DATA, INFOFI_BY_USERNAME } from '../infofiConstants';

// ============================================================================
// Normalization Utilities
// ============================================================================

/**
 * Normalize X Handle for matching (lowercase, strip @)
 */
export function normalizeHandle(handle: string): string {
  if (!handle) return '';
  return handle.toLowerCase().replace(/^@/, '').trim();
}

/**
 * Extract X Handle from full X/Twitter URL
 * Examples:
 *   "https://x.com/username" → "username"
 *   "https://x.com/username?s=09" → "username"
 *   "https://twitter.com/user_name" → "user_name"
 */
export function extractXHandle(xLink: string): string {
  if (!xLink) return '';
  const match = xLink.match(/(?:x\.com|twitter\.com)\/([^?\/\s]+)/i);
  return match ? normalizeHandle(match[1]) : '';
}

/**
 * Extract Telegram username from link or handle
 * Examples:
 *   "https://t.me/username" → "username"
 *   "@username" → "username"
 *   "username" → "username"
 */
export function extractTGUsername(tgLink: string): string {
  if (!tgLink) return '';
  // Handle t.me links
  const linkMatch = tgLink.match(/t\.me\/([^?\/\s]+)/i);
  if (linkMatch) return linkMatch[1].toLowerCase();
  // Handle @username or plain username
  return tgLink.toLowerCase().replace(/^@/, '').trim();
}

// ============================================================================
// Risk Assessment
// ============================================================================

/**
 * Calculate risk level based on InfoFi profile data
 * - critical: Possible bot detected
 * - warning: High username changes (>5) OR VPN detected OR low engagement
 * - clean: No red flags
 */
export function calculateRiskLevel(profile: InfoFiProfile | null): RiskLevel {
  if (!profile) return 'clean'; // No data = assume clean (can't assess)
  
  // Critical: Bot detection
  if (profile.possibleBot) return 'critical';
  
  // Warning conditions
  const hasHighUsernameChanges = profile.usernameChanges > 5;
  const hasVPN = !profile.noVPN;
  const hasLowEngagement = profile.engagementRate < 0.5 && profile.followers > 1000;
  
  if (hasHighUsernameChanges || hasVPN || hasLowEngagement) {
    return 'warning';
  }
  
  return 'clean';
}

/**
 * Calculate quality score (0-100) for dormant influencer assessment
 * Higher = better quality prospect
 */
export function calculateQualityScore(profile: InfoFiProfile | null, smartFollowers: number): number {
  if (!profile) {
    // No InfoFi data - use smart followers as proxy (normalized to 0-50)
    return Math.min(50, smartFollowers / 100);
  }
  
  let score = 0;
  
  // Base score from smart followers (0-30 points)
  score += Math.min(30, smartFollowers / 50);
  
  // Ethos score contribution (0-20 points)
  if (profile.ethosScore > 0) {
    score += Math.min(20, profile.ethosScore / 5);
  }
  
  // Kaito SF contribution (0-15 points)
  if (profile.kaitoSF > 0) {
    score += Math.min(15, profile.kaitoSF / 100);
  }
  
  // Cookie score contribution (0-15 points)
  if (profile.cookieScore > 0) {
    score += Math.min(15, profile.cookieScore / 100);
  }
  
  // Engagement rate bonus (0-10 points)
  if (profile.engagementRate > 0) {
    score += Math.min(10, profile.engagementRate * 2);
  }
  
  // Penalties
  if (profile.possibleBot) score -= 50;
  if (!profile.noVPN) score -= 10;
  if (profile.usernameChanges > 5) score -= 10;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Data Enrichment Functions
// ============================================================================

/**
 * Find InfoFi profile by X Handle
 */
export function findInfoFiByXHandle(xHandle: string): InfoFiProfile | null {
  const normalized = normalizeHandle(xHandle);
  return INFOFI_BY_USERNAME.get(normalized) || null;
}

/**
 * Find InfoFi profile by X Link (full URL)
 */
export function findInfoFiByXLink(xLink: string): InfoFiProfile | null {
  const handle = extractXHandle(xLink);
  return handle ? findInfoFiByXHandle(handle) : null;
}

/**
 * Find InfoFi profile by Telegram username
 */
export function findInfoFiByTelegram(tgUsername: string): InfoFiProfile | null {
  const normalized = extractTGUsername(tgUsername);
  if (!normalized) return null;
  
  // Search through InfoFi data for matching TG link
  return INFOFI_DATA.find(profile => {
    const profileTG = extractTGUsername(profile.tgLink);
    return profileTG === normalized;
  }) || null;
}

/**
 * Enrich a DealTaker with InfoFi data
 */
export function enrichDealTaker(dealTaker: DealTaker): EnrichedDealTaker {
  const infofi = findInfoFiByXHandle(dealTaker.X_Handle);
  return {
    ...dealTaker,
    infofi,
    riskLevel: calculateRiskLevel(infofi)
  };
}

/**
 * Enrich a DormantInfluencer with InfoFi data
 */
export function enrichDormant(dormant: DormantInfluencer): EnrichedDormant {
  const infofi = findInfoFiByXLink(dormant.xLink);
  return {
    ...dormant,
    infofi,
    qualityScore: calculateQualityScore(infofi, dormant.Smart_Followers)
  };
}

// ============================================================================
// Batch Enrichment (Pre-computed for performance)
// ============================================================================

/**
 * Get all Deal Takers enriched with InfoFi data
 */
export function getEnrichedDealTakers(): EnrichedDealTaker[] {
  return DEAL_TAKERS.map(enrichDealTaker);
}

/**
 * Get all Dormant Influencers enriched with InfoFi data
 */
export function getEnrichedDormants(): EnrichedDormant[] {
  return DORMANT_INFLUENCERS.map(enrichDormant);
}

// ============================================================================
// Filtered Views
// ============================================================================

/**
 * Get Deal Takers filtered by risk level
 */
export function getDealTakersByRisk(level: RiskLevel): EnrichedDealTaker[] {
  return getEnrichedDealTakers().filter(dt => dt.riskLevel === level);
}

/**
 * Get high-risk Deal Takers (critical + warning)
 */
export function getHighRiskDealTakers(): EnrichedDealTaker[] {
  return getEnrichedDealTakers().filter(dt => 
    dt.riskLevel === 'critical' || dt.riskLevel === 'warning'
  );
}

/**
 * Get top quality Dormant Influencers (sorted by quality score)
 */
export function getTopDormants(limit: number = 50): EnrichedDormant[] {
  return getEnrichedDormants()
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, limit);
}

/**
 * Get Dormant Influencers with InfoFi data available
 */
export function getDormantsWithInfoFi(): EnrichedDormant[] {
  return getEnrichedDormants().filter(d => d.infofi !== null);
}

// ============================================================================
// Re-connection Engine Utilities
// ============================================================================

/**
 * Find Non-Interactors who have InfoFi data (potential re-connection targets)
 * These are users who didn't interact with the bot but we have their X data
 */
export function findReconnectionTargets(): Array<NonInteractor & { infofi: InfoFiProfile }> {
  const targets: Array<NonInteractor & { infofi: InfoFiProfile }> = [];
  
  for (const nonInteractor of NON_INTERACTORS) {
    // Try to find by TG username
    const infofi = findInfoFiByTelegram(nonInteractor.TG_Username);
    if (infofi) {
      targets.push({ ...nonInteractor, infofi });
    }
  }
  
  return targets;
}

// ============================================================================
// Statistics
// ============================================================================

export interface LinkageStats {
  dealTakers: {
    total: number;
    withInfoFi: number;
    critical: number;
    warning: number;
    clean: number;
  };
  dormants: {
    total: number;
    withInfoFi: number;
    avgQualityScore: number;
    topQuality: number; // score > 70
  };
  nonInteractors: {
    total: number;
    reconnectable: number;
  };
}

/**
 * Get comprehensive linkage statistics
 */
export function getLinkageStats(): LinkageStats {
  const enrichedDealTakers = getEnrichedDealTakers();
  const enrichedDormants = getEnrichedDormants();
  const reconnectionTargets = findReconnectionTargets();
  
  const dealTakersWithInfoFi = enrichedDealTakers.filter(dt => dt.infofi !== null);
  const dormantsWithInfoFi = enrichedDormants.filter(d => d.infofi !== null);
  
  const avgQuality = enrichedDormants.length > 0
    ? enrichedDormants.reduce((sum, d) => sum + d.qualityScore, 0) / enrichedDormants.length
    : 0;
  
  return {
    dealTakers: {
      total: enrichedDealTakers.length,
      withInfoFi: dealTakersWithInfoFi.length,
      critical: enrichedDealTakers.filter(dt => dt.riskLevel === 'critical').length,
      warning: enrichedDealTakers.filter(dt => dt.riskLevel === 'warning').length,
      clean: enrichedDealTakers.filter(dt => dt.riskLevel === 'clean').length
    },
    dormants: {
      total: enrichedDormants.length,
      withInfoFi: dormantsWithInfoFi.length,
      avgQualityScore: Math.round(avgQuality * 10) / 10,
      topQuality: enrichedDormants.filter(d => d.qualityScore > 70).length
    },
    nonInteractors: {
      total: NON_INTERACTORS.length,
      reconnectable: reconnectionTargets.length
    }
  };
}
