'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, PlusCircle, History, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const isInspection = pathname?.startsWith('/inspection');
  const isHistory = pathname?.startsWith('/history');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold tracking-tight shadow-sm group-hover:bg-slate-800 transition">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                METROLOGY<span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                Inspectorate
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">
              Packaged Commodities Rules, 2011
            </p>
          </div>
        </Link>

        {/* Minimal Inspector Navigation */}
        <nav className="flex items-center gap-2 sm:gap-4">
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
            <span className="hidden sm:inline">Inspection History</span>
            <span className="sm:hidden">History</span>
          </Link>

          {/* Inspector Badge */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-700">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-medium">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 leading-tight">Inspector S. K. Verma</div>
              <div className="text-[10px] text-slate-500">Officer ID: INS-402</div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
