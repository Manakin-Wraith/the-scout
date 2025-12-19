import React, { useState } from 'react';
import { CampaignProfile } from '../types';
import { ChevronRight, ArrowUpDown, Calendar, Users, FileText, DollarSign, Eye, TrendingUp } from 'lucide-react';
import CampaignDetailPanel from './CampaignDetailPanel';
import { CAMPAIGN_PROFILES } from '../campaignProfiles';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (num: number): string => {
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

type SortField = 'campaignName' | 'totalCreators' | 'totalPosts' | 'totalBudget' | 'totalImpressions' | 'avgCPM' | 'durationMonths';

const CampaignsTab: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>('totalBudget');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignProfile | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...CAMPAIGN_PROFILES].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const renderTh = (field: SortField, label: string, align: string = 'left') => (
    <th 
      className={`px-6 py-4 text-xs font-mono font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 text-${align}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-400' : 'opacity-50'}`} />
      </div>
    </th>
  );

  // Calculate totals for summary
  const totalBudget = CAMPAIGN_PROFILES.reduce((sum, c) => sum + c.totalBudget, 0);
  const totalImpressions = CAMPAIGN_PROFILES.reduce((sum, c) => sum + c.totalImpressions, 0);
  const totalCreators = new Set(CAMPAIGN_PROFILES.flatMap(c => c.creators.map(cr => cr.username.toLowerCase()))).size;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Total Campaigns</span>
          </div>
          <p className="text-2xl font-bold text-white">{CAMPAIGN_PROFILES.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Budget</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Total Impressions</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatNumber(totalImpressions)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Unique Creators</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{totalCreators}</p>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="font-mono text-slate-200 font-bold">Campaign Overview_</h3>
          <span className="text-xs font-mono text-slate-500">{CAMPAIGN_PROFILES.length} CAMPAIGNS</span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-950 border-b border-slate-800">
                {renderTh('campaignName', 'Campaign')}
                {renderTh('totalCreators', 'Creators', 'center')}
                {renderTh('totalPosts', 'Posts', 'center')}
                {renderTh('totalBudget', 'Budget', 'right')}
                {renderTh('totalImpressions', 'Impressions', 'right')}
                {renderTh('avgCPM', 'Avg CPM', 'right')}
                {renderTh('durationMonths', 'Duration', 'center')}
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedData.map((campaign, idx) => (
                <tr 
                  key={campaign.id} 
                  className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center mr-3">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-200">{campaign.campaignName}</span>
                        <p className="text-xs text-slate-500">{campaign.startMonth} → {campaign.endMonth}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
                      {campaign.totalCreators}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-slate-300">{campaign.totalPosts}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-emerald-400 font-mono font-bold">{formatCurrency(campaign.totalBudget)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-blue-400 font-mono">{formatNumber(campaign.totalImpressions)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-amber-400 font-mono">${campaign.avgCPM.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {campaign.durationMonths} mo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors ml-auto">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Detail Panel */}
      {selectedCampaign && (
        <CampaignDetailPanel 
          campaign={selectedCampaign} 
          onClose={() => setSelectedCampaign(null)} 
        />
      )}
    </div>
  );
};

export default CampaignsTab;
