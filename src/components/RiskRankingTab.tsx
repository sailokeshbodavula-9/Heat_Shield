/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sliders, ArrowUpDown, ArrowUp, ArrowDown, Shield, Sparkles } from 'lucide-react';
import { RiskClass, RiskResult, Ward } from '../types/index.ts';

interface RiskRankingTabProps {
  wards: Ward[];
  risks: RiskResult[];
  onSelectWard: (wardId: string) => void;
  weights: { w_hazard: number; w_exposure: number; w_vulnerability: number };
  onUpdateWeights: (newWeights: { w_hazard: number; w_exposure: number; w_vulnerability: number }) => void;
  theme: 'dark' | 'light';
}

const RISK_BADGES: Record<RiskClass, { bg: string; text: string }> = {
  severe: { bg: 'bg-red-500/20 text-red-400', text: 'severe' },
  high: { bg: 'bg-orange-500/20 text-orange-400', text: 'high' },
  moderate: { bg: 'bg-amber-500/20 text-amber-400', text: 'moderate' },
  low: { bg: 'bg-teal-500/20 text-teal-400', text: 'low' },
};

export const RiskRankingTab: React.FC<RiskRankingTabProps> = ({
  wards,
  risks,
  onSelectWard,
  weights,
  onUpdateWeights,
  theme,
}) => {
  const [sortField, setSortField] = useState<'score' | 'name' | 'hazard' | 'exposure'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [showSliders, setShowSliders] = useState(false);

  const wardMap = useMemo(() => {
    const map = new Map<string, Ward>();
    wards.forEach((w) => map.set(w.ward_id, w));
    return map;
  }, [wards]);

  const sortedRisks = useMemo(() => {
    return [...risks].sort((a, b) => {
      let diff = 0;
      if (sortField === 'score') {
        diff = a.risk_score - b.risk_score;
      } else if (sortField === 'hazard') {
        diff = a.hazard - b.hazard;
      } else if (sortField === 'exposure') {
        diff = (a.exposure ?? 0) - (b.exposure ?? 0);
      } else if (sortField === 'name') {
        const nameA = wardMap.get(a.ward_id)?.name || '';
        const nameB = wardMap.get(b.ward_id)?.name || '';
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return sortAsc ? diff : -diff;
    });
  }, [risks, sortField, sortAsc, wardMap]);

  const handleSliderChange = (key: 'w_hazard' | 'w_exposure' | 'w_vulnerability', val: number) => {
    onUpdateWeights({
      ...weights,
      [key]: val,
    });
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header & Weight Tuning Toggle */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
        <div>
          <h3 className="font-bold text-sm text-slate-200">Ward Heat Risk Ranking</h3>
          <p className="text-[11px] text-slate-400">
            {risks.length} sectors ranked by multi-criteria exposure formula
          </p>
        </div>

        <button
          onClick={() => setShowSliders(!showSliders)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
            showSliders
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showSliders ? 'Hide Tuning' : 'Tune Weights'}</span>
        </button>
      </div>

      {/* Live Weight Sliders (F7, debounced 300 ms on container) */}
      {showSliders && (
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2 text-xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
            Formula Weights (Normalises to 1.0 on use)
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Hazard (Weather & Heat Island)</span>
              <span className="font-bold text-amber-400">{weights.w_hazard.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.w_hazard}
              onChange={(e) => handleSliderChange('w_hazard', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Exposure (Buildings & Greenery)</span>
              <span className="font-bold text-emerald-400">{weights.w_exposure.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={weights.w_exposure}
              onChange={(e) => handleSliderChange('w_exposure', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Vulnerability (Demographics)</span>
              <span className="font-bold text-purple-400">{weights.w_vulnerability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={weights.w_vulnerability}
              onChange={(e) => handleSliderChange('w_vulnerability', parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      )}

      {/* Sortable Table */}
      <div className="rounded-xl border border-slate-700/60 overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-[11px] font-mono uppercase text-slate-400 sticky top-0 z-10 border-b border-slate-700">
              <tr>
                <th className="py-2 px-3 w-14">Rank</th>
                <th
                  className="py-2 px-3 cursor-pointer hover:text-white"
                  onClick={() => {
                    setSortField('name');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Ward / Sector</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:text-white text-right w-24"
                  onClick={() => {
                    setSortField('score');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2 px-3 text-center w-20">Class</th>
                <th className="py-2 px-3">Factor Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {sortedRisks.map((r, idx) => {
                const ward = wardMap.get(r.ward_id);
                const bStyle = RISK_BADGES[r.risk_class];

                return (
                  <tr
                    key={r.ward_id}
                    onClick={() => onSelectWard(r.ward_id)}
                    className="hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-200">
                        {ward?.name || r.ward_id}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {ward?.is_grid_cell ? 'grid cell' : r.ward_id}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white text-sm">
                      {r.risk_score.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${bStyle.bg}`}
                      >
                        {r.risk_class}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {/* Factor bars */}
                      <div className="space-y-1 w-24 sm:w-32">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400 w-4">H</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.round(r.hazard * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400 w-4">E</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.round((r.exposure ?? 0) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
