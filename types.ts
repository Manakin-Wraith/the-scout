export interface DealTaker {
  X_Handle: string;
  Total_Earnings: number;
  Total_Posts: number;
  Campaigns_Participated: number;
}

export interface NonInteractor {
  User_ID: string;
  TG_Username: string;
  First_Name: string;
  Last_Name: string;
  Join_Date: string;
}

export interface DormantInfluencer {
  telegramId: string;
  TG_Handle: string;
  xLink: string;
  Smart_Followers: number;
  submittedAt: string;
}

// InfoFi Profile - Quality and Risk Assessment Data
export interface InfoFiProfile {
  // Identity (Link Key)
  username: string;              // X Handle - links to DealTaker.X_Handle
  name: string;
  
  // Location & Verification
  registered: string;            // App/platform source (e.g., "Nigeria App Store")
  location: string;              // Inferred location
  noVPN: boolean;                // True = legitimate location (no VPN detected)
  verified: boolean;             // Account verified status
  
  // Risk Indicators
  usernameChanges: number;       // Count of username changes (high = red flag)
  lastUsernameChange: string;    // Last change date
  possibleBot: boolean;          // Bot detection flag (critical fraud indicator)
  
  // Quality Scores
  ethosScore: number;            // Ethos reputation score
  kaitoSF: number;               // Kaito Smart Followers
  kaitoYaps: number;             // Kaito engagement metric
  cookieSF: number;              // Cookie Smart Followers
  cookieScore: number;           // Cookie reputation score
  twitterScore: number;          // Twitter influence score
  
  // Engagement Metrics
  followers: number;
  avgEngagement: number;
  avgImpressions: number;
  engagementRate: number;
  
  // Contact & Media
  tgLink: string;                // Telegram link
  imageUrl: string;              // Profile image URL
  
  // Rankings (from supplementary files)
  kaitoRank?: number;
  cookieRank?: number;
  ethosRank?: number;
  wallchainRank?: number;
  galxeRank?: number;
}

// Risk level classification
export type RiskLevel = 'critical' | 'warning' | 'clean';

// Enriched types for merged data
export interface EnrichedDealTaker extends DealTaker {
  infofi: InfoFiProfile | null;
  riskLevel: RiskLevel;
}

export interface EnrichedDormant extends DormantInfluencer {
  infofi: InfoFiProfile | null;
  qualityScore: number;
}

export type TabView = 'dashboard' | 'roster' | 'goldmine' | 'onboarding' | 'campaigns' | 'riskradar' | 'whalehunter' | 'dealanalyzer' | 'shortlists' | 'discovery';

// Monthly performance within a campaign
export interface CampaignMonth {
  month: string;
  posts: number;
  budget: number;
  impressions: number;
  likes: number;
  reposts: number;
  replies: number;
  engagement: number;
  cpm: number;
  engagementRate: number;
}

// Individual campaign performance for a creator
export interface CampaignDetail {
  campaignName: string;
  posts: number;
  budget: number;
  impressions: number;
  engagement: number;
  likes: number;
  reposts: number;
  replies: number;
  cpm: number;
  engagementRate: number;
  months: CampaignMonth[];
}

// Creator profile with aggregated stats and drill-down data
export interface CreatorProfile {
  id: string;
  xHandle: string;
  telegramId: string;
  telegramHandle: string;
  xLink: string;
  smartFollowers: number;
  status: string;
  
  // Aggregated Stats
  totalCampaigns: number;
  totalPosts: number;
  lifetimeEarnings: number;
  totalImpressions: number;
  totalEngagement: number;
  totalLikes: number;
  totalReposts: number;
  totalReplies: number;
  avgCPM: number;
  avgEngagementRate: number;
  
  // Drill-down data
  campaigns: CampaignDetail[];
}

// Creator performance within a campaign (for campaign drill-down)
export interface CampaignCreator {
  username: string;
  xLink: string;
  posts: number;
  budget: number;
  impressions: number;
  engagement: number;
  likes: number;
  reposts: number;
  replies: number;
  cpm: number;
  engagementRate: number;
  months: CampaignMonth[];
}

// Monthly aggregated stats for a campaign
export interface MonthlyStats {
  month: string;
  creators: number;
  posts: number;
  budget: number;
  impressions: number;
  engagement: number;
  cpm: number;
  engagementRate: number;
}

// Campaign profile with aggregated stats and drill-down data
export interface CampaignProfile {
  id: string;
  campaignName: string;
  
  // Time range
  startMonth: string;
  endMonth: string;
  durationMonths: number;
  
  // Aggregated Stats
  totalCreators: number;
  totalPosts: number;
  totalBudget: number;
  totalImpressions: number;
  totalEngagement: number;
  totalLikes: number;
  totalReposts: number;
  totalReplies: number;
  avgCPM: number;
  avgEngagementRate: number;
  
  // Performance metrics
  budgetPerCreator: number;
  impressionsPerPost: number;
  engagementPerPost: number;
  
  // Drill-down data
  creators: CampaignCreator[];
  monthlyBreakdown: MonthlyStats[];
}

// ============================================================================
// SHORTLIST FEATURE - Multi-list selection system
// ============================================================================

// Shortlist item source type
export type ShortlistItemType = 'deal_taker' | 'dormant' | 'non_interactor' | 'enriched_deal_taker' | 'enriched_dormant' | 'prospect';

// Individual item in a shortlist (denormalized for fast display)
export interface ShortlistItem {
  id: string;                    // Unique identifier (X_Handle, telegramId, or User_ID)
  type: ShortlistItemType;       // Source type for proper rendering
  addedAt: string;               // ISO timestamp
  notes?: string;                // Optional user notes
  
  // Denormalized display data
  displayName: string;           // @handle or name
  xHandle?: string;
  telegramHandle?: string;
  xLink?: string;
  earnings?: number;
  followers?: number;
  riskLevel?: RiskLevel;
  qualityScore?: number;
}

// List color options
export type ShortlistColor = 'red' | 'orange' | 'amber' | 'emerald' | 'blue' | 'purple' | 'pink' | 'slate';

// A named shortlist containing items
export interface Shortlist {
  id: string;                    // UUID
  name: string;                  // User-defined name
  description?: string;          // Optional description
  color: ShortlistColor;         // Badge color for visual distinction
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  items: ShortlistItem[];
}

// Global shortlist state
export interface ShortlistState {
  lists: Shortlist[];
  activeListId: string | null;   // Currently selected list for quick-add
}