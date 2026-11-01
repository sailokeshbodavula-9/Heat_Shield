/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskClass = 'low' | 'moderate' | 'high' | 'severe';

export type ExposureBasis = 
  | 'ndvi_and_buildings' 
  | 'osm_green_and_buildings' 
  | 'buildings_only' 
  | 'ndvi_only' 
  | 'none';

export type Scenario = 'live' | 'stress_plus_2c';

export type SiteType = 'community_centre' | 'school' | 'library' | 'hospital' | 'townhall';

export type SourceId = 
  | 'open_meteo_forecast'
  | 'open_meteo_archive'
  | 'osm_sites'
  | 'osm_buildings'
  | 'planetary_computer_stac'
  | 'google_earth_engine'
  | 'sentinel2_vegetation'
  | 'ward_boundaries'
  | 'demand_history'
  | 'noaa_enso'
  | 'imd_mausam'
  | 'wmo_climate'
  | 'grid_india'
  | 'cea_national'
  | 'data_gov_in';

export interface CityGridProfile {
  cityName: string;
  regionCode: 'NR' | 'WR' | 'SR' | 'ER' | 'NER';
  regionName: string;
  rldcAuthority: string;
  ceaCategory: string;
  baseLoadMw: number;
  peakSummerMw: number;
  coolingElasticityMwPerC: number;
  sourcePortal: string;
  sourceUrl: string;
}

export type SourceStatusType = 'live' | 'failed' | 'user_uploaded' | 'not_loaded';

export interface SourceStatus {
  source_id: SourceId;
  name: string;
  status: SourceStatusType;
  last_fetched: string | null;
  records: number | null;
  detail: string;
  url: string;
}

export interface EnsoStatus {
  nino34_index: number;
  status: string;
  advisory_date: string;
  outlook: string;
  source_url: string;
  wmo_url: string;
}

export interface CityEnsoProfile {
  cityName: string;
  regionalZone: string;
  nino34_index: number;
  cityProjectedSurgeC: number;
  alertLevel: 'Severe' | 'Elevated' | 'High' | 'Critical';
  summary: string;
  monsoonDelayRisk: string;
  drySpellProbabilityPct: number;
  gridPeakMultiplier: number;
  waterStressLevel: string;
  immediatePriority: string;
}

export interface CityAiRecommendation {
  cityName: string;
  generatedAt: string;
  mode: 'llm' | 'deterministic';
  executiveSummary: string;
  elninoSpecificDirectives: Array<{
    title: string;
    description: string;
    timeframe: string;
    impact: string;
  }>;
  problemSolvers: Array<{
    problem: string;
    solution: string;
    targetWardsOrSectors: string[];
    leadDepartment: string;
  }>;
  priorityActions24to48h: string[];
}

export type PeakType = 
  | 'transit'
  | 'commercial'
  | 'industrial'
  | 'historic_core'
  | 'tech_corridor'
  | 'residential'
  | 'civic'
  | 'logistics';

export interface Ward {
  ward_id: string;
  name: string;
  polygon: any; // GeoJSON Polygon or MultiPolygon geometry
  centroid_lat: number;
  centroid_lon: number;
  area_km2: number;
  is_grid_cell: boolean;
  peak_type?: PeakType;
  landmark_description?: string;
}

export interface DayForecast {
  ward_id: string;
  date: string; // ISO YYYY-MM-DD
  tmax_c: number;
  apparent_max_c: number;
  humidity_mean_pct: number;
}

export interface HourForecast {
  ward_id: string;
  datetime: string; // ISO YYYY-MM-DDTHH:mm:ss
  apparent_c: number;
  temperature_c?: number;
}

export interface Site {
  site_id: string; // e.g. osm_node_12345
  name: string | null;
  type: SiteType;
  lat: number;
  lon: number;
}

export interface WardFactors {
  ward_id: string;
  lst_c: number | null;
  lst_scene_date: string | null;
  ndvi: number | null;
  green_cover_osm: number | null;
  building_density_per_km2: number | null;
  pop_density: number | null;
  vulnerable_share: number | null;
}

export interface RiskResult {
  ward_id: string;
  hazard: number; // 0..1
  exposure: number | null; // 0..1
  vulnerability: number | null; // 0..1
  risk_score: number; // 0..100, 1 dp
  risk_class: RiskClass;
  exposure_basis: ExposureBasis;
  top_factors: string[];
}

export interface DemandRecord {
  date: string; // YYYY-MM-DD
  demand_mw: number;
  hour?: number | null;
}

export interface DemandModel {
  coefficients: [number, number, number]; // [a, b, c] for demand = a + b*T + c*T^2
  train_days: number;
  test_days: number;
  r2_test: number;
  mape_test_pct: number;
  residual_std_mw: number;
  testActual?: number[];
  testPredicted?: number[];
  testDates?: string[];
}

export interface DemandForecastResult {
  peak_day: string;
  peak_mw: number;
  interval_mw: [number, number];
  stress_window: { start_hour: number; end_hour: number };
  shift_window: { start_hour: number; end_hour: number };
  dailyForecasts: Array<{
    date: string;
    tmax_c: number;
    predicted_mw: number;
    low_mw: number;
    high_mw: number;
  }>;
}

export type TraceStepKind = 'plan' | 'tool_call' | 'verify' | 'self_correction' | 'report';
export type TraceStepStatus = 'running' | 'success' | 'failed' | 'skipped';

export interface TraceStep {
  step_no: number;
  kind: TraceStepKind;
  tool: string | null;
  args?: Record<string, any>;
  result_summary: string;
  started_at: string;
  duration_ms: number;
  status: TraceStepStatus;
  diff?: {
    before: string;
    after: string;
  };
}

export interface VerificationCheck {
  id: string; // V1, V2, V3, V4
  passed: boolean;
  detail: string;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  corrections: number;
}

export interface CentrePlacement {
  site_id: string;
  name: string | null;
  type: SiteType;
  lat: number;
  lon: number;
  newly_covered_pct: number;
}

export interface Plan {
  plan_id: string;
  generated_at: string;
  status: 'draft' | 'partial' | 'failed';
  mode: 'llm' | 'template';
  scenario: Scenario;
  day: string;
  warn_first: Array<{
    ward_id: string;
    name: string;
    rank: number;
    risk_score: number;
    risk_class: RiskClass;
  }>;
  centres: CentrePlacement[];
  coverage_pct: number;
  uncovered_high_risk_ward_ids: string[];
  demand: DemandForecastResult | null;
  advisories: {
    en: string;
    kn: string | null;
    hi: string | null;
  };
  missing: string[];
  sources: Array<{
    source_id: string;
    fetched_at: string;
  }>;
  verification: VerificationResult;
  sent: false;
}

export interface AppSettings {
  wardGeoJsonUrl: string;
  k: number;
  radius_km: number;
  weights: {
    w_hazard: number;
    w_exposure: number;
    w_vulnerability: number;
  };
  hazard_low_c: number;
  hazard_high_c: number;
  language: 'en_hi' | 'en' | 'en_kn';
}

export interface UserLocationDetails {
  lat: number;
  lon: number;
  placeName: string;
  fullAddress: string;
  cityName: string;
  stateName?: string;
  postcode?: string;
  isInsideIndia: boolean;
  accuracyMeters?: number;
}

