import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, showLabel = true, size = 'md' }) => {
  const config = {
    critical: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      icon: ShieldAlert,
      label: 'Critical'
    },
    warning: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      icon: AlertTriangle,
      label: 'Warning'
    },
    clean: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      icon: ShieldCheck,
      label: 'Clean'
    }
  };

  const sizeConfig = {
    sm: { icon: 'w-3 h-3', text: 'text-[10px]', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
    md: { icon: 'w-4 h-4', text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1.5' },
    lg: { icon: 'w-5 h-5', text: 'text-sm', padding: 'px-3 py-1.5', gap: 'gap-2' }
  };

  const { bg, border, text, icon: Icon, label } = config[level];
  const { icon: iconSize, text: textSize, padding, gap } = sizeConfig[size];

  return (
    <span className={`inline-flex items-center ${gap} ${padding} ${bg} ${text} border ${border} rounded-full font-medium ${textSize}`}>
      <Icon className={iconSize} />
      {showLabel && <span>{label}</span>}
    </span>
  );
};

export default RiskBadge;
