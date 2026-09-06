import { ExtractedData, RuleResult, SeverityLevel } from '@/types/inspection';

export interface RuleDefinition {
  ruleId: string;
  ruleName: string;
  requirement: string;
  legalReference: string;
  category: 'Product' | 'Manufacturer' | 'Origin' | 'Quantity' | 'Pricing' | 'Dates' | 'ConsumerCare' | 'Traceability' | 'Legibility';
  severity: SeverityLevel;
  evaluate: (data: ExtractedData) => RuleResult;
}

// Standard units of weight, measure and count per Legal Metrology (Packaged Commodities) Rules, 2011 (Schedule 2)
const VALID_STANDARD_UNITS = [
  'g', 'gm', 'gms', 'gram', 'grams',
  'kg', 'kgs', 'kilogram', 'kilograms',
  'mg', 'milligram', 'milligrams',
  'ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters',
  'l', 'lt', 'ltr', 'litre', 'litres', 'liter', 'liters',
  'm', 'metre', 'metres', 'meter', 'meters',
  'cm', 'centimetre', 'centimetres', 'centimeter', 'centimeters',
  'mm', 'millimetre', 'millimetres',
  'sq.m', 'sq.cm',
  'n', 'no', 'nos', 'number', 'numbers', 'u', 'unit', 'units', 'pc', 'pcs', 'piece', 'pieces', 'tablets', 'capsules', 'sheets', 'sachets', 'wipes'
];

export const LEGAL_METROLOGY_RULES: RuleDefinition[] = [
  // LM-001: Product Generic Name
  {
    ruleId: 'LM-001',
    ruleName: 'Product Name / Generic Identity Declaration',
    requirement: 'Generic or common name of the packaged commodity',
    legalReference: 'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Product',
    severity: 'CRITICAL',
    evaluate: (data: ExtractedData): RuleResult => {
      const field = data.product_name;
      const val = field?.value ? field.value.trim() : '';

      if (!val) {
        return {
          ruleId: 'LM-001',
          ruleName: 'Product Name / Generic Identity Declaration',
          requirement: 'Generic or common name of the commodity must be declared conspicuously on the principal display panel.',
          legalReference: 'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Not Declared / Not Visible',
          issue: 'No generic or common name of the commodity found on the packaging.',
          expectedCondition: 'Conspicuous declaration of the generic or specific name of the packaged commodity.',
          severity: 'CRITICAL',
          sourceImage: field?.sourceImage || null,
          explanation: 'Every package must contain the generic or common name of the commodity contained within under Rule 6(1)(a).'
        };
      }

      return {
        ruleId: 'LM-001',
        ruleName: 'Product Name / Generic Identity Declaration',
        requirement: 'Generic or common name of the commodity must be declared conspicuously.',
        legalReference: 'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: val,
        explanation: `Generic product identity is clearly declared as "${val}".`,
        sourceImage: field.sourceImage
      };
    }
  },

  // LM-002: Manufacturer Name & Complete Address
  {
    ruleId: 'LM-002',
    ruleName: 'Manufacturer Name and Complete Address',
    requirement: 'Name and complete address of the manufacturer (including city, state, postal PIN code)',
    legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Manufacturer',
    severity: 'CRITICAL',
    evaluate: (data: ExtractedData): RuleResult => {
      const nameField = data.manufacturer_name;
      const addrField = data.manufacturer_address;
      const name = nameField?.value ? nameField.value.trim() : '';
      const addr = addrField?.value ? addrField.value.trim() : '';

      if (!name && !addr) {
        return {
          ruleId: 'LM-002',
          ruleName: 'Manufacturer Name and Complete Address',
          requirement: 'Complete name and physical geographic address of the manufacturer must be declared.',
          legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Missing completely',
          issue: 'Neither manufacturer name nor address is declared on the packaging.',
          expectedCondition: 'Full name and complete physical address of the manufacturer.',
          severity: 'CRITICAL',
          sourceImage: nameField?.sourceImage || addrField?.sourceImage || null,
          explanation: 'Rule 6(1)(b) mandates the declaration of the full name and complete address of the manufacturer.'
        };
      }

      if (!name) {
        return {
          ruleId: 'LM-002',
          ruleName: 'Manufacturer Name and Complete Address',
          requirement: 'Manufacturer name must accompany the address.',
          legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: `Address: "${addr}" (Name missing)`,
          issue: 'Manufacturer address is visible but corporate/legal entity name is missing.',
          expectedCondition: 'Manufacturer business name must be explicitly declared.',
          severity: 'CRITICAL',
          sourceImage: addrField?.sourceImage || null,
          explanation: 'The manufacturer legal name is missing from the package.'
        };
      }

      if (!addr) {
        return {
          ruleId: 'LM-002',
          ruleName: 'Manufacturer Name and Complete Address',
          requirement: 'Complete physical address with city, state, and PIN code.',
          legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: `Name: "${name}" (Address missing)`,
          issue: 'Manufacturer address is missing; only name is declared.',
          expectedCondition: 'Complete geographic address where consumer can reach or identify the premises.',
          severity: 'CRITICAL',
          sourceImage: nameField?.sourceImage || null,
          explanation: 'Declaration of manufacturer address is mandatory to enable legal traceability.'
        };
      }

      // Check if address is suspiciously short (e.g. only 1 word or fewer than 10 characters)
      if (addr.length < 10) {
        return {
          ruleId: 'LM-002',
          ruleName: 'Manufacturer Name and Complete Address',
          requirement: 'Complete physical address with postal/geographic details.',
          legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'WARNING',
          observedValue: `${name}, ${addr}`,
          issue: 'Manufacturer address appears incomplete or lacks specific street/pin code details.',
          expectedCondition: 'Complete postal address with premises, city, state, and PIN code.',
          severity: 'MODERATE',
          sourceImage: addrField?.sourceImage || nameField?.sourceImage || null,
          explanation: 'The address provided may not meet the complete address standard required under Rule 6(1)(b).'
        };
      }

      return {
        ruleId: 'LM-002',
        ruleName: 'Manufacturer Name and Complete Address',
        requirement: 'Manufacturer name and complete geographic address declared.',
        legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: `${name} | ${addr}`,
        explanation: `Manufacturer "${name}" and address are declared in accordance with Rule 6(1)(b).`,
        sourceImage: addrField?.sourceImage || nameField?.sourceImage || null
      };
    }
  },

  // LM-003: Packer / Importer Details (Where applicable)
  {
    ruleId: 'LM-003',
    ruleName: 'Packer or Importer Declaration (Where Applicable)',
    requirement: 'Name and address of packer (if different from manufacturer) or importer (if imported)',
    legalReference: 'Rule 6(1)(b) proviso & Rule 6(10), Legal Metrology (PC) Rules, 2011',
    category: 'Manufacturer',
    severity: 'MAJOR',
    evaluate: (data: ExtractedData): RuleResult => {
      const packerName = data.packer_name?.value?.trim() || '';
      const packerAddr = data.packer_address?.value?.trim() || '';
      const importerName = data.importer_name?.value?.trim() || '';
      const importerAddr = data.importer_address?.value?.trim() || '';
      const origin = (data.country_of_origin?.value || '').toLowerCase();

      const isImported = origin && !origin.includes('india') && origin.length > 2;

      if (isImported) {
        if (!importerName || !importerAddr) {
          return {
            ruleId: 'LM-003',
            ruleName: 'Packer or Importer Declaration (Where Applicable)',
            requirement: 'Importer name and address mandatory for imported commodities.',
            legalReference: 'Rule 6(1)(b) proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
            status: 'FAIL',
            observedValue: importerName ? `Importer: ${importerName} (Address missing)` : 'No importer declaration found',
            issue: 'Country of origin is outside India but complete importer details are not declared.',
            expectedCondition: 'Name and full address of the Indian importer must be declared for all imported packaged goods.',
            severity: 'CRITICAL',
            sourceImage: data.importer_name?.sourceImage || data.country_of_origin?.sourceImage || null,
            explanation: 'For imported goods, declaring the registered Indian importer is a mandatory requirement.'
          };
        }

        return {
          ruleId: 'LM-003',
          ruleName: 'Packer or Importer Declaration (Where Applicable)',
          requirement: 'Importer declaration for imported goods.',
          legalReference: 'Rule 6(1)(b) proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'PASS',
          observedValue: `Importer: ${importerName}, ${importerAddr}`,
          explanation: 'Importer details are properly declared for imported commodity.',
          sourceImage: data.importer_name?.sourceImage || null
        };
      }

      // Domestic product: packer declaration is optional if manufacturer packs, but if declared check completeness
      if (packerName && !packerAddr) {
        return {
          ruleId: 'LM-003',
          ruleName: 'Packer or Importer Declaration (Where Applicable)',
          requirement: 'Packer address must accompany packer name.',
          legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'WARNING',
          observedValue: `Packer: ${packerName} (Address missing)`,
          issue: 'Packer name is declared without full packer address.',
          expectedCondition: 'Complete address of packer if packer is different from manufacturer.',
          severity: 'MODERATE',
          sourceImage: data.packer_name?.sourceImage || null,
          explanation: 'When separate packer is identified, complete address should be stated.'
        };
      }

      if (packerName && packerAddr) {
        return {
          ruleId: 'LM-003',
          ruleName: 'Packer or Importer Declaration (Where Applicable)',
          requirement: 'Packer declaration where separate entity packs the commodity.',
          legalReference: 'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'PASS',
          observedValue: `Packer: ${packerName}, ${packerAddr}`,
          explanation: 'Packer details declared cleanly.',
          sourceImage: data.packer_name?.sourceImage || null
        };
      }

      return {
        ruleId: 'LM-003',
        ruleName: 'Packer or Importer Declaration (Where Applicable)',
        requirement: 'Packer or importer details when applicable.',
        legalReference: 'Rule 6(1)(b) proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: 'Manufacturer packed directly (Domestic)',
        explanation: 'Direct domestic manufacture and packing; separate packer or importer not required.',
        sourceImage: null
      };
    }
  },

  // LM-004: Country of Origin
  {
    ruleId: 'LM-004',
    ruleName: 'Country of Origin Declaration',
    requirement: 'Declaration of country of origin or manufacture',
    legalReference: 'Rule 6(10), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Origin',
    severity: 'MAJOR',
    evaluate: (data: ExtractedData): RuleResult => {
      const field = data.country_of_origin;
      const val = field?.value ? field.value.trim() : '';

      if (!val) {
        return {
          ruleId: 'LM-004',
          ruleName: 'Country of Origin Declaration',
          requirement: 'Declaration of the country of origin or manufacture on the label.',
          legalReference: 'Rule 6(10), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Not Declared / Not Visible',
          issue: 'Country of origin is not declared on the package.',
          expectedCondition: 'Clear declaration such as "Country of Origin: India" or "Made in [Country]".',
          severity: 'MAJOR',
          sourceImage: field?.sourceImage || null,
          explanation: 'Rule 6(10) requires the country of origin to be explicitly declared on all packaged commodities.'
        };
      }

      return {
        ruleId: 'LM-004',
        ruleName: 'Country of Origin Declaration',
        requirement: 'Country of origin explicitly declared.',
        legalReference: 'Rule 6(10), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: val,
        explanation: `Country of origin is declared as "${val}".`,
        sourceImage: field.sourceImage
      };
    }
  },

  // LM-005: Net Quantity & Standard Units
  {
    ruleId: 'LM-005',
    ruleName: 'Net Quantity Declaration and Standard Unit of Measurement',
    requirement: 'Net quantity declared in standard units of weight, measure, or count (Schedule 2)',
    legalReference: 'Rule 6(1)(c) & Rule 11, Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Quantity',
    severity: 'CRITICAL',
    evaluate: (data: ExtractedData): RuleResult => {
      const qtyField = data.net_quantity;
      const unitField = data.unit_of_measurement;
      const rawQty = qtyField?.value ? qtyField.value.trim() : '';
      const rawUnit = unitField?.value ? unitField.value.trim() : '';

      if (!rawQty) {
        return {
          ruleId: 'LM-005',
          ruleName: 'Net Quantity Declaration and Standard Unit of Measurement',
          requirement: 'Net quantity must be declared using standard units of weight, volume, length, or number.',
          legalReference: 'Rule 6(1)(c), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Not Declared / Not Visible',
          issue: 'Net quantity declaration is missing from the package.',
          expectedCondition: 'Net quantity declared with number and standard unit (e.g., 500 g, 1 L, 10 units).',
          severity: 'CRITICAL',
          sourceImage: qtyField?.sourceImage || null,
          explanation: 'Rule 6(1)(c) requires every package to bear a declaration of net quantity.'
        };
      }

      // Check if unit is part of rawQty or declared in rawUnit
      const combined = `${rawQty} ${rawUnit}`.trim().toLowerCase();
      
      // Extract words/tokens to check for standard unit
      const tokens = combined.split(/[\s,/-]+/).map(t => t.replace(/[^a-z0-9.]/g, '')).filter(Boolean);
      
      const hasStandardUnit = tokens.some(tok => VALID_STANDARD_UNITS.includes(tok)) ||
        VALID_STANDARD_UNITS.some(unit => combined.includes(unit));

      // Check if rawQty is purely digits without any unit anywhere
      const isOnlyDigits = /^\d+(\.\d+)?$/.test(rawQty.trim()) && (!rawUnit || rawUnit.trim() === '');

      if (isOnlyDigits || !hasStandardUnit) {
        return {
          ruleId: 'LM-005',
          ruleName: 'Net Quantity Declaration and Standard Unit of Measurement',
          requirement: 'Net quantity must specify an approved standard unit of measurement under Schedule 2.',
          legalReference: 'Rule 6(1)(c) & Rule 11, Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: rawQty + (rawUnit ? ` (unit: ${rawUnit})` : ''),
          issue: 'Unit of measurement is missing or non-standard. Plain numbers without standard units violate Schedule 2.',
          expectedCondition: 'Applicable quantity declaration with recognized standard metric unit (e.g., g, kg, ml, l, pcs).',
          severity: 'CRITICAL',
          sourceImage: qtyField?.sourceImage || unitField?.sourceImage || null,
          explanation: 'A numerical quantity without an approved standard metric unit of measurement fails statutory net quantity requirements.'
        };
      }

      return {
        ruleId: 'LM-005',
        ruleName: 'Net Quantity Declaration and Standard Unit of Measurement',
        requirement: 'Net quantity declared in approved standard unit.',
        legalReference: 'Rule 6(1)(c), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: `${rawQty} ${rawUnit}`.trim(),
        explanation: `Net quantity correctly declared with standard metric unit as "${rawQty} ${rawUnit}".`,
        sourceImage: qtyField.sourceImage || unitField?.sourceImage || null
      };
    }
  },

  // LM-006: Maximum Retail Price (MRP) & Tax Declaration
  {
    ruleId: 'LM-006',
    ruleName: 'Maximum Retail Price (MRP) Declaration',
    requirement: 'Retail sale price clearly declared as Maximum Retail Price (MRP) inclusive of all taxes',
    legalReference: 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Pricing',
    severity: 'CRITICAL',
    evaluate: (data: ExtractedData): RuleResult => {
      const mrpField = data.mrp;
      const taxField = data.mrp_tax_declaration;
      const mrpVal = mrpField?.value ? mrpField.value.trim() : '';
      const taxVal = taxField?.value ? taxField.value.trim() : '';

      if (!mrpVal) {
        return {
          ruleId: 'LM-006',
          ruleName: 'Maximum Retail Price (MRP) Declaration',
          requirement: 'Retail sale price must be declared in Indian currency with MRP declaration.',
          legalReference: 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Not Declared / Not Visible',
          issue: 'Maximum Retail Price (MRP) is missing or not visible on the package.',
          expectedCondition: 'Declaration of MRP in format: "MRP ₹ [amount] incl. of all taxes" or "Maximum Retail Price Rs. [amount]".',
          severity: 'CRITICAL',
          sourceImage: mrpField?.sourceImage || null,
          explanation: 'Rule 6(1)(e) mandates the declaration of the retail sale price inclusive of all taxes.'
        };
      }

      // Check for price numeral
      const hasNumber = /\d+/.test(mrpVal);
      if (!hasNumber) {
        return {
          ruleId: 'LM-006',
          ruleName: 'Maximum Retail Price (MRP) Declaration',
          requirement: 'Numeric monetary amount must be declared.',
          legalReference: 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: mrpVal,
          issue: 'Price label found but no valid monetary figure is identifiable.',
          expectedCondition: 'Valid price numerals with currency symbol.',
          severity: 'CRITICAL',
          sourceImage: mrpField?.sourceImage || null,
          explanation: 'MRP declaration must contain a clear numeric price amount.'
        };
      }

      // Check tax inclusive statement
      const fullText = `${mrpVal} ${taxVal}`.toLowerCase();
      const mentionsTaxes = fullText.includes('tax') || fullText.includes('incl') || fullText.includes('all taxes');

      if (!mentionsTaxes) {
        return {
          ruleId: 'LM-006',
          ruleName: 'Maximum Retail Price (MRP) Declaration',
          requirement: 'Retail price must explicitly state "inclusive of all taxes".',
          legalReference: 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'WARNING',
          observedValue: mrpVal,
          issue: 'Price amount declared, but explicit statement "inclusive of all taxes" is not clearly confirmed.',
          expectedCondition: 'Price declaration must accompany "incl. of all taxes" or "inclusive of all taxes".',
          severity: 'MODERATE',
          sourceImage: mrpField?.sourceImage || taxField?.sourceImage || null,
          explanation: 'Under Rule 6(1)(e), MRP must be expressed as inclusive of all taxes.'
        };
      }

      return {
        ruleId: 'LM-006',
        ruleName: 'Maximum Retail Price (MRP) Declaration',
        requirement: 'MRP declared in proper format inclusive of taxes.',
        legalReference: 'Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: `${mrpVal} ${taxVal ? `(${taxVal})` : ''}`.trim(),
        explanation: `MRP is declared as "${mrpVal}" with statutory tax inclusiveness confirmation.`,
        sourceImage: mrpField.sourceImage || taxField?.sourceImage || null
      };
    }
  },

  // LM-007: Consumer Care / Grievance Redressal Details
  {
    ruleId: 'LM-007',
    ruleName: 'Consumer Care / Grievance Redressal Mechanism',
    requirement: 'Name, address, telephone number, and email of person or office to contact for complaints',
    legalReference: 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'ConsumerCare',
    severity: 'CRITICAL',
    evaluate: (data: ExtractedData): RuleResult => {
      const phoneField = data.consumer_care_phone;
      const emailField = data.consumer_care_email;
      const addrField = data.consumer_care_address;

      const phone = phoneField?.value ? phoneField.value.trim() : '';
      const email = emailField?.value ? emailField.value.trim() : '';
      const addr = addrField?.value ? addrField.value.trim() : '';

      const hasContact = Boolean(phone || email || addr);

      if (!hasContact) {
        return {
          ruleId: 'LM-007',
          ruleName: 'Consumer Care / Grievance Redressal Mechanism',
          requirement: 'Mandatory declaration of consumer care telephone, email, and contact address.',
          legalReference: 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Not Declared / Not Visible',
          issue: 'No consumer care contact details (telephone, email, or address) found on packaging.',
          expectedCondition: 'Telephone number, email address, and postal address for customer complaints.',
          severity: 'CRITICAL',
          sourceImage: phoneField?.sourceImage || emailField?.sourceImage || null,
          explanation: 'Rule 6(1)(n) mandates consumer care contact mechanisms on all pre-packaged commodities.'
        };
      }

      // If only one channel is present (e.g. phone but no email or vice-versa)
      const channels = [
        phone ? `Tel: ${phone}` : null,
        email ? `Email: ${email}` : null,
        addr ? `Address: ${addr}` : null
      ].filter(Boolean);

      if (!phone || !email) {
        return {
          ruleId: 'LM-007',
          ruleName: 'Consumer Care / Grievance Redressal Mechanism',
          requirement: 'Both telephone and email address should be declared for comprehensive grievance redressal.',
          legalReference: 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'WARNING',
          observedValue: channels.join(' | '),
          issue: !phone ? 'Consumer care telephone number missing.' : 'Consumer care email address missing.',
          expectedCondition: 'Both telephonic helpline and email address should be provided alongside address.',
          severity: 'MODERATE',
          sourceImage: phoneField?.sourceImage || emailField?.sourceImage || addrField?.sourceImage || null,
          explanation: 'Rule 6(1)(n) requires multiple consumer contact avenues including telephone and email.'
        };
      }

      return {
        ruleId: 'LM-007',
        ruleName: 'Consumer Care / Grievance Redressal Mechanism',
        requirement: 'Consumer care contact details provided.',
        legalReference: 'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: channels.join(' | '),
        explanation: 'Consumer care contact channels (telephone, email, address) are declared.',
        sourceImage: phoneField?.sourceImage || emailField?.sourceImage || null
      };
    }
  },

  // LM-008: Date of Manufacture or Packing
  {
    ruleId: 'LM-008',
    ruleName: 'Date of Manufacture or Pre-packing Declaration',
    requirement: 'Month and year of manufacture, packing, or import',
    legalReference: 'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Dates',
    severity: 'MAJOR',
    evaluate: (data: ExtractedData): RuleResult => {
      const mfgField = data.date_of_manufacture;
      const pkdField = data.date_of_packing;
      const mfg = mfgField?.value ? mfgField.value.trim() : '';
      const pkd = pkdField?.value ? pkdField.value.trim() : '';

      const dateStr = mfg || pkd;

      if (!dateStr) {
        return {
          ruleId: 'LM-008',
          ruleName: 'Date of Manufacture or Pre-packing Declaration',
          requirement: 'Month and year of manufacture or pre-packing must be declared.',
          legalReference: 'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'Not Declared / Not Visible',
          issue: 'Date of manufacture or pre-packing is missing from packaging.',
          expectedCondition: 'Month and year (or exact date) in format MM/YYYY, DD/MM/YYYY, or Month YYYY.',
          severity: 'MAJOR',
          sourceImage: mfgField?.sourceImage || pkdField?.sourceImage || null,
          explanation: 'Rule 6(1)(d) mandates declaration of the month and year of manufacture or packing.'
        };
      }

      return {
        ruleId: 'LM-008',
        ruleName: 'Date of Manufacture or Pre-packing Declaration',
        requirement: 'Month and year of manufacture or packing clearly stated.',
        legalReference: 'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: mfg ? `Mfg: ${mfg}` : `Pkd: ${pkd}`,
        explanation: `Statutory packing/manufacturing date declared as "${dateStr}".`,
        sourceImage: mfgField?.sourceImage || pkdField?.sourceImage || null
      };
    }
  },

  // LM-009: Best Before / Expiry Date (Food / Perishables / Cosmetics)
  {
    ruleId: 'LM-009',
    ruleName: 'Best Before / Use-by / Expiry Date',
    requirement: 'Best before, use by, or expiry date where applicable',
    legalReference: 'Rule 6(1)(d) proviso & Applicable FSSAI/Commodity Standards',
    category: 'Dates',
    severity: 'MODERATE',
    evaluate: (data: ExtractedData): RuleResult => {
      const expField = data.best_before_use_by;
      const exp = expField?.value ? expField.value.trim() : '';
      const category = (data.product_category?.value || '').toLowerCase();
      const isPerishable = category.includes('food') || category.includes('beverage') || category.includes('cosmetic') || category.includes('edible') || category.includes('perishable') || category.includes('pharma');

      if (!exp) {
        if (isPerishable) {
          return {
            ruleId: 'LM-009',
            ruleName: 'Best Before / Use-by / Expiry Date',
            requirement: 'Mandatory expiry / best before declaration for consumable/perishable goods.',
            legalReference: 'Rule 6(1)(d) proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
            status: 'WARNING',
            observedValue: 'Not Declared / Not Visible',
            issue: 'Consumable/perishable package does not visibly declare "Best Before" or "Use by" date.',
            expectedCondition: 'Statement of "Best before [duration/date]" or "Expiry date [date]".',
            severity: 'MODERATE',
            sourceImage: expField?.sourceImage || null,
            explanation: 'Perishable goods require unambiguous expiry or best-before periods for consumer safety.'
          };
        }

        return {
          ruleId: 'LM-009',
          ruleName: 'Best Before / Use-by / Expiry Date',
          requirement: 'Best before date where applicable for perishable items.',
          legalReference: 'Rule 6(1)(d) proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'NOT_APPLICABLE',
          observedValue: 'Non-perishable commodity or not declared',
          explanation: 'Not strictly mandatory for durable non-perishable commodities.',
          sourceImage: null
        };
      }

      return {
        ruleId: 'LM-009',
        ruleName: 'Best Before / Use-by / Expiry Date',
        requirement: 'Best before or expiry declaration.',
        legalReference: 'Rule 6(1)(d) proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: exp,
        explanation: `Expiry / Best-before period clearly declared as "${exp}".`,
        sourceImage: expField?.sourceImage || null
      };
    }
  },

  // LM-010: Batch / Lot Identification
  {
    ruleId: 'LM-010',
    ruleName: 'Batch or Lot Number for Traceability',
    requirement: 'Batch number, lot number, or code number to identify production lot',
    legalReference: 'Rule 6(1)(g), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Traceability',
    severity: 'MODERATE',
    evaluate: (data: ExtractedData): RuleResult => {
      const lotField = data.batch_or_lot_no;
      const lot = lotField?.value ? lotField.value.trim() : '';

      if (!lot) {
        return {
          ruleId: 'LM-010',
          ruleName: 'Batch or Lot Number for Traceability',
          requirement: 'Declaration of batch number, lot number, or identification code.',
          legalReference: 'Rule 6(1)(g), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'WARNING',
          observedValue: 'Not Declared / Not Visible',
          issue: 'Batch or lot number could not be identified on the packaging.',
          expectedCondition: 'Batch number, lot number, or production code for statutory traceability.',
          severity: 'MODERATE',
          sourceImage: lotField?.sourceImage || null,
          explanation: 'Rule 6(1)(g) prescribes that every package shall bear a lot or batch code.'
        };
      }

      return {
        ruleId: 'LM-010',
        ruleName: 'Batch or Lot Number for Traceability',
        requirement: 'Lot or batch number declared.',
        legalReference: 'Rule 6(1)(g), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: lot,
        explanation: `Traceability lot/batch code declared as "${lot}".`,
        sourceImage: lotField?.sourceImage || null
      };
    }
  },

  // LM-011: Colour Contrast & Prominent Legibility (Rule 9)
  {
    ruleId: 'LM-011',
    ruleName: 'Colour Contrast & Prominent Legibility',
    requirement: 'Numerals of Retail Sale Price (MRP) and Net Quantity must contrast conspicuously with background (Rule 9(1)(b)); declarations must be prominent and legible (Rule 9(1)(a)).',
    legalReference: 'Rule 9(1)(a) & Rule 9(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
    category: 'Legibility',
    severity: 'MAJOR',
    evaluate: (data: ExtractedData): RuleResult => {
      const exemption = (data.packaging_exemption?.value || data.contrast_assessment?.exemptionType || 'NONE').toUpperCase();
      const mrpContrast = (data.color_contrast_mrp?.value || data.contrast_assessment?.mrpContrast || 'CONSPICUOUS').toUpperCase();
      const netQtyContrast = (data.color_contrast_net_quantity?.value || data.contrast_assessment?.netQuantityContrast || 'CONSPICUOUS').toUpperCase();
      const generalLegibility = (data.general_legibility?.value || data.contrast_assessment?.generalLegibility || 'LEGIBLE').toUpperCase();

      const sourceImg = data.mrp?.sourceImage || data.net_quantity?.sourceImage || null;

      // 1. Exemption Check: Blown, Formed, Molded, Embossed or Perforated on Glass/Plastic (Rule 9(1) Proviso)
      if (exemption === 'BLOWN_FORMED_MOLDED') {
        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Numerals for MRP and Net Quantity must contrast conspicuously with background, except where exempted under Rule 9(1) Proviso.',
          legalReference: 'Rule 9(1)(a) & Rule 9(1)(b) Proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'PASS',
          observedValue: 'Exempted (Blown / Formed / Molded / Embossed on packaging surface)',
          explanation: 'Exemption satisfied under Rule 9(1) Proviso: Where label information is directly blown, formed, molded, embossed, or perforated onto a glass or plastic surface, a distinct contrasting colour is not strictly required.',
          sourceImage: sourceImg
        };
      }

      // 2. Exemption Check: Hand-scripted Declarations (Rule 9(1) Proviso)
      if (exemption === 'HAND_SCRIPTED') {
        if (generalLegibility === 'ILLEGIBLE') {
          return {
            ruleId: 'LM-011',
            ruleName: 'Colour Contrast & Prominent Legibility',
            requirement: 'Hand-scripted declarations must be clear, unambiguous, and perfectly legible.',
            legalReference: 'Rule 9(1)(a) & Rule 9(1)(b) Proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
            status: 'FAIL',
            observedValue: 'Hand-scripted (Illegible / Ambiguous)',
            issue: 'Hand-scripted declarations are illegible or ambiguous, failing the clarity requirement of Rule 9(1) Proviso.',
            expectedCondition: 'Hand-scripted declarations must be clear, unambiguous, and completely legible.',
            severity: 'MAJOR',
            sourceImage: sourceImg,
            explanation: 'Under Rule 9(1) Proviso, hand-scripted declarations are exempted from rigid colour contrast only if handwriting is clear, unambiguous, and perfectly legible.'
          };
        }

        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Hand-scripted declarations must be clear, unambiguous, and perfectly legible.',
          legalReference: 'Rule 9(1)(a) & Rule 9(1)(b) Proviso, Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'PASS',
          observedValue: 'Exempted: Hand-scripted declaration (Clear & Legible)',
          explanation: 'Exemption satisfied under Rule 9(1) Proviso: Declaration is in hand-script and is clear, unambiguous, and perfectly legible; rigid colour contrast is not enforced.',
          sourceImage: sourceImg
        };
      }

      // 3. Standard Printed Label - Core Color Contrast Check (Rule 9(1)(b))
      const isMrpLowContrast = mrpContrast === 'LOW_CONTRAST' || mrpContrast === 'POOR_CONTRAST';
      const isNetQtyLowContrast = netQtyContrast === 'LOW_CONTRAST' || netQtyContrast === 'POOR_CONTRAST';

      if (isMrpLowContrast && isNetQtyLowContrast) {
        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Numerals for Retail Sale Price (MRP) and Net Quantity must be printed in a colour that contrasts conspicuously with the background of the label.',
          legalReference: 'Rule 9(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: `MRP Numerals: ${mrpContrast} | Net Qty Numerals: ${netQtyContrast}`,
          issue: 'Rule 9(1)(b) Violation: Numerals of both Retail Sale Price (MRP) and Net Quantity do not contrast conspicuously with the label background.',
          expectedCondition: 'Numerals for both MRP and Net Quantity must be printed in a conspicuous contrasting colour against the label background.',
          severity: 'MAJOR',
          sourceImage: sourceImg,
          explanation: 'Rule 9(1)(b) explicitly mandates that numerals for Retail Sale Price (MRP) and Net Quantity must be printed, painted, or inscribed in a colour that contrasts conspicuously with the background of the label.'
        };
      }

      if (isMrpLowContrast) {
        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Numerals for Retail Sale Price (MRP) must contrast conspicuously with the background of the label.',
          legalReference: 'Rule 9(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: `MRP Numerals: ${mrpContrast} (Net Qty: ${netQtyContrast})`,
          issue: 'Rule 9(1)(b) Violation: Numerals of Retail Sale Price (MRP) do not contrast conspicuously with the label background (e.g. low-contrast font or tone-on-tone coloring).',
          expectedCondition: 'Numerals for MRP must be printed in a colour that contrasts conspicuously with the label background.',
          severity: 'MAJOR',
          sourceImage: data.mrp?.sourceImage || sourceImg,
          explanation: 'Under Rule 9(1)(b), the numerals for the Retail Sale Price must be printed, painted, or inscribed on the package in a colour that contrasts conspicuously with the background of the label.'
        };
      }

      if (isNetQtyLowContrast) {
        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Numerals for Net Quantity must contrast conspicuously with the background of the label.',
          legalReference: 'Rule 9(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: `Net Qty Numerals: ${netQtyContrast} (MRP: ${mrpContrast})`,
          issue: 'Rule 9(1)(b) Violation: Numerals of Net Quantity do not contrast conspicuously with the label background.',
          expectedCondition: 'Numerals for Net Quantity must be printed in a colour that contrasts conspicuously with the label background.',
          severity: 'MAJOR',
          sourceImage: data.net_quantity?.sourceImage || sourceImg,
          explanation: 'Under Rule 9(1)(b), the numerals for Net Quantity must be printed, painted, or inscribed on the package in a colour that contrasts conspicuously with the background of the label.'
        };
      }

      // 4. General Legibility & Prominence Check (Rule 9(1)(a))
      if (generalLegibility === 'ILLEGIBLE') {
        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Every mandatory declaration on the package must be completely legible and prominent.',
          legalReference: 'Rule 9(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'FAIL',
          observedValue: 'General Declarations: Illegible',
          issue: 'Rule 9(1)(a) Violation: Mandatory declarations on the packaging are illegible, obscured, or lack required statutory prominence.',
          expectedCondition: 'Every mandatory declaration must be completely legible and prominent under Rule 9(1)(a).',
          severity: 'MAJOR',
          sourceImage: sourceImg,
          explanation: 'Rule 9(1)(a) requires that every declaration on the package must be completely legible and prominent. Low-contrast or faded text violates this statutory requirement.'
        };
      }

      if (generalLegibility === 'LOW_CONTRAST') {
        return {
          ruleId: 'LM-011',
          ruleName: 'Colour Contrast & Prominent Legibility',
          requirement: 'Every mandatory declaration on the package must be completely legible and prominent.',
          legalReference: 'Rule 9(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
          status: 'WARNING',
          observedValue: 'General Declarations: Low Contrast',
          issue: 'Rule 9(1)(a) Advisory: Mandatory declarations use low-contrast styling (e.g. light grey on white), creating readability and compliance exposure.',
          expectedCondition: 'Ensure all mandatory label declarations use high-contrast fonts for effortless consumer legibility.',
          severity: 'MODERATE',
          sourceImage: sourceImg,
          explanation: 'According to Rule 9(1)(a), every mandatory declaration on the package must be completely legible and prominent. Low-contrast fonts create major compliance exposure.'
        };
      }

      // 5. Compliant Conspicuous Contrast
      const details = data.contrast_assessment;
      const note = details?.mrpTextColor ? ` (MRP: ${details.mrpTextColor}; Net Qty: ${details.netQuantityTextColor || 'conspicuous'})` : '';

      return {
        ruleId: 'LM-011',
        ruleName: 'Colour Contrast & Prominent Legibility',
        requirement: 'Conspicuous contrast for MRP and Net Quantity numerals; prominent legibility across all declarations.',
        legalReference: 'Rule 9(1)(a) & Rule 9(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
        status: 'PASS',
        observedValue: `Conspicuous Contrast${note}`,
        explanation: 'Numerals for Retail Sale Price (MRP) and Net Quantity contrast conspicuously with the background of the label, and mandatory declarations satisfy statutory prominence and legibility requirements under Rule 9(1)(a) and 9(1)(b).',
        sourceImage: sourceImg
      };
    }
  }
];

