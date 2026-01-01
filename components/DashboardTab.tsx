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

  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5); // Show 5 items now since layout is compact

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
    <div className="space-y-4 pb-24 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-[#18181b]/10 pb-2">
        <div>
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Financial Overview</h2>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181b]">
            {monthName}
          </h1>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rate</span>
           <span className="text-xs font-mono font-bold bg-[#18181b] text-white px-1.5 py-0.5 rounded">
             1:${settings.exchangeRate}
           </span>
        </div>
      </div>

      {/* Primary Stats Grid - Compacted */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income */}
        <div className="group relative bg-white p-3.5 rounded-2xl border border-gray-100 hover:border-[#18181b] transition-colors duration-300 shadow-sm">
          <div className="absolute top-3.5 right-3.5 text-gray-200 group-hover:text-[#18181b] transition-colors">
            <ArrowUpRight size={16} />
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Inflow</span>
          <div className="mt-1">
             <div className="text-xl font-bold tracking-tight text-[#18181b]">${totalIncomeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
             <div className="text-[9px] font-medium text-gray-400">USD Total</div>
          </div>
        </div>

        {/* Expense */}
        <div className="group relative bg-white p-3.5 rounded-2xl border border-gray-100 hover:border-[#18181b] transition-colors duration-300 shadow-sm">
          <div className="absolute top-3.5 right-3.5 text-gray-200 group-hover:text-[#18181b] transition-colors">
            <ArrowDownRight size={16} />
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Outflow</span>
          <div className="mt-1">
             <div className="text-xl font-bold tracking-tight text-[#18181b]">{totalExpensesETB.toLocaleString()}</div>
             <div className="text-[9px] font-medium text-gray-400">ETB (≈${totalExpensesUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })})</div>
          </div>
        </div>
      </div>

      {/* Net Savings - Compacted */}
      <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col relative z-10">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Position</span>
            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
               Goal: ${settings.savingsGoalUSD.toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold tracking-tighter">${netSavingsUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-xs text-gray-500 font-medium">USD</span>
          </div>

          <div className="w-full bg-gray-800/50 rounded-full h-1 mb-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.max(0, savingsProgress)}%` }}
            ></div>
          </div>
          
          <div className="text-right text-[9px] font-bold text-gray-500 uppercase tracking-wider">
            {savingsProgress.toFixed(0)}% Achieved
          </div>
        </div>
      </div>

      {/* Forecast & Insight - Compacted */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Forecast</h3>
          <p className="text-xs font-bold text-[#18181b] tracking-tight">
             ${predictedLow.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${predictedHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-gray-400 font-normal">next month</span>
          </p>
        </div>
      </div>

      {/* Ledger Activity - Compacted */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[10px] font-bold text-[#18181b] uppercase tracking-widest flex items-center gap-2">
            Recent
          </h3>
          <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronRight size={14} className="text-[#18181b]" />
          </button>
        </div>
        
        <div className="border-t border-gray-100">
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense, index) => {
              const Icon = CATEGORY_ICONS[expense.category] || Layers;
              return (
                <div key={expense.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 group hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#18181b] group-hover:border-[#18181b] transition-colors shadow-sm">
                      <Icon size={14} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-bold text-[#18181b] text-xs">{expense.category}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{expense.note || 'General'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#18181b] text-xs">{expense.amountETB.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-400 font-mono">ETB</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-[10px] text-gray-400 italic">No transactions recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
};