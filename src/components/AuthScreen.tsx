import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthResponse } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (data: AuthResponse) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function AuthScreen({ onAuthSuccess, addToast }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setErrorMsg('Please fill in all details');
      return;
    }

    if (trimmedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please check credentials.');
      }

      // Store in localStorage
      localStorage.setItem('task_manager_auth_token', data.token);
      
      // Notify Parent and trigger UI rendering
      addToast(
        isLogin 
          ? `Welcome back, ${data.user.username}!` 
          : `Account successfully created! Welcome, ${data.user.username}!`, 
        'success'
      );
      onAuthSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error');
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-80 h-84 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500 text-white shadow-xl mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              ></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans">
            Task Orchestrator
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin
              ? 'Log in to securely orchestrate your stage workflows.'
              : 'Register an account and start managing workflows today.'}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700/60 shadow-2xl rounded-3xl p-8 backdrop-blur-md">
          {/* Form Selector Tabs */}
          <div className="flex bg-slate-900 p-1.5 rounded-xl mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" id="auth-form">
            {/* Username Input */}
            <div>
              <label className="block text-slate-300 font-medium text-xs mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="intern_coder"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-sans text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-300 font-medium text-xs mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-sans text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Error Message banner */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg border border-indigo-400/20 shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Access Dashboard' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Prompt info */}
          <div className="mt-6 pt-5 border-t border-slate-700/50 text-center">
            <p className="text-slate-500 text-xs">
              Powered by a secure local Express + Cryptographic Session backend.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
