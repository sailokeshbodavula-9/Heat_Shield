/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExposureBasis, RiskClass, RiskResult, Scenario, WardFactors } from '../types/index.ts';
import { scaleValues } from './scaling.ts';

/**
 * Calculates city-wide baseline hazard based on median apparent temperature.
 * L3: hazard_city = clamp((apparent_city - hazard_low_c) / (hazard_high_c - hazard_low_c), 0, 1)
 * L2: If stress_plus_2c, 2.0 °C is added to apparent_temperature.
 */
export function calculateHazardCity(
  apparentCity: number,
  hazardLowC = 32,
  hazardHighC = 46,
  scenario: Scenario = 'live'
): number {
  const adjustedApparent = scenario === 'stress_plus_2c' ? apparentCity + 2.0 : apparentCity;
  const raw = (adjustedApparent - hazardLowC) / (hazardHighC - hazardLowC);
  const clamped = Math.max(0, Math.min(1, raw));
  return Number(clamped.toFixed(4));
}

/**
 * Maps risk score to risk class.
 * L9: severe ≥ 75, high ≥ 55 and < 75, moderate ≥ 35 and < 55, low < 35.
 */
export function calculateRiskClass(score: number): RiskClass {
  if (score >= 75) return 'severe';
  if (score >= 55) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

/**
 * Pure risk score computation.
 * L8: risk_score = 100 · (w_h·H + w_e·E + w_v·V) / (sum of active weights), rounded to 1 decimal.
 */
export function calculateRiskScore(
  H: number,
  E: number | null,
  V: number | null,
  weights = { w_hazard: 0.4, w_exposure: 0.4, w_vulnerability: 0.2 }
): number {
  let activeWeightSum = 0;
  let weightedSum = 0;

  // Hazard is always present
  weightedSum += weights.w_hazard * H;
  activeWeightSum += weights.w_hazard;

  if (E !== null) {
    weightedSum += weights.w_exposure * E;
    activeWeightSum += weights.w_exposure;
  }

  if (V !== null) {
    weightedSum += weights.w_vulnerability * V;
    activeWeightSum += weights.w_vulnerability;
  }

  if (activeWeightSum === 0) return 0;
  const rawScore = (100 * weightedSum) / activeWeightSum;
  return Number(rawScore.toFixed(1));
}

export interface WardRiskInputs {
  ward_id: string;
  apparent_max_c: number;
  factors: WardFactors;
}

/**
 * Computes risk scores across all wards using the multi-factor formula.
 */
export function calculateWardRisks(
  wards: WardRiskInputs[],
  hazardLowC = 32,
  hazardHighC = 46,
  scenario: Scenario = 'live',
  weights = { w_hazard: 0.4, w_exposure: 0.4, w_vulnerability: 0.2 }
): RiskResult[] {
  if (wards.length === 0) return [];

  // Adjust apparent max temps if scenario is stress_plus_2c
  const apparentValues = wards.map((w) =>
    scenario === 'stress_plus_2c' ? w.apparent_max_c + 2.0 : w.apparent_max_c
  );

  // Median apparent temperature across wards
  const sortedApparent = [...apparentValues].sort((a, b) => a - b);
  const mid = Math.floor(sortedApparent.length / 2);
  const apparentCity =
    sortedApparent.length % 2 === 0
      ? (sortedApparent[mid - 1] + sortedApparent[mid]) / 2
      : sortedApparent[mid];

  // Base city hazard
  const hazardCity = calculateHazardCity(apparentCity, hazardLowC, hazardHighC, 'live'); // already adjusted above

  // LST scaling (if any wards have LST)
  const hasLst = wards.some((w) => w.factors.lst_c !== null && w.factors.lst_c !== undefined);
  let lstScaled: number[] = [];
  if (hasLst) {
    const rawLst = wards.map((w) => w.factors.lst_c ?? 35);
    lstScaled = scaleValues(rawLst).scaled;
  }

  // Building density scaling
  const hasBuildings = wards.some(
    (w) => w.factors.building_density_per_km2 !== null && w.factors.building_density_per_km2 !== undefined
  );
  let buildScaled: number[] = [];
  if (hasBuildings) {
    const rawBuild = wards.map((w) => w.factors.building_density_per_km2 ?? 0);
    buildScaled = scaleValues(rawBuild).scaled;
  }

  // Green cover scaling: prefer NDVI if present, else OSM green
  const hasNdvi = wards.some((w) => w.factors.ndvi !== null && w.factors.ndvi !== undefined);
  const hasOsmGreen = wards.some(
    (w) => w.factors.green_cover_osm !== null && w.factors.green_cover_osm !== undefined
  );

  let greenScaled: number[] = [];
  let greenSource: 'ndvi' | 'osm' | 'none' = 'none';

  if (hasNdvi) {
    const rawNdvi = wards.map((w) => w.factors.ndvi ?? 0);
    greenScaled = scaleValues(rawNdvi).scaled;
    greenSource = 'ndvi';
  } else if (hasOsmGreen) {
    const rawOsm = wards.map((w) => w.factors.green_cover_osm ?? 0);
    greenScaled = scaleValues(rawOsm).scaled;
    greenSource = 'osm';
  }

  // Vulnerability: pop density & vulnerable share
  const hasPop = wards.some(
    (w) => w.factors.pop_density !== null && w.factors.pop_density !== undefined
  );
  const hasVuln = wards.some(
    (w) => w.factors.vulnerable_share !== null && w.factors.vulnerable_share !== undefined
  );
  const hasVulnerability = hasPop || hasVuln;

  let popScaled: number[] = [];
  let vulnShareScaled: number[] = [];
  if (hasVulnerability) {
    if (hasPop) {
      popScaled = scaleValues(wards.map((w) => w.factors.pop_density ?? 0)).scaled;
    }
    if (hasVuln) {
      vulnShareScaled = scaleValues(wards.map((w) => w.factors.vulnerable_share ?? 0)).scaled;
    }
  }

  return wards.map((ward, idx) => {
    // 1. Hazard H
    let H = hazardCity;
    if (hasLst && ward.factors.lst_c !== null) {
      H = 0.5 * hazardCity + 0.5 * lstScaled[idx];
    }

    // 2. Exposure E
    let E: number | null = null;
    let exposureBasis: ExposureBasis = 'none';

    const bVal = hasBuildings && ward.factors.building_density_per_km2 !== null ? buildScaled[idx] : null;
    const gVal = greenSource !== 'none' ? greenScaled[idx] : null;

    if (bVal !== null && gVal !== null) {
      E = 0.5 * bVal + 0.5 * (1 - gVal);
      exposureBasis = greenSource === 'ndvi' ? 'ndvi_and_buildings' : 'osm_green_and_buildings';
    } else if (bVal !== null) {
      E = bVal;
      exposureBasis = 'buildings_only';
    } else if (gVal !== null) {
      E = 1 - gVal;
      exposureBasis = 'ndvi_only';
    } else {
      E = null;
      exposureBasis = 'none';
    }

    // 3. Vulnerability V
    let V: number | null = null;
    if (hasVulnerability) {
      const p = hasPop && ward.factors.pop_density !== null ? popScaled[idx] : 0.5;
      const vs = hasVuln && ward.factors.vulnerable_share !== null ? vulnShareScaled[idx] : 0.5;
      V = 0.5 * p + 0.5 * vs;
    }

    const score = calculateRiskScore(H, E, V, weights);
    const riskClass = calculateRiskClass(score);

    // Top factors ranking for hover & drawer
    const factorCandidates: Array<{ name: string; score: number }> = [
      { name: 'Feels-like temperature', score: H },
    ];
    if (bVal !== null) factorCandidates.push({ name: 'Building density', score: bVal });
    if (gVal !== null) factorCandidates.push({ name: 'Lack of tree canopy', score: 1 - gVal });
    if (ward.factors.lst_c !== null) factorCandidates.push({ name: 'Surface heat island', score: lstScaled[idx] });
    if (V !== null) factorCandidates.push({ name: 'Demographic vulnerability', score: V });

    factorCandidates.sort((a, b) => b.score - a.score);
    const top_factors = factorCandidates.slice(0, 3).map((f) => f.name);

    return {
      ward_id: ward.ward_id,
      hazard: Number(H.toFixed(3)),
      exposure: E !== null ? Number(E.toFixed(3)) : null,
      vulnerability: V !== null ? Number(V.toFixed(3)) : null,
      risk_score: score,
      risk_class: riskClass,
      exposure_basis: exposureBasis,
      top_factors,
    };
  });
}
