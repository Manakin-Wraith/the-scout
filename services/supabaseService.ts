/**
 * Supabase Service Layer
 * 
 * Provides data fetching functions that replace the static CSV-based constants.
 * These functions query the Supabase database and return data in the same format
 * as the existing types for seamless integration.
 */

import { supabase } from './supabaseClient';
import { 
  DealTaker, 
  DormantInfluencer, 
  NonInteractor,
  InfoFiProfile,
  EnrichedDealTaker,
  EnrichedDormant,
  RiskLevel
} from '../types';

// ============================================================================
// Type Definitions for Database Rows
// ============================================================================

interface DbUser {
  id: string;
  x_handle: string | null;
  telegram_id: string | null;
  telegram_handle: string | null;
  first_name: string | null;
  last_name: string | null;
  x_link: string | null;
}

interface DbDealTaker {
  id: string;
  user_id: string;
  total_earnings: number;
  total_posts: number;
  campaigns_participated: number;
  users: DbUser;
}

interface DbDormant {
  id: string;
  user_id: string;
  smart_followers: number;
  submitted_at: string | null;
  status: string;
  users: DbUser;
}

interface DbNonInteractor {
  id: string;
  user_id: string;
  join_date: string | null;
  users: DbUser;
}

interface DbInfoFiProfile {
  id: string;
  user_id: string;
  registered: string | null;
  location: string | null;
  no_vpn: boolean;
  verified: boolean;
  username_changes: number;
  last_username_change: string | null;
  possible_bot: boolean;
  ethos_score: number | null;
  kaito_sf: number | null;
  kaito_yaps: number | null;
  cookie_sf: number | null;
  cookie_score: number | null;
  twitter_score: number | null;
  followers: number | null;
  avg_engagement: number | null;
  avg_impressions: number | null;
  engagement_rate: number | null;
  kaito_rank: number | null;
  cookie_rank: number | null;
  ethos_rank: number | null;
  wallchain_rank: number | null;
  galxe_rank: number | null;
  image_url: string | null;
  tg_link: string | null;
}

interface DbEnrichedDealTaker {
  id: string;
  x_handle: string | null;
  telegram_id: string | null;
  telegram_handle: string | null;
  x_link: string | null;
  total_earnings: number;
  total_posts: number;
  campaigns_participated: number;
  possible_bot: boolean | null;
  username_changes: number | null;
  no_vpn: boolean | null;
  location: string | null;
  verified: boolean | null;
  ethos_score: number | null;
  cookie_score: number | null;
  kaito_sf: number | null;
  followers: number | null;
  engagement_rate: number | null;
  image_url: string | null;
  tg_link: string | null;
  risk_level: string;
}

interface DbEnrichedDormant {
  id: string;
  x_handle: string | null;
  telegram_id: string | null;
  telegram_handle: string | null;
  x_link: string | null;
  smart_followers: number;
  submitted_at: string | null;
  status: string;
  ethos_score: number | null;
  cookie_score: number | null;
  kaito_sf: number | null;
  verified: boolean | null;
  location: string | null;
  no_vpn: boolean | null;
  possible_bot: boolean | null;
  followers: number | null;
  engagement_rate: number | null;
  image_url: string | null;
  tg_link: string | null;
  quality_score: number;
}

// ============================================================================
// Transformation Functions
// ============================================================================

function toInfoFiProfile(db: DbInfoFiProfile | null): InfoFiProfile | null {
  if (!db) return null;
  
  return {
    username: '', // Will be filled from user data
    name: '',
    registered: db.registered || '',
    location: db.location || '',
    noVPN: db.no_vpn,
    verified: db.verified,
    usernameChanges: db.username_changes,
    lastUsernameChange: db.last_username_change || '',
    possibleBot: db.possible_bot,
    ethosScore: db.ethos_score || 0,
    kaitoSF: db.kaito_sf || 0,
    kaitoYaps: db.kaito_yaps || 0,
    cookieSF: db.cookie_sf || 0,
    cookieScore: db.cookie_score || 0,
    twitterScore: db.twitter_score || 0,
    followers: db.followers || 0,
    avgEngagement: db.avg_engagement || 0,
    avgImpressions: db.avg_impressions || 0,
    engagementRate: db.engagement_rate || 0,
    tgLink: db.tg_link || '',
    imageUrl: db.image_url || '',
    kaitoRank: db.kaito_rank || undefined,
    cookieRank: db.cookie_rank || undefined,
    ethosRank: db.ethos_rank || undefined,
    wallchainRank: db.wallchain_rank || undefined,
    galxeRank: db.galxe_rank || undefined,
  };
}

function dbToEnrichedDealTaker(db: DbEnrichedDealTaker): EnrichedDealTaker {
  const infofi: InfoFiProfile | null = db.possible_bot !== null ? {
    username: db.x_handle || '',
    name: '',
    registered: '',
    location: db.location || '',
    noVPN: db.no_vpn || false,
    verified: db.verified || false,
    usernameChanges: db.username_changes || 0,
    lastUsernameChange: '',
    possibleBot: db.possible_bot || false,
    ethosScore: db.ethos_score || 0,
    kaitoSF: db.kaito_sf || 0,
    kaitoYaps: 0,
    cookieSF: 0,
    cookieScore: db.cookie_score || 0,
    twitterScore: 0,
    followers: db.followers || 0,
    avgEngagement: 0,
    avgImpressions: 0,
    engagementRate: db.engagement_rate || 0,
    tgLink: db.tg_link || '',
    imageUrl: db.image_url || '',
  } : null;

  return {
    X_Handle: db.x_handle || '',
    Total_Earnings: db.total_earnings,
    Total_Posts: db.total_posts,
    Campaigns_Participated: db.campaigns_participated,
    infofi,
    riskLevel: (db.risk_level as RiskLevel) || 'clean',
  };
}

function dbToEnrichedDormant(db: DbEnrichedDormant): EnrichedDormant {
  const xHandle = db.x_handle || extractXHandleFromLink(db.x_link);
  
  const infofi: InfoFiProfile | null = db.possible_bot !== null ? {
    username: xHandle,
    name: '',
    registered: '',
    location: db.location || '',
    noVPN: db.no_vpn || false,
    verified: db.verified || false,
    usernameChanges: 0,
    lastUsernameChange: '',
    possibleBot: db.possible_bot || false,
    ethosScore: db.ethos_score || 0,
    kaitoSF: db.kaito_sf || 0,
    kaitoYaps: 0,
    cookieSF: 0,
    cookieScore: db.cookie_score || 0,
    twitterScore: 0,
    followers: db.followers || 0,
    avgEngagement: 0,
    avgImpressions: 0,
    engagementRate: db.engagement_rate || 0,
    tgLink: db.tg_link || '',
    imageUrl: db.image_url || '',
  } : null;

  return {
    telegramId: db.telegram_id || '',
    TG_Handle: db.telegram_handle || '',
    xLink: db.x_link || '',
    Smart_Followers: db.smart_followers,
    submittedAt: db.submitted_at || '',
    infofi,
    qualityScore: db.quality_score || 0,
  };
}

function extractXHandleFromLink(xLink: string | null): string {
  if (!xLink) return '';
  const match = xLink.match(/(?:x\.com|twitter\.com)\/([^?\/\s]+)/i);
  return match ? match[1] : '';
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetch all Deal Takers (basic data without InfoFi enrichment)
 */
export async function getDealTakers(): Promise<DealTaker[]> {
  const { data, error } = await supabase
    .from('deal_takers')
    .select(`
      id,
      total_earnings,
      total_posts,
      campaigns_participated,
      users!inner (
        x_handle
      )
    `)
    .order('total_earnings', { ascending: false });

  if (error) {
    console.error('Error fetching deal takers:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    X_Handle: row.users.x_handle || '',
    Total_Earnings: row.total_earnings,
    Total_Posts: row.total_posts,
    Campaigns_Participated: row.campaigns_participated,
  }));
}

/**
 * Fetch all Dormant Influencers (basic data)
 */
export async function getDormantInfluencers(): Promise<DormantInfluencer[]> {
  const { data, error } = await supabase
    .from('dormant_influencers')
    .select(`
      id,
      smart_followers,
      submitted_at,
      users!inner (
        telegram_id,
        telegram_handle,
        x_link
      )
    `)
    .order('smart_followers', { ascending: false });

  if (error) {
    console.error('Error fetching dormant influencers:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    telegramId: row.users.telegram_id || '',
    TG_Handle: row.users.telegram_handle || '',
    xLink: row.users.x_link || '',
    Smart_Followers: row.smart_followers,
    submittedAt: row.submitted_at || '',
  }));
}

/**
 * Fetch all Non-Interactors
 */
export async function getNonInteractors(): Promise<NonInteractor[]> {
  const { data, error } = await supabase
    .from('non_interactors')
    .select(`
      id,
      join_date,
      users!inner (
        telegram_id,
        telegram_handle,
        first_name,
        last_name
      )
    `)
    .order('join_date', { ascending: false });

  if (error) {
    console.error('Error fetching non-interactors:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    User_ID: row.users.telegram_id || '',
    TG_Username: row.users.telegram_handle || '',
    First_Name: row.users.first_name || '',
    Last_Name: row.users.last_name || '',
    Join_Date: row.join_date || '',
  }));
}

/**
 * Fetch Enriched Deal Takers (with InfoFi data and risk assessment)
 * Uses the enriched_deal_takers view
 */
export async function getEnrichedDealTakers(): Promise<EnrichedDealTaker[]> {
  const { data, error } = await supabase
    .from('enriched_deal_takers')
    .select('*')
    .order('total_earnings', { ascending: false });

  if (error) {
    console.error('Error fetching enriched deal takers:', error);
    return [];
  }

  return (data || []).map(dbToEnrichedDealTaker);
}

/**
 * Fetch Enriched Dormant Influencers (with InfoFi data and quality score)
 * Uses the enriched_dormants view
 */
export async function getEnrichedDormants(): Promise<EnrichedDormant[]> {
  const { data, error } = await supabase
    .from('enriched_dormants')
    .select('*')
    .order('quality_score', { ascending: false });

  if (error) {
    console.error('Error fetching enriched dormants:', error);
    return [];
  }

  return (data || []).map(dbToEnrichedDormant);
}

/**
 * Fetch Whale Candidates (high-quality dormants)
 * Uses the whale_candidates view
 */
export async function getWhaleCandidates(): Promise<EnrichedDormant[]> {
  const { data, error } = await supabase
    .from('whale_candidates')
    .select('*')
    .order('quality_score', { ascending: false });

  if (error) {
    console.error('Error fetching whale candidates:', error);
    return [];
  }

  return (data || []).map(dbToEnrichedDormant);
}

/**
 * Fetch Deal Takers by risk level
 */
export async function getDealTakersByRisk(level: RiskLevel): Promise<EnrichedDealTaker[]> {
  const { data, error } = await supabase
    .from('enriched_deal_takers')
    .select('*')
    .eq('risk_level', level)
    .order('total_earnings', { ascending: false });

  if (error) {
    console.error('Error fetching deal takers by risk:', error);
    return [];
  }

  return (data || []).map(dbToEnrichedDealTaker);
}

/**
 * Fetch high-risk Deal Takers (critical + warning)
 */
export async function getHighRiskDealTakers(): Promise<EnrichedDealTaker[]> {
  const { data, error } = await supabase
    .from('enriched_deal_takers')
    .select('*')
    .in('risk_level', ['critical', 'warning'])
    .order('total_earnings', { ascending: false });

  if (error) {
    console.error('Error fetching high-risk deal takers:', error);
    return [];
  }

  return (data || []).map(dbToEnrichedDealTaker);
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
    topQuality: number;
  };
  nonInteractors: {
    total: number;
    reconnectable: number;
  };
}

/**
 * Get comprehensive linkage statistics
 */
export async function getLinkageStats(): Promise<LinkageStats> {
  // Fetch counts in parallel
  const [
    { count: dtTotal },
    { count: dtCritical },
    { count: dtWarning },
    { count: dtClean },
    { count: dormantTotal },
    { count: niTotal },
  ] = await Promise.all([
    supabase.from('deal_takers').select('*', { count: 'exact', head: true }),
    supabase.from('enriched_deal_takers').select('*', { count: 'exact', head: true }).eq('risk_level', 'critical'),
    supabase.from('enriched_deal_takers').select('*', { count: 'exact', head: true }).eq('risk_level', 'warning'),
    supabase.from('enriched_deal_takers').select('*', { count: 'exact', head: true }).eq('risk_level', 'clean'),
    supabase.from('dormant_influencers').select('*', { count: 'exact', head: true }),
    supabase.from('non_interactors').select('*', { count: 'exact', head: true }),
  ]);

  // Get InfoFi match counts
  const { count: dtWithInfoFi } = await supabase
    .from('enriched_deal_takers')
    .select('*', { count: 'exact', head: true })
    .not('possible_bot', 'is', null);

  const { count: dormantWithInfoFi } = await supabase
    .from('enriched_dormants')
    .select('*', { count: 'exact', head: true })
    .not('possible_bot', 'is', null);

  // Get average quality score
  const { data: avgData } = await supabase
    .from('enriched_dormants')
    .select('quality_score');
  
  const avgQuality = avgData && avgData.length > 0
    ? avgData.reduce((sum, d) => sum + (d.quality_score || 0), 0) / avgData.length
    : 0;

  const { count: topQuality } = await supabase
    .from('enriched_dormants')
    .select('*', { count: 'exact', head: true })
    .gt('quality_score', 70);

  return {
    dealTakers: {
      total: dtTotal || 0,
      withInfoFi: dtWithInfoFi || 0,
      critical: dtCritical || 0,
      warning: dtWarning || 0,
      clean: dtClean || 0,
    },
    dormants: {
      total: dormantTotal || 0,
      withInfoFi: dormantWithInfoFi || 0,
      avgQualityScore: Math.round(avgQuality * 10) / 10,
      topQuality: topQuality || 0,
    },
    nonInteractors: {
      total: niTotal || 0,
      reconnectable: 0, // TODO: Implement reconnection logic
    },
  };
}

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Search users by X handle or Telegram handle
 */
export async function searchUsers(query: string): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`x_handle.ilike.%${query}%,telegram_handle.ilike.%${query}%`)
    .limit(50);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

/**
 * Get InfoFi profile by X handle
 */
export async function getInfoFiByXHandle(xHandle: string): Promise<InfoFiProfile | null> {
  const normalized = xHandle.toLowerCase().replace(/^@/, '').trim();
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      x_handle,
      infofi_profiles (*)
    `)
    .eq('x_handle', normalized)
    .single();

  if (error || !data) {
    return null;
  }

  const profiles = data.infofi_profiles as DbInfoFiProfile[] | null;
  if (!profiles || profiles.length === 0) {
    return null;
  }

  const profile = toInfoFiProfile(profiles[0]);
  if (profile) {
    profile.username = data.x_handle || '';
  }
  return profile;
}

// ============================================================================
// SCOUTING FUNCTIONS - New talent discovery
// ============================================================================

export interface ScoutingProspect {
  id: string;
  x_handle: string | null;
  display_name: string | null;
  x_link: string | null;
  telegram_handle: string | null;
  source: string;
  status: string;
  discovered_at: string | null;
  contacted_at: string | null;
  notes: string | null;
  location: string | null;
  verified: boolean | null;
  no_vpn: boolean | null;
  possible_bot: boolean | null;
  username_changes: number | null;
  ethos_score: number | null;
  kaito_sf: number | null;
  cookie_score: number | null;
  twitter_score: number | null;
  followers: number | null;
  engagement_rate: number | null;
  image_url: string | null;
  tg_link: string | null;
  kaito_rank: number | null;
  cookie_rank: number | null;
  ethos_rank: number | null;
  wallchain_rank: number | null;
  galxe_rank: number | null;
  scout_score: number;
}

export interface LocationStats {
  location: string;
  prospect_count: number;
  avg_scout_score: number;
  verified_count: number;
  top_kaito_count: number;
  top_cookie_count: number;
}

export interface PaginatedProspects {
  data: ScoutingProspect[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetch scouting prospects with optional filters and pagination
 */
export async function getScoutingProspects(options?: {
  limit?: number;
  offset?: number;
  location?: string;
  minScoutScore?: number;
  verifiedOnly?: boolean;
  hasRanking?: boolean;
  status?: string;
}): Promise<ScoutingProspect[]> {
  let query = supabase
    .from('scouting_prospects')
    .select('*')
    .order('scout_score', { ascending: false, nullsFirst: false });

  if (options?.location) {
    query = query.eq('location', options.location);
  }
  if (options?.minScoutScore) {
    query = query.gte('scout_score', options.minScoutScore);
  }
  if (options?.verifiedOnly) {
    query = query.eq('verified', true);
  }
  if (options?.hasRanking) {
    query = query.or('kaito_rank.not.is.null,cookie_rank.not.is.null,ethos_rank.not.is.null');
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching scouting prospects:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch scouting prospects with pagination info (total count)
 */
export async function getScoutingProspectsPaginated(options?: {
  page?: number;
  pageSize?: number;
  location?: string;
  minScoutScore?: number;
  verifiedOnly?: boolean;
  hasRanking?: boolean;
  status?: string;
}): Promise<PaginatedProspects> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build the base query for counting
  let countQuery = supabase
    .from('scouting_prospects')
    .select('*', { count: 'exact', head: true });

  // Build the data query
  let dataQuery = supabase
    .from('scouting_prospects')
    .select('*')
    .order('scout_score', { ascending: false, nullsFirst: false })
    .range(offset, offset + pageSize - 1);

  // Apply filters to both queries
  if (options?.location) {
    countQuery = countQuery.eq('location', options.location);
    dataQuery = dataQuery.eq('location', options.location);
  }
  if (options?.minScoutScore) {
    countQuery = countQuery.gte('scout_score', options.minScoutScore);
    dataQuery = dataQuery.gte('scout_score', options.minScoutScore);
  }
  if (options?.verifiedOnly) {
    countQuery = countQuery.eq('verified', true);
    dataQuery = dataQuery.eq('verified', true);
  }
  if (options?.hasRanking) {
    countQuery = countQuery.or('kaito_rank.not.is.null,cookie_rank.not.is.null,ethos_rank.not.is.null');
    dataQuery = dataQuery.or('kaito_rank.not.is.null,cookie_rank.not.is.null,ethos_rank.not.is.null');
  }
  if (options?.status) {
    countQuery = countQuery.eq('status', options.status);
    dataQuery = dataQuery.eq('status', options.status);
  }

  // Execute both queries in parallel
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    console.error('Error counting prospects:', countResult.error);
  }
  if (dataResult.error) {
    console.error('Error fetching prospects:', dataResult.error);
  }

  const totalCount = countResult.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: dataResult.data || [],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetch ranked prospects (those appearing in any leaderboard)
 */
export async function getRankedProspects(limit: number = 100): Promise<ScoutingProspect[]> {
  const { data, error } = await supabase
    .from('ranked_prospects')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching ranked prospects:', error);
    return [];
  }

  return data || [];
}

/**
 * Get prospect statistics by location
 */
export async function getProspectsByLocation(): Promise<LocationStats[]> {
  const { data, error } = await supabase
    .from('prospects_by_location')
    .select('*')
    .limit(100);

  if (error) {
    console.error('Error fetching prospects by location:', error);
    return [];
  }

  return data || [];
}

/**
 * Update prospect status (e.g., mark as contacted)
 */
export async function updateProspectStatus(
  userId: string, 
  status: 'prospect' | 'contacted' | 'active' | 'dormant' | 'rejected',
  notes?: string
): Promise<boolean> {
  const updates: Record<string, any> = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'contacted') {
    updates.contacted_at = new Date().toISOString();
  }
  if (status === 'active') {
    updates.converted_at = new Date().toISOString();
  }
  if (notes !== undefined) {
    updates.notes = notes;
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating prospect status:', error);
    return false;
  }

  return true;
}

/**
 * Bulk update prospect statuses
 */
export async function bulkUpdateProspectStatus(
  userIds: string[],
  status: 'prospect' | 'contacted' | 'active' | 'dormant' | 'rejected'
): Promise<number> {
  const updates: Record<string, any> = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'contacted') {
    updates.contacted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .in('id', userIds)
    .select('id');

  if (error) {
    console.error('Error bulk updating prospect status:', error);
    return 0;
  }

  return data?.length || 0;
}

// ============================================================================
// SCOUTING STATISTICS
// ============================================================================

export interface ScoutingStats {
  totalProspects: number;
  totalWithInfoFi: number;
  totalVerified: number;
  totalRanked: number;
  bySource: {
    scout: number;
    infofi: number;
    both: number;
  };
  byStatus: {
    prospect: number;
    contacted: number;
    active: number;
    dormant: number;
    rejected: number;
  };
  topLocations: LocationStats[];
}

/**
 * Get comprehensive scouting statistics
 */
export interface ContactedUser {
  id: string;
  x_handle: string | null;
  display_name: string | null;
  telegram_handle: string | null;
  contacted_at: string | null;
  notes: string | null;
  location: string | null;
  verified: boolean;
  kaito_rank: number | null;
  cookie_rank: number | null;
  ethos_rank: number | null;
  followers: number | null;
}

/**
 * Get all users with 'contacted' status for drill-down view
 */
export async function getContactedUsers(): Promise<ContactedUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      x_handle,
      display_name,
      telegram_handle,
      contacted_at,
      notes,
      infofi_profiles (
        location,
        verified,
        kaito_rank,
        cookie_rank,
        ethos_rank,
        followers
      )
    `)
    .eq('status', 'contacted')
    .order('contacted_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacted users:', error);
    return [];
  }

  return (data || []).map((user: any) => ({
    id: user.id,
    x_handle: user.x_handle,
    display_name: user.display_name,
    telegram_handle: user.telegram_handle,
    contacted_at: user.contacted_at,
    notes: user.notes,
    location: user.infofi_profiles?.[0]?.location || null,
    verified: user.infofi_profiles?.[0]?.verified || false,
    kaito_rank: user.infofi_profiles?.[0]?.kaito_rank || null,
    cookie_rank: user.infofi_profiles?.[0]?.cookie_rank || null,
    ethos_rank: user.infofi_profiles?.[0]?.ethos_rank || null,
    followers: user.infofi_profiles?.[0]?.followers || null,
  }));
}

export async function getScoutingStats(): Promise<ScoutingStats> {
  // Fetch counts in parallel
  const [
    { count: totalUsers },
    { count: scoutOnly },
    { count: infofiOnly },
    { count: bothSources },
    { count: prospectStatus },
    { count: contactedStatus },
    { count: activeStatus },
    { count: dormantStatus },
    { count: rejectedStatus },
    { count: verifiedCount },
    { count: rankedCount },
    { count: withInfoFi },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('source', 'scout'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('source', 'infofi'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('source', 'both'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'prospect'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'dormant'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('scouting_prospects').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('ranked_prospects').select('*', { count: 'exact', head: true }),
    supabase.from('infofi_profiles').select('*', { count: 'exact', head: true }),
  ]);

  // Get top locations
  const { data: topLocations } = await supabase
    .from('prospects_by_location')
    .select('*')
    .limit(10);

  return {
    totalProspects: prospectStatus || 0,
    totalWithInfoFi: withInfoFi || 0,
    totalVerified: verifiedCount || 0,
    totalRanked: rankedCount || 0,
    bySource: {
      scout: scoutOnly || 0,
      infofi: infofiOnly || 0,
      both: bothSources || 0,
    },
    byStatus: {
      prospect: prospectStatus || 0,
      contacted: contactedStatus || 0,
      active: activeStatus || 0,
      dormant: dormantStatus || 0,
      rejected: rejectedStatus || 0,
    },
    topLocations: topLocations || [],
  };
}
