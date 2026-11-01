/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CityAiRecommendation, CityEnsoProfile } from '../types/index.ts';

export interface RecommendationParams {
  cityName: string;
  latitude: number;
  longitude: number;
  peakApparentC: number;
  severeCount: number;
  totalWards: number;
  scenario: 'live' | 'stress_plus_2c';
  elninoProfile: CityEnsoProfile;
  topWards: Array<{
    name: string;
    riskScore: number;
    riskClass: string;
    buildingDensity?: number | null;
    greenCover?: number | null;
  }>;
  gridDemand?: {
    peak_mw: number;
    stressWindow: string;
  } | null;
  coolingSitesCount: number;
}

/**
 * Fetches AI-generated urban heat and El Niño recommendations from the server-side
 * Gemini API endpoint, with robust deterministic fallback tailored to each city.
 */
export async function fetchCityAiRecommendations(
  params: RecommendationParams
): Promise<CityAiRecommendation> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 22000);

    const res = await fetch('/api/agent/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.recommendation) {
        return {
          cityName: params.cityName,
          generatedAt: new Date().toISOString(),
          mode: data.mode === 'llm' ? 'llm' : 'deterministic',
          executiveSummary: data.recommendation.executiveSummary || `Actionable heat resilience directives for ${params.cityName}.`,
          elninoSpecificDirectives: data.recommendation.elninoSpecificDirectives || [],
          problemSolvers: data.recommendation.problemSolvers || [],
          priorityActions24to48h: data.recommendation.priorityActions24to48h || [],
        };
      }
    }
  } catch (err: any) {
    console.warn('AI recommendations client fetch fallback:', err?.message);
  }

  // Fallback: High-fidelity deterministic city recommendations
  return generateDeterministicCityRecommendations(params);
}

/**
 * Deterministic domain-specific expert recommendation generator for Indian urban local bodies.
 */
export function generateDeterministicCityRecommendations(
  params: RecommendationParams
): CityAiRecommendation {
  const { cityName, peakApparentC, severeCount, totalWards, scenario, elninoProfile, topWards, gridDemand, coolingSitesCount } = params;

  const topWardNames = topWards.slice(0, 3).map((w) => w.name);
  const wardListStr = topWardNames.length > 0 ? topWardNames.join(', ') : `${cityName} core sectors`;
  const isElNino = scenario === 'stress_plus_2c';

  return {
    cityName,
    generatedAt: new Date().toISOString(),
    mode: 'deterministic',
    executiveSummary: isElNino
      ? `${cityName} Municipal Administration must activate Stage-2 Heat Emergency protocols as NOAA Niño-3.4 (+${elninoProfile.nino34_index}°C) accelerates a projected +${elninoProfile.cityProjectedSurgeC}°C continental surge, putting ${severeCount} of ${totalWards} sectors under severe thermal stress.`
      : `${cityName} Municipal Administration must activate Stage-1 Live Urban Heat Response protocols. Current weather monitoring indicates peak feels-like temperatures reaching ${peakApparentC.toFixed(1)}°C with ${severeCount} of ${totalWards} sectors facing severe multi-factor thermal risk.`,
    elninoSpecificDirectives: isElNino
      ? [
          {
            title: `Mitigate +${elninoProfile.cityProjectedSurgeC}°C El Niño Surge in ${elninoProfile.regionalZone}`,
            description: `Execute thermal buffer protocols across ${cityName}: activate roadside high-pressure misting along arterial corridors and mandate reflective cool-roof coatings on all civic flat roofs before pre-monsoon heat peaks.`,
            timeframe: 'Immediate (0-24 Hours)',
            impact: `Reduces localized urban surface temperature by up to 2.5°C in dense micro-clusters.`,
          },
          {
            title: `Counteract ${elninoProfile.drySpellProbabilityPct}% Dry Spell Risk & Groundwater Depletion`,
            description: `With El Niño suppressing seasonal precipitation, pre-allocate dedicated municipal water tanker corridors for vulnerable slum settlements in ${wardListStr}. Ration non-essential commercial water extraction.`,
            timeframe: 'Next 48 Hours',
            impact: `Secures baseline 20 liters/person/day emergency hydration quota for at-risk populations.`,
          },
          {
            title: 'Delayed Monsoon Contingency & Heat-Health Action Extension',
            description: `Extend operational readiness of public cooling centers through ${elninoProfile.monsoonDelayRisk}. Ensure hospital emergency wards maintain 20% reserved capacity for heat exhaustion triage.`,
            timeframe: '7-14 Day Horizon',
            impact: 'Prevents acute medical system congestion during peak heat-wave mortality windows.',
          },
        ]
      : [
          {
            title: `Rapid Urban Heat Island Mitigation in ${elninoProfile.regionalZone}`,
            description: `Execute active thermal buffering across ${cityName}: deploy municipal misting cannons along arterial corridors and schedule reflective white-wash coating on low-income tin roofs in ${wardListStr}.`,
            timeframe: 'Immediate (0-24 Hours)',
            impact: `Reduces localized surface temperatures by up to 2.0°C in high-exposure wards.`,
          },
          {
            title: `Urban Hydration & Public Transit Protection`,
            description: `Establish dedicated municipal drinking water kiosks ('Pyaaos') and distribute oral rehydration salts (ORS) across major bus and metro stations serving ${wardListStr}.`,
            timeframe: 'Next 24 Hours',
            impact: `Guarantees emergency hydration access for transit commuters and daily-wage laborers.`,
          },
          {
            title: `Public Cooling Refuge Activation (${coolingSitesCount} Facilities)`,
            description: `Open and signpost ${coolingSitesCount} air-cooled public libraries, community halls, and civic facilities as walk-in heat shelters between 10:00 AM and 6:00 PM.`,
            timeframe: 'Immediate Operational',
            impact: `Provides life-saving thermal relief to over 15,000 vulnerable individuals daily.`,
          },
        ],
    problemSolvers: [
      {
        problem: `High Thermal Concentration in Dense Urban Wards (${wardListStr})`,
        solution: `Deploy mobile water misting tankers and install temporary shade canopies at high-density transit nodes and open marketplaces in ${wardListStr}.`,
        targetWardsOrSectors: topWardNames.length > 0 ? topWardNames : [`${cityName} Central`, `${cityName} Market Hub`],
        leadDepartment: 'Municipal Corporation (Disaster Management Cell)',
      },
      {
        problem: `Grid Cooling Stress Window (${gridDemand ? `${gridDemand.stressWindow} @ ${gridDemand.peak_mw} MW` : '14:00 - 17:00 Peak Demand'})`,
        solution: `Issue voluntary load-shifting advisories to heavy industrial units, tech parks, and commercial complexes to pre-cool facilities before 13:00 and shift non-essential pumping to 21:00-05:00.`,
        targetWardsOrSectors: ['Industrial Estates', 'Commercial Centers', 'Tech Corridors'],
        leadDepartment: 'State Electricity Supply Company (DISCOM)',
      },
      {
        problem: 'Extreme Exposure of Outdoor Laborers & Informal Commuters',
        solution: `Strictly enforce mandatory work stoppage between 12:00 PM and 4:00 PM for construction and sanitation workers under State Heatwave Directives. Set up 25 free Oral Rehydration Solution (ORS) booths at bus stands.`,
        targetWardsOrSectors: ['Construction Zones', 'Railway Stations', 'Bus Termini'],
        leadDepartment: 'Labour Welfare Commissioner & Transport Corporation',
      },
      {
        problem: `Under-Utilized Public Cooling Infrastructure (${coolingSitesCount} Candidate Sites)`,
        solution: `Formally designate and signpost public libraries, community halls, and air-cooled government schools as walk-in cooling refuges equipped with drinking water and basic first aid.`,
        targetWardsOrSectors: ['Public Libraries', 'Community Halls', 'Civic Schools'],
        leadDepartment: 'Department of Public Instruction & Social Welfare',
      },
    ],
    priorityActions24to48h: isElNino
      ? [
          `Issue official Heat Alert to all ward engineers in ${cityName} highlighting the +${elninoProfile.cityProjectedSurgeC}°C El Niño surge.`,
          `Inspect and activate ${coolingSitesCount} candidate cooling facilities with guaranteed uninterrupted power backup.`,
          `Mandate suspension of hazardous outdoor physical labor between 12:00 PM and 4:00 PM across all infrastructure sites.`,
          `Coordinate with DISCOM to schedule transformer oil-cooling flushes in high-load commercial substations.`,
          `Dispatch mobile health vans equipped with IV fluids, cold packs, and ORS to ${wardListStr}.`,
        ]
      : [
          `Issue immediate municipal heat health advisory across ${cityName} for current ${peakApparentC.toFixed(1)}°C feels-like conditions.`,
          `Activate ${coolingSitesCount} designated public cooling centers with drinking water and air cooling from 10:00 AM to 6:00 PM.`,
          `Enforce mandatory outdoor work rest periods between 12:00 PM and 4:00 PM for construction and civic workers.`,
          `Deploy mobile drinking water tankers and ORS distribution points to transit hubs in ${wardListStr}.`,
          `Alert emergency medical centers and PHCs to ready dedicated heat-stroke beds and IV hydration supplies.`,
        ],
  };
}
