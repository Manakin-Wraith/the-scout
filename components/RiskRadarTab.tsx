import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Filter, ExternalLink, Eye, TrendingDown, Loader2 } from 'lucide-react';
import RiskBadge from './RiskBadge';
import ScoreCard from './ScoreCard';
import { getEnrichedDealTakers } from '../services/supabaseService';

type FilterMode = 'all' | 'critical' | 'warning' | 'clean';
type RiskLevel = 'critical' | 'warning' | 'clean';

interface EnrichedDealTakerRow {
  x_handle: string;
  total_earnings: number;
  total_posts: number;
  campaigns_participated: number;
  risk_level: RiskLevel;
  location: string | null;
  no_vpn: boolean | null;
  possible_bot: boolean | null;
  username_changes: number | null;
  ethos_score: number | null;
  kaito_sf: number | null;
}

const RiskRadarTab: React.FC = () => {
  const [data, setData] = useState<EnrichedDealTakerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedUser, setSelectedUser] = useState<EnrichedDealTakerRow | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const enriched = await getEnrichedDealTakers();
        setData(enriched.map((d: any) => ({
          x_handle: d.X_Handle || '',
          total_earnings: d.Total_Earnings || 0,
          total_posts: d.Total_Posts || 0,
          campaigns_participated: d.Campaigns_Participated || 0,
          risk_level: d.riskLevel || 'clean',
          location: d.infofi?.location || null,
          no_vpn: d.infofi?.noVPN ?? null,
          possible_bot: d.infofi?.possibleBot ?? null,
          username_changes: d.infofi?.usernameChanges ?? null,
          ethos_score: d.infofi?.ethosScore || null,
          kaito_sf: d.infofi?.kaitoSF || null
        })));
      } catch (error) {
        console.error('Failed to load enriched deal takers:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const withData = data.filter(d => d.location !== null || d.no_vpn !== null).length;
    return { total: data.length, withData };
  }, [data]);

  const filteredData = useMemo(() => {
    if (filterMode === 'all') return data;
    return data.filter(dt => dt.risk_level === filterMode);
  }, [data, filterMode]);

  const riskBreakdown = useMemo(() => ({
    critical: data.filter(dt => dt.risk_level === 'critical').length,
    warning: data.filter(dt => dt.risk_level === 'warning').length,
    clean: data.filter(dt => dt.risk_level === 'clean').length
  }), [data]);

  const potentialWastedBudget = useMemo(() => {
    return data
      .filter(dt => dt.risk_level === 'critical' || dt.risk_level === 'warning')
      .reduce((sum, dt) => sum + dt.total_earnings, 0);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <span className="ml-3 text-slate-400">Loading risk analysis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard 
          label="Total Analyzed" 
          value={stats.total}
          icon={<Eye className="w-4 h-4" />}
          color="slate"
        />
        <ScoreCard 
          label="With InfoFi Data" 
          value={`${stats.withData} (${stats.total > 0 ? Math.round(stats.withData / stats.total * 100) : 0}%)`}
          icon={<ShieldCheck className="w-4 h-4" />}
          color="blue"
        />
        <ScoreCard 
          label="High Risk Flagged" 
          value={riskBreakdown.critical + riskBreakdown.warning}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="amber"
        />
        <ScoreCard 
          label="At-Risk Budget" 
          value={`$${potentialWastedBudget.toLocaleString()}`}
          icon={<TrendingDown className="w-4 h-4" />}
          color="amber"
        />
      </div>

      {/* Risk Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Risk Distribution</h3>
        <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
          {riskBreakdown.critical > 0 && (
            <div 
              className="bg-red-500/80 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${data.length > 0 ? (riskBreakdown.critical / data.length) * 100 : 0}%` }}
            >
              {riskBreakdown.critical}
            </div>
          )}
          {riskBreakdown.warning > 0 && (
            <div 
              className="bg-amber-500/80 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${data.length > 0 ? (riskBreakdown.warning / data.length) * 100 : 0}%` }}
            >
              {riskBreakdown.warning}
            </div>
          )}
          <div 
            className="bg-emerald-500/80 flex items-center justify-center text-xs font-bold text-white flex-1"
          >
            {riskBreakdown.clean}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Clean</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">Filter by risk:</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'critical', 'warning', 'clean'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMode === mode
                  ? mode === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : mode === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : mode === 'clean' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {mode === 'all' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              <span className="ml-1 opacity-60">
                ({mode === 'all' ? data.length : riskBreakdown[mode as RiskLevel]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase">Handle</th>
                <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase">Risk</th>
                <th className="text-right p-4 text-xs font-mono text-slate-500 uppercase">Earnings</th>
                <th className="text-right p-4 text-xs font-mono text-slate-500 uppercase">Posts</th>
                <th className="text-center p-4 text-xs font-mono text-slate-500 uppercase">VPN</th>
                <th className="text-center p-4 text-xs font-mono text-slate-500 uppercase">Name Changes</th>
                <th className="text-center p-4 text-xs font-mono text-slate-500 uppercase">Bot Flag</th>
                <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase">Location</th>
                <th className="text-center p-4 text-xs font-mono text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredData.slice(0, 50).map((dt) => (
                <tr 
                  key={dt.x_handle} 
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(dt)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">@{dt.x_handle}</span>
                      <a 
                        href={`https://x.com/${dt.x_handle}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                  <td className="p-4">
                    <RiskBadge level={dt.risk_level} size="sm" />
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400">${dt.total_earnings.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-slate-400">{dt.total_posts}</td>
                  <td className="p-4 text-center">
                    {dt.no_vpn !== null ? (
                      dt.no_vpn 
                        ? <span className="text-emerald-400">✓</span>
                        : <span className="text-red-400">VPN</span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-4 text-center font-mono">
                    {dt.username_changes !== null ? (
                      <span className={(dt.username_changes || 0) > 5 ? 'text-amber-400' : 'text-slate-400'}>
                        {dt.username_changes}
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-4 text-center">
                    {dt.possible_bot !== null ? (
                      dt.possible_bot 
                        ? <span className="text-red-400 font-bold">🤖</span>
                        : <span className="text-emerald-400">✓</span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {dt.location || '—'}
                  </td>
                  <td className="p-4 text-center">
                    {/* Actions placeholder */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length > 50 && (
          <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-800">
            Showing 50 of {filteredData.length} results
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">@{selectedUser.x_handle}</h3>
                <p className="text-sm text-slate-500">Risk Assessment Details</p>
              </div>
              <RiskBadge level={selectedUser.risk_level} size="lg" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <ScoreCard label="Total Earnings" value={`$${selectedUser.total_earnings.toLocaleString()}`} color="emerald" size="sm" />
              <ScoreCard label="Total Posts" value={selectedUser.total_posts} color="blue" size="sm" />
              <ScoreCard label="Campaigns" value={selectedUser.campaigns_participated} color="purple" size="sm" />
              <ScoreCard 
                label="Username Changes" 
                value={selectedUser.username_changes ?? '—'} 
                color={(selectedUser.username_changes || 0) > 5 ? 'amber' : 'slate'} 
                size="sm" 
              />
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-3">InfoFi Intelligence</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-slate-200">{selectedUser.location || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VPN Status</span>
                  <span className={selectedUser.no_vpn ? 'text-emerald-400' : 'text-red-400'}>
                    {selectedUser.no_vpn ? 'No VPN Detected' : 'VPN Detected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bot Detection</span>
                  <span className={selectedUser.possible_bot ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedUser.possible_bot ? 'Possible Bot' : 'Human'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ethos Score</span>
                  <span className="text-slate-200">{selectedUser.ethos_score || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kaito SF</span>
                  <span className="text-slate-200">{selectedUser.kaito_sf || '—'}</span>
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
              <a 
                href={`https://x.com/${selectedUser.x_handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors text-center"
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

export default RiskRadarTab;
