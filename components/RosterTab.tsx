import React, { useState, useEffect } from 'react';
import { CreatorProfile } from '../types';
import { CheckCircle, PauseCircle, ChevronRight, ArrowUpDown, Eye, Loader2 } from 'lucide-react';
import CreatorDetailPanel from './CreatorDetailPanel';
import AddToListDropdown from './AddToListDropdown';
import { dealTakerToShortlistItem } from '../services/shortlistService';
import { CREATOR_LOOKUP } from '../creatorProfiles';
import { getDealTakers } from '../services/supabaseService';

interface DealTakerRow {
  x_handle: string;
  total_earnings: number;
  total_posts: number;
  campaigns_participated: number;
}

const RosterTab: React.FC = () => {
  const [data, setData] = useState<DealTakerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof DealTakerRow>('total_earnings');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dealTakers = await getDealTakers();
        setData(dealTakers.map((d: any) => ({
          x_handle: d.X_Handle || '',
          total_earnings: d.Total_Earnings || 0,
          total_posts: d.Total_Posts || 0,
          campaigns_participated: d.Campaigns_Participated || 0
        })));
      } catch (error) {
        console.error('Failed to load deal takers:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getCreatorProfile = (xHandle: string): CreatorProfile | undefined => {
    const normalizedHandle = xHandle.toLowerCase();
    return CREATOR_LOOKUP.get(normalizedHandle);
  };

  const handleSort = (field: keyof DealTakerRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField] ?? 0;
    const bValue = b[sortField] ?? 0;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="ml-3 text-slate-400">Loading roster...</span>
      </div>
    );
  }

  const getStatus = (campaigns: number, earnings: number) => {
    if (campaigns > 15) return { label: 'Saturated', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: PauseCircle };
    if (earnings > 6000) return { label: 'High Ticket', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
    return { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CheckCircle };
  };

  const renderTh = (field: keyof DealTakerRow, label: string, align: string = 'left') => (
    <th 
      className={`px-6 py-4 text-xs font-mono font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 text-${align}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      </div>
    </th>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h3 className="font-mono text-slate-200 font-bold">Active Roster_</h3>
        <span className="text-xs font-mono text-slate-500">{data.length} RECORDS FOUND</span>
      </div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-950 border-b border-slate-800">
              {renderTh('x_handle', 'Handle')}
              {renderTh('total_earnings', 'Earnings', 'right')}
              {renderTh('campaigns_participated', 'Campaigns', 'center')}
              <th className="px-6 py-4 text-xs font-mono font-medium text-slate-400 uppercase tracking-wider text-right">Efficiency (Avg/Post)</th>
              <th className="px-6 py-4 text-xs font-mono font-medium text-slate-400 uppercase tracking-wider text-center">Status Signal</th>
              <th className="px-6 py-4 text-xs font-mono font-medium text-slate-400 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedData.map((influencer, idx) => {
              const status = getStatus(influencer.campaigns_participated, influencer.total_earnings);
              const efficiency = influencer.total_posts > 0 ? (influencer.total_earnings / influencer.total_posts) : 0;
              
              return (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center mr-3 text-xs font-bold text-slate-300">
                        {influencer.x_handle.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-200 font-mono">@{influencer.x_handle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-emerald-400 font-mono font-bold">${influencer.total_earnings.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {influencer.campaigns_participated}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-400">
                    ${Math.round(efficiency).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-transparent ${status.bg} ${status.color}`}>
                      <status.icon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {getCreatorProfile(influencer.x_handle) ? (
                        <button 
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={() => {
                            const profile = getCreatorProfile(influencer.x_handle);
                            if (profile) setSelectedCreator(profile);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">No data</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Creator Detail Panel */}
      {selectedCreator && (
        <CreatorDetailPanel 
          creator={selectedCreator} 
          onClose={() => setSelectedCreator(null)} 
        />
      )}
    </div>
  );
};

export default RosterTab;