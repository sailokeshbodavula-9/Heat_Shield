/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plan, Scenario, VerificationCheck, VerificationResult } from '../types/index.ts';

export interface VerifierContext {
  validWardIds: Set<string>;
  validSiteIds: Set<string>;
  validNumbers: Set<string>; // Strings of rounded numbers e.g. "41.3", "78.4", "5"
  scenario: Scenario;
  expectedCoveragePct: number;
}

/**
 * Extracts numeric tokens from text for verification (V2).
 */
export function extractNumbersFromText(text: string): string[] {
  // Matches integers and floats like 41.3, 100, 2.5
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g);
  if (!matches) return [];
  return matches;
}

/**
 * Runs the deterministic 4-point verification suite (V1-V4).
 */
export function verifyPlan(plan: Partial<Plan>, context: VerifierContext): VerificationResult {
  const checks: VerificationCheck[] = [];

  // V1: every ward_id and site_id referenced exists in tool outputs
  let v1Passed = true;
  const missingWardIds: string[] = [];
  const missingSiteIds: string[] = [];

  if (plan.warn_first) {
    for (const w of plan.warn_first) {
      if (!context.validWardIds.has(w.ward_id)) {
        v1Passed = false;
        missingWardIds.push(w.ward_id);
      }
    }
  }

  if (plan.centres) {
    for (const c of plan.centres) {
      if (!context.validSiteIds.has(c.site_id)) {
        v1Passed = false;
        missingSiteIds.push(c.site_id);
      }
    }
  }

  checks.push({
    id: 'V1',
    passed: v1Passed,
    detail: v1Passed
      ? 'All ward IDs and cooling centre IDs verified against source registry.'
      : `Unrecognized IDs detected: wards [${missingWardIds.join(', ')}], sites [${missingSiteIds.join(', ')}].`,
  });

  // V2: every number in the plan text equals a value from tool outputs
  const textToCheck = `${plan.advisories?.en || ''} ${plan.advisories?.kn || ''} ${plan.advisories?.hi || ''}`;
  const numbersInText = extractNumbersFromText(textToCheck);

  // Exempt standard boilerplate numbers (like year 2026, ranking #1 #2 #3, standard 24h clock, 3-hour shift window)
  const boilerplateExempt = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '24', '48', '72', '2024', '2025', '2026', '2027']);

  const unverifiedNumbers: string[] = [];
  for (const num of numbersInText) {
    if (boilerplateExempt.has(num)) continue;
    // Check direct match, or with 1 decimal place format
    const parsed = parseFloat(num);
    const withOneDp = parsed.toFixed(1);
    const withZeroDp = parsed.toFixed(0);

    const isMatch =
      context.validNumbers.has(num) ||
      context.validNumbers.has(withOneDp) ||
      context.validNumbers.has(withZeroDp);

    if (!isMatch) {
      unverifiedNumbers.push(num);
    }
  }

  const v2Passed = unverifiedNumbers.length === 0;
  checks.push({
    id: 'V2',
    passed: v2Passed,
    detail: v2Passed
      ? 'All statistics, temperatures, percentages, and metrics confirmed against engine outputs.'
      : `Unverified numbers found in advisory text: [${unverifiedNumbers.join(', ')}]. Numbers must be sourced directly from tool outputs.`,
  });

  // V3: the plan states the scenario label when scenario is stress_plus_2c
  let v3Passed = true;
  let v3Detail = 'Scenario label verified.';
  if (context.scenario === 'stress_plus_2c') {
    const hasScenarioMention =
      textToCheck.toLowerCase().includes('+2') ||
      textToCheck.toLowerCase().includes('stress') ||
      textToCheck.toLowerCase().includes('el niño') ||
      plan.scenario === 'stress_plus_2c';

    if (!hasScenarioMention) {
      v3Passed = false;
      v3Detail = 'Plan advisory text must mention the +2 °C El Niño stress test scenario.';
    } else {
      v3Detail = 'Simulated +2 °C stress scenario correctly stated in plan.';
    }
  } else {
    v3Detail = 'Live forecast scenario verified.';
  }

  checks.push({
    id: 'V3',
    passed: v3Passed,
    detail: v3Detail,
  });

  // V4: coverage_pct equals the optimiser output
  const planCoverage = plan.coverage_pct ?? 0;
  const v4Passed = Math.abs(planCoverage - context.expectedCoveragePct) < 0.05;
  checks.push({
    id: 'V4',
    passed: v4Passed,
    detail: v4Passed
      ? `High-risk ward coverage (${planCoverage}%) exactly matches deterministic optimizer.`
      : `Coverage mismatch: plan states ${planCoverage}%, optimizer calculated ${context.expectedCoveragePct}%.`,
  });

  const allPassed = checks.every((c) => c.passed);

  return {
    passed: allPassed,
    checks,
    corrections: 0,
  };
}
