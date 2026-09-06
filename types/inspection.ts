export type ConfidenceLevel = 'high' | 'medium' | 'low';

// [ymin, xmin, ymax, xmax] in 0-1000 normalized integer coordinates standard for Gemini Vision
export type BoundingBox = [number, number, number, number];

export interface ExtractedField<T = string | null> {
  value: T;
  confidence: ConfidenceLevel;
  sourceImage: string | null;
  boundingBox?: BoundingBox | null;
  modifiedByInspector?: boolean;
}

export type ContrastLevel = 'CONSPICUOUS' | 'LOW_CONTRAST' | 'POOR_CONTRAST' | 'NOT_DETECTED';
export type GeneralLegibilityLevel = 'LEGIBLE' | 'MODERATE_CONTRAST' | 'LOW_CONTRAST' | 'ILLEGIBLE';
export type PackagingExemptionType = 'NONE' | 'BLOWN_FORMED_MOLDED' | 'HAND_SCRIPTED';

export interface ColorContrastAssessment {
  mrpContrast: ContrastLevel;
  mrpTextColor?: string | null;
  mrpBackgroundColor?: string | null;
  netQuantityContrast: ContrastLevel;
  netQuantityTextColor?: string | null;
  netQuantityBackgroundColor?: string | null;
  generalLegibility: GeneralLegibilityLevel;
  exemptionType: PackagingExemptionType;
  exemptionNotes?: string | null;
  notes?: string | null;
}

export interface ExtractedData {
  product_name: ExtractedField;
  product_category: ExtractedField;
  manufacturer_name: ExtractedField;
  manufacturer_address: ExtractedField;
  packer_name: ExtractedField;
  packer_address: ExtractedField;
  importer_name: ExtractedField;
  importer_address: ExtractedField;
  country_of_origin: ExtractedField;
  net_quantity: ExtractedField;
  unit_of_measurement: ExtractedField;
  mrp: ExtractedField;
  mrp_tax_declaration: ExtractedField;
  date_of_manufacture: ExtractedField;
  date_of_packing: ExtractedField;
  best_before_use_by: ExtractedField;
  consumer_care_phone: ExtractedField;
  consumer_care_email: ExtractedField;
  consumer_care_address: ExtractedField;
  batch_or_lot_no: ExtractedField;
  barcode: ExtractedField;
  other_declarations: ExtractedField;
  // Rule 9(1)(b) & Rule 9(1)(a) Color Contrast and Exemption fields
  color_contrast_mrp?: ExtractedField<string | null>;
  color_contrast_net_quantity?: ExtractedField<string | null>;
  general_legibility?: ExtractedField<string | null>;
  packaging_exemption?: ExtractedField<string | null>;
  contrast_assessment?: ColorContrastAssessment;
}

export interface ImageQualityAssessment {
  isAcceptable: boolean;
  issues: string[];
  warnings: string[];
  unclear_fields?: string[];
}

export type RuleStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE';
export type SeverityLevel = 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  requirement: string;
  legalReference: string;
  status: RuleStatus;
  observedValue: string;
  explanation: string;
  issue?: string;
  expectedCondition?: string;
  severity?: SeverityLevel;
  sourceImage?: string | null;
  evidence?: {
    imageId?: string;
    imageIndex?: number;
    url?: string;
    note?: string;
  };
}

export interface InspectorProfile {
  id: string;
  name: string;
  designation: string;
  jurisdiction: string;
}

export interface UploadedImageEvidence {
  id: string;
  url: string;
  originalName: string;
  viewType?: string;
  uploadedAt: string;
}

export interface Inspection {
  inspectionId: string;
  createdAt: string;
  updatedAt?: string;
  inspector: InspectorProfile;
  images: UploadedImageEvidence[];
  extractedData: ExtractedData;
  reviewedData: ExtractedData;
  ruleResults: RuleResult[];
  complianceScore: number;
  finalStatus: 'PASS' | 'FAIL' | 'WARNING';
  inspectorRemarks: string;
  recommendedAction?: string;
  certificateId?: string;
  noticeId?: string;
  documentStatus: 'Active' | 'Superseded';
}
