import Link from 'next/link';
import { getCurrentInspector, getInspectors, toSafeInspector } from '@/lib/auth';
import { getInspections } from '@/lib/storage';
import { AdminDashboard } from '@/components/AdminDashboard';
import {
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  FileCheck2,
  AlertOctagon,
  ArrowRight,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Camera,
  FileSpreadsheet,
  QrCode,
  Scale,
  Building2,
  ShoppingCart,
  Gavel,
  Check,
  Sparkles,
  LogIn,
  UserPlus,
  Search,
  ExternalLink
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const inspector = await getCurrentInspector();

  // If inspector is NOT logged in, show the dedicated Public Landing Page
  if (!inspector) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto space-y-8 relative z-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
            </div>

            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Automated Statutory Packaging <span className="text-emerald-400">Compliance</span> Inspection
              </h1>
              <p className="text-base sm:text-xl text-slate-300 leading-relaxed">
                Next-generation enforcement technology for Legal Metrology officers. Verify packaged commodity labels, detect declaration violations, and issue authenticated certificates and statutory notices in seconds.
              </p>
            </div>

            {/* Public Calls to Action */}
            <div className="pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg transition transform active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Inspector Sign In</span>
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl border border-slate-700 transition transform active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Register Official Account</span>
              </Link>

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-6 py-4 bg-red-950/70 hover:bg-red-900/90 text-red-300 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl border border-red-700/60 shadow-lg transition transform active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Admin Login</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rule 6 Mandatory Labels</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Font & Dimension Rules</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tamper-Proof QR Codes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Official PDF Documents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
              Platform Features
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Comprehensive Enforcement Engine
            </h2>
            <p className="text-sm text-slate-600">
              Engineered strictly in adherence to the Legal Metrology Act, 2009 and the Packaged Commodities Rules, 2011.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Multi-Angle Label Vision AI
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captures and correlates multi-view packaging images (front, back, side panels, barcodes). Uses high-resolution OCR and vision models to extract 20+ mandatory declaration fields.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Automated PCR 2011 Rules
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates compliance across Rule 6 (Mandatory Declarations), Rule 7 (Font Dimensions), Rule 8 (Exemptions), Rule 9 (Consumer Care), and Rule 18 (MRP tax inclusivity).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Defect Severity & Score
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Categorizes non-compliance into Critical, Major, Moderate, and Minor severity tiers. Automatically computes a weighted compliance score out of 100 with actionable legal remedies.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Cryptographic QR Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every assessment produces a digitally verifiable QR code linking to an immutable record. Retailers, courts, and citizens can instantly verify certificate validity without logging in.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Statutory Notice Generation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For non-compliant packaging, generates formal legal Notices under Section 39/53 with 7-day rectification timelines, compounding details, and evidentiary image attachments.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Human-in-the-Loop Audit
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowers appointed enforcement officers to review extracted data, edit field confidence values, and append official inspector notes before issuing final determinations.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-full text-xs font-semibold">
                Inspectorate Deployment
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Real-World Statutory Use Cases
              </h2>
              <p className="text-sm text-slate-600">
                Serving enforcement divisions across field checks, wholesale warehouses, manufacturing audits, and e-commerce platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Use Case 1 */}
              <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-slate-50/50 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Field Market Surveillance & Retail Spot Checks
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                      Physical Retail & Supermarkets
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Inspectors on field rounds can snap packaging photos on mobile devices. MetrologyAI instantly verifies MRP inclusivity, net quantity font sizes, and manufacturer disclosures on store shelves, cutting inspection time from 45 minutes to under 60 seconds.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Rapid on-site detection of misleading pricing or missing consumer care</span>
                </div>
              </div>

              {/* Use Case 2 */}
              <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-slate-50/50 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Pre-Market FMCG Packaging Approvals
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                      Manufacturing & Packaging Lines
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Brand packers and quality assurance directors can verify digital artwork and production labels against mandatory schedules prior to mass printing, avoiding costly statutory product recalls and compounding penalties.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pre-distribution statutory clearance with official Certificate of Compliance</span>
                </div>
              </div>

              {/* Use Case 3 */}
              <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-slate-50/50 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      E-Commerce & Fulfillment Center Auditing
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                      Online Marketplace Warehouses
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Under Rule 6(10) applicable to online marketplaces, officers inspect packaged inventory in logistics hubs to ensure physical packaging matches the digital declarations displayed to consumers online.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cross-verification of imported goods and country of origin declarations</span>
                </div>
              </div>

              {/* Use Case 4 */}
              <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-slate-50/50 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Consumer Grievance & Legal Adjudication
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                      Statutory Enforcement & Court Evidence
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  When consumer disputes arise regarding deceptive packaging, underweight quantities, or missing expiry, inspectors generate comprehensive, cryptographically signed audit reports admissible in compounding hearings.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tamper-evident chain of custody with timestamped image evidence</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Workflow */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
              Inspection Workflow
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              4-Step Statutory Verification Pipeline
            </h2>
            <p className="text-sm text-slate-600">
              Seamlessly converting packaging imagery into legally binding metrology assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 relative">
              <span className="text-2xl font-black text-emerald-600">01</span>
              <h4 className="font-bold text-slate-900 text-sm">Image Acquisition</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload front, back, nutritional, and barcode panels with instant quality and glare verification.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 relative">
              <span className="text-2xl font-black text-emerald-600">02</span>
              <h4 className="font-bold text-slate-900 text-sm">AI OCR Extraction</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gemini Vision AI extracts 20+ mandatory declarations with confidence ratings per field.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 relative">
              <span className="text-2xl font-black text-emerald-600">03</span>
              <h4 className="font-bold text-slate-900 text-sm">Rule Engine Audit</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Statutory algorithms verify font dimensions, units, addresses, and price inclusions.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 relative">
              <span className="text-2xl font-black text-emerald-600">04</span>
              <h4 className="font-bold text-slate-900 text-sm">Legal Document</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Officer approves evaluation to generate signed PDF Certificate or Statutory Non-Compliance Notice.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bg-slate-900 text-white py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Ready to Conduct Statutory Inspections?
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Sign in to your inspector account to start evaluating packaged commodities or register your enforcement credentials.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
              >
                Sign In as Inspector
              </Link>
              <Link
                href="/register"
                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-700 transition"
              >
                Register Account
              </Link>
              <Link
                href="/admin/login"
                className="px-6 py-3.5 bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-red-700/60 transition"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If user is ADMIN, render the Admin Command Center
  if (inspector.role === 'ADMIN') {
    const allInspections = getInspections();
    const allInspectors = getInspectors().map(toSafeInspector);
    return (
      <AdminDashboard
        currentAdmin={inspector}
        initialInspections={allInspections}
        initialInspectors={allInspectors}
      />
    );
  }

  // If regular inspector IS logged in: STRICT DATA ISOLATION (inspectors only see their own inspections)
  const allInspections = getInspections();
  const inspections = allInspections.filter(i => {
    const insp = i.inspector;
    if (!insp) return false;
    return (
      insp.id === inspector.officerId ||
      insp.id === inspector.id ||
      (insp.name && insp.name.toLowerCase() === inspector.name.toLowerCase())
    );
  });
  const recentInspections = inspections.slice(0, 5);

  const totalInspections = inspections.length;
  const passedCount = inspections.filter(i => i.finalStatus === 'PASS').length;
  const failedCount = inspections.filter(i => i.finalStatus === 'FAIL').length;
  const warningCount = inspections.filter(i => i.finalStatus === 'WARNING').length;
  const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Inspector Welcome & Quick Action Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enforcement Directorate Active Session</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, <span className="text-emerald-700">{inspector.name}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {inspector.designation} • Badge: <span className="font-semibold text-slate-700">{inspector.officerId}</span> • {inspector.jurisdiction}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href="/inspection"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition transform active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Start New Inspection</span>
                </Link>

                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 px-5 py-3 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition"
                >
                  <span>Inspection History</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Inspections
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalInspections}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Certificates Issued
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {passedCount}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-50/50 border border-red-200/80">
                <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                  Notices Issued
                </div>
                <div className="text-2xl font-black text-red-700 mt-1">
                  {failedCount}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Overall Pass Rate
                </div>
                <div className="text-2xl font-black text-amber-800 mt-1">
                  {passRate}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Inspections Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Assessments Conducted
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory evaluations recorded under Legal Metrology Rules, 2011
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

          {recentInspections.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No inspections conducted yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No packaged commodity labels have been inspected yet. Click below to begin your first statutory inspection.
              </p>
              <div className="pt-2">
                <Link
                  href="/inspection"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Start First Inspection</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInspections.map((item) => {
                const productName =
                  item.reviewedData?.product_name?.value ||
                  item.extractedData?.product_name?.value ||
                  'Unnamed Commodity';

                const mrp =
                  item.reviewedData?.mrp?.value ||
                  item.extractedData?.mrp?.value ||
                  'N/A';

                const netQty =
                  item.reviewedData?.net_quantity?.value ||
                  item.extractedData?.net_quantity?.value ||
                  '';

                const uom =
                  item.reviewedData?.unit_of_measurement?.value ||
                  item.extractedData?.unit_of_measurement?.value ||
                  '';

                const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

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
                            <CheckCircle2 className="w-3 h-3" /> PASS
                          </span>
                        )}
                        {item.finalStatus === 'FAIL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" /> NON-COMPLIANT
                          </span>
                        )}
                        {item.finalStatus === 'WARNING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertOctagon className="w-3 h-3" /> WARNING
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-slate-800">
                        {productName}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateFormatted}
                        </span>
                        <span>•</span>
                        <span>Inspector: {item.inspector?.name || 'Authorized Officer'}</span>
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

                    {(() => {
                      const isPass = item.finalStatus === 'PASS' && item.complianceScore === 100;
                      const verifyUrl = isPass
                        ? `/verify/${item.certificateId || item.inspectionId}`
                        : `/verify/notice/${item.noticeId || item.inspectionId}`;

                      return (
                        <div className="flex items-center gap-2">
                          {isPass && item.certificateId ? (
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
                            href={verifyUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            title="View Verification"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </Link>
                        </div>
                      );
                    })()}
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

function Factory(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1" />
      <path d="M12 18h1" />
      <path d="M7 18h1" />
    </svg>
  );
}
