import { GoogleGenAI } from '@google/genai';
import { ExtractedData, ExtractedField, ConfidenceLevel, ImageQualityAssessment } from '@/types/inspection';

export interface VlmAnalysisResponse {
  extractedData: ExtractedData;
  imageQuality: ImageQualityAssessment;
  sameProductWarning?: string | null;
}

export interface InputImagePart {
  data: string; // base64 without prefix
  mimeType: string;
  sourceLabel: string; // e.g. 'image-1', 'image-2'
}

const SYSTEM_INSTRUCTION = `You are a visual inspection assistant for packaged commodity labels.
Analyze the provided product packaging image visually.
Read and understand information that is actually visible on the packaging.
Use visual context to understand where declarations appear and what they refer to.
Extract only information that is supported by the image.
Never guess.
Never hallucinate.
Never invent missing information.
Never create a manufacturer name.
Never create an address.
Never create an MRP.
Never create a quantity.
Never create a date.
Never create a batch number.

If a field is not visible, return null for value, "low" for confidence, and null for sourceImage.
If text is unclear, partially visible, blurred, cut off, or unreliable, mark the field as low confidence.
If multiple images are provided, treat them as different views of the same product only when the user has indicated they belong to the same inspection. Combine information across images.
For every extracted field, identify the source image label (e.g. "image-1", "image-2").

The final legal compliance decision will NOT be made by you. Your responsibility is visual information extraction and evidence identification only.

Return ONLY a valid JSON object matching the specified schema.`;

const EXTRACTION_SCHEMA_PROMPT = `Analyze the uploaded product packaging image(s) and extract the visible declarations.
Images are labeled image-1, image-2, etc.

Extract the following fields accurately as a valid JSON object:
{
  "product_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "product_category": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "manufacturer_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "manufacturer_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "packer_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "packer_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "importer_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "importer_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "country_of_origin": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "net_quantity": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "unit_of_measurement": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "mrp": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "mrp_tax_declaration": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "date_of_manufacture": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "date_of_packing": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "best_before_use_by": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "consumer_care_phone": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "consumer_care_email": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "consumer_care_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "batch_or_lot_no": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "barcode": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "other_declarations": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null },
  "image_quality": {
    "isAcceptable": boolean,
    "issues": string[],
    "warnings": string[]
  },
  "same_product_verification": {
    "likelySameProduct": boolean,
    "warning": string | null
  }
}`;

export async function analyzeProductPackagingWithVlm(
  images: InputImagePart[]
): Promise<VlmAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('CONFIG_ERROR: AI analysis is currently unavailable. Please contact the system administrator.');
  }

  if (!images || images.length === 0) {
    throw new Error('INVALID_IMAGE: Please upload a valid product image.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare multimodal contents array
  const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  images.forEach((img, idx) => {
    contents.push({
      text: `[Image ${idx + 1}: ${img.sourceLabel}]`
    });
    contents.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    });
  });

  contents.push({
    text: EXTRACTION_SCHEMA_PROMPT
  });

  // Call the official current Gemini Multimodal Vision model
  // We prioritize 'gemini-2.5-flash' or 'gemini-3.5-flash' based on current API availability
  const modelNames = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.6-flash'];
  let lastError: Error | null = null;
  let textResponse = '';

  for (const modelName of modelNames) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1 // minimal variance for strict inspection
        }
      });

      if (response && response.text) {
        textResponse = response.text;
        break;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt with ${modelName} failed:`, lastError.message);
      // Try next supported model in list
    }
  }

  if (!textResponse) {
    throw lastError || new Error('API_ERROR: Unable to analyze the product image.');
  }

  // Parse JSON response cleanly
  try {
    const raw = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

    // Sanitize and format ExtractedData
    const defaultField: ExtractedField = { value: null, confidence: 'low', sourceImage: null, modifiedByInspector: false };

    const sanitizeField = (field: unknown): ExtractedField => {
      if (!field || typeof field !== 'object') return { ...defaultField };
      const f = field as Record<string, unknown>;
      const val = f.value === null || f.value === undefined ? null : String(f.value).trim();
      const rawConf = String(f.confidence || '').toLowerCase();
      const conf: ConfidenceLevel = (rawConf === 'high' || rawConf === 'medium' || rawConf === 'low')
        ? (rawConf as ConfidenceLevel)
        : 'low';
      const src = f.sourceImage ? String(f.sourceImage) : null;
      return {
        value: val,
        confidence: conf,
        sourceImage: src,
        modifiedByInspector: false
      };
    };

    const extractedData: ExtractedData = {
      product_name: sanitizeField(parsed.product_name),
      product_category: sanitizeField(parsed.product_category),
      manufacturer_name: sanitizeField(parsed.manufacturer_name),
      manufacturer_address: sanitizeField(parsed.manufacturer_address),
      packer_name: sanitizeField(parsed.packer_name),
      packer_address: sanitizeField(parsed.packer_address),
      importer_name: sanitizeField(parsed.importer_name),
      importer_address: sanitizeField(parsed.importer_address),
      country_of_origin: sanitizeField(parsed.country_of_origin),
      net_quantity: sanitizeField(parsed.net_quantity),
      unit_of_measurement: sanitizeField(parsed.unit_of_measurement),
      mrp: sanitizeField(parsed.mrp),
      mrp_tax_declaration: sanitizeField(parsed.mrp_tax_declaration),
      date_of_manufacture: sanitizeField(parsed.date_of_manufacture),
      date_of_packing: sanitizeField(parsed.date_of_packing),
      best_before_use_by: sanitizeField(parsed.best_before_use_by),
      consumer_care_phone: sanitizeField(parsed.consumer_care_phone),
      consumer_care_email: sanitizeField(parsed.consumer_care_email),
      consumer_care_address: sanitizeField(parsed.consumer_care_address),
      batch_or_lot_no: sanitizeField(parsed.batch_or_lot_no),
      barcode: sanitizeField(parsed.barcode),
      other_declarations: sanitizeField(parsed.other_declarations)
    };

    const imageQuality: ImageQualityAssessment = {
      isAcceptable: parsed.image_quality?.isAcceptable ?? true,
      issues: Array.isArray(parsed.image_quality?.issues) ? parsed.image_quality.issues : [],
      warnings: Array.isArray(parsed.image_quality?.warnings) ? parsed.image_quality.warnings : []
    };

    const sameProductWarning = parsed.same_product_verification?.likelySameProduct === false
      ? (parsed.same_product_verification?.warning || 'The uploaded images may not belong to the same product.')
      : null;

    return {
      extractedData,
      imageQuality,
      sameProductWarning
    };
  } catch (parseErr) {
    console.error('Failed to parse Gemini VLM response:', parseErr, textResponse);
    throw new Error('API_ERROR: Unable to reliably interpret declarations from the packaging. Please upload a clearer image.');
  }
}
