export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ExtractedField<T = string | null> {
  value: T;
  confidence: ConfidenceLevel;
  sourceImage: string | null;
  modifiedByInspector?: boolean;
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
