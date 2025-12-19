import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RosterTab from './components/RosterTab';
import GoldmineTab from './components/GoldmineTab';
import OnboardingTab from './components/OnboardingTab';
import CampaignsTab from './components/CampaignsTab';
import RiskRadarTab from './components/RiskRadarTab';
import WhaleHunterTab from './components/WhaleHunterTab';
import DealAnalyzerTab from './components/DealAnalyzerTab';
import ShortlistTab from './components/ShortlistTab';
import DiscoveryTab from './components/DiscoveryTab';
import { ShortlistProvider } from './contexts/ShortlistContext';
import { TabView } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'roster':
        return <RosterTab />;
      case 'goldmine':
        return <GoldmineTab />;
      case 'onboarding':
        return <OnboardingTab />;
      case 'campaigns':
        return <CampaignsTab />;
      case 'riskradar':
        return <RiskRadarTab />;
      case 'whalehunter':
        return <WhaleHunterTab />;
      case 'dealanalyzer':
        return <DealAnalyzerTab />;
      case 'shortlists':
        return <ShortlistTab />;
      case 'discovery':
        return <DiscoveryTab />;
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <ShortlistProvider>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
        <Sidebar currentTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="ml-64 p-8 min-h-screen">
        <header className="mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-1">
              {activeTab === 'dashboard' && 'Mission Control'}
              {activeTab === 'roster' && 'Talent Roster'}
              {activeTab === 'goldmine' && 'Hidden Inventory'}
              {activeTab === 'onboarding' && 'Lead Acquisition'}
              {activeTab === 'campaigns' && 'Campaign Analytics'}
              {activeTab === 'riskradar' && 'Risk Radar'}
              {activeTab === 'whalehunter' && 'Whale Hunter'}
              {activeTab === 'dealanalyzer' && 'Deal Analyzer'}
              {activeTab === 'shortlists' && 'Shortlists'}
              {activeTab === 'discovery' && 'Discovery'}
            </h2>
            <p className="text-slate-500 text-sm font-mono">
              {activeTab === 'dashboard' && 'Live operational status and health checks.'}
              {activeTab === 'roster' && 'Manage active deal takers and monitor saturation.'}
              {activeTab === 'goldmine' && 'Activate dormant influencers with high potential.'}
              {activeTab === 'onboarding' && 'Convert Telegram leads into registered agents.'}
              {activeTab === 'campaigns' && 'Track campaign performance and creator contributions.'}
              {activeTab === 'riskradar' && 'Identify and flag high-risk creators using InfoFi intelligence.'}
              {activeTab === 'whalehunter' && 'Discover high-quality dormant influencers with verified metrics.'}
              {activeTab === 'dealanalyzer' && 'Analyze budget allocation and creator efficiency.'}
              {activeTab === 'shortlists' && 'Organize and export curated lists of influencers.'}
              {activeTab === 'discovery' && 'Scout new talent from 34K+ InfoFi profiles worldwide.'}
            </p>
          </div>
          <div className="font-mono text-xs text-slate-600 text-right">
             <div className="mb-1">LUNAR STRATEGY INC.</div>
             <div>DATALINK: <span className="text-emerald-500">CONNECTED</span></div>
          </div>
        </header>

        {renderContent()}
        </main>
      </div>
    </ShortlistProvider>
  );
};

export default App;