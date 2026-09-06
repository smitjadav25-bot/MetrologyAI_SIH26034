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

  // === Rule LM-011 Color Contrast & Exemption Tests ===
  console.log('\n=== TEST 4: LM-011 Low Contrast MRP Numerals (Rule 9(1)(b)) ===');
  const lowContrastMrpData: ExtractedData = {
    ...compliantData,
    color_contrast_mrp: { value: 'LOW_CONTRAST', confidence: 'high', sourceImage: 'image-1' }
  };
  const lowMrpResult = evaluateLegalMetrologyCompliance(lowContrastMrpData);
  const lm011LowMrp = lowMrpResult.ruleResults.find(r => r.ruleId === 'LM-011');
  console.log('LM-011 Status:', lm011LowMrp?.status);
  console.log('LM-011 Observed:', lm011LowMrp?.observedValue);
  console.log('LM-011 Issue:', lm011LowMrp?.issue);
  if (lm011LowMrp?.status !== 'FAIL') {
    throw new Error(`Expected LM-011 FAIL for low contrast MRP, got ${lm011LowMrp?.status}`);
  }

  console.log('\n=== TEST 5: LM-011 Low Contrast Net Qty Numerals (Rule 9(1)(b)) ===');
  const lowContrastNetQtyData: ExtractedData = {
    ...compliantData,
    color_contrast_net_quantity: { value: 'LOW_CONTRAST', confidence: 'high', sourceImage: 'image-1' }
  };
  const lowNetQtyResult = evaluateLegalMetrologyCompliance(lowContrastNetQtyData);
  const lm011LowQty = lowNetQtyResult.ruleResults.find(r => r.ruleId === 'LM-011');
  console.log('LM-011 Status:', lm011LowQty?.status);
  console.log('LM-011 Observed:', lm011LowQty?.observedValue);
  if (lm011LowQty?.status !== 'FAIL') {
    throw new Error(`Expected LM-011 FAIL for low contrast Net Quantity, got ${lm011LowQty?.status}`);
  }

  console.log('\n=== TEST 6: LM-011 Blown/Molded Packaging Exemption (Rule 9(1) Proviso) ===');
  const blownMoldedData: ExtractedData = {
    ...compliantData,
    packaging_exemption: { value: 'BLOWN_FORMED_MOLDED', confidence: 'high', sourceImage: 'image-1' },
    color_contrast_mrp: { value: 'LOW_CONTRAST', confidence: 'high', sourceImage: 'image-1' },
    color_contrast_net_quantity: { value: 'LOW_CONTRAST', confidence: 'high', sourceImage: 'image-1' }
  };
  const blownResult = evaluateLegalMetrologyCompliance(blownMoldedData);
  const lm011Blown = blownResult.ruleResults.find(r => r.ruleId === 'LM-011');
  console.log('LM-011 Status:', lm011Blown?.status);
  console.log('LM-011 Observed:', lm011Blown?.observedValue);
  if (lm011Blown?.status !== 'PASS') {
    throw new Error(`Expected LM-011 PASS for blown/molded exemption, got ${lm011Blown?.status}`);
  }

  console.log('\n=== TEST 7: LM-011 Hand-scripted Legible Package (Rule 9(1) Proviso) ===');
  const handScriptedData: ExtractedData = {
    ...compliantData,
    packaging_exemption: { value: 'HAND_SCRIPTED', confidence: 'high', sourceImage: 'image-1' },
    general_legibility: { value: 'LEGIBLE', confidence: 'high', sourceImage: 'image-1' }
  };
  const handResult = evaluateLegalMetrologyCompliance(handScriptedData);
  const lm011Hand = handResult.ruleResults.find(r => r.ruleId === 'LM-011');
  console.log('LM-011 Status:', lm011Hand?.status);
  console.log('LM-011 Observed:', lm011Hand?.observedValue);
  if (lm011Hand?.status !== 'PASS') {
    throw new Error(`Expected LM-011 PASS for hand-scripted legible, got ${lm011Hand?.status}`);
  }

  console.log('\n=== TEST 8: LM-011 Hand-scripted Illegible Package (Rule 9(1)(a)) ===');
  const handIllegibleData: ExtractedData = {
    ...compliantData,
    packaging_exemption: { value: 'HAND_SCRIPTED', confidence: 'high', sourceImage: 'image-1' },
    general_legibility: { value: 'ILLEGIBLE', confidence: 'high', sourceImage: 'image-1' }
  };
  const handIllegibleResult = evaluateLegalMetrologyCompliance(handIllegibleData);
  const lm011HandIllegible = handIllegibleResult.ruleResults.find(r => r.ruleId === 'LM-011');
  console.log('LM-011 Status:', lm011HandIllegible?.status);
  console.log('LM-011 Observed:', lm011HandIllegible?.observedValue);
  if (lm011HandIllegible?.status !== 'FAIL') {
    throw new Error(`Expected LM-011 FAIL for hand-scripted illegible, got ${lm011HandIllegible?.status}`);
  }

  console.log('\n>>> All rule engine, colour contrast, and PDF tests passed successfully! <<<');
}

testPdfs().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
