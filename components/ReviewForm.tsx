'use client';

import { useState } from 'react';
import {
  ExtractedData,
  ExtractedField,
  UploadedImageEvidence,
  ContrastLevel,
  GeneralLegibilityLevel,
  PackagingExemptionType
} from '@/types/inspection';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Edit3,
  ShieldAlert,
  FileCheck2,
  Palette,
  Eye,
  ShieldCheck,
  Info,
  Crosshair,
  ArrowRight
} from 'lucide-react';
import { BoundingBoxImageViewer } from '@/components/BoundingBoxImageViewer';

interface ReviewFormProps {
  initialData: ExtractedData;
  images: UploadedImageEvidence[];
  sameProductWarning?: string | null;
  onSubmit: (reviewedData: ExtractedData, inspectorRemarks: string) => void;
  isSubmitting?: boolean;
}

export function ReviewForm({
  initialData,
  images,
  sameProductWarning,
  onSubmit,
  isSubmitting = false
}: ReviewFormProps) {
  const [data, setData] = useState<ExtractedData>(initialData);
  const [remarks, setRemarks] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeFieldKey, setActiveFieldKey] = useState<keyof ExtractedData | null>(null);

  const currentExemption = (data.packaging_exemption?.value || data.contrast_assessment?.exemptionType || 'NONE') as PackagingExemptionType;
  const currentMrpContrast = (data.color_contrast_mrp?.value || data.contrast_assessment?.mrpContrast || 'CONSPICUOUS') as ContrastLevel;
  const currentNetQtyContrast = (data.color_contrast_net_quantity?.value || data.contrast_assessment?.netQuantityContrast || 'CONSPICUOUS') as ContrastLevel;
  const currentLegibility = (data.general_legibility?.value || data.contrast_assessment?.generalLegibility || 'LEGIBLE') as GeneralLegibilityLevel;

  const handleExemptionChange = (exemption: PackagingExemptionType) => {
    setData((prev) => ({
      ...prev,
      packaging_exemption: {
        value: exemption,
        confidence: 'high',
        sourceImage: null,
        modifiedByInspector: true
      },
      contrast_assessment: {
        ...(prev.contrast_assessment || {
          mrpContrast: 'CONSPICUOUS',
          netQuantityContrast: 'CONSPICUOUS',
          generalLegibility: 'LEGIBLE',
          exemptionType: 'NONE'
        }),
        exemptionType: exemption
      }
    }));
  };

  const handleContrastSelect = (
    field: 'color_contrast_mrp' | 'color_contrast_net_quantity' | 'general_legibility',
    val: string
  ) => {
    setData((prev) => {
      const isModified = val !== (initialData[field]?.value || '');
      const updated: ExtractedData = {
        ...prev,
        [field]: {
          value: val,
          confidence: 'high',
          sourceImage: null,
          modifiedByInspector: isModified
        }
      };
      if (updated.contrast_assessment) {
        if (field === 'color_contrast_mrp') {
          updated.contrast_assessment = { ...updated.contrast_assessment, mrpContrast: val as ContrastLevel };
        } else if (field === 'color_contrast_net_quantity') {
          updated.contrast_assessment = { ...updated.contrast_assessment, netQuantityContrast: val as ContrastLevel };
        } else if (field === 'general_legibility') {
          updated.contrast_assessment = { ...updated.contrast_assessment, generalLegibility: val as GeneralLegibilityLevel };
        }
      }
      return updated;
    });
  };

  const handleFieldChange = (key: keyof ExtractedData, newValue: string) => {
    setData((prev) => {
      const current = prev[key] as ExtractedField | undefined;
      const isModified = newValue.trim() !== (initialData[key] as any)?.value?.trim();
      return {
        ...prev,
        [key]: {
          ...current,
          value: newValue.trim() === '' ? null : newValue,
          modifiedByInspector: isModified
        }
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data, remarks);
  };

  const renderConfidenceBadge = (field?: ExtractedField) => {
    if (!field) return null;
    if (field.modifiedByInspector) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
          <Edit3 className="w-2.5 h-2.5" /> Modified by Inspector
        </span>
      );
    }

    if (!field.value) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
          Not detected
        </span>
      );
    }

    if (field.confidence === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" /> High confidence
        </span>
      );
    }

    if (field.confidence === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
          <AlertTriangle className="w-2.5 h-2.5" /> Medium confidence
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
        <HelpCircle className="w-2.5 h-2.5" /> Low confidence
      </span>
    );
  };

  const renderFieldInput = (
    label: string,
    key: keyof ExtractedData,
    placeholder: string,
    isTextarea: boolean = false,
    helperText?: string
  ) => {
    const field = data[key] as ExtractedField<string | null> | undefined;
    const val = field?.value || '';
    const isFieldActive = activeFieldKey === key;
    const hasBoundingBox = !!field?.boundingBox;

    return (
      <div
        className={`space-y-1.5 p-2 rounded-xl transition ${
          isFieldActive
            ? 'bg-amber-50/60 ring-2 ring-amber-400/80 border border-amber-300/80 shadow-xs'
            : 'hover:bg-slate-50/50'
        }`}
        onClick={() => setActiveFieldKey(key)}
      >
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`field-${key}`}
            className={`text-xs font-semibold cursor-pointer ${
              isFieldActive ? 'text-amber-950 font-bold' : 'text-slate-800'
            }`}
          >
            {label}
          </label>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {hasBoundingBox && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFieldKey(key);
                }}
                title="Locate label on packaging image (zooms in)"
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md transition ${
                  isFieldActive
                    ? 'bg-amber-200 text-amber-950 border border-amber-400 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <Crosshair className="w-2.5 h-2.5" />
                <span>Locate</span>
              </button>
            )}
            {field?.sourceImage && (
              <span className="text-[10px] font-mono text-slate-400">
                {field.sourceImage}
              </span>
            )}
            {renderConfidenceBadge(field)}
          </div>
        </div>

        {isTextarea ? (
          <textarea
            id={`field-${key}`}
            rows={2}
            value={val}
            onFocus={() => setActiveFieldKey(key)}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={`w-full text-xs rounded-lg px-3 py-2 border transition ${
              isFieldActive
                ? 'border-amber-400 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500'
                : field?.modifiedByInspector
                ? 'border-blue-300 bg-blue-50/20 text-slate-900 focus:ring-2 focus:ring-blue-500'
                : 'border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900'
            }`}
          />
        ) : (
          <input
            id={`field-${key}`}
            type="text"
            value={val}
            onFocus={() => setActiveFieldKey(key)}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={`w-full text-xs rounded-lg px-3 py-2 border transition ${
              isFieldActive
                ? 'border-amber-400 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500'
                : field?.modifiedByInspector
                ? 'border-blue-300 bg-blue-50/20 text-slate-900 focus:ring-2 focus:ring-blue-500'
                : 'border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900'
            }`}
          />
        )}
        {helperText && (
          <p className="text-[10px] text-slate-400">{helperText}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning banner if images might be from different products */}
      {sameProductWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-900">Packaging Verification Advisory</div>
            <div className="text-xs text-amber-800 mt-0.5">{sameProductWarning}</div>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Reference Images Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Area (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Product Identification */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Product Identification
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Rule 6(1)(a)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFieldInput('Product / Generic Name', 'product_name', 'e.g. Marie Biscuits')}
              {renderFieldInput('Category / Description', 'product_category', 'e.g. Biscuits / Baked Food')}
            </div>
          </div>

          {/* Card 2: Net Quantity & Pricing */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                2. Quantity & Retail Pricing
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Rule 6(1)(c) & 6(1)(e)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderFieldInput('Net Quantity', 'net_quantity', 'e.g. 500 g, 1 L, 10 units')}
              {renderFieldInput('Unit of Measurement', 'unit_of_measurement', 'e.g. g, kg, ml, l, pcs')}
              {renderFieldInput('Maximum Retail Price (MRP)', 'mrp', 'e.g. ₹120.00')}
              {renderFieldInput('Tax Declaration', 'mrp_tax_declaration', 'e.g. incl. of all taxes')}
            </div>
          </div>

          {/* Card 3: Manufacturer & Origin */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Manufacturer, Packer & Origin
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Rule 6(1)(b) & 6(10)</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFieldInput('Manufacturer Name', 'manufacturer_name', 'e.g. ABC Foods Pvt Ltd')}
                {renderFieldInput('Country of Origin', 'country_of_origin', 'e.g. India')}
              </div>
              {renderFieldInput('Complete Manufacturer Address', 'manufacturer_address', 'Premises, Street, City, State, PIN code', true)}

              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFieldInput('Packer Name (Optional)', 'packer_name', 'If different from manufacturer')}
                {renderFieldInput('Packer Address (Optional)', 'packer_address', 'Address of packer')}
                {renderFieldInput('Importer Name (If imported)', 'importer_name', 'Name of Indian importer')}
                {renderFieldInput('Importer Address (If imported)', 'importer_address', 'Address of importer')}
              </div>
            </div>
          </div>

          {/* Card 4: Dates & Consumer Care */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                4. Dates, Grievance Redressal & Traceability
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Rule 6(1)(d), 6(1)(n), 6(1)(g)</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderFieldInput('Mfg Date', 'date_of_manufacture', 'MM/YYYY')}
                {renderFieldInput('Packing Date', 'date_of_packing', 'MM/YYYY')}
                {renderFieldInput('Best Before / Expiry', 'best_before_use_by', 'e.g. 12 months')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFieldInput('Consumer Care Phone', 'consumer_care_phone', 'e.g. 1800-XXX-XXXX')}
                {renderFieldInput('Consumer Care Email', 'consumer_care_email', 'e.g. support@brand.com')}
              </div>
              {renderFieldInput('Consumer Care Address', 'consumer_care_address', 'Postal address for consumer complaints')}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderFieldInput('Batch / Lot Number', 'batch_or_lot_no', 'e.g. BATCH-9812')}
                {renderFieldInput('Barcode / EAN', 'barcode', 'e.g. 8901234567890')}
              </div>
            </div>
          </div>

          {/* Card 5: Colour Contrast & Statutory Legibility (Rule 9) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  5. Colour Contrast & Statutory Legibility
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Rule 9(1)(a) & 9(1)(b)</span>
            </div>

            {/* Packaging Exemption Selector (Rule 9(1) Proviso) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Packaging Exemption Category (Rule 9(1) Proviso)</span>
                {data.packaging_exemption?.modifiedByInspector && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Modified
                  </span>
                )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleExemptionChange('NONE')}
                  className={`px-3 py-2 rounded-lg text-left border transition text-xs ${
                    currentExemption === 'NONE'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-500 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-bold">Standard Packaging</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Strict contrast required</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExemptionChange('BLOWN_FORMED_MOLDED')}
                  className={`px-3 py-2 rounded-lg text-left border transition text-xs ${
                    currentExemption === 'BLOWN_FORMED_MOLDED'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-500 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-bold">Blown / Molded / Embossed</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Glass/plastic surface exempt</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExemptionChange('HAND_SCRIPTED')}
                  className={`px-3 py-2 rounded-lg text-left border transition text-xs ${
                    currentExemption === 'HAND_SCRIPTED'
                      ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-1 ring-amber-500 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-bold">Hand-scripted Label</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Exempt if clearly legible</div>
                </button>
              </div>

              {currentExemption === 'BLOWN_FORMED_MOLDED' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Statutory Exemption Active:</span> Under the Proviso to Rule 9(1), declarations blown, formed, molded, embossed, or perforated onto glass or plastic packages are exempt from distinct contrasting colour requirements.
                  </div>
                </div>
              )}

              {currentExemption === 'HAND_SCRIPTED' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Hand-scripted Proviso:</span> Rigid colour contrast is not enforced provided handwriting is clear, unambiguous, and completely legible under Rule 9(1)(a).
                  </div>
                </div>
              )}
            </div>

            {/* Contrast Evaluations */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              {/* MRP Contrast */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    MRP Numerals Contrast (Rule 9(1)(b))
                  </label>
                  {data.contrast_assessment?.mrpTextColor && data.contrast_assessment?.mrpBackgroundColor && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Colors: {data.contrast_assessment.mrpTextColor} on {data.contrast_assessment.mrpBackgroundColor}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CONSPICUOUS', label: 'Conspicuous', desc: 'High contrast (Pass)' },
                    { id: 'LOW_CONTRAST', label: 'Low Contrast', desc: 'Faint / poor visibility' },
                    { id: 'POOR_CONTRAST', label: 'Poor Contrast', desc: 'Blends into background' },
                    { id: 'NOT_DETECTED', label: 'Not Detected', desc: 'MRP numerals missing' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleContrastSelect('color_contrast_mrp', opt.id)}
                      className={`p-2 rounded-lg text-left border text-xs transition ${
                        currentMrpContrast === opt.id
                          ? opt.id === 'CONSPICUOUS'
                            ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950 ring-1 ring-emerald-500'
                            : opt.id === 'NOT_DETECTED'
                            ? 'border-slate-600 bg-slate-100 font-semibold text-slate-900 ring-1 ring-slate-400'
                            : 'border-rose-600 bg-rose-50/60 font-semibold text-rose-950 ring-1 ring-rose-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="font-medium text-[11px]">{opt.label}</div>
                      <div className="text-[9px] text-slate-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Net Quantity Contrast */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Net Quantity Numerals Contrast (Rule 9(1)(b))
                  </label>
                  {data.contrast_assessment?.netQuantityTextColor && data.contrast_assessment?.netQuantityBackgroundColor && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Colors: {data.contrast_assessment.netQuantityTextColor} on {data.contrast_assessment.netQuantityBackgroundColor}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CONSPICUOUS', label: 'Conspicuous', desc: 'High contrast (Pass)' },
                    { id: 'LOW_CONTRAST', label: 'Low Contrast', desc: 'Faint / poor visibility' },
                    { id: 'POOR_CONTRAST', label: 'Poor Contrast', desc: 'Blends into background' },
                    { id: 'NOT_DETECTED', label: 'Not Detected', desc: 'Net qty missing' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleContrastSelect('color_contrast_net_quantity', opt.id)}
                      className={`p-2 rounded-lg text-left border text-xs transition ${
                        currentNetQtyContrast === opt.id
                          ? opt.id === 'CONSPICUOUS'
                            ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950 ring-1 ring-emerald-500'
                            : opt.id === 'NOT_DETECTED'
                            ? 'border-slate-600 bg-slate-100 font-semibold text-slate-900 ring-1 ring-slate-400'
                            : 'border-rose-600 bg-rose-50/60 font-semibold text-rose-950 ring-1 ring-rose-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="font-medium text-[11px]">{opt.label}</div>
                      <div className="text-[9px] text-slate-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* General Package Legibility */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    General Legibility & Prominence (Rule 9(1)(a))
                  </label>
                  <span className="text-[10px] text-slate-400">All mandatory declarations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'LEGIBLE', label: 'Legible', desc: 'Sharp, distinct text' },
                    { id: 'MODERATE_CONTRAST', label: 'Moderate', desc: 'Readable with care' },
                    { id: 'LOW_CONTRAST', label: 'Low Contrast', desc: 'Light grey / faint' },
                    { id: 'ILLEGIBLE', label: 'Illegible', desc: 'Unreadable declarations' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleContrastSelect('general_legibility', opt.id)}
                      className={`p-2 rounded-lg text-left border text-xs transition ${
                        currentLegibility === opt.id
                          ? opt.id === 'LEGIBLE'
                            ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950 ring-1 ring-emerald-500'
                            : opt.id === 'MODERATE_CONTRAST'
                            ? 'border-amber-600 bg-amber-50/60 font-semibold text-amber-950 ring-1 ring-amber-500'
                            : 'border-rose-600 bg-rose-50/60 font-semibold text-rose-950 ring-1 ring-rose-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="font-medium text-[11px]">{opt.label}</div>
                      <div className="text-[9px] text-slate-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {data.contrast_assessment?.notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-700">Vision Analysis Notes:</strong> {data.contrast_assessment.notes}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 6: Inspector Remarks */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                6. Inspector Remarks & Physical Observations
              </label>
              <span className="text-[10px] text-slate-400">Included in final certificate / notice</span>
            </div>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add official inspection notes, condition of package, physical seal status, or remarks on visible declarations..."
              className="w-full text-xs rounded-lg px-3 py-2 border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Right Sidebar: Interactive Packaging Evidence & Bounding Boxes (5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Packaging Evidence Images
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {images.length} Image{images.length > 1 ? 's' : ''}
              </span>
            </div>

            {images.length > 0 && (
              <BoundingBoxImageViewer
                images={images}
                activeImageIndex={activeImageIndex}
                onSelectImageIndex={setActiveImageIndex}
                extractedData={data}
                activeFieldKey={activeFieldKey}
                onSelectField={(key) => {
                  setActiveFieldKey(key);
                  const el = document.getElementById(`field-${key}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                  }
                }}
              />
            )}

            {/* Run Compliance Check Button */}
            <div className="pt-5 border-t border-slate-100 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Evaluating Rules...' : 'Run Compliance Check'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
