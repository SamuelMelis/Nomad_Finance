import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Save, RefreshCw, ArrowRight, LogOut } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, signOut, isDemoMode } = useFinance();

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="pt-2 flex justify-between items-start">
        <div>
           <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-[#18181b] mb-2">Settings</h2>
              {isDemoMode && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md mb-2">Demo Mode</span>
              )}
           </div>
           <p className="text-sm text-gray-500 font-medium">Preferences & Configuration</p>
        </div>
        <button 
           onClick={signOut}
           className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-[#18181b] hover:text-white transition-all"
        >
           <LogOut size={20} />
        </button>
      </div>

      {/* Exchange Rate Card */}
      <section>
        <div className="flex items-center gap-3 mb-4">
           <RefreshCw size={18} className="text-[#18181b]" />
           <h3 className="font-bold text-[#18181b] text-sm uppercase tracking-wider">Exchange Rate</h3>
        </div>
        
        <div className="bg-gray-50 p-1 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#18181b] focus-within:border-transparent transition-all">
          <div className="bg-white rounded-xl px-4 py-4 flex items-center justify-between shadow-sm">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Base Currency</span>
               <span className="font-bold text-xl text-[#18181b]">1 USD</span>
             </div>
             <ArrowRight size={20} className="text-gray-300" />
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target (ETB)</span>
               <div className="flex items-baseline gap-1">
                 <input 
                   type="number"
                   value={settings.exchangeRate}
                   onChange={(e) => updateSettings({ exchangeRate: parseFloat(e.target.value) || 0 })}
                   className="w-24 text-right text-xl font-bold bg-transparent border-none p-0 focus:ring-0 outline-none text-[#18181b] placeholder-gray-300"
                   placeholder="0.00"
                 />
                 <span className="text-sm font-bold text-[#18181b]">ETB</span>
               </div>
             </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 px-1">Used for all currency conversions across the app.</p>
      </section>

      {/* Savings Goal */}
      <section>
        <div className="flex items-center gap-3 mb-4">
           <Save size={18} className="text-[#18181b]" />
           <h3 className="font-bold text-[#18181b] text-sm uppercase tracking-wider">Monthly Goal</h3>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Save size={64} />
           </div>
           
           <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Savings (USD)</label>
           <div className="flex items-center gap-2">
             <span className="text-3xl font-light text-gray-300">$</span>
             <input 
               type="number"
               value={settings.savingsGoalUSD}
               onChange={(e) => updateSettings({ savingsGoalUSD: parseFloat(e.target.value) || 0 })}
               className="w-full text-4xl font-bold tracking-tighter text-[#18181b] bg-transparent border-none p-0 focus:ring-0 outline-none placeholder-gray-200"
             />
           </div>
        </div>
      </section>

      {/* Toggles */}
      <section>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform">
          <div className="flex flex-col">
            <span className="font-bold text-[#18181b] text-sm">Recurring Expenses</span>
            <span className="text-xs text-gray-400 mt-0.5">Enable monthly subscription tracking</span>
          </div>
          
          <button 
            onClick={() => updateSettings({ recurringEnabled: !settings.recurringEnabled })}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${settings.recurringEnabled ? 'bg-[#18181b]' : 'bg-gray-200'}`}
          >
            <div 
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${settings.recurringEnabled ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center pt-8 opacity-30 space-y-2">
        <div className="w-8 h-8 rounded-full bg-[#18181b]/10 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[#18181b]"></div>
        </div>
        <p className="text-[10px] text-[#18181b] font-mono uppercase tracking-widest">
            NomadFinance v3.1 {isDemoMode ? '(Demo)' : '(Connected)'}
        </p>
      </div>
    </div>
  );
};