import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Sparkles } from 'lucide-react';
import { getScoutAdvice } from '../services/geminiService';
import { DealTaker, DormantInfluencer } from '../types';

interface ScoutAIProps {
  dealTakers: DealTaker[];
  dormant: DormantInfluencer[];
}

const ScoutAI: React.FC<ScoutAIProps> = ({ dealTakers, dormant }) => {
  const [advice, setAdvice] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await getScoutAdvice(dealTakers, dormant);
    // Split by new lines and filter empty lines
    const lines = result.split('\n').filter(line => line.trim().length > 0);
    setAdvice(lines);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <h3 className="font-mono text-slate-100 font-bold text-sm uppercase tracking-wider">The Scout AI</h3>
        </div>
        <button 
          onClick={fetchAdvice}
          disabled={loading}
          className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3 min-h-[100px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-4 space-y-2 opacity-70">
            <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
            <span className="text-xs font-mono text-purple-300">Analyzing Roster Data...</span>
          </div>
        ) : (
          advice.map((item, idx) => (
            <div key={idx} className="flex gap-3 text-sm text-slate-300 font-mono items-start">
              <span className="text-purple-500 mt-1">▹</span>
              <p className="leading-relaxed">{item.replace(/^[-*•]\s*/, '')}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScoutAI;