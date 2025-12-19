import React, { useState, useEffect, useMemo } from 'react';
import { Gem, Filter, ExternalLink, Star, TrendingUp, Users, Award, Loader2 } from 'lucide-react';
import ScoreCard from './ScoreCard';
import { getWhaleCandidates } from '../services/supabaseService';

type SortMode = 'quality' | 'followers' | 'ethos' | 'kaito';

interface WhaleCandidate {
  id: string;
  x_handle: string;
  telegram_handle: string;
  x_link: string;
  smart_followers: number;
  quality_score: number;
  location: string | null;
  ethos_score: number | null;
  kaito_sf: number | null;
  cookie_score: number | null;
  followers: number | null;
  engagement_rate: number | null;
  verified: boolean;
}

const extractHandleFromLink = (xLink: string | null): string => {
  if (!xLink) return '';
  const match = xLink.match(/(?:x\.com|twitter\.com)\/([^?\/\s]+)/i);
  return match ? match[1] : '';
};

const WhaleHunterTab: React.FC = () => {
  const [data, setData] = useState<WhaleCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('quality');
  const [minQuality, setMinQuality] = useState(0);
  const [selectedUser, setSelectedUser] = useState<WhaleCandidate | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const whales = await getWhaleCandidates();
        setData(whales.map((w: any) => ({
          id: w.telegramId || '',
          x_handle: w.infofi?.username || extractHandleFromLink(w.xLink) || '',
          telegram_handle: w.TG_Handle || '',
          x_link: w.xLink || '',
          smart_followers: w.Smart_Followers || 0,
          quality_score: w.qualityScore || 0,
          location: w.infofi?.location || null,
          ethos_score: w.infofi?.ethosScore || null,
          kaito_sf: w.infofi?.kaitoSF || null,
          cookie_score: w.infofi?.cookieScore || null,
          followers: w.infofi?.followers || null,
          engagement_rate: w.infofi?.engagementRate || null,
          verified: w.infofi?.verified || false
        })));
      } catch (error) {
        console.error('Failed to load whale candidates:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const withData = data.filter(d => d.quality_score > 0).length;
    const avgScore = data.length > 0 ? data.reduce((sum, d) => sum + d.quality_score, 0) / data.length : 0;
    const topQuality = data.filter(d => d.quality_score >= 70).length;
    return { total: data.length, withData, avgScore, topQuality };
  }, [data]);

  const sortedData = useMemo(() => {
    let filtered = data.filter(d => d.quality_score >= minQuality);
    
    switch (sortMode) {
      case 'quality':
        return filtered.sort((a, b) => b.quality_score - a.quality_score);
      case 'followers':
        return filtered.sort((a, b) => b.smart_followers - a.smart_followers);
      case 'ethos':
        return filtered.sort((a, b) => (b.ethos_score || 0) - (a.ethos_score || 0));
      case 'kaito':
        return filtered.sort((a, b) => (b.kaito_sf || 0) - (a.kaito_sf || 0));
      default:
        return filtered;
    }
  }, [data, sortMode, minQuality]);

  const extractHandle = (xLink: string): string => {
    const match = xLink.match(/x\.com\/([^?\/]+)/i);
    return match ? match[1] : 'unknown';
  };

  const getQualityColor = (score: number): string => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-slate-400';
  };

  const getQualityBg = (score: number): string => {
    if (score >= 70) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-slate-800/50 border-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-slate-400">Loading whale candidates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard 
          label="Total Prospects" 
          value={stats.total}
          icon={<Users className="w-4 h-4" />}
          color="slate"
        />
        <ScoreCard 
          label="With Quality Data" 
          value={`${stats.withData} (${stats.total > 0 ? Math.round(stats.withData / stats.total * 100) : 0}%)`}
          icon={<Gem className="w-4 h-4" />}
          color="purple"
        />
        <ScoreCard 
          label="Avg Quality Score" 
          value={stats.avgScore.toFixed(1)}
          icon={<Star className="w-4 h-4" />}
          color="amber"
        />
        <ScoreCard 
          label="Top Tier (70+)" 
          value={stats.topQuality}
          icon={<Award className="w-4 h-4" />}
          color="emerald"
        />
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sort Mode */}
          <div className="flex-1">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'quality', label: 'Quality Score', icon: Star },
                { key: 'followers', label: 'Smart Followers', icon: Users },
                { key: 'ethos', label: 'Ethos Score', icon: Award },
                { key: 'kaito', label: 'Kaito SF', icon: TrendingUp }
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSortMode(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    sortMode === key
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Threshold */}
          <div className="lg:w-64">
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Min Quality Score</label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="5"
                value={minQuality}
                onChange={(e) => setMinQuality(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-purple-400 font-mono font-bold w-8">{minQuality}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            Showing <span className="text-purple-400 font-bold">{sortedData.length}</span> prospects
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Filter className="w-3 h-3" />
            Filtered from {data.length} total
          </div>
        </div>
      </div>

      {/* Whale Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedData.slice(0, 40).map((whale) => (
          <div 
            key={whale.id} 
            className="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 rounded-lg p-5 cursor-pointer"
            onClick={() => setSelectedUser(whale)}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-200">@{whale.x_handle || 'unknown'}</h4>
                <p className="text-xs text-slate-500 font-mono">TG: @{whale.telegram_handle || 'N/A'}</p>
              </div>
              {whale.x_link && (
                <a 
                  href={whale.x_link} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Quality Score Badge */}
            <div className={`rounded-lg p-3 mb-4 border ${getQualityBg(whale.quality_score)}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-mono">Quality Score</span>
                <span className={`text-xl font-bold font-mono ${getQualityColor(whale.quality_score)}`}>
                  {whale.quality_score.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 rounded p-2">
                <span className="text-slate-500 block">Smart Followers</span>
                <span className="text-slate-200 font-mono font-bold">{whale.smart_followers.toLocaleString()}</span>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <span className="text-slate-500 block">Ethos</span>
                <span className="text-slate-200 font-mono font-bold">{whale.ethos_score || '—'}</span>
              </div>
            </div>

            {/* Location */}
            {whale.location && (
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                <span>📍</span>
                <span>{whale.location}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedData.length > 40 && (
        <div className="text-center py-4 text-sm text-slate-500">
          Showing 40 of {sortedData.length} prospects
        </div>
      )}

      {sortedData.length === 0 && (
        <div className="text-center py-20 text-slate-600 font-mono">
          No prospects match current filters.
        </div>
      )}

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">@{selectedUser.x_handle}</h3>
                <p className="text-sm text-slate-500">Whale Profile</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full border font-bold ${getQualityBg(selectedUser.quality_score)} ${getQualityColor(selectedUser.quality_score)}`}>
                {selectedUser.quality_score.toFixed(1)} Quality
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <ScoreCard label="Smart Followers" value={selectedUser.smart_followers.toLocaleString()} color="purple" size="sm" />
              <ScoreCard label="TG Handle" value={`@${selectedUser.telegram_handle || 'N/A'}`} color="blue" size="sm" />
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-3">InfoFi Intelligence</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Location</span>
                  <span className="text-slate-200">{selectedUser.location || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Ethos Score</span>
                  <span className="text-slate-200">{selectedUser.ethos_score || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Kaito SF</span>
                  <span className="text-slate-200">{selectedUser.kaito_sf || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Cookie Score</span>
                  <span className="text-slate-200">{selectedUser.cookie_score || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Followers</span>
                  <span className="text-slate-200">{selectedUser.followers?.toLocaleString() || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Engagement Rate</span>
                  <span className="text-slate-200">{selectedUser.engagement_rate ? `${selectedUser.engagement_rate}%` : '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
              {selectedUser.x_link && (
                <a 
                  href={selectedUser.x_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                  View Profile
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhaleHunterTab;
