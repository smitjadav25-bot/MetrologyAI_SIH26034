'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ShieldAlert, PlusCircle, History, User, LogOut, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function Navbar() {
  const pathname = usePathname();
  const { inspector, isLoading, logout } = useAuth();

  const isInspection = pathname?.startsWith('/inspection');
  const isHistory = pathname?.startsWith('/history');
  const isDashboard = pathname === '/';
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  const isAdminLogin = pathname === '/admin/login';

  const isAdmin = inspector?.role === 'ADMIN';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold tracking-tight shadow-sm transition ${isAdmin ? 'bg-red-950 group-hover:bg-red-900' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
            {isAdmin ? (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                METROLOGY<span className={isAdmin ? 'text-red-600' : 'text-emerald-600'}>AI</span>
              </span>
              {inspector && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isAdmin ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isAdmin ? 'Admin' : 'Inspectorate'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">
              Packaged Commodities Rules, 2011
            </p>
          </div>
        </Link>

        {/* Navigation depends on Auth State */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
          ) : inspector ? (
            /* Logged In Navigation */
            <>
              <Link
                href="/"
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
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
                <span className="hidden sm:inline">History</span>
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
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated Public Navigation */
            <>
              <a
                href="/#features"
                className="hidden md:inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
              >
                Features
              </a>
              <a
                href="/#use-cases"
                className="hidden md:inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
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
                <span className="hidden sm:inline">Register</span>
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
      </div>
    </header>
  );
}
