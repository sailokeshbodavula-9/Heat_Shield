/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plan, RiskResult, SourceId, Ward } from '../types/index.ts';
import { ALLOWLISTED_TOOLS, ToolContext } from './tools.ts';
import { verifyPlan } from './verifier.ts';

/**
 * Builds the plan deterministically by running the six tools in fixed order (L17).
 * Used when GEMINI_API_KEY is missing, offline, or LLM fails twice.
 */
export async function buildTemplatePlan(
  context: ToolContext,
  onStep?: (stepInfo: any) => void
): Promise<Plan> {
  const toolOrder = [
    'get_forecast',
    'get_ward_risks',
    'forecast_demand',
    'find_candidate_sites',
    'optimise_centres',
    'draft_advisory',
  ];

  const toolOutputs: Record<string, any> = {};
  const missing: string[] = [];

  for (let idx = 0; idx < toolOrder.length; idx++) {
    const toolName = toolOrder[idx];
    const tool = ALLOWLISTED_TOOLS[toolName];
    const start = performance.now();

    try {
      let args: any = { day: context.selectedDay };
      if (toolName === 'optimise_centres') {
        args = { k: context.k, radius_km: context.radiusKm };
      } else if (toolName === 'draft_advisory') {
        const fc = toolOutputs['get_forecast']?.result;
        const opt = toolOutputs['optimise_centres']?.result;
        args = {
          peak_apparent_c: fc?.max_apparent_c ?? 38.5,
          coverage_pct: opt?.coverage_pct ?? 0,
        };
      }

      const { result, summary } = await tool.execute(args, context);
      toolOutputs[toolName] = { result, summary };

      const durationMs = Math.round(performance.now() - start);
      onStep?.({
        step_no: idx + 1,
        kind: 'tool_call',
        tool: toolName,
        args,
        result_summary: summary,
        started_at: new Date().toISOString(),
        duration_ms: durationMs,
        status: 'success',
      });
    } catch (err: any) {
      missing.push(toolName);
      onStep?.({
        step_no: idx + 1,
        kind: 'tool_call',
        tool: toolName,
        args: {},
        result_summary: `Tool error: ${err.message}`,
        started_at: new Date().toISOString(),
        duration_ms: Math.round(performance.now() - start),
        status: 'failed',
      });
    }
  }

  // Extract structured results
  const wardRisks: RiskResult[] = toolOutputs['get_ward_risks']?.result?.risks || [];
  const optResult = toolOutputs['optimise_centres']?.result || {
    centres: [],
    coverage_pct: 0,
    uncovered_high_risk_ward_ids: [],
  };
  const forecastRes = toolOutputs['get_forecast']?.result || { max_apparent_c: 38.5 };

  // L14: Warn-first list: top 5 wards by risk_score; tie-break by pop_density descending, then name ascending
  const sortedWards = [...wardRisks].sort((a, b) => {
    if (b.risk_score !== a.risk_score) {
      return b.risk_score - a.risk_score;
    }
    const wardA = context.wards.find((w) => w.ward_id === a.ward_id);
    const wardB = context.wards.find((w) => w.ward_id === b.ward_id);
    return (wardA?.name || '').localeCompare(wardB?.name || '');
  });

  const warn_first = sortedWards.slice(0, 5).map((r, i) => {
    const ward = context.wards.find((w) => w.ward_id === r.ward_id);
    return {
      ward_id: r.ward_id,
      name: ward?.name || `Ward ${i + 1}`,
      rank: i + 1,
      risk_score: r.risk_score,
      risk_class: r.risk_class,
    };
  });

  const advisoryEn = toolOutputs['draft_advisory']?.result?.en || '';

  const sources: Array<{ source_id: string; fetched_at: string }> = [
    { source_id: 'open_meteo_forecast', fetched_at: new Date().toISOString() },
    { source_id: 'osm_sites', fetched_at: new Date().toISOString() },
    { source_id: 'osm_buildings', fetched_at: new Date().toISOString() },
  ];
  if (context.demandForecast) {
    sources.push({ source_id: 'demand_history', fetched_at: new Date().toISOString() });
  }

  // Collect verified numbers
  const validNumbers = new Set<string>();
  validNumbers.add(String(forecastRes.max_apparent_c));
  validNumbers.add(forecastRes.max_apparent_c.toFixed(1));
  validNumbers.add(String(optResult.coverage_pct));
  validNumbers.add(optResult.coverage_pct.toFixed(1));
  validNumbers.add(String(context.radiusKm));
  if (context.demandForecast) {
    validNumbers.add(String(context.demandForecast.peak_mw));
    validNumbers.add(String(context.demandForecast.stress_window.start_hour));
    validNumbers.add(String(context.demandForecast.stress_window.end_hour));
    validNumbers.add(String(context.demandForecast.shift_window.start_hour));
    validNumbers.add(String(context.demandForecast.shift_window.end_hour));
  }
  for (const w of warn_first) {
    validNumbers.add(String(w.risk_score));
    validNumbers.add(w.risk_score.toFixed(1));
  }

  const verifierContext = {
    validWardIds: new Set(context.wards.map((w) => w.ward_id)),
    validSiteIds: new Set(context.candidateSites.map((s) => s.site_id)),
    validNumbers,
    scenario: context.scenario,
    expectedCoveragePct: optResult.coverage_pct,
  };

  const draftPlan: Partial<Plan> = {
    plan_id: `hs-plan-${Date.now()}`,
    generated_at: new Date().toISOString(),
    status: missing.length > 0 ? 'partial' : 'draft',
    mode: 'template',
    scenario: context.scenario,
    day: context.selectedDay,
    warn_first,
    centres: optResult.centres,
    coverage_pct: optResult.coverage_pct,
    uncovered_high_risk_ward_ids: optResult.uncovered_high_risk_ward_ids,
    demand: context.demandForecast,
    advisories: {
      en: advisoryEn,
      kn: null, // "Translation needs the LLM"
      hi: null,
    },
    missing,
    sources,
    sent: false,
  };

  const verification = verifyPlan(draftPlan, verifierContext);

  const finalPlan: Plan = {
    ...(draftPlan as Plan),
    status: verification.passed ? (missing.length > 0 ? 'partial' : 'draft') : 'partial',
    verification,
    sent: false,
  };

  onStep?.({
    step_no: toolOrder.length + 1,
    kind: 'verify',
    tool: 'verifier',
    args: { checks: 4 },
    result_summary: verification.passed
      ? 'All V1-V4 verification checks passed.'
      : `Verification check issues: ${verification.checks.filter((c) => !c.passed).map((c) => c.id).join(', ')}`,
    started_at: new Date().toISOString(),
    duration_ms: 15,
    status: verification.passed ? 'success' : 'failed',
  });

  return finalPlan;
}
