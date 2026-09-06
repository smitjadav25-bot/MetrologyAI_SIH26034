'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  History,
  User,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function Navbar() {
  const pathname = usePathname();
  const { inspector, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isInspection = pathname?.startsWith('/inspection');
  const isHistory = pathname?.startsWith('/history');
  const isDashboard = pathname === '/';
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  const isAdminLogin = pathname === '/admin/login';

  const isAdmin = inspector?.role === 'ADMIN';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-white flex items-center justify-center font-bold tracking-tight shadow-sm transition ${
              isAdmin
                ? 'bg-red-950 group-hover:bg-red-900'
                : 'bg-slate-900 group-hover:bg-slate-800'
            }`}
          >
            {isAdmin ? (
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                METROLOGY<span className={isAdmin ? 'text-red-600' : 'text-emerald-600'}>AI</span>
              </span>
              {inspector && (
                <span
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-red-100 text-red-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Inspector'}
                </span>
              )}
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">
              Packaged Commodities Rules, 2011
            </p>
          </div>
        </Link>

        {/* Desktop Navigation (>= md) */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
          ) : inspector ? (
            /* Logged In Desktop Navigation */
            <>
              <Link
                href="/"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isDashboard
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/inspection"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  isInspection
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Inspection</span>
              </Link>

              <Link
                href="/history"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isHistory
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>History</span>
              </Link>

              {/* Inspector Identity Badge & Logout */}
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="hidden lg:flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                      {inspector.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ID: {inspector.officerId}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition border border-slate-200 hover:border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated Public Desktop Navigation */
            <>
              <a
                href="/#features"
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
              >
                Features
              </a>
              <a
                href="/#use-cases"
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
              >
                Use Cases
              </a>

              <Link
                href="/login"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isLogin
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Inspector Login</span>
              </Link>

              <Link
                href="/register"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isRegister
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>

              <Link
                href="/admin/login"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isAdminLogin
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-50 border border-red-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Admin Login</span>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Quick Action & Hamburger Toggle (< md) */}
        <div className="flex md:hidden items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
          ) : inspector ? (
            <>
              <Link
                href="/inspection"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Overlay & Menu (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {inspector ? (
            /* Logged In Mobile Drawer */
            <div className="space-y-2">
              {/* User Identity Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      {inspector.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ID: {inspector.officerId} • {inspector.designation}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isAdmin ? 'Admin' : 'Inspector'}
                </span>
              </div>

              {/* Navigation Links */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isDashboard ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </Link>

              <Link
                href="/inspection"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isInspection ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Inspection</span>
              </Link>

              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isHistory ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Inspection Records History</span>
              </Link>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Session</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated Mobile Drawer */
            <div className="space-y-2">
              <a
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Platform Features</span>
              </a>

              <a
                href="/#use-cases"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Enforcement Use Cases</span>
              </a>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    isLogin ? 'bg-slate-900 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Inspector Login</span>
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${
                    isRegister ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>Register Inspector Account</span>
                </Link>

                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${
                    isAdminLogin ? 'bg-red-800 text-white border-red-800' : 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Administrator Access</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

