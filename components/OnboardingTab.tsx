import React, { useState, useEffect } from 'react';
import { Send, CheckSquare, Square, Copy, Loader2 } from 'lucide-react';
import { getNonInteractors } from '../services/supabaseService';

interface NonInteractorRow {
  user_id: string;
  telegram_username: string;
  first_name: string;
  last_name: string;
  join_date: string;
}

const OnboardingTab: React.FC = () => {
  const [data, setData] = useState<NonInteractorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const nonInteractors = await getNonInteractors();
        setData(nonInteractors.map((n: any) => ({
          user_id: n.User_ID || '',
          telegram_username: n.TG_Username || '',
          first_name: n.First_Name || '',
          last_name: n.Last_Name || '',
          join_date: n.Join_Date || ''
        })));
      } catch (error) {
        console.error('Failed to load non-interactors:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.user_id)));
    }
  };

  const selectedUsers = data.filter(u => selectedIds.has(u.user_id));
  const userTags = selectedUsers.map(u => `@${u.telegram_username}`).join(', ');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-slate-400">Loading leads...</span>
      </div>
    );
  }
  
  const generatedMessage = selectedIds.size > 0 
    ? `Hey ${userTags} — noticed you joined the Lunar Strategy group but haven't registered with the bot yet. 🦅\n\nWe have active campaigns for ADI Chain waiting for creators like you. \n\n👉 /register here to start earning.`
    : "Select users to generate a tag message.";

  const handleCopy = () => {
    if (selectedIds.size > 0) {
      navigator.clipboard.writeText(generatedMessage);
      alert("Message copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
      {/* List Panel */}
      <div className="w-full lg:w-2/3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <button onClick={toggleAll} className="text-slate-400 hover:text-white">
                {selectedIds.size === data.length && data.length > 0 ? <CheckSquare className="w-5 h-5 text-purple-500" /> : <Square className="w-5 h-5" />}
             </button>
             <h3 className="font-mono text-slate-200 font-bold">Unregistered Leads</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">{selectedIds.size} SELECTED</span>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {data.map((user) => (
            <div 
              key={user.user_id} 
              onClick={() => toggleSelection(user.user_id)}
              className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors border border-transparent ${selectedIds.has(user.user_id) ? 'bg-slate-800 border-purple-500/50' : 'hover:bg-slate-800/50 border-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedIds.has(user.user_id) ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                  {selectedIds.has(user.user_id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">@{user.telegram_username || 'No Handle'}</p>
                  <p className="text-xs text-slate-500">{user.first_name} {user.last_name}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-600">{user.join_date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Panel */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex-1 flex flex-col">
          <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-500" /> Action Center
          </h3>
          
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-y-auto mb-4">
            {generatedMessage}
          </div>

          <button 
            onClick={handleCopy}
            disabled={selectedIds.size === 0}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4" /> Copy Message
          </button>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
           <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Lead Quality</h4>
           <div className="flex items-center gap-4">
              <div className="flex-1">
                 <div className="text-2xl font-bold text-slate-200">{data.length}</div>
                 <div className="text-xs text-slate-500">Total Leads</div>
              </div>
              <div className="h-10 w-[1px] bg-slate-800"></div>
              <div className="flex-1">
                 <div className="text-2xl font-bold text-emerald-500">New</div>
                 <div className="text-xs text-slate-500">Status</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTab;