'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  UploadedImageEvidence,
  ExtractedData,
  ExtractedField,
  BoundingBox
} from '@/types/inspection';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Crosshair,
  Sparkles,
  Maximize2
} from 'lucide-react';

export const FIELD_DISPLAY_LABELS: Record<string, string> = {
  product_name: 'Product Name',
  product_category: 'Category',
  manufacturer_name: 'Manufacturer',
  manufacturer_address: 'Manufacturer Address',
  packer_name: 'Packer Name',
  packer_address: 'Packer Address',
  importer_name: 'Importer Name',
  importer_address: 'Importer Address',
  country_of_origin: 'Country of Origin',
  net_quantity: 'Net Quantity',
  unit_of_measurement: 'Unit of Measure',
  mrp: 'Retail Sale Price (MRP)',
  mrp_tax_declaration: 'Tax Declaration',
  date_of_manufacture: 'Mfg Date',
  date_of_packing: 'Packing Date',
  best_before_use_by: 'Best Before / Expiry',
  consumer_care_phone: 'Helpline',
  consumer_care_email: 'Support Email',
  consumer_care_address: 'Complaint Address',
  batch_or_lot_no: 'Batch / Lot No',
  barcode: 'Barcode / EAN',
  other_declarations: 'Other Declarations',
  color_contrast_mrp: 'MRP Contrast',
  color_contrast_net_quantity: 'Net Qty Contrast'
};

interface BoundingBoxItem {
  fieldKey: keyof ExtractedData;
  label: string;
  value: string | null;
  sourceImage: string | null;
  box: BoundingBox;
  isActive: boolean;
}

interface BoundingBoxImageViewerProps {
  images: UploadedImageEvidence[];
  activeImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  extractedData: ExtractedData;
  activeFieldKey: keyof ExtractedData | null;
  onSelectField: (fieldKey: keyof ExtractedData) => void;
}

export function BoundingBoxImageViewer({
  images,
  activeImageIndex,
  onSelectImageIndex,
  extractedData,
  activeFieldKey,
  onSelectField
}: BoundingBoxImageViewerProps) {
  const [scale, setScale] = useState<number>(1);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentImage = images[activeImageIndex];

  // Helper to test if a field belongs to the currently active image
  const isFieldOnCurrentImage = (sourceImage: string | null, imgIndex: number): boolean => {
    if (images.length <= 1) return true;
    if (!sourceImage) return imgIndex === 0;
    const src = sourceImage.toLowerCase().trim();
    const expectedLabel = `image-${imgIndex + 1}`;
    if (src === expectedLabel) return true;
    if (images[imgIndex]?.id && src === images[imgIndex].id.toLowerCase()) return true;
    if (src.includes(String(imgIndex + 1))) return true;
    return false;
  };

  // Collect all bounding boxes belonging to the active image
  const visibleBoxes = useMemo<BoundingBoxItem[]>(() => {
    const list: BoundingBoxItem[] = [];
    if (!extractedData) return list;

    (Object.keys(extractedData) as Array<keyof ExtractedData>).forEach((k) => {
      // Contrast fields can inherit from mrp / net_quantity if no direct box
      let fieldObj = extractedData[k] as ExtractedField | undefined;
      if (k === 'color_contrast_mrp' && (!fieldObj?.boundingBox || !fieldObj.sourceImage)) {
        fieldObj = extractedData.mrp as ExtractedField | undefined;
      } else if (k === 'color_contrast_net_quantity' && (!fieldObj?.boundingBox || !fieldObj.sourceImage)) {
        fieldObj = extractedData.net_quantity as ExtractedField | undefined;
      }

      if (!fieldObj || !fieldObj.boundingBox) return;
      const box = fieldObj.boundingBox;

      // Verify coordinate validity
      if (
        !Array.isArray(box) ||
        box.length !== 4 ||
        typeof box[0] !== 'number' ||
        typeof box[1] !== 'number' ||
        typeof box[2] !== 'number' ||
        typeof box[3] !== 'number'
      ) {
        return;
      }

      const [ymin, xmin, ymax, xmax] = box;
      if (ymax <= ymin || xmax <= xmin) return;

      const src = fieldObj.sourceImage || null;
      if (isFieldOnCurrentImage(src, activeImageIndex)) {
        list.push({
          fieldKey: k,
          label: FIELD_DISPLAY_LABELS[k] || String(k),
          value: fieldObj.value || null,
          sourceImage: src,
          box,
          isActive: activeFieldKey === k
        });
      }
    });

    return list;
  }, [extractedData, activeImageIndex, activeFieldKey, images]);

  // When activeFieldKey changes, zoom smoothly to its bounding box
  useEffect(() => {
    if (!activeFieldKey || !extractedData) {
      setScale(1);
      setOrigin({ x: 50, y: 50 });
      return;
    }

    let targetField = extractedData[activeFieldKey] as ExtractedField | undefined;
    if (activeFieldKey === 'color_contrast_mrp' && (!targetField?.boundingBox || !targetField.sourceImage)) {
      targetField = extractedData.mrp as ExtractedField | undefined;
    } else if (activeFieldKey === 'color_contrast_net_quantity' && (!targetField?.boundingBox || !targetField.sourceImage)) {
      targetField = extractedData.net_quantity as ExtractedField | undefined;
    }

    if (!targetField || !targetField.boundingBox) {
      // No bounding box for this field; gently reset zoom
      setScale(1);
      setOrigin({ x: 50, y: 50 });
      return;
    }

    const [ymin, xmin, ymax, xmax] = targetField.boundingBox;
    const centerX = ((xmin + xmax) / 2) / 10; // Convert 0-1000 to 0-100%
    const centerY = ((ymin + ymax) / 2) / 10;

    // Calculate box dimension relative to full image
    const boxWidth = (xmax - xmin) / 10;
    const boxHeight = (ymax - ymin) / 10;

    // Determine optimal zoom magnification based on box size
    let targetScale = 2.8;
    if (boxWidth < 12 && boxHeight < 8) {
      targetScale = 3.6; // Small stamp or numeral (e.g. MRP or dates)
    } else if (boxWidth > 45 || boxHeight > 35) {
      targetScale = 1.8; // Large block (e.g. manufacturer address)
    }

    // Check if target field is on another image and switch if needed
    if (images.length > 1 && targetField.sourceImage) {
      for (let i = 0; i < images.length; i++) {
        if (isFieldOnCurrentImage(targetField.sourceImage, i)) {
          if (i !== activeImageIndex) {
            onSelectImageIndex(i);
          }
          break;
        }
      }
    }

    setOrigin({ x: centerX, y: centerY });
    setScale(targetScale);
    setShowBoxes(true);
  }, [activeFieldKey, extractedData, images, activeImageIndex, onSelectImageIndex]);

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(5, Number((s + 0.5).toFixed(1))));
  const handleZoomOut = () => setScale((s) => Math.max(1, Number((s - 0.5).toFixed(1))));
  const handleResetZoom = () => {
    setScale(1);
    setOrigin({ x: 50, y: 50 });
  };

  const activeBox = visibleBoxes.find((b) => b.isActive);

  return (
    <div className="space-y-3">
      {/* Viewer Card Header / Controls Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
          <span>Visual Label Ground Truth</span>
          {activeBox && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              {activeBox.label} ({scale}x Zoom)
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowBoxes((v) => !v)}
            title={showBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
            className={`p-1.5 rounded-lg border text-xs transition ${
              showBoxes
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            title="Zoom Out"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition text-xs"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono text-slate-500 w-8 text-center">
            {scale.toFixed(1)}x
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            title="Zoom In"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition text-xs"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom to Full View"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center select-none"
      >
        {currentImage ? (
          <div
            className="relative transition-transform duration-500 ease-out flex items-center justify-center"
            style={{
              width: '100%',
              height: '100%',
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transform: `scale(${scale})`
            }}
          >
            {/* Natural Aspect Ratio Wrapper: Guarantees 0-1000 coordinates align with 0 letterbox distortion */}
            <div
              className="relative max-w-full max-h-full"
              style={{
                aspectRatio: naturalAspect || undefined
              }}
            >
              {/* Product Label Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.url}
                alt={currentImage.originalName || 'Product packaging'}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  if (el.naturalWidth && el.naturalHeight) {
                    setNaturalAspect(el.naturalWidth / el.naturalHeight);
                  }
                }}
                className="max-w-full max-h-full object-contain block mx-auto pointer-events-none"
              />

              {/* Bounding Box Overlays */}
              {showBoxes && (
                <div className="absolute inset-0 pointer-events-none">
                  {visibleBoxes.map((item) => {
                    const [ymin, xmin, ymax, xmax] = item.box;
                    const top = ymin / 10;
                    const left = xmin / 10;
                    const width = (xmax - xmin) / 10;
                    const height = (ymax - ymin) / 10;

                    if (item.isActive) {
                      return (
                        <div
                          key={item.fieldKey}
                          className="absolute pointer-events-auto cursor-pointer transition-all duration-300"
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                            zIndex: 30
                          }}
                          onClick={() => onSelectField(item.fieldKey)}
                        >
                          {/* Active Highlighted Box */}
                          <div className="w-full h-full border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.8)] ring-2 ring-amber-500/40 rounded-xs animate-pulse">
                            {/* HUD Corner Reticles */}
                            <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-300" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-300" />
                            <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-amber-300" />
                            <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-amber-300" />
                          </div>

                          {/* Floating Badge above Bounding Box */}
                          <div
                            className="absolute -top-6 left-0 px-2 py-0.5 bg-slate-950/95 text-amber-300 rounded text-[9px] font-bold tracking-tight shadow-md border border-amber-400/40 whitespace-nowrap flex items-center gap-1 backdrop-blur-xs"
                            style={{
                              transform: `scale(${Math.max(0.65, 1 / scale)})`,
                              transformOrigin: 'bottom left'
                            }}
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>{item.label}</span>
                            {item.value && (
                              <span className="text-white font-mono opacity-90 max-w-[140px] truncate">
                                : {item.value}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Inactive Bounding Box (Subtle overlay)
                    return (
                      <div
                        key={item.fieldKey}
                        className="absolute pointer-events-auto cursor-pointer group"
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                          zIndex: 10
                        }}
                        onClick={() => onSelectField(item.fieldKey)}
                        title={`Click to inspect ${item.label}`}
                      >
                        <div className="w-full h-full border border-sky-400/50 bg-sky-400/10 hover:border-amber-400 hover:bg-amber-400/30 transition rounded-xs">
                          {/* Mini label on hover */}
                          <div
                            className="hidden group-hover:flex absolute -top-5 left-0 px-1.5 py-0.5 bg-slate-900/90 text-white rounded text-[8px] font-medium whitespace-nowrap items-center gap-1 shadow-xs border border-white/10"
                            style={{
                              transform: `scale(${Math.max(0.65, 1 / scale)})`,
                              transformOrigin: 'bottom left'
                            }}
                          >
                            <span>{item.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs">No packaging evidence available</div>
        )}

        {/* Top-Left Image Index Tag */}
        <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/75 text-white rounded-md text-[10px] font-mono backdrop-blur-xs flex items-center gap-1.5 z-40">
          <span>Image {activeImageIndex + 1} of {images.length}</span>
          {visibleBoxes.length > 0 && (
            <span className="text-amber-300 font-semibold">• {visibleBoxes.length} labels detected</span>
          )}
        </div>
      </div>

      {/* Thumbnail Strip for Multi-Image Evidence */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => onSelectImageIndex(idx)}
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

      {/* Helpful Inspector Guide */}
      <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1 border border-slate-100">
        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
          <span>Interactive Label Ground Truth:</span>
        </p>
        <p>
          Clicking or editing any declaration in the form zooms into its detected label and highlights it. You can also click any bounding box directly on the packaging image to inspect that field.
        </p>
      </div>
    </div>
  );
}
