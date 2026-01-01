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
        requestFullscreen: () => void; // New method to enter fullscreen
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

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  
  // UI Control
  const [isTabBarHidden, setTabBarHidden] = useState(false);

  // Helper to load demo data
  const loadDemoData = () => {
    setExpenses(DEMO_EXPENSES);
    setIncomes(DEMO_INCOMES);
    setAssets(DEMO_ASSETS);
    setSettings({ ...INITIAL_SETTINGS, userName: 'Demo User' });
    setLoading(false);
  };

  // Telegram Haptic Helper
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning') => {
    const tg = window.Telegram?.WebApp;
    // HapticFeedback is supported in version 6.1+
    if (tg?.HapticFeedback && tg.version && parseFloat(tg.version) >= 6.1) {
      if (['error', 'success', 'warning'].includes(style)) {
        tg.HapticFeedback.notificationOccurred(style as 'error' | 'success' | 'warning');
      } else {
        tg.HapticFeedback.impactOccurred(style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      }
    }
  };

  // 1. Handle Auth Session & Telegram Setup
  useEffect(() => {
    let mounted = true;
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Auth initialization timed out.");
            setLoading(false);
        }
    }, 8000); 

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
      
      if (isTgPlatform && tgUser) {
          if (mounted) setTelegramUser(tgUser);
      }

      // If we are here, we are either in Browser (Demo) or Telegram
      const isDemo = !isTgPlatform; 

      if (mounted) {
        setIsDemoMode(isDemo);
      }

      try {
        // A. Check existing session first
        // Supabase automatically persists session to storage. 
        // If the user logged in previously, this returns the session.
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log("Found existing session");
          if (mounted) {
            setSession(existingSession);
            setLoading(false);
          }
          return;
        } 
        
        // B. If no session, stop loading.
        // App.tsx will see (!session && !demo) and show Auth component.
        // Auth component will use telegramUser data to simplify login.
        
        if (mounted) setLoading(false);
        if (isDemo && mounted) loadDemoData();

      } catch (error) {
        console.error("Auth initialization fatal error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch Data (Cloud OR Local)
  useEffect(() => {
    if (!loading) {
      if (session?.user) {
        fetchCloudData();
      } else if (isDemoMode) {
        fetchLocalData();
      }
    }
  }, [session, loading, isDemoMode]);

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
                userName: 'Freelancer'
            };
            setSettings(defaultSettings);
            localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(defaultSettings));
          }
      } catch (e) {
          console.error("Error reading local storage", e);
      }
  };

  const fetchCloudData = async () => {
    if (!session?.user) return;
    
    // Fetch Expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (expensesData) {
      const mappedExpenses = expensesData.map((e: any) => ({
        ...e,
        amountETB: e.amount_etb,
        isRecurring: e.is_recurring
      }));
      setExpenses(mappedExpenses);
    }

    // Fetch Incomes
    const { data: incomesData } = await supabase
      .from('incomes')
      .select('*')
      .order('date', { ascending: false });

    if (incomesData) {
      const mappedIncomes = incomesData.map((i: any) => ({
        ...i,
        amountUSD: i.amount_usd
      }));
      setIncomes(mappedIncomes);
    }

    // Fetch Assets
    const { data: assetsData } = await supabase.from('assets').select('*');
    if (assetsData) {
      const mappedAssets = assetsData.map((a: any) => ({
        ...a,
        amountUSD: a.amount_usd
      }));
      setAssets(mappedAssets);
    }

    // Fetch Settings
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('*')
      .single();

    if (settingsData) {
      setSettings({
        exchangeRate: settingsData.exchange_rate,
        savingsGoalUSD: settingsData.savings_goal_usd,
        recurringEnabled: settingsData.recurring_enabled,
        userName: settingsData.user_name
      });
    } else {
        // If new user and no settings, create default settings
        // Use Telegram Name if available
        const displayName = telegramUser?.first_name || 'Freelancer';
        
        const defaultSettings = {
            ...INITIAL_SETTINGS,
            userName: displayName
        };
        await updateSettings(defaultSettings);
    }
  };

  // --- Actions ---

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newExpense = { ...expense, id: tempId };
    
    // Optimistic UI Update
    const updatedExpenses = [newExpense, ...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(updatedExpenses);
    triggerHaptic('success');

    if (session?.user) {
        // Cloud Save
        const { error } = await supabase.from('expenses').insert({
            user_id: session.user.id,
            amount_etb: expense.amountETB,
            category: expense.category,
            date: expense.date,
            is_recurring: expense.isRecurring,
            frequency: expense.frequency,
            note: expense.note
        });
        if (error) {
            console.error('Error adding expense:', error);
            triggerHaptic('error');
            setExpenses(prev => prev.filter(e => e.id !== tempId));
        } else {
            fetchCloudData(); 
        }
    } else if (isDemoMode) {
        localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    }
  };

  const deleteExpense = async (id: string) => {
    triggerHaptic('medium');
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    
    if (session?.user) {
        await supabase.from('expenses').delete().eq('id', id);
    } else if (isDemoMode) {
        localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(updated));
    }
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newIncome = { ...income, id: tempId };
    const updated = [newIncome, ...incomes];
    setIncomes(updated);
    triggerHaptic('success');

    if (session?.user) {
        const { error } = await supabase.from('incomes').insert({
            user_id: session.user.id,
            amount_usd: income.amountUSD,
            source: income.source,
            date: income.date,
            type: income.type
        });
        if (error) setIncomes(prev => prev.filter(i => i.id !== tempId));
        else fetchCloudData();
    } else if (isDemoMode) {
        localStorage.setItem(LS_KEYS.INCOMES, JSON.stringify(updated));
    }
  };

  const deleteIncome = async (id: string) => {
    triggerHaptic('medium');
    const updated = incomes.filter(i => i.id !== id);
    setIncomes(updated);
    
    if (session?.user) await supabase.from('incomes').delete().eq('id', id);
    else if (isDemoMode) localStorage.setItem(LS_KEYS.INCOMES, JSON.stringify(updated));
  };

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newAsset = { ...asset, id: tempId };
    const updated = [newAsset, ...assets];
    setAssets(updated);
    triggerHaptic('success');

    if (session?.user) {
        const { error } = await supabase.from('assets').insert({
            user_id: session.user.id,
            name: asset.name,
            amount_usd: asset.amountUSD,
            type: asset.type
        });
        if (error) setAssets(prev => prev.filter(a => a.id !== tempId));
        else fetchCloudData();
    } else if (isDemoMode) {
        localStorage.setItem(LS_KEYS.ASSETS, JSON.stringify(updated));
    }
  };

  const deleteAsset = async (id: string) => {
    triggerHaptic('medium');
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    
    if (session?.user) await supabase.from('assets').delete().eq('id', id);
    else if (isDemoMode) localStorage.setItem(LS_KEYS.ASSETS, JSON.stringify(updated));
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (session?.user) {
        const dbSettings: any = {};
        if (newSettings.exchangeRate !== undefined) dbSettings.exchange_rate = newSettings.exchangeRate;
        if (newSettings.savingsGoalUSD !== undefined) dbSettings.savings_goal_usd = newSettings.savingsGoalUSD;
        if (newSettings.recurringEnabled !== undefined) dbSettings.recurring_enabled = newSettings.recurringEnabled;
        if (newSettings.userName !== undefined) dbSettings.user_name = newSettings.userName;
        
        dbSettings.user_id = session.user.id;
        await supabase.from('user_settings').upsert(dbSettings);
    } else if (isDemoMode) {
        localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(updated));
    }
  };

  const resetData = async () => {
    if (window.confirm('Are you sure you want to delete all data?')) {
       triggerHaptic('warning');
       setExpenses([]);
       setIncomes([]);
       setAssets([]);
       setSettings(INITIAL_SETTINGS);

       if (session?.user) {
           await supabase.from('expenses').delete().eq('user_id', session.user.id);
           await supabase.from('incomes').delete().eq('user_id', session.user.id);
           await supabase.from('assets').delete().eq('user_id', session.user.id);
           await supabase.from('user_settings').delete().eq('user_id', session.user.id);
           await updateSettings(INITIAL_SETTINGS);
       } else if (isDemoMode) {
           localStorage.removeItem(LS_KEYS.EXPENSES);
           localStorage.removeItem(LS_KEYS.INCOMES);
           localStorage.removeItem(LS_KEYS.ASSETS);
           localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
       }
    }
  };

  const signOut = async () => {
      triggerHaptic('light');
      if (session) await supabase.auth.signOut();
      window.location.reload();
  };

  return (
    <FinanceContext.Provider value={{
      expenses,
      incomes,
      assets,
      settings,
      addExpense,
      deleteExpense,
      addIncome,
      deleteIncome,
      addAsset,
      deleteAsset,
      updateSettings,
      resetData,
      session,
      signOut,
      loading,
      isDemoMode,
      setTabBarHidden,
      isTabBarHidden,
      triggerHaptic,
      isTelegramEnv,
      telegramUser
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};