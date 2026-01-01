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
            last_name?: string;
            id?: number;
          };
        };
        initData: string;
      };
    };
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const ALLOWED_USER = 'samuel_melis'; // Normalized to lowercase

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

  // 1. Handle Auth Session & Telegram Gatekeeping
  useEffect(() => {
    let mounted = true;
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Auth initialization timed out, forcing load completion.");
            setLoading(false);
        }
    }, 6000); 

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
      const rawUsername = tgUser?.username || '';
      const username = rawUsername.toLowerCase();
      
      const isAllowedUser = username === ALLOWED_USER;

      // STRICT GATEKEEPING FOR TELEGRAM
      if (isTgPlatform && username && !isAllowedUser) {
        if (mounted) {
          setAuthError(`Access Restricted. Allowed: @${ALLOWED_USER}, Found: @${username}`);
          setLoading(false);
          setIsAuthorized(false);
        }
        return;
      }

      const isDemo = !isTgPlatform; 

      if (mounted) {
        setIsAuthorized(true);
        setIsDemoMode(isDemo);
      }

      try {
        // A. Check existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log("Found existing session");
          if (mounted) {
            setSession(existingSession);
            setLoading(false);
          }
          return;
        } 
        
        // B. If in Telegram and is Allowed User -> Auto Login/Register
        if (isTgPlatform && isAllowedUser) {
          // Generate deterministic credentials
          const autoEmail = `tg_${username}@nomadfinance.app`;
          // Use a consistent password strategy. 
          // Note: In production, you'd use a backend to verify initData hash.
          // Here we rely on the specific username check.
          const autoPassword = `nomad_secure_${username}_${tgUser?.id || 'id'}`; 
          
          console.log("Attempting Auto-Login for", autoEmail);

          // 1. Try Sign In
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: autoEmail,
              password: autoPassword
          });

          if (!signInError && signInData.session) {
             console.log("Sign In Successful");
             if (mounted) {
               setSession(signInData.session);
               setLoading(false);
             }
             return;
          }

          console.log("Sign In failed (likely new user), attempting Sign Up...");

          // 2. Try Sign Up (if Sign In failed)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: autoEmail,
            password: autoPassword,
            options: {
                data: {
                    username: rawUsername,
                    full_name: `${tgUser?.first_name || ''} ${tgUser?.last_name || ''}`.trim()
                }
            }
          });

          if (signUpError) {
              console.error("Sign Up failed:", signUpError);
              // If error is "User already registered" but sign-in failed previously, 
              // it might be a password mismatch or network blip. 
              // We fall back to local storage but keep Authorized = true.
          } else if (signUpData.session) {
              console.log("Sign Up Successful");
              if (mounted) setSession(signUpData.session);
          } else if (signUpData.user && !signUpData.session) {
              // User created but email confirmation required.
              // Since we can't confirm fake emails, we are stuck unless Supabase project has "Confirm Email" disabled.
              console.warn("User created but no session. Email confirmation might be required.");
              setAuthError("Account created but requires email verification. Please disable 'Confirm Email' in Supabase Auth settings.");
          }
        } 
        
        // C. Fallback completes
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
        // If we get a session late, ensure loading stops
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
    // If authorized (User is allowed), try to fetch
    if (!loading && isAuthorized) {
      if (session?.user) {
        fetchCloudData();
      } else {
        fetchLocalData();
      }
    }
  }, [session, isAuthorized, loading]);

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
             // Init settings if first time local
             const defaultSettings = {
                ...INITIAL_SETTINGS,
                userName: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Freelancer'
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
        const defaultSettings = {
            ...INITIAL_SETTINGS,
            userName: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Freelancer'
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
            // Revert
            setExpenses(prev => prev.filter(e => e.id !== tempId));
        } else {
            fetchCloudData(); 
        }
    } else {
        // Local Save
        localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    }
  };

  const deleteExpense = async (id: string) => {
    triggerHaptic('medium');
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    
    if (session?.user) {
        await supabase.from('expenses').delete().eq('id', id);
    } else {
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
    } else {
        localStorage.setItem(LS_KEYS.INCOMES, JSON.stringify(updated));
    }
  };

  const deleteIncome = async (id: string) => {
    triggerHaptic('medium');
    const updated = incomes.filter(i => i.id !== id);
    setIncomes(updated);
    
    if (session?.user) await supabase.from('incomes').delete().eq('id', id);
    else localStorage.setItem(LS_KEYS.INCOMES, JSON.stringify(updated));
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
    } else {
        localStorage.setItem(LS_KEYS.ASSETS, JSON.stringify(updated));
    }
  };

  const deleteAsset = async (id: string) => {
    triggerHaptic('medium');
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    
    if (session?.user) await supabase.from('assets').delete().eq('id', id);
    else localStorage.setItem(LS_KEYS.ASSETS, JSON.stringify(updated));
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
    } else {
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
       } else {
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
      session: isAuthorized ? session : null, 
      signOut,
      loading: loading,
      isDemoMode: isDemoMode,
      setTabBarHidden,
      isTabBarHidden,
      triggerHaptic,
      isTelegramEnv
    }}>
      {/* Error Screen */}
      {authError ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="text-xl font-bold text-[#18181b] mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 max-w-xs mb-4">
                This application is private.
            </p>
            <p className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded break-all">
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