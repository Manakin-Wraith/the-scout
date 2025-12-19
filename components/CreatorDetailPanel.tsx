import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Users, DollarSign, Eye, Heart, MessageCircle, Repeat2, TrendingUp, ChevronDown, ChevronUp, X } from 'lucide-react';
import { CreatorProfile, CampaignDetail } from '../types';

interface CreatorDetailPanelProps {
  creator: CreatorProfile;
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

const CampaignRow: React.FC<{ campaign: CampaignDetail; index: number }> = ({ campaign, index }) => {
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
            <h4 className="text-white font-medium">{campaign.campaignName}</h4>
            <p className="text-slate-400 text-sm">{campaign.months.length} month{campaign.months.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-4 text-right flex-1">
          <div>
            <p className="text-white font-medium">{campaign.posts}</p>
            <p className="text-slate-500 text-xs">Posts</p>
          </div>
          <div>
            <p className="text-emerald-400 font-medium">{formatCurrency(campaign.budget)}</p>
            <p className="text-slate-500 text-xs">Earned</p>
          </div>
          <div>
            <p className="text-blue-400 font-medium">{formatNumber(campaign.impressions)}</p>
            <p className="text-slate-500 text-xs">Impr.</p>
          </div>
          <div>
            <p className="text-purple-400 font-medium">{formatNumber(campaign.engagement)}</p>
            <p className="text-slate-500 text-xs">Eng.</p>
          </div>
          <div>
            <p className="text-amber-400 font-medium">${campaign.cpm.toFixed(2)}</p>
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
                  <th className="text-right py-2 px-2">Impressions</th>
                  <th className="text-right py-2 px-2">Likes</th>
                  <th className="text-right py-2 px-2">Reposts</th>
                  <th className="text-right py-2 px-2">Replies</th>
                  <th className="text-right py-2 px-2">Eng. Rate</th>
                  <th className="text-right py-2 px-2">CPM</th>
                </tr>
              </thead>
              <tbody>
                {campaign.months.map((month, idx) => (
                  <tr key={idx} className="border-t border-slate-700/50 text-slate-300">
                    <td className="py-2 px-2 text-white">{month.month}</td>
                    <td className="text-right py-2 px-2">{month.posts}</td>
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

const CreatorDetailPanel: React.FC<CreatorDetailPanelProps> = ({ creator, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto w-full max-w-4xl bg-slate-900 shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Roster</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {creator.xHandle.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">@{creator.xHandle}</h2>
                {creator.xLink && (
                  <a 
                    href={creator.xLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
              {creator.telegramHandle && (
                <p className="text-slate-400 mt-1">TG: @{creator.telegramHandle}</p>
              )}
              {creator.smartFollowers > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">{formatNumber(creator.smartFollowers)} Smart Followers</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-800/50 border-b border-slate-700">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Lifetime Earnings</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(creator.lifetimeEarnings)}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Campaigns</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{creator.totalCampaigns}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Total Impressions</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{formatNumber(creator.totalImpressions)}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Heart className="w-4 h-4" />
              <span className="text-sm">Avg CPM</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">${creator.avgCPM.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-slate-800/30 border-b border-slate-700">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{creator.totalPosts}</p>
            <p className="text-slate-500 text-sm">Total Posts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{formatNumber(creator.totalEngagement)}</p>
            <p className="text-slate-500 text-sm">Total Engagement</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-pink-400">{formatNumber(creator.totalLikes)}</p>
            <p className="text-slate-500 text-sm">Likes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-400">{formatNumber(creator.totalReposts)}</p>
            <p className="text-slate-500 text-sm">Reposts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">{formatNumber(creator.totalReplies)}</p>
            <p className="text-slate-500 text-sm">Replies</p>
          </div>
        </div>
        
        {/* Campaigns List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Campaign Breakdown ({creator.campaigns.length})
            </h3>
            
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              {creator.campaigns.map((campaign, index) => (
                <CampaignRow key={campaign.campaignName} campaign={campaign} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDetailPanel;
