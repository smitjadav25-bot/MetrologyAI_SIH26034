'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react';

interface AnalysisLoaderProps {
  imageCount: number;
}

export function AnalysisLoader({ imageCount }: AnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Step transitions simulating real visual understanding progression
    const timer1 = setTimeout(() => setCurrentStep(2), 1400);
    const timer2 = setTimeout(() => setCurrentStep(3), 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    { id: 1, label: `Product image${imageCount > 1 ? 's' : ''} received & verified` },
    { id: 2, label: 'Product packaging layout analyzed' },
    { id: 3, label: 'Reading visible declarations' },
    { id: 4, label: 'Preparing information for review' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md mx-auto text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 animate-pulse">
        <Sparkles className="w-8 h-8" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Analyzing Product Packaging...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Visually understanding label declarations across {imageCount} image{imageCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3.5 text-left pt-2 border-t border-slate-100">
        {steps.map((s) => {
          const isDone = s.id < currentStep;
          const isCurrent = s.id === currentStep;

          return (
            <div key={s.id} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 shrink-0" />
              )}
              <span
                className={`text-xs font-medium ${
                  isDone
                    ? 'text-slate-700'
                    : isCurrent
                      ? 'text-emerald-900 font-semibold'
                      : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400">
        Please wait while packaging elements are mapped for inspector verification.
      </p>
    </div>
  );
}
