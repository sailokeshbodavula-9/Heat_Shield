/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { TraceStep } from '../types/index.ts';

interface AgentTraceDrawerProps {
  steps: TraceStep[];
  theme: 'dark' | 'light';
  isRunning: boolean;
}

const STEPPER_STAGES = [
  'Plan',
  'Fetch',
  'Score',
  'Forecast',
  'Optimise',
  'Verify',
  'Report',
];

export const AgentTraceDrawer: React.FC<AgentTraceDrawerProps> = ({
  steps,
  theme,
  isRunning,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive current active stage in top stepper
  let activeIndex = 0;
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    if (lastStep.kind === 'plan') activeIndex = 0;
    else if (lastStep.tool === 'get_forecast' || lastStep.tool === 'find_candidate_sites') activeIndex = 1;
    else if (lastStep.tool === 'get_ward_risks') activeIndex = 2;
    else if (lastStep.tool === 'forecast_demand') activeIndex = 3;
    else if (lastStep.tool === 'optimise_centres') activeIndex = 4;
    else if (lastStep.kind === 'verify' || lastStep.kind === 'self_correction') activeIndex = 5;
    else if (lastStep.kind === 'report') activeIndex = 6;
  }

  return (
    <div
      className={`border-t transition-all z-20 ${
        theme === 'dark' ? 'bg-[#0B0F14] border-[#1F2937]' : 'bg-slate-100 border-slate-300'
      }`}
    >
      {/* Drawer Bar Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="max-w-[1700px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Agent Execution Trace</span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {steps.length} Steps Logged
          </span>

          {isRunning && (
            <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Executing step...</span>
            </span>
          )}
        </div>

        {/* Top Stepper: Plan > Fetch > Score > Forecast > Optimise > Verify > Report */}
        <div className="hidden md:flex items-center gap-1 text-[11px] font-mono">
          {STEPPER_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex && isRunning;
            const isTarget = idx === activeIndex && !isRunning && steps.length > 0;

            return (
              <React.Fragment key={stage}>
                <span
                  className={`px-2 py-0.5 rounded font-medium ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : isCurrent
                      ? 'bg-blue-600 text-white animate-pulse'
                      : isTarget
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-slate-500'
                  }`}
                >
                  {stage}
                </span>
                {idx < STEPPER_STAGES.length - 1 && (
                  <span className="text-slate-600">›</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <span>{isExpanded ? 'Collapse' : 'Expand Trace'}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Monospace Step Details */}
      {isExpanded && (
        <div className="max-w-[1700px] mx-auto px-4 py-3 border-t border-slate-800 max-h-72 overflow-y-auto space-y-2 font-mono text-xs">
          {steps.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-2">
              No planner run executed yet. Press "Run Planner" above to observe the live tool-calling trace.
            </p>
          ) : (
            steps.map((st) => (
              <div
                key={st.step_no}
                className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${
                  st.status === 'failed'
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : st.kind === 'self_correction'
                    ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    {st.status === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-400">Step #{st.step_no}:</span>
                    <span className="font-bold text-blue-400 uppercase tracking-wider">
                      {st.tool ? `tool: ${st.tool}` : st.kind}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>{st.duration_ms} ms</span>
                  </div>
                </div>

                {/* Monospace arguments */}
                {st.args && Object.keys(st.args).length > 0 && (
                  <div className="bg-black/40 px-2 py-1 rounded text-[11px] text-slate-400 overflow-x-auto">
                    args: {JSON.stringify(st.args)}
                  </div>
                )}

                {/* Summary */}
                <div className="text-[11px] text-slate-300">{st.result_summary}</div>

                {/* Self-Correction Before/After Diff Display */}
                {st.diff && (
                  <div className="mt-1 pt-1 border-t border-purple-800/40 text-[10px] space-y-1">
                    <div className="text-red-400 line-through">
                      - {st.diff.before.slice(0, 120)}...
                    </div>
                    <div className="text-emerald-400">
                      + {st.diff.after.slice(0, 120)}...
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
