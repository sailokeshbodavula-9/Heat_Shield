/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Flame,
  AlertTriangle,
  X,
  MapPin,
  Compass,
  ArrowRight,
  Volume2,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';
import { HeatAlert } from '../services/notificationService.ts';

interface SevereAlertBannerProps {
  alert: HeatAlert | null;
  onDismiss: () => void;
  onViewDetails: () => void;
  onLocateShelter?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const SevereAlertBanner: React.FC<SevereAlertBannerProps> = ({
  alert,
  onDismiss,
  onViewDetails,
  onLocateShelter,
  isMuted,
  onToggleMute,
}) => {
  if (!alert) return null;

  return (
    <aside
      aria-label="Severe Heat Emergency Notification"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl bg-[#1A0A0A] border-2 border-red-500/80 shadow-2xl shadow-red-950/80 overflow-hidden text-white backdrop-blur-md">
        {/* Animated Warning Header Ribbon */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-3.5 py-1.5 flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase text-white shadow-sm">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-white animate-bounce" />
            <span>CRITICAL SEVERE HEAT ALERT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute chime' : 'Mute chime'}
              className="p-1 rounded hover:bg-black/20 text-white transition"
              aria-label="Toggle chime mute"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDismiss}
              title="Dismiss alert banner"
              className="p-1 rounded hover:bg-black/20 text-white transition"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Banner Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>YOUR AREA IS IN SEVERE CONDITION</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                {alert.placeName}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Risk Score</span>
              <span className="text-xl font-mono font-black text-red-400">
                {alert.riskScore.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-red-300/80 block">/ 100 • SEVERE</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-900/50">
              <span className="text-[10px] font-mono text-red-300 block uppercase">Peak Feels-Like</span>
              <span className="font-mono text-sm font-bold text-amber-300">
                {alert.apparentTempC.toFixed(1)} °C
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Extreme Thermal Load</span>
            </div>

            <div className="p-2 rounded-xl bg-red-950/40 border border-red-900/50">
              <span className="text-[10px] font-mono text-red-300 block uppercase">Danger Window</span>
              <span className="font-mono text-sm font-bold text-yellow-300">
                {alert.stressHours || '12:00 – 16:30'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Suspend Outdoor Sun</span>
            </div>
          </div>

          {/* Nearest Cooling Shelter Callout */}
          {alert.nearestFacilityName && (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                  Nearest Free Cooling Centre:
                </span>
                <span className="text-white font-medium block truncate max-w-[260px]">
                  {alert.nearestFacilityName}
                </span>
                {alert.nearestFacilityDistanceKm !== undefined && (
                  <span className="text-[10px] text-emerald-300 font-mono">
                    ~{Math.round(alert.nearestFacilityDistanceKm * 1000)} meters away
                  </span>
                )}
              </div>
              {onLocateShelter && (
                <button
                  onClick={onLocateShelter}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition shadow-sm shrink-0"
                >
                  <Compass className="w-3 h-3" />
                  <span>Locate</span>
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onDismiss}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition font-mono"
            >
              Mute &amp; Dismiss
            </button>

            <button
              onClick={onViewDetails}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-red-900/40"
            >
              <span>View Safety Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
