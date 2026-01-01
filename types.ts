import { Session } from '@supabase/supabase-js';

export type Currency = 'USD' | 'ETB';

export type Category = 'Food' | 'Transport' | 'Rent' | 'Internet' | 'Entertainment' | 'Coffee' | 'Item' | 'Other';

export interface Expense {
  id: string;
  amountETB: number;
  category: Category;
  date: string; // ISO date string YYYY-MM-DD
  isRecurring: boolean;
  frequency?: 'Daily' | 'Weekly' | 'Monthly';
  note?: string;
}

export interface Income {
  id: string;
  amountUSD: number;
  source: string;
  date: string;
  type: 'Stable' | 'Variable';
}

export type AssetType = 'Cash' | 'Item' | 'Loan' | 'Lent';

export interface Asset {
  id: string;
  name: string;
  amountUSD: number;
  type: AssetType;
}

export interface Settings {
  exchangeRate: number; // 1 USD = X ETB
  savingsGoalUSD: number;
  recurringEnabled: boolean;
  userName: string;
}

export interface FinanceContextType {
  expenses: Expense[];
  incomes: Income[];
  assets: Asset[];
  settings: Settings;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  deleteIncome: (id: string) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  deleteAsset: (id: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetData: () => void;
  
  // Auth
  session: Session | null;
  signOut: () => void;
  loading: boolean;
  isDemoMode: boolean;
  
  // UI Control
  setTabBarHidden: (hidden: boolean) => void;
  isTabBarHidden: boolean;
}