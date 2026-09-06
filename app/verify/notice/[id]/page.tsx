import { getInspectionByNoticeId, getInspectionById } from '@/lib/storage';
import Link from 'next/link';
import { XCircle, AlertOctagon, FileText, ArrowLeft, Download, AlertTriangle } from 'lucide-react';

interface VerifyNoticePageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyNoticePage({ params }: VerifyNoticePageProps) {
  const { id } = await params;
  const inspection = getInspectionByNoticeId(id) || getInspectionById(id);

  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Record Not Found</h1>
          <p className="text-sm text-slate-600 mb-6">
            No inspection notice record exists matching identifier <span className="font-mono font-semibold">{id}</span>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to MetrologyAI
          </Link>
        </div>
      </div>
    );
  }

  const isSuperseded = inspection.documentStatus === 'Superseded';
  const noticeId = inspection.noticeId || id;
  const failedRules = inspection.ruleResults.filter(r => r.status === 'FAIL');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> MetrologyAI
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-800 rounded-full">
            Official QR Verification
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-red-800 text-white">
            <div className="flex items-center gap-3 mb-2">
              <AlertOctagon className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-lg font-bold">Non-Compliance Notice Verification</h1>
                <p className="text-xs text-red-100">
                  Legal Metrology (Packaged Commodities) Rules, 2011 Assessment Report
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Highlight */}
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-red-800 uppercase tracking-wide">
                    Assessment Status
                  </div>
                  <div className="text-base font-bold text-red-950">
                    NON-COMPLIANCE IDENTIFIED
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-red-800">Compliance Score</div>
                <div className="text-xl font-bold text-red-900">{inspection.complianceScore}/100</div>
              </div>
            </div>

            {/* Document Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Notice Identifier</div>
                <div className="text-slate-900 font-mono font-semibold mt-0.5">{noticeId}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Inspection Reference</div>
                <div className="text-slate-900 font-mono font-semibold mt-0.5">{inspection.inspectionId}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Product / Commodity</div>
                <div className="text-slate-900 font-semibold mt-0.5">
                  {inspection.reviewedData.product_name?.value || 'Packaged Commodity'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Inspection Date</div>
                <div className="text-slate-900 font-medium mt-0.5">
                  {new Date(inspection.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Manufacturer</div>
                <div className="text-slate-900 font-medium mt-0.5 truncate">
                  {inspection.reviewedData.manufacturer_name?.value || 'Declared Manufacturer'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Document Status</div>
                <div className="mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    isSuperseded ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {inspection.documentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Non-Compliances Identified */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Identified Deficiencies ({failedRules.length})
              </h2>
              <div className="space-y-3">
                {failedRules.map((r, i) => (
                  <div key={i} className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-red-900 flex items-center justify-between">
                      <span>• {r.ruleName}</span>
                      {r.severity && <span className="font-semibold text-red-700">[{r.severity}]</span>}
                    </div>
                    <div className="text-slate-700">
                      <span className="font-medium">Observed:</span> {r.observedValue}
                    </div>
                    <div className="text-red-800">
                      <span className="font-medium">Issue:</span> {r.issue || r.explanation}
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">Expected:</span> {r.expectedCondition || r.requirement}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={`/api/pdf/notice/${noticeId}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition"
              >
                <Download className="w-4 h-4" /> Download Notice PDF
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition"
              >
                <FileText className="w-4 h-4" /> Start New Inspection
              </Link>
            </div>

            {/* Legal Prototype Disclaimer */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed space-y-1">
              <p className="font-semibold text-slate-700">Notice on Legal Status:</p>
              <p>
                Prototype document — this assessment/report is generated by MetrologyAI and does not itself constitute an officially issued government notice unless authorized by the competent authority.
              </p>
              <p>
                MetrologyAI provides an automated assessment based on configured rules and information visible in the submitted product images. Final legal and enforcement decisions remain with the competent authority and authorized inspector.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
