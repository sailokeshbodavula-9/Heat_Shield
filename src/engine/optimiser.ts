/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CentrePlacement, Site } from '../types/index.ts';
import { haversineDistanceKm } from './haversine.ts';

export interface DemandPoint {
  id: string;
  lat: number;
  lon: number;
  weight: number;
}

export interface OptimiserResult {
  centres: CentrePlacement[];
  coverage_pct: number;
  uncovered_high_risk_ward_ids: string[];
  message: string | null;
}

/**
 * Deterministic greedy maximal coverage cooling-center optimizer (L13 & T5).
 */
export function optimiseCentres(
  points: DemandPoint[],
  candidateSites: Site[],
  k: number,
  radiusKm: number
): OptimiserResult {
  // If no high or severe demand points
  if (points.length === 0) {
    return {
      centres: [],
      coverage_pct: 0,
      uncovered_high_risk_ward_ids: [],
      message: 'No high or severe risk wards for this day',
    };
  }

  const totalWeight = points.reduce((acc, p) => acc + p.weight, 0);
  if (totalWeight <= 0) {
    return {
      centres: [],
      coverage_pct: 0,
      uncovered_high_risk_ward_ids: points.map((p) => p.id),
      message: 'No positive risk weight in high or severe risk wards',
    };
  }

  const coveredPointIds = new Set<string>();
  const selectedCentres: CentrePlacement[] = [];
  const availableSites = [...candidateSites];

  let currentCoveredWeight = 0;

  for (let step = 0; step < k; step++) {
    if (availableSites.length === 0) break;

    let bestSiteIndex = -1;
    let bestGainWeight = 0;
    let bestCoverablePointIds: string[] = [];

    for (let sIdx = 0; sIdx < availableSites.length; sIdx++) {
      const site = availableSites[sIdx];
      let gainWeight = 0;
      const newlyCoveredForThisSite: string[] = [];

      for (const p of points) {
        if (!coveredPointIds.has(p.id)) {
          const dist = haversineDistanceKm(site.lat, site.lon, p.lat, p.lon);
          if (dist <= radiusKm) {
            gainWeight += p.weight;
            newlyCoveredForThisSite.push(p.id);
          }
        }
      }

      // Check if this site beats current best
      if (gainWeight > bestGainWeight) {
        bestGainWeight = gainWeight;
        bestSiteIndex = sIdx;
        bestCoverablePointIds = newlyCoveredForThisSite;
      } else if (gainWeight === bestGainWeight && gainWeight > 0 && bestSiteIndex !== -1) {
        // Tie-breaker: lower site_id in string order
        if (site.site_id < availableSites[bestSiteIndex].site_id) {
          bestSiteIndex = sIdx;
          bestCoverablePointIds = newlyCoveredForThisSite;
        }
      }
    }

    // Stop early if best gain is 0
    if (bestSiteIndex === -1 || bestGainWeight === 0) {
      break;
    }

    const chosenSite = availableSites[bestSiteIndex];
    // Record covered points
    for (const pId of bestCoverablePointIds) {
      coveredPointIds.add(pId);
    }
    currentCoveredWeight += bestGainWeight;

    const newlyCoveredPct = Number(((bestGainWeight / totalWeight) * 100).toFixed(1));

    selectedCentres.push({
      site_id: chosenSite.site_id,
      name: chosenSite.name,
      type: chosenSite.type,
      lat: chosenSite.lat,
      lon: chosenSite.lon,
      newly_covered_pct: newlyCoveredPct,
    });

    // Remove chosen site from candidate list
    availableSites.splice(bestSiteIndex, 1);
  }

  const coverage_pct = Number(((currentCoveredWeight / totalWeight) * 100).toFixed(1));
  const uncovered_high_risk_ward_ids = points
    .filter((p) => !coveredPointIds.has(p.id))
    .map((p) => p.id);

  return {
    centres: selectedCentres,
    coverage_pct,
    uncovered_high_risk_ward_ids,
    message: null,
  };
}
