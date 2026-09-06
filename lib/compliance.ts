import { ExtractedData, RuleResult } from '@/types/inspection';
import { LEGAL_METROLOGY_RULES } from './rules';

export interface ComplianceAssessmentResult {
  ruleResults: RuleResult[];
  complianceScore: number;
  finalStatus: 'PASS' | 'FAIL' | 'WARNING';
  passedCount: number;
  failedCount: number;
  warningCount: number;
  notApplicableCount: number;
  criticalViolationsCount: number;
  recommendedAction: string;
}

const RULE_WEIGHTS: Record<string, number> = {
  'CRITICAL': 20,
  'MAJOR': 15,
  'MODERATE': 10,
  'MINOR': 5
};

export function evaluateLegalMetrologyCompliance(reviewedData: ExtractedData): ComplianceAssessmentResult {
  const ruleResults: RuleResult[] = [];

  let earnedPoints = 0;
  let totalApplicablePoints = 0;

  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;
  let notApplicableCount = 0;
  let criticalViolationsCount = 0;

  for (const rule of LEGAL_METROLOGY_RULES) {
    const result = rule.evaluate(reviewedData);
    ruleResults.push(result);

    if (result.status === 'NOT_APPLICABLE') {
      notApplicableCount++;
      continue;
    }

    const weight = RULE_WEIGHTS[rule.severity] || 10;
    totalApplicablePoints += weight;

    if (result.status === 'PASS') {
      passedCount++;
      earnedPoints += weight;
    } else if (result.status === 'WARNING') {
      warningCount++;
      earnedPoints += weight * 0.5; // partial credit for warnings
    } else if (result.status === 'FAIL') {
      failedCount++;
      if (rule.severity === 'CRITICAL' || rule.severity === 'MAJOR') {
        criticalViolationsCount++;
      }
    }
  }

  // Calculate deterministic score 0-100
  const complianceScore = totalApplicablePoints > 0
    ? Math.round((earnedPoints / totalApplicablePoints) * 100)
    : 0;

  // Final status determination
  let finalStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';

  if (failedCount > 0 || criticalViolationsCount > 0 || complianceScore < 80) {
    finalStatus = 'FAIL';
  } else if (warningCount > 0 || complianceScore < 95) {
    finalStatus = 'WARNING';
  } else {
    finalStatus = 'PASS';
  }

  // Recommended Corrective Action
  let recommendedAction = '';
  if (finalStatus === 'FAIL') {
    const failRules = ruleResults.filter(r => r.status === 'FAIL');
    const requirements = failRules.map(r => r.ruleName).join('; ');
    recommendedAction = `Rectify non-compliant packaging declarations before distribution: [${requirements}]. Issue Non-Compliance Notice under Legal Metrology (Packaged Commodities) Rules, 2011.`;
  } else if (finalStatus === 'WARNING') {
    recommendedAction = 'Minor advisory: ensure complete address formatting and dual contact channels (email and helpline) on subsequent packaging batches.';
  } else {
    recommendedAction = 'Packaging declarations fully satisfy evaluated Legal Metrology (Packaged Commodities) Rules, 2011. Fit for compliance certification.';
  }

  return {
    ruleResults,
    complianceScore,
    finalStatus,
    passedCount,
    failedCount,
    warningCount,
    notApplicableCount,
    criticalViolationsCount,
    recommendedAction
  };
}
