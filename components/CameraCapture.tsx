'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const stopCamera = useCallback(() => {
    const currentStream = streamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    setCapturedDataUrl(null);
    try {
      // Prioritize rear camera on mobile devices
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Direct camera stream failed:', err);
      setCameraError(
        'Unable to access camera directly. Please check browser permissions or use the mobile photo capture option.'
      );
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const startupTimer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(startupTimer);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (!capturedDataUrl) return;

    // Convert dataUrl to File object
    const arr = capturedDataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const filename = `camera_capture_${Date.now()}.jpg`;
    const file = new File([u8arr], filename, { type: mime });

    onCapture(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {capturedDataUrl ? 'Photo Preview' : 'Capture Packaging Photo'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs leading-relaxed">{cameraError}</p>
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition">
                  <Camera className="w-4 h-4" />
                  <span>Use Device Camera Dialog</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onCapture(file);
                        onClose();
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : capturedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedDataUrl}
              alt="Captured package"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Packaging Frame Overlay Guide */}
              <div className="absolute inset-8 border-2 border-white/40 border-dashed rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-medium bg-black/60 text-white/90 px-3 py-1 rounded-full backdrop-blur-xs">
                  Center packaging labels inside box
                </span>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          {capturedDataUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition"
              >
                <Check className="w-4 h-4" /> Use Photo
              </button>
            </>
          ) : !cameraError ? (
            <button
              type="button"
              disabled={isInitializing}
              onClick={handleTakePhoto}
              className="w-16 h-16 rounded-full border-4 border-emerald-500 bg-white hover:bg-slate-100 flex items-center justify-center shadow-lg transition transform active:scale-95 disabled:opacity-50"
              aria-label="Capture photo"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
