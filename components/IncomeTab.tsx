import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DollarSign, Briefcase, Plus, Trash2, Landmark, TrendingUp, Wallet, X, CreditCard, ShoppingBag, Coins, ChevronDown } from 'lucide-react';
import { AssetType } from '../types';

export const IncomeTab: React.FC = () => {
  const { incomes, addIncome, deleteIncome, assets, addAsset, deleteAsset } = useFinance();

  // Income Form State
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [type, setType] = useState<'Stable' | 'Variable'>('Variable');

  // Asset Form State
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('Cash');
  const [isAssetTypeOpen, setIsAssetTypeOpen] = useState(false);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source) return;

    addIncome({
      amountUSD: parseFloat(amount),
      source: source,
      date: new Date().toISOString().split('T')[0],
      type: type
    });

    setAmount('');
    setSource('');
    setShowIncomeForm(false);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetAmount || !assetName) return;

    // Treat Loan as a negative asset (Liability)
    // Treat Lent as a positive asset (Receivable)
    const rawAmount = parseFloat(assetAmount);
    const finalAmount = assetType === 'Loan' ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    addAsset({
      name: assetName,
      amountUSD: finalAmount,
      type: assetType
    });

    setAssetAmount('');
    setAssetName('');
    setShowAssetForm(false);
  };

  // Calculations for Summary
  const stableIncomes = incomes.filter(i => i.type === 'Stable');
  const variableIncomes = incomes.filter(i => i.type === 'Variable');

  const totalStable = stableIncomes.reduce((sum, i) => sum + i.amountUSD, 0);
  const totalVariable = variableIncomes.reduce((sum, i) => sum + i.amountUSD, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.amountUSD, 0);

  // Unified Income List (Sorted by Date Descending)
  const allIncomes = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'Cash': return Wallet;
      case 'Item': return ShoppingBag;
      case 'Loan': return CreditCard;
      case 'Lent': return Coins;
      default: return Wallet;
    }
  };

  // Sort assets: Cash/Item, then Lent, then Loan
  const sortedAssets = [...assets].sort((a, b) => {
    const typeOrder: Record<AssetType, number> = { Cash: 1, Item: 2, Lent: 3, Loan: 4 };
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-end border-b border-[#18181b]/10 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#18181b]">Income & Assets</h1>
      </div>

      {/* Hero Card - Compacted */}
      <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] text-white p-5 rounded-2xl shadow-lg">
        <div className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Total Net Assets</div>
        <div className="text-3xl font-bold tracking-tighter mb-4 flex items-baseline gap-2">
          ${totalAssets.toLocaleString()} <span className="text-xs font-medium text-gray-500">USD</span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-3">
          <div>
            <div className="text-gray-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Monthly Stable</div>
            <div className="text-lg font-bold font-mono tracking-tight">${totalStable.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Monthly Var.</div>
            <div className="text-lg font-bold font-mono tracking-tight">${totalVariable.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Add Income Section */}
      <div className="transition-all duration-300">
        {!showIncomeForm ? (
          <button
            onClick={() => setShowIncomeForm(true)}
            className="w-full bg-white py-3 px-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-[#18181b] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-[#18181b] border border-gray-100 group-hover:bg-[#18181b] group-hover:text-white group-hover:border-[#18181b] transition-colors">
                <Plus size={18} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#18181b]">Record New Income</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#18181b] font-bold text-[10px] uppercase tracking-widest">Add New Stream</h3>
              <button
                type="button"
                onClick={() => setShowIncomeForm(false)}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center hover:text-[#18181b] hover:border-[#18181b] transition-all"
              >
                <X size={12} />
              </button>
            </div>
            <form onSubmit={handleAddIncome} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setType('Stable')}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${type === 'Stable' ? 'bg-[#18181b] text-white shadow-md' : 'text-gray-400 hover:text-[#18181b]'}`}
                >
                  <Briefcase size={12} />
                  Stable
                </button>
                <button
                  type="button"
                  onClick={() => setType('Variable')}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${type === 'Variable' ? 'bg-[#18181b] text-white shadow-md' : 'text-gray-400 hover:text-[#18181b]'}`}
                >
                  <TrendingUp size={12} />
                  Variable
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder={type === 'Stable' ? "Client Name" : "Project Name"}
                  className="w-full h-10 px-4 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#18181b] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b] outline-none transition-all placeholder-gray-300"
                  autoFocus
                />

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amount (USD)"
                    className="flex-1 h-10 px-4 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#18181b] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b] outline-none transition-all placeholder-gray-300"
                  />
                  <button
                    type="submit"
                    className="h-10 w-10 bg-[#18181b] text-white rounded-xl flex items-center justify-center hover:bg-gray-900 active:scale-95 transition-all shadow-lg"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Unified Income List - Compacted */}
      <div className="space-y-6">
        <div>
          <h3 className="flex items-center gap-2 text-[#18181b] font-bold text-[10px] uppercase tracking-widest mb-3">
            <DollarSign size={12} /> Income Sources
          </h3>
          <div className="space-y-2.5">
            {allIncomes.map(income => {
              const isStable = income.type === 'Stable';
              return (
                <div key={income.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-[#18181b] transition-all">
                  <div>
                    <div className="font-bold text-[#18181b] text-xs">{income.source}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isStable ? (
                        <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-[#18181b]">
                          <Briefcase size={8} />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Stable</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-[#18181b]">
                          <TrendingUp size={8} />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Variable</span>
                        </div>
                      )}
                      {!isStable && <span className="text-[8px] text-gray-400 font-medium">{income.date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#18181b] tracking-tight text-sm">${income.amountUSD.toLocaleString()}</span>
                    <button onClick={() => deleteIncome(income.id)} className="text-gray-300 hover:text-[#18181b] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {allIncomes.length === 0 && <div className="text-gray-300 text-[10px] italic pl-2">No income sources added yet.</div>}
          </div>
        </div>

        {/* Assets Section - Compacted */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-[#18181b] font-bold text-[10px] uppercase tracking-widest">
              <Landmark size={12} /> Assets
            </h3>
            <span className="text-xs font-bold font-mono tracking-tight bg-gray-100 px-2 py-0.5 rounded text-[#18181b]">
              ${totalAssets.toLocaleString()}
            </span>
          </div>

          {!showAssetForm ? (
            <button
              onClick={() => setShowAssetForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:border-[#18181b] hover:text-[#18181b] transition-all flex items-center justify-center gap-2 mb-4"
            >
              <Plus size={14} /> Add Asset
            </button>
          ) : (
            <form onSubmit={handleAddAsset} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#18181b]">New Asset</span>
                <button type="button" onClick={() => setShowAssetForm(false)} className="text-gray-400 hover:text-[#18181b]"><Trash2 size={12} /></button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  placeholder="Asset Name"
                  className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#18181b] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b] outline-none transition-all placeholder-gray-300"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={assetAmount}
                    onChange={e => setAssetAmount(e.target.value)}
                    placeholder="Value (USD)"
                    className="h-10 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#18181b] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b] outline-none transition-all placeholder-gray-300"
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssetTypeOpen(!isAssetTypeOpen)}
                      className="w-full h-10 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#18181b] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b] outline-none transition-all flex items-center justify-between"
                    >
                      <span>{assetType === 'Lent' ? 'Lent (Owed to you)' : (assetType === 'Loan' ? 'Loan (Debt)' : assetType)}</span>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isAssetTypeOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAssetTypeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {(['Cash', 'Item', 'Lent', 'Loan'] as AssetType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setAssetType(type);
                              setIsAssetTypeOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#18181b] hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-50 last:border-0"
                          >
                            {type === 'Cash' && <Wallet size={12} className="text-gray-400" />}
                            {type === 'Item' && <ShoppingBag size={12} className="text-gray-400" />}
                            {type === 'Lent' && <Coins size={12} className="text-blue-400" />}
                            {type === 'Loan' && <CreditCard size={12} className="text-red-400" />}
                            <span>{type === 'Lent' ? 'Lent (Owed to you)' : (type === 'Loan' ? 'Loan (Debt)' : type)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full h-10 bg-[#18181b] text-white rounded-xl flex items-center justify-center font-bold text-xs hover:bg-gray-900 active:scale-95 transition-all shadow-md"
                >
                  Save Asset
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {sortedAssets.map(asset => {
              const Icon = getAssetIcon(asset.type);
              const isNegative = asset.amountUSD < 0;
              const isLent = asset.type === 'Lent';

              let iconBg = 'bg-gray-50 text-[#18181b]';
              let amountColor = 'text-[#18181b]';

              if (isNegative) {
                iconBg = 'bg-red-50 text-red-500';
                amountColor = 'text-red-500';
              } else if (isLent) {
                iconBg = 'bg-blue-50 text-blue-500';
                amountColor = 'text-blue-600';
              }

              return (
                <div key={asset.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-[#18181b] transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-gray-100 group-hover:border-[#18181b] transition-colors ${iconBg}`}>
                      <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="font-bold text-[#18181b] text-xs">
                        {asset.name}
                        {isLent && <span className="ml-2 text-[7px] uppercase tracking-widest bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Owes You</span>}
                      </div>
                      <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{asset.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold tracking-tight text-sm ${amountColor}`}>
                      {asset.amountUSD.toLocaleString()}
                    </span>
                    <button onClick={() => deleteAsset(asset.id)} className="text-gray-300 hover:text-[#18181b] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {assets.length === 0 && <div className="text-gray-300 text-[10px] italic pl-2">No assets recorded.</div>}
          </div>
        </div>

      </div>
    </div>
  );
};