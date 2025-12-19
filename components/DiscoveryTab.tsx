import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, MapPin, Trophy, CheckCircle, Users, 
  ExternalLink, Star, TrendingUp, Globe, Loader2,
  ChevronDown, X, UserPlus, Mail
} from 'lucide-react';
import { 
  getScoutingProspects, 
  getScoutingStats, 
  getProspectsByLocation,
  updateProspectStatus,
  ScoutingProspect,
  ScoutingStats,
  LocationStats
} from '../services/supabaseService';
import ScoreCard from './ScoreCard';
import AddToListDropdown from './AddToListDropdown';
import ScoreTooltip from './ScoreTooltip';
import { prospectToShortlistItem } from '../services/shortlistService';

type SortMode = 'score' | 'kaito' | 'cookie' | 'ethos' | 'followers';
type StatusFilter = 'all' | 'prospect' | 'contacted';

const DiscoveryTab: React.FC = () => {
  // Data state
  const [prospects, setProspects] = useState<ScoutingProspect[]>([]);
  const [stats, setStats] = useState<ScoutingStats | null>(null);
  const [locations, setLocations] = useState<LocationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter state
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [rankedOnly, setRankedOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // UI state
  const [selectedProspect, setSelectedProspect] = useState<ScoutingProspect | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prospectsData, statsData, locationsData] = await Promise.all([
          getScoutingProspects({ limit: PAGE_SIZE, offset: 0 }),
          getScoutingStats(),
          getProspectsByLocation()
        ]);
        setProspects(prospectsData);
        setStats(statsData);
        setLocations(locationsData);
      } catch (error) {
        console.error('Failed to load discovery data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    async function reloadProspects() {
      if (loading) return;
      setLoadingMore(true);
      try {
        const data = await getScoutingProspects({
          limit: PAGE_SIZE,
          offset: 0,
          location: locationFilter || undefined,
          minScoutScore: minScore || undefined,
          verifiedOnly: verifiedOnly || undefined,
          hasRanking: rankedOnly || undefined,
        });
        setProspects(data);
        setPage(0);
      } catch (error) {
        console.error('Failed to reload prospects:', error);
      } finally {
        setLoadingMore(false);
      }
    }
    reloadProspects();
  }, [locationFilter, verifiedOnly, rankedOnly, minScore]);

  // Load more prospects
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const newPage = page + 1;
      const data = await getScoutingProspects({
        limit: PAGE_SIZE,
        offset: newPage * PAGE_SIZE,
        location: locationFilter || undefined,
        minScoutScore: minScore || undefined,
        verifiedOnly: verifiedOnly || undefined,
        hasRanking: rankedOnly || undefined,
      });
      setProspects(prev => [...prev, ...data]);
      setPage(newPage);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter and sort prospects
  const filteredProspects = useMemo(() => {
    let result = [...prospects];
    
    // Location filter (client-side safety net - exact match)
    if (locationFilter) {
      const beforeCount = result.length;
      result = result.filter(p => p.location === locationFilter);
      console.log(`Location filter "${locationFilter}": ${beforeCount} -> ${result.length} prospects`);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.x_handle?.toLowerCase().includes(query) ||
        p.display_name?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    
    // Sort
    switch (sortMode) {
      case 'score':
        result.sort((a, b) => (b.scout_score || 0) - (a.scout_score || 0));
        break;
      case 'kaito':
        result.sort((a, b) => (a.kaito_rank || 999999) - (b.kaito_rank || 999999));
        break;
      case 'cookie':
        result.sort((a, b) => (a.cookie_rank || 999999) - (b.cookie_rank || 999999));
        break;
      case 'ethos':
        result.sort((a, b) => (b.ethos_score || 0) - (a.ethos_score || 0));
        break;
      case 'followers':
        result.sort((a, b) => (b.followers || 0) - (a.followers || 0));
        break;
    }
    
    return result;
  }, [prospects, searchQuery, statusFilter, sortMode, locationFilter]);

  // Mark prospect as contacted
  const markAsContacted = async (prospect: ScoutingProspect) => {
    const success = await updateProspectStatus(prospect.id, 'contacted');
    if (success) {
      setProspects(prev => prev.map(p => 
        p.id === prospect.id ? { ...p, status: 'contacted', contacted_at: new Date().toISOString() } : p
      ));
      if (selectedProspect?.id === prospect.id) {
        setSelectedProspect({ ...selectedProspect, status: 'contacted' });
      }
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 150) return 'text-emerald-400';
    if (score >= 100) return 'text-cyan-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-slate-400';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 150) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 100) return 'bg-cyan-500/20 border-cyan-500/30';
    if (score >= 50) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-slate-800/50 border-slate-700';
  };

  const getRankBadge = (rank: number | null, platform: string): React.ReactNode => {
    if (!rank) return null;
    const color = rank <= 100 ? 'text-yellow-400 bg-yellow-500/20' 
                : rank <= 500 ? 'text-slate-300 bg-slate-500/20'
                : rank <= 1000 ? 'text-amber-600 bg-amber-500/20'
                : 'text-slate-500 bg-slate-800';
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${color}`}>
        #{rank}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading prospects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ScoreCard 
          label="Total Prospects" 
          value={stats?.totalProspects.toLocaleString() || '0'}
          icon={<Users className="w-4 h-4" />}
          color="cyan"
        />
        <ScoreCard 
          label="With InfoFi Data" 
          value={stats?.totalWithInfoFi.toLocaleString() || '0'}
          icon={<Star className="w-4 h-4" />}
          color="purple"
        />
        <ScoreCard 
          label="Verified" 
          value={stats?.totalVerified.toLocaleString() || '0'}
          icon={<CheckCircle className="w-4 h-4" />}
          color="emerald"
        />
        <ScoreCard 
          label="Ranked" 
          value={stats?.totalRanked.toLocaleString() || '0'}
          icon={<Trophy className="w-4 h-4" />}
          color="amber"
        />
        <ScoreCard 
          label="Contacted" 
          value={stats?.byStatus.contacted.toLocaleString() || '0'}
          icon={<Mail className="w-4 h-4" />}
          color="blue"
        />
      </div>

      {/* Top Locations */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-500" />
          Top Markets
        </h3>
        <div className="flex flex-wrap gap-2">
          {locations.slice(0, 8).map(loc => (
            <button
              key={loc.location}
              onClick={() => setLocationFilter(locationFilter === loc.location ? '' : loc.location)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                locationFilter === loc.location
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {loc.location}
              <span className="ml-1.5 opacity-60">{loc.prospect_count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by handle, name, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Location Dropdown */}
          <div className="lg:w-48 relative">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Location</label>
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                {locationFilter || 'All Locations'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            {showLocationDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setLocationFilter(''); setShowLocationDropdown(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
                >
                  All Locations
                </button>
                {locations.map(loc => (
                  <button
                    key={loc.location}
                    onClick={() => { setLocationFilter(loc.location); setShowLocationDropdown(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex justify-between"
                  >
                    <span>{loc.location}</span>
                    <span className="text-slate-500">{loc.prospect_count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Mode */}
          <div className="lg:w-64">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'score', label: 'Score', icon: Star },
                { key: 'kaito', label: 'Kaito', icon: TrendingUp },
                { key: 'cookie', label: 'Cookie', icon: Trophy },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSortMode(key)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    sortMode === key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-slate-400">Verified Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rankedOnly}
              onChange={(e) => setRankedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-slate-400">Ranked Only</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Min Score:</span>
            <input 
              type="range" 
              min="0" 
              max="150" 
              step="10"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-cyan-400 font-mono font-bold w-8">{minScore}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            <span>
              Showing <span className="text-cyan-400 font-bold">{filteredProspects.length}</span> prospects
            </span>
          </div>
        </div>
      </div>

      {/* Prospects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProspects
          .filter(p => !locationFilter || p.location === locationFilter)
          .slice(0, (page + 1) * PAGE_SIZE)
          .map((prospect) => (
          <div 
            key={prospect.id} 
            className={`group bg-slate-900 border transition-all duration-300 rounded-lg p-5 cursor-pointer ${
              prospect.status === 'contacted' 
                ? 'border-blue-500/30 bg-blue-500/5' 
                : 'border-slate-800 hover:border-cyan-500/50'
            }`}
            onClick={() => setSelectedProspect(prospect)}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-200 truncate">
                    @{prospect.x_handle || 'unknown'}
                  </h4>
                  {prospect.verified && (
                    <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  )}
                </div>
                {prospect.display_name && (
                  <p className="text-xs text-slate-500 truncate">{prospect.display_name}</p>
                )}
              </div>
            </div>

            {/* Scout Score Badge */}
            <div className={`rounded-lg p-3 mb-3 border ${getScoreBg(prospect.scout_score)}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-mono flex items-center">
                  Scout Score
                  <ScoreTooltip score={prospect.scout_score || 0} size="sm" />
                </span>
                <span className={`text-xl font-bold font-mono ${getScoreColor(prospect.scout_score)}`}>
                  {prospect.scout_score?.toFixed(0) || '—'}
                </span>
              </div>
            </div>

            {/* Rankings */}
            <div className="flex flex-wrap gap-2 mb-3">
              {prospect.kaito_rank && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">Kaito</span>
                  {getRankBadge(prospect.kaito_rank, 'kaito')}
                </div>
              )}
              {prospect.cookie_rank && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">Cookie</span>
                  {getRankBadge(prospect.cookie_rank, 'cookie')}
                </div>
              )}
              {prospect.ethos_rank && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">Ethos</span>
                  {getRankBadge(prospect.ethos_rank, 'ethos')}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {prospect.ethos_score && (
                <div className="bg-slate-800/50 rounded p-2">
                  <span className="text-slate-500 block">Ethos</span>
                  <span className="text-slate-200 font-mono font-bold">{prospect.ethos_score.toFixed(0)}</span>
                </div>
              )}
              {prospect.followers && (
                <div className="bg-slate-800/50 rounded p-2">
                  <span className="text-slate-500 block">Followers</span>
                  <span className="text-slate-200 font-mono font-bold">{prospect.followers.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Location */}
            {prospect.location && (
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{prospect.location}</span>
              </div>
            )}

            {/* Status Badge */}
            {prospect.status === 'contacted' && (
              <div className="mt-3 flex items-center gap-1 text-xs text-blue-400">
                <Mail className="w-3 h-3" />
                <span>Contacted</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2">
                {prospect.status !== 'contacted' && (
                  <button
                    onClick={() => markAsContacted(prospect)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded text-xs transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    Contacted
                  </button>
                )}
                <a
                  href={prospect.x_link || `https://x.com/${prospect.x_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Profile
                </a>
              </div>
              <AddToListDropdown 
                item={prospectToShortlistItem(prospect)} 
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {filteredProspects.length > (page + 1) * PAGE_SIZE && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              `Load More (${filteredProspects.length - (page + 1) * PAGE_SIZE} remaining)`
            )}
          </button>
        </div>
      )}

      {filteredProspects.length === 0 && (
        <div className="text-center py-20 text-slate-600 font-mono">
          No prospects match current filters.
        </div>
      )}

      {/* Detail Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProspect(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">@{selectedProspect.x_handle}</h3>
                  {selectedProspect.verified && <CheckCircle className="w-5 h-5 text-cyan-400" />}
                </div>
                {selectedProspect.display_name && (
                  <p className="text-sm text-slate-400">{selectedProspect.display_name}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Source: {selectedProspect.source} | Status: {selectedProspect.status}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full border font-bold ${getScoreBg(selectedProspect.scout_score)} ${getScoreColor(selectedProspect.scout_score)}`}>
                {selectedProspect.scout_score?.toFixed(0)} Score
              </div>
            </div>

            {/* Scout Score Breakdown */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4 mb-4">
              <h4 className="text-xs font-mono text-cyan-400 uppercase mb-3 flex items-center gap-2">
                <Star className="w-3 h-3" />
                Scout Score Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ethos Score</span>
                  <span className="text-slate-200 font-mono">
                    {selectedProspect.ethos_score ? `+${Math.min(40, selectedProspect.ethos_score / 25).toFixed(0)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kaito Rank</span>
                  <span className="text-slate-200 font-mono">
                    {selectedProspect.kaito_rank ? `+${Math.max(0, 100 - selectedProspect.kaito_rank / 40).toFixed(0)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cookie Rank</span>
                  <span className="text-slate-200 font-mono">
                    {selectedProspect.cookie_rank ? `+${Math.max(0, 100 - selectedProspect.cookie_rank / 120).toFixed(0)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified</span>
                  <span className={`font-mono ${selectedProspect.verified ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {selectedProspect.verified ? '+20' : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No VPN</span>
                  <span className={`font-mono ${selectedProspect.no_vpn ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {selectedProspect.no_vpn ? '+10' : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bot Penalty</span>
                  <span className={`font-mono ${selectedProspect.possible_bot ? 'text-red-400' : 'text-slate-500'}`}>
                    {selectedProspect.possible_bot ? '= 0' : 'None'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Score</span>
                <span className={`text-lg font-bold font-mono ${getScoreColor(selectedProspect.scout_score)}`}>
                  {selectedProspect.scout_score?.toFixed(0) || '0'}
                </span>
              </div>
            </div>

            {/* Rankings */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-3">Leaderboard Rankings</h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div>
                  <span className="text-slate-500 block text-xs">Kaito</span>
                  <span className="text-slate-200 font-mono font-bold">
                    {selectedProspect.kaito_rank ? `#${selectedProspect.kaito_rank}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Cookie</span>
                  <span className="text-slate-200 font-mono font-bold">
                    {selectedProspect.cookie_rank ? `#${selectedProspect.cookie_rank}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Ethos</span>
                  <span className="text-slate-200 font-mono font-bold">
                    {selectedProspect.ethos_rank ? `#${selectedProspect.ethos_rank}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Wallchain</span>
                  <span className="text-slate-200 font-mono font-bold">
                    {selectedProspect.wallchain_rank ? `#${selectedProspect.wallchain_rank}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Galxe</span>
                  <span className="text-slate-200 font-mono font-bold">
                    {selectedProspect.galxe_rank ? `#${selectedProspect.galxe_rank}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-3">Quality Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Ethos Score</span>
                  <span className="text-slate-200">{selectedProspect.ethos_score?.toFixed(0) || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Cookie Score</span>
                  <span className="text-slate-200">{selectedProspect.cookie_score?.toFixed(0) || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Kaito SF</span>
                  <span className="text-slate-200">{selectedProspect.kaito_sf || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Followers</span>
                  <span className="text-slate-200">{selectedProspect.followers?.toLocaleString() || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Location</span>
                  <span className="text-slate-200">{selectedProspect.location || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Engagement Rate</span>
                  <span className="text-slate-200">
                    {selectedProspect.engagement_rate ? `${selectedProspect.engagement_rate}%` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Indicators */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-3">Risk Indicators</h4>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedProspect.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {selectedProspect.verified ? '✓ Verified' : '✗ Not Verified'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedProspect.no_vpn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {selectedProspect.no_vpn ? '✓ No VPN' : '⚠ VPN Detected'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedProspect.possible_bot ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedProspect.possible_bot ? '⚠ Possible Bot' : '✓ Not Bot'}
                </span>
                {selectedProspect.username_changes !== null && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    (selectedProspect.username_changes || 0) > 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {selectedProspect.username_changes} name changes
                  </span>
                )}
              </div>
            </div>

            {/* Add to Shortlist */}
            <div className="mb-4">
              <AddToListDropdown 
                item={prospectToShortlistItem(selectedProspect)} 
                size="md"
                showLabel={true}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedProspect(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
              {selectedProspect.status !== 'contacted' && (
                <button 
                  onClick={() => markAsContacted(selectedProspect)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Mark Contacted
                </button>
              )}
              <a 
                href={selectedProspect.x_link || `https://x.com/${selectedProspect.x_handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors text-center"
              >
                View Profile
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryTab;
