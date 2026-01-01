import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const Auth: React.FC = () => {
  const { telegramUser } = useFinance();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
        
        <div className="flex flex-col items-center mb-6">
           <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-sm">
             <Lock size={20} />
           </div>
           <h1 className="text-xl font-bold text-[#18181b] tracking-tight">Access Denied</h1>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Private App</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    This application is restricted to a specific user.
                </p>
                {telegramUser ? (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-400">Current User:</p>
                        <p className="text-sm font-bold text-[#18181b]">@{telegramUser.username || telegramUser.id}</p>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 mt-2">No Telegram user detected.</p>
                )}
            </div>
        </div>

        <p className="text-[10px] text-gray-400 font-mono">NomadFinance v3.3</p>
      </div>
    </div>
  );
};