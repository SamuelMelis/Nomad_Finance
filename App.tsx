import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { DashboardTab } from './components/DashboardTab';
import { ExpensesTab } from './components/ExpensesTab';
import { IncomeTab } from './components/IncomeTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { Auth } from './components/Auth';
import { LayoutDashboard, Wallet, PiggyBank, BarChart3, Settings, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'expenses' | 'income' | 'reports' | 'settings';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { loading, session, isDemoMode, isTabBarHidden, triggerHaptic, isTelegramEnv, session: authSession } = useFinance();

  const handleTabChange = (tab: Tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-[#18181b]" size={32} />
        </div>
    );
  }

  // Show Auth if:
  // 1. No Session exists
  // 2. AND Not in Demo Mode (Local fallback)
  // If we are in Demo Mode, we bypass auth.
  const showAuth = !authSession && !isDemoMode;

  if (showAuth) {
      return <Auth />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'expenses': return <ExpensesTab />;
      case 'income': return <IncomeTab />;
      case 'reports': return <ReportsTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#18181b] font-sans selection:bg-[#18181b] selection:text-white">
      <div className="max-w-md mx-auto min-h-screen relative bg-white border-x border-gray-50 shadow-2xl">
        
        {/* Main Content Area - Reduced Padding */}
        <main 
          className="px-5 min-h-screen"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.75rem)' }}
        >
          {renderTab()}
        </main>

        {/* Bottom Navigation */}
        {!isTabBarHidden && (
            <nav 
              className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 pt-3 px-6 z-50 max-w-md mx-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
            >
            <div className="flex justify-between items-center">
                
                <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => handleTabChange('dashboard')} 
                icon={LayoutDashboard} 
                label="Overview" 
                />
                
                <NavButton 
                active={activeTab === 'expenses'} 
                onClick={() => handleTabChange('expenses')} 
                icon={Wallet} 
                label="Spent" 
                />
                
                <NavButton 
                active={activeTab === 'income'} 
                onClick={() => handleTabChange('income')} 
                icon={PiggyBank} 
                label="Earn" 
                />
                
                <NavButton 
                active={activeTab === 'reports'} 
                onClick={() => handleTabChange('reports')} 
                icon={BarChart3} 
                label="Stats" 
                />

                <NavButton 
                active={activeTab === 'settings'} 
                onClick={() => handleTabChange('settings')} 
                icon={Settings} 
                label="Set" 
                />
                
            </div>
            </nav>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center gap-1 min-w-[3.5rem]"
  >
    <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#18181b] text-white shadow-md shadow-[#18181b]/20 transform -translate-y-1' : 'text-gray-300 group-hover:text-[#18181b] group-hover:bg-gray-50'}`}>
       <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[9px] font-bold tracking-widest uppercase transition-colors ${active ? 'text-[#18181b]' : 'text-transparent group-hover:text-gray-300'}`}>{label}</span>
  </button>
);

const App: React.FC = () => {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
};

export default App;