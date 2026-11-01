/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DemandForecastResult,
  Plan,
  RiskResult,
  Scenario,
  Site,
  Ward,
} from '../types/index.ts';
import { calculateWardRisks } from '../engine/risk.ts';
import { DemandPoint, optimiseCentres } from '../engine/optimiser.ts';
import { WeatherResult } from '../services/weather.ts';

export interface ToolContext {
  wards: Ward[];
  weather: WeatherResult;
  candidateSites: Site[];
  buildingFactors: Map<string, any>;
  satelliteLST: Map<string, number>;
  satelliteNDVI: Map<string, number>;
  demandForecast: DemandForecastResult | null;
  scenario: Scenario;
  k: number;
  radiusKm: number;
  weights: { w_hazard: number; w_exposure: number; w_vulnerability: number };
  hazard_low_c: number;
  hazard_high_c: number;
  selectedDay: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>, context: ToolContext) => Promise<{ result: any; summary: string }>;
}

/**
 * 1. get_forecast: retrieves weather forecast for the selected day
 */
const getForecastTool: ToolDefinition = {
  name: 'get_forecast',
  description: 'Retrieves 7-day temperature and feels-like humidity forecast for all city wards.',
  parameters: {
    type: 'object',
    properties: {
      day: { type: 'string', description: 'ISO date YYYY-MM-DD to inspect' },
    },
    required: ['day'],
  },
  execute: async (args, context) => {
    const day = args.day || context.selectedDay;
    const apparentTemps: number[] = [];

    context.wards.forEach((w) => {
      const days = context.weather.daily.get(w.ward_id) || [];
      const match = days.find((d) => d.date === day);
      if (match) {
        apparentTemps.push(
          context.scenario === 'stress_plus_2c' ? match.apparent_max_c + 2.0 : match.apparent_max_c
        );
      }
    });

    const maxApparent = apparentTemps.length > 0 ? Math.max(...apparentTemps) : 38.5;
    const medianApparent =
      apparentTemps.length > 0
        ? apparentTemps.sort((a, b) => a - b)[Math.floor(apparentTemps.length / 2)]
        : 37.0;

    return {
      result: {
        day,
        scenario: context.scenario,
        ward_count: context.wards.length,
        max_apparent_c: Number(maxApparent.toFixed(1)),
        median_apparent_c: Number(medianApparent.toFixed(1)),
      },
      summary: `Forecast for ${day} (${context.scenario}): Peak feels-like ${maxApparent.toFixed(1)}°C, Median ${medianApparent.toFixed(1)}°C across ${context.wards.length} wards.`,
    };
  },
};

/**
 * 2. get_ward_risks: calculates multi-factor heat risk score (0-100) per ward
 */
const getWardRisksTool: ToolDefinition = {
  name: 'get_ward_risks',
  description: 'Calculates multi-factor heat risk scores (0-100) and risk classes for all wards.',
  parameters: {
    type: 'object',
    properties: {
      day: { type: 'string', description: 'Selected date for risk analysis' },
    },
    required: ['day'],
  },
  execute: async (args, context) => {
    const day = args.day || context.selectedDay;

    const riskInputs = context.wards.map((w) => {
      const days = context.weather.daily.get(w.ward_id) || [];
      const match = days.find((d) => d.date === day);
      const app = match ? match.apparent_max_c : 38.0;

      const bf = context.buildingFactors.get(w.ward_id);
      const lst = context.satelliteLST.get(w.ward_id) ?? null;
      const ndvi = context.satelliteNDVI.get(w.ward_id) ?? null;

      return {
        ward_id: w.ward_id,
        apparent_max_c: app,
        factors: {
          ward_id: w.ward_id,
          lst_c: lst,
          lst_scene_date: null,
          ndvi,
          green_cover_osm: bf?.green_cover_osm ?? 0.2,
          building_density_per_km2: bf?.building_density_per_km2 ?? 350,
          pop_density: null,
          vulnerable_share: null,
        },
      };
    });

    const risks = calculateWardRisks(
      riskInputs,
      context.hazard_low_c,
      context.hazard_high_c,
      context.scenario,
      context.weights
    );

    const severeCount = risks.filter((r) => r.risk_class === 'severe').length;
    const highCount = risks.filter((r) => r.risk_class === 'high').length;
    const avgScore = Number(
      (risks.reduce((acc, r) => acc + r.risk_score, 0) / Math.max(1, risks.length)).toFixed(1)
    );

    return {
      result: {
        risks,
        severeCount,
        highCount,
        avgScore,
      },
      summary: `Risk calculated for ${risks.length} wards: ${severeCount} severe, ${highCount} high risk wards. Average score: ${avgScore}.`,
    };
  },
};

/**
 * 3. forecast_demand: retrieves electricity demand forecast and stress/shift window
 */
const forecastDemandTool: ToolDefinition = {
  name: 'forecast_demand',
  description: 'Retrieves electricity grid demand peak and recommended load shift window.',
  parameters: {
    type: 'object',
    properties: {
      day: { type: 'string', description: 'Selected day' },
    },
    required: ['day'],
  },
  execute: async (args, context) => {
    if (!context.demandForecast) {
      return {
        result: null,
        summary: 'No official demand history uploaded. City/state level demand forecast omitted.',
      };
    }

    const df = context.demandForecast;
    return {
      result: df,
      summary: `Peak demand projected at ${df.peak_mw} MW (±1.96σ: ${df.interval_mw[0]} - ${df.interval_mw[1]} MW). Stress window: ${df.stress_window.start_hour}:00-${df.stress_window.end_hour}:00. Shift window: ${df.shift_window.start_hour}:00-${df.shift_window.end_hour}:00.`,
    };
  },
};

/**
 * 4. find_candidate_sites: retrieves candidate cooling centres from OpenStreetMap
 */
const findCandidateSitesTool: ToolDefinition = {
  name: 'find_candidate_sites',
  description: 'Finds verified public cooling candidate sites (schools, libraries, community centres) from OpenStreetMap.',
  parameters: {
    type: 'object',
    properties: {
      max_results: { type: 'number', description: 'Maximum candidate sites to return' },
    },
  },
  execute: async (_args, context) => {
    return {
      result: context.candidateSites,
      summary: `Found ${context.candidateSites.length} candidate public sites in OpenStreetMap registry.`,
    };
  },
};

/**
 * 5. optimise_centres: runs deterministic greedy maximal coverage optimizer
 */
const optimiseCentresTool: ToolDefinition = {
  name: 'optimise_centres',
  description: 'Runs deterministic greedy maximal coverage to locate best k cooling centres covering high-risk wards.',
  parameters: {
    type: 'object',
    properties: {
      k: { type: 'number', description: 'Number of cooling centres to activate (1-20)' },
      radius_km: { type: 'number', description: 'Walking service radius in km' },
    },
    required: ['k', 'radius_km'],
  },
  execute: async (args, context) => {
    const k = args.k ?? context.k;
    const radius = args.radius_km ?? context.radiusKm;

    // Calculate risks to find high & severe wards
    const riskInputs = context.wards.map((w) => {
      const days = context.weather.daily.get(w.ward_id) || [];
      const match = days.find((d) => d.date === context.selectedDay);
      return {
        ward_id: w.ward_id,
        apparent_max_c: match ? match.apparent_max_c : 38.0,
        factors: {
          ward_id: w.ward_id,
          lst_c: context.satelliteLST.get(w.ward_id) ?? null,
          lst_scene_date: null,
          ndvi: context.satelliteNDVI.get(w.ward_id) ?? null,
          green_cover_osm: context.buildingFactors.get(w.ward_id)?.green_cover_osm ?? 0.2,
          building_density_per_km2: context.buildingFactors.get(w.ward_id)?.building_density_per_km2 ?? 350,
          pop_density: null,
          vulnerable_share: null,
        },
      };
    });

    const risks = calculateWardRisks(
      riskInputs,
      context.hazard_low_c,
      context.hazard_high_c,
      context.scenario,
      context.weights
    );

    const highOrSevereWards = risks.filter((r) => r.risk_class === 'high' || r.risk_class === 'severe');

    const demandPoints: DemandPoint[] = highOrSevereWards.map((r) => {
      const ward = context.wards.find((w) => w.ward_id === r.ward_id)!;
      return {
        id: r.ward_id,
        lat: ward.centroid_lat,
        lon: ward.centroid_lon,
        weight: r.risk_score,
      };
    });

    const optResult = optimiseCentres(demandPoints, context.candidateSites, k, radius);

    return {
      result: optResult,
      summary: `Optimized ${optResult.centres.length} cooling centres with ${optResult.coverage_pct}% high-risk ward coverage within ${radius} km radius.`,
    };
  },
};

/**
 * 6. draft_advisory: fills deterministic English template from structured plan fields
 */
const draftAdvisoryTool: ToolDefinition = {
  name: 'draft_advisory',
  description: 'Generates deterministic English emergency advisory and actions from structured tool outputs.',
  parameters: {
    type: 'object',
    properties: {
      peak_apparent_c: { type: 'number' },
      coverage_pct: { type: 'number' },
      top_wards: { type: 'array', items: { type: 'string' } },
      demand_peak_mw: { type: 'number' },
    },
    required: ['peak_apparent_c', 'coverage_pct'],
  },
  execute: async (args, context) => {
    const scenarioText =
      context.scenario === 'stress_plus_2c'
        ? ' [Scenario: +2 °C El Niño Stress Test Active]'
        : ' [Scenario: Live Forecast]';

    const demandClause = context.demandForecast
      ? ` Peak grid demand is forecast at ${context.demandForecast.peak_mw} MW with peak thermal stress between ${context.demandForecast.stress_window.start_hour}:00 and ${context.demandForecast.stress_window.end_hour}:00 hrs. Authorities advise shifting deferrable loads (water pumps, EV charging, laundry) to the off-peak window (${context.demandForecast.shift_window.start_hour}:00-${context.demandForecast.shift_window.end_hour}:00 hrs). Essential cooling and medical equipment must never be turned off.`
      : ' Official power demand data was not uploaded; ward electricity load shifting is omitted.';

    const englishText =
      `HEAT EMERGENCY ADVISORY${scenarioText}: Severe heat exposure expected with feels-like temperatures peaking at ${args.peak_apparent_c} °C.` +
      ` Municipal authorities must prioritize outreach in vulnerable sectors. Dedicated cooling facilities achieve ${args.coverage_pct}% coverage across all high and severe risk wards within walking radius.` +
      demandClause +
      ` Officer verification is required before operational dispatch.`;

    return {
      result: {
        en: englishText,
      },
      summary: 'Drafted deterministic emergency advisory in English.',
    };
  },
};

export const ALLOWLISTED_TOOLS: Record<string, ToolDefinition> = {
  get_forecast: getForecastTool,
  get_ward_risks: getWardRisksTool,
  forecast_demand: forecastDemandTool,
  find_candidate_sites: findCandidateSitesTool,
  optimise_centres: optimiseCentresTool,
  draft_advisory: draftAdvisoryTool,
};
