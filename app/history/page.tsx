import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentInspector } from '@/lib/auth';
import { getInspections } from '@/lib/storage';
import {
  PlusCircle,
  FileCheck2,
  AlertOctagon,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const inspector = await getCurrentInspector();
  if (!inspector) {
    redirect('/login?redirect=/history');
  }

  const all = getInspections();
  const inspections = inspector.role === 'ADMIN'
    ? all
    : all.filter(i => {
        const insp = i.inspector;
        if (!insp) return false;
        return (
          insp.id === inspector.officerId ||
          insp.id === inspector.id ||
          (insp.name && insp.name.toLowerCase() === inspector.name.toLowerCase())
        );
      });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> MetrologyAI
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-800">Inspection History</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Statutory Inspection History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Archived compliance inspections under Legal Metrology (Packaged Commodities) Rules, 2011
            </p>
          </div>

          <Link
            href="/inspection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>New Inspection</span>
          </Link>
        </div>

        {/* History Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {inspections.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-800">No inspections yet.</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Completed package label inspections and issued certificates or notices will appear here.
              </p>
              <div className="pt-2">
                <Link
                  href="/inspection"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" /> Start Inspection
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <span>Inspection Record</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-slate-100">
                {inspections.map((item) => {
                  const isPass = item.finalStatus === 'PASS' && item.complianceScore === 100;
                  const isFail = !isPass;

                  const docUrl = isPass
                    ? `/api/pdf/certificate/${item.certificateId || item.inspectionId}`
                    : `/api/pdf/notice/${item.noticeId || item.inspectionId}`;

                  const verifyUrl = isPass
                    ? `/verify/${item.certificateId || item.inspectionId}`
                    : `/verify/notice/${item.noticeId || item.inspectionId}`;

                  return (
                    <div
                      key={item.inspectionId}
                      className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-700'
                              : isFail
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isPass ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : isFail ? (
                            <XCircle className="w-6 h-6" />
                          ) : (
                            <AlertOctagon className="w-6 h-6" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {item.inspectionId}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isFail
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {item.finalStatus} ({item.complianceScore}/100)
                            </span>
                            {item.documentStatus === 'Superseded' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                                Superseded
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-800">
                            {item.reviewedData.product_name?.value || 'Packaged Commodity'}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleString('en-IN')}
                            </span>
                            <span>•</span>
                            <span>Mfg: {item.reviewedData.manufacturer_name?.value || 'N/A'}</span>
                            <span>•</span>
                            <span>Qty: {item.reviewedData.net_quantity?.value || 'N/A'}</span>
                            <span>•</span>
                            <span>MRP: {item.reviewedData.mrp?.value || 'N/A'}</span>
                          </div>

                          {item.inspectorRemarks && (
                            <p className="text-[11px] text-slate-600 italic line-clamp-1 pt-0.5">
                              &ldquo;{item.inspectorRemarks}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition ${
                            isPass
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-red-700 hover:bg-red-800'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isPass ? 'Certificate' : 'Notice'}</span>
                        </a>

                        <Link
                          href={verifyUrl}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                          title="View QR Verification"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Verify</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
