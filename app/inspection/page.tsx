'use client';

import { useState, useRef } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { validateImageQuality } from '@/lib/imageQuality';
import { AnalysisLoader } from '@/components/AnalysisLoader';
import { ReviewForm } from '@/components/ReviewForm';
import { ComplianceResult } from '@/components/ComplianceResult';
import { ExtractedData, UploadedImageEvidence, Inspection } from '@/types/inspection';
import {
  Upload,
  Camera,
  Plus,
  Trash2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  label: string;
}

type Step = 'UPLOAD' | 'ANALYZING' | 'REVIEW' | 'RESULT';

export default function InspectionPage() {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [qualityError, setQualityError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [serverImages, setServerImages] = useState<UploadedImageEvidence[]>([]);
  const [sameProductWarning, setSameProductWarning] = useState<string | null>(null);

  const [completedInspection, setCompletedInspection] = useState<Inspection | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setQualityError(null);
    setAnalysisError(null);

    const newItems: SelectedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Perform basic image quality validation (STRICTLY NO OCR)
      const validation = await validateImageQuality(file);
      if (!validation.isValid) {
        setQualityError(
          validation.errorMessage || 'Image quality is too low to reliably inspect the label.'
        );
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const index = selectedImages.length + newItems.length + 1;
      newItems.push({
        id: `local_${Date.now()}_${i}`,
        file,
        previewUrl,
        label: `Image ${index}`
      });
    }

    setSelectedImages((prev) => [...prev, ...newItems]);
  };

  const handleCameraCapture = async (file: File) => {
    setQualityError(null);
    setAnalysisError(null);

    const validation = await validateImageQuality(file);
    if (!validation.isValid) {
      setQualityError(
        validation.errorMessage || 'Image quality is too low to reliably inspect the label.'
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const index = selectedImages.length + 1;

    setSelectedImages((prev) => [
      ...prev,
      {
        id: `camera_${Date.now()}`,
        file,
        previewUrl,
        label: `Image ${index}`
      }
    ]);
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      return updated.map((img, idx) => ({ ...img, label: `Image ${idx + 1}` }));
    });
  };

  const handleStartAnalysis = async () => {
    if (selectedImages.length === 0) return;

    setStep('ANALYZING');
    setAnalysisError(null);

    try {
      const formData = new FormData();
      selectedImages.forEach((img, idx) => {
        formData.append(`image_${idx}`, img.file);
      });

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Unable to analyze the product image.');
      }

      setExtractedData(result.extractedData);
      setServerImages(result.savedImages || []);
      setSameProductWarning(result.sameProductWarning || null);
      setStep('REVIEW');
    } catch (err: unknown) {
      console.error('VLM analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to analyze the product image.';
      setAnalysisError(msg);
      setStep('UPLOAD');
    }
  };

  const handleReviewSubmit = async (reviewedData: ExtractedData, inspectorRemarks: string) => {
    if (!extractedData) return;
    setIsEvaluating(true);

    try {
      const payload = {
        reviewedData,
        extractedData,
        images: serverImages,
        inspectorRemarks,
        inspector: {
          id: 'INS-OFFICER-402',
          name: 'Inspector S. K. Verma',
          designation: 'Legal Metrology Inspector',
          jurisdiction: 'Zone-1 Enforcement Division'
        }
      };

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save inspection assessment.');
      }

      setCompletedInspection(data.inspection);
      setStep('RESULT');
    } catch (err: unknown) {
      console.error('Failed to submit review:', err);
      alert(err instanceof Error ? err.message : 'Error evaluating compliance.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    // Revoke object URLs
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
    setQualityError(null);
    setAnalysisError(null);
    setExtractedData(null);
    setServerImages([]);
    setCompletedInspection(null);
    setStep('UPLOAD');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Top Row */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>

          {/* Workflow Stage Progress */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`px-2.5 py-1 rounded-full ${
                step === 'UPLOAD'
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              1. Upload Packaging
            </span>
            <span className="text-slate-300">/</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                step === 'ANALYZING'
                  ? 'bg-slate-900 text-white animate-pulse'
                  : step === 'REVIEW'
                    ? 'bg-slate-900 text-white'
                    : step === 'RESULT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-slate-400'
              }`}
            >
              2. Review Declarations
            </span>
            <span className="text-slate-300">/</span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                step === 'RESULT'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-400'
              }`}
            >
              3. Compliance Outcome
            </span>
          </div>
        </div>

        {/* STEP 1: UPLOAD / CAPTURE PACKAGING */}
        {step === 'UPLOAD' && (
          <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="max-w-2xl">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Upload or Capture Product Packaging
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Provide clear photos of the packaged commodity (front, back, side panels) to inspect mandatory declarations under Legal Metrology Rules, 2011.
                </p>
              </div>

              {/* Quality Error Banner */}
              {qualityError && (
                <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-900">Image Quality Check</div>
                      <div className="text-xs text-amber-800 mt-0.5">{qualityError}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg transition"
                    >
                      Upload Better Image
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis Error Banner */}
              {analysisError && (
                <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-red-900">Analysis Error</div>
                      <div className="text-xs text-red-800 mt-0.5">{analysisError}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleStartAnalysis}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 border border-red-300 bg-white hover:bg-red-50 text-red-900 text-xs font-semibold rounded-lg transition"
                    >
                      Upload Another Image
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons: Upload & Camera */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Take Photo</span>
                </button>

                <span className="text-xs text-slate-400">
                  Multiple images of the same product supported (Front, Back, Side)
                </span>
              </div>
            </div>

            {/* Selected Images Gallery */}
            {selectedImages.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Selected Packaging Images ({selectedImages.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedImages.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-mono backdrop-blur-xs">
                        {item.label}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-700"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Another Image Box */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs font-semibold">Add Another</span>
                  </button>
                </div>

                {/* Primary Proceed Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    One or more photos ready for visual understanding.
                  </span>
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Product</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ANALYZING PACKAGING */}
        {step === 'ANALYZING' && (
          <div className="py-12">
            <AnalysisLoader imageCount={selectedImages.length} />
          </div>
        )}

        {/* STEP 3: INSPECTOR REVIEW FORM */}
        {step === 'REVIEW' && extractedData && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Review Packaging Declarations
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Carefully verify the extracted label information against the packaging images. You can correct, edit, or fill in any missing details before running the Legal Metrology rule engine.
              </p>
            </div>

            <ReviewForm
              initialData={extractedData}
              images={serverImages}
              sameProductWarning={sameProductWarning}
              onSubmit={handleReviewSubmit}
              isSubmitting={isEvaluating}
            />
          </div>
        )}

        {/* STEP 4: COMPLIANCE ASSESSMENT RESULT */}
        {step === 'RESULT' && completedInspection && (
          <ComplianceResult
            inspection={completedInspection}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
