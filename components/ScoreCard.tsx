import React from 'react';

interface ScoreCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  suffix?: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ 
  label, 
  value, 
  icon, 
  color = 'slate',
  size = 'md',
  suffix = ''
}) => {
  const colorConfig = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    slate: 'text-slate-300 bg-slate-800/50 border-slate-700',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  };

  const sizeConfig = {
    sm: { padding: 'p-2', valueText: 'text-lg', labelText: 'text-[10px]' },
    md: { padding: 'p-3', valueText: 'text-xl', labelText: 'text-xs' }
  };

  const { padding, valueText, labelText } = sizeConfig[size];

  return (
    <div className={`${padding} rounded-lg border ${colorConfig[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`${labelText} uppercase font-mono text-slate-500`}>{label}</span>
        {icon && <span className="opacity-60">{icon}</span>}
      </div>
      <div className={`${valueText} font-bold font-mono`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="text-sm ml-1 opacity-60">{suffix}</span>}
      </div>
    </div>
  );
};

export default ScoreCard;
