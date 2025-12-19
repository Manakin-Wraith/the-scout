import { 
  DealTaker, 
  DormantInfluencer, 
  NonInteractor, 
  EnrichedDealTaker, 
  EnrichedDormant,
  ShortlistItem,
  ShortlistItemType,
  ShortlistColor,
  RiskLevel
} from '../types';
import { ScoutingProspect } from './supabaseService';

// ============================================================================
// CONVERSION FUNCTIONS - Convert various user types to ShortlistItem
// ============================================================================

/**
 * Convert a DealTaker to a ShortlistItem
 */
export const dealTakerToShortlistItem = (dt: DealTaker): ShortlistItem => ({
  id: dt.X_Handle.toLowerCase(),
  type: 'deal_taker' as ShortlistItemType,
  addedAt: new Date().toISOString(),
  displayName: `@${dt.X_Handle}`,
  xHandle: dt.X_Handle,
  xLink: `https://x.com/${dt.X_Handle}`,
  earnings: dt.Total_Earnings,
});

/**
 * Convert an EnrichedDealTaker to a ShortlistItem (includes risk level)
 */
export const enrichedDealTakerToShortlistItem = (dt: EnrichedDealTaker): ShortlistItem => ({
  id: dt.X_Handle.toLowerCase(),
  type: 'enriched_deal_taker' as ShortlistItemType,
  addedAt: new Date().toISOString(),
  displayName: `@${dt.X_Handle}`,
  xHandle: dt.X_Handle,
  xLink: `https://x.com/${dt.X_Handle}`,
  earnings: dt.Total_Earnings,
  riskLevel: dt.riskLevel,
  followers: dt.infofi?.followers,
});

/**
 * Convert a DormantInfluencer to a ShortlistItem
 */
export const dormantToShortlistItem = (d: DormantInfluencer): ShortlistItem => {
  const xHandle = extractXHandle(d.xLink);
  return {
    id: d.telegramId,
    type: 'dormant' as ShortlistItemType,
    addedAt: new Date().toISOString(),
    displayName: xHandle ? `@${xHandle}` : `TG:@${d.TG_Handle}`,
    xHandle: xHandle || undefined,
    telegramHandle: d.TG_Handle,
    xLink: d.xLink,
    followers: d.Smart_Followers,
  };
};

/**
 * Convert an EnrichedDormant to a ShortlistItem (includes quality score)
 */
export const enrichedDormantToShortlistItem = (d: EnrichedDormant): ShortlistItem => {
  const xHandle = extractXHandle(d.xLink);
  return {
    id: d.telegramId,
    type: 'enriched_dormant' as ShortlistItemType,
    addedAt: new Date().toISOString(),
    displayName: xHandle ? `@${xHandle}` : `TG:@${d.TG_Handle}`,
    xHandle: xHandle || undefined,
    telegramHandle: d.TG_Handle,
    xLink: d.xLink,
    followers: d.Smart_Followers,
    qualityScore: d.qualityScore,
    riskLevel: d.infofi?.possibleBot ? 'critical' : d.infofi?.noVPN === false ? 'warning' : 'clean',
  };
};

/**
 * Convert a NonInteractor to a ShortlistItem
 */
export const nonInteractorToShortlistItem = (ni: NonInteractor): ShortlistItem => ({
  id: ni.User_ID,
  type: 'non_interactor' as ShortlistItemType,
  addedAt: new Date().toISOString(),
  displayName: ni.TG_Username ? `@${ni.TG_Username}` : `${ni.First_Name} ${ni.Last_Name}`.trim(),
  telegramHandle: ni.TG_Username,
});

/**
 * Convert a ScoutingProspect to a ShortlistItem
 */
export const prospectToShortlistItem = (prospect: ScoutingProspect): ShortlistItem => {
  const riskLevel: RiskLevel = prospect.possible_bot ? 'critical' 
    : (prospect.no_vpn === false || (prospect.username_changes || 0) > 5) ? 'warning' 
    : 'clean';
  
  return {
    id: prospect.id,
    type: 'prospect' as ShortlistItemType,
    addedAt: new Date().toISOString(),
    displayName: prospect.x_handle ? `@${prospect.x_handle}` : prospect.display_name || 'Unknown',
    xHandle: prospect.x_handle || undefined,
    xLink: prospect.x_link || undefined,
    followers: prospect.followers || undefined,
    qualityScore: prospect.scout_score,
    riskLevel,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract X handle from a full X/Twitter URL
 */
export const extractXHandle = (xLink: string): string | null => {
  if (!xLink) return null;
  const match = xLink.match(/(?:x\.com|twitter\.com)\/([^?\/]+)/i);
  return match ? match[1] : null;
};

/**
 * Get display color classes for a shortlist color
 */
export const getColorClasses = (color: ShortlistColor): { bg: string; border: string; text: string; dot: string } => {
  const colors: Record<ShortlistColor, { bg: string; border: string; text: string; dot: string }> = {
    red: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', dot: 'bg-red-500' },
    orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', dot: 'bg-orange-500' },
    amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', dot: 'bg-purple-500' },
    pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', dot: 'bg-pink-500' },
    slate: { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', dot: 'bg-slate-500' },
  };
  return colors[color] || colors.blue;
};

/**
 * Available colors for list creation
 */
export const LIST_COLORS: { name: ShortlistColor; label: string }[] = [
  { name: 'red', label: 'Red' },
  { name: 'orange', label: 'Orange' },
  { name: 'amber', label: 'Amber' },
  { name: 'emerald', label: 'Green' },
  { name: 'blue', label: 'Blue' },
  { name: 'purple', label: 'Purple' },
  { name: 'pink', label: 'Pink' },
  { name: 'slate', label: 'Gray' },
];

/**
 * Get item type display label
 */
export const getItemTypeLabel = (type: ShortlistItemType): string => {
  const labels: Record<ShortlistItemType, string> = {
    deal_taker: 'Deal Taker',
    dormant: 'Dormant',
    non_interactor: 'Non-Interactor',
    enriched_deal_taker: 'Deal Taker',
    enriched_dormant: 'Dormant',
    prospect: 'Prospect',
  };
  return labels[type] || type;
};

/**
 * Get item type badge color
 */
export const getItemTypeBadgeColor = (type: ShortlistItemType): string => {
  const colors: Record<ShortlistItemType, string> = {
    deal_taker: 'bg-emerald-500/20 text-emerald-400',
    dormant: 'bg-amber-500/20 text-amber-400',
    non_interactor: 'bg-blue-500/20 text-blue-400',
    enriched_deal_taker: 'bg-emerald-500/20 text-emerald-400',
    enriched_dormant: 'bg-amber-500/20 text-amber-400',
    prospect: 'bg-cyan-500/20 text-cyan-400',
  };
  return colors[type] || 'bg-slate-500/20 text-slate-400';
};

/**
 * Format date for display
 */
export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(isoString);
};

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Get statistics for a list's items
 */
export const getListStats = (items: ShortlistItem[]): {
  totalItems: number;
  byType: Record<ShortlistItemType, number>;
  totalEarnings: number;
  avgFollowers: number;
  riskBreakdown: { critical: number; warning: number; clean: number };
} => {
  const byType: Record<ShortlistItemType, number> = {
    deal_taker: 0,
    dormant: 0,
    non_interactor: 0,
    enriched_deal_taker: 0,
    enriched_dormant: 0,
    prospect: 0,
  };

  let totalEarnings = 0;
  let totalFollowers = 0;
  let followersCount = 0;
  const riskBreakdown = { critical: 0, warning: 0, clean: 0 };

  items.forEach(item => {
    byType[item.type]++;
    
    if (item.earnings) totalEarnings += item.earnings;
    if (item.followers) {
      totalFollowers += item.followers;
      followersCount++;
    }
    if (item.riskLevel) {
      riskBreakdown[item.riskLevel]++;
    }
  });

  return {
    totalItems: items.length,
    byType,
    totalEarnings,
    avgFollowers: followersCount > 0 ? Math.round(totalFollowers / followersCount) : 0,
    riskBreakdown,
  };
};
