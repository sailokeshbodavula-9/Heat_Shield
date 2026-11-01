/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';
import { DemandForecastResult, DemandModel } from '../types/index.ts';
import {
  ColumnMapping,
  mapDemandRecords,
  parseDemandCSV,
  buildDemandForecast,
  fetchCityGridDemand,
  getCityNationalGridProfile,
} from '../services/demandService.ts';

interface DemandTabProps {
  demandModel: DemandModel | null;
  demandForecast: DemandForecastResult | null;
  onSetDemandData: (model: DemandModel, forecast: DemandForecastResult) => void;
  cityLat: number;
  cityLon: number;
  cityName?: string;
  forecastDays: Array<{ date: string; tmax_c: number }>;
  hourlyApparent: number[];
  theme: 'dark' | 'light';
}

export const DemandTab: React.FC<DemandTabProps> = ({
  demandModel,
  demandForecast,
  onSetDemandData,
  cityLat,
  cityLon,
  cityName = 'Indian City',
  forecastDays,
  hourlyApparent,
  theme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showBacktest, setShowBacktest] = useState(false);
  const [showCustomUpload, setShowCustomUpload] = useState(false);
  const [activeSurge, setActiveSurge] = useState<number>(1.0);

  // Column Mapping State (for optional user custom CSV upload)
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateCol: '',
    demandCol: '',
    hourCol: '',
  });
  const [isMappingActive, setIsMappingActive] = useState(false);

  // Active City Grid-India / CEA National Electrical Profile
  const gridProfile = useMemo(
    () => getCityNationalGridProfile(cityName, cityLat, cityLon),
    [cityName, cityLat, cityLon]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Please upload a CSV or XLSX under 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseDemandCSV(text, file.size);
        setHeaders(parsed.headers);
        setRawRows(parsed.rawRows);

        // Auto-detect common column names
        const dateMatch = parsed.headers.find((h) => /date|day|time/i.test(h)) || parsed.headers[0];
        const demandMatch =
          parsed.headers.find((h) => /demand|load|mw|power|consumption/i.test(h)) || parsed.headers[1];
        const hourMatch = parsed.headers.find((h) => /hour|hr|time_of_day/i.test(h)) || '';

        setMapping({
          dateCol: dateMatch || '',
          demandCol: demandMatch || '',
          hourCol: hourMatch,
        });

        setIsMappingActive(true);
        setShowCustomUpload(false);
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyMapping = async () => {
    if (!mapping.dateCol || !mapping.demandCol) {
      setErrorMsg('Please specify both Date and Demand (MW) columns.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const { records, skippedRows } = mapDemandRecords(rawRows, mapping);
      if (skippedRows > 0) {
        console.warn(`${skippedRows} rows skipped (invalid date or demand).`);
      }

      const { model, forecast } = await buildDemandForecast(
        records,
        cityLat,
        cityLon,
        forecastDays,
        hourlyApparent
      );

      onSetDemandData(model, forecast);
      setIsMappingActive(false);
    } catch (err: any) {
      if (err.code === 'DEMAND_TOO_FEW_DAYS' || err.message.includes('Need at least 90 days')) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(`Failed to process demand model: ${err.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Sync city electrical demand automatically from Grid-India & CEA benchmarks
  const handleSyncNationalGrid = async (surgeMultiplier: number = 1.0) => {
    setIsUploading(true);
    setErrorMsg(null);
    setActiveSurge(surgeMultiplier);
    try {
      const { model, forecast } = await fetchCityGridDemand(
        cityName,
        cityLat,
        cityLon,
        forecastDays,
        hourlyApparent,
        surgeMultiplier
      );
      onSetDemandData(model, forecast);
      setShowCustomUpload(false);
    } catch (err: any) {
      setErrorMsg(`Failed to fetch national grid demand: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Backtest chart data
  const backtestChartData =
    demandModel?.testDates?.map((date, idx) => ({
      date: date.slice(5),
      actual: demandModel.testActual?.[idx] ?? 0,
      predicted: demandModel.testPredicted?.[idx] ?? 0,
    })) || [];

  return (
    <div className="p-4 space-y-4">
      {/* Permanent Note */}
      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs flex items-center justify-between font-mono">
        <span className="text-amber-400 font-semibold">City/regional electrical demand, not ward level.</span>
        <span className="text-[10px] text-slate-400">Grid-India / Central Electricity Authority</span>
      </div>

      {/* National Grid Profile Bar for Active City */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-slate-900/40 border border-blue-900/40 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              {gridProfile.regionCode} Regional Grid
            </span>
            <span className="font-bold text-xs text-slate-200">
              {gridProfile.rldcAuthority}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Auto-Synchronized for {cityName}
          </span>
        </div>

        <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-slate-400">
            Normative Scale: <strong className="text-slate-200">{gridProfile.ceaCategory}</strong>
          </span>
          <span className="text-slate-400">
            Base Load: <strong className="text-slate-200">{gridProfile.baseLoadMw} MW</strong>
          </span>
          <span className="text-slate-400">
            Cooling Sensitivity: <strong className="text-slate-200">+{gridProfile.coolingElasticityMwPerC} MW/°C</strong>
          </span>
        </div>
      </div>

      {/* Official National Data Portals Bar */}
      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs space-y-2">
        <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Official Public Portals for Indian National &amp; Regional Electricity Data:</span>
          <span className="text-blue-400">Government Open Access</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://grid-india.in"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <span>Grid-India National Grid Reports (grid-india.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://cea.nic.in"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <span>Central Electricity Authority (cea.nic.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://data.gov.in"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <span>National Open Government Data (data.gov.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSyncNationalGrid(1.0)}
            disabled={isUploading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              activeSurge === 1.0
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Auto-fetch and calibrate against Grid-India & CEA national power load archives"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
            <span>Auto-Sync National Grid</span>
          </button>

          <button
            onClick={() => handleSyncNationalGrid(1.15)}
            disabled={isUploading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              activeSurge === 1.15
                ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Simulate heatwave non-linear cooling surge (+15% compressor saturation)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Heatwave Surge (+15%)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomUpload(!showCustomUpload)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
            title="Upload custom utility CSV (DISCOM / State Transmission data)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom Utility CSV</span>
          </button>
        </div>
      </div>

      {/* Optional Upload Dropzone (only if toggled by user) */}
      {showCustomUpload && !isMappingActive && (
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center space-y-3 bg-slate-900/50">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-200">
              Upload Custom DISCOM / Utility Electricity Demand File
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Optional: If you have official proprietary SCADA logs for {cityName}, upload a CSV or XLSX (up to 10 MB). Requires ≥90 matched days.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Select CSV / XLSX File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.txt"
              className="hidden"
            />
            <button
              onClick={() => setShowCustomUpload(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Column Mapping Step (F8) */}
      {isMappingActive && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Map Columns in Uploaded File
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              {rawRows.length} total rows detected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Date Column (Required)
              </label>
              <select
                value={mapping.dateCol}
                onChange={(e) => setMapping({ ...mapping, dateCol: e.target.value })}
                className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Demand MW Column (Required)
              </label>
              <select
                value={mapping.demandCol}
                onChange={(e) => setMapping({ ...mapping, demandCol: e.target.value })}
                className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Hour of Day (Optional)
              </label>
              <select
                value={mapping.hourCol || ''}
                onChange={(e) => setMapping({ ...mapping, hourCol: e.target.value })}
                className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="">None (Daily Total/Peak)</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsMappingActive(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyMapping}
              disabled={isUploading}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              {isUploading ? 'Fitting Model...' : 'Train Model & Forecast'}
            </button>
          </div>
        </div>
      )}

      {/* Model Fitted View: Forecast & Backtest Charts */}
      {demandModel && demandForecast && (
        <div className="space-y-4">
          {/* Top Model Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Test Set R²
              </span>
              <span className="font-mono text-base font-bold text-emerald-400 mt-0.5 block">
                {demandModel.r2_test}
              </span>
              <span className="text-[9px] text-slate-400">Chronological 20% test</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                MAPE Error
              </span>
              <span className="font-mono text-base font-bold text-blue-400 mt-0.5 block">
                {demandModel.mape_test_pct}%
              </span>
              <span className="text-[9px] text-slate-400">Mean abs percentage</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Forecast Peak
              </span>
              <span className="font-mono text-base font-bold text-yellow-400 mt-0.5 block">
                {demandForecast.peak_mw} MW
              </span>
              <span className="text-[9px] text-slate-400">Day: {demandForecast.peak_day.slice(5)}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Residual σ
              </span>
              <span className="font-mono text-base font-bold text-purple-400 mt-0.5 block">
                ±{demandModel.residual_std_mw} MW
              </span>
              <span className="text-[9px] text-slate-400">95% confidence band</span>
            </div>
          </div>

          {/* Toggle between 7-Day Forecast & Backtest View */}
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBacktest(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  !showBacktest
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7-Day Peak Demand Forecast
              </button>
              <button
                onClick={() => setShowBacktest(true)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  showBacktest
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Historical Backtest
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              Model: P(T) = {demandModel.coefficients[0].toFixed(0)} + {demandModel.coefficients[1].toFixed(1)}·T + {demandModel.coefficients[2].toFixed(3)}·T²
            </span>
          </div>

          {/* Chart Display */}
          <div className="h-64 w-full bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            {!showBacktest ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={demandForecast.dailyForecasts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="#94A3B8" fontSize={10} domain={['auto', 'auto']} unit=" MW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121821', borderColor: '#1F2937', fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="high_mw"
                    stroke="none"
                    fill="#3B82F6"
                    fillOpacity={0.15}
                    name="Upper Bound (+1.96σ)"
                  />
                  <Area
                    type="monotone"
                    dataKey="low_mw"
                    stroke="none"
                    fill="#121821"
                    name="Lower Bound (-1.96σ)"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_mw"
                    stroke="#FBBF24"
                    strokeWidth={3}
                    dot={{ fill: '#FBBF24', r: 4 }}
                    name="Forecast Demand"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backtestChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} domain={['auto', 'auto']} unit=" MW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121821', borderColor: '#1F2937', fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="National Grid Baseline (Grid-India / CEA)"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Quadratic Model Fit"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Operational Thermal Stress & Load Shift Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs">
              <span className="font-bold text-amber-400 uppercase font-mono block">
                Thermal Stress Window
              </span>
              <p className="font-mono text-base font-bold text-white mt-1">
                {demandForecast.stress_window.start_hour}:00 - {demandForecast.stress_window.end_hour}:00 hrs
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Temperature-driven stress window, derived from diurnal thermal curve and cooling load surge.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs">
              <span className="font-bold text-blue-400 uppercase font-mono block">
                Recommended Load Shift Window
              </span>
              <p className="font-mono text-base font-bold text-white mt-1">
                {demandForecast.shift_window.start_hour}:00 - {demandForecast.shift_window.end_hour}:00 hrs
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Advise municipal &amp; industrial shift of non-essential loads (water pumping, heavy EV fleets).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
