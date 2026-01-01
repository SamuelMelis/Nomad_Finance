import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Save, RefreshCw, ArrowRight, LogOut, Download, Smartphone, Check, Zap, HelpCircle } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, signOut, isDemoMode, isTelegramEnv, triggerHaptic } = useFinance();
  
  // PWA / Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    // 2. Listen for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Standard PWA Install (Browser) - Attempts to prompt native dialog
  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (!deferredPrompt) {
        // User requested no guide/menu interaction, so we just alert if unavailable.
        alert("Install prompt unavailable. Please use the browser menu.");
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
    }
  };

  // Telegram Specific Shortcut
  const handleTelegramShortcut = () => {
    triggerHaptic('medium');
    if (window.Telegram?.WebApp?.addToHomeScreen) {
        window.Telegram.WebApp.addToHomeScreen();
    } else {
        alert("Feature not supported in this Telegram version.");
    }
  };

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

      {/* TELEGRAM SHORTCUT SECTION (Only if in Telegram) */}
      {isTelegramEnv && (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <Smartphone size={18} className="text-[#18181b]" />
                <h3 className="font-bold text-[#18181b] text-sm uppercase tracking-wider">App Shortcut</h3>
            </div>
            
            <button 
                onClick={handleTelegramShortcut}
                className="w-full bg-[#18181b] text-white p-5 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all"
            >
                <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">Add to Home Screen</span>
                    <span className="text-[10px] text-gray-400 font-medium">Quick access to Mini App</span>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Zap size={20} />
                </div>
            </button>
        </section>
      )}

      {/* BROWSER PWA INSTALL SECTION (Only if NOT in Telegram and NOT Installed) */}
      {!isTelegramEnv && !isStandalone && (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <Smartphone size={18} className="text-[#18181b]" />
                <h3 className="font-bold text-[#18181b] text-sm uppercase tracking-wider">App Installation</h3>
            </div>

            {/* Main Install Button - Always shown if not installed. Manual guide removed as requested. */}
            <button 
                onClick={handleInstallClick}
                className={`w-full p-5 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all ${
                    deferredPrompt ? 'bg-[#18181b] text-white' : 'bg-white border border-gray-200 text-[#18181b]'
                }`}
            >
                <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">
                        {deferredPrompt ? 'Install App' : 'Add to Home Screen'}
                    </span>
                    <span className={`text-[10px] font-medium ${deferredPrompt ? 'text-gray-400' : 'text-gray-500'}`}>
                        {deferredPrompt ? 'Tap to install' : 'Tap to add'}
                    </span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deferredPrompt ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {deferredPrompt ? <Download size={20} /> : <HelpCircle size={20} />}
                </div>
            </button>
        </section>
      )}

      {/* Show Installed Status if standalone, or if in Telegram show nothing about installation */}
      {isStandalone && !isTelegramEnv && (
         <section>
            <div className="flex items-center gap-3 mb-4">
                <Smartphone size={18} className="text-[#18181b]" />
                <h3 className="font-bold text-[#18181b] text-sm uppercase tracking-wider">App Status</h3>
            </div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 text-green-700">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">App Installed</span>
            </div>
         </section>
      )}

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
            NomadFinance v3.2 {isDemoMode ? '(Demo)' : '(Connected)'}
        </p>
      </div>
    </div>
  );
};