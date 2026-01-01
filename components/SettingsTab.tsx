import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Save, RefreshCw, ArrowRight, LogOut, Download, Smartphone, Check, Zap, HelpCircle } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, signOut, isDemoMode, isTelegramEnv, triggerHaptic } = useFinance();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleTelegramShortcut = () => {
    triggerHaptic('medium');
    if (window.Telegram?.WebApp?.addToHomeScreen) {
      window.Telegram.WebApp.addToHomeScreen();
    } else {
      alert("Feature not supported in this Telegram version.");
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-start border-b border-[#18181b]/10 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-[#18181b]">Settings</h2>
          {isDemoMode && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Demo</span>
          )}
        </div>
        <button
          onClick={signOut}
          className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:bg-[#18181b] hover:text-white transition-all"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* TELEGRAM SHORTCUT SECTION */}


      {/* BROWSER PWA INSTALL SECTION */}
      {!isTelegramEnv && !isStandalone && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} className="text-[#18181b]" />
            <h3 className="font-bold text-[#18181b] text-xs uppercase tracking-wider">App Installation</h3>
          </div>

          <button
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className={`w-full p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${deferredPrompt
              ? 'bg-[#18181b] text-white active:scale-[0.98]'
              : 'bg-white border border-gray-200 text-[#18181b] cursor-default opacity-80'
              }`}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-xs">
                {deferredPrompt ? 'Install App' : 'Install via Browser Menu'}
              </span>
              <span className={`text-[9px] font-medium ${deferredPrompt ? 'text-gray-400' : 'text-gray-500'}`}>
                {deferredPrompt ? 'Tap to install' : 'Tap Menu > Add to Home Screen'}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deferredPrompt ? 'bg-white/10' : 'bg-gray-100'}`}>
              {deferredPrompt ? <Download size={16} /> : <HelpCircle size={16} />}
            </div>
          </button>
        </section>
      )}

      {/* Exchange Rate Card - Compacted */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw size={14} className="text-[#18181b]" />
          <h3 className="font-bold text-[#18181b] text-xs uppercase tracking-wider">Exchange Rate</h3>
        </div>

        <div className="bg-gray-50 p-1 rounded-xl border border-gray-200">
          <div className="bg-white rounded-lg px-3 py-3 flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Base</span>
              <span className="font-bold text-lg text-[#18181b]">1 USD</span>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Target (ETB)</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={settings.exchangeRate}
                  onChange={(e) => updateSettings({ exchangeRate: parseFloat(e.target.value) || 0 })}
                  className="w-20 text-right text-lg font-bold bg-transparent border-none p-0 focus:ring-0 outline-none text-[#18181b] placeholder-gray-300"
                  placeholder="0.00"
                />
                <span className="text-xs font-bold text-[#18181b]">ETB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Goal - Compacted */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Save size={14} className="text-[#18181b]" />
          <h3 className="font-bold text-[#18181b] text-xs uppercase tracking-wider">GOAL</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Save size={48} />
          </div>

          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Savings (USD)</label>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-gray-300">$</span>
            <input
              type="text"
              value={settings.savingsGoalUSD ? settings.savingsGoalUSD.toLocaleString() : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/,/g, '');
                if (!isNaN(Number(val))) {
                  updateSettings({ savingsGoalUSD: parseFloat(val) || 0 });
                }
              }}
              className="w-full text-3xl font-bold tracking-tighter text-[#18181b] bg-transparent border-none p-0 focus:ring-0 outline-none placeholder-gray-200"
            />
          </div>
        </div>
      </section>

      {/* Toggles - Compacted */}
      <section>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="font-bold text-[#18181b] text-xs">Recurring Expenses</span>
            <span className="text-[9px] text-gray-400 mt-0.5">Enable subscription tracking</span>
          </div>

          <button
            onClick={() => updateSettings({ recurringEnabled: !settings.recurringEnabled })}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${settings.recurringEnabled ? 'bg-[#18181b]' : 'bg-gray-200'}`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${settings.recurringEnabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </section>

      {/* TELEGRAM SHORTCUT SECTION - Moved to Bottom */}
      {
        isTelegramEnv && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={14} className="text-[#18181b]" />
              <h3 className="font-bold text-[#18181b] text-xs uppercase tracking-wider">App Shortcut</h3>
            </div>

            <button
              onClick={handleTelegramShortcut}
              className="w-full bg-[#18181b] text-white p-4 rounded-xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all"
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-xs">Add to Home Screen</span>
                <span className="text-[9px] text-gray-400 font-medium">Quick access to Mini App</span>
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <Zap size={16} />
              </div>
            </button>
          </section>
        )
      }

      <div className="flex flex-col items-center justify-center pt-4 opacity-30 space-y-1">
        <p className="text-[9px] text-[#18181b] font-mono uppercase tracking-widest">
          NomadFinance v3.3
        </p>
      </div>
    </div >
  );
};