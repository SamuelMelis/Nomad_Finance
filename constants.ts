import { Expense, Income, Settings, Asset } from './types';

export const CATEGORIES: { label: string; value: string }[] = [
  { label: 'Food', value: 'Food' },
  { label: 'Coffee', value: 'Coffee' },
  { label: 'Fun', value: 'Entertainment' },
  { label: 'Item', value: 'Item' },
  { label: 'Transport', value: 'Transport' },
  { label: 'Rent', value: 'Rent' },
  { label: 'Internet', value: 'Internet' },
  { label: 'Other', value: 'Other' },
];

export const INITIAL_SETTINGS: Settings = {
  exchangeRate: 180.0,
  savingsGoalUSD: 2000,
  recurringEnabled: true,
  userName: 'Freelancer',
};

// Data is now empty for production/live usage
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_INCOMES: Income[] = [];
export const INITIAL_ASSETS: Asset[] = [];

// --- DEMO DATA FOR PREVIEW MODE ---
export const DEMO_EXPENSES: Expense[] = [
  { id: '1', amountETB: 450, category: 'Food', date: new Date().toISOString().split('T')[0], isRecurring: false, note: 'Lunch' },
  { id: '2', amountETB: 150, category: 'Transport', date: new Date().toISOString().split('T')[0], isRecurring: false, note: 'Ride' },
  { id: '3', amountETB: 2500, category: 'Internet', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], isRecurring: true, frequency: 'Monthly', note: 'WiFi Bill' },
  { id: '4', amountETB: 800, category: 'Entertainment', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], isRecurring: false, note: 'Cinema' },
];

export const DEMO_INCOMES: Income[] = [
  { id: '1', amountUSD: 1500, source: 'Upwork Client A', date: new Date().toISOString().split('T')[0], type: 'Stable' },
  { id: '2', amountUSD: 300, source: 'Logo Project', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], type: 'Variable' },
];

export const DEMO_ASSETS: Asset[] = [
  { id: '1', name: 'Emergency Cash', amountUSD: 500, type: 'Cash' },
  { id: '2', name: 'MacBook Pro', amountUSD: 1200, type: 'Item' },
  { id: '3', name: 'Dave', amountUSD: 200, type: 'Lent' },
];