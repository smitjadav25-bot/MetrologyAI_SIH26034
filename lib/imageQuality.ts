export interface ImageValidationResult {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
  width?: number;
  height?: number;
  averageBrightness?: number;
}

/**
 * Basic image sanity check using browser Canvas API (STRICTLY NO OCR).
 * Evaluates dimensions, extreme darkness, and extreme washout brightness.
 */
export async function validateImageQuality(file: File): Promise<ImageValidationResult> {
  // Check file size bounds
  if (file.size < 4096) {
    return {
      isValid: false,
      errorMessage: 'Image quality is too low to reliably inspect the label. The file size is too small.'
    };
  }

  if (file.size > 4 * 1024 * 1024) {
    return {
      isValid: false,
      errorMessage: 'File size exceeds maximum allowed limit (4MB for production processing).'
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Check minimum resolution
      if (width < 320 || height < 320) {
        resolve({
          isValid: false,
          errorMessage: 'Image resolution is too low (< 320px) to reliably inspect the packaging declarations.',
          width,
          height
        });
        return;
      }

      // Check brightness & darkness using downscaled canvas
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ isValid: true, width, height });
          return;
        }

        const sampleSize = 64;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;
        let totalBrightness = 0;
        const totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          // Standard relative luminance formula
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / totalPixels; // 0 to 255

        if (avgBrightness < 20) {
          resolve({
            isValid: false,
            errorMessage: 'Image quality is too low: image is extremely dark and declarations are not visible.',
            width,
            height,
            averageBrightness: avgBrightness
          });
          return;
        }

        if (avgBrightness > 248) {
          resolve({
            isValid: false,
            errorMessage: 'Image quality is too low: image is heavily overexposed or washed out.',
            width,
            height,
            averageBrightness: avgBrightness
          });
          return;
        }

        resolve({
          isValid: true,
          width,
          height,
          averageBrightness: avgBrightness
        });
      } catch {
        // If canvas analysis is blocked (e.g. strict security), fallback to dimension-only validity
        resolve({ isValid: true, width, height });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        errorMessage: 'Unable to process or read the image file format.'
      });
    };

    img.src = objectUrl;
  });
}
