import React, { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Target, AlertTriangle, Filter, Loader2 } from 'lucide-react';
import { RiskLevel } from '../types';
import { getEnrichedDealTakers } from '../services/supabaseService';
import ScoreCard from './ScoreCard';
import RiskBadge from './RiskBadge';

interface DealTakerData {
  X_Handle: string;
  Total_Earnings: number;
  Total_Posts: number;
  Campaigns_Participated: number;
  riskLevel: RiskLevel;
  infofi: any;
}

const DealAnalyzerTab: React.FC = () => {
  const [enrichedData, setEnrichedData] = useState<DealTakerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightRisk, setHighlightRisk] = useState(true);
  const [minEarnings, setMinEarnings] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getEnrichedDealTakers();
        setEnrichedData(data as DealTakerData[]);
      } catch (error) {
        console.error('Failed to load deal takers:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const chartData = useMemo(() => {
    return enrichedData
      .filter(dt => dt.Total_Earnings >= minEarnings)
      .map(dt => ({
        x: dt.Total_Posts,
        y: dt.Total_Earnings,
        handle: dt.X_Handle,
        campaigns: dt.Campaigns_Participated,
        riskLevel: dt.riskLevel,
        hasInfoFi: dt.infofi !== null,
        cpm: dt.Total_Posts > 0 ? Math.round(dt.Total_Earnings / dt.Total_Posts) : 0
      }));
  }, [enrichedData, minEarnings]);

  const getRiskColor = (level: RiskLevel): string => {
    if (!highlightRisk) return '#64748b';
    switch (level) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'clean': return '#10b981';
    }
  };

  const stats = useMemo(() => {
    const totalBudget = enrichedData.reduce((sum, dt) => sum + dt.Total_Earnings, 0);
    const atRiskBudget = enrichedData
      .filter(dt => dt.riskLevel === 'critical' || dt.riskLevel === 'warning')
      .reduce((sum, dt) => sum + dt.Total_Earnings, 0);
    const avgCPP = enrichedData.length > 0 
      ? Math.round(totalBudget / enrichedData.reduce((sum, dt) => sum + dt.Total_Posts, 0))
      : 0;
    const topPerformer = enrichedData.reduce((best, dt) => 
      dt.Total_Earnings > (best?.Total_Earnings || 0) ? dt : best, enrichedData[0]);
    
    return { totalBudget, atRiskBudget, avgCPP, topPerformer };
  }, [enrichedData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white">@{data.handle}</span>
            <RiskBadge level={data.riskLevel} size="sm" showLabel={false} />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Earnings:</span>
              <span className="text-emerald-400 font-mono">${data.y.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Posts:</span>
              <span className="text-slate-200 font-mono">{data.x}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">$/Post:</span>
              <span className="text-blue-400 font-mono">${data.cpm}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Campaigns:</span>
              <span className="text-slate-200 font-mono">{data.campaigns}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-slate-400">Loading deal analysis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard 
          label="Total Budget Spent" 
          value={`$${stats.totalBudget.toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
          color="emerald"
        />
        <ScoreCard 
          label="At-Risk Budget" 
          value={`$${stats.atRiskBudget.toLocaleString()}`}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="amber"
        />
        <ScoreCard 
          label="Avg $/Post" 
          value={`$${stats.avgCPP}`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
        />
        <ScoreCard 
          label="Top Earner" 
          value={`@${stats.topPerformer?.X_Handle || 'N/A'}`}
          icon={<Target className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* Chart Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={highlightRisk}
              onChange={(e) => setHighlightRisk(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">Highlight Risk Levels</span>
          </label>
        </div>
        
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-sm text-slate-400">Min Earnings:</span>
          <input 
            type="range" 
            min="0" 
            max="5000" 
            step="100"
            value={minEarnings}
            onChange={(e) => setMinEarnings(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-emerald-400 font-mono font-bold w-16">${minEarnings}</span>
        </div>

        <div className="text-sm text-slate-500">
          Showing <span className="text-emerald-400 font-bold">{chartData.length}</span> creators
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Budget vs. Output Analysis</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Posts" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'Total Posts', position: 'bottom', offset: 40, fill: '#64748b' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Earnings" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Total Earnings ($)', angle: -90, position: 'left', offset: 40, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Creators" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getRiskColor(entry.riskLevel)}
                    opacity={entry.hasInfoFi ? 1 : 0.4}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        {highlightRisk && (
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-400">Critical Risk</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">Warning</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400">Clean</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-slate-500 opacity-40"></span>
              <span className="text-slate-400">No InfoFi Data</span>
            </div>
          </div>
        )}
      </div>

      {/* Top Performers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Top Performers by Efficiency</h3>
          <p className="text-xs text-slate-500 mt-1">Sorted by earnings per post ($/post)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase">Rank</th>
                <th className="text-left p-4 text-xs font-mono text-slate-500 uppercase">Handle</th>
                <th className="text-center p-4 text-xs font-mono text-slate-500 uppercase">Risk</th>
                <th className="text-right p-4 text-xs font-mono text-slate-500 uppercase">$/Post</th>
                <th className="text-right p-4 text-xs font-mono text-slate-500 uppercase">Earnings</th>
                <th className="text-right p-4 text-xs font-mono text-slate-500 uppercase">Posts</th>
                <th className="text-right p-4 text-xs font-mono text-slate-500 uppercase">Campaigns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {chartData
                .filter(d => d.x > 0)
                .sort((a, b) => b.cpm - a.cpm)
                .slice(0, 15)
                .map((dt, idx) => (
                  <tr key={dt.handle} className="hover:bg-slate-800/50">
                    <td className="p-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-4">
                      <span className="font-medium text-slate-200">@{dt.handle}</span>
                    </td>
                    <td className="p-4 text-center">
                      <RiskBadge level={dt.riskLevel} size="sm" showLabel={false} />
                    </td>
                    <td className="p-4 text-right font-mono text-blue-400 font-bold">${dt.cpm}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">${dt.y.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono text-slate-400">{dt.x}</td>
                    <td className="p-4 text-right font-mono text-slate-400">{dt.campaigns}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DealAnalyzerTab;
