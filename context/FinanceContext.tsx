import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Expense, Income, Asset, Settings, FinanceContextType, TelegramUser } from '../types';
import { INITIAL_SETTINGS, DEMO_EXPENSES, DEMO_INCOMES, DEMO_ASSETS } from '../constants';
import { Session } from '@supabase/supabase-js';

// Extend Window interface for Telegram
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        requestFullscreen: () => void;
        version: string;
        platform: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        addToHomeScreen: () => void; 
        checkHomeScreenStatus: (callback: (status: string) => void) => void; 
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        initDataUnsafe: {
          user?: TelegramUser;
        };
        initData: string;
      };
    };
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Helper for LocalStorage
const LS_KEYS = {
  EXPENSES: 'nf_expenses',
  INCOMES: 'nf_incomes',
  ASSETS: 'nf_assets',
  SETTINGS: 'nf_settings'
};

const ALLOWED_USERNAME = 'samuel_melis';

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false); // Used for LocalStorage mode for the allowed user
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  
  // UI Control
  const [isTabBarHidden, setTabBarHidden] = useState(false);

  // Telegram Haptic Helper
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning') => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback && tg.version && parseFloat(tg.version) >= 6.1) {
      if (['error', 'success', 'warning'].includes(style)) {
        tg.HapticFeedback.notificationOccurred(style as 'error' | 'success' | 'warning');
      } else {
        tg.HapticFeedback.impactOccurred(style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      }
    }
  };

  // 1. Handle Auth & Access Control
  useEffect(() => {
    let mounted = true;
    
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            setLoading(false);
        }
    }, 3000); 

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      try { tg.expand(); } catch (e) {}
      try {
        if (tg.version && parseFloat(tg.version) >= 6.1) {
            tg.setHeaderColor('#ffffff');
            tg.setBackgroundColor('#ffffff');
        }
      } catch (e) {}
    }

    const initializeAuth = async () => {
      const tg = window.Telegram?.WebApp;
      const isTgPlatform = tg && (tg.platform !== 'unknown' || tg.initData.length > 0);
      
      if (mounted) setIsTelegramEnv(!!isTgPlatform);

      const tgUser = tg?.initDataUnsafe?.user;
      
      if (mounted && tgUser) {
          setTelegramUser(tgUser);
          
          // STRICT ACCESS CONTROL
          // Only allow 'samuel_melis' (case insensitive)
          if (tgUser.username && tgUser.username.toLowerCase() === ALLOWED_USERNAME) {
              // Access Granted: Enable "Demo Mode" which acts as LocalStorage Mode
              setIsDemoMode(true);
              setLoading(false);
          } else {
              // Access Denied: Stop loading, keep isDemoMode false. 
              // This triggers App.tsx to show Auth component (which shows Access Denied msg).
              setLoading(false);
          }
      } else {
          // Not in Telegram or No User Data -> Access Denied
          setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  // 2. Fetch Data (Local Storage Only for Samuel)
  useEffect(() => {
    if (!loading && isDemoMode) {
        fetchLocalData();
    }
  }, [loading, isDemoMode]);

  const fetchLocalData = () => {
      try {
          const lExp = localStorage.getItem(LS_KEYS.EXPENSES);
          const lInc = localStorage.getItem(LS_KEYS.INCOMES);
          const lAss = localStorage.getItem(LS_KEYS.ASSETS);
          const lSet = localStorage.getItem(LS_KEYS.SETTINGS);

          if (lExp) setExpenses(JSON.parse(lExp));
          if (lInc) setIncomes(JSON.parse(lInc));
          if (lAss) setAssets(JSON.parse(lAss));
          if (lSet) {
              setSettings(JSON.parse(lSet));
          } else {
             const defaultSettings = {
                ...INITIAL_SETTINGS,
                userName: 'Samuel'
            };
            setSettings(defaultSettings);
            localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(defaultSettings));
          }
      } catch (e) {
          console.error("Error reading local storage", e);
      }
  };

  // --- Actions (LocalStorage Only) ---

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newExpense = { ...expense, id: tempId };
    const updatedExpenses = [newExpense, ...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(updatedExpenses);
    triggerHaptic('success');
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
  };

  const deleteExpense = async (id: string) => {
    triggerHaptic('medium');
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(updated));
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newIncome = { ...income, id: tempId };
    const updated = [newIncome, ...incomes];
    setIncomes(updated);
    triggerHaptic('success');
    localStorage.setItem(LS_KEYS.INCOMES, JSON.stringify(updated));
  };

  const deleteIncome = async (id: string) => {
    triggerHaptic('medium');
    const updated = incomes.filter(i => i.id !== id);
    setIncomes(updated);
    localStorage.setItem(LS_KEYS.INCOMES, JSON.stringify(updated));
  };

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newAsset = { ...asset, id: tempId };
    const updated = [newAsset, ...assets];
    setAssets(updated);
    triggerHaptic('success');
    localStorage.setItem(LS_KEYS.ASSETS, JSON.stringify(updated));
  };

  const deleteAsset = async (id: string) => {
    triggerHaptic('medium');
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    localStorage.setItem(LS_KEYS.ASSETS, JSON.stringify(updated));
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(updated));
  };

  const resetData = async () => {
    if (window.confirm('Are you sure you want to delete all data?')) {
       triggerHaptic('warning');
       setExpenses([]); setIncomes([]); setAssets([]); setSettings(INITIAL_SETTINGS);
       localStorage.removeItem(LS_KEYS.EXPENSES);
       localStorage.removeItem(LS_KEYS.INCOMES);
       localStorage.removeItem(LS_KEYS.ASSETS);
       localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
  };

  const signOut = async () => {
      // For this single-user local version, sign out just reloads/resets view
      triggerHaptic('light');
      window.location.reload();
  };

  return (
    <FinanceContext.Provider value={{
      expenses, incomes, assets, settings,
      addExpense, deleteExpense, addIncome, deleteIncome, addAsset, deleteAsset,
      updateSettings, resetData, session, signOut, loading,
      isDemoMode, setTabBarHidden, isTabBarHidden, triggerHaptic, isTelegramEnv, telegramUser
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};