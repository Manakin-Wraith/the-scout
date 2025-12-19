import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, UserPlus, Filter, Loader2 } from 'lucide-react';
import { getDormantInfluencers } from '../services/supabaseService';

interface DormantRow {
  telegram_id: string;
  telegram_handle: string;
  x_link: string;
  smart_followers: number;
  submitted_at: string;
}

const GoldmineTab: React.FC = () => {
  const [data, setData] = useState<DormantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerThreshold, setFollowerThreshold] = useState(500);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dormants = await getDormantInfluencers();
        setData(dormants.map((d: any) => ({
          telegram_id: d.telegramId || '',
          telegram_handle: d.TG_Handle || '',
          x_link: d.xLink || '',
          smart_followers: d.Smart_Followers || 0,
          submitted_at: d.submittedAt || new Date().toISOString()
        })));
      } catch (error) {
        console.error('Failed to load dormants:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(i => i.smart_followers >= followerThreshold);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-slate-400">Loading dormant influencers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-slate-800 rounded-lg">
            <Filter className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-slate-200 font-bold text-sm">Follower Threshold</h3>
            <p className="text-slate-500 text-xs">Filter by influence size</p>
          </div>
        </div>
        <div className="flex-1 w-full md:max-w-md">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
             <span>500</span>
             <span className="text-amber-500 font-bold">{followerThreshold}+ Smart Followers</span>
             <span>2000</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2000" 
            step="50"
            value={followerThreshold}
            onChange={(e) => setFollowerThreshold(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
        <div className="text-right min-w-[120px]">
           <span className="block text-2xl font-bold text-slate-100">{filteredData.length}</span>
           <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Prospects</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredData.map((item) => (
          <div key={item.telegram_id} className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 rounded-lg p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={item.x_link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            <div className="mb-4">
              <h4 className="text-lg font-bold text-slate-200">@{item.telegram_handle || 'Unknown'}</h4>
              <p className="text-xs text-slate-500 font-mono">ID: {item.telegram_id}</p>
            </div>

            <div className="bg-slate-950 rounded p-3 mb-4 border border-slate-800">
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-400 uppercase font-mono">Smart Followers</span>
                <span className="text-amber-500 font-bold font-mono">{item.smart_followers}</span>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs font-medium transition-colors">
                  <Copy className="w-3 h-3" /> Script
                </button>
                <button className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded text-xs font-medium transition-colors">
                  <UserPlus className="w-3 h-3" /> Activate
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-600 font-mono">Joined: {new Date(item.submitted_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
      
      {filteredData.length === 0 && (
        <div className="text-center py-20 text-slate-600 font-mono">
          No dormant influencers found with current filters.
        </div>
      )}
    </div>
  );
};

export default GoldmineTab;