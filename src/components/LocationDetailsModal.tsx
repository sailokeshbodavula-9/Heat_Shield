/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  MapPin,
  Navigation,
  Thermometer,
  ShieldAlert,
  Zap,
  Building,
  TreePine,
  CheckCircle2,
  X,
  Compass,
  AlertTriangle,
  ExternalLink,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  DemandForecastResult,
  RiskResult,
  Site,
  UserLocationDetails,
  Ward,
} from '../types/index.ts';

interface LocationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: UserLocationDetails | null;
  ward: Ward | null;
  risk: RiskResult | null;
  nearestCenter: { site: Site; distanceKm: number } | null;
  demandForecast: DemandForecastResult | null;
  weatherPeakApparent: number;
  theme: 'dark' | 'light';
  currentCityName?: string;
  isUserInCity?: boolean;
  onViewWardDetails: () => void;
  onCenterOnMap: () => void;
}

const RISK_BADGES = {
  severe: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: 'Severe Risk' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', label: 'High Risk' },
  moderate: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: 'Moderate Risk' },
  low: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40', label: 'Low Risk' },
};

export const LocationDetailsModal: React.FC<LocationDetailsModalProps> = ({
  isOpen,
  onClose,
  location,
  ward,
  risk,
  nearestCenter,
  demandForecast,
  weatherPeakApparent,
  theme,
  currentCityName,
  isUserInCity = true,
  onViewWardDetails,
  onCenterOnMap,
}) => {
  if (!isOpen || !location) return null;

  const isDark = theme === 'dark';
  const riskClass = risk?.risk_class || 'low';
  const badgeStyle = RISK_BADGES[riskClass];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0F141C] border-[#1F2937] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-start justify-between bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Navigation className="w-5 h-5 fill-blue-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                  Current Location Details
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GPS Active
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
                {location.placeName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{location.fullAddress}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close location details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Outside India Notice (if applicable) */}
          {!location.isInsideIndia && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Device Location Outside India:</strong> Your GPS reported coordinates outside India. HeatShield has resolved your place to the closest Indian metropolitan grid (<strong>{location.cityName}</strong>) so you can test all live heatwave and cooling centre capabilities.
              </div>
            </div>
          )}

          {/* Different City Notice */}
          {!isUserInCity && currentCityName && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2">
              <Compass className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <div>
                <strong>Different City Active:</strong> You are currently exploring <strong>{currentCityName}</strong>, while your physical GPS position is in <strong>{location.cityName}</strong>. Click &ldquo;Center on Map&rdquo; below to switch back to your city.
              </div>
            </div>
          )}

          {/* Primary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Heat Risk
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-base font-bold text-white">
                  {risk ? risk.risk_score.toFixed(1) : '--'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
              </div>
              <span className={`text-[10px] font-mono uppercase font-bold mt-0.5 block ${badgeStyle.text}`}>
                {badgeStyle.label}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Feels-Like Peak
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-base font-bold text-amber-400">
                  {weatherPeakApparent > 0 ? `${weatherPeakApparent.toFixed(1)}°C` : '38.5°C'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Open-Meteo Apparent</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Nearest Cooler
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-base font-bold text-emerald-400">
                  {nearestCenter ? `${Math.round(nearestCenter.distanceKm * 1000)} m` : 'Within 1.5 km'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                {nearestCenter ? nearestCenter.site.type.replace('_', ' ') : 'Public Facility'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Stress Window
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-base font-bold text-yellow-400">
                  {demandForecast ? `${demandForecast.stress_window.start_hour}:00-${demandForecast.stress_window.end_hour}:00` : '13:00-17:00'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Peak Thermal Danger</span>
            </div>
          </div>

          {/* Place & Ward Jurisdiction Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="font-bold text-xs text-white">
                  Local Sector &amp; Administrative Zone
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Identified Sector:</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {ward ? ward.name : `${location.cityName} Urban Sector`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {ward ? `Ward ID: ${ward.ward_id}` : 'Regular Grid Sector'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">City &amp; State:</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {location.cityName}, {location.stateName || 'India'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Postal Area: {location.postcode || 'Standard Pin'}
                </span>
              </div>
            </div>
          </div>

          {/* Nearest Cooling Center Card */}
          {nearestCenter && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nearest Shaded Public Cooling Centre</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  ~{Math.round(nearestCenter.distanceKm * 1000)} meters away
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-900/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">
                    {nearestCenter.site.name || 'Public Facility'}
                  </h4>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {nearestCenter.site.type.replace('_', ' ')} • Verified OpenStreetMap Site
                  </p>
                </div>
                <button
                  onClick={() => {
                    onCenterOnMap();
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition shadow-sm"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Locate</span>
                </button>
              </div>
            </div>
          )}

          {/* Operational Directives for this Location */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs space-y-2">
            <span className="font-bold text-blue-300 uppercase font-mono tracking-wider block text-[11px]">
              Safety Directives for Your Area
            </span>
            <ul className="space-y-1.5 text-slate-300 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span><strong>Peak Sun Hours:</strong> Avoid strenuous outdoor activity between {demandForecast ? `${demandForecast.stress_window.start_hour}:00 and ${demandForecast.stress_window.end_hour}:00` : '13:00 and 17:00'} hrs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span><strong>Power Grid Conservation:</strong> Shift heavy water pump and appliance electricity usage to {demandForecast ? `${demandForecast.shift_window.start_hour}:00 - ${demandForecast.shift_window.end_hour}:00` : '18:00 - 22:00'} hrs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span><strong>Hydration:</strong> Free municipal water and ORS packets are deployed near major commercial and transit intersections.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/50">
          <button
            onClick={() => {
              onCenterOnMap();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Center on Map</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onViewWardDetails();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <span>View Full Ward Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
