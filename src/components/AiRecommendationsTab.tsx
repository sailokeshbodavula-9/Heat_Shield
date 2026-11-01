/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  ShieldAlert,
  Zap,
  Building2,
  Users,
  Droplet,
  CheckSquare,
  Square,
  Copy,
  Printer,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import type { CityAiRecommendation, CityEnsoProfile, Scenario } from '../types/index.ts';

interface AiRecommendationsTabProps {
  recommendation: CityAiRecommendation | null;
  ensoProfile: CityEnsoProfile;
  cityName: string;
  scenario: Scenario;
  isLoading: boolean;
  onRefresh: () => void;
  theme: 'dark' | 'light';
}

export const AiRecommendationsTab: React.FC<AiRecommendationsTabProps> = ({
  recommendation,
  ensoProfile,
  cityName,
  scenario,
  isLoading,
  onRefresh,
  theme,
}) => {
  const isDark = theme === 'dark';
  const isElNino = scenario === 'stress_plus_2c';
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = () => {
    if (!recommendation) return;
    const text = `HEATSHIELD AI ADVISORY & ${isElNino ? 'EL NIÑO MITIGATION STRATEGY' : 'LIVE HEAT ACTION PLAN'}: ${cityName.toUpperCase()}
Generated: ${new Date(recommendation.generatedAt).toLocaleString()} (${recommendation.mode.toUpperCase()})

EXECUTIVE SUMMARY:
${recommendation.executiveSummary}

${isElNino ? `EL NIÑO CLIMATE DIRECTIVES (+${ensoProfile.cityProjectedSurgeC}°C SURGE):` : 'LIVE HEATWAVE DIRECTIVES:'}
${recommendation.elninoSpecificDirectives.map((d) => `• ${d.title}: ${d.description} [Timeframe: ${d.timeframe}]`).join('\n')}

PROBLEM-SOLVING INTERVENTIONS:
${recommendation.problemSolvers.map((p) => `• PROBLEM: ${p.problem}\n  SOLUTION: ${p.solution}\n  TARGET: ${p.targetWardsOrSectors.join(', ')}\n  LEAD: ${p.leadDepartment}`).join('\n\n')}

24-48 HOUR PRIORITY CHECKLIST:
${recommendation.priorityActions24to48h.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const alertBadgeColor =
    ensoProfile.alertLevel === 'Critical'
      ? 'bg-red-500/20 text-red-400 border-red-500/40'
      : ensoProfile.alertLevel === 'Severe'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';

  return (
    <div className="p-4 space-y-4 printable-plan">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{isElNino ? 'AI Urban Heat & El Niño Strategy' : 'AI Urban Heat & Microclimate Strategy'}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {cityName}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isElNino ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {isElNino ? 'El Niño Advisory' : 'Live Mode'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isElNino
                  ? 'Tailored solutions for local ward vulnerabilities, grid stress & El Niño impacts'
                  : 'Live solutions for local ward heat vulnerabilities, grid stress & public cooling infrastructure'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/30'
            }`}
            title="Generate fresh AI recommendations for this city"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Generating with Gemini...' : 'Regenerate AI Strategy'}</span>
          </button>

          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isDark
                ? 'bg-[#121821] border-[#1F2937] hover:bg-[#1A2332] text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Copy plan to clipboard"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => window.print()}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isDark
                ? 'bg-[#121821] border-[#1F2937] hover:bg-[#1A2332] text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Print strategy to PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* City Climate & Diagnostic Card */}
      <div
        className={`rounded-xl border p-3.5 shadow-md ${
          isElNino
            ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-red-950/25 to-slate-900/60'
            : 'border-blue-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-purple-950/20'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
          <div className="flex items-center gap-2">
            {isElNino ? (
              <Flame className="w-4 h-4 text-amber-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-blue-400" />
            )}
            <span className={`font-bold text-xs uppercase tracking-wide ${isElNino ? 'text-amber-300' : 'text-blue-300'}`}>
              {isElNino ? `Live El Niño Profile: ${cityName}` : `City Microclimate Profile: ${cityName}`}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${alertBadgeColor}`}>
              {ensoProfile.alertLevel} Risk
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300">
            {isElNino ? (
              <>
                NOAA Niño-3.4: <strong className="text-amber-400">+{ensoProfile.nino34_index}°C</strong> • City Anomaly: <strong className="text-red-400">+{ensoProfile.cityProjectedSurgeC}°C Surge</strong>
              </>
            ) : (
              <>
                Regional Zone: <strong className="text-blue-300">{ensoProfile.regionalZone}</strong> • Status: <strong className="text-emerald-400">Live Weather Monitored</strong>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-200 mt-2 leading-relaxed">
          {ensoProfile.summary}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[9px] block uppercase">Regional Climate Zone</span>
            <span className="text-slate-200 font-semibold truncate block mt-0.5" title={ensoProfile.regionalZone}>
              {ensoProfile.regionalZone}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[9px] block uppercase">Dry Spell Probability</span>
            <span className="text-amber-400 font-bold block mt-0.5">
              {ensoProfile.drySpellProbabilityPct}% Likelihood
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[9px] block uppercase">Monsoon Timing</span>
            <span className="text-blue-300 font-semibold block mt-0.5 truncate" title={ensoProfile.monsoonDelayRisk}>
              {ensoProfile.monsoonDelayRisk}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 text-[9px] block uppercase">Grid Peak Multiplier</span>
            <span className="text-yellow-400 font-bold block mt-0.5">
              {ensoProfile.gridPeakMultiplier}x Cooling Load
            </span>
          </div>
        </div>
      </div>

      {recommendation ? (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                Executive Heat Action Directive
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase font-semibold">
                {recommendation.mode === 'llm' ? 'Gemini 3.8 Flash AI' : 'Deterministic Advisory'}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {recommendation.executiveSummary}
            </p>
          </div>

          {/* Section 1: Scenario Specific Directives */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-5 h-5 rounded-full font-mono font-bold text-[11px] flex items-center justify-center ${
                isElNino ? 'bg-amber-500 text-black' : 'bg-purple-600 text-white'
              }`}>
                1
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                {isElNino ? `El Niño Climate Stress Directives: ${cityName}` : `Live Urban Heat & Protection Directives: ${cityName}`}
              </h4>
            </div>

            <div className="space-y-2.5">
              {recommendation.elninoSpecificDirectives.map((d, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-xs space-y-1 border ${
                    isElNino
                      ? 'bg-amber-950/20 border-amber-900/40'
                      : 'bg-purple-950/20 border-purple-900/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className={`font-bold ${isElNino ? 'text-amber-300' : 'text-purple-300'}`}>{d.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      isElNino ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {d.timeframe}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{d.description}</p>
                  <div className="text-[10px] text-emerald-400 font-mono pt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Projected Impact: {d.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Problem-Solving Micro-Interventions */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Targeted Problem Solutions for {cityName}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {recommendation.problemSolvers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-start gap-1.5">
                      <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{p.problem}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed pl-5">
                      {p.solution}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-700/50 pl-5 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                    <span className="text-blue-300">
                      Target: {p.targetWardsOrSectors.join(', ')}
                    </span>
                    <span className="text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                      {p.leadDepartment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 24-48 Hour Officer Action Checklist */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Officer Execution Checklist (Next 24-48 Hours)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {Object.values(completedActions).filter(Boolean).length} of {recommendation.priorityActions24to48h.length} completed
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              {recommendation.priorityActions24to48h.map((action, idx) => {
                const isDone = Boolean(completedActions[idx]);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleAction(idx)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 text-xs ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                        : 'bg-slate-800/30 border-slate-700/40 text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className={`leading-snug ${isDone ? 'line-through opacity-80' : ''}`}>
                      {action}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-2" />
          <p className="text-xs text-slate-300">Generating AI recommendations for {cityName}...</p>
        </div>
      )}
    </div>
  );
};
