import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ArrowRight, Loader2, Fingerprint } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const Auth: React.FC = () => {
  const { isTelegramEnv, telegramUser } = useFinance();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Pre-fill email if in Telegram
  useEffect(() => {
    if (isTelegramEnv && telegramUser?.username) {
        const autoEmail = `tg_${telegramUser.username.toLowerCase()}@nomadfinance.app`;
        setEmail(autoEmail);
    }
  }, [isTelegramEnv, telegramUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // TELEGRAM FLOW: Smart Auth (Try Login, if fail -> Register)
    if (isTelegramEnv) {
        try {
            // 1. Try to Sign In
            const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!signInError && signInData.session) {
                // Success
                return; 
            }

            // 2. If Sign In failed, it might be a new user. Try to Sign Up.
            // Note: If the error was "Invalid login credentials", it could mean Wrong Password OR New User.
            // We assume New User and try to register. If User Exists, SignUp will fail.
            
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
                // If Sign Up fails, it usually means the user ALREADY exists but provided the wrong password in step 1.
                if (signUpError.message.includes("already registered") || signUpError.message.includes("unique constraint")) {
                     throw new Error("Incorrect password for this account.");
                }
                throw signUpError;
            }

            if (signUpData.session) {
                // Success - New User Registered and Logged In
                return;
            } else {
                setMessage({ text: 'Account created. Please check if verification is needed.', type: 'success' });
            }

        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
        return;
    }

    // NORMAL BROWSER FLOW
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: 'Check your email for the confirmation link!', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 bg-[#18181b] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-gray-200">
             <Lock size={20} />
           </div>
           <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">NomadFinance</h1>
           
           {isTelegramEnv && telegramUser ? (
                <div className="mt-2 text-center">
                    <p className="text-sm text-gray-500 font-medium">Welcome,</p>
                    <p className="text-lg font-bold text-[#18181b] bg-gray-100 px-3 py-1 rounded-lg inline-block mt-1">
                        @{telegramUser.username || telegramUser.first_name}
                    </p>
                </div>
           ) : (
                <p className="text-sm text-gray-400 font-medium mt-1">
                    {isSignUp ? 'Create your account' : 'Welcome back'}
                </p>
           )}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Email Field - Hidden if Telegram Env */}
          {!isTelegramEnv && (
            <div>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                </div>
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#18181b] focus:ring-2 focus:ring-[#18181b] focus:border-transparent outline-none transition-all placeholder-gray-400"
                />
                </div>
            </div>
          )}
          
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                {isTelegramEnv ? <Fingerprint size={16} /> : <Lock size={16} />}
              </div>
              <input
                type="password"
                placeholder={isTelegramEnv ? "Enter or Set Password" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#18181b] focus:ring-2 focus:ring-[#18181b] focus:border-transparent outline-none transition-all placeholder-gray-400"
              />
            </div>
            {isTelegramEnv && (
                <p className="text-[10px] text-gray-400 mt-2 px-1 text-center leading-tight">
                    If this is your first time, this password will be used to create your secure account.
                </p>
            )}
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
                {isTelegramEnv ? 'Continue' : (isSignUp ? 'Create Account' : 'Sign In')}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {!isTelegramEnv && (
            <div className="mt-6 text-center">
            <button
                onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                }}
                className="text-xs font-bold text-gray-400 hover:text-[#18181b] transition-colors"
            >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};