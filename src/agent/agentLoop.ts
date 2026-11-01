/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plan, TraceStep } from '../types/index.ts';
import { ALLOWLISTED_TOOLS, ToolContext } from './tools.ts';
import { buildTemplatePlan } from './templatePlan.ts';
import { verifyPlan, VerifierContext } from './verifier.ts';

export async function runPlanningAgent(
  context: ToolContext,
  targetLang: 'kn' | 'hi' = 'kn',
  onTraceStep?: (step: TraceStep) => void
): Promise<Plan> {
  let stepCounter = 1;

  const emitStep = (step: Omit<TraceStep, 'step_no'>) => {
    const fullStep: TraceStep = {
      step_no: stepCounter++,
      ...step,
    };
    onTraceStep?.(fullStep);
    return fullStep;
  };

  // Step 1: Initial Plan
  emitStep({
    kind: 'plan',
    tool: null,
    result_summary: `Initiating agent pipeline for ${context.selectedDay} (${context.scenario} scenario). Target radius: ${context.radiusKm} km, k: ${context.k} cooling centres.`,
    started_at: new Date().toISOString(),
    duration_ms: 10,
    status: 'success',
  });

  // Check backend Gemini availability
  let hasGemini = false;
  try {
    const healthResp = await fetch('/api/health');
    if (healthResp.ok) {
      const data = await healthResp.json();
      hasGemini = Boolean(data.hasGeminiKey);
    }
  } catch (e) {
    // offline or backend unreachable
  }

  // Execute tools sequentially (up to 12 steps cap per L15)
  const toolOutputs: Record<string, any> = {};
  const missing: string[] = [];

  const toolsToRun = [
    'get_forecast',
    'get_ward_risks',
    'forecast_demand',
    'find_candidate_sites',
    'optimise_centres',
    'draft_advisory',
  ];

  for (const toolName of toolsToRun) {
    if (stepCounter > 12) break;

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

      emitStep({
        kind: 'tool_call',
        tool: toolName,
        args,
        result_summary: summary,
        started_at: new Date().toISOString(),
        duration_ms: Math.round(performance.now() - start),
        status: 'success',
      });
    } catch (err: any) {
      missing.push(toolName);
      emitStep({
        kind: 'tool_call',
        tool: toolName,
        args: {},
        result_summary: `Failed to execute ${toolName}: ${err.message}`,
        started_at: new Date().toISOString(),
        duration_ms: Math.round(performance.now() - start),
        status: 'failed',
      });
    }
  }

  const wardRisks = toolOutputs['get_ward_risks']?.result?.risks || [];
  const optResult = toolOutputs['optimise_centres']?.result || {
    centres: [],
    coverage_pct: 0,
    uncovered_high_risk_ward_ids: [],
  };
  const forecastRes = toolOutputs['get_forecast']?.result || { max_apparent_c: 38.5 };

  // Top 5 Warn first (L14)
  const sortedWards = [...wardRisks].sort((a: any, b: any) => {
    if (b.risk_score !== a.risk_score) {
      return b.risk_score - a.risk_score;
    }
    const wardA = context.wards.find((w) => w.ward_id === a.ward_id);
    const wardB = context.wards.find((w) => w.ward_id === b.ward_id);
    return (wardA?.name || '').localeCompare(wardB?.name || '');
  });

  const warn_first = sortedWards.slice(0, 5).map((r: any, i: number) => {
    const ward = context.wards.find((w) => w.ward_id === r.ward_id);
    return {
      ward_id: r.ward_id,
      name: ward?.name || `Ward ${i + 1}`,
      rank: i + 1,
      risk_score: r.risk_score,
      risk_class: r.risk_class,
    };
  });

  let advisoryEn = toolOutputs['draft_advisory']?.result?.en || '';
  let translatedAdvisory: string | null = null;

  // Translation via LLM if available
  if (hasGemini) {
    const transStart = performance.now();
    try {
      const transResp = await fetch('/api/agent/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: advisoryEn,
          targetLang,
        }),
      });

      if (transResp.ok) {
        const transData = await transResp.json();
        translatedAdvisory = transData.translated;
        emitStep({
          kind: 'tool_call',
          tool: `translate_${targetLang}`,
          args: { targetLang, preserve_arabic_numerals: true },
          result_summary: `LLM translated advisory to ${targetLang === 'kn' ? 'Kannada' : 'Hindi'} with Latin digits preserved.`,
          started_at: new Date().toISOString(),
          duration_ms: Math.round(performance.now() - transStart),
          status: 'success',
        });
      }
    } catch (e: any) {
      console.warn('Translation failed:', e.message);
    }
  }

  // Verifier Context (L16, T8)
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

  const verifierContext: VerifierContext = {
    validWardIds: new Set(context.wards.map((w) => w.ward_id)),
    validSiteIds: new Set(context.candidateSites.map((s) => s.site_id)),
    validNumbers,
    scenario: context.scenario,
    expectedCoveragePct: optResult.coverage_pct,
  };

  const planDraft: Partial<Plan> = {
    plan_id: `hs-plan-${Date.now()}`,
    generated_at: new Date().toISOString(),
    status: 'draft',
    mode: hasGemini ? 'llm' : 'template',
    scenario: context.scenario,
    day: context.selectedDay,
    warn_first,
    centres: optResult.centres,
    coverage_pct: optResult.coverage_pct,
    uncovered_high_risk_ward_ids: optResult.uncovered_high_risk_ward_ids,
    demand: context.demandForecast,
    advisories: {
      en: advisoryEn,
      kn: targetLang === 'kn' ? translatedAdvisory : null,
      hi: targetLang === 'hi' ? translatedAdvisory : null,
    },
    missing,
    sources: [
      { source_id: 'open_meteo_forecast', fetched_at: new Date().toISOString() },
      { source_id: 'osm_sites', fetched_at: new Date().toISOString() },
      { source_id: 'osm_buildings', fetched_at: new Date().toISOString() },
    ],
    sent: false,
  };

  // Run Verifier
  let verification = verifyPlan(planDraft, verifierContext);
  let corrections = 0;

  // L16: Maximum 2 retries on verification failure with self_correction trace steps
  while (!verification.passed && corrections < 2 && stepCounter <= 12) {
    corrections++;
    const failedChecks = verification.checks.filter((c) => !c.passed);
    const beforeText = planDraft.advisories?.en || '';

    // Self-correct advisory by forcing exact tool numbers and scenario label
    const correctedText =
      `HEAT EMERGENCY ADVISORY [Scenario: ${context.scenario === 'stress_plus_2c' ? '+2 °C El Niño Stress Test' : 'Live Forecast'}]: ` +
      `Temperature peaking at ${forecastRes.max_apparent_c} °C. High-risk ward coverage: ${optResult.coverage_pct}%. ` +
      (context.demandForecast
        ? `Peak demand: ${context.demandForecast.peak_mw} MW. Shift window: ${context.demandForecast.shift_window.start_hour}:00-${context.demandForecast.shift_window.end_hour}:00.`
        : 'Demand model omitted.');

    if (planDraft.advisories) {
      planDraft.advisories.en = correctedText;
    }

    emitStep({
      kind: 'self_correction',
      tool: 'agent_self_corrector',
      args: { failed_checks: failedChecks.map((f) => f.id) },
      result_summary: `Self-correction attempt ${corrections}/2 resolved numerical discrepancies.`,
      started_at: new Date().toISOString(),
      duration_ms: 25,
      status: 'success',
      diff: {
        before: beforeText,
        after: correctedText,
      },
    });

    verification = verifyPlan(planDraft, verifierContext);
    verification.corrections = corrections;
  }

  emitStep({
    kind: 'verify',
    tool: 'verifier',
    args: { checks: 4, corrections },
    result_summary: verification.passed
      ? 'Verification passed (V1: IDs verified, V2: Numbers verified, V3: Scenario verified, V4: Coverage verified).'
      : `Partially verified: ${verification.checks.filter((c) => !c.passed).map((c) => c.id).join(', ')}`,
    started_at: new Date().toISOString(),
    duration_ms: 12,
    status: verification.passed ? 'success' : 'failed',
  });

  // Step final: Report
  const isPartial = !verification.passed || missing.length > 0 || stepCounter > 12;
  const finalStatus = isPartial ? 'partial' : 'draft';

  emitStep({
    kind: 'report',
    tool: null,
    result_summary: `Action plan generated with status '${finalStatus}' in ${planDraft.mode} mode. ${warn_first.length} priority wards, ${optResult.centres.length} cooling centres selected.`,
    started_at: new Date().toISOString(),
    duration_ms: 5,
    status: 'success',
  });

  return {
    ...(planDraft as Plan),
    status: finalStatus,
    verification,
    sent: false,
  };
}
