import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { DollarSign, Users, UserX, UserPlus, TrendingUp, Search, CheckCircle, Trophy, Loader2, Globe, ChevronRight } from 'lucide-react';
import ContactedUsersModal from './ContactedUsersModal';
import { 
  getDealTakers, 
  getDormantInfluencers, 
  getNonInteractors,
  getScoutingStats,
  getProspectsByLocation,
  ScoutingStats,
  LocationStats
} from '../services/supabaseService';

interface DashboardStats {
  totalDeployment: number;
  activeRosterCount: number;
  hiddenInventoryCount: number;
  potentialLeadsCount: number;
  topEarners: { name: string; value: number }[];
}

interface DashboardProps {
  onNavigateToDiscovery?: (filter?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToDiscovery }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scoutingStats, setScoutingStats] = useState<ScoutingStats | null>(null);
  const [locations, setLocations] = useState<LocationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactedModal, setShowContactedModal] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [dealTakers, dormants, nonInteractors, scouting, locs] = await Promise.all([
          getDealTakers(),
          getDormantInfluencers(),
          getNonInteractors(),
          getScoutingStats(),
          getProspectsByLocation()
        ]);

        const totalDeployment = dealTakers.reduce((sum, item: any) => sum + (item.Total_Earnings || 0), 0);
        const sortedEarners = [...dealTakers].sort((a: any, b: any) => (b.Total_Earnings || 0) - (a.Total_Earnings || 0));
        const top5 = sortedEarners.slice(0, 5);
        const othersEarnings = sortedEarners.slice(5).reduce((sum, item: any) => sum + (item.Total_Earnings || 0), 0);

        setStats({
          totalDeployment,
          activeRosterCount: dealTakers.length,
          hiddenInventoryCount: dormants.length,
          potentialLeadsCount: nonInteractors.length,
          topEarners: [
            ...top5.map((d: any) => ({ name: d.X_Handle || 'unknown', value: d.Total_Earnings || 0 })),
            { name: 'Others', value: othersEarnings }
          ]
        });
        setScoutingStats(scouting);
        setLocations(locs);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#475569'];

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, onClick, isHighlighted, highlightColor = 'blue' }: any) => {
    const hasData = onClick && parseInt(String(value).replace(/,/g, '')) > 0;
    const highlightClasses = hasData 
      ? `bg-${highlightColor}-500/5 border-${highlightColor}-500/40 hover:border-${highlightColor}-400 hover:bg-${highlightColor}-500/10 shadow-lg shadow-${highlightColor}-500/10`
      : '';
    
    return (
      <div 
        className={`relative bg-slate-900 border border-slate-800 p-5 rounded-lg transition-all duration-300 ${
          onClick ? 'cursor-pointer' : ''
        } ${hasData ? highlightClasses : onClick ? 'hover:border-slate-600' : ''} ${
          hasData ? 'animate-pulse-subtle' : ''
        }`}
        onClick={onClick}
        style={hasData ? {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(15, 23, 42, 1) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(59, 130, 246, 0.1)'
        } : {}}
      >
        {/* Glow effect for highlighted cards */}
        {hasData && (
          <div className="absolute inset-0 rounded-lg bg-blue-500/5 animate-pulse" style={{ animationDuration: '2s' }} />
        )}
        
        <div className="relative flex justify-between items-start mb-2">
          <div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">{title}</p>
            <h2 className={`text-2xl font-bold ${hasData ? 'text-blue-100' : 'text-slate-100'}`}>{value}</h2>
          </div>
          <div className={`p-2 rounded-md bg-slate-950 border ${hasData ? 'border-blue-500/30 bg-blue-500/10' : 'border-slate-800'} ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="relative text-xs text-slate-500 font-mono">{subtext}</p>
        
        {/* Click indicator for highlighted cards */}
        {hasData && (
          <div className="relative mt-3 pt-2 border-t border-blue-500/20 flex items-center justify-between">
            <span className="text-xs text-blue-400 font-medium">View details</span>
            <ChevronRight className="w-4 h-4 text-blue-400 animate-bounce-x" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="ml-3 text-slate-400">Loading dashboard...</span>
      </div>
    );
  }

  const pieData = stats?.topEarners || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Row - Original Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Deployment" 
          value={`$${(stats?.totalDeployment || 0).toLocaleString()}`} 
          subtext="Total earnings distributed"
          icon={DollarSign}
          colorClass="text-emerald-500"
        />
        <StatCard 
          title="Active Roster" 
          value={stats?.activeRosterCount || 0} 
          subtext="Deal takers active now"
          icon={Users}
          colorClass="text-blue-500"
        />
        <StatCard 
          title="Hidden Inventory" 
          value={stats?.hiddenInventoryCount || 0} 
          subtext="Registered but dormant"
          icon={UserX}
          colorClass="text-amber-500"
        />
        <StatCard 
          title="Potential Leads" 
          value={stats?.potentialLeadsCount || 0} 
          subtext="In TG, not registered"
          icon={UserPlus}
          colorClass="text-purple-500"
        />
      </div>

      {/* NEW: Scouting Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Prospects" 
          value={(scoutingStats?.totalProspects || 0).toLocaleString()} 
          subtext="InfoFi profiles to scout"
          icon={Search}
          colorClass="text-cyan-500"
        />
        <StatCard 
          title="Verified Accounts" 
          value={(scoutingStats?.totalVerified || 0).toLocaleString()} 
          subtext="Blue check verified"
          icon={CheckCircle}
          colorClass="text-emerald-500"
        />
        <StatCard 
          title="Ranked Prospects" 
          value={(scoutingStats?.totalRanked || 0).toLocaleString()} 
          subtext="On Kaito/Cookie/Ethos"
          icon={Trophy}
          colorClass="text-amber-500"
        />
        <StatCard 
          title="Contacted" 
          value={(scoutingStats?.byStatus.contacted || 0).toLocaleString()} 
          subtext="Outreach in progress"
          icon={UserPlus}
          colorClass="text-blue-500"
          onClick={() => setShowContactedModal(true)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Concentration */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-lg flex flex-col">
           <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
             <TrendingUp className="w-4 h-4 text-emerald-500" /> Spend Concentration
           </h3>
           <div className="flex-1 flex flex-col md:flex-row items-center justify-around">
             <div className="w-full h-64 md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0', fontFamily: 'monospace' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
                    />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="w-full md:w-1/2 space-y-3 mt-4 md:mt-0">
                {pieData.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm font-mono border-b border-slate-800 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                      <span className="text-slate-300">@{entry.name}</span>
                    </div>
                    <span className="text-slate-100 font-bold">${entry.value.toLocaleString()}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* Funnel & Top Markets */}
        <div className="space-y-6">
           {/* Talent Funnel */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
             <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest mb-4">Talent Funnel</h3>
             <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Prospects to Scout</span>
                    <span>{(scoutingStats?.totalProspects || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Potential Leads</span>
                    <span>{stats?.potentialLeadsCount || 0}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Registered (Dormant)</span>
                    <span>{stats?.hiddenInventoryCount || 0}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Active Roster</span>
                    <span>{stats?.activeRosterCount || 0}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
             </div>
           </div>

           {/* Top Markets */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
             <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Globe className="w-4 h-4 text-cyan-500" /> Top Markets
             </h3>
             <div className="space-y-2">
                {locations.slice(0, 5).map((loc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm font-mono">
                    <span className="text-slate-400">{loc.location}</span>
                    <span className="text-slate-200">{loc.prospect_count.toLocaleString()}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* Contacted Users Modal */}
      <ContactedUsersModal 
        isOpen={showContactedModal}
        onClose={() => setShowContactedModal(false)}
        onViewAll={() => {
          setShowContactedModal(false);
          onNavigateToDiscovery?.('contacted');
        }}
      />
    </div>
  );
};

export default Dashboard;
