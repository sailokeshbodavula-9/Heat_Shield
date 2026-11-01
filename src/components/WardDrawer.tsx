/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Thermometer, TreePine, Building, ShieldAlert, Sparkles, MapPin, AlertCircle, Navigation } from 'lucide-react';
import { DayForecast, RiskResult, Ward } from '../types/index.ts';

interface WardDrawerProps {
  ward: Ward | null;
  risk: RiskResult | null;
  forecasts: DayForecast[];
  onClose: () => void;
  theme: 'dark' | 'light';
  buildingDensity: number | null;
  greenCover: number | null;
  lstTemp: number | null;
  geeTemp?: number | null;
  geeEmissivity?: number | null;
  sentinelTreeCover?: number | null;
  sentinelNdvi?: number | null;
  isUserLocation?: boolean;
  userPlaceName?: string;
}

const RISK_BADGES = {
  severe: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  moderate: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  low: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
};

export const WardDrawer: React.FC<WardDrawerProps> = ({
  ward,
  risk,
  forecasts,
  onClose,
  theme,
  buildingDensity,
  greenCover,
  lstTemp,
  geeTemp,
  geeEmissivity,
  sentinelTreeCover,
  sentinelNdvi,
  isUserLocation = false,
  userPlaceName,
}) => {
  if (!ward) return null;

  const isDark = theme === 'dark';
  const riskClass = risk?.risk_class || 'low';
  const badgeStyle = RISK_BADGES[riskClass];

  // 7-day sparkline coordinates
  const maxTemp = Math.max(...forecasts.map((f) => f.apparent_max_c), 42);
  const minTemp = Math.min(...forecasts.map((f) => f.apparent_max_c), 30);
  const tempRange = Math.max(1, maxTemp - minTemp);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-96 z-50 border-l shadow-2xl flex flex-col transition-transform duration-200 ${
        isDark ? 'bg-[#121821] border-[#1F2937] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base tracking-tight">{ward.name}</h2>
            {ward.is_grid_cell && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-800/40">
                grid cell
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Ward ID: {ward.ward_id} • Area: {ward.area_km2} km²
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close ward drawer"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User Current Location Banner if matched */}
        {isUserLocation && (
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center gap-2 text-xs text-blue-300 font-mono shadow-sm">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold uppercase tracking-wider block text-[10px] text-blue-400">Your Current Location</span>
              <span className="text-white text-xs font-semibold">{userPlaceName || 'Active GPS Sector'}</span>
            </div>
          </div>
        )}
        {/* Risk Score Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-medium">
              Heat Risk Score
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
            >
              {riskClass}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {risk ? risk.risk_score.toFixed(1) : '--'}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>

          {/* Top Contributing Factors */}
          {risk?.top_factors && (
            <div className="mt-3 pt-2.5 border-t border-slate-700/40">
              <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                Top Heat Amplifiers in this Sector:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {risk.top_factors.map((tf, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    #{i + 1} {tf}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Feels-Like Heat Index Sparkline */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              7-Day Heat Index Trend
            </span>
            <span className="text-[10px] font-mono text-slate-400">Open-Meteo</span>
          </div>

          {/* SVG Sparkline */}
          <div className="h-24 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 280 60">
              {forecasts.map((f, i) => {
                const x = (i / Math.max(1, forecasts.length - 1)) * 260 + 10;
                const y = 55 - ((f.apparent_max_c - minTemp) / tempRange) * 45;
                const next = forecasts[i + 1];
                const nextX = ((i + 1) / Math.max(1, forecasts.length - 1)) * 260 + 10;
                const nextY = next ? 55 - ((next.apparent_max_c - minTemp) / tempRange) * 45 : y;

                return (
                  <g key={f.date}>
                    {next && (
                      <line
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={nextY}
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}
                    <circle cx={x} cy={y} r="3.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text
                      x={x}
                      y={Math.max(12, y - 6)}
                      textAnchor="middle"
                      fill="#CBD5E1"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {f.apparent_max_c.toFixed(0)}°
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            {forecasts.map((f) => (
              <span key={f.date}>{f.date.slice(5)}</span>
            ))}
          </div>
        </div>

        {/* Environmental Factors Breakdown */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2.5">
          <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-medium">
            Environmental Indicators
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building className="w-3.5 h-3.5 text-purple-400" />
              Building Footprint Density
            </span>
            <span className="font-mono font-bold text-white">
              {buildingDensity !== null ? `${buildingDensity} / km²` : 'OSM N/A'}
            </span>
          </div>

          {/* Sentinel-2 10m Tree Cover (High-Resolution Vegetation Data) */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sentinel-2 Tree Cover (10m)</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {sentinelTreeCover !== undefined && sentinelTreeCover !== null
                ? `${sentinelTreeCover.toFixed(1)}% canopy`
                : greenCover !== null
                ? `${(greenCover * 100).toFixed(0)}% canopy`
                : 'N/A'}
            </span>
          </div>

          {sentinelNdvi !== undefined && sentinelNdvi !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <TreePine className="w-3.5 h-3.5 text-teal-400" />
                <span>Sentinel-2 NDVI (B4/B8)</span>
              </span>
              <span className="font-mono font-bold text-teal-300">{sentinelNdvi.toFixed(2)}</span>
            </div>
          )}

          {/* Google Earth Engine Surface Temperature & Thermal LST */}
          {geeTemp !== undefined && geeTemp !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span>Earth Engine Thermal LST</span>
              </span>
              <span className="font-mono font-bold text-orange-400">{geeTemp.toFixed(1)} °C</span>
            </div>
          )}

          {lstTemp !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Thermometer className="w-3.5 h-3.5 text-red-400" />
                <span>Landsat-9 Surface Heat (LST)</span>
              </span>
              <span className="font-mono font-bold text-white">{lstTemp.toFixed(1)} °C</span>
            </div>
          )}

          <div className="text-[10px] text-slate-400 font-mono pt-1 flex flex-col gap-0.5">
            <span>Building density: OSM count per km² (approximate)</span>
            <span>Canopy: Copernicus Sentinel-2 MSI 10m tree cover &amp; ESA WorldCover</span>
            <span>Thermal: Google Earth Engine MODIS/Landsat catalog calibration</span>
          </div>
        </div>

        {/* Ward Recommended Action Checklist */}
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40">
          <div className="text-xs uppercase font-mono tracking-wider text-blue-300 font-semibold mb-2">
            Priority Field Actions
          </div>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Open air-conditioned municipal halls or school libraries for outdoor delivery workers and street vendors.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Deploy mobile ORS (Oral Rehydration Solution) hydration points near busy market intersections.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Issue advisory for water tanker replenishment prior to the peak afternoon stress window.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
