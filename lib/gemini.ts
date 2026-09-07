import { GoogleGenAI } from '@google/genai';
import {
  ExtractedData,
  ExtractedField,
  ConfidenceLevel,
  BoundingBox,
  ImageQualityAssessment,
  ContrastLevel,
  GeneralLegibilityLevel,
  PackagingExemptionType
} from '@/types/inspection';

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

export interface GeminiErrorDetails {
  status?: number;
  statusText?: string;
  code?: string | number;
  message: string;
  details?: unknown;
}

function getGeminiErrorDetails(error: unknown): GeminiErrorDetails {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }

  const candidate = error as Record<string, unknown>;
  const nestedError = candidate.error && typeof candidate.error === 'object'
    ? candidate.error as Record<string, unknown>
    : undefined;

  return {
    status: typeof candidate.status === 'number' ? candidate.status : undefined,
    statusText: typeof candidate.statusText === 'string' ? candidate.statusText : undefined,
    code: typeof candidate.code === 'string' || typeof candidate.code === 'number'
      ? candidate.code
      : nestedError?.code as string | number | undefined,
    message: typeof candidate.message === 'string'
      ? candidate.message
      : typeof nestedError?.message === 'string' ? nestedError.message : String(error),
    details: candidate.details ?? nestedError?.details
  };
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

If a field is not visible, return an empty string for value and sourceImage, "low" for confidence, and [0, 0, 0, 0] for box_2d.
If text is unclear, partially visible, blurred, cut off, or unreliable, mark the field as low confidence.
If multiple images are provided, treat them as different views of the same product only when the user has indicated they belong to the same inspection. Combine information across images.
For every extracted field, identify the source image label (e.g. "image-1", "image-2").

BOUNDING BOX LOCALIZATION:
For every extracted field visible on an image, you MUST accurately detect and return its 2D bounding box as "box_2d": [ymin, xmin, ymax, xmax] normalized to a 0-1000 integer grid relative to that source image.
- ymin: top coordinate (0-1000)
- xmin: left coordinate (0-1000)
- ymax: bottom coordinate (0-1000)
- xmax: right coordinate (0-1000)
The bounding box must tightly enclose the text of that declaration on the package so inspectors can immediately inspect and verify that label area when zoomed in.

Assess the visual color contrast and legibility under Rule 9 of the Legal Metrology (Packaged Commodities) Rules, 2011:
- Rule 9(1)(b) Core Requirement: The numerals for Retail Sale Price (MRP) and Net Quantity must contrast conspicuously with the label background.
- Rule 9(1)(a) Requirement: Every mandatory declaration must be completely legible and prominent. Low contrast (e.g. light gray on white, pale yellow on light backgrounds) creates high statutory exposure.
- Statutory Exemptions: Check if information is directly blown, formed, molded, embossed, or perforated on glass or plastic surfaces (distinct contrasting color not required under proviso), or if written in hand-script.

The final legal compliance decision will NOT be made by you. Your responsibility is visual information extraction and evidence identification only.

Return ONLY a valid JSON object matching the specified schema.`;

const EXTRACTION_SCHEMA_PROMPT = `Analyze the uploaded product packaging image(s) and extract the visible declarations.
Images are labeled image-1, image-2, etc.

Extract the following fields accurately as a valid JSON object.
Include "box_2d": [ymin, xmin, ymax, xmax] (normalized 0-1000 integer coordinates) for each visible field:
{
  "product_name": { "value": string, "confidence": "high" | "medium" | "low", "sourceImage": string, "box_2d": [number, number, number, number] },
  "product_category": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "manufacturer_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "manufacturer_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "packer_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "packer_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "importer_name": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "importer_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "country_of_origin": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "net_quantity": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "unit_of_measurement": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "mrp": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "mrp_tax_declaration": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "date_of_manufacture": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "date_of_packing": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "best_before_use_by": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "consumer_care_phone": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "consumer_care_email": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "consumer_care_address": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "batch_or_lot_no": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "barcode": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "other_declarations": { "value": string | null, "confidence": "high" | "medium" | "low", "sourceImage": string | null, "box_2d": [number, number, number, number] | null },
  "color_contrast_assessment": {
    "mrp_contrast": "CONSPICUOUS" | "LOW_CONTRAST" | "POOR_CONTRAST",
    "mrp_colors": string | null,
    "net_quantity_contrast": "CONSPICUOUS" | "LOW_CONTRAST" | "POOR_CONTRAST",
    "net_quantity_colors": string | null,
    "general_legibility": "LEGIBLE" | "MODERATE_CONTRAST" | "LOW_CONTRAST" | "ILLEGIBLE",
    "detected_exemption": "NONE" | "BLOWN_FORMED_MOLDED" | "HAND_SCRIPTED",
    "exemption_notes": string | null,
    "notes": string | null
  },
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

const FIELD_SCHEMA = {
  type: 'object',
  properties: {
    value: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    sourceImage: { type: 'string' },
    box_2d: {
      type: 'array',
      items: { type: 'integer', minimum: 0, maximum: 1000 },
      minItems: 4,
      maxItems: 4
    }
  },
  required: ['value', 'confidence', 'sourceImage', 'box_2d'],
  additionalProperties: false
} as const;

const RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    product_name: FIELD_SCHEMA,
    product_category: FIELD_SCHEMA,
    manufacturer_name: FIELD_SCHEMA,
    manufacturer_address: FIELD_SCHEMA,
    packer_name: FIELD_SCHEMA,
    packer_address: FIELD_SCHEMA,
    importer_name: FIELD_SCHEMA,
    importer_address: FIELD_SCHEMA,
    country_of_origin: FIELD_SCHEMA,
    net_quantity: FIELD_SCHEMA,
    unit_of_measurement: FIELD_SCHEMA,
    mrp: FIELD_SCHEMA,
    mrp_tax_declaration: FIELD_SCHEMA,
    date_of_manufacture: FIELD_SCHEMA,
    date_of_packing: FIELD_SCHEMA,
    best_before_use_by: FIELD_SCHEMA,
    consumer_care_phone: FIELD_SCHEMA,
    consumer_care_email: FIELD_SCHEMA,
    consumer_care_address: FIELD_SCHEMA,
    batch_or_lot_no: FIELD_SCHEMA,
    barcode: FIELD_SCHEMA,
    other_declarations: FIELD_SCHEMA,
    color_contrast_assessment: {
      type: 'object',
      properties: {
        mrp_contrast: { type: 'string', enum: ['CONSPICUOUS', 'LOW_CONTRAST', 'POOR_CONTRAST'] },
        mrp_colors: { type: 'string' },
        net_quantity_contrast: { type: 'string', enum: ['CONSPICUOUS', 'LOW_CONTRAST', 'POOR_CONTRAST'] },
        net_quantity_colors: { type: 'string' },
        general_legibility: { type: 'string', enum: ['LEGIBLE', 'MODERATE_CONTRAST', 'LOW_CONTRAST', 'ILLEGIBLE'] },
        detected_exemption: { type: 'string', enum: ['NONE', 'BLOWN_FORMED_MOLDED', 'HAND_SCRIPTED'] },
        exemption_notes: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['mrp_contrast', 'mrp_colors', 'net_quantity_contrast', 'net_quantity_colors', 'general_legibility', 'detected_exemption', 'exemption_notes', 'notes'],
      additionalProperties: false
    },
    image_quality: {
      type: 'object',
      properties: {
        isAcceptable: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      },
      required: ['isAcceptable', 'issues', 'warnings'],
      additionalProperties: false
    },
    same_product_verification: {
      type: 'object',
      properties: {
        likelySameProduct: { type: 'boolean' },
        warning: { type: 'string' }
      },
      required: ['likelySameProduct', 'warning'],
      additionalProperties: false
    }
  },
  required: [
    'product_name', 'product_category', 'manufacturer_name', 'manufacturer_address',
    'packer_name', 'packer_address', 'importer_name', 'importer_address',
    'country_of_origin', 'net_quantity', 'unit_of_measurement', 'mrp',
    'mrp_tax_declaration', 'date_of_manufacture', 'date_of_packing',
    'best_before_use_by', 'consumer_care_phone', 'consumer_care_email',
    'consumer_care_address', 'batch_or_lot_no', 'barcode', 'other_declarations',
    'color_contrast_assessment', 'image_quality', 'same_product_verification'
  ],
  additionalProperties: false
} as const;

const GEMINI_REQUEST_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`TIMEOUT_ERROR: Gemini request exceeded ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

export async function analyzeProductPackagingWithVlm(
  images: InputImagePart[]
): Promise<VlmAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('CONFIG_ERROR: GEMINI_API_KEY is not configured');
  }

  if (!images || images.length === 0) {
    throw new Error('INVALID_IMAGE: Please upload a valid product image.');
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';
  console.log('[Gemini] API key configured:', true);
  console.log('[Gemini] Request started');
  console.log('[Gemini] Model:', modelName);
  console.log('[Gemini] Images:', images.map((image) => ({
    sourceLabel: image.sourceLabel,
    mimeType: image.mimeType,
    base64Length: image.data.length,
    estimatedBytes: Math.floor(image.data.length * 3 / 4)
  })));

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

  let lastError: unknown = null;
  let textResponse = '';

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseJsonSchema: RESPONSE_JSON_SCHEMA,
          temperature: 0.1
        }
      }),
      GEMINI_REQUEST_TIMEOUT_MS
    );

    console.log('[Gemini] Response received');
    if (response && response.text) {
      textResponse = response.text;
    }
  } catch (err: unknown) {
    lastError = err;
    const details = getGeminiErrorDetails(err);
    console.error('[Gemini ERROR]', details);
  }

  if (!textResponse) {
    throw lastError || new Error('API_ERROR: Gemini returned an empty response');
  }

  try {
    const parsed: unknown = JSON.parse(textResponse);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Gemini returned a non-object response.');
    }
    const analysis = parsed as Record<string, unknown>;
    const contrastAssessment = analysis.color_contrast_assessment as Record<string, unknown> | undefined;

    // Sanitize and format ExtractedData
    const defaultField: ExtractedField = { value: null, confidence: 'low', sourceImage: null, boundingBox: null, modifiedByInspector: false };

    const sanitizeField = (field: unknown): ExtractedField => {
      if (!field || typeof field !== 'object') return { ...defaultField };
      const f = field as Record<string, unknown>;
      const val = f.value === null || f.value === undefined ? null : String(f.value).trim();
      const rawConf = String(f.confidence || '').toLowerCase();
      const conf: ConfidenceLevel = (rawConf === 'high' || rawConf === 'medium' || rawConf === 'low')
        ? (rawConf as ConfidenceLevel)
        : 'low';
      const src = f.sourceImage ? String(f.sourceImage) : null;

      // Parse and normalize box_2d: [ymin, xmin, ymax, xmax] on 0-1000 integer grid
      let boundingBox: BoundingBox | null = null;
      const rawBox = f.box_2d || f.boundingBox || f.box;
      if (Array.isArray(rawBox) && rawBox.length === 4) {
        const coords = rawBox.map((n) => {
          const num = Number(n);
          if (isNaN(num)) return 0;
          const scaled = num > 0 && num <= 1 ? num * 1000 : num;
          return Math.max(0, Math.min(1000, Math.round(scaled)));
        });
        const [ymin, xmin, ymax, xmax] = coords;
        if (ymax > ymin && xmax > xmin) {
          boundingBox = [ymin, xmin, ymax, xmax];
        }
      }

      return {
        value: val,
        confidence: conf,
        sourceImage: src,
        boundingBox,
        modifiedByInspector: false
      };
    };

    const extractedData: ExtractedData = {
      product_name: sanitizeField(analysis.product_name),
      product_category: sanitizeField(analysis.product_category),
      manufacturer_name: sanitizeField(analysis.manufacturer_name),
      manufacturer_address: sanitizeField(analysis.manufacturer_address),
      packer_name: sanitizeField(analysis.packer_name),
      packer_address: sanitizeField(analysis.packer_address),
      importer_name: sanitizeField(analysis.importer_name),
      importer_address: sanitizeField(analysis.importer_address),
      country_of_origin: sanitizeField(analysis.country_of_origin),
      net_quantity: sanitizeField(analysis.net_quantity),
      unit_of_measurement: sanitizeField(analysis.unit_of_measurement),
      mrp: sanitizeField(analysis.mrp),
      mrp_tax_declaration: sanitizeField(analysis.mrp_tax_declaration),
      date_of_manufacture: sanitizeField(analysis.date_of_manufacture),
      date_of_packing: sanitizeField(analysis.date_of_packing),
      best_before_use_by: sanitizeField(analysis.best_before_use_by),
      consumer_care_phone: sanitizeField(analysis.consumer_care_phone),
      consumer_care_email: sanitizeField(analysis.consumer_care_email),
      consumer_care_address: sanitizeField(analysis.consumer_care_address),
      batch_or_lot_no: sanitizeField(analysis.batch_or_lot_no),
      barcode: sanitizeField(analysis.barcode),
      other_declarations: sanitizeField(analysis.other_declarations),
      color_contrast_mrp: sanitizeField({
        value: contrastAssessment?.mrp_contrast || 'CONSPICUOUS',
        confidence: 'high',
        sourceImage: null
      }),
      color_contrast_net_quantity: sanitizeField({
        value: contrastAssessment?.net_quantity_contrast || 'CONSPICUOUS',
        confidence: 'high',
        sourceImage: null
      }),
      general_legibility: sanitizeField({
        value: contrastAssessment?.general_legibility || 'LEGIBLE',
        confidence: 'high',
        sourceImage: null
      }),
      packaging_exemption: sanitizeField({
        value: contrastAssessment?.detected_exemption || 'NONE',
        confidence: 'high',
        sourceImage: null
      }),
      contrast_assessment: contrastAssessment
        ? {
            mrpContrast: (['CONSPICUOUS', 'LOW_CONTRAST', 'POOR_CONTRAST', 'NOT_DETECTED'].includes(
              String(contrastAssessment.mrp_contrast).toUpperCase()
            )
              ? String(contrastAssessment.mrp_contrast).toUpperCase()
              : 'CONSPICUOUS') as ContrastLevel,
            mrpTextColor: contrastAssessment.mrp_colors ? String(contrastAssessment.mrp_colors) : null,
            netQuantityContrast: (['CONSPICUOUS', 'LOW_CONTRAST', 'POOR_CONTRAST', 'NOT_DETECTED'].includes(
              String(contrastAssessment.net_quantity_contrast).toUpperCase()
            )
              ? String(contrastAssessment.net_quantity_contrast).toUpperCase()
              : 'CONSPICUOUS') as ContrastLevel,
            netQuantityTextColor: contrastAssessment.net_quantity_colors ? String(contrastAssessment.net_quantity_colors) : null,
            generalLegibility: (['LEGIBLE', 'MODERATE_CONTRAST', 'LOW_CONTRAST', 'ILLEGIBLE'].includes(
              String(contrastAssessment.general_legibility).toUpperCase()
            )
              ? String(contrastAssessment.general_legibility).toUpperCase()
              : 'LEGIBLE') as GeneralLegibilityLevel,
            exemptionType: (['NONE', 'BLOWN_FORMED_MOLDED', 'HAND_SCRIPTED'].includes(
              String(contrastAssessment.detected_exemption).toUpperCase()
            )
              ? String(contrastAssessment.detected_exemption).toUpperCase()
              : 'NONE') as PackagingExemptionType,
            exemptionNotes: contrastAssessment.exemption_notes ? String(contrastAssessment.exemption_notes) : null,
            notes: contrastAssessment.notes ? String(contrastAssessment.notes) : null
          }
        : {
            mrpContrast: 'CONSPICUOUS',
            netQuantityContrast: 'CONSPICUOUS',
            generalLegibility: 'LEGIBLE',
            exemptionType: 'NONE'
          }
    };

    const imageQualityData = analysis.image_quality as Record<string, unknown> | undefined;
    const imageQuality: ImageQualityAssessment = {
      isAcceptable: imageQualityData?.isAcceptable === true,
      issues: Array.isArray(imageQualityData?.issues) ? imageQualityData.issues.map(String) : [],
      warnings: Array.isArray(imageQualityData?.warnings) ? imageQualityData.warnings.map(String) : []
    };

    const sameProductData = analysis.same_product_verification as Record<string, unknown> | undefined;
    const sameProductWarning = sameProductData?.likelySameProduct === false
      ? (String(sameProductData.warning || 'The uploaded images may not belong to the same product.'))
      : null;

    return {
      extractedData,
      imageQuality,
      sameProductWarning
    };
  } catch (parseErr) {
    console.error('[MetrologyAI] Structured Gemini response validation failed:', parseErr);
    throw new Error('API_ERROR: Gemini returned an invalid structured analysis response.');
  }
}
