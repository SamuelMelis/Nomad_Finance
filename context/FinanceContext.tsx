import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Expense, Income, Asset, Settings, FinanceContextType } from '../types';
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
          user?: {
            username?: string;
            first_name?: string;
            id?: number;
          };
        };
        initData: string;
      };
    };
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const ALLOWED_USER = 'Samuel_Melis';

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (['error', 'success', 'warning'].includes(style)) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(style as 'error' | 'success' | 'warning');
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      }
    }
  };

  // 1. Handle Auth Session & Telegram Gatekeeping
  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Auth initialization timed out, forcing load completion.");
            setLoading(false);
        }
    }, 3000);

    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      
      try {
        tg.expand();
      } catch (e) {
        console.warn('Telegram expand failed:', e);
      }

      // Strict check for Fullscreen support (Requires v8.0+)
      // We check parsing to ensure we don't call it on v6.0
      try {
        const versionStr = tg.version;
        if (versionStr) {
            const version = parseFloat(versionStr);
            if (!isNaN(version) && version >= 8.0) {
                 if (typeof tg.requestFullscreen === 'function') {
                    tg.requestFullscreen();
                 }
            }
        }
      } catch (e) {
          // Silent catch to prevent alerting users on older devices
          console.log("Fullscreen not supported:", e);
      }
      
      // Match the App Theme and Header to Background (as fallback)
      try {
        tg.setHeaderColor('#ffffff');
        tg.setBackgroundColor('#ffffff');
      } catch (e) {
        console.log('Error setting theme', e);
      }
    }

    const initializeAuth = async () => {
      // 1. Check Telegram Environment
      const tg = window.Telegram?.WebApp;
      const isTgPlatform = tg && (tg.platform !== 'unknown' || tg.initData.length > 0);
      
      if (mounted) setIsTelegramEnv(!!isTgPlatform);

      const tgUser = tg?.initDataUnsafe?.user;
      const username = tgUser?.username;
      
      const isAllowedUser = username === ALLOWED_USER;

      // STRICT GATEKEEPING FOR TELEGRAM
      if (isTgPlatform && username && !isAllowedUser) {
        if (mounted) {
          setAuthError(`Access Restricted. Allowed: @${ALLOWED_USER}, Found: @${username}`);
          setLoading(false);
          setIsAuthorized(false);
        }
        clearTimeout(safetyTimeout);
        return;
      }

      // DETERMINE DEMO MODE (Browser or explicit allowed user with DB issues)
      const isDemo = !isTgPlatform; 

      if (mounted) {
        setIsAuthorized(true);
        setIsDemoMode(isDemo);
      }

      try {
        // 2. Internal Database Connection (Try existing session first)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          if (mounted) {
            setSession(existingSession);
            setLoading(false);
          }
        } else {
          // Attempt Anonymous Auth
          // Note: If disabled in Supabase, this will error. We handle that gracefully.
          const { data: { session: newSession }, error } = await supabase.auth.signInAnonymously();
          
          if (error) {
            // Check if specific error regarding anonymous auth being disabled
            const isAnonDisabled = error.message.includes('Anonymous sign-ins are disabled');
            
            if (isAnonDisabled) {
                // Not a critical error, just means user must sign in manually
                console.log("Anonymous auth disabled, falling back to manual login.");
            } else {
                console.warn("DB Connection warning:", error.message);
            }

            // If anonymous auth fails, we stop loading.
            // App.tsx will detect !session and show the <Auth /> screen.
            if (mounted) {
                setLoading(false);
            }

            // Only fallback to demo data if we are NOT in the app (e.g. debugging in browser)
            // If in app, we want to force the login screen.
            if (isDemo && mounted && !isAnonDisabled) {
                console.warn("Falling back to local demo mode due to DB error");
                loadDemoData();
            }
            
            clearTimeout(safetyTimeout);
            return;
          }
          
          if (mounted) {
            setSession(newSession);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isDemo && mounted) {
            // Fallback for demo
            loadDemoData();
        } else if (mounted) {
           // Allow manual auth on error
           setLoading(false);
        }
      }
      clearTimeout(safetyTimeout);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if(!session && !isDemoMode) {
          setExpenses([]);
          setIncomes([]);
          setAssets([]);
          setSettings(INITIAL_SETTINGS);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch Data when Session is active
  useEffect(() => {
    if (session?.user && isAuthorized) {
      fetchData();
    }
  }, [session, isAuthorized]);

  const fetchData = async () => {
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
        // Init settings if first time
        const defaultSettings = {
            ...INITIAL_SETTINGS,
            userName: isDemoMode ? 'Demo User' : (window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Freelancer')
        };
        await updateSettings(defaultSettings);
    }
  };

  // --- Actions ---

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newExpense = { ...expense, id: tempId };
    
    setExpenses(prev => {
        const updated = [newExpense, ...prev];
        return updated.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    triggerHaptic('success');

    if (!session?.user) return;

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
        fetchData(); 
    }
  };

  const deleteExpense = async (id: string) => {
    triggerHaptic('medium');
    setExpenses(prev => prev.filter(e => e.id !== id));
    
    if (!session?.user) return;
    await supabase.from('expenses').delete().eq('id', id);
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newIncome = { ...income, id: tempId };
    setIncomes(prev => [newIncome, ...prev]);
    triggerHaptic('success');

    if (!session?.user) return;

    const { error } = await supabase.from('incomes').insert({
        user_id: session.user.id,
        amount_usd: income.amountUSD,
        source: income.source,
        date: income.date,
        type: income.type
    });

    if (error) {
        console.error('Error adding income', error);
        setIncomes(prev => prev.filter(i => i.id !== tempId));
    } else {
        fetchData();
    }
  };

  const deleteIncome = async (id: string) => {
    triggerHaptic('medium');
    setIncomes(prev => prev.filter(i => i.id !== id));
    
    if (!session?.user) return;
    await supabase.from('incomes').delete().eq('id', id);
  };

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newAsset = { ...asset, id: tempId };
    setAssets(prev => [newAsset, ...prev]);
    triggerHaptic('success');

    if (!session?.user) return;

    const { error } = await supabase.from('assets').insert({
        user_id: session.user.id,
        name: asset.name,
        amount_usd: asset.amountUSD,
        type: asset.type
    });

    if (error) {
        setAssets(prev => prev.filter(a => a.id !== tempId));
    } else {
        fetchData();
    }
  };

  const deleteAsset = async (id: string) => {
    triggerHaptic('medium');
    setAssets(prev => prev.filter(a => a.id !== id));
    
    if (!session?.user) return;
    await supabase.from('assets').delete().eq('id', id);
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    if (!session?.user) return;

    const dbSettings: any = {};
    if (newSettings.exchangeRate !== undefined) dbSettings.exchange_rate = newSettings.exchangeRate;
    if (newSettings.savingsGoalUSD !== undefined) dbSettings.savings_goal_usd = newSettings.savingsGoalUSD;
    if (newSettings.recurringEnabled !== undefined) dbSettings.recurring_enabled = newSettings.recurringEnabled;
    if (newSettings.userName !== undefined) dbSettings.user_name = newSettings.userName;
    
    dbSettings.user_id = session.user.id;

    await supabase.from('user_settings').upsert(dbSettings);
  };

  const resetData = async () => {
    if (window.confirm('Are you sure you want to delete all data?')) {
       triggerHaptic('warning');
       setExpenses([]);
       setIncomes([]);
       setAssets([]);
       setSettings(INITIAL_SETTINGS);

       if (!session?.user) return;
       
       await supabase.from('expenses').delete().eq('user_id', session.user.id);
       await supabase.from('incomes').delete().eq('user_id', session.user.id);
       await supabase.from('assets').delete().eq('user_id', session.user.id);
       await supabase.from('user_settings').delete().eq('user_id', session.user.id);
       await updateSettings(INITIAL_SETTINGS);
    }
  };

  const signOut = async () => {
      triggerHaptic('light');
      await supabase.auth.signOut();
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
      session: isAuthorized ? session : null, // Only expose session if authorized
      signOut,
      loading: loading,
      isDemoMode: isDemoMode,
      setTabBarHidden,
      isTabBarHidden,
      triggerHaptic,
      isTelegramEnv
    }}>
      {/* Error Screen - Only shown for explicit Auth Errors (Gatekeeping), NOT DB connection errors */}
      {authError ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="text-xl font-bold text-[#18181b] mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 max-w-xs mb-4">
                This application is private.
            </p>
            <p className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded">
                {authError}
            </p>
        </div>
      ) : children}
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