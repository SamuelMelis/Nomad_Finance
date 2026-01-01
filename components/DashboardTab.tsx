import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Utensils,
  Car,
  Home,
  Wifi,
  Coffee,
  Layers,
  ShoppingBag,
  Gamepad2
} from 'lucide-react';
import { Category } from '../types';

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  Food: Utensils,
  Transport: Car,
  Rent: Home,
  Internet: Wifi,
  Entertainment: Gamepad2,
  Coffee: Coffee,
  Item: ShoppingBag,
  Other: Layers,
};

export const DashboardTab: React.FC = () => {
  const { expenses, incomes, settings } = useFinance();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  const totalExpensesETB = monthExpenses.reduce((sum, e) => sum + e.amountETB, 0);
  const totalExpensesUSD = totalExpensesETB / settings.exchangeRate;

  const stableIncome = incomes
    .filter(i => i.type === 'Stable')
    .reduce((sum, i) => sum + i.amountUSD, 0);
    
  const variableIncomeUSD = monthIncomes
    .filter(i => i.type === 'Variable')
    .reduce((sum, i) => sum + i.amountUSD, 0);
    
  const totalIncomeUSD = stableIncome + variableIncomeUSD;

  const netSavingsUSD = totalIncomeUSD - totalExpensesUSD;
  const savingsProgress = Math.min((netSavingsUSD / settings.savingsGoalUSD) * 100, 100);

  const predictedLow = totalIncomeUSD * 0.95;
  const predictedHigh = totalIncomeUSD * 1.10;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-[#18181b] pb-4">
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Financial Overview</h2>
          <h1 className="text-4xl font-bold tracking-tighter text-[#18181b]">
            {monthName}
          </h1>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rate</span>
           <span className="text-sm font-mono font-bold bg-[#18181b] text-white px-2 py-1 rounded-md">
             1:${settings.exchangeRate}
           </span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Income */}
        <div className="group relative bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#18181b] transition-colors duration-300">
          <div className="absolute top-4 right-4 text-gray-200 group-hover:text-[#18181b] transition-colors">
            <ArrowUpRight size={20} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inflow</span>
          <div className="mt-2">
             <div className="text-2xl font-bold tracking-tight text-[#18181b]">${totalIncomeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
             <div className="text-[10px] font-medium text-gray-400 mt-1">USD Total</div>
          </div>
        </div>

        {/* Expense */}
        <div className="group relative bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#18181b] transition-colors duration-300">
          <div className="absolute top-4 right-4 text-gray-200 group-hover:text-[#18181b] transition-colors">
            <ArrowDownRight size={20} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Outflow</span>
          <div className="mt-2">
             <div className="text-2xl font-bold tracking-tight text-[#18181b]">{totalExpensesETB.toLocaleString()}</div>
             <div className="text-[10px] font-medium text-gray-400 mt-1">ETB (≈${totalExpensesUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })})</div>
          </div>
        </div>
      </div>

      {/* Net Savings - The Monolith */}
      <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col relative z-10">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Net Savings Position</span>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold tracking-tighter">${netSavingsUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-sm text-gray-500 font-medium">USD</span>
          </div>

          <div className="w-full bg-gray-800/50 rounded-full h-1.5 mb-2">
            <div 
              className="bg-white h-1.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.max(0, savingsProgress)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-end text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span>{savingsProgress.toFixed(0)}% Achieved</span>
            <span>Target: ${settings.savingsGoalUSD.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Forecast & Insight */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Forecast</h3>
          <p className="text-sm font-bold text-[#18181b] tracking-tight">
             ${predictedLow.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${predictedHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-gray-400 font-normal">est. next month</span>
          </p>
        </div>
      </div>

      {/* Ledger Activity */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-[#18181b] uppercase tracking-widest flex items-center gap-2">
            Latest Entries
          </h3>
          <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} className="text-[#18181b]" />
          </button>
        </div>
        
        <div className="border-t border-gray-100">
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense, index) => {
              const Icon = CATEGORY_ICONS[expense.category] || Layers;
              return (
                <div key={expense.id} className="flex items-center justify-between py-4 border-b border-gray-100 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-gray-300 w-4">{String(index + 1).padStart(2, '0')}</span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#18181b] group-hover:border-[#18181b] transition-colors">
                      <Icon size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-bold text-[#18181b] text-sm">{expense.category}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{expense.note || 'General'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#18181b] text-sm">{expense.amountETB.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 font-mono">ETB</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-gray-400 italic">No transactions recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
};