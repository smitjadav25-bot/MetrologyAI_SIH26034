import { evaluateLegalMetrologyCompliance } from '../lib/compliance';
import { ExtractedData } from '../types/inspection';
import { generateComplianceCertificatePdf, generateNonComplianceNoticePdf } from '../lib/pdf';

// Scenario 1: Fully Compliant Product (PASS)
const compliantData: ExtractedData = {
  product_name: { value: 'Organic Rolled Oats', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  product_category: { value: 'Breakfast Cereals / Grains', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  manufacturer_name: { value: 'Himalayan Harvest Foods Pvt Ltd', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  manufacturer_address: { value: 'Plot 42, Food Park, Phase-1, Baddi, Solan, Himachal Pradesh 173205', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  packer_name: { value: null, confidence: 'low', sourceImage: null, modifiedByInspector: false },
  packer_address: { value: null, confidence: 'low', sourceImage: null, modifiedByInspector: false },
  importer_name: { value: null, confidence: 'low', sourceImage: null, modifiedByInspector: false },
  importer_address: { value: null, confidence: 'low', sourceImage: null, modifiedByInspector: false },
  country_of_origin: { value: 'India', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  net_quantity: { value: '500', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  unit_of_measurement: { value: 'g', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  mrp: { value: '₹185.00', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  mrp_tax_declaration: { value: 'inclusive of all taxes', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  date_of_manufacture: { value: '07/2026', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  date_of_packing: { value: '08/2026', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  best_before_use_by: { value: '12 months from packing', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  consumer_care_phone: { value: '1800-123-4567', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  consumer_care_email: { value: 'care@himalayanfoods.in', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  consumer_care_address: { value: 'Customer Cell, Plot 42, Baddi, HP 173205', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  batch_or_lot_no: { value: 'LOT-B26-894', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  barcode: { value: '8901030889211', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false },
  other_declarations: { value: 'Store in cool and dry place away from sunlight', confidence: 'high', sourceImage: 'image-2', modifiedByInspector: false }
};

const passResult = evaluateLegalMetrologyCompliance(compliantData);
console.log('=== TEST 1: Compliant Product ===');
console.log('Final Status:', passResult.finalStatus);
console.log('Score:', passResult.complianceScore);
console.log('Passed checks:', passResult.passedCount);
console.log('Failed checks:', passResult.failedCount);

if (passResult.finalStatus !== 'PASS' || passResult.complianceScore < 90) {
  throw new Error(`Test 1 Failed! Expected PASS, got ${passResult.finalStatus} with score ${passResult.complianceScore}`);
}

// Scenario 2: Non-Compliant Product (Missing Unit in Net Quantity, Missing Address, Missing MRP Tax Declaration, Missing Consumer Care)
const nonCompliantData: ExtractedData = {
  ...compliantData,
  net_quantity: { value: '500', confidence: 'high', sourceImage: 'image-1', modifiedByInspector: false },
  unit_of_measurement: { value: '', confidence: 'low', sourceImage: null, modifiedByInspector: false }, // Violates Rule 6(1)(c)
  manufacturer_address: { value: '', confidence: 'low', sourceImage: null, modifiedByInspector: false }, // Violates Rule 6(1)(b)
  consumer_care_phone: { value: '', confidence: 'low', sourceImage: null, modifiedByInspector: false },
  consumer_care_email: { value: '', confidence: 'low', sourceImage: null, modifiedByInspector: false },
  consumer_care_address: { value: '', confidence: 'low', sourceImage: null, modifiedByInspector: false } // Violates Rule 6(1)(n)
};

const failResult = evaluateLegalMetrologyCompliance(nonCompliantData);
console.log('\n=== TEST 2: Non-Compliant Product ===');
console.log('Final Status:', failResult.finalStatus);
console.log('Score:', failResult.complianceScore);
console.log('Failed checks:', failResult.failedCount);
console.log('Failed rules:', failResult.ruleResults.filter(r => r.status === 'FAIL').map(r => r.ruleName));

if (failResult.finalStatus !== 'FAIL' || failResult.failedCount === 0) {
  throw new Error(`Test 2 Failed! Expected FAIL, got ${failResult.finalStatus}`);
}

// Test PDF Generation for both scenarios
async function testPdfs() {
  console.log('\n=== TEST 3: PDF Generation ===');
  const mockPassInspection = {
    inspectionId: 'INS-2026-0001',
    createdAt: new Date().toISOString(),
    inspector: {
      id: 'INS-OFFICER-402',
      name: 'Inspector S. K. Verma',
      designation: 'Legal Metrology Inspector',
      jurisdiction: 'Zone-1 Enforcement Division'
    },
    images: [],
    extractedData: compliantData,
    reviewedData: compliantData,
    ruleResults: passResult.ruleResults,
    complianceScore: passResult.complianceScore,
    finalStatus: passResult.finalStatus,
    inspectorRemarks: 'All declarations visually verified against packaging.',
    certificateId: 'CERT-2026-0001',
    documentStatus: 'Active' as const
  };

  const certBytes = await generateComplianceCertificatePdf(mockPassInspection);
  console.log('Certificate PDF generated. Bytes:', certBytes.length);
  if (certBytes.length < 5000) throw new Error('Certificate PDF too small!');

  const mockFailInspection = {
    ...mockPassInspection,
    inspectionId: 'INS-2026-0002',
    certificateId: undefined,
    noticeId: 'NOTICE-2026-0001',
    ruleResults: failResult.ruleResults,
    complianceScore: failResult.complianceScore,
    finalStatus: failResult.finalStatus,
    recommendedAction: failResult.recommendedAction
  };

  const noticeBytes = await generateNonComplianceNoticePdf(mockFailInspection);
  console.log('Notice PDF generated. Bytes:', noticeBytes.length);
  if (noticeBytes.length < 4000) throw new Error('Notice PDF too small!');

  console.log('\n>>> All rule engine and PDF tests passed successfully! <<<');
}

testPdfs().catch(err => {
  console.error('PDF Test Error:', err);
  process.exit(1);
});
