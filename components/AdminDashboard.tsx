'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Inspection } from '@/types/inspection';
import { SafeInspector } from '@/types/auth';
import {
  ShieldAlert,
  Users,
  FileCheck2,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Calendar,
  Search,
  PlusCircle,
  Building2,
  Mail,
  BadgeCheck,
  RefreshCw,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  currentAdmin: SafeInspector;
  initialInspections: Inspection[];
  initialInspectors: SafeInspector[];
}

interface ConfirmItemData {
  type: 'inspection' | 'inspector';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  warning: string;
}

export function AdminDashboard({
  currentAdmin,
  initialInspections,
  initialInspectors
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inspections' | 'inspectors'>('inspections');
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections);
  const [inspectors, setInspectors] = useState<SafeInspector[]>(initialInspectors);

  // Synchronize state when server component passes fresh props
  useEffect(() => {
    setInspections(initialInspections);
  }, [initialInspections]);

  useEffect(() => {
    setInspectors(initialInspectors);
  }, [initialInspectors]);

  const [searchInspection, setSearchInspection] = useState('');
  const [searchInspector, setSearchInspector] = useState('');

  // Stateful in-app confirmation modal (replaces browser window.confirm)
  const [confirmItem, setConfirmItem] = useState<ConfirmItemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Metrics
  const totalInspections = inspections.length;
  const totalInspectors = inspectors.filter(i => i.role !== 'ADMIN').length;
  const passedCount = inspections.filter(i => i.finalStatus === 'PASS').length;
  const failedCount = inspections.filter(i => i.finalStatus === 'FAIL').length;
  const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setActionMessage(null);
    try {
      router.refresh();
      // Also fetch directly from API to ensure state is fresh
      const [resInspections, resInspectors] = await Promise.all([
        fetch('/api/inspections', { cache: 'no-store' }),
        fetch('/api/inspectors', { cache: 'no-store' })
      ]);
      if (resInspections.ok) {
        const d = await resInspections.json();
        if (d.inspections) setInspections(d.inspections);
      }
      if (resInspectors.ok) {
        const d = await resInspectors.json();
        if (d.inspectors) setInspectors(d.inspectors);
      }
      setActionMessage({ type: 'success', text: 'Data refreshed successfully from platform database.' });
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to refresh data.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmItem) return;
    const { type, id, title } = confirmItem;
    setIsDeleting(true);
    setActionMessage(null);

    try {
      const endpoint = type === 'inspection'
        ? `/api/inspections/${encodeURIComponent(id)}`
        : `/api/inspectors/${encodeURIComponent(id)}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to delete ${type}.`);
      }

      if (type === 'inspection') {
        setInspections(prev =>
          prev.filter(
            i =>
              i.inspectionId.toLowerCase() !== id.toLowerCase() &&
              (i.certificateId?.toLowerCase() !== id.toLowerCase()) &&
              (i.noticeId?.toLowerCase() !== id.toLowerCase())
          )
        );
        setActionMessage({
          type: 'success',
          text: `Inspection record ${title} has been permanently deleted.`
        });
      } else {
        setInspectors(prev =>
          prev.filter(
            i =>
              i.id !== id &&
              i.officerId !== id &&
              i.name.toLowerCase() !== title.toLowerCase()
          )
        );
        setActionMessage({
          type: 'success',
          text: `Inspector "${title}" has been deleted from the registry.`
        });
      }

      setConfirmItem(null);
      router.refresh();
    } catch (err: unknown) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : `Error executing deletion.`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredInspections = inspections.filter(item => {
    const q = searchInspection.toLowerCase();
    const prodName = (item.reviewedData?.product_name?.value || item.extractedData?.product_name?.value || '').toLowerCase();
    const inspName = (item.inspector?.name || '').toLowerCase();
    const inspId = (item.inspector?.id || '').toLowerCase();
    const id = item.inspectionId.toLowerCase();
    return prodName.includes(q) || inspName.includes(q) || inspId.includes(q) || id.includes(q);
  });

  const filteredInspectors = inspectors.filter(item => {
    const q = searchInspector.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.officerId.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.jurisdiction.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Admin Header Banner */}
        <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full text-xs font-semibold mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Central Platform Administrator Control Center</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome Administrator, <span className="text-red-400">{currentAdmin.name}</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Full administrative authority to monitor, audit, and delete platform inspections and inspector records
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-700 shadow-sm transition disabled:opacity-50"
                  title="Synchronize database records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
                </button>

                <Link
                  href="/inspection"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Inspection</span>
                </Link>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Inspections
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {totalInspections}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Inspectors
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {totalInspectors}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Platform Pass Rate
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {passRate}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Notices Issued
                </div>
                <div className="text-2xl font-black text-red-400 mt-1">
                  {failedCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Status Notification */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('inspections')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'inspections'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>All Platform Inspections ({inspections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspectors')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'inspectors'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Inspectors ({inspectors.length})</span>
          </button>
        </div>

        {/* Tab 1: All Inspections */}
        {activeTab === 'inspections' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Master Inspection Archive
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage evaluations conducted across all enforcement divisions
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={searchInspection}
                  onChange={(e) => setSearchInspection(e.target.value)}
                  placeholder="Search by product, inspector, ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {filteredInspections.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No matching inspections found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredInspections.map((item) => {
                  const productName =
                    item.reviewedData?.product_name?.value ||
                    item.extractedData?.product_name?.value ||
                    'Unnamed Commodity';

                  const mrp = item.reviewedData?.mrp?.value || 'N/A';
                  const netQty = item.reviewedData?.net_quantity?.value || '';
                  const uom = item.reviewedData?.unit_of_measurement?.value || '';

                  let dateFormatted = item.createdAt;
                  try {
                    dateFormatted = new Date(item.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch {
                    // fallback
                  }

                  return (
                    <div
                      key={item.inspectionId}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 p-2 rounded-xl transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.inspectionId}
                          </span>
                          {item.finalStatus === 'PASS' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> PASS ({item.complianceScore}/100)
                            </span>
                          )}
                          {item.finalStatus === 'FAIL' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" /> NON-COMPLIANT ({item.complianceScore}/100)
                            </span>
                          )}
                          {item.finalStatus === 'WARNING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertOctagon className="w-3 h-3" /> WARNING ({item.complianceScore}/100)
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-bold text-slate-800">
                          {productName}
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1" suppressHydrationWarning>
                            <Calendar className="w-3.5 h-3.5" />
                            {dateFormatted}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            Officer: {item.inspector?.name || 'Unassigned'} ({item.inspector?.id || 'N/A'})
                          </span>
                          {netQty && (
                            <>
                              <span>•</span>
                              <span>Qty: {netQty} {uom}</span>
                            </>
                          )}
                          {mrp !== 'N/A' && (
                            <>
                              <span>•</span>
                              <span>MRP: {mrp}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.finalStatus === 'PASS' && item.certificateId ? (
                          <a
                            href={`/api/pdf/certificate/${item.certificateId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </a>
                        ) : (
                          <a
                            href={`/api/pdf/notice/${item.noticeId || item.inspectionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Notice</span>
                          </a>
                        )}

                        <Link
                          href={`/verify/${item.certificateId || item.noticeId || item.inspectionId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>

                        {/* Admin Delete Action Button with In-App Confirmation Modal */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmItem({
                              type: 'inspection',
                              id: item.inspectionId,
                              title: item.inspectionId,
                              subtitle: productName,
                              badge: item.finalStatus,
                              warning: 'This inspection record, OCR verification details, and documents will be permanently purged from the metrology archive.'
                            });
                          }}
                          title="Delete Inspection Record"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 bg-red-50 border border-red-200 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Registered Inspectors */}
        {activeTab === 'inspectors' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Inspector Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage active enforcement accounts and jurisdictional authorizations
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={searchInspector}
                  onChange={(e) => setSearchInspector(e.target.value)}
                  placeholder="Search by name, officer ID, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredInspectors.map((insp) => {
                const isAdminAccount = insp.role === 'ADMIN' || insp.name.toLowerCase() === 'smit';

                const inspectorInspectionsCount = inspections.filter(
                  i =>
                    i.inspector?.id === insp.officerId ||
                    i.inspector?.id === insp.id ||
                    (i.inspector?.name && i.inspector.name.toLowerCase() === insp.name.toLowerCase())
                ).length;

                return (
                  <div
                    key={insp.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 p-2 rounded-xl transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {insp.name}
                        </span>
                        {isAdminAccount ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            ADMINISTRATOR
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            INSPECTOR
                          </span>
                        )}
                        <span className="font-mono text-xs text-slate-500 font-semibold">
                          Badge: {insp.officerId}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {insp.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {insp.jurisdiction}
                        </span>
                        <span>•</span>
                        <span>{insp.designation}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-0.5">
                        Inspections Conducted: <span className="font-bold text-slate-700">{inspectorInspectionsCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdminAccount ? (
                        <span className="text-[11px] text-slate-400 italic px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                          Root Admin (Protected)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmItem({
                              type: 'inspector',
                              id: insp.id,
                              title: insp.name,
                              subtitle: `Badge: ${insp.officerId} • ${insp.email}`,
                              warning: `Officer "${insp.name}" will be deleted immediately and will lose platform login authorization.`
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 bg-red-50 border border-red-200 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Inspector</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal (Replaces browser window.confirm dialog) */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {confirmItem.type === 'inspection' ? 'Delete Inspection Record' : 'Delete Inspector Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Administrative Permanent Purge
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setConfirmItem(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Target Record
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono font-bold text-sm text-slate-900">
                  {confirmItem.title}
                </span>
                {confirmItem.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {confirmItem.badge}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 font-medium truncate">
                {confirmItem.subtitle}
              </div>
            </div>

            <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {confirmItem.warning}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
