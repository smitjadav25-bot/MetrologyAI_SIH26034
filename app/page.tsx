import Link from 'next/link';
import { getInspections } from '@/lib/storage';
import {
  ShieldCheck,
  PlusCircle,
  FileCheck2,
  AlertOctagon,
  ArrowRight,
  Download,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const inspections = getInspections();
  const recentInspections = inspections.slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              METROLOGY<span className="text-emerald-600">AI</span>
            </h1>

            <p className="text-lg sm:text-xl font-bold text-slate-700">
              Packaged Commodity Compliance Inspection
            </p>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-1">
              Analyze product packaging, verify required declarations, and generate an inspection assessment under statutory Legal Metrology rules.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/inspection"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Start New Inspection</span>
              </Link>

              <Link
                href="/history"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition"
              >
                <span>View Inspection History</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Inspections Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Inspections
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived assessments conducted under Legal Metrology Rules, 2011
              </p>
            </div>

            {recentInspections.length > 0 && (
              <Link
                href="/history"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <span>View All ({inspections.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Empty State per Section 8 & 50: DO NOT create fake data! */}
          {recentInspections.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No inspections yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No packaged commodity labels have been inspected yet. Click below to begin your first inspection.
              </p>
              <div className="pt-2">
                <Link
                  href="/inspection"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" /> Start First Inspection
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInspections.map((item) => {
                const isPass = item.finalStatus === 'PASS';
                const isFail = item.finalStatus === 'FAIL';

                const docUrl = isPass
                  ? `/api/pdf/certificate/${item.certificateId || item.inspectionId}`
                  : `/api/pdf/notice/${item.noticeId || item.inspectionId}`;

                return (
                  <div
                    key={item.inspectionId}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-700'
                            : isFail
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isPass ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isFail ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <AlertOctagon className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.inspectionId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPass
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isFail
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.finalStatus} ({item.complianceScore}/100)
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {item.reviewedData.product_name?.value || 'Packaged Commodity'}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <span>•</span>
                          <span>{item.inspector.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isPass ? 'Certificate' : 'Notice'}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
