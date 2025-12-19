import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Users, DollarSign, Eye, Heart, MessageCircle, Repeat2, TrendingUp, ChevronDown, ChevronUp, X, Calendar, FileText, BarChart3 } from 'lucide-react';
import { CampaignProfile, CampaignCreator, MonthlyStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CampaignDetailPanelProps {
  campaign: CampaignProfile;
  onClose: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (num: number): string => {
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CreatorRow: React.FC<{ creator: CampaignCreator; index: number }> = ({ creator, index }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border-b border-slate-700 last:border-b-0">
      <div 
        className="flex items-center justify-between p-4 hover:bg-slate-700/30 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-slate-500 text-sm w-6">{index + 1}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-medium">@{creator.username}</h4>
              <a 
                href={creator.xLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-400 text-sm">{creator.months.length} month{creator.months.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-4 text-right flex-1">
          <div>
            <p className="text-white font-medium">{creator.posts}</p>
            <p className="text-slate-500 text-xs">Posts</p>
          </div>
          <div>
            <p className="text-emerald-400 font-medium">{formatCurrency(creator.budget)}</p>
            <p className="text-slate-500 text-xs">Budget</p>
          </div>
          <div>
            <p className="text-blue-400 font-medium">{formatNumber(creator.impressions)}</p>
            <p className="text-slate-500 text-xs">Impr.</p>
          </div>
          <div>
            <p className="text-purple-400 font-medium">{formatNumber(creator.engagement)}</p>
            <p className="text-slate-500 text-xs">Eng.</p>
          </div>
          <div>
            <p className="text-amber-400 font-medium">${creator.cpm.toFixed(2)}</p>
            <p className="text-slate-500 text-xs">CPM</p>
          </div>
        </div>
        
        <div className="ml-4">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="bg-slate-800/50 px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase">
                  <th className="text-left py-2 px-2">Month</th>
                  <th className="text-right py-2 px-2">Posts</th>
                  <th className="text-right py-2 px-2">Budget</th>
                  <th className="text-right py-2 px-2">Impressions</th>
                  <th className="text-right py-2 px-2">Likes</th>
                  <th className="text-right py-2 px-2">Reposts</th>
                  <th className="text-right py-2 px-2">Replies</th>
                  <th className="text-right py-2 px-2">Eng. Rate</th>
                  <th className="text-right py-2 px-2">CPM</th>
                </tr>
              </thead>
              <tbody>
                {creator.months.map((month, idx) => (
                  <tr key={idx} className="border-t border-slate-700/50 text-slate-300">
                    <td className="py-2 px-2 text-white">{month.month}</td>
                    <td className="text-right py-2 px-2">{month.posts}</td>
                    <td className="text-right py-2 px-2 text-emerald-400">{formatCurrency(month.budget)}</td>
                    <td className="text-right py-2 px-2">{formatNumber(month.impressions)}</td>
                    <td className="text-right py-2 px-2">{formatNumber(month.likes)}</td>
                    <td className="text-right py-2 px-2">{formatNumber(month.reposts)}</td>
                    <td className="text-right py-2 px-2">{formatNumber(month.replies)}</td>
                    <td className="text-right py-2 px-2">{month.engagementRate.toFixed(2)}%</td>
                    <td className="text-right py-2 px-2 text-amber-400">${month.cpm.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const CampaignDetailPanel: React.FC<CampaignDetailPanelProps> = ({ campaign, onClose }) => {
  const [activeTab, setActiveTab] = useState<'creators' | 'monthly'>('creators');

  // Prepare chart data
  const chartData = campaign.monthlyBreakdown.map(m => ({
    month: m.month,
    Budget: m.budget,
    Impressions: Math.round(m.impressions / 1000), // Show in thousands
    Engagement: m.engagement
  }));

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto w-full max-w-5xl bg-slate-900 shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Campaigns</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{campaign.campaignName}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  {campaign.startMonth} → {campaign.endMonth}
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-sm">
                  <FileText className="w-4 h-4" />
                  {campaign.durationMonths} months
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 p-6 bg-slate-800/50 border-b border-slate-700">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(campaign.totalBudget)}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Creators</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{campaign.totalCreators}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Posts</span>
            </div>
            <p className="text-2xl font-bold text-white">{campaign.totalPosts}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Impressions</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{formatNumber(campaign.totalImpressions)}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Avg CPM</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">${campaign.avgCPM.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-slate-800/30 border-b border-slate-700">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{formatNumber(campaign.totalEngagement)}</p>
            <p className="text-slate-500 text-sm">Total Engagement</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-pink-400">{formatNumber(campaign.totalLikes)}</p>
            <p className="text-slate-500 text-sm">Likes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-400">{formatNumber(campaign.totalReposts)}</p>
            <p className="text-slate-500 text-sm">Reposts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">{formatNumber(campaign.totalReplies)}</p>
            <p className="text-slate-500 text-sm">Replies</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{campaign.avgEngagementRate.toFixed(2)}%</p>
            <p className="text-slate-500 text-sm">Avg Eng. Rate</p>
          </div>
        </div>

        {/* Monthly Chart */}
        {campaign.monthlyBreakdown.length > 1 && (
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Performance</h3>
            <div className="h-64 bg-slate-800 rounded-xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend />
                  <Bar dataKey="Budget" fill="#10b981" name="Budget ($)" />
                  <Bar dataKey="Impressions" fill="#3b82f6" name="Impressions (K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'creators' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('creators')}
          >
            Creator Breakdown ({campaign.creators.length})
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'monthly' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly Stats ({campaign.monthlyBreakdown.length})
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'creators' ? (
            <div className="p-6">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                {campaign.creators.map((creator, index) => (
                  <CreatorRow key={creator.username} creator={creator} index={index} />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-xs uppercase">
                      <th className="text-left py-3 px-4">Month</th>
                      <th className="text-center py-3 px-4">Creators</th>
                      <th className="text-center py-3 px-4">Posts</th>
                      <th className="text-right py-3 px-4">Budget</th>
                      <th className="text-right py-3 px-4">Impressions</th>
                      <th className="text-right py-3 px-4">Engagement</th>
                      <th className="text-right py-3 px-4">CPM</th>
                      <th className="text-right py-3 px-4">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {campaign.monthlyBreakdown.map((month, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{month.month}</td>
                        <td className="py-3 px-4 text-center text-purple-400">{month.creators}</td>
                        <td className="py-3 px-4 text-center text-slate-300">{month.posts}</td>
                        <td className="py-3 px-4 text-right text-emerald-400">{formatCurrency(month.budget)}</td>
                        <td className="py-3 px-4 text-right text-blue-400">{formatNumber(month.impressions)}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{formatNumber(month.engagement)}</td>
                        <td className="py-3 px-4 text-right text-amber-400">${month.cpm.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{month.engagementRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPanel;
