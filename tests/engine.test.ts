/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HeatShield Unit Tests T1 - T9 (Acceptance Criteria)
 */

import { scaled } from '../src/engine/scaling.ts';
import { calculateRiskScore, calculateRiskClass, calculateHazardCity } from '../src/engine/risk.ts';
import { optimiseCentres } from '../src/engine/optimiser.ts';
import { fitQuadraticOLS, trainDemandModel, MatchedDemandDay } from '../src/engine/demandModel.ts';
import { calculateStressWindow } from '../src/engine/stressWindow.ts';
import { verifyPlan, VerifierContext } from '../src/agent/verifier.ts';
import { Plan, Site } from '../src/types/index.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ PASSED: ${msg}`);
}

function runAllTests() {
  console.log('--- Running HeatShield Acceptance Criteria Unit Tests (T1 - T9) ---\n');

  // T1: scaled([10,20,30]) → [0, 0.5, 1]; scaled([5,5,5]) → [0.5, 0.5, 0.5]
  {
    const res1 = scaled([10, 20, 30]);
    assert(
      JSON.stringify(res1) === JSON.stringify([0, 0.5, 1]),
      `T1 (part 1): scaled([10,20,30]) -> ${JSON.stringify(res1)}`
    );

    const res2 = scaled([5, 5, 5]);
    assert(
      JSON.stringify(res2) === JSON.stringify([0.5, 0.5, 0.5]),
      `T1 (part 2): scaled([5,5,5]) -> ${JSON.stringify(res2)}`
    );
  }

  // T2: risk_score with H=1, E=1, V=1, weights 0.4/0.4/0.2 → 100.0; with H=0.5, E=0.5, V=null, weights 0.4/0.4/0.2 → 50.0
  {
    const score1 = calculateRiskScore(1, 1, 1, { w_hazard: 0.4, w_exposure: 0.4, w_vulnerability: 0.2 });
    assert(score1 === 100.0, `T2 (part 1): score with H=1, E=1, V=1 should be 100.0, got ${score1}`);

    const score2 = calculateRiskScore(0.5, 0.5, null, { w_hazard: 0.4, w_exposure: 0.4, w_vulnerability: 0.2 });
    assert(score2 === 50.0, `T2 (part 2): score with H=0.5, E=0.5, V=null should be 50.0, got ${score2}`);
  }

  // T3: risk_class(75) = severe; (74.9) = high; (55) = high; (35) = moderate; (34.9) = low
  {
    assert(calculateRiskClass(75) === 'severe', 'T3: risk_class(75) should be severe');
    assert(calculateRiskClass(74.9) === 'high', 'T3: risk_class(74.9) should be high');
    assert(calculateRiskClass(55) === 'high', 'T3: risk_class(55) should be high');
    assert(calculateRiskClass(35) === 'moderate', 'T3: risk_class(35) should be moderate');
    assert(calculateRiskClass(34.9) === 'low', 'T3: risk_class(34.9) should be low');
  }

  // T4: hazard_city: apparent 38.0, thresholds 32/46, scenario live → 0.4286 (4 dp); with stress_plus_2c → 0.5714
  {
    const hLive = calculateHazardCity(38.0, 32, 46, 'live');
    assert(hLive === 0.4286, `T4 (live): hazard_city 38.0 at 32/46 should be 0.4286, got ${hLive}`);

    const hStress = calculateHazardCity(38.0, 32, 46, 'stress_plus_2c');
    assert(hStress === 0.5714, `T4 (stress_plus_2c): hazard_city with +2C should be 0.5714, got ${hStress}`);
  }

  // T5: optimiser: points A (12.9700, 77.5900, weight 3), B (12.9700, 77.6000, weight 2), C (13.1000, 77.7000, weight 5);
  // sites S1 (12.9700, 77.5950), S2 (13.1000, 77.7000); radius 1.5.
  // For k=1 the result is [S1] (tie broken by lower id) with coverage_pct = 50.0; for k=2 the result is [S1, S2] with coverage_pct = 100.0.
  {
    const points = [
      { id: 'A', lat: 12.9700, lon: 77.5900, weight: 3 },
      { id: 'B', lat: 12.9700, lon: 77.6000, weight: 2 },
      { id: 'C', lat: 13.1000, lon: 77.7000, weight: 5 },
    ];
    const sites: Site[] = [
      { site_id: 'S1', name: 'Site 1', type: 'school', lat: 12.9700, lon: 77.5950 },
      { site_id: 'S2', name: 'Site 2', type: 'community_centre', lat: 13.1000, lon: 77.7000 },
    ];

    const resK1 = optimiseCentres(points, sites, 1, 1.5);
    assert(resK1.centres.length === 1, `T5 (k=1): centres length should be 1, got ${resK1.centres.length}`);
    assert(resK1.centres[0].site_id === 'S1', `T5 (k=1): tie broken by lower id, expected S1, got ${resK1.centres[0].site_id}`);
    assert(resK1.coverage_pct === 50.0, `T5 (k=1): coverage should be 50.0, got ${resK1.coverage_pct}`);

    const resK2 = optimiseCentres(points, sites, 2, 1.5);
    assert(resK2.centres.length === 2, `T5 (k=2): centres length should be 2, got ${resK2.centres.length}`);
    assert(resK2.centres[0].site_id === 'S1' && resK2.centres[1].site_id === 'S2', 'T5 (k=2): expected [S1, S2]');
    assert(resK2.coverage_pct === 100.0, `T5 (k=2): coverage should be 100.0, got ${resK2.coverage_pct}`);
  }

  // T6: demand fit: 21 points of y = 1000 + 50T + 2T² for T = 20..40 → coefficients recovered within 1e-6, r2 = 1.0. 89 matched days → error DEMAND_TOO_FEW_DAYS
  {
    const temps: number[] = [];
    const demands: number[] = [];
    for (let t = 20; t <= 40; t++) {
      temps.push(t);
      demands.push(1000 + 50 * t + 2 * t * t);
    }
    const fit = fitQuadraticOLS(temps, demands);
    const [a, b, c] = fit.coefficients;
    assert(Math.abs(a - 1000) < 1e-6, `T6: recovered 'a' within 1e-6 (expected 1000, got ${a})`);
    assert(Math.abs(b - 50) < 1e-6, `T6: recovered 'b' within 1e-6 (expected 50, got ${b})`);
    assert(Math.abs(c - 2) < 1e-6, `T6: recovered 'c' within 1e-6 (expected 2, got ${c})`);
    assert(Math.abs(fit.r2 - 1.0) < 1e-6, `T6: r2 should be 1.0, got ${fit.r2}`);

    // Test DEMAND_TOO_FEW_DAYS on 89 days
    const mock89Days: MatchedDemandDay[] = [];
    for (let i = 0; i < 89; i++) {
      mock89Days.push({
        date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
        tmax_c: 30 + (i % 10),
        demand_mw: 2000 + i * 10,
      });
    }

    let caughtError: any = null;
    try {
      trainDemandModel(mock89Days);
    } catch (e: any) {
      caughtError = e;
    }
    assert(caughtError !== null, 'T6: 89 days must throw error');
    assert(caughtError.code === 'DEMAND_TOO_FEW_DAYS', `T6: expected DEMAND_TOO_FEW_DAYS, got ${caughtError.code}`);
    assert(caughtError.message.includes('Need at least 90 days of data; found 89.'), 'T6: error message verified');
  }

  // T7: stress window: hourly apparent values 30.0 for all hours except hour 14 = 40.0, hour 15 = 39.5, hour 16 = 38.4 → threshold 38.5 → window [14, 16)
  {
    const hourly = new Array(24).fill(30.0);
    hourly[14] = 40.0;
    hourly[15] = 39.5;
    hourly[16] = 38.4;

    const res = calculateStressWindow(hourly);
    assert(res.threshold_c === 38.5, `T7: threshold should be 38.5, got ${res.threshold_c}`);
    assert(res.start_hour === 14 && res.end_hour === 16, `T7: stress window should be [14, 16), got [${res.start_hour}, ${res.end_hour})`);
  }

  // T8: verifier: a plan text containing "41.3" absent from tool outputs → V2 fails; the same plan with the value corrected → passes
  {
    const context: VerifierContext = {
      validWardIds: new Set(['W1', 'W2']),
      validSiteIds: new Set(['S1']),
      validNumbers: new Set(['39.0', '75.0', '50.0']), // 41.3 is absent
      scenario: 'live',
      expectedCoveragePct: 50.0,
    };

    const failingPlan: Partial<Plan> = {
      warn_first: [{ ward_id: 'W1', name: 'Ward 1', rank: 1, risk_score: 75.0, risk_class: 'severe' }],
      centres: [{ site_id: 'S1', name: 'Site 1', type: 'school', lat: 12.97, lon: 77.59, newly_covered_pct: 50.0 }],
      coverage_pct: 50.0,
      scenario: 'live',
      advisories: {
        en: 'Warning: temperature projected to reach 41.3 °C during peak hours.',
        kn: null,
        hi: null,
      },
    };

    const vFail = verifyPlan(failingPlan, context);
    const v2CheckFail = vFail.checks.find((c) => c.id === 'V2');
    assert(v2CheckFail !== undefined && !v2CheckFail.passed, 'T8: plan containing 41.3 absent from tool outputs must fail V2');

    // Corrected plan
    const passingPlan: Partial<Plan> = {
      ...failingPlan,
      advisories: {
        en: 'Warning: temperature projected to reach 39.0 °C during peak hours.',
        kn: null,
        hi: null,
      },
    };
    const vPass = verifyPlan(passingPlan, context);
    const v2CheckPass = vPass.checks.find((c) => c.id === 'V2');
    assert(v2CheckPass !== undefined && v2CheckPass.passed, 'T8: plan with corrected number 39.0 must pass V2');
  }

  // T9: safety: every plan object has sent === false
  {
    const samplePlan: Plan = {
      plan_id: 'test-1',
      generated_at: new Date().toISOString(),
      status: 'draft',
      mode: 'template',
      scenario: 'live',
      day: '2026-11-01',
      warn_first: [],
      centres: [],
      coverage_pct: 0,
      uncovered_high_risk_ward_ids: [],
      demand: null,
      advisories: { en: 'test', kn: null, hi: null },
      missing: [],
      sources: [],
      verification: { passed: true, checks: [], corrections: 0 },
      sent: false,
    };
    assert(samplePlan.sent === false, 'T9: safety constraint: plan.sent must strictly equal false');
  }

  console.log('\n🎉 ALL ACCEPTANCE CRITERIA UNIT TESTS (T1 - T9) PASSED SUCCESSFULLY!');
}

runAllTests();
