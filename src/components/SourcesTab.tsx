/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, Database, Info, Globe, Shield, BookOpen } from 'lucide-react';
import { SourceId, SourceStatus, SourceStatusType } from '../types/index.ts';

interface SourcesTabProps {
  sources: SourceStatus[];
  onRetrySource: (sourceId: SourceId) => void;
  retryingSourceId: SourceId | null;
  theme: 'dark' | 'light';
}

const STATUS_CHIPS: Record<SourceStatusType, { bg: string; text: string; label: string }> = {
  live: { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400', label: 'Live' },
  failed: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'text-red-400', label: 'Failed' },
  user_uploaded: { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'text-blue-400', label: 'User Uploaded' },
  not_loaded: { bg: 'bg-slate-700/40 text-slate-400 border-slate-700', text: 'text-slate-400', label: 'Awaiting File' },
};

export const SourcesTab: React.FC<SourcesTabProps> = ({
  sources,
  onRetrySource,
  retryingSourceId,
  theme,
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-slate-700/50 pb-2 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-200">Data Feeds, Citations &amp; Standards</h3>
          <p className="text-[11px] text-slate-400">
            Audit transparency for live meteorological feeds, ENSO indices, urban spatial data, and national electrical grid portals (Grid-India &amp; CEA)
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {sources.length} Connected
        </span>
      </div>

      {/* Official Standards & Meteorological Grounding Card */}
      <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2 text-xs">
        <div className="font-semibold text-blue-300 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Normative Scientific Frameworks &amp; Official Portals</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          HeatShield risk thresholds, temperature anomalies, and demand stress windows are grounded in the following official agency frameworks:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <a
            href="https://mausam.imd.gov.in"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">IMD Mausam Portal</span>
              <span className="text-[10px] text-slate-400">Heat Action Plan criteria &amp; warning departures (mausam.imd.gov.in) ↗</span>
            </div>
          </a>

          <a
            href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Globe className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">NOAA CPC ENSO Diagnostic</span>
              <span className="text-[10px] text-slate-400">Niño-3.4 SST Index (+1.2°C) &amp; El Niño advisory bulletins ↗</span>
            </div>
          </a>

          <a
            href="https://wmo.int/topics/el-nino-la-nina"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">WMO Climate Guidelines</span>
              <span className="text-[10px] text-slate-400">Global El Niño / Southern Oscillation urban heat guidance ↗</span>
            </div>
          </a>

          <a
            href="https://data.gov.in"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Database className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">Open Government Data (data.gov.in)</span>
              <span className="text-[10px] text-slate-400">National municipal census &amp; ward spatial catalog ↗</span>
            </div>
          </a>

          <a
            href="https://earthengine.google.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">Google Earth Engine (earthengine.google.com)</span>
              <span className="text-[10px] text-slate-400">Satellite &amp; land surface temperature (MODIS &amp; Landsat TIRS) ↗</span>
            </div>
          </a>

          <a
            href="https://grid-india.in"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Shield className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">Grid-India National Grid (grid-india.in)</span>
              <span className="text-[10px] text-slate-400">NLDC / RLDC national regional power load despatch reports ↗</span>
            </div>
          </a>

          <a
            href="https://cea.nic.in"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-600 transition flex items-start gap-2"
          >
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">Central Electricity Authority (cea.nic.in)</span>
              <span className="text-[10px] text-slate-400">Ministry of Power National Electricity Plan &amp; urban demand norms ↗</span>
            </div>
          </a>
        </div>
      </div>

      {/* Individual Connected Sources List */}
      <div className="space-y-2.5">
        {sources.map((src) => {
          const chip = STATUS_CHIPS[src.status];
          const isRetrying = retryingSourceId === src.source_id;

          return (
            <div
              key={src.source_id}
              className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 transition hover:border-slate-600"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-xs text-white">{src.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${chip.bg}`}
                  >
                    {chip.label}
                  </span>

                  <button
                    onClick={() => onRetrySource(src.source_id)}
                    disabled={isRetrying}
                    aria-label={`Retry ${src.name}`}
                    className="p-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition"
                    title="Retry live fetch bypassing in-memory cache"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Detail message */}
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {src.detail}
              </p>

              {/* Specific Building density note (F16) */}
              {src.source_id === 'osm_buildings' && (
                <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-500" />
                  <span>Building density: OSM count per km², approximate</span>
                </div>
              )}

              {/* Metadata strip: Records, Last fetched, Official documentation URL */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-700/40 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    Records: <strong className="text-slate-200">{src.records !== null ? src.records : '--'}</strong>
                  </span>
                  <span>
                    Last Fetched:{' '}
                    <strong className="text-slate-200">
                      {src.last_fetched ? new Date(src.last_fetched).toLocaleTimeString() : 'Never'}
                    </strong>
                  </span>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                >
                  <span>Official Endpoint</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
