/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Download,
  CheckCircle,
  Building2,
  Clock,
  Zap,
  Info,
  Languages,
  Flame,
} from 'lucide-react';
import { Plan, RiskClass } from '../types/index.ts';

interface ActionPlanTabProps {
  plan: Plan | null;
  theme: 'dark' | 'light';
  onRunPlanner: () => void;
  isRunning: boolean;
}

const RISK_BADGES: Record<RiskClass, { bg: string; text: string; border: string }> = {
  severe: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  moderate: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  low: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
};

export const ActionPlanTab: React.FC<ActionPlanTabProps> = ({
  plan,
  theme,
  onRunPlanner,
  isRunning,
}) => {
  const [activeLang, setActiveLang] = useState<'en' | 'kn' | 'hi'>('en');
  const [copied, setCopied] = useState(false);
  const [showVerifierPopover, setShowVerifierPopover] = useState(false);

  if (!plan) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-200">No Action Plan Generated</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Click the "Run Planner" button to trigger the deterministic risk engine, greedy cooling centre optimiser, and AI verifier.
        </p>
        <button
          onClick={onRunPlanner}
          disabled={isRunning}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
        >
          {isRunning ? 'Running Agent...' : 'Press Run Planner'}
        </button>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const isPartial = plan.status === 'partial';
  const verifiedBadgeText = isPartial ? 'Partially verified' : 'Verified';

  // Get current advisory text
  let advisoryText = plan.advisories.en;
  if (activeLang === 'kn') {
    advisoryText = plan.advisories.kn || 'Translation needs the LLM (Kannada not available in template mode). \n\n' + plan.advisories.en;
  } else if (activeLang === 'hi') {
    advisoryText = plan.advisories.hi || 'Translation needs the LLM (Hindi not available in template mode). \n\n' + plan.advisories.en;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(advisoryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="p-4 space-y-4 printable-plan">
      {/* Plan Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              PLAN ID: {plan.plan_id.slice(-8)}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {plan.mode.toUpperCase()} MODE
            </span>
          </div>
          {/* Strict Draft & Safety Notice (AC5, FIELD 9) */}
          <div className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DRAFT, requires officer approval. Nothing is sent.</span>
          </div>
        </div>

        {/* Verification Status Popover Button */}
        <div className="relative">
          <button
            onClick={() => setShowVerifierPopover(!showVerifierPopover)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition border ${
              isPartial
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifiedBadgeText}</span>
          </button>

          {/* Verification Details Popover */}
          {showVerifierPopover && (
            <div
              className={`absolute right-0 top-full mt-2 w-80 rounded-xl p-3.5 border shadow-2xl z-50 text-xs ${
                isDark ? 'bg-[#121821] border-[#1F2937] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="font-bold text-xs border-b border-slate-700/50 pb-1.5 mb-2 flex items-center justify-between">
                <span>Deterministic Verification (V1-V4)</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {plan.verification.corrections} Corrections
                </span>
              </div>
              <div className="space-y-2">
                {plan.verification.checks.map((chk) => (
                  <div key={chk.id} className="text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold">
                      {chk.passed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="font-mono">{chk.id}:</span>
                      <span className={chk.passed ? 'text-slate-200' : 'text-amber-400'}>
                        {chk.passed ? 'Passed' : 'Needs Review'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 ml-5 mt-0.5">{chk.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Missing Feeds Chip Row (Partial Success Rule, L15) */}
      {plan.missing && plan.missing.length > 0 && (
        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Missing layers in plan: {plan.missing.join(', ')}. Scored from remaining feeds.</span>
        </div>
      )}

      {/* El Niño Climate Advisory Directive Banner - Only in El Niño Mode */}
      {plan.scenario === 'stress_plus_2c' && (
        <div className="p-3.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-red-950/30 to-slate-900/60 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center shrink-0 font-bold mt-0.5">
              <Flame className="w-4 h-4 fill-black" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-bold text-xs text-amber-300 uppercase tracking-wide">
                  El Niño Thermal Stress Active (+2.0 °C Temperature Surge)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase animate-pulse">
                  El Niño Stress Scenario Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Municipal response is running under the authoritative NOAA CPC Niño-3.4 index (+1.2 °C) &amp; WMO advisory scenario. Wards face heightened compound heat exposure with expanded severe-risk zones, elevated grid failure probabilities, and urgent cooling shelter requirements.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  NOAA Niño-3.4: +1.2 °C Anomaly
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">
                  Public Shelters: Prioritised Activation
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Grid Peak Load Contingency
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority 1 Card: Warn First */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
              1
            </span>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Priority 1: Warn First (Highest Exposure Sectors)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Top 5 Wards</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {plan.warn_first.map((w) => {
            const bStyle = RISK_BADGES[w.risk_class];
            return (
              <div
                key={w.ward_id}
                className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-white">
                    #{w.rank} {w.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">ID: {w.ward_id}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}
                  >
                    {w.risk_class}
                  </span>
                  <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                    {w.risk_score.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority 2 Card: Open Cooling Centres */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
              2
            </span>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Priority 2: Activate Cooling Centres
            </h4>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {plan.coverage_pct}% high-risk covered
          </span>
        </div>

        {plan.centres.length > 0 ? (
          <div className="space-y-2 mt-2">
            {plan.centres.map((c, idx) => (
              <div
                key={c.site_id}
                className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-semibold text-white">
                      {idx + 1}. {c.name || 'Public Facility'}
                    </span>
                    <span className="text-[10px] text-slate-400 block capitalize">
                      {c.type.replace('_', ' ')} • ID: {c.site_id}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                    +{c.newly_covered_pct}% new coverage
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">straight-line</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No high or severe risk wards for this day.
          </p>
        )}

        <p className="text-[10px] text-slate-400 mt-2 font-mono">
          Candidate sites come from OpenStreetMap and are not verified as available or air-conditioned. Officer confirmation required.
        </p>
      </div>

      {/* Priority 3 Card: Advise Load Shifting */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
              3
            </span>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Priority 3: Advise Power Load Shifting
            </h4>
          </div>
          <span className="text-[10px] font-mono text-yellow-400">Grid Resilience</span>
        </div>

        {plan.demand ? (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-900/40">
                <span className="text-[10px] font-mono uppercase text-amber-300 block font-semibold">
                  Thermal Stress Window
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">
                  {plan.demand.stress_window.start_hour}:00 - {plan.demand.stress_window.end_hour}:00
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Peak demand: {plan.demand.peak_mw} MW (±1.96σ: {plan.demand.interval_mw[0]}-{plan.demand.interval_mw[1]} MW)
                </span>
              </div>

              <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-900/40">
                <span className="text-[10px] font-mono uppercase text-blue-300 block font-semibold">
                  Advised Shift Window
                </span>
                <span className="font-mono font-bold text-blue-400 text-sm mt-0.5 block">
                  {plan.demand.shift_window.start_hour}:00 - {plan.demand.shift_window.end_hour}:00
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Shift heavy pumping, EV & industrial loads
                </span>
              </div>
            </div>

            <p className="text-[10px] text-emerald-400 font-mono">
              Safety rule: Never advise switching off essential air cooling, fans, or medical equipment.
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-800/40 text-xs text-slate-400 font-mono">
            Official daily power demand file not uploaded. Load shifting guidance omitted. (City/state level demand, not ward level).
          </div>
        )}
      </div>

      {/* Advisory Message Text Box with Language Switch & Copy/PDF */}
      <div
        className={`p-3.5 rounded-xl border ${
          isDark ? 'bg-[#121821] border-[#1F2937]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>Emergency Broadcast Advisory</span>
          </div>

          {/* Language Switch */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-lg border border-slate-700/50 text-[11px] font-mono">
            <button
              onClick={() => setActiveLang('en')}
              className={`px-2 py-0.5 rounded ${
                activeLang === 'en' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLang('kn')}
              className={`px-2 py-0.5 rounded ${
                activeLang === 'kn' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ (KN)
            </button>
            <button
              onClick={() => setActiveLang('hi')}
              className={`px-2 py-0.5 rounded ${
                activeLang === 'hi' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी (HI)
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
          {advisoryText}
        </div>

        {/* Action Buttons: Copy & Download as PDF */}
        <div className="flex items-center justify-end gap-2 mt-3 no-print">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download as PDF</span>
          </button>
        </div>
      </div>

      {/* Official Citations & Standards Strip */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 text-[10px] text-slate-400 space-y-1 font-mono">
        <div className="font-bold text-slate-300 uppercase tracking-wider">
          Normative Framework Citations:
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>• <strong>IMD:</strong> mausam.imd.gov.in</span>
          <span>• <strong>NOAA CPC:</strong> cpc.ncep.noaa.gov</span>
          <span>• <strong>WMO:</strong> wmo.int/topics/el-nino-la-nina</span>
          <span>• <strong>OGD India:</strong> data.gov.in</span>
          <span>• <strong>National Grid:</strong> grid-india.in &amp; cea.nic.in</span>
        </div>
      </div>
    </div>
  );
};
