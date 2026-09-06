'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ShieldAlert, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('smit');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(res.error || 'Administrator authentication failed. Invalid credentials.');
      }
    } catch {
      setError('An unexpected error occurred during admin sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = () => {
    setIdentifier('smit');
    setPassword('1234');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-100">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold">
              Central Administration Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Authorized personnel access to platform inspections and inspector management
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 flex items-start gap-3 text-red-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Username / Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="smit"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="pt-2 border-t border-slate-700/80">
            <button
              type="button"
              onClick={handleAutofill}
              className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-950/70 border border-red-800/80 text-red-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-red-400" />
              <span>Autofill Admin Credentials (smit / 1234)</span>
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition font-medium"
          >
            ← Return to MetrologyAI Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
