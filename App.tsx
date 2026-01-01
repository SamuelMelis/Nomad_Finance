import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { DashboardTab } from './components/DashboardTab';
import { ExpensesTab } from './components/ExpensesTab';
import { IncomeTab } from './components/IncomeTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { LayoutDashboard, Wallet, PiggyBank, BarChart3, Settings, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'expenses' | 'income' | 'reports' | 'settings';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { loading, session, isDemoMode, isTabBarHidden } = useFinance();

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-[#18181b]" size={32} />
        </div>
    );
  }

  // Allow render if we have a session OR we are in demo mode
  if (!session && !isDemoMode) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
            <div>
                <h2 className="text-xl font-bold text-[#18181b] mb-2">Authentication Required</h2>
                <p className="text-gray-500 text-sm">Unable to verify session or load demo mode.</p>
            </div>
        </div>
      );
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
        
        {/* Main Content Area */}
        <main className="px-6 pt-10 min-h-screen">
          {renderTab()}
        </main>

        {/* Bottom Navigation */}
        {!isTabBarHidden && (
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 pt-4 px-6 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center">
                
                <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={LayoutDashboard} 
                label="Overview" 
                />
                
                <NavButton 
                active={activeTab === 'expenses'} 
                onClick={() => setActiveTab('expenses')} 
                icon={Wallet} 
                label="Spent" 
                />
                
                <NavButton 
                active={activeTab === 'income'} 
                onClick={() => setActiveTab('income')} 
                icon={PiggyBank} 
                label="Earn" 
                />
                
                <NavButton 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
                icon={BarChart3} 
                label="Stats" 
                />

                <NavButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
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
    <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-[#18181b] text-white shadow-lg shadow-[#18181b]/20 transform -translate-y-1' : 'text-gray-300 group-hover:text-[#18181b] group-hover:bg-gray-50'}`}>
       <Icon size={20} strokeWidth={active ? 2.5 : 2} />
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