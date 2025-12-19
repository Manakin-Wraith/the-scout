import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface ScoreTooltipProps {
  score: number;
  size?: 'sm' | 'md';
}

const ScoreTooltip: React.FC<ScoreTooltipProps> = ({ score, size = 'sm' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
        className="text-slate-500 hover:text-slate-300 transition-colors ml-1.5 p-1 -m-1 rounded"
        aria-label="Score explanation"
      >
        <HelpCircle className={iconSize} />
      </button>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs">
          <div className="font-bold text-slate-200 mb-2">Scout Score: {score.toFixed(0)}</div>
          
          <div className="space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Ethos Score</span>
              <span className="text-slate-300">up to ~40 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Kaito Rank</span>
              <span className="text-slate-300">up to 100 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Cookie Rank</span>
              <span className="text-slate-300">up to 100 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Verified</span>
              <span className="text-slate-300">+20 pts</span>
            </div>
            <div className="flex justify-between">
              <span>No VPN</span>
              <span className="text-slate-300">+10 pts</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-700 text-slate-500">
            <span className="text-red-400">⚠</span> Bots = 0 score
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-8 border-transparent border-t-slate-700"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreTooltip;
