import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, AlertTriangle, ArrowRight, Loader2, Fingerprint } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const Auth: React.FC = () => {
  const { telegramUser } = useFinance();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Case-insensitive check
  const isAllowedUser = telegramUser?.username?.toLowerCase() === 'samuel_melis';

  const handleSmartLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedUser) return;
    
    setLoading(true);
    setMessage(null);

    // Auto-construct email from username
    const email = `tg_${telegramUser.username!.toLowerCase()}@nomadfinance.app`;

    try {
        // 1. Try to Sign In
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!signInError && signInData.session) {
            // Success - App will detect session update in Context
            return; 
        }

        // 2. If Sign In failed, attempt Registration (Auto-Register logic)
        // This handles the "first time" use case seamlessly.
        console.log("Sign In failed, attempting registration...", signInError?.message);

        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: telegramUser?.username,
                    full_name: telegramUser?.first_name
                }
            }
        });

        if (signUpError) {
            // If error is "already registered", it means the password was wrong in step 1.
            if (signUpError.message.toLowerCase().includes("already registered") || 
                signUpError.message.toLowerCase().includes("unique constraint")) {
                    throw new Error("Incorrect password.");
            }
            throw signUpError;
        }

        if (signUpData.session) {
            return; // Success
        } else {
             // Should not happen with auto-confirm off, but just in case
            setMessage({ text: 'Account created. Verification needed.', type: 'success' });
        }

    } catch (error: any) {
        setMessage({ text: error.message, type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  // --- VIEW: ACCESS DENIED ---
  if (!isAllowedUser) {
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
  }

  // --- VIEW: LOGIN (Allowed User Only) ---
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 bg-[#18181b] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-gray-200">
             <Fingerprint size={24} />
           </div>
           <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">Welcome Back</h1>
           <div className="mt-2 text-center">
                <p className="text-lg font-bold text-[#18181b] bg-gray-100 px-3 py-1 rounded-lg inline-block mt-1">
                    @{telegramUser?.username}
                </p>
            </div>
        </div>

        <form onSubmit={handleSmartLogin} className="space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="Enter Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#18181b] focus:ring-2 focus:ring-[#18181b] focus:border-transparent outline-none transition-all placeholder-gray-400"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 px-1 text-center leading-tight">
                Enter your password to sync data across devices. <br/>
                (If first time, this will set your password)
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#18181b] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};