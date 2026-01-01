import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORIES } from '../constants';
import { 
  Plus, 
  X, 
  Utensils,
  Car,
  Home,
  Wifi,
  Coffee,
  Layers,
  Repeat,
  ChevronRight,
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

export const ExpensesTab: React.FC = () => {
  const { expenses, addExpense, settings, deleteExpense, setTabBarHidden } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [note, setNote] = useState('');

  // Update tab bar visibility
  useEffect(() => {
    setTabBarHidden(isAdding);
    return () => setTabBarHidden(false);
  }, [isAdding, setTabBarHidden]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    addExpense({
      amountETB: parseFloat(amount),
      category,
      date,
      isRecurring,
      note,
      frequency: isRecurring ? 'Monthly' : undefined
    });

    setAmount('');
    setNote('');
    setIsRecurring(false);
    setIsAdding(false);
  };

  const groupedExpenses = useMemo(() => {
    const grouped: Record<string, typeof expenses> = {};
    expenses.forEach(exp => {
      if (!grouped[exp.date]) grouped[exp.date] = [];
      grouped[exp.date].push(exp);
    });
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [expenses]);

  const spentMonth = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amountETB, 0);
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8 pt-2">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#18181b]">Expenses</h1>
            <p className="text-sm text-gray-500 font-medium">Track your spending</p>
         </div>
         <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total (Month)</div>
            <div className="text-xl font-bold text-[#18181b] tracking-tight">{spentMonth.toLocaleString()} ETB</div>
         </div>
      </div>

      {/* Add Expense Button */}
      {!isAdding && (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full bg-gradient-to-br from-[#18181b] to-[#27272a] text-white py-5 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-10 group"
        >
          <span className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
             <Plus size={14} />
          </span>
          Record Transaction
        </button>
      )}

      {/* Add Expense Form Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-white p-6 overflow-y-auto animate-in slide-in-from-bottom-20 duration-300">
           <div className="max-w-md mx-auto pt-4">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-bold tracking-tight text-[#18181b]">New Entry</h3>
               <button 
                onClick={() => setIsAdding(false)}
                className="w-10 h-10 rounded-full bg-gray-100 text-[#18181b] flex items-center justify-center hover:bg-gray-200 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                {/* Amount Input */}
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Amount (ETB)</label>
                   <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full text-5xl font-bold tracking-tighter py-2 border-b border-gray-200 focus:border-[#18181b] outline-none bg-transparent placeholder-gray-200 text-[#18181b] font-mono"
                    placeholder="0"
                    autoFocus
                    required
                  />
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-400 font-medium">
                    <span>≈ ${(amount ? (parseFloat(amount) / settings.exchangeRate) : 0).toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Category Grid */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(cat => {
                       const Icon = CATEGORY_ICONS[cat.value as Category];
                       const isSelected = category === cat.value;
                       return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value as Category)}
                          className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                            isSelected 
                              ? 'bg-[#18181b] text-white border-[#18181b] shadow-md scale-[1.02]' 
                              : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={18} strokeWidth={isSelected ? 2 : 1.5} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Date & Note</label>
                    <div className="flex gap-3">
                       <div className="relative flex-1">
                          <input 
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full h-14 pl-4 pr-3 bg-gray-50 rounded-xl text-sm font-bold text-[#18181b] border-none focus:ring-2 focus:ring-[#18181b]/5 outline-none"
                          />
                       </div>
                       <input 
                          type="text"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Note (Optional)"
                          className="flex-[1.5] h-14 pl-4 bg-gray-50 rounded-xl text-sm font-medium text-[#18181b] border-none focus:ring-2 focus:ring-[#18181b]/5 outline-none placeholder-gray-400"
                        />
                    </div>
                  </div>

                  {settings.recurringEnabled && (
                    <div 
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isRecurring ? 'bg-[#18181b] border-[#18181b] text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      <span className="text-sm font-bold">Recurring Monthly</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isRecurring ? 'border-white bg-white' : 'border-gray-300'}`}>
                        {isRecurring && <div className="w-2.5 h-2.5 rounded-full bg-[#18181b]" />}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-gradient-to-br from-[#18181b] to-[#27272a] text-white py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-xl">
                  Save Entry
                </button>
             </form>
           </div>
        </div>
      )}

      {/* Daily Expenses Modal */}
      {selectedDay && (
         <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md p-6 overflow-y-auto animate-in fade-in duration-200">
             <div className="max-w-md mx-auto pt-10">
                 <div className="flex justify-between items-start mb-8">
                     <div>
                         <h3 className="text-2xl font-bold text-[#18181b]">
                             {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                         </h3>
                         <p className="text-sm text-gray-500 font-medium">Daily Breakdown</p>
                     </div>
                     <button 
                         onClick={() => setSelectedDay(null)}
                         className="w-10 h-10 rounded-full bg-gray-100 text-[#18181b] flex items-center justify-center hover:bg-gray-200"
                     >
                         <X size={20} />
                     </button>
                 </div>
                 
                 <div className="space-y-4">
                     {expenses.filter(e => e.date === selectedDay).map(expense => {
                         const Icon = CATEGORY_ICONS[expense.category] || Layers;
                         return (
                             <div key={expense.id} className="group relative bg-white flex items-center justify-between p-3 rounded-xl border border-gray-100 shadow-sm">
                                 <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#18181b]">
                                         <Icon size={18} />
                                     </div>
                                     <div>
                                         <div className="font-bold text-[#18181b] text-sm">{expense.category}</div>
                                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                             {expense.note || (expense.isRecurring ? 'Recurring' : 'One-time')}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <div className="text-right">
                                         <div className="font-bold text-[#18181b] text-sm">{expense.amountETB.toLocaleString()}</div>
                                         <div className="text-[10px] text-gray-400 font-mono">ETB</div>
                                     </div>
                                     <button 
                                         onClick={() => deleteExpense(expense.id)} 
                                         className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                     >
                                         <X size={14} />
                                     </button>
                                 </div>
                             </div>
                         )
                     })}
                 </div>
             </div>
         </div>
      )}

      {/* Expense List */}
      <div className="space-y-4">
        {groupedExpenses.map(([day, dayExpenses]) => {
          const isToday = day === today;
          
          if (isToday) {
             return (
                 <div key={day} className="mb-8">
                     <div className="flex items-center gap-4 mb-4">
                         <h4 className="text-sm font-bold uppercase tracking-widest text-[#18181b] flex items-center gap-2">
                            Today
                         </h4>
                         <div className="h-px bg-gray-200 flex-1"></div>
                     </div>
                     <div className="space-y-4">
                        {dayExpenses.map((expense) => {
                           const Icon = CATEGORY_ICONS[expense.category] || Layers;
                           return (
                            <div key={expense.id} className="group relative bg-white flex items-center justify-between p-2 rounded-xl transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#18181b] border border-gray-100 group-hover:border-[#18181b] transition-colors">
                                  <Icon size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                  <div className="font-bold text-[#18181b] text-sm">{expense.category}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                     {expense.isRecurring && <Repeat size={10} className="text-[#18181b]" />}
                                     <span>
                                       {expense.note || (expense.isRecurring ? 'Recurring' : 'One-time')}
                                     </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-bold text-[#18181b] text-sm">{expense.amountETB.toLocaleString()}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">ETB</div>
                                </div>
                                <button 
                                  onClick={() => deleteExpense(expense.id)} 
                                  className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-[#18181b] hover:bg-gray-100 rounded-full transition-all"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                     </div>
                 </div>
             )
          }

          // Render summary card for previous days
          const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amountETB, 0);
          const uniqueCategories = Array.from(new Set(dayExpenses.map(e => e.category)));
          
          return (
            <div 
              key={day} 
              onClick={() => setSelectedDay(day)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer hover:border-gray-300"
            >
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-[#18181b] border border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(day).getDate()}</span>
                   </div>
                   
                   <div>
                       <div className="flex -space-x-2 mb-1">
                           {uniqueCategories.slice(0, 4).map((cat, i) => {
                               const Icon = CATEGORY_ICONS[cat as Category] || Layers;
                               return (
                                   <div key={i} className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm z-[5-i]">
                                       <Icon size={12} className="text-gray-500" />
                                   </div>
                               )
                           })}
                           {uniqueCategories.length > 4 && (
                               <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                   +{uniqueCategories.length - 4}
                               </div>
                           )}
                       </div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                           {dayExpenses.length} Transactions
                       </div>
                   </div>
               </div>

               <div className="flex items-center gap-3">
                   <div className="text-right">
                       <div className="font-bold text-[#18181b] text-sm">{dayTotal.toLocaleString()}</div>
                       <div className="text-[10px] text-gray-400 font-mono">ETB</div>
                   </div>
                   <ChevronRight size={16} className="text-gray-300" />
               </div>
            </div>
          );
        })}
        
        {groupedExpenses.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl m-4">
            <p className="text-gray-300 text-sm font-bold uppercase tracking-widest mb-4">No Data</p>
            <p className="text-xs text-gray-400 max-w-[150px]">Tap the button above to start tracking your expenses.</p>
          </div>
        )}
      </div>
    </div>
  );
};