'use client';

import { useState } from 'react';
import { ExtractedData, ExtractedField, UploadedImageEvidence } from '@/types/inspection';
import { CheckCircle2, AlertTriangle, HelpCircle, Edit3, ShieldAlert, FileCheck2, ArrowRight } from 'lucide-react';

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

  const handleFieldChange = (key: keyof ExtractedData, newValue: string) => {
    setData((prev) => {
      const current = prev[key];
      const isModified = newValue.trim() !== (initialData[key]?.value || '').trim();
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
    const field = data[key];
    const val = field?.value || '';

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800">
            {label}
          </label>
          <div className="flex items-center gap-1.5">
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
            rows={2}
            value={val}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={`w-full text-xs rounded-lg px-3 py-2 border transition ${
              field?.modifiedByInspector
                ? 'border-blue-300 bg-blue-50/20 text-slate-900 focus:ring-2 focus:ring-blue-500'
                : 'border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900'
            }`}
          />
        ) : (
          <input
            type="text"
            value={val}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={`w-full text-xs rounded-lg px-3 py-2 border transition ${
              field?.modifiedByInspector
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

          {/* Card 5: Inspector Remarks */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Inspector Remarks & Physical Observations
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

        {/* Right Sidebar: Real Product Images Reference (5 Cols on desktop) */}
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
              <div className="space-y-3">
                {/* Active Image Preview */}
                <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[activeImageIndex]?.url}
                    alt={images[activeImageIndex]?.originalName || 'Product label'}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/70 text-white rounded-md text-[10px] font-mono backdrop-blur-xs">
                    Image {activeImageIndex + 1} of {images.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                          activeImageIndex === idx
                            ? 'border-emerald-600 shadow-sm'
                            : 'border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1 border border-slate-100">
                  <p className="font-semibold text-slate-800">Inspector Verification Tip:</p>
                  <p>
                    Cross-examine all extracted text fields with the actual packaging images. Correct or fill in any missing declarations before proceeding to statutory rule evaluation.
                  </p>
                </div>
              </div>
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
