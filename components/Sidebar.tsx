import React from 'react';
import { LayoutDashboard, Users, Pickaxe, UserPlus, TrendingUp, ShieldAlert, Gem, BarChart3, ClipboardList, Search } from 'lucide-react';
import { TabView } from '../types';

interface SidebarProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const NavItem = ({ tab, icon: Icon, label }: { tab: TabView, icon: any, label: string }) => (
    <button
      onClick={() => onTabChange(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        currentTab === tab 
          ? 'bg-slate-800 text-white shadow-lg border border-slate-700' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentTab === tab ? 'text-emerald-400' : 'group-hover:text-emerald-400/70'}`} />
      <span className="font-medium text-sm">{label}</span>
      {currentTab === tab && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>}
    </button>
  );

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
             <span className="text-white font-bold text-lg">🦅</span>
           </div>
           <div>
             <h1 className="font-bold text-slate-100 tracking-tight">The Scout</h1>
             <p className="text-[10px] text-slate-500 font-mono uppercase">Lunar Intelligence</p>
           </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-4 mb-2">Main Menu</div>
        <NavItem tab="dashboard" icon={LayoutDashboard} label="Overview" />
        <NavItem tab="roster" icon={Users} label="Active Roster" />
        
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">Analytics</div>
        <NavItem tab="campaigns" icon={TrendingUp} label="Campaigns" />
        
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">InfoFi Intelligence</div>
        <NavItem tab="riskradar" icon={ShieldAlert} label="Risk Radar" />
        <NavItem tab="whalehunter" icon={Gem} label="Whale Hunter" />
        <NavItem tab="dealanalyzer" icon={BarChart3} label="Deal Analyzer" />
        
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">Scouting</div>
        <NavItem tab="discovery" icon={Search} label="Discovery" />
        <NavItem tab="goldmine" icon={Pickaxe} label="The Goldmine" />
        <NavItem tab="onboarding" icon={UserPlus} label="Onboarding" />
        
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">Organization</div>
        <NavItem tab="shortlists" icon={ClipboardList} label="Shortlists" />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900 rounded p-3 flex items-center gap-3 border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-slate-400 font-mono">System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;