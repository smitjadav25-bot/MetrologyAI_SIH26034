'use client';
import { Inspection } from '@/types/inspection';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Printer,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';

interface ComplianceResultProps {
  inspection: Inspection;
  onGenerateDocument?: () => void;
  onReset: () => void;
}

export function ComplianceResult({
  inspection,
  onReset
}: ComplianceResultProps) {
  const isPass = inspection.finalStatus === 'PASS';
  const isFail = inspection.finalStatus === 'FAIL';
  const isWarning = inspection.finalStatus === 'WARNING';

  const passedChecks = inspection.ruleResults.filter((r) => r.status === 'PASS');
  const failedChecks = inspection.ruleResults.filter((r) => r.status === 'FAIL');
  const warningChecks = inspection.ruleResults.filter((r) => r.status === 'WARNING');

  const certId = inspection.certificateId;
  const noticeId = inspection.noticeId;

  const pdfUrl = isPass
    ? `/api/pdf/certificate/${certId || inspection.inspectionId}`
    : `/api/pdf/notice/${noticeId || inspection.inspectionId}`;

  const verifyUrl = isPass
    ? `/verify/${certId || inspection.inspectionId}`
    : `/verify/notice/${noticeId || inspection.inspectionId}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Result */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 shadow-sm ${
          isPass
            ? 'bg-emerald-900 border-emerald-800 text-white'
            : isFail
              ? 'bg-red-900 border-red-800 text-white'
              : 'bg-amber-900 border-amber-800 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isPass
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : isFail
                    ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              {isPass ? (
                <ShieldCheck className="w-8 h-8" />
              ) : isFail ? (
                <AlertOctagon className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                Statutory Assessment Outcome
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight">
                {isPass && '✓ COMPLIANCE ASSESSMENT PASSED'}
                {isFail && '✕ NON-COMPLIANCE IDENTIFIED'}
                {isWarning && '⚠ CONDITIONAL / ADVISORY COMPLIANCE'}
              </h1>
              <p className="text-xs sm:text-sm mt-1 opacity-90">
                Product: <span className="font-semibold">{inspection.reviewedData.product_name?.value || 'Packaged Commodity'}</span> | ID: <span className="font-mono">{inspection.inspectionId}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-black/20 px-5 py-3 rounded-xl border border-white/10 shrink-0">
            <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">
              Compliance Score
            </div>
            <div className="text-3xl font-black tracking-tight">
              {inspection.complianceScore}
              <span className="text-base font-medium opacity-70"> / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs text-center">
          <div className="text-emerald-600 font-bold text-lg sm:text-2xl">
            {passedChecks.length}
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-700 mt-0.5">
            Checks Passed
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs text-center">
          <div className={`font-bold text-lg sm:text-2xl ${failedChecks.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {failedChecks.length}
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-700 mt-0.5">
            Checks Failed
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs text-center">
          <div className={`font-bold text-lg sm:text-2xl ${warningChecks.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {warningChecks.length}
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-700 mt-0.5">
            Advisories
          </div>
        </div>
      </div>

      {/* Primary Document Generation / Download Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {isPass ? 'Compliance Certificate Document' : 'Statutory Non-Compliance Notice'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPass
                ? `Certificate ID: ${certId || 'Generated'} — with QR verification`
                : `Notice ID: ${noticeId || 'Generated'} — with evidence images & QR`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition flex-1 sm:flex-none text-center ${
                isPass
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-700 hover:bg-red-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isPass ? 'Download Certificate PDF' : 'Download Notice PDF'}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                const printWindow = window.open(pdfUrl, '_blank');
                if (printWindow) {
                  printWindow.onload = () => printWindow.print();
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <Link
              href={verifyUrl}
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Verification</span>
            </Link>
          </div>
        </div>

        {/* Start New Inspection Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500">
            Inspection complete and securely archived in system history.
          </span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-emerald-700 transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Start New Inspection</span>
          </button>
        </div>
      </div>

      {/* Non-Compliances Detailed Breakdown (If FAIL) */}
      {failedChecks.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-xs overflow-hidden">
          <div className="bg-red-50/80 px-6 py-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-red-900 font-bold text-xs uppercase tracking-wide">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Non-Compliances Identified ({failedChecks.length})</span>
            </div>
            <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
              Action Required
            </span>
          </div>

          <div className="p-6 divide-y divide-slate-100 space-y-4">
            {failedChecks.map((rule, idx) => (
              <div key={idx} className={`${idx > 0 ? 'pt-4' : ''} space-y-2`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {rule.ruleName}
                    </span>
                    <p className="text-[11px] font-medium text-slate-500">
                      {rule.legalReference}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.severity && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded">
                        {rule.severity}
                      </span>
                    )}
                    {rule.sourceImage && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {rule.sourceImage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Observed Value</span>
                    <span className="font-semibold text-slate-800">{rule.observedValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-400 block">Identified Issue</span>
                    <span className="font-medium text-red-900">{rule.issue || rule.explanation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 block">Statutory Expectation</span>
                    <span className="text-slate-700">{rule.expectedCondition || rule.requirement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Checked Full Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Statutory Rules Assessment Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Evaluated under Legal Metrology (Packaged Commodities) Rules, 2011
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {inspection.ruleResults.map((r, i) => (
            <div key={i} className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs">
              <div className="flex items-start sm:items-center gap-3">
                {r.status === 'PASS' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                )}
                {r.status === 'FAIL' && (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
                )}
                {r.status === 'WARNING' && (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                )}
                {r.status === 'NOT_APPLICABLE' && (
                  <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0 mt-0.5 sm:mt-0">
                    -
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-800">{r.ruleName}</div>
                  <div className="text-[11px] text-slate-500">{r.legalReference}</div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pl-7 sm:pl-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    r.status === 'PASS'
                      ? 'bg-emerald-50 text-emerald-700'
                      : r.status === 'FAIL'
                        ? 'bg-red-50 text-red-700'
                        : r.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {r.status}
                </span>
                <div className="text-[11px] text-slate-600 font-mono sm:mt-0.5 max-w-[200px] truncate">
                  {r.observedValue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
